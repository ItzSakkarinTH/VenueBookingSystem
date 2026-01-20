import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import LockHold, { ILockHold } from '@/models/LockHold';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });

    // Include booker info for display - populate userId to get name
    const bookings = await Booking.find({ date })
        .populate('userId', 'name phone')
        .select('lockId userId guestName guestPhone status')
        .lean();

    // Fetch active holds
    const holds = await LockHold.find({
        date,
        expiresAt: { $gt: new Date() }
    }).lean();

    // Transform holds to look like bookings
    const heldBookings = holds.map((h: ILockHold) => ({
        _id: h._id,
        lockId: h.lockId,
        status: 'holding',
        guestName: 'กำลังทำรายการ',
        isHold: true
    }));

    // Merge: Filter out holds that might collide with confirmed bookings
    const bookingLockIds = new Set(bookings.map((b) => b.lockId));
    const uniqueHolds = heldBookings.filter(h => !bookingLockIds.has(h.lockId));

    return NextResponse.json({ bookings: [...bookings, ...uniqueHolds] });
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
        /* eslint-disable prefer-const */
        let { lockId, lockIds, zone, date, amount, slipImage, paymentDetails, productType } = body;

        // Normalize to array
        if (lockId && !lockIds) lockIds = [lockId];
        if (!lockIds || !Array.isArray(lockIds) || lockIds.length === 0) {
            return NextResponse.json({ error: 'No locks specified' }, { status: 400 });
        }

        const amountPerLock = amount / lockIds.length;

        const bookingDocs = lockIds.map((id: string) => ({
            lockId: id,
            zone, // Assumes uniform zone or handled by frontend
            date,
            amount: amountPerLock,
            slipImage,
            paymentDetails,
            productType,
            status: 'pending',
            userId: user.userId
        }));

        // Remove active holds for this user/date/locks before booking (converting hold to booking)
        await LockHold.deleteMany({
            date,
            lockId: { $in: lockIds },
            userId: user.userId
        });

        // Create Bookings
        // The Unique Index on (lockId, date) will prevent duplicates/race conditions
        const bookings = await Booking.insertMany(bookingDocs);

        return NextResponse.json({ success: true, bookings });
    } catch (err: unknown) {
        if ((err as { code?: number }).code === 11000) {
            return NextResponse.json({ error: 'บางรายการถูกจองไปแล้ว (Duplicate)' }, { status: 409 });
        }
        return NextResponse.json({ error: (err as Error).message || 'An error occurred' }, { status: 500 });
    }
}
