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

    try {
        const body = await req.json();
        const { lockId, date, amount, slipImage, paymentDetails, guestName, guestPhone, guestIdCard } = body;

        // Validation for guest
        if (!user && (!guestName || !guestPhone)) {
            return NextResponse.json({ error: 'Guest name and phone are required' }, { status: 400 });
        }

        const bookingData: {
            lockId: string;
            date: string;
            amount: number;
            slipImage: string;
            paymentDetails: Record<string, unknown>;
            status: string;
            userId?: string;
            guestName?: string;
            guestPhone?: string;
            guestIdCard?: string;
        } = {
            lockId,
            date,
            amount,
            slipImage,
            paymentDetails,
            status: 'pending'
        };

        if (user) {
            bookingData.userId = user.userId;
        } else {
            bookingData.guestName = guestName;
            bookingData.guestPhone = guestPhone;
            bookingData.guestIdCard = guestIdCard;
        }

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
