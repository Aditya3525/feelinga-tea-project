import { Router } from 'express';
import { z } from 'zod';
import Cart from '../../models/Cart.js';
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

// GET /cart — Get current cart with populated product details
router.get('/', authenticate, async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user!._id });
        if (!cart || cart.items.length === 0) {
            return res.json({
                status: 'success',
                data: { items: [], subtotal: 0, shipping: 79, itemCount: 0 },
            });
        }

        // Batch-load all products (fix N+1)
        const productIds = cart.items.map(i => i.product);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        const items: any[] = [];
        for (const item of cart.items) {
            const product = productMap.get(item.product.toString());
            if (product) {
                const price = (product.prices as Record<string, number>)?.[item.size] || (product.prices as any)?.['100g'];
                items.push({
                    id: (item as any)._id.toString(),
                    productId: item.product.toString(),
                    name: product.name,
                    type: product.type,
                    size: item.size,
                    qty: item.qty,
                    price,
                    total: price * item.qty,
                    image: product.images?.[0],
                    slug: product.slug,
                    stock: product.stock,
                    inStock: product.inStock,
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
    } catch (err) {
        next(err);
    }
});

// POST /cart/items — Add item (with stock validation)
router.post('/items', authenticate, validate(addItemSchema), async (req, res, next) => {
    try {
        const { productId, size, qty } = req.body;
        const product = await Product.findById(productId);
        if (!product) throw new AppError('Product not found', 404);
        if (!product.inStock) throw new AppError('Product out of stock', 400);

        // Stock validation
        let cart = await Cart.findOne({ user: req.user!._id });
        const existingQty = cart?.items.find(i => i.product.toString() === productId && i.size === size)?.qty || 0;
        if (existingQty + qty > product.stock) {
            throw new AppError(`Only ${product.stock} units available (you have ${existingQty} in cart)`, 400);
        }

        if (!cart) {
            cart = await Cart.create({
                user: req.user!._id,
                items: [{ product: productId, size, qty }],
            });
        } else {
            const existing = cart.items.find(i => i.product.toString() === productId && i.size === size);
            if (existing) {
                existing.qty += qty;
            } else {
                cart.items.push({ product: productId, size, qty } as any);
            }
            await cart.save();
        }

        res.json({ status: 'success', message: 'Item added to cart' });
    } catch (err) {
        next(err);
    }
});

// PATCH /cart/items/:id — Update quantity (with stock validation)
router.patch('/items/:id', authenticate, async (req, res, next) => {
    try {
        const { qty } = req.body;
        if (!qty || qty < 1) throw new AppError('qty must be at least 1', 400);

        const cart = await Cart.findOne({ user: req.user!._id });
        if (!cart) throw new AppError('Cart not found', 404);

        const item = cart.items.find((i: any) => i._id.toString() === req.params.id);
        if (!item) throw new AppError('Cart item not found', 404);

        // Stock validation
        const product = await Product.findById(item.product);
        if (product && qty > product.stock) {
            throw new AppError(`Only ${product.stock} units available`, 400);
        }

        item.qty = qty;
        await cart.save();
        res.json({ status: 'success', message: 'Cart updated' });
    } catch (err) {
        next(err);
    }
});

// DELETE /cart/items/:id — Remove item
router.delete('/items/:id', authenticate, async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user!._id });
        if (!cart) throw new AppError('Cart not found', 404);

        const idx = cart.items.findIndex((i: any) => i._id.toString() === req.params.id);
        if (idx === -1) throw new AppError('Cart item not found', 404);

        cart.items.splice(idx, 1);
        await cart.save();
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

        let cart = await Cart.findOne({ user: req.user!._id });
        if (!cart) {
            cart = new Cart({ user: req.user!._id, items: [] });
        }

        for (const item of items) {
            // Support productId, slug, or name for flexibility
            let product;
            if (item.productId) {
                product = await Product.findById(item.productId);
            } else if (item.slug) {
                product = await Product.findOne({ slug: item.slug });
            } else if (item.name) {
                product = await Product.findOne({ name: item.name });
            }
            if (!product) continue;

            const itemSize = item.size || '100g';
            const existing = cart.items.find(
                i => i.product.toString() === product!._id.toString() && i.size === itemSize,
            );
            if (existing) {
                existing.qty = Math.max(existing.qty, item.qty || 1);
            } else {
                cart.items.push({
                    product: product._id,
                    size: itemSize,
                    qty: item.qty || 1,
                } as any);
            }
        }

        await cart.save();
        res.json({ status: 'success', message: `Synced ${items.length} items` });
    } catch (err) {
        next(err);
    }
});

// DELETE /cart — Clear cart
router.delete('/', authenticate, async (req, res, next) => {
    try {
        await Cart.findOneAndUpdate(
            { user: req.user!._id },
            { $set: { items: [] } },
        );
        res.json({ status: 'success', message: 'Cart cleared' });
    } catch (err) {
        next(err);
    }
});

export default router;
