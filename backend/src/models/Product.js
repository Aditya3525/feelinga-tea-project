import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    slug: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: 100,
    },
    type: {
        type: String,
        required: true,
        enum: ['Black Tea', 'Green Tea', 'White Tea', 'Oolong', 'Herbal', 'Herbal Infusion', 'Masala Chai', 'Matcha'],
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000,
    },
    shortDescription: {
        type: String,
        maxlength: 200,
    },
    prices: {
        '50g': { type: Number },
        '100g': { type: Number, required: true },
        '200g': { type: Number },
    },
    moods: [{
        type: String,
        enum: ['energize', 'relax', 'focus', 'detox', 'glow', 'immunity'],
    }],
    origin: {
        type: String,
        required: true,
    },
    caffeine: {
        type: String,
        enum: ['none', 'low', 'medium', 'high'],
        default: 'medium',
    },
    tastingNotes: [String],
    brewingInstructions: {
        temperature: String,
        steepTime: String,
        amount: String,
    },
    images: [String],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    inStock: {
        type: Boolean,
        default: true,
    },
    stock: {
        type: Number,
        default: 100,
    },
    isBestSeller: {
        type: Boolean,
        default: false,
    },
    isNewArrival: {
        type: Boolean,
        default: true,
    },
    tags: [String],
}, {
    timestamps: true,
});

// Indexes for performance
productSchema.index({ slug: 1 });
productSchema.index({ type: 1 });
productSchema.index({ moods: 1 });
productSchema.index({ 'prices.100g': 1 });
productSchema.index({ name: 'text', type: 'text', description: 'text' });

// Virtual for default price
productSchema.virtual('price').get(function () {
    return this.prices?.['100g'] || 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
