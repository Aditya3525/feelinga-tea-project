import { z } from 'zod';

export const createOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        size: z.string(),
        qty: z.number().int().positive(),
    })).min(1),
    shippingAddress: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        line1: z.string().min(1),
        line2: z.string().optional(),
        city: z.string().min(1),
        state: z.string().min(1),
        pincode: z.string().min(5),
        phone: z.string().min(10),
    }),
    paymentMethod: z.enum(['cod', 'upi', 'card', 'whatsapp']).default('cod'),
    couponCode: z.string().optional(),
    notes: z.string().max(500).optional(),
});

export const bulkStatusSchema = z.object({
    orderIds: z.array(z.string()).min(1),
    status: z.enum(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});
