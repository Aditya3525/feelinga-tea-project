import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import logger from '../utils/logger.js';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const messages = Object.values(err.errors).map((e: any) => e.message);
        message = messages.join('. ');
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 409;
        message = 'Resource already exists';
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    if (statusCode >= 500) {
        if (process.env.SENTRY_DSN?.trim()) {
            Sentry.captureException(err);
        }
        logger.error({ err, statusCode, method: req.method, url: req.url }, message);
    } else {
        logger.warn({ statusCode, method: req.method, url: req.url }, message);
    }

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorHandler;
