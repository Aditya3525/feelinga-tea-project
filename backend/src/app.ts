import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import { authenticate, authorize } from './middleware/auth.js';
import logger from './utils/logger.js';
import User from './models/User.js';

// Route modules
import authRoutes from './modules/auth/routes.js';
import productRoutes from './modules/products/routes.js';
import orderRoutes from './modules/orders/routes.js';
import reviewRoutes from './modules/reviews/routes.js';
import cartRoutes from './modules/cart/routes.js';
import adminRoutes from './modules/admin/routes.js';
import contactRoutes from './modules/contact/routes.js';
import uploadRoutes from './modules/upload/routes.js';
import testimonialRoutes from './modules/testimonials/routes.js';
import couponRoutes from './modules/coupons/routes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

// ===== ENV VALIDATION =====
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const optionalEnvVars = ['GOOGLE_CLIENT_ID', 'CLIENT_URL'];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
    logger.fatal({ missing }, 'Missing required environment variables');
    process.exit(1);
}
const unset = optionalEnvVars.filter(v => !process.env[v]);
if (unset.length > 0) {
    logger.warn({ vars: unset }, 'Optional env vars not set — some features may be disabled');
}

// ===== GLOBAL MIDDLEWARE =====

// Security headers (relaxed for Google Identity Services)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            frameSrc: ["https://accounts.google.com"],
            connectSrc: ["'self'", "https://accounts.google.com"],
        },
    },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));

// CORS — allow all origins in dev (file:// protocol)
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : true,
    credentials: true,
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request timeout (30 seconds)
app.use((req, res, next) => {
    req.setTimeout(30000, () => {
        if (!res.headersSent) {
            res.status(408).json({ status: 'error', message: 'Request timeout' });
        }
    });
    next();
});

// Cache headers middleware (#18)
app.use('/api/v1/products', (req, res, next) => {
    if (req.method === 'GET') {
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
    next();
});

// Rate limiting
const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 500 : 100,
    message: { status: 'error', message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 200 : 50,
    message: { status: 'error', message: 'Too many auth attempts, please try again later' },
});

// ===== API ROUTES =====

app.get('/api/v1/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStates: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    res.json({
        status: dbState === 1 ? 'success' : 'degraded',
        message: 'Feelinga API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: dbStates[dbState] || 'unknown',
    });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/admin', authenticate, authorize('admin'), adminRoutes);
app.use('/api/v1/upload', authenticate, authorize('admin'), uploadRoutes);
app.use('/api/v1/testimonials', testimonialRoutes);
app.use('/api/v1', contactRoutes);
app.use('/api/v1/coupons', couponRoutes);

// ===== SERVE UPLOADED FILES =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// ===== 404 HANDLER FOR UNMATCHED API ROUTES =====
app.all('/api/*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.url} not found`,
    });
});

// Global error handler
app.use(errorHandler);

// ===== START SERVER =====

const start = async () => {
    await connectDB();

    // Ensure the configured primary admin account has admin role on every startup.
    if (adminEmail) {
        try {
            const result = await User.findOneAndUpdate(
                { email: adminEmail },
                { $set: { role: 'admin' } },
                { new: true }
            );
            if (result) {
                logger.info({ email: adminEmail }, 'Primary admin role confirmed');
            }
        } catch (err) {
            logger.warn({ err, email: adminEmail }, 'Could not enforce admin role at startup');
        }
    } else {
        logger.warn('ADMIN_EMAIL not set; skipping primary admin enforcement');
    }

    app.listen(PORT, () => {
        logger.info({ port: PORT, env: process.env.NODE_ENV }, `Feelinga API running on http://localhost:${PORT}`);
    });
};

if (process.env.NODE_ENV !== 'test') {
    start();
}

// ===== GRACEFUL SHUTDOWN & PROCESS SAFETY =====
process.on('unhandledRejection', (reason: any) => {
    logger.fatal({ err: reason }, 'Unhandled Promise Rejection');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught Exception');
    process.exit(1);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    mongoose.connection.close().then(() => process.exit(0));
});

process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down...');
    mongoose.connection.close().then(() => process.exit(0));
});

export default app;
