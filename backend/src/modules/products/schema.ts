import { z } from 'zod';

const teaTypes = ['Black Tea', 'Green Tea', 'White Tea', 'Oolong', 'Herbal', 'Herbal Infusion', 'Masala Chai', 'Matcha'] as const;
const moodTypes = ['energize', 'relax', 'focus', 'detox', 'glow', 'immunity'] as const;
const caffeineTypes = ['none', 'low', 'medium', 'high'] as const;

const brewingInstructionsSchema = z.object({
    temperature: z.string().max(50).optional(),
    steepTime: z.string().max(50).optional(),
    amount: z.string().max(50).optional(),
});

export const createProductSchema = z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(100),
    type: z.enum(teaTypes),
    description: z.string().min(10).max(1000),
    shortDescription: z.string().max(200).optional(),
    prices: z.record(z.string().min(1).max(20), z.number().positive())
        .refine(p => '100g' in p && p['100g'] > 0, { message: '100g price is required and must be positive' }),
    moods: z.array(z.enum(moodTypes)).optional(),
    origin: z.string().min(2),
    caffeine: z.enum(caffeineTypes).optional(),
    tastingNotes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    stock: z.number().int().min(0).optional(),
    inStock: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    images: z.array(z.string()).optional(),
    brewingInstructions: brewingInstructionsSchema.optional(),
});

export const updateProductSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string().min(2).max(100).optional(),
    type: z.enum(teaTypes).optional(),
    description: z.string().min(10).max(1000).optional(),
    shortDescription: z.string().max(200).optional(),
    prices: z.record(z.string().min(1).max(20), z.number().positive()).optional(),
    moods: z.array(z.enum(moodTypes)).optional(),
    origin: z.string().min(2).optional(),
    caffeine: z.enum(caffeineTypes).optional(),
    tastingNotes: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    stock: z.number().int().min(0).optional(),
    inStock: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    brewingInstructions: brewingInstructionsSchema.optional(),
});

export const bulkStockSchema = z.object({
    productIds: z.array(z.string()).min(1),
    stock: z.number().int().min(0),
});

export const bulkDeleteSchema = z.object({
    productIds: z.array(z.string()).min(1),
});
