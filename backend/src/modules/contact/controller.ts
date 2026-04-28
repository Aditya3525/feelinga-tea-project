import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import ContactMessage from '../../models/ContactMessage.js';
import NewsletterSubscriber from '../../models/NewsletterSubscriber.js';

// POST /contact
export const submitContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, subject, message } = req.body;
        const msg = await ContactMessage.create({ name, email, subject, message });
        res.status(201).json({ status: 'success', message: "Thank you! We'll get back to you within 24 hours.", data: { id: msg._id } });
    } catch (err) { next(err); }
};

// GET /contact (admin)
export const listMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pageNum = Math.max(1, Number.parseInt(String(req.query.page), 10) || 1);
        const limitNum = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit), 10) || 50));
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;

        const filter: Record<string, any> = {};
        if (status) filter.status = status;

        const [messages, total] = await Promise.all([
            ContactMessage.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
            ContactMessage.countDocuments(filter),
        ]);

        res.json({
            status: 'success',
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                total,
            },
            data: messages,
        });
    } catch (err) { next(err); }
};

// PATCH /contact/:id (admin)
export const updateMessageStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = req.body;
        const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
        if (!message) return res.status(404).json({ status: 'error', message: 'Message not found' });
        res.json({ status: 'success', data: message });
    } catch (err) { next(err); }
};

// POST /newsletter
export const subscribe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const unsubscribeToken = crypto.randomBytes(24).toString('hex');
        await NewsletterSubscriber.findOneAndUpdate(
            { email },
            { email, active: true, subscribedAt: new Date(), unsubscribeToken },
            { upsert: true, new: true },
        );
        res.status(201).json({ status: 'success', message: "You're subscribed! Welcome to the Feelinga community." });
    } catch (err) { next(err); }
};

// DELETE /newsletter
export const unsubscribe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, email } = req.body;
        if (token) {
            const sub = await NewsletterSubscriber.findOneAndUpdate({ unsubscribeToken: token }, { active: false });
            if (!sub) return res.status(404).json({ status: 'error', message: 'Invalid unsubscribe token' });
        } else if (email) {
            await NewsletterSubscriber.findOneAndUpdate({ email }, { active: false });
        } else {
            return res.status(400).json({ status: 'error', message: 'Token or email required' });
        }
        res.json({ status: 'success', message: "You've been unsubscribed." });
    } catch (err) { next(err); }
};

// GET /newsletter (admin)
export const listSubscribers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const subscribers = await NewsletterSubscriber.find().sort({ subscribedAt: -1 }).limit(200).lean();
        res.json({ status: 'success', data: subscribers, count: subscribers.length });
    } catch (err) { next(err); }
};
