import mongoose from 'mongoose';
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // e.g., 'orderNumber'
    seq: { type: Number, default: 0 },
});
counterSchema.statics.getNext = async function (name) {
    const counter = await this.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true, upsert: true });
    return counter.seq;
};
const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
