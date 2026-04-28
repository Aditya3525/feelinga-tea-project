import { z } from 'zod';

export const couponSchema = z.object({
    name: z.string().max(80).optional(),
    code: z.string().min(2).max(30),
    campaignType: z.enum(['regular', 'seasonal', 'festival']).default('regular'),
    campaignLabel: z.string().max(80).optional(),
    bannerText: z.string().max(240).optional(),
    featuredOnStore: z.boolean().default(false),
    priority: z.number().int().min(0).default(0),
    discountType: z.enum(['percentage', 'flat']),
    discountValue: z.number().positive(),
    minOrderAmount: z.number().min(0).default(0),
    maxDiscount: z.number().min(0).optional(),
    usageLimit: z.number().int().min(0).optional(),
    perUserLimit: z.number().int().min(0).optional(),
    validFrom: z.string().or(z.date()),
    validTo: z.string().or(z.date()),
    active: z.boolean().default(true),
    description: z.string().max(200).optional(),
});

export const couponUpdateSchema = couponSchema.partial();

export const testimonialSchema = z.object({
    author: z.string().min(1).max(100),
    role: z.string().max(100).optional(),
    text: z.string().min(1).max(2000),
    rating: z.number().int().min(1).max(5).default(5),
    approved: z.boolean().default(false),
    featured: z.boolean().default(false),
    order: z.number().int().min(0).default(0),
});

export const testimonialUpdateSchema = testimonialSchema.partial();

export const trackingSchema = z.object({
    trackingNumber: z.string().max(100).optional(),
    trackingUrl: z.string().url().max(500).optional().or(z.literal('')),
});
