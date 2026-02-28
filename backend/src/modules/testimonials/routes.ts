import { Router } from 'express';
import Testimonial from '../../models/Testimonial.js';

const router = Router();

// GET /testimonials — public: return only approved testimonials
router.get('/', async (_req, res, next) => {
    try {
        const testimonials = await Testimonial.find({ approved: true })
            .sort({ featured: -1, order: 1, createdAt: -1 })
            .lean();
        res.json({ status: 'success', data: testimonials });
    } catch (err) {
        next(err);
    }
});

export default router;
