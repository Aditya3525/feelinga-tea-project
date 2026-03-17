/** Centralized app configuration — single source of truth for all env-driven values */

export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    env: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production',

    // Database
    mongoUri: process.env.MONGODB_URI!,

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET!,
        refreshSecret: process.env.JWT_REFRESH_SECRET!,
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as string,
        refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string,
    },

    // Client / CORS
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

    // Admin
    adminEmail: process.env.ADMIN_EMAIL?.toLowerCase(),

    // Google OAuth
    googleClientId: process.env.GOOGLE_CLIENT_ID,

    // SMTP
    smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM || 'noreply@feelinga.in',
    },

    // Business logic
    shipping: {
        freeThreshold: 999,
        defaultCost: 79,
    },
    taxRate: 0.05,          // 5% GST
    lowStockThreshold: 10,

    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        maxGeneral: process.env.NODE_ENV !== 'production' ? 500 : 100,
        maxAuth: process.env.NODE_ENV !== 'production' ? 200 : 50,
    },
} as const;
