import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import Coupon from '../../models/Coupon.js';
import Cart from '../../models/Cart.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logAdminAction } from '../../utils/auditLog.js';
import { escapeRegex } from '../../utils/sanitize.js';
import { sendOrderConfirmationEmail, sendOrderStatusEmail, sendLowStockAlert } from '../../utils/email.js';

// POST /orders
export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { items, shippingAddress, paymentMethod, couponCode, notes } = req.body;

        const orderItems = [];
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
            if (!product.inStock) throw new AppError(`${product.name} is out of stock`, 400);
            const price = (product.prices as Record<string, number>)?.[item.size] || (product.prices as any)?.['100g'];
            if (!price) throw new AppError(`Invalid size ${item.size} for ${product.name}`, 400);
            orderItems.push({ product: product._id, name: product.name, size: item.size, price, qty: item.qty, image: product.images?.[0] });
        }

        const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
        const shipping = subtotal >= 999 ? 0 : 79;
        const tax = Math.round(subtotal * 0.05);

        let discount = 0;
        let appliedCoupon: string | null = null;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true, validFrom: { $lte: new Date() }, validTo: { $gte: new Date() } });
            if (!coupon) throw new AppError('Invalid or expired coupon code', 400);
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new AppError('Coupon usage limit reached', 400);
            if (subtotal < coupon.minOrderAmount) throw new AppError(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`, 400);
            if (coupon.perUserLimit) {
                const userUsage = await Order.countDocuments({ user: req.user!._id, couponCode: coupon.code });
                if (userUsage >= coupon.perUserLimit) throw new AppError('You have already used this coupon', 400);
            }
            if (coupon.discountType === 'percentage') {
                discount = Math.round(subtotal * coupon.discountValue / 100);
                if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
            } else { discount = coupon.discountValue; }
            appliedCoupon = coupon.code;
        }

        const total = subtotal + shipping + tax - discount;

        // Atomic stock decrement with rollback
        for (const item of orderItems) {
            const updated = await Product.findOneAndUpdate({ _id: item.product, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } }, { new: true });
            if (!updated) {
                for (const prev of orderItems) {
                    if (prev.product.toString() === item.product.toString()) break;
                    await Product.findByIdAndUpdate(prev.product, { $inc: { stock: prev.qty } });
                }
                throw new AppError(`Insufficient stock for ${item.name}`, 400);
            }
            if (updated.stock === 0) await Product.findByIdAndUpdate(updated._id, { inStock: false });
        }

        // Low stock alert
        const lowStockProducts = await Product.find({ stock: { $lte: 10 }, deletedAt: null }, { name: 1, slug: 1, stock: 1 }).lean();
        const adminEmail = process.env.ADMIN_EMAIL;
        if (lowStockProducts.length > 0 && adminEmail) sendLowStockAlert(adminEmail, lowStockProducts as any).catch(() => {});

        // Retry on duplicate orderNumber
        let order;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                order = await Order.create({ user: req.user!._id, items: orderItems, shippingAddress, subtotal, shipping, tax, discount, couponCode: appliedCoupon, total, paymentMethod, paymentStatus: 'pending', notes });
                break;
            } catch (createErr: any) {
                if (createErr.code === 11000 && createErr.keyPattern?.orderNumber) {
                    const highest = await Order.findOne({}, { orderNumber: 1 }).sort({ orderNumber: -1 }).lean();
                    if (highest?.orderNumber) {
                        const m = highest.orderNumber.match(/FLG-(\d+)/);
                        if (m) await mongoose.connection.db!.collection('counters').updateOne({ _id: 'orderNumber' as any }, { $set: { seq: parseInt(m[1]) - 100000 } });
                    }
                    continue;
                }
                throw createErr;
            }
        }
        if (!order) throw new AppError('Failed to create order — please try again', 500);

        if (appliedCoupon) await Coupon.findOneAndUpdate({ code: appliedCoupon }, { $inc: { usedCount: 1 } });
        await Cart.findOneAndUpdate({ user: req.user!._id }, { $set: { items: [] } });

        const orderUser = await User.findById(req.user!._id);
        if (orderUser?.email) sendOrderConfirmationEmail(orderUser.email, order).catch(err => console.error('Email send error:', err.message));

        res.status(201).json({ status: 'success', data: order });
    } catch (err) { next(err); }
};

// GET /orders
export const list = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10, status, q } = req.query;
        const pageNum = Math.max(1, Number.parseInt(String(page), 10) || 1);
        const limitNum = Math.min(50, Math.max(1, Number.parseInt(String(limit), 10) || 10));

        const filter: Record<string, any> = req.user!.role === 'admin' ? {} : { user: req.user!._id };
        if (status) filter.status = status;

        const search = typeof q === 'string' ? q.trim() : '';
        if (search) {
            const regex = new RegExp(escapeRegex(search), 'i');
            if (req.user!.role === 'admin') {
                const matchingUsers = await User.find({ $or: [{ name: regex }, { email: regex }] }, { _id: 1 }).lean();
                filter.$or = [{ orderNumber: regex }];
                if (matchingUsers.length > 0) filter.$or.push({ user: { $in: matchingUsers.map(u => u._id) } });
            } else { filter.orderNumber = regex; }
        }

        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).populate('user', 'name email'),
            Order.countDocuments(filter),
        ]);

        res.json({ status: 'success', results: orders.length, pagination: { page: pageNum, totalPages: Math.ceil(total / limitNum), total }, data: orders });
    } catch (err) { next(err); }
};

// GET /orders/:id
export const getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product', 'slug images');
        if (!order) throw new AppError('Order not found', 404);
        if (req.user!.role !== 'admin' && order.user.toString() !== req.user!._id.toString()) throw new AppError('Not authorized', 403);
        res.json({ status: 'success', data: order });
    } catch (err) { next(err); }
};

// PATCH /orders/:id/cancel
export const cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) throw new AppError('Order not found', 404);
        if (order.user.toString() !== req.user!._id.toString()) throw new AppError('Not authorized', 403);
        if (!['pending', 'confirmed'].includes(order.status)) throw new AppError('Order can only be cancelled when pending or confirmed', 400);

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelReason = req.body.reason || 'Customer requested cancellation';
        await order.save();

        for (const item of order.items) {
            const updated = await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } }, { new: true });
            if (updated && !updated.inStock && updated.stock > 0) await Product.findByIdAndUpdate(updated._id, { inStock: true });
        }

        res.json({ status: 'success', data: order });
    } catch (err) { next(err); }
};

// Helper: restore stock for cancelled orders
const restoreStock = async (order: any) => {
    for (const item of order.items) {
        const updated = await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } }, { new: true });
        if (updated && !updated.inStock && updated.stock > 0) await Product.findByIdAndUpdate(updated._id, { inStock: true });
    }
};

// PATCH /orders/bulk-status (admin)
export const bulkStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderIds, status } = req.body;
        if (status === 'cancelled') {
            const ordersToCancel = await Order.find({ _id: { $in: orderIds }, status: { $ne: 'cancelled' } });
            for (const order of ordersToCancel) await restoreStock(order);
        }
        const result = await Order.updateMany({ _id: { $in: orderIds } }, { $set: { status } });
        await logAdminAction({ actor: req.user!, action: 'order.bulk_status_update', entityType: 'order', summary: `Bulk updated ${result.modifiedCount} orders to "${status}"`, meta: { requested: orderIds.length, modified: result.modifiedCount, status } });
        res.json({ status: 'success', data: { matched: result.matchedCount, modified: result.modifiedCount, status } });
    } catch (err) { next(err); }
};

// PATCH /orders/:id/status (admin)
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);

        const order = await Order.findById(req.params.id);
        if (!order) throw new AppError('Order not found', 404);

        const previousStatus = order.status;
        order.status = status;
        if (status === 'cancelled' && previousStatus !== 'cancelled') { order.cancelledAt = new Date(); await order.save(); await restoreStock(order); }
        else { await order.save(); }

        await logAdminAction({ actor: req.user!, action: 'order.status_update', entityType: 'order', entityId: order._id, summary: `Updated ${order.orderNumber} from "${previousStatus}" to "${status}"`, meta: { orderNumber: order.orderNumber, previousStatus, status } });

        const statusUser = await User.findById(order.user);
        if (statusUser?.email) sendOrderStatusEmail(statusUser.email, order, status).catch(err => console.error('Email send error:', err.message));

        res.json({ status: 'success', data: order });
    } catch (err) { next(err); }
};

// GET /orders/:id/invoice
export const invoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await Order.findById(req.params.id).lean();
        if (!order) throw new AppError('Order not found', 404);
        if (req.user!.role !== 'admin' && order.user.toString() !== req.user!._id.toString()) throw new AppError('You are not authorized to access this invoice', 403);

        const user = await User.findById(order.user, 'name email phone').lean();
        const addr = order.shippingAddress as any;

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a1a').text('Feelinga', 50, 50);
        doc.fontSize(8).font('Helvetica').fillColor('#888').text('happiness is here', 50, 73);
        doc.fontSize(7.5).fillColor('#555').text('Vithubadayaji Industries Private Limited', 50, 86);
        doc.text('At Sulewadi, Post Piliv, Tal. Malshiras, Solapur, Maharashtra \u2013 413310', 50, 97);
        doc.text('Shop Est. No. 2531100320058917 | MSME Registered', 50, 108);
        doc.fillColor('#000');
        doc.fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', 400, 50, { align: 'right' });
        doc.fontSize(10).font('Helvetica').text(`Invoice #: ${order.orderNumber}`, 400, 72, { align: 'right' }).text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 86, { align: 'right' });

        doc.moveTo(50, 110).lineTo(545, 110).stroke('#ddd');

        let y = 125;
        doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, y);
        y += 16;
        doc.fontSize(10).font('Helvetica')
            .text(`${addr?.firstName || ''} ${addr?.lastName || ''}`, 50, y)
            .text([addr?.line1, addr?.line2, addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(', '), 50, y + 14)
            .text(`Phone: ${addr?.phone || 'N/A'}`, 50, y + 28)
            .text(`Email: ${(user as any)?.email || 'N/A'}`, 50, y + 42);

        y = 220;
        doc.moveTo(50, y).lineTo(545, y).stroke('#ddd');
        y += 8;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Item', 50, y, { width: 200 }).text('Size', 260, y, { width: 60 }).text('Qty', 330, y, { width: 40, align: 'center' }).text('Price', 380, y, { width: 70, align: 'right' }).text('Total', 460, y, { width: 85, align: 'right' });
        y += 16;
        doc.moveTo(50, y).lineTo(545, y).stroke('#ddd');
        y += 8;

        doc.font('Helvetica').fontSize(9);
        for (const item of (order.items || []) as any[]) {
            doc.text(item.name, 50, y, { width: 200 }).text(item.size, 260, y, { width: 60 }).text(String(item.qty), 330, y, { width: 40, align: 'center' }).text(`₹${item.price}`, 380, y, { width: 70, align: 'right' }).text(`₹${(item.price * item.qty).toLocaleString('en-IN')}`, 460, y, { width: 85, align: 'right' });
            y += 18;
        }

        y += 8;
        doc.moveTo(350, y).lineTo(545, y).stroke('#ddd');
        y += 10;
        doc.text('Subtotal', 380, y).text(`₹${order.subtotal?.toLocaleString('en-IN')}`, 460, y, { width: 85, align: 'right' });
        y += 16;
        doc.text('Shipping', 380, y).text(order.shipping === 0 ? 'FREE' : `₹${order.shipping}`, 460, y, { width: 85, align: 'right' });
        y += 16;
        doc.text('Tax (GST 5%)', 380, y).text(`₹${order.tax}`, 460, y, { width: 85, align: 'right' });
        y += 18;
        doc.moveTo(350, y).lineTo(545, y).stroke('#ddd');
        y += 10;
        doc.font('Helvetica-Bold').fontSize(11).text('Total', 380, y).text(`₹${order.total?.toLocaleString('en-IN')}`, 460, y, { width: 85, align: 'right' });

        y += 30;
        doc.font('Helvetica').fontSize(9).fillColor('#666').text(`Payment: ${order.paymentMethod?.toUpperCase()} · Status: ${order.paymentStatus}`, 50, y);
        doc.fontSize(7.5).fillColor('#aaa').text('Feelinga (Vithubadayaji Industries Pvt. Ltd.) \u00b7 Shop Est. No. 2531100320058917 \u00b7 www.feelinga.in', 50, 770, { align: 'center' });

        doc.end();
    } catch (err) { next(err); }
};
