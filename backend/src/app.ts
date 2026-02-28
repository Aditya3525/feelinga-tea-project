import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import { authenticate, authorize } from './middleware/auth.js';

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

const app = express();
const PORT = process.env.PORT || 5000;

// ===== ENV VALIDATION =====
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const optionalEnvVars = ['GOOGLE_CLIENT_ID', 'CLIENT_URL'];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
    console.error(`\n✗ Missing required environment variables:\n  ${missing.join('\n  ')}\n`);
    console.error('  Create a .env file in the backend directory with these values.');
    process.exit(1);
}
const unset = optionalEnvVars.filter(v => !process.env[v]);
if (unset.length > 0) {
    console.warn(`⚠ Optional env vars not set: ${unset.join(', ')} — some features may be disabled.`);
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
    res.json({
        status: 'success',
        message: 'Feelinga API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
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

// Public coupon validation endpoint
import Coupon from './models/Coupon.js';
app.post('/api/v1/coupons/validate', authenticate, async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        if (!code) return res.status(400).json({ status: 'error', message: 'Coupon code required' });
        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            active: true,
            validFrom: { $lte: new Date() },
            validTo: { $gte: new Date() },
        });
        if (!coupon) return res.status(404).json({ status: 'error', message: 'Invalid or expired coupon' });
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ status: 'error', message: 'Coupon usage limit reached' });
        }
        if (subtotal && subtotal < coupon.minOrderAmount) {
            return res.status(400).json({ status: 'error', message: `Minimum order ₹${coupon.minOrderAmount}` });
        }
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = Math.round((subtotal || 0) * coupon.discountValue / 100);
            if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
            discount = coupon.discountValue;
        }
        res.json({ status: 'success', data: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, discount, description: coupon.description } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// ===== SERVE UPLOADED FILES =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// ===== SERVE FRONTEND STATIC FILES =====
// Serve React production build from frontend/dist, fallback to project root for legacy HTML
const frontendDistPath = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
const frontendPath = path.resolve(__dirname, '..', '..');
app.use(express.static(frontendDistPath));
app.use(express.static(frontendPath));

// Fallback: serve index.html for non-API routes
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            status: 'error',
            message: `Route ${req.method} ${req.url} not found`,
        });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global error handler
app.use(errorHandler);

// ===== START SERVER =====

const start = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`\n✓ Feelinga API running on http://localhost:${PORT}`);
        console.log(`  Environment: ${process.env.NODE_ENV}`);
        console.log(`  Health: http://localhost:${PORT}/api/v1/health\n`);
    });
};

if (process.env.NODE_ENV !== 'test') {
    start();
}

export default app;
