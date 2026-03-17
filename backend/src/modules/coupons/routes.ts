import { Router } from 'express';
import Coupon from '../../models/Coupon.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

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
