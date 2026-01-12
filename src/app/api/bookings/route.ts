import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });

    // Include booker info for display - populate userId to get name
    const bookings = await Booking.find({ date })
        .populate('userId', 'name phone')
        .select('lockId userId guestName guestPhone status');

    return NextResponse.json({ bookings });
}

export async function POST(req: Request) {
    await dbConnect();
    const user = await getUserFromCookie();

    // Require login - no guest bookings
    if (!user) {
        return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนทำการจอง' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { lockId, zone, date, amount, slipImage, paymentDetails, productType } = body;

        const bookingData = {
            lockId,
            zone, // Store zone information
            date,
            amount,
            slipImage,
            paymentDetails,
            productType,
            status: 'pending',
            userId: user.userId
        };

        // Create Booking
        // The Unique Index on (lockId, date) will prevent duplicates/race conditions
        const booking = await Booking.create(bookingData);

        return NextResponse.json({ success: true, booking });
    } catch (err: unknown) {
        if ((err as { code?: number }).code === 11000) {
            return NextResponse.json({ error: 'This lock is already booked by someone else.' }, { status: 409 });
        }
        return NextResponse.json({ error: (err as Error).message || 'An error occurred' }, { status: 500 });
    }
}
