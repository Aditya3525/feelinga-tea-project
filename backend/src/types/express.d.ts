import { Document, Types } from 'mongoose';

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    role: 'customer' | 'admin';
    phone?: string;
    wishlist: Types.ObjectId[];
    addresses: {
        _id: Types.ObjectId;
        label: 'Home' | 'Work' | 'Other';
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
        isDefault: boolean;
    }[];
    refreshToken?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
