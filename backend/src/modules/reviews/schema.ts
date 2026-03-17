import { z } from 'zod';

export const createReviewSchema = z.object({
    productId: z.string(),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(100).optional(),
    body: z.string().max(1000).optional(),
});
