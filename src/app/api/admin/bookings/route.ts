import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';

export async function GET() {
    await dbConnect();
    // Role check should be here
    // Populate user data including email and idCard for admin verification
    const bookings = await Booking.find({ status: { $ne: 'awaiting_payment' } })
        .populate('userId', 'name phone email idCard')
        .sort({ createdAt: -1 });
    return NextResponse.json({ bookings });
}

export async function PUT(req: Request) {
    await dbConnect();
    const { id, status } = await req.json();

    // Set approvedAt if status is being set to approved
    const updateData: { status: string; approvedAt?: Date } = { status };
    if (status === 'approved') {
        updateData.approvedAt = new Date();
    }

    const booking = await Booking.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, booking });
}
