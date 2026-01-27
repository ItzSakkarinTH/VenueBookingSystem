import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILockHold extends Document {
    lockId: string;
    date: string;
    userId: string; // or sessionId
    expiresAt: Date;
}

const LockHoldSchema = new Schema<ILockHold>(
    {
        lockId: { type: String, required: true },
        date: { type: String, required: true },
        userId: { type: String, required: true },
        expiresAt: { type: Date, required: true, index: { expires: 0 } } // TTL index
    },
    { timestamps: true }
);

// Compound index to prevent double holding
LockHoldSchema.index({ lockId: 1, date: 1 }, { unique: true });

const LockHold: Model<ILockHold> = mongoose.models.LockHold || mongoose.model<ILockHold>('LockHold', LockHoldSchema);

export default LockHold;
