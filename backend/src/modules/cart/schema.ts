import { z } from 'zod';

export const addItemSchema = z.object({
    productId: z.string(),
    size: z.string().default('100g'),
    qty: z.number().int().positive().default(1),
});
