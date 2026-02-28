import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    ...(isProduction
        ? {} // JSON output in production (machine-readable for log aggregators)
        : { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } } }
    ),
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'password',
            'refreshToken',
            'accessToken',
            'token',
        ],
        censor: '[REDACTED]',
    },
});

export default logger;
