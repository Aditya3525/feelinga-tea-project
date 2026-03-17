import { Request, Response, NextFunction } from 'express';
import Review from '../../models/Review.js';
import { AppError } from '../../middleware/errorHandler.js';

// GET /reviews?productId=xxx
export const list = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId, page = 1, limit = 10 } = req.query;
        if (!productId) throw new AppError('productId is required', 400);

        const pageNum = Math.max(1, parseInt(String(page)));
        const limitNum = Math.min(50, parseInt(String(limit)));

        const [reviews, total] = await Promise.all([
            Review.find({ product: productId })
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate('user', 'name'),
            Review.countDocuments({ product: productId }),
        ]);

        res.json({
            status: 'success',
            results: reviews.length,
            pagination: { page: pageNum, totalPages: Math.ceil(total / limitNum), total },
            data: reviews,
        });
    } catch (err) {
        next(err);
    }
};

// POST /reviews
export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId, rating, title, body } = req.body;

        const existing = await Review.findOne({ user: req.user!._id, product: productId });
        if (existing) throw new AppError('You have already reviewed this product', 400);

        const review = await Review.create({ user: req.user!._id, product: productId, rating, title, body });
        await review.populate('user', 'name');

        res.status(201).json({ status: 'success', data: review });
    } catch (err) {
        next(err);
    }
};

// DELETE /reviews/:id
export const remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) throw new AppError('Review not found', 404);

        if (req.user!.role !== 'admin' && review.user.toString() !== req.user!._id.toString()) {
            throw new AppError('Not authorized to delete this review', 403);
        }

        await Review.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
