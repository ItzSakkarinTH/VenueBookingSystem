import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';

export async function GET() {
    await dbConnect();
    // Role check should be here
    const bookings = await Booking.find({}).populate('userId', 'name phone').sort({ createdAt: -1 });
    return NextResponse.json({ bookings });
}

export async function PUT(req: Request) {
    await dbConnect();
    const { id, status } = await req.json();
    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    return NextResponse.json({ success: true, booking });
}
