import { z } from 'zod';

const strictEmailRegex = /^(?=.{1,254}$)(?=.{1,64}@)(?!.*\.\.)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const strictEmailMessage = 'Please enter a valid email address.';

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/;
const strongPasswordMessage = 'Password must be 8-100 characters and include uppercase, lowercase, number, and special character';

export const registerSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().trim().regex(strictEmailRegex, strictEmailMessage),
    password: z.string().regex(strongPasswordRegex, strongPasswordMessage),
});

export const loginSchema = z.object({
    email: z.string().trim().regex(strictEmailRegex, strictEmailMessage),
    password: z.string().min(1),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(80).optional(),
    email: z.string().trim().regex(strictEmailRegex, strictEmailMessage).optional(),
    phone: z.union([
        z.literal(''),
        z.string().regex(/^\+[1-9]\d{7,14}$/, 'Phone number must include country code in international format (e.g. +911234567890)'),
    ]).optional(),
    currentPassword: z.string().min(1).optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().regex(strongPasswordRegex, strongPasswordMessage),
});

export const forgotPasswordSchema = z.object({
    email: z.string().trim().regex(strictEmailRegex, strictEmailMessage),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().regex(strongPasswordRegex, strongPasswordMessage),
});

export const verifyEmailSchema = z.object({
    token: z.string().min(1),
});

export const checkEmailSchema = z.object({
    email: z.string().trim().regex(strictEmailRegex, strictEmailMessage),
});

export const addressSchema = z.object({
    label: z.enum(['Home', 'Work', 'Other']).default('Home'),
    fullName: z.string().min(2),
    phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Phone number must include country code in international format (e.g. +911234567890)'),
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
