import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    subscribedAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    unsubscribeToken: { type: String, unique: true, sparse: true },
}, { timestamps: true });

export default mongoose.model('NewsletterSubscriber', newsletterSchema);
