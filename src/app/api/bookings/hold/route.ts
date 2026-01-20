import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import LockHold from '@/models/LockHold';
import { getUserFromCookie } from '@/lib/auth';

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

        // 1. Check if any are already BOOKED (Permanent)
        const existingBookings = await Booking.find({
            date,
            lockId: { $in: lockIds },
            status: { $ne: 'rejected' } // If rejected, it might be free, but let's be safe. Usually 'approved' or 'pending'
        });

        if (existingBookings.length > 0) {
            const bookedIds = existingBookings.map(b => b.lockId);
            return NextResponse.json({
                error: 'บางรายการถูกจองไปแล้ว',
                unavailable: bookedIds
            }, { status: 409 });
        }

        // 2. Check if any are HELD by OTHERS
        // We find valid holds that are NOT by this user
        const existingHolds = await LockHold.find({
            date,
            lockId: { $in: lockIds },
            userId: { $ne: userId },
            expiresAt: { $gt: new Date() } // active holds
        });

        if (existingHolds.length > 0) {
            const heldIds = existingHolds.map(h => h.lockId);
            return NextResponse.json({
                error: 'บางรายการกำลังถูกทำรายการโดยผู้อื่น',
                unavailable: heldIds
            }, { status: 409 });
        }

        // 3. Create or Refresh Holds
        // We delete existing holds by THIS user for these locks (to refresh)
        await LockHold.deleteMany({
            date,
            lockId: { $in: lockIds },
            userId: userId
        });

        const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute from now

        const holdDocs = lockIds.map(id => ({
            lockId: id,
            date,
            userId,
            expiresAt
        }));

        await LockHold.insertMany(holdDocs);

        return NextResponse.json({ success: true, expiresAt });

    } catch (err: unknown) {
        console.error(err);
        return NextResponse.json({ error: (err as Error).message || 'Server error' }, { status: 500 });
    }
}
