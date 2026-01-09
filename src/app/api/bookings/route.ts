import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });

    const bookings = await Booking.find({ date }, { lockId: 1, userId: 1, status: 1 });
    return NextResponse.json({ bookings });
}

export async function POST(req: Request) {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { lockId, date, amount, slipImage, paymentDetails } = body;

        // Create Booking
        // The Unique Index on (lockId, date) will prevent duplicates/race conditions
        const booking = await Booking.create({
            userId: user.userId,
            lockId,
            date,
            amount,
            slipImage,
            paymentDetails,
            status: 'pending' // Admin needs to approve? User said "Who transfers first... Approve first". 
            // If we want auto-approve based on first-come, we can set it to 'approved' but usually slip needs verification.
            // However, the constraint is "First Book gets the lock". 
            // So creation IS the reservation.
        });

        return NextResponse.json({ success: true, booking });
    } catch (err: any) {
        if (err.code === 11000) {
            return NextResponse.json({ error: 'This lock is already booked by someone else.' }, { status: 409 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
