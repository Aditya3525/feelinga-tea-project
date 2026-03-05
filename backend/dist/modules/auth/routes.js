import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Cart from '../../models/Cart.js';
import Review from '../../models/Review.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { sendPasswordResetEmail, sendEmail } from '../../utils/email.js';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = Router();
// Helper: hash a token for secure DB storage
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
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
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m'),
    });
};
const signRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
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
        // Save hashed refresh token
        user.refreshToken = hashToken(refreshToken);
        // Generate email verification token (#17)
        const verifyToken = crypto.randomBytes(32).toString('hex');
        user.emailVerifyToken = hashToken(verifyToken);
        user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save({ validateBeforeSave: false });
        // Send verification email (fire-and-forget)
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const verifyUrl = `${clientUrl}/verify-email?token=${verifyToken}`;
        sendEmail({
            to: email,
            subject: 'Verify your email — Feelinga',
            html: `<p>Hi ${name},</p><p>Welcome to Feelinga! Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}" style="padding:10px 20px;background:#8b6f47;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p><p>This link expires in 24 hours.</p>`,
        }).catch(err => console.error('Verify email error:', err.message));
        res.status(201).json({
            status: 'success',
            data: { user, accessToken, refreshToken },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
        // Check account lockout
        if (user?.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
            throw new AppError(`Account temporarily locked. Try again in ${minutesLeft} minute(s).`, 423);
        }
        if (!user || !(await user.comparePassword(password))) {
            // Increment failed login attempts
            if (user) {
                const attempts = (user.loginAttempts || 0) + 1;
                const update = { loginAttempts: attempts };
                // Lock after 5 failed attempts for 15 minutes
                if (attempts >= 5) {
                    update.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                    update.loginAttempts = 0;
                }
                await User.findByIdAndUpdate(user._id, update);
            }
            throw new AppError('Invalid email or password', 401);
        }
        // Reset login attempts on successful login
        if (user.loginAttempts > 0 || user.lockUntil) {
            await User.findByIdAndUpdate(user._id, { loginAttempts: 0, $unset: { lockUntil: 1 } });
        }
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        user.refreshToken = hashToken(refreshToken);
        await user.save({ validateBeforeSave: false });
        res.json({
            status: 'success',
            data: { user, accessToken, refreshToken },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            throw new AppError('Refresh token required', 400);
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== hashToken(refreshToken)) {
            throw new AppError('Invalid refresh token', 401);
        }
        // Rotate tokens
        const newAccessToken = signAccessToken(user);
        const newRefreshToken = signRefreshToken(user);
        user.refreshToken = hashToken(newRefreshToken);
        await user.save({ validateBeforeSave: false });
        res.json({
            status: 'success',
            data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        req.user.refreshToken = undefined;
        await req.user.save({ validateBeforeSave: false });
        res.json({ status: 'success', message: 'Logged out' });
    }
    catch (err) {
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
    currentPassword: z.string().min(1).optional(), // Required when changing email
});
router.patch('/me', authenticate, validate(updateProfileSchema), async (req, res, next) => {
    try {
        const { name, email, phone, currentPassword } = req.body;
        const user = req.user;
        if (email && email !== user.email) {
            // Require password confirmation for email changes
            if (!currentPassword) {
                throw new AppError('Current password is required to change email', 400);
            }
            const userWithPw = await User.findById(user._id).select('+password');
            if (!userWithPw || !(await userWithPw.comparePassword(currentPassword))) {
                throw new AppError('Current password is incorrect', 401);
            }
            const existing = await User.findOne({ email });
            if (existing)
                throw new AppError('Email already in use', 409);
            user.email = email;
        }
        if (name)
            user.name = name;
        if (phone !== undefined)
            user.phone = phone;
        await user.save({ validateBeforeSave: false });
        res.json({ status: 'success', data: { user } });
    }
    catch (err) {
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
        if (!user)
            throw new AppError('User not found', 404);
        if (!(await user.comparePassword(currentPassword))) {
            throw new AppError('Current password is incorrect', 401);
        }
        user.password = newPassword;
        await user.save();
        res.json({ status: 'success', message: 'Password updated successfully' });
    }
    catch (err) {
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
            user.addresses.forEach((a) => a.isDefault = false);
            address.isDefault = true;
        }
        user.addresses.push(address);
        await user.save({ validateBeforeSave: false });
        res.status(201).json({ status: 'success', data: { addresses: user.addresses } });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /auth/me/addresses/:id — Remove address
router.delete('/me/addresses/:id', authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        const idx = user.addresses.findIndex((a) => a._id.toString() === req.params.id);
        if (idx === -1)
            throw new AppError('Address not found', 404);
        const wasDefault = user.addresses[idx].isDefault;
        user.addresses.splice(idx, 1);
        // If removed address was default, set first remaining as default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }
        await user.save({ validateBeforeSave: false });
        res.json({ status: 'success', data: { addresses: user.addresses } });
    }
    catch (err) {
        next(err);
    }
});
// POST /auth/google — Google One Tap / Sign-In
router.post('/google', async (req, res, next) => {
    try {
        const { credential } = req.body;
        if (!credential)
            throw new AppError('Google credential required', 400);
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
        user.refreshToken = hashToken(refreshToken);
        await user.save({ validateBeforeSave: false });
        res.json({
            status: 'success',
            data: { user, accessToken, refreshToken },
        });
    }
    catch (err) {
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
        if (!email)
            throw new AppError('Email is required', 400);
        const user = await User.findOne({ email });
        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.passwordResetToken = hashToken(resetToken);
            user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
            await user.save({ validateBeforeSave: false });
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
            const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
            sendPasswordResetEmail(email, resetUrl).catch(err => console.error('Reset email error:', err.message));
        }
        res.json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });
    }
    catch (err) {
        next(err);
    }
});
// POST /auth/reset-password
router.post('/reset-password', async (req, res, next) => {
    try {
        const { token, password } = req.body;
        if (!token || !password)
            throw new AppError('Token and new password are required', 400);
        if (password.length < 8)
            throw new AppError('Password must be at least 8 characters', 400);
        const hashedToken = hashToken(token);
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        });
        if (!user)
            throw new AppError('Token is invalid or has expired', 400);
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        res.json({ status: 'success', message: 'Password has been reset successfully. You can now log in.' });
    }
    catch (err) {
        next(err);
    }
});
// POST /auth/verify-email — Verify email (#17)
router.post('/verify-email', async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token)
            throw new AppError('Verification token required', 400);
        const hashedToken = hashToken(token);
        const user = await User.findOne({
            emailVerifyToken: hashedToken,
            emailVerifyExpires: { $gt: new Date() },
        }).select('+emailVerifyToken');
        if (!user)
            throw new AppError('Invalid or expired verification token', 400);
        user.emailVerified = true;
        user.emailVerifyToken = undefined;
        user.emailVerifyExpires = undefined;
        await user.save({ validateBeforeSave: false });
        res.json({ status: 'success', message: 'Email verified successfully!' });
    }
    catch (err) {
        next(err);
    }
});
// GET /auth/wishlist — get current user's wishlist
router.get('/wishlist', authenticate, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist', 'name slug images prices type rating reviewCount');
        res.json({ status: 'success', data: user?.wishlist || [] });
    }
    catch (err) {
        next(err);
    }
});
// POST /auth/wishlist/:productId — add to wishlist (toggle)
router.post('/wishlist/:productId', authenticate, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user)
            throw new AppError('User not found', 404);
        const productId = req.params.productId;
        const idx = user.wishlist.indexOf(productId);
        let action;
        if (idx === -1) {
            user.wishlist.push(productId);
            action = 'added';
        }
        else {
            user.wishlist.splice(idx, 1);
            action = 'removed';
        }
        await user.save({ validateBeforeSave: false });
        res.json({ status: 'success', action, wishlist: user.wishlist });
    }
    catch (err) {
        next(err);
    }
});
// ===== PRIVACY / DSAR ENDPOINTS =====
// GET /auth/me/data-export — Download all personal data (DSAR compliance)
router.get('/me/data-export', authenticate, async (req, res, next) => {
    try {
        const userId = req.user._id;
        const [user, orders, reviews, cart] = await Promise.all([
            User.findById(userId).select('name email phone role addresses wishlist emailVerified createdAt updatedAt').lean(),
            Order.find({ user: userId }).select('-__v').sort({ createdAt: -1 }).lean(),
            Review.find({ user: userId }).select('-__v').sort({ createdAt: -1 }).lean(),
            Cart.findOne({ user: userId }).select('-__v').lean(),
        ]);
        res.json({
            status: 'success',
            data: {
                profile: user,
                orders,
                reviews,
                cart: cart?.items || [],
                exportedAt: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /auth/me — Delete account and anonymize data (right to erasure)
router.delete('/me', authenticate, validate(z.object({ currentPassword: z.string().min(1) })), async (req, res, next) => {
    try {
        const { currentPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');
        if (!user)
            throw new AppError('User not found', 404);
        if (!(await user.comparePassword(currentPassword))) {
            throw new AppError('Current password is incorrect', 401);
        }
        // Anonymize orders (keep for accounting, remove PII)
        await Order.updateMany({ user: user._id }, {
            $set: {
                'shippingAddress.firstName': 'Deleted',
                'shippingAddress.lastName': 'User',
                'shippingAddress.phone': '0000000000',
                'shippingAddress.line1': 'Account deleted',
                'shippingAddress.line2': '',
            },
        });
        // Delete reviews, cart, and user
        await Promise.all([
            Review.deleteMany({ user: user._id }),
            Cart.findOneAndDelete({ user: user._id }),
            User.findByIdAndDelete(user._id),
        ]);
        res.json({ status: 'success', message: 'Your account and personal data have been deleted.' });
    }
    catch (err) {
        next(err);
    }
});
export default router;
