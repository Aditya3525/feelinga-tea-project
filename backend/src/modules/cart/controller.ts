import { Request, Response, NextFunction } from 'express';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import { AppError } from '../../middleware/errorHandler.js';

// GET /cart
export const get = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cart = await Cart.findOne({ user: req.user!._id });
        if (!cart || cart.items.length === 0) {
            return res.json({ status: 'success', data: { items: [], subtotal: 0, shipping: 79, itemCount: 0 } });
        }

        const productIds = cart.items.map(i => i.product);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        const items: any[] = [];
        for (const item of cart.items) {
            const product = productMap.get(item.product.toString());
            if (product) {
                const price = (product.prices as Record<string, number>)?.[item.size] || (product.prices as any)?.['100g'];
                items.push({
                    id: (item as any)._id.toString(), productId: item.product.toString(),
                    name: product.name, type: product.type, size: item.size, qty: item.qty,
                    price, total: price * item.qty, image: product.images?.[0],
                    slug: product.slug, stock: product.stock, inStock: product.inStock,
                });
            }
        }

        const subtotal = items.reduce((sum, i) => sum + i.total, 0);
        res.json({ status: 'success', data: { items, subtotal, shipping: subtotal >= 999 ? 0 : 79, itemCount: items.reduce((sum, i) => sum + i.qty, 0) } });
    } catch (err) { next(err); }
};

// POST /cart/items
export const addItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId, size, qty } = req.body;
        const product = await Product.findById(productId);
        if (!product) throw new AppError('Product not found', 404);
        if (!product.inStock) throw new AppError('Product out of stock', 400);

        let cart = await Cart.findOne({ user: req.user!._id });
        const existingQty = cart?.items.find(i => i.product.toString() === productId && i.size === size)?.qty || 0;
        if (existingQty + qty > product.stock) {
            throw new AppError(`Only ${product.stock} units available (you have ${existingQty} in cart)`, 400);
        }

        if (!cart) {
            cart = await Cart.create({ user: req.user!._id, items: [{ product: productId, size, qty }] });
        } else {
            const existing = cart.items.find(i => i.product.toString() === productId && i.size === size);
            if (existing) { existing.qty += qty; } else { cart.items.push({ product: productId, size, qty } as any); }
            await cart.save();
        }
        res.json({ status: 'success', message: 'Item added to cart' });
    } catch (err) { next(err); }
};

// PATCH /cart/items/:id
export const updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { qty } = req.body;
        if (!qty || qty < 1) throw new AppError('qty must be at least 1', 400);

        const cart = await Cart.findOne({ user: req.user!._id });
        if (!cart) throw new AppError('Cart not found', 404);

        const item = cart.items.find((i: any) => i._id.toString() === req.params.id);
        if (!item) throw new AppError('Cart item not found', 404);

        const product = await Product.findById(item.product);
        if (product && qty > product.stock) throw new AppError(`Only ${product.stock} units available`, 400);

        item.qty = qty;
        await cart.save();
        res.json({ status: 'success', message: 'Cart updated' });
    } catch (err) { next(err); }
};

// DELETE /cart/items/:id
export const removeItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cart = await Cart.findOne({ user: req.user!._id });
        if (!cart) throw new AppError('Cart not found', 404);

        const idx = cart.items.findIndex((i: any) => i._id.toString() === req.params.id);
        if (idx === -1) throw new AppError('Cart item not found', 404);

        cart.items.splice(idx, 1);
        await cart.save();
        res.json({ status: 'success', message: 'Item removed' });
    } catch (err) { next(err); }
};

// POST /cart/sync
export const sync = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) throw new AppError('items must be an array', 400);

        let cart = await Cart.findOne({ user: req.user!._id });
        if (!cart) cart = new Cart({ user: req.user!._id, items: [] });

        const requestedIds = [...new Set(items.map((item: any) => item.productId).filter(Boolean).map((id: any) => String(id)))];
        const requestedSlugs = [...new Set(items.map((item: any) => item.slug).filter(Boolean).map((slug: any) => String(slug)))];

        const query: Record<string, any>[] = [];
        if (requestedIds.length > 0) query.push({ _id: { $in: requestedIds } });
        if (requestedSlugs.length > 0) query.push({ slug: { $in: requestedSlugs } });

        const products = query.length > 0 ? await Product.find({ $or: query }) : [];
        const productsById = new Map(products.map(product => [product._id.toString(), product]));
        const productsBySlug = new Map(products.map(product => [product.slug, product]));

        for (const item of items) {
            let product;
            if (item.productId) product = productsById.get(String(item.productId));
            if (!product && item.slug) product = productsBySlug.get(String(item.slug));
            if (!product) continue;

            const itemSize = item.size || '100g';
            const existing = cart.items.find(i => i.product.toString() === product!._id.toString() && i.size === itemSize);
            if (existing) { existing.qty = Math.max(existing.qty, item.qty || 1); }
            else { cart.items.push({ product: product._id, size: itemSize, qty: item.qty || 1 } as any); }
        }

        await cart.save();
        res.json({ status: 'success', message: `Synced ${items.length} items` });
    } catch (err) { next(err); }
};

// DELETE /cart
export const clear = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await Cart.findOneAndUpdate({ user: req.user!._id }, { $set: { items: [] } });
        res.json({ status: 'success', message: 'Cart cleared' });
    } catch (err) { next(err); }
};
