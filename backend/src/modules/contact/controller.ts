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
export const listMessages = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(50);
        res.json({ status: 'success', data: messages });
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
