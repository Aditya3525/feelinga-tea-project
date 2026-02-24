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

// Route modules
import authRoutes from './modules/auth/routes.js';
import productRoutes from './modules/products/routes.js';
import orderRoutes from './modules/orders/routes.js';
import reviewRoutes from './modules/reviews/routes.js';
import cartRoutes from './modules/cart/routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

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

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { status: 'error', message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { status: 'error', message: 'Too many auth attempts, please try again later' },
});

// ===== API ROUTES =====

app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'feelinga API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/cart', cartRoutes);

// ===== SERVE FRONTEND STATIC FILES =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, '..', '..');
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
        console.log(`\n✓ feelinga API running on http://localhost:${PORT}`);
        console.log(`  Environment: ${process.env.NODE_ENV}`);
        console.log(`  Health: http://localhost:${PORT}/api/v1/health\n`);
    });
};

start();

export default app;
