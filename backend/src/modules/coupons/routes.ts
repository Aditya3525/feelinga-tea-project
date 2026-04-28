import { Router } from 'express';
import Coupon from '../../models/Coupon.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// GET /coupons/campaign/active — Fetch currently active, admin-enabled campaign
router.get('/campaign/active', async (_req, res) => {
    try {
        const now = new Date();
        const coupon = await Coupon.findOne({
            active: true,
            featuredOnStore: true,
            validFrom: { $lte: now },
            validTo: { $gte: now },
        })
            .sort({ priority: -1, updatedAt: -1 })
            .lean();

        if (!coupon) {
            return res.json({ status: 'success', data: null });
        }

        const discountDisplay = coupon.discountType === 'percentage'
            ? `${coupon.discountValue}% OFF`
            : `Flat ₹${coupon.discountValue} OFF`;

        const minOrderText = coupon.minOrderAmount
            ? `Min order ₹${coupon.minOrderAmount}`
            : null;

        const maxDiscountText = coupon.maxDiscount && coupon.discountType === 'percentage'
            ? `Max discount ₹${coupon.maxDiscount}`
            : null;

        const details = [minOrderText, maxDiscountText].filter(Boolean).join(' • ');

        return res.json({
            status: 'success',
            data: {
                id: coupon._id,
                name: coupon.name || coupon.code,
                code: coupon.code,
                campaignType: coupon.campaignType || 'regular',
                campaignLabel: coupon.campaignLabel || null,
                bannerText: coupon.bannerText || `${discountDisplay} with code ${coupon.code}`,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountDisplay,
                details: details || null,
                validTo: coupon.validTo,
            },
        });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// POST /coupons/validate — Validate and calculate coupon discount
router.post('/validate', authenticate, async (req, res) => {
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

export default router;
