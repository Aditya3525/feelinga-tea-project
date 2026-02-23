import { Router } from 'express';
import { z } from 'zod';
import Product from '../../models/Product.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

// Product creation schema (admin)
const createProductSchema = z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(100),
    type: z.enum(['Black Tea', 'Green Tea', 'White Tea', 'Oolong', 'Herbal', 'Herbal Infusion', 'Masala Chai', 'Matcha']),
    description: z.string().min(10).max(1000),
    shortDescription: z.string().max(200).optional(),
    prices: z.object({
        '50g': z.number().positive().optional(),
        '100g': z.number().positive(),
        '200g': z.number().positive().optional(),
    }),
    moods: z.array(z.enum(['energize', 'relax', 'focus', 'detox', 'glow', 'immunity'])).optional(),
    origin: z.string().min(2),
    caffeine: z.enum(['none', 'low', 'medium', 'high']).optional(),
    tastingNotes: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
});

// GET /products — List with filters, sort, pagination
router.get('/', async (req, res, next) => {
    try {
        const { type, mood, caffeine, minPrice, maxPrice,
            sort = '-createdAt', page = 1, limit = 12, q } = req.query;

        const filter = {};
        if (type) filter.type = type;
        if (mood) filter.moods = { $in: Array.isArray(mood) ? mood : [mood] };
        if (caffeine) filter.caffeine = caffeine;
        if (minPrice || maxPrice) {
            filter['prices.100g'] = {};
            if (minPrice) filter['prices.100g'].$gte = Number(minPrice);
            if (maxPrice) filter['prices.100g'].$lte = Number(maxPrice);
        }

        // Full-text search
        if (q) {
            filter.$text = { $search: q };
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Sort mapping
        const sortMap = {
            'price': { 'prices.100g': 1 },
            '-price': { 'prices.100g': -1 },
            'rating': { rating: -1 },
            'name': { name: 1 },
            'newest': { createdAt: -1 },
            '-createdAt': { createdAt: -1 },
        };
        const sortObj = sortMap[sort] || { createdAt: -1 };

        const [products, total] = await Promise.all([
            Product.find(filter).sort(sortObj).skip(skip).limit(limitNum),
            Product.countDocuments(filter),
        ]);

        res.json({
            status: 'success',
            results: products.length,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                total,
            },
            data: products,
        });
    } catch (err) {
        next(err);
    }
});

// GET /products/search?q=green
router.get('/search', async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            throw new AppError('Search query must be at least 2 characters', 400);
        }

        const regex = new RegExp(q.trim(), 'i');
        const products = await Product.find({
            $or: [
                { name: regex },
                { type: regex },
                { description: regex },
                { tags: regex },
            ],
        }).limit(20);

        res.json({
            status: 'success',
            results: products.length,
            data: products,
        });
    } catch (err) {
        next(err);
    }
});

// GET /products/:slug
router.get('/:slug', async (req, res, next) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        res.json({ status: 'success', data: product });
    } catch (err) {
        next(err);
    }
});

// POST /products (admin only)
router.post('/', authenticate, authorize('admin'), validate(createProductSchema), async (req, res, next) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({ status: 'success', data: product });
    } catch (err) {
        next(err);
    }
});

// PATCH /products/:id (admin only)
router.patch('/:id', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!product) throw new AppError('Product not found', 404);
        res.json({ status: 'success', data: product });
    } catch (err) {
        next(err);
    }
});

// DELETE /products/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) throw new AppError('Product not found', 404);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

export default router;
