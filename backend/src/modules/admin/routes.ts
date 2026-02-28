import { Router } from 'express';
import { z } from 'zod';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import AuditLog from '../../models/AuditLog.js';
import Coupon from '../../models/Coupon.js';
import Testimonial from '../../models/Testimonial.js';
import PDFDocument from 'pdfkit';
import { validate } from '../../middleware/validate.js';
import { escapeRegex } from '../../utils/sanitize.js';
import { logAdminAction } from '../../utils/auditLog.js';
import { cache, TTL } from '../../utils/cache.js';

const router = Router();

// ===== VALIDATION SCHEMAS =====
const couponSchema = z.object({
    code: z.string().min(2).max(30),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    minOrderAmount: z.number().min(0).default(0),
    maxDiscount: z.number().min(0).optional(),
    usageLimit: z.number().int().min(0).optional(),
    perUserLimit: z.number().int().min(0).optional(),
    validFrom: z.string().or(z.date()),
    validTo: z.string().or(z.date()),
    active: z.boolean().default(true),
    description: z.string().max(200).optional(),
});

const couponUpdateSchema = couponSchema.partial();

const testimonialSchema = z.object({
    author: z.string().min(1).max(100),
    role: z.string().max(100).optional(),
    text: z.string().min(1).max(2000),
    rating: z.number().int().min(1).max(5).default(5),
    approved: z.boolean().default(false),
    featured: z.boolean().default(false),
    order: z.number().int().min(0).default(0),
});

const testimonialUpdateSchema = testimonialSchema.partial();

const trackingSchema = z.object({
    trackingNumber: z.string().max(100).optional(),
    trackingUrl: z.string().url().max(500).optional().or(z.literal('')),
});

// GET /admin/dashboard
router.get('/dashboard', async (_req, res, next) => {
    try {
        const cached = cache.get('admin:dashboard');
        if (cached) return res.json(cached);

        const [totalUsers, totalProducts, totalOrders, revenueResult, statusAgg, recentOrders, monthlyRevenue, recentActivity] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$total' },
                    },
                },
            ]),
            Order.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
            Order.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('user', 'name email')
                .lean(),
            Order.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        revenue: { $sum: '$total' },
                        orders: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 6 },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
            AuditLog.find()
                .sort({ createdAt: -1 })
                .limit(8)
                .lean(),
        ]);

        const statusBreakdown = statusAgg.reduce((acc, row) => {
            acc[row._id] = row.count;
            return acc;
        }, {});

        const response = {
            status: 'success',
            data: {
                totals: {
                    users: totalUsers,
                    products: totalProducts,
                    orders: totalOrders,
                    revenue: revenueResult[0]?.totalRevenue || 0,
                },
                statusBreakdown,
                recentOrders,
                monthlyRevenue,
                recentActivity,
            },
        };

        cache.set('admin:dashboard', response, TTL.DASHBOARD);
        res.json(response);
    } catch (err) {
        next(err);
    }
});

// GET /admin/activity
router.get('/activity', async (req, res, next) => {
    try {
        const pageNum = Math.max(1, Number.parseInt(String(req.query.page), 10) || 1);
        const limitNum = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit), 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            AuditLog.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            AuditLog.countDocuments(),
        ]);

        res.json({
            status: 'success',
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                total,
            },
            data: items,
        });
    } catch (err) {
        next(err);
    }
});

// ===== USER MANAGEMENT =====

// GET /admin/users — list users with search, filter, pagination
router.get('/users', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, q, role } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));

        const filter: Record<string, any> = {};
        if (role && ['customer', 'admin'].includes(String(role))) filter.role = role;

        const search = typeof q === 'string' ? q.trim() : '';
        if (search) {
            const regex = new RegExp(escapeRegex(search), 'i');
            filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('name email role phone createdAt addresses')
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            User.countDocuments(filter),
        ]);

        // Attach order counts per user
        const userIds = users.map(u => u._id);
        const orderCounts = await Order.aggregate([
            { $match: { user: { $in: userIds } } },
            { $group: { _id: '$user', count: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
        ]);
        const orderMap = new Map(orderCounts.map(o => [o._id.toString(), o]));
        const usersWithStats = users.map(u => ({
            ...u,
            orderCount: orderMap.get(u._id.toString())?.count || 0,
            totalSpent: orderMap.get(u._id.toString())?.totalSpent || 0,
        }));

        res.json({
            status: 'success',
            pagination: { page: pageNum, totalPages: Math.ceil(total / limitNum), total },
            data: usersWithStats,
        });
    } catch (err) {
        next(err);
    }
});

// GET /admin/users/:id — single user details + orders
router.get('/users/:id', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('name email role phone createdAt addresses wishlist').lean();
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(20).lean();
        res.json({ status: 'success', data: { ...user, orders } });
    } catch (err) {
        next(err);
    }
});

// Primary admin email — this account can never be demoted
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'kailasmane777@gmail.com').toLowerCase();

// PATCH /admin/users/:id/role — change user role (any admin can promote/demote, but primary admin is protected)
router.patch('/users/:id/role', async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!['customer', 'admin'].includes(role)) {
            return res.status(400).json({ status: 'error', message: 'Role must be customer or admin' });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ status: 'error', message: 'User not found' });

        // Prevent demoting the primary admin
        if (role === 'customer' && targetUser.email.toLowerCase() === ADMIN_EMAIL) {
            return res.status(400).json({ status: 'error', message: 'Cannot demote the primary admin account' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('name email role');
        res.json({ status: 'success', data: user });
    } catch (err) {
        next(err);
    }
});

// ===== LOW STOCK ALERTS =====

// GET /admin/low-stock — products with stock below threshold
router.get('/low-stock', async (req, res, next) => {
    try {
        const threshold = parseInt(String(req.query.threshold), 10) || 10;
        const products = await Product.find({ stock: { $lte: threshold } })
            .select('name slug stock type images prices')
            .sort({ stock: 1 })
            .lean();
        res.json({ status: 'success', data: products, count: products.length, threshold });
    } catch (err) {
        next(err);
    }
});

// ===== DATA EXPORT (CSV) =====

// GET /admin/export/orders — CSV download
router.get('/export/orders', async (req, res, next) => {
    try {
        await logAdminAction({
            actor: (req as any).user,
            action: 'export.orders',
            entityType: 'order',
            summary: 'Exported orders CSV',
            meta: { filters: { status: req.query.status, from: req.query.from, to: req.query.to } },
        });
        const { status, from, to } = req.query;
        const filter: Record<string, any> = {};
        if (status) filter.status = status;
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(String(from));
            if (to) filter.createdAt.$lte = new Date(String(to));
        }

        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        const header = 'Order Number,Date,Customer,Email,Items,Subtotal,Shipping,Tax,Total,Status,Payment Method,Payment Status\n';
        const rows = orders.map(o => {
            const u = o.user as any;
            const items = (o.items || []).map((i: any) => `${i.name}(${i.size}x${i.qty})`).join('; ');
            return [
                o.orderNumber,
                new Date(o.createdAt).toISOString().slice(0, 10),
                `"${u?.name || 'N/A'}"`,
                u?.email || '',
                `"${items}"`,
                o.subtotal,
                o.shipping,
                o.tax,
                o.total,
                o.status,
                o.paymentMethod,
                o.paymentStatus,
            ].join(',');
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
        res.send(header + rows);
    } catch (err) {
        next(err);
    }
});

// GET /admin/export/products — CSV download
router.get('/export/products', async (req, res, next) => {
    try {
        await logAdminAction({
            actor: (req as any).user,
            action: 'export.products',
            entityType: 'product',
            summary: 'Exported products CSV',
        });
        const products = await Product.find().sort({ createdAt: -1 }).lean();

        const header = 'Name,Slug,Type,Origin,Price 50g,Price 100g,Price 200g,Stock,In Stock,Caffeine,Moods,Rating,Review Count,Created\n';
        const rows = products.map(p => [
            `"${p.name}"`,
            p.slug,
            p.type,
            `"${p.origin}"`,
            (p.prices as any)?.['50g'] || '',
            (p.prices as any)?.['100g'] || '',
            (p.prices as any)?.['200g'] || '',
            p.stock,
            p.inStock,
            p.caffeine,
            `"${(p.moods || []).join(', ')}"`,
            p.rating,
            p.reviewCount,
            new Date(p.createdAt).toISOString().slice(0, 10),
        ].join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=products-${Date.now()}.csv`);
        res.send(header + rows);
    } catch (err) {
        next(err);
    }
});

// GET /admin/export/users — CSV download
router.get('/export/users', async (req, res, next) => {
    try {
        await logAdminAction({
            actor: (req as any).user,
            action: 'export.users',
            entityType: 'user',
            summary: 'Exported users CSV (contains PII)',
        });
        const users = await User.find().select('name email role phone createdAt').sort({ createdAt: -1 }).lean();

        const header = 'Name,Email,Role,Phone,Created\n';
        const rows = users.map(u => [
            `"${u.name}"`,
            u.email,
            u.role,
            u.phone || '',
            new Date(u.createdAt).toISOString().slice(0, 10),
        ].join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
        res.send(header + rows);
    } catch (err) {
        next(err);
    }
});

// ===== COUPON MANAGEMENT (#12) =====

// GET /admin/coupons
router.get('/coupons', async (req, res, next) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
        res.json({ status: 'success', data: coupons });
    } catch (err) {
        next(err);
    }
});

// POST /admin/coupons
router.post('/coupons', validate(couponSchema), async (req, res, next) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ status: 'success', data: coupon });
    } catch (err) {
        next(err);
    }
});

// PATCH /admin/coupons/:id
router.patch('/coupons/:id', validate(couponUpdateSchema), async (req, res, next) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!coupon) return res.status(404).json({ status: 'error', message: 'Coupon not found' });
        res.json({ status: 'success', data: coupon });
    } catch (err) {
        next(err);
    }
});

// DELETE /admin/coupons/:id
router.delete('/coupons/:id', async (req, res, next) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// ===== TRACKING NUMBER (#13) =====

// PATCH /admin/orders/:id/tracking
router.patch('/orders/:id/tracking', validate(trackingSchema), async (req, res, next) => {
    try {
        const { trackingNumber, trackingUrl } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { trackingNumber, trackingUrl },
            { new: true },
        );
        if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
        res.json({ status: 'success', data: order });
    } catch (err) {
        next(err);
    }
});

// ===== INVOICE PDF =====

// GET /admin/invoice/:orderId — generate PDF invoice
router.get('/invoice/:orderId', async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('user', 'name email phone').lean();
        if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
        doc.pipe(res);

        const u = order.user as any;
        const addr = order.shippingAddress as any;

        // Header
        doc.fontSize(22).font('Helvetica-Bold').text('Feelinga', 50, 50);
        doc.fontSize(9).font('Helvetica').fillColor('#888').text('happiness is here', 50, 75);
        doc.fillColor('#000');

        // Invoice title
        doc.fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', 400, 50, { align: 'right' });
        doc.fontSize(10).font('Helvetica')
            .text(`Invoice #: ${order.orderNumber}`, 400, 72, { align: 'right' })
            .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 86, { align: 'right' });

        // Separator
        doc.moveTo(50, 110).lineTo(545, 110).stroke('#ddd');

        // Customer info
        let y = 125;
        doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, y);
        y += 16;
        doc.fontSize(10).font('Helvetica')
            .text(`${addr?.firstName || ''} ${addr?.lastName || ''}`, 50, y)
            .text([addr?.line1, addr?.line2, addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(', '), 50, y + 14)
            .text(`Phone: ${addr?.phone || 'N/A'}`, 50, y + 28)
            .text(`Email: ${u?.email || 'N/A'}`, 50, y + 42);

        // Items table
        y = 220;
        doc.moveTo(50, y).lineTo(545, y).stroke('#ddd');
        y += 8;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Item', 50, y, { width: 200 });
        doc.text('Size', 260, y, { width: 60 });
        doc.text('Qty', 330, y, { width: 40, align: 'center' });
        doc.text('Price', 380, y, { width: 70, align: 'right' });
        doc.text('Total', 460, y, { width: 85, align: 'right' });
        y += 16;
        doc.moveTo(50, y).lineTo(545, y).stroke('#ddd');
        y += 8;

        doc.font('Helvetica').fontSize(9);
        for (const item of (order.items || []) as any[]) {
            doc.text(item.name, 50, y, { width: 200 });
            doc.text(item.size, 260, y, { width: 60 });
            doc.text(String(item.qty), 330, y, { width: 40, align: 'center' });
            doc.text(`₹${item.price}`, 380, y, { width: 70, align: 'right' });
            doc.text(`₹${(item.price * item.qty).toLocaleString('en-IN')}`, 460, y, { width: 85, align: 'right' });
            y += 18;
        }

        // Totals
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
        doc.font('Helvetica-Bold').fontSize(11)
            .text('Total', 380, y).text(`₹${order.total?.toLocaleString('en-IN')}`, 460, y, { width: 85, align: 'right' });

        // Payment info
        y += 30;
        doc.font('Helvetica').fontSize(9).fillColor('#666')
            .text(`Payment: ${order.paymentMethod?.toUpperCase()} · Status: ${order.paymentStatus}`, 50, y);

        // Footer
        doc.fontSize(8).fillColor('#aaa').text('Feelinga — happiness is here · www.feelinga.in', 50, 770, { align: 'center' });

        doc.end();
    } catch (err) {
        next(err);
    }
});

// ===== TESTIMONIAL MANAGEMENT =====

// GET /admin/testimonials — all testimonials (including unapproved)
router.get('/testimonials', async (req, res, next) => {
    try {
        const testimonials = await Testimonial.find()
            .sort({ order: 1, createdAt: -1 })
            .lean();
        res.json({ status: 'success', data: testimonials });
    } catch (err) {
        next(err);
    }
});

// POST /admin/testimonials — create testimonial
router.post('/testimonials', validate(testimonialSchema), async (req, res, next) => {
    try {
        const { author, role, text, rating, approved, featured, order } = req.body;
        if (!author || !text) {
            return res.status(400).json({ status: 'error', message: 'Author and text are required' });
        }
        const testimonial = await Testimonial.create({
            author: author.trim(),
            role: role?.trim() || 'Customer',
            text: text.trim(),
            rating: rating || 5,
            approved: approved !== undefined ? approved : false,
            featured: featured || false,
            order: order || 0,
        });
        res.status(201).json({ status: 'success', data: testimonial });
    } catch (err) {
        next(err);
    }
});

// PATCH /admin/testimonials/:id — update testimonial (edit, approve/reject, feature)
router.patch('/testimonials/:id', validate(testimonialUpdateSchema), async (req, res, next) => {
    try {
        const testimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true },
        );
        if (!testimonial) return res.status(404).json({ status: 'error', message: 'Testimonial not found' });
        res.json({ status: 'success', data: testimonial });
    } catch (err) {
        next(err);
    }
});

// DELETE /admin/testimonials/:id
router.delete('/testimonials/:id', async (req, res, next) => {
    try {
        const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
        if (!testimonial) return res.status(404).json({ status: 'error', message: 'Testimonial not found' });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

export default router;
