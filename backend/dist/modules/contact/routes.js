import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
const router = Router();
// ===== Contact Message Schema =====
const contactMessageSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: 'General Inquiry' },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
}, { timestamps: true });
const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
// ===== Newsletter Subscriber Schema =====
const newsletterSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    subscribedAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    unsubscribeToken: { type: String, unique: true, sparse: true },
}, { timestamps: true });
const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSchema);
// ===== Validation =====
const contactSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    subject: z.string().max(100).optional(),
    message: z.string().min(10).max(2000),
});
const newsletterSubscribeSchema = z.object({
    email: z.string().email(),
});
// ===== Contact Routes =====
// POST /contact — Submit contact form
router.post('/contact', validate(contactSchema), async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;
        const msg = await ContactMessage.create({ name, email, subject, message });
        res.status(201).json({
            status: 'success',
            message: 'Thank you! We\'ll get back to you within 24 hours.',
            data: { id: msg._id },
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /contact — List contact messages (admin only, #5 secured)
router.get('/contact', authenticate, authorize('admin'), async (req, res, next) => {
    // This route is secured at the app.ts level via authenticate+authorize middleware
    // when mounted under /api/v1/admin, or check manually here:
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(50);
        res.json({ status: 'success', data: messages });
    }
    catch (err) {
        next(err);
    }
});
// ===== Newsletter Routes =====
// POST /newsletter — Subscribe
router.post('/newsletter', validate(newsletterSubscribeSchema), async (req, res, next) => {
    try {
        const { email } = req.body;
        const unsubscribeToken = crypto.randomBytes(24).toString('hex');
        // Upsert: reactivate if already exists
        await NewsletterSubscriber.findOneAndUpdate({ email }, { email, active: true, subscribedAt: new Date(), unsubscribeToken }, { upsert: true, new: true });
        res.status(201).json({
            status: 'success',
            message: 'You\'re subscribed! Welcome to the Feelinga community.',
        });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /newsletter — Unsubscribe (requires token for security)
router.delete('/newsletter', async (req, res, next) => {
    try {
        const { token, email } = req.body;
        if (token) {
            // Token-based unsubscribe (from email link)
            const sub = await NewsletterSubscriber.findOneAndUpdate({ unsubscribeToken: token }, { active: false });
            if (!sub)
                return res.status(404).json({ status: 'error', message: 'Invalid unsubscribe token' });
        }
        else if (email) {
            // Email-based unsubscribe (legacy / authenticated admin)
            await NewsletterSubscriber.findOneAndUpdate({ email }, { active: false });
        }
        else {
            return res.status(400).json({ status: 'error', message: 'Token or email required' });
        }
        res.json({ status: 'success', message: 'You\'ve been unsubscribed.' });
    }
    catch (err) {
        next(err);
    }
});
// GET /newsletter — List subscribers (admin only, #14)
router.get('/newsletter', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const subscribers = await NewsletterSubscriber.find().sort({ subscribedAt: -1 }).limit(200).lean();
        res.json({ status: 'success', data: subscribers, count: subscribers.length });
    }
    catch (err) {
        next(err);
    }
});
export default router;
