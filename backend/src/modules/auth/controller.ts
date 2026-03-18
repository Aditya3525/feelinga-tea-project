import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Cart from '../../models/Cart.js';
import Review from '../../models/Review.js';
import { AppError } from '../../middleware/errorHandler.js';
import { sendPasswordResetEmail, sendEmail } from '../../utils/email.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ===== HELPERS =====

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const signAccessToken = (user: any) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
    });

const signRefreshToken = (user: any) =>
    jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET as string, {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
    });

// ===== HANDLERS =====

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) throw new AppError('Email already registered', 409);

        const user = await User.create({ name, email, password });
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        user.refreshToken = hashToken(refreshToken);
        const verifyToken = crypto.randomBytes(32).toString('hex');
        user.emailVerifyToken = hashToken(verifyToken);
        user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const verifyUrl = `${clientUrl}/verify-email?token=${verifyToken}`;
        sendEmail({
            to: email, subject: 'Verify your email — Feelinga',
            html: `<p>Hi ${name},</p><p>Welcome to Feelinga! Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}" style="padding:10px 20px;background:#8b6f47;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p><p>This link expires in 24 hours.</p>`,
        }).catch(err => console.error('Verify email error:', err.message));

        res.status(201).json({ status: 'success', data: { user, accessToken, refreshToken } });
    } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

        if (user?.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
            throw new AppError(`Account temporarily locked. Try again in ${minutesLeft} minute(s).`, 423);
        }

        if (!user || !(await (user as any).comparePassword(password))) {
            if (user) {
                const attempts = (user.loginAttempts || 0) + 1;
                const update: any = { loginAttempts: attempts };
                if (attempts >= 5) { update.lockUntil = new Date(Date.now() + 15 * 60 * 1000); update.loginAttempts = 0; }
                await User.findByIdAndUpdate(user._id, update);
            }
            throw new AppError('Invalid email or password', 401);
        }

        if (user.loginAttempts > 0 || user.lockUntil) {
            await User.findByIdAndUpdate(user._id, { loginAttempts: 0, $unset: { lockUntil: 1 } });
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        user.refreshToken = hashToken(refreshToken);
        await user.save({ validateBeforeSave: false });

        res.json({ status: 'success', data: { user, accessToken, refreshToken } });
    } catch (err) { next(err); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw new AppError('Refresh token required', 400);

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== hashToken(refreshToken)) throw new AppError('Invalid refresh token', 401);

        const newAccessToken = signAccessToken(user);
        const newRefreshToken = signRefreshToken(user);
        user.refreshToken = hashToken(newRefreshToken);
        await user.save({ validateBeforeSave: false });

        res.json({ status: 'success', data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
    } catch (err) { next(err); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        req.user!.refreshToken = undefined as any;
        await (req.user! as any).save({ validateBeforeSave: false });
        res.json({ status: 'success', message: 'Logged out' });
    } catch (err) { next(err); }
};

export const getMe = (req: Request, res: Response) => {
    res.json({ status: 'success', data: { user: req.user } });
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, phone, currentPassword } = req.body;
        const user = req.user!;

        if (email && email !== user.email) {
            if (!currentPassword) throw new AppError('Current password is required to change email', 400);
            const userWithPw = await User.findById(user._id).select('+password');
            if (!userWithPw || !(await (userWithPw as any).comparePassword(currentPassword))) throw new AppError('Current password is incorrect', 401);
            const existing = await User.findOne({ email });
            if (existing) throw new AppError('Email already in use', 409);
            user.email = email;
        }
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        await (user as any).save({ validateBeforeSave: false });

        res.json({ status: 'success', data: { user } });
    } catch (err) { next(err); }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user!._id).select('+password');
        if (!user) throw new AppError('User not found', 404);
        if (!(await (user as any).comparePassword(currentPassword))) throw new AppError('Current password is incorrect', 401);

        user.password = newPassword;
        await user.save();
        res.json({ status: 'success', message: 'Password updated successfully' });
    } catch (err) { next(err); }
};

export const addAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user!;
        const address = req.body;
        if (address.isDefault || user.addresses.length === 0) {
            user.addresses.forEach((a: any) => a.isDefault = false);
            address.isDefault = true;
        }
        user.addresses.push(address);
        await (user as any).save({ validateBeforeSave: false });
        res.status(201).json({ status: 'success', data: { addresses: user.addresses } });
    } catch (err) { next(err); }
};

export const removeAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user!;
        const idx = user.addresses.findIndex((a: any) => a._id.toString() === req.params.id);
        if (idx === -1) throw new AppError('Address not found', 404);

        const wasDefault = user.addresses[idx].isDefault;
        user.addresses.splice(idx, 1);
        if (wasDefault && user.addresses.length > 0) user.addresses[0].isDefault = true;
        await (user as any).save({ validateBeforeSave: false });

        res.json({ status: 'success', data: { addresses: user.addresses } });
    } catch (err) { next(err); }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { credential } = req.body;
        if (!credential) throw new AppError('Google credential required', 400);

        const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload()!;
        const { email, name, sub: googleId } = payload;

        let user = await User.findOne({ email });
        if (!user) user = await User.create({ name, email, password: crypto.randomBytes(32).toString('hex'), googleId });

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        user.refreshToken = hashToken(refreshToken);
        await user.save({ validateBeforeSave: false });

        res.json({ status: 'success', data: { user, accessToken, refreshToken } });
    } catch (err: any) {
        const msg = String(err?.message || '').toLowerCase();
        if (
            msg.includes('token used too late')
            || msg.includes('invalid token')
            || msg.includes('can\'t parse token')
            || msg.includes('malformed')
            || msg.includes('jwt')
            || msg.includes('audience')
        ) {
            return next(new AppError('Invalid Google token', 401));
        }
        next(err);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email) throw new AppError('Email is required', 400);
        const user = await User.findOne({ email });
        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.passwordResetToken = hashToken(resetToken);
            user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
            await user.save({ validateBeforeSave: false });
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
            sendPasswordResetEmail(email, `${clientUrl}/reset-password?token=${resetToken}`).catch(err => console.error('Reset email error:', err.message));
        }
        res.json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });
    } catch (err) { next(err); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) throw new AppError('Token and new password are required', 400);
        if (password.length < 8) throw new AppError('Password must be at least 8 characters', 400);

        const user = await User.findOne({ passwordResetToken: hashToken(token), passwordResetExpires: { $gt: new Date() } });
        if (!user) throw new AppError('Token is invalid or has expired', 400);

        user.password = password;
        user.passwordResetToken = undefined as any;
        user.passwordResetExpires = undefined as any;
        await user.save();
        res.json({ status: 'success', message: 'Password has been reset successfully. You can now log in.' });
    } catch (err) { next(err); }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.body;
        if (!token) throw new AppError('Verification token required', 400);

        const user = await User.findOne({ emailVerifyToken: hashToken(token), emailVerifyExpires: { $gt: new Date() } }).select('+emailVerifyToken');
        if (!user) throw new AppError('Invalid or expired verification token', 400);

        user.emailVerified = true;
        user.emailVerifyToken = undefined as any;
        user.emailVerifyExpires = undefined as any;
        await user.save({ validateBeforeSave: false });
        res.json({ status: 'success', message: 'Email verified successfully!' });
    } catch (err) { next(err); }
};

export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.user!._id).populate('wishlist', 'name slug images prices type rating reviewCount');
        res.json({ status: 'success', data: user?.wishlist || [] });
    } catch (err) { next(err); }
};

export const toggleWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.user!._id);
        if (!user) throw new AppError('User not found', 404);
        const productId = req.params.productId;
        const idx = user.wishlist.indexOf(productId as any);
        let action;
        if (idx === -1) { user.wishlist.push(productId as any); action = 'added'; }
        else { user.wishlist.splice(idx, 1); action = 'removed'; }
        await user.save({ validateBeforeSave: false });
        res.json({ status: 'success', action, wishlist: user.wishlist });
    } catch (err) { next(err); }
};

export const dataExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!._id;
        const [user, orders, reviews, cart] = await Promise.all([
            User.findById(userId).select('name email phone role addresses wishlist emailVerified createdAt updatedAt').lean(),
            Order.find({ user: userId }).select('-__v').sort({ createdAt: -1 }).lean(),
            Review.find({ user: userId }).select('-__v').sort({ createdAt: -1 }).lean(),
            Cart.findOne({ user: userId }).select('-__v').lean(),
        ]);
        res.json({ status: 'success', data: { profile: user, orders, reviews, cart: cart?.items || [], exportedAt: new Date().toISOString() } });
    } catch (err) { next(err); }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { currentPassword } = req.body;
        const user = await User.findById(req.user!._id).select('+password');
        if (!user) throw new AppError('User not found', 404);
        if (!(await (user as any).comparePassword(currentPassword))) throw new AppError('Current password is incorrect', 401);

        await Order.updateMany({ user: user._id }, {
            $set: { 'shippingAddress.firstName': 'Deleted', 'shippingAddress.lastName': 'User', 'shippingAddress.phone': '0000000000', 'shippingAddress.line1': 'Account deleted', 'shippingAddress.line2': '' },
        });
        await Promise.all([Review.deleteMany({ user: user._id }), Cart.findOneAndDelete({ user: user._id }), User.findByIdAndDelete(user._id)]);
        res.json({ status: 'success', message: 'Your account and personal data have been deleted.' });
    } catch (err) { next(err); }
};
