import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
    userId?: mongoose.Types.ObjectId;
    guestName?: string;
    guestPhone?: string;
    guestIdCard?: string;
    lockId: string; // e.g. 'A1', 'B2'
    zone?: string; // e.g. 'A', 'B', 'C'
    date: string; // YYYY-MM-DD
    status: 'pending' | 'approved' | 'rejected';
    amount: number;
    slipImage?: string;
    paymentDetails?: Record<string, unknown>; // Store OCR/QR data if needed
    productType?: string; // 'general' | 'food' | 'other'
    createdAt: Date;
    updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional for guests
        guestName: { type: String },
        guestPhone: { type: String },
        guestIdCard: { type: String },
        lockId: { type: String, required: true },
        zone: { type: String }, // Zone A, B, C, etc.
        date: { type: String, required: true }, // Format: YYYY-MM-DD
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        amount: { type: Number, required: true },
        slipImage: { type: String },
        paymentDetails: { type: Schema.Types.Mixed },
        productType: { type: String },
    },
    { timestamps: true }
);

// Compound index to prevent double booking for the same lock on the same date
// This is the CRITICAL part for concurrency - DB level constraint.
BookingSchema.index({ lockId: 1, date: 1 }, { unique: true });

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
