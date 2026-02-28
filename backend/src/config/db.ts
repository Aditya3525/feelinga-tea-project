import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string);
        console.log(`✓ MongoDB connected: ${conn.connection.host}`);
    } catch (err: any) {
        console.error(`✗ MongoDB connection error: ${err.message}`);
        process.exit(1);
    }
};

export default connectDB;
