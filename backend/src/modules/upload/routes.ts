import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads go to <project-root>/uploads/products/
const uploadsDir = path.resolve(__dirname, '..', '..', '..', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = crypto.randomBytes(12).toString('hex');
        cb(null, `${name}${ext}`);
    },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, WebP, GIF, and AVIF images are allowed'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});

const router = Router();

// POST /upload/images — Upload one or more product images (admin only)
router.post('/images', upload.array('images', 10), (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No files uploaded' });
        }

        const urls = files.map(f => `/uploads/products/${f.filename}`);

        res.json({
            status: 'success',
            data: {
                urls,
                count: urls.length,
            },
        });
    } catch (err) {
        next(err);
    }
});

// DELETE /upload/images — Delete an uploaded image (admin only)
router.delete('/images', (req: Request, res: Response, next: NextFunction) => {
    try {
        const { url } = req.body;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ status: 'error', message: 'Image URL required' });
        }

        // Only allow deleting files in our uploads directory
        const filename = path.basename(url);
        const filePath = path.join(uploadsDir, filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ status: 'success', message: 'Image deleted' });
    } catch (err) {
        next(err);
    }
});

export default router;
