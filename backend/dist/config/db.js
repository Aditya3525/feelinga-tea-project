import mongoose from 'mongoose';
import logger from '../utils/logger.js';
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        logger.info({ host: conn.connection.host }, 'MongoDB connected');
        // Runtime connection event handlers
        mongoose.connection.on('error', (err) => {
            logger.error({ err }, 'MongoDB runtime error');
        });
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Mongoose will attempt to reconnect...');
        });
        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected successfully');
        });
    }
    catch (err) {
        logger.fatal({ err }, 'MongoDB connection error');
        process.exit(1);
    }
};
export default connectDB;
