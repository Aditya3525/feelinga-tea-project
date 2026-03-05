import { AppError } from './errorHandler.js';
// Validate request body/query/params against a Zod schema
export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('. ');
            return next(new AppError(messages, 400));
        }
        req[source] = result.data; // Use parsed (cleaned) data
        next();
    };
};
