import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import { getUserFromCookie } from '@/lib/auth';

export async function GET() {
    await dbConnect();
    const userData = await getUserFromCookie();

    if (!userData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all bookings by this user, sorted by date descending
        const bookings = await Booking.find({ userId: userData.userId })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ bookings });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}
