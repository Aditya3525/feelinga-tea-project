import { Request, Response, NextFunction } from 'express';
import Product from '../../models/Product.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logAdminAction } from '../../utils/auditLog.js';
import { cache, TTL } from '../../utils/cache.js';
import { escapeRegex } from '../../utils/sanitize.js';

// GET /products
export const list = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const normalizedQuery = Object.fromEntries(
            Object.entries(req.query).sort(([a], [b]) => a.localeCompare(b)),
        );
        const cacheKey = `products:${JSON.stringify(normalizedQuery)}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);

        const { type, mood, caffeine, minPrice, maxPrice,
            sort = '-createdAt', page = 1, limit = 12, q,
            isNewArrival, isBestSeller } = req.query;

        const filter: Record<string, any> = {};
        if (type) filter.type = type;
        if (mood) filter.moods = { $in: Array.isArray(mood) ? mood : [mood] };
        if (caffeine) filter.caffeine = caffeine;
        if (minPrice || maxPrice) {
            filter['prices.100g'] = {};
            if (minPrice) filter['prices.100g'].$gte = Number(minPrice);
            if (maxPrice) filter['prices.100g'].$lte = Number(maxPrice);
        }
        if (isNewArrival === 'true') filter.isNewArrival = true;
        if (isBestSeller === 'true') filter.isBestSeller = true;

        const { origin } = req.query;
        if (origin) {
            filter.origin = new RegExp(escapeRegex(String(origin)), 'i');
        }

        if (q) {
            filter.$text = { $search: q };
        }

        const pageNum = Math.max(1, parseInt(String(page)));
        const limitNum = Math.min(50, Math.max(1, parseInt(String(limit))));
        const skip = (pageNum - 1) * limitNum;

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
            pagination: { page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum), total },
            data: products,
        };

        cache.set(cacheKey, response, TTL.PRODUCTS_LIST);
        res.json(response);
    } catch (err) {
        next(err);
    }
};

// GET /products/search
export const search = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q } = req.query;
        if (!q || String(q).trim().length < 2) {
            throw new AppError('Search query must be at least 2 characters', 400);
        }

        const term = String(q).trim();
        let products: any[];

        const textResults = await Product.find(
            { $text: { $search: term } },
            { score: { $meta: 'textScore' } },
        ).sort({ score: { $meta: 'textScore' } }).limit(20);

        if (textResults.length > 0) {
            products = textResults;
        } else {
            const regex = new RegExp(escapeRegex(term), 'i');
            products = await Product.find({
                $or: [{ name: regex }, { type: regex }, { description: regex }, { tags: regex }],
            }).limit(20);
        }

        res.json({ status: 'success', results: products.length, data: products });
    } catch (err) {
        next(err);
    }
};

// GET /products/autocomplete
export const autocomplete = async (req: Request, res: Response, next: NextFunction) => {
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

        res.json({ status: 'success', data: suggestions });
    } catch (err) {
        next(err);
    }
};

// GET /products/:slug
export const getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) throw new AppError('Product not found', 404);
        res.json({ status: 'success', data: product });
    } catch (err) {
        next(err);
    }
};

// POST /products (admin)
export const create = async (req: Request, res: Response, next: NextFunction) => {
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
};

// PATCH /products/bulk-stock (admin)
export const bulkStockUpdate = async (req: Request, res: Response, next: NextFunction) => {
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
        res.json({ status: 'success', data: { matched: result.matchedCount, modified: result.modifiedCount, stock } });
    } catch (err) {
        next(err);
    }
};

// DELETE /products/bulk (admin)
export const bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productIds } = req.body;
        const result = await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: { deletedAt: new Date() } },
        );
        cache.invalidate('products:');
        await logAdminAction({
            actor: req.user!,
            action: 'product.bulk_delete',
            entityType: 'product',
            summary: `Bulk soft-deleted ${result.modifiedCount} products`,
            meta: { requested: productIds.length, modified: result.modifiedCount },
        });
        res.json({ status: 'success', data: { deleted: result.modifiedCount, modified: result.modifiedCount } });
    } catch (err) {
        next(err);
    }
};

// PATCH /products/:id (admin)
export const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.body.stock !== undefined && req.body.stock > 0 && req.body.inStock === undefined) {
            req.body.inStock = true;
        }
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
};

// DELETE /products/:id (admin, soft delete)
export const remove = async (req: Request, res: Response, next: NextFunction) => {
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
};
