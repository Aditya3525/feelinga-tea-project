import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(80).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(15).optional(),
    currentPassword: z.string().min(1).optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100),
});

export const addressSchema = z.object({
    label: z.enum(['Home', 'Work', 'Other']).default('Home'),
    fullName: z.string().min(2),
    phone: z.string().min(10),
    addressLine1: z.string().min(5),
    addressLine2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(5),
    isDefault: z.boolean().optional(),
});

export const deleteAccountSchema = z.object({
    currentPassword: z.string().min(1),
});
