import mongoose from 'mongoose';
const testimonialSchema = new mongoose.Schema({
    author: {
        type: String,
        required: [true, 'Author name is required'],
        trim: true,
        maxlength: 100,
    },
    role: {
        type: String,
        trim: true,
        maxlength: 150,
        default: 'Customer',
    },
    text: {
        type: String,
        required: [true, 'Testimonial text is required'],
        trim: true,
        maxlength: 500,
    },
    rating: {
        type: Number,
        default: 5,
        min: 1,
        max: 5,
    },
    approved: {
        type: Boolean,
        default: false,
    },
    featured: {
        type: Boolean,
        default: false,
    },
    order: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
// Index for fetching approved testimonials sorted by order
testimonialSchema.index({ approved: 1, order: 1 });
const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;
