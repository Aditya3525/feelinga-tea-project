import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import Coupon from '../../models/Coupon.js';
import Cart from '../../models/Cart.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { logAdminAction } from '../../utils/auditLog.js';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '../../utils/email.js';

const router = Router();

const createOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        size: z.string().default('100g'),
        qty: z.number().int().positive(),
    })).min(1),
    shippingAddress: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        line1: z.string().min(1),
        line2: z.string().optional(),
        city: z.string().min(1),
        state: z.string().min(1),
        pincode: z.string().min(5).max(6),
        phone: z.string().min(10),
    }),
    paymentMethod: z.enum(['card', 'upi', 'cod']),
    couponCode: z.string().optional(),
    notes: z.string().max(500).optional(),
});

const bulkStatusSchema = z.object({
    orderIds: z.array(z.string()).min(1),
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

// POST /orders — Create order (atomic stock decrement + coupon support)
router.post('/', authenticate, validate(createOrderSchema), async (req, res, next) => {
    try {
        const { items, shippingAddress, paymentMethod, couponCode, notes } = req.body;

        // Resolve products and calculate prices
        const orderItems = [];
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
            if (!product.inStock) throw new AppError(`${product.name} is out of stock`, 400);

            const price = (product.prices as Record<string, number>)?.[item.size] || (product.prices as any)?.['100g'];
            if (!price) throw new AppError(`Invalid size ${item.size} for ${product.name}`, 400);

            orderItems.push({
                product: product._id,
                name: product.name,
                size: item.size,
                price,
                qty: item.qty,
                image: product.images?.[0],
            });
        }

        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
        const shipping = subtotal >= 999 ? 0 : 79;
        const tax = Math.round(subtotal * 0.05); // 5% GST

        // Coupon validation (#12)
        let discount = 0;
        let appliedCoupon: string | null = null;
        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                active: true,
                validFrom: { $lte: new Date() },
                validTo: { $gte: new Date() },
            });
            if (!coupon) throw new AppError('Invalid or expired coupon code', 400);
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new AppError('Coupon usage limit reached', 400);
            }
            if (subtotal < coupon.minOrderAmount) {
                throw new AppError(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`, 400);
            }
            // Check per-user limit
            if (coupon.perUserLimit) {
                const userUsage = await Order.countDocuments({ user: req.user!._id, couponCode: coupon.code });
                if (userUsage >= coupon.perUserLimit) {
                    throw new AppError('You have already used this coupon', 400);
                }
            }
            if (coupon.discountType === 'percentage') {
                discount = Math.round(subtotal * coupon.discountValue / 100);
                if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
            } else {
                discount = coupon.discountValue;
            }
            appliedCoupon = coupon.code;
        }

        const total = subtotal + shipping + tax - discount;

        // Atomic stock decrement (#2) — ensures stock can't go negative
        for (const item of orderItems) {
            const updated = await Product.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.qty } },
                { $inc: { stock: -item.qty } },
                { new: true },
            );
            if (!updated) {
                // Rollback any decremented stock
                for (const prev of orderItems) {
                    if (prev.product.toString() === item.product.toString()) break;
                    await Product.findByIdAndUpdate(prev.product, { $inc: { stock: prev.qty } });
                }
                throw new AppError(`Insufficient stock for ${item.name}`, 400);
            }
            // Auto-update inStock flag (#3)
            if (updated.stock === 0) {
                await Product.findByIdAndUpdate(updated._id, { inStock: false });
            }
        }

        // Retry order creation in case of duplicate orderNumber (counter drift)
        let order;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                order = await Order.create({
                    user: req.user!._id,
                    items: orderItems,
                    shippingAddress,
                    subtotal,
                    shipping,
                    tax,
                    discount,
                    couponCode: appliedCoupon,
                    total,
                    paymentMethod,
                    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
                    notes,
                });
                break; // success
            } catch (createErr: any) {
                if (createErr.code === 11000 && createErr.keyPattern?.orderNumber) {
                    // Counter out of sync — bump it and retry
                    const highest = await Order.findOne({}, { orderNumber: 1 }).sort({ orderNumber: -1 }).lean();
                    if (highest?.orderNumber) {
                        const m = highest.orderNumber.match(/FLG-(\d+)/);
                        if (m) {
                            const correctSeq = parseInt(m[1]) - 100000;
                            await mongoose.connection.db!.collection('counters').updateOne(
                                { _id: 'orderNumber' as any },
                                { $set: { seq: correctSeq } },
                            );
                        }
                    }
                    continue;
                }
                throw createErr;
            }
        }
        if (!order) throw new AppError('Failed to create order — please try again', 500);

        // Increment coupon usage
        if (appliedCoupon) {
            await Coupon.findOneAndUpdate({ code: appliedCoupon }, { $inc: { usedCount: 1 } });
        }

        // Clear user's cart after order
        await Cart.findOneAndUpdate({ user: req.user!._id }, { $set: { items: [] } });

        // Send order confirmation email (fire-and-forget)
        const orderUser = await User.findById(req.user!._id);
        if (orderUser?.email) {
            sendOrderConfirmationEmail(orderUser.email, order).catch(err => console.error('Email send error:', err.message));
        }

        res.status(201).json({ status: 'success', data: order });
    } catch (err) {
        next(err);
    }
});

// GET /orders — User's orders
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, q } = req.query;
        const pageNum = Math.max(1, Number.parseInt(String(page), 10) || 1);
        const limitNum = Math.min(50, Math.max(1, Number.parseInt(String(limit), 10) || 10));

        const filter: Record<string, any> = req.user!.role === 'admin' ? {} : { user: req.user!._id };
        if (status) {
            filter.status = status;
        }

        const search = typeof q === 'string' ? q.trim() : '';
        if (search) {
            const regex = new RegExp(search, 'i');

            if (req.user!.role === 'admin') {
                const matchingUsers = await User.find(
                    { $or: [{ name: regex }, { email: regex }] },
                    { _id: 1 },
                ).lean();
                const userIds = matchingUsers.map(u => u._id);
                filter.$or = [{ orderNumber: regex }];
                if (userIds.length > 0) {
                    filter.$or.push({ user: { $in: userIds } });
                }
            } else {
                filter.orderNumber = regex;
            }
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate('user', 'name email'),
            Order.countDocuments(filter),
        ]);

        res.json({
            status: 'success',
            results: orders.length,
            pagination: { page: pageNum, totalPages: Math.ceil(total / limitNum), total },
            data: orders,
        });
    } catch (err) {
        next(err);
    }
});

// GET /orders/:id
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product', 'slug images');

        if (!order) throw new AppError('Order not found', 404);
        if (req.user!.role !== 'admin' && order.user.toString() !== req.user!._id.toString()) {
            throw new AppError('Not authorized', 403);
        }

        res.json({ status: 'success', data: order });
    } catch (err) {
        next(err);
    }
});

// PATCH /orders/:id/cancel — Customer cancellation (#10)
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) throw new AppError('Order not found', 404);
        if (order.user.toString() !== req.user!._id.toString()) {
            throw new AppError('Not authorized', 403);
        }
        if (!['pending', 'confirmed'].includes(order.status)) {
            throw new AppError('Order can only be cancelled when pending or confirmed', 400);
        }

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelReason = req.body.reason || 'Customer requested cancellation';
        await order.save();

        // Restore stock and update inStock flag
        for (const item of order.items) {
            const updated = await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.qty },
            }, { new: true });
            if (updated && !updated.inStock && updated.stock > 0) {
                await Product.findByIdAndUpdate(updated._id, { inStock: true });
            }
        }

        res.json({ status: 'success', data: order });
    } catch (err) {
        next(err);
    }
});

// PATCH /orders/bulk-status (admin only)
router.patch('/bulk-status', authenticate, authorize('admin'), validate(bulkStatusSchema), async (req, res, next) => {
    try {
        const { orderIds, status } = req.body;

        // If cancelling, restore stock for orders not already cancelled
        if (status === 'cancelled') {
            const ordersToCancel = await Order.find({
                _id: { $in: orderIds },
                status: { $ne: 'cancelled' },
            });
            for (const order of ordersToCancel) {
                for (const item of order.items) {
                    const updated = await Product.findByIdAndUpdate(item.product, {
                        $inc: { stock: item.qty },
                    }, { new: true });
                    if (updated && !updated.inStock && updated.stock > 0) {
                        await Product.findByIdAndUpdate(updated._id, { inStock: true });
                    }
                }
            }
        }

        const result = await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { status } },
        );
        await logAdminAction({
            actor: req.user!,
            action: 'order.bulk_status_update',
            entityType: 'order',
            summary: `Bulk updated ${result.modifiedCount} orders to "${status}"`,
            meta: { requested: orderIds.length, modified: result.modifiedCount, status },
        });

        res.json({
            status: 'success',
            data: {
                matched: result.matchedCount,
                modified: result.modifiedCount,
                status,
            },
        });
    } catch (err) {
        next(err);
    }
});

// PATCH /orders/:id/status (admin only)
router.patch('/:id/status', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        }

        const order = await Order.findById(req.params.id);
        if (!order) throw new AppError('Order not found', 404);

        const previousStatus = order.status;
        order.status = status;
        await order.save();

        // Restore stock when cancelling an order that wasn't already cancelled
        if (status === 'cancelled' && previousStatus !== 'cancelled') {
            order.cancelledAt = new Date();
            await order.save();
            for (const item of order.items) {
                const updated = await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.qty },
                }, { new: true });
                if (updated && !updated.inStock && updated.stock > 0) {
                    await Product.findByIdAndUpdate(updated._id, { inStock: true });
                }
            }
        }

        await logAdminAction({
            actor: req.user!,
            action: 'order.status_update',
            entityType: 'order',
            entityId: order._id,
            summary: `Updated ${order.orderNumber} from "${previousStatus}" to "${status}"`,
            meta: { orderNumber: order.orderNumber, previousStatus, status },
        });

        // Send status update email (fire-and-forget)
        const statusUser = await User.findById(order.user);
        if (statusUser?.email) {
            sendOrderStatusEmail(statusUser.email, order, status).catch(err => console.error('Email send error:', err.message));
        }

        res.json({ status: 'success', data: order });
    } catch (err) {
        next(err);
    }
});

export default router;
