import { Router } from 'express';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import AuditLog from '../../models/AuditLog.js';

const router = Router();

// GET /admin/dashboard
router.get('/dashboard', async (_req, res, next) => {
    try {
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

        res.json({
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
        });
    } catch (err) {
        next(err);
    }
});

// GET /admin/activity
router.get('/activity', async (req, res, next) => {
    try {
        const pageNum = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
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

export default router;
