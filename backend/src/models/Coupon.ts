import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    description: { type: String, default: '' },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0,
    },
    minOrderAmount: {
        type: Number,
        default: 0,
    },
    maxDiscount: {
        type: Number, // cap for percentage discounts
        default: null,
    },
    usageLimit: {
        type: Number,
        default: null,
    },
    perUserLimit: {
        type: Number,
        default: null,
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    active: {
        type: Boolean,
        default: true,
    },
    validFrom: {
        type: Date,
        required: true,
    },
    validTo: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
});

couponSchema.index({ validTo: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
