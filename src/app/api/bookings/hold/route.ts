import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import { getUserFromCookie } from '@/lib/auth';
import { GENERATE_LOCKS } from '@/lib/constants';

export async function POST(req: Request) {
    await dbConnect();
    const user = await getUserFromCookie();

    // Require login
    if (!user) {
        return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบจอง' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { lockIds, date } = body; // lockIds is array of strings

        if (!lockIds || !Array.isArray(lockIds) || lockIds.length === 0 || !date) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const userId = user.userId;

        // 1. Check if any are already BOOKED or HELD by OTHERS
        const existingBookings = await Booking.find({
            date,
            lockId: { $in: lockIds },
            status: { $in: ['pending', 'approved', 'awaiting_payment'] }
        });

        const bookingsByOthers = existingBookings.filter(b => b.userId?.toString() !== userId);

        if (bookingsByOthers.length > 0) {
            const bookedIds = bookingsByOthers.map(b => b.lockId);
            return NextResponse.json({
                error: 'บางรายการถูกจองหรือกำลังมีคนทำรายการอยู่',
                unavailable: bookedIds
            }, { status: 409 });
        }

        // 2. Clear existing awaiting_payment bookings by THIS user for these locks (to refresh)
        await Booking.deleteMany({
            date,
            lockId: { $in: lockIds },
            userId: userId,
            status: 'awaiting_payment'
        });

        // 3. Determine Price
        const d = new Date(date);
        const dayType = d.getDay() === 0 ? 'Sunday' : 'Saturday';
        const allLocks = GENERATE_LOCKS(dayType);

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

        const bookingDocs = lockIds.map(id => {
            const lockDef = allLocks.find(l => l.id === id);
            return {
                lockId: id,
                zone: lockDef?.zone || id.charAt(0),
                date,
                userId,
                status: 'awaiting_payment' as const,
                amount: lockDef?.price || 43,
                paymentDeadline: expiresAt
            };
        });

        await Booking.insertMany(bookingDocs);

        return NextResponse.json({ success: true, expiresAt });

    } catch (err: unknown) {
        console.error(err);
        return NextResponse.json({ error: (err as Error).message || 'Server error' }, { status: 500 });
    }
}

