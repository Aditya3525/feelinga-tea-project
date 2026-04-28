import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import { AppError } from './errorHandler.js';
import { ACCESS_COOKIE_NAME, getCookieValue } from '../utils/cookies.js';

// Verify JWT and attach user to request
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        const cookieToken = getCookieValue(req, ACCESS_COOKIE_NAME);
        const token = bearerToken || cookieToken;
        if (!token) {
            throw new AppError('Not authenticated. Please log in.', 401);
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

        const user = await User.findById(decoded.id);
        if (!user) {
            throw new AppError('User no longer exists', 401);
        }

        req.user = user as any;
        next();
    } catch (err) {
        next(err);
    }
};

// Restrict to specific roles
export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user!.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

// Optional auth — attach user if token exists, but don't require it
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        const cookieToken = getCookieValue(req, ACCESS_COOKIE_NAME);
        const token = bearerToken || cookieToken;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            req.user = await User.findById(decoded.id) as any;
        }
    } catch {
        // Token invalid — continue without user
    }
    next();
};
