import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: '',
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    campaignType: {
        type: String,
        enum: ['regular', 'seasonal', 'festival'],
        default: 'regular',
    },
    campaignLabel: {
        type: String,
        trim: true,
        default: '',
    },
    bannerText: {
        type: String,
        trim: true,
        default: '',
    },
    featuredOnStore: {
        type: Boolean,
        default: false,
    },
    priority: {
        type: Number,
        default: 0,
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
couponSchema.index({ featuredOnStore: 1, active: 1, validFrom: 1, validTo: 1, priority: -1 });

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
