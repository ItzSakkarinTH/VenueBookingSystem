import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILockQueue extends Document {
    lockId: string;
    date: string;
    userId: string;
    expiresAt: Date;
}

const LockQueueSchema = new Schema<ILockQueue>(
    {
        lockId: { type: String, required: true },
        date: { type: String, required: true },
        userId: { type: String, required: true },
        expiresAt: { type: Date, required: true, index: { expires: 0 } } // TTL index
    },
    { timestamps: true }
);

// We allow multiple users for the same lock/date, so no unique index on lockId/date
// But maybe unique on lockId/date/userId to prevent one user from joining multiple times
LockQueueSchema.index({ lockId: 1, date: 1, userId: 1 }, { unique: true });

const LockQueue: Model<ILockQueue> = mongoose.models.LockQueue || mongoose.model<ILockQueue>('LockQueue', LockQueueSchema);

export default LockQueue;
