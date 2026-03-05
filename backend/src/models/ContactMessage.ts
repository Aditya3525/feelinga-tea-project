import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: 'General Inquiry' },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
}, { timestamps: true });

export default mongoose.model('ContactMessage', contactMessageSchema);
