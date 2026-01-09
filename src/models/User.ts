import mongoose, { Schema, Document, Model } from 'mongoose';
import { User as UserType } from '@/types';

// We extend the UserType but omit _id for the schema definition logic if needed, 
// usually we just define the schema matching the interface.

interface IUserDocument extends Omit<UserType, '_id' | 'createdAt'>, Document {
    password?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true },
        password: { type: String, required: true },
        idCard: { type: String, required: true, unique: true }, // National ID
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
    },
    { timestamps: true }
);

const User: Model<IUserDocument> = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
