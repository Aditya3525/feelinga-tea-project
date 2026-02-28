import { Router } from 'express';
import { z } from 'zod';
import Product from '../../models/Product.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { logAdminAction } from '../../utils/auditLog.js';
import { cache, TTL } from '../../utils/cache.js';
import { escapeRegex } from '../../utils/sanitize.js';

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

const bulkStockSchema = z.object({
    productIds: z.array(z.string()).min(1),
    stock: z.number().int().min(0),
});

const bulkDeleteSchema = z.object({
    productIds: z.array(z.string()).min(1),
});

// GET /products — List with filters, sort, pagination
router.get('/', async (req, res, next) => {
    try {
        const cacheKey = `products:${JSON.stringify(req.query)}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);

        const { type, mood, caffeine, minPrice, maxPrice,
            sort = '-createdAt', page = 1, limit = 12, q } = req.query;

        const filter: Record<string, any> = {};
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

        const pageNum = Math.max(1, parseInt(String(page)));
        const limitNum = Math.min(50, Math.max(1, parseInt(String(limit))));
        const skip = (pageNum - 1) * limitNum;

        // Sort mapping
        const sortMap: Record<string, any> = {
            'price': { 'prices.100g': 1 },
            '-price': { 'prices.100g': -1 },
            'rating': { rating: -1 },
            'name': { name: 1 },
            'newest': { createdAt: -1 },
            '-createdAt': { createdAt: -1 },
            '-reviewCount': { reviewCount: -1 },
            '-rating': { rating: -1 },
        };
        const sortObj = sortMap[sort as string] || { createdAt: -1 };

        const [products, total] = await Promise.all([
            Product.find(filter).sort(sortObj).skip(skip).limit(limitNum),
            Product.countDocuments(filter),
        ]);

        const response = {
            status: 'success',
            results: products.length,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                total,
            },
            data: products,
        };

        cache.set(cacheKey, response, TTL.PRODUCTS_LIST);
        res.json(response);
    } catch (err) {
        next(err);
    }
});

// GET /products/search?q=green — improved full-text + regex fallback
router.get('/search', async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || String(q).trim().length < 2) {
            throw new AppError('Search query must be at least 2 characters', 400);
        }

        const term = String(q).trim();
        let products: any[];

        // Try full-text search first (better relevance ranking)
        const textResults = await Product.find(
            { $text: { $search: term } },
            { score: { $meta: 'textScore' } },
        )
            .sort({ score: { $meta: 'textScore' } })
            .limit(20);

        if (textResults.length > 0) {
            products = textResults;
        } else {
            // Fallback to regex for partial matches
            const regex = new RegExp(escapeRegex(term), 'i');
            products = await Product.find({
                $or: [
                    { name: regex },
                    { type: regex },
                    { description: regex },
                    { tags: regex },
                ],
            }).limit(20);
        }

        res.json({
            status: 'success',
            results: products.length,
            data: products,
        });
    } catch (err) {
        next(err);
    }
});

// GET /products/autocomplete?q=dar — lightweight suggestions for search overlay
router.get('/autocomplete', async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || String(q).trim().length < 1) {
            return res.json({ status: 'success', data: [] });
        }

        const regex = new RegExp('^' + escapeRegex(String(q).trim()), 'i');
        const suggestions = await Product.find(
            { name: regex },
            { name: 1, slug: 1, type: 1, 'prices.100g': 1, images: { $slice: 1 } },
        ).limit(6).lean();

        res.json({
            status: 'success',
            data: suggestions,
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
        cache.invalidate('products:');
        await logAdminAction({
            actor: req.user!,
            action: 'product.create',
            entityType: 'product',
            entityId: product._id,
            summary: `Created product "${product.name}"`,
            meta: { slug: product.slug, type: product.type },
        });
        res.status(201).json({ status: 'success', data: product });
    } catch (err) {
        next(err);
    }
});

// PATCH /products/bulk-stock (admin only)
router.patch('/bulk-stock', authenticate, authorize('admin'), validate(bulkStockSchema), async (req, res, next) => {
    try {
        const { productIds, stock } = req.body;
        const result = await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: { stock, inStock: stock > 0 } },
        );
        cache.invalidate('products:');
        await logAdminAction({
            actor: req.user!,
            action: 'product.bulk_stock_update',
            entityType: 'product',
            summary: `Bulk updated stock for ${result.modifiedCount} products`,
            meta: { requested: productIds.length, modified: result.modifiedCount, stock },
        });

        res.json({
            status: 'success',
            data: {
                matched: result.matchedCount,
                modified: result.modifiedCount,
                stock,
            },
        });
    } catch (err) {
        next(err);
    }
});

// DELETE /products/bulk (admin only)
router.delete('/bulk', authenticate, authorize('admin'), validate(bulkDeleteSchema), async (req, res, next) => {
    try {
        const { productIds } = req.body;
        const result = await Product.deleteMany({ _id: { $in: productIds } });
        cache.invalidate('products:');
        await logAdminAction({
            actor: req.user!,
            action: 'product.bulk_delete',
            entityType: 'product',
            summary: `Bulk deleted ${result.deletedCount} products`,
            meta: { requested: productIds.length, deleted: result.deletedCount },
        });
        res.json({
            status: 'success',
            data: { deleted: result.deletedCount },
        });
    } catch (err) {
        next(err);
    }
});

// Validation schema for product updates (#7)
const updateProductSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string().min(2).max(100).optional(),
    type: z.enum(['Black Tea', 'Green Tea', 'White Tea', 'Oolong', 'Herbal', 'Herbal Infusion', 'Masala Chai', 'Matcha']).optional(),
    description: z.string().min(10).max(1000).optional(),
    shortDescription: z.string().max(200).optional(),
    prices: z.object({
        '50g': z.number().positive().optional(),
        '100g': z.number().positive().optional(),
        '200g': z.number().positive().optional(),
    }).optional(),
    moods: z.array(z.enum(['energize', 'relax', 'focus', 'detox', 'glow', 'immunity'])).optional(),
    origin: z.string().min(2).optional(),
    caffeine: z.enum(['none', 'low', 'medium', 'high']).optional(),
    tastingNotes: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    stock: z.number().int().min(0).optional(),
    inStock: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
}).strict();

// PATCH /products/:id (admin only) — validated
router.patch('/:id', authenticate, authorize('admin'), validate(updateProductSchema), async (req, res, next) => {
    try {
        // Auto-enable inStock when stock is set above 0
        if (req.body.stock !== undefined && req.body.stock > 0 && req.body.inStock === undefined) {
            req.body.inStock = true;
        }
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!product) throw new AppError('Product not found', 404);
        cache.invalidate('products:');
        await logAdminAction({
            actor: req.user!,
            action: 'product.update',
            entityType: 'product',
            entityId: product._id,
            summary: `Updated product "${product.name}"`,
            meta: { fields: Object.keys(req.body || {}) },
        });
        res.json({ status: 'success', data: product });
    } catch (err) {
        next(err);
    }
});

// DELETE /products/:id (admin only) — soft delete
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true });
        if (!product) throw new AppError('Product not found', 404);
        cache.invalidate('products:');
        await logAdminAction({
            actor: req.user!,
            action: 'product.delete',
            entityType: 'product',
            entityId: product._id,
            summary: `Soft-deleted product "${product.name}"`,
            meta: { slug: product.slug },
        });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

export default router;
