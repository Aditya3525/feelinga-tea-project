import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../../models/User.js';
import { AppError } from '../../middleware/errorHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

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

export default router;
