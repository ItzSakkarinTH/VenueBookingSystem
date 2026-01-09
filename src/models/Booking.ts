import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
    userId: mongoose.Types.ObjectId;
    lockId: string; // e.g. 'A1', 'B2'
    date: string; // YYYY-MM-DD
    status: 'pending' | 'approved' | 'rejected';
    amount: number;
    slipImage?: string;
    paymentDetails?: any; // Store OCR/QR data if needed
    createdAt: Date;
    updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        lockId: { type: String, required: true },
        date: { type: String, required: true }, // Format: YYYY-MM-DD
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        amount: { type: Number, required: true },
        slipImage: { type: String },
        paymentDetails: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

// Compound index to prevent double booking for the same lock on the same date
// This is the CRITICAL part for concurrency - DB level constraint.
BookingSchema.index({ lockId: 1, date: 1 }, { unique: true });

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
