import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import LockQueue from '@/models/LockQueue';
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

        // 1. Check if any are already BOOKED (approved/pending) or HELD by OTHERS
        const existingBookings = await Booking.find({
            date,
            lockId: { $in: lockIds },
            status: { $in: ['pending', 'approved', 'awaiting_payment'] }
        });

        const bookedByOthers = existingBookings.filter(b =>
            b.userId?.toString() !== userId && ['pending', 'approved'].includes(b.status)
        );

        if (bookedByOthers.length > 0) {
            const bookedIds = bookedByOthers.map(b => b.lockId);
            return NextResponse.json({
                error: 'บางรายการถูกจองไปแล้ว',
                unavailable: bookedIds
            }, { status: 409 });
        }

        const heldByOthers = existingBookings.filter(b =>
            b.userId?.toString() !== userId && b.status === 'awaiting_payment'
        );

        if (heldByOthers.length > 0) {
            // Some are held by others. Add user to queue for these.
            const heldIds = heldByOthers.map(b => b.lockId);

            // Add to LockQueue for each held lock
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Queue entry lives for 10 mins

            await Promise.all(heldIds.map(async (id) => {
                await LockQueue.findOneAndUpdate(
                    { lockId: id, date, userId },
                    { expiresAt },
                    { upsert: true }
                );
            }));

            // Get queue positions
            const queueDetails = await Promise.all(heldIds.map(async (id) => {
                const q = await LockQueue.find({ lockId: id, date }).sort({ createdAt: 1 });
                const pos = q.findIndex(entry => entry.userId.toString() === userId) + 1;
                return { lockId: id, position: pos };
            }));

            return NextResponse.json({
                error: 'มีคนกำลังทำรายการอยู่ ระบบได้ลงคิวให้คุณแล้ว',
                isQueued: true,
                queueDetails,
                unavailable: heldIds
            }, { status: 409 });
        }

        // 2. If it's free now, check if there's a queue and if THIS user is the first in queue
        // (Only if there was a queue previously)
        const allQueues = await LockQueue.find({ lockId: { $in: lockIds }, date }).sort({ createdAt: 1 });

        for (const id of lockIds) {
            const lockQueue = allQueues.filter(q => q.lockId === id);
            if (lockQueue.length > 0 && lockQueue[0].userId.toString() !== userId) {
                // Someone else is first in queue!
                // We should let them have priority if the lock just became free.
                // But wait, if it's free, maybe they didn't claim it yet.
                // To keep it simple: if you are in queue, you have to wait until you are #1.
                // If you are NOT in queue but someone else is, you should be added to the end.

                await LockQueue.findOneAndUpdate(
                    { lockId: id, date, userId },
                    { expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
                    { upsert: true }
                );

                const updatedQueue = await LockQueue.find({ lockId: id, date }).sort({ createdAt: 1 });
                const pos = updatedQueue.findIndex(entry => entry.userId.toString() === userId) + 1;

                return NextResponse.json({
                    error: `มีคิวรออยู่ก่อนหน้าคุณ (คุณลำดับที่ ${pos})`,
                    isQueued: true,
                    position: pos,
                    unavailable: [id]
                }, { status: 409 });
            }
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
        const groupId = `GRP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const bookingDocs = lockIds.map(id => {
            const lockDef = allLocks.find(l => l.id === id);
            return {
                lockId: id,
                zone: lockDef?.zone || id.charAt(0),
                date,
                userId,
                status: 'awaiting_payment' as const,
                amount: lockDef?.price || 43,
                paymentDeadline: expiresAt,
                paymentGroupId: groupId
            };
        });

        await Booking.insertMany(bookingDocs);

        // Success - remove from queue if they were in it
        await LockQueue.deleteMany({
            date,
            lockId: { $in: lockIds },
            userId: userId
        });

        return NextResponse.json({ success: true, expiresAt });

    } catch (err: unknown) {
        console.error(err);
        return NextResponse.json({ error: (err as Error).message || 'Server error' }, { status: 500 });
    }
}

