import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodIssue } from 'zod';
import { AppError } from './errorHandler.js';

// Validate request body/query/params against a Zod schema
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse((req as any)[source]);
        if (!result.success) {
            const messages = result.error.issues.map((i: ZodIssue) => `${i.path.join('.')}: ${i.message}`).join('. ');
            return next(new AppError(messages, 400));
        }
        (req as any)[source] = result.data; // Use parsed (cleaned) data
        next();
    };
};
