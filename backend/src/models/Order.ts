import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    name: { type: String, required: true },
    size: { type: String, default: '100g' },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    image: String,
}, { _id: false });

const addressSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderNumber: {
        type: String,
        unique: true,
        required: true,
    },
    items: [orderItemSchema],
    shippingAddress: addressSchema,
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'cod'],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    notes: String,
}, {
    timestamps: true,
});

// Auto-generate order number before validation so required check passes
orderSchema.pre('validate', async function (next) {
    if (!this.isNew || this.orderNumber) return next();

    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `FLG-${String(count + 100001).slice(-6)}`;
    next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
