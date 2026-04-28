import { z } from 'zod';

export const addItemSchema = z.object({
    productId: z.string(),
    size: z.string().default('100g'),
    qty: z.number().int().positive().default(1),
});

const syncItemSchema = z.object({
    productId: z.string().optional(),
    slug: z.string().optional(),
    size: z.string().default('100g'),
    qty: z.number().int().positive().default(1),
}).refine((item) => Boolean(item.productId || item.slug), {
    message: 'Either productId or slug is required',
});

export const syncCartSchema = z.object({
    items: z.array(syncItemSchema),
});
