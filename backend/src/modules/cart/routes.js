import { Router } from 'express';
import { z } from 'zod';
import Product from '../../models/Product.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const addItemSchema = z.object({
    productId: z.string(),
    size: z.string().default('100g'),
    qty: z.number().int().positive().default(1),
});

// Server-side cart is stored per-user in memory for simplicity
// In production, this would be in Redis or MongoDB
const carts = new Map();

function getUserCart(userId) {
    if (!carts.has(userId)) carts.set(userId, []);
    return carts.get(userId);
}

// GET /cart — Get current cart
router.get('/', authenticate, async (req, res) => {
    const cart = getUserCart(req.user._id.toString());

    // Populate product details
    const items = [];
    for (const item of cart) {
        const product = await Product.findById(item.productId);
        if (product) {
            const price = product.prices[item.size] || product.prices['100g'];
            items.push({
                id: item.id,
                productId: item.productId,
                name: product.name,
                type: product.type,
                size: item.size,
                qty: item.qty,
                price,
                total: price * item.qty,
                image: product.images?.[0],
                slug: product.slug,
            });
        }
    }

    const subtotal = items.reduce((sum, i) => sum + i.total, 0);

    res.json({
        status: 'success',
        data: {
            items,
            subtotal,
            shipping: subtotal >= 999 ? 0 : 79,
            itemCount: items.reduce((sum, i) => sum + i.qty, 0),
        },
    });
});

// POST /cart/items — Add item
router.post('/items', authenticate, validate(addItemSchema), async (req, res, next) => {
    try {
        const { productId, size, qty } = req.body;
        const product = await Product.findById(productId);
        if (!product) throw new AppError('Product not found', 404);
        if (!product.inStock) throw new AppError('Product out of stock', 400);

        const cart = getUserCart(req.user._id.toString());
        const existing = cart.find(i => i.productId === productId && i.size === size);

        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({ id: Date.now().toString(36), productId, size, qty });
        }

        res.json({ status: 'success', message: 'Item added to cart' });
    } catch (err) {
        next(err);
    }
});

// PATCH /cart/items/:id — Update quantity
router.patch('/items/:id', authenticate, (req, res, next) => {
    try {
        const { qty } = req.body;
        if (!qty || qty < 1) throw new AppError('qty must be at least 1', 400);

        const cart = getUserCart(req.user._id.toString());
        const item = cart.find(i => i.id === req.params.id);
        if (!item) throw new AppError('Cart item not found', 404);

        item.qty = qty;
        res.json({ status: 'success', message: 'Cart updated' });
    } catch (err) {
        next(err);
    }
});

// DELETE /cart/items/:id — Remove item
router.delete('/items/:id', authenticate, (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const cart = getUserCart(userId);
        const idx = cart.findIndex(i => i.id === req.params.id);
        if (idx === -1) throw new AppError('Cart item not found', 404);

        cart.splice(idx, 1);
        res.json({ status: 'success', message: 'Item removed' });
    } catch (err) {
        next(err);
    }
});

// POST /cart/sync — Sync localStorage cart to server on login
router.post('/sync', authenticate, async (req, res, next) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) throw new AppError('items must be an array', 400);

        const userId = req.user._id.toString();
        const cart = getUserCart(userId);

        for (const item of items) {
            const product = await Product.findOne({ name: item.name });
            if (!product) continue;

            const existing = cart.find(i => i.productId === product._id.toString());
            if (existing) {
                existing.qty = Math.max(existing.qty, item.qty || 1);
            } else {
                cart.push({
                    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
                    productId: product._id.toString(),
                    size: '100g',
                    qty: item.qty || 1,
                });
            }
        }

        res.json({ status: 'success', message: `Synced ${items.length} items` });
    } catch (err) {
        next(err);
    }
});

// DELETE /cart — Clear cart
router.delete('/', authenticate, (req, res) => {
    carts.delete(req.user._id.toString());
    res.json({ status: 'success', message: 'Cart cleared' });
});

export default router;
