import { z } from 'zod';

export const contactSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    subject: z.string().max(100).optional(),
    message: z.string().min(10).max(2000),
});

export const newsletterSubscribeSchema = z.object({
    email: z.string().email(),
});
