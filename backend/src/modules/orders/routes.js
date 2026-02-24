import { Router } from 'express';
import { z } from 'zod';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { logAdminAction } from '../../utils/auditLog.js';

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
    notes: z.string().max(500).optional(),
});

const bulkStatusSchema = z.object({
    orderIds: z.array(z.string()).min(1),
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

// POST /orders — Create order
router.post('/', authenticate, validate(createOrderSchema), async (req, res, next) => {
    try {
        const { items, shippingAddress, paymentMethod, notes } = req.body;

        // Resolve products and calculate prices
        const orderItems = [];
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
            if (!product.inStock) throw new AppError(`${product.name} is out of stock`, 400);

            const price = product.prices[item.size] || product.prices['100g'];
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
        const total = subtotal + shipping + tax;

        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            subtotal,
            shipping,
            tax,
            total,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            notes,
        });

        // Decrease stock
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.qty },
            });
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
        const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));

        const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
        if (status) {
            filter.status = status;
        }

        const search = typeof q === 'string' ? q.trim() : '';
        if (search) {
            const regex = new RegExp(search, 'i');

            if (req.user.role === 'admin') {
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
        if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
            throw new AppError('Not authorized', 403);
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

        const result = await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { status } },
        );
        await logAdminAction({
            actor: req.user,
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

        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) throw new AppError('Order not found', 404);
        await logAdminAction({
            actor: req.user,
            action: 'order.status_update',
            entityType: 'order',
            entityId: order._id,
            summary: `Updated ${order.orderNumber} to "${status}"`,
            meta: { orderNumber: order.orderNumber, status },
        });

        res.json({ status: 'success', data: order });
    } catch (err) {
        next(err);
    }
});

export default router;
