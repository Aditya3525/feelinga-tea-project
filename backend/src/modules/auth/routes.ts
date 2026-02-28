import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import User from '../../models/User.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();

// Validation schemas
const registerSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(100),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

// Generate tokens
const signAccessToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
};

const signRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
};

// POST /auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('Email already registered', 409);
        }

        const user = await User.create({ name, email, password });
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.status(201).json({
            status: 'success',
            data: { user, accessToken, refreshToken },
        });
    } catch (err) {
        next(err);
    }
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            throw new AppError('Invalid email or password', 401);
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.json({
            status: 'success',
            data: { user, accessToken, refreshToken },
        });
    } catch (err) {
        next(err);
    }
});

// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw new AppError('Refresh token required', 400);

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            throw new AppError('Invalid refresh token', 401);
        }

        // Rotate tokens
        const newAccessToken = signAccessToken(user);
        const newRefreshToken = signRefreshToken(user);
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        res.json({
            status: 'success',
            data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
        });
    } catch (err) {
        next(err);
    }
});

// POST /auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        req.user.refreshToken = undefined;
        await req.user.save({ validateBeforeSave: false });
        res.json({ status: 'success', message: 'Logged out' });
    } catch (err) {
        next(err);
    }
});

// GET /auth/me
router.get('/me', authenticate, (req, res) => {
    res.json({ status: 'success', data: { user: req.user } });
});

// PATCH /auth/me — Update profile
const updateProfileSchema = z.object({
    name: z.string().min(2).max(80).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(15).optional(),
});

router.patch('/me', authenticate, validate(updateProfileSchema), async (req, res, next) => {
    try {
        const { name, email, phone } = req.body;
        const user = req.user;

        if (email && email !== user.email) {
            const existing = await User.findOne({ email });
            if (existing) throw new AppError('Email already in use', 409);
            user.email = email;
        }
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;

        await user.save({ validateBeforeSave: false });

        res.json({ status: 'success', data: { user } });
    } catch (err) {
        next(err);
    }
});

// POST /auth/change-password
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100),
});

router.post('/change-password', authenticate, validate(changePasswordSchema), async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        if (!(await user.comparePassword(currentPassword))) {
            throw new AppError('Current password is incorrect', 401);
        }

        user.password = newPassword;
        await user.save();

        res.json({ status: 'success', message: 'Password updated successfully' });
    } catch (err) {
        next(err);
    }
});

// POST /auth/me/addresses — Add address
const addressSchema = z.object({
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

router.post('/me/addresses', authenticate, validate(addressSchema), async (req, res, next) => {
    try {
        const user = req.user;
        const address = req.body;

        // If this is the first or set as default, unset others
        if (address.isDefault || user.addresses.length === 0) {
            user.addresses.forEach(a => a.isDefault = false);
            address.isDefault = true;
        }

        user.addresses.push(address);
        await user.save({ validateBeforeSave: false });

        res.status(201).json({ status: 'success', data: { addresses: user.addresses } });
    } catch (err) {
        next(err);
    }
});

// DELETE /auth/me/addresses/:id — Remove address
router.delete('/me/addresses/:id', authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        const idx = user.addresses.findIndex(a => a._id.toString() === req.params.id);
        if (idx === -1) throw new AppError('Address not found', 404);

        const wasDefault = user.addresses[idx].isDefault;
        user.addresses.splice(idx, 1);

        // If removed address was default, set first remaining as default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save({ validateBeforeSave: false });

        res.json({ status: 'success', data: { addresses: user.addresses } });
    } catch (err) {
        next(err);
    }
});

// POST /auth/google — Google One Tap / Sign-In
router.post('/google', async (req, res, next) => {
    try {
        const { credential } = req.body;
        if (!credential) throw new AppError('Google credential required', 400);

        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                name,
                email,
                password: crypto.randomBytes(32).toString('hex'), // random password
                googleId,
            });
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.json({
            status: 'success',
            data: { user, accessToken, refreshToken },
        });
    } catch (err) {
        if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
            return next(new AppError('Invalid Google token', 401));
        }
        next(err);
    }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) throw new AppError('Email is required', 400);
        // Find user (don't reveal if not found — security best practice)
        const user = await User.findOne({ email });
        if (user) {
            // In production: generate token, save hash to user, send email
            // For now: just acknowledge silently (email service not configured)
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins
            await user.save({ validateBeforeSave: false });
        }
        res.json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        next(err);
    }
});

// GET /auth/wishlist — get current user's wishlist
router.get('/wishlist', authenticate, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist', 'name slug images prices type rating reviewCount');
        res.json({ status: 'success', data: user.wishlist || [] });
    } catch (err) {
        next(err);
    }
});

// POST /auth/wishlist/:productId — add to wishlist (toggle)
router.post('/wishlist/:productId', authenticate, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const productId = req.params.productId;
        const idx = user.wishlist.indexOf(productId);
        let action;
        if (idx === -1) {
            user.wishlist.push(productId);
            action = 'added';
        } else {
            user.wishlist.splice(idx, 1);
            action = 'removed';
        }
        await user.save({ validateBeforeSave: false });
        res.json({ status: 'success', action, wishlist: user.wishlist });
    } catch (err) {
        next(err);
    }
});

export default router;
