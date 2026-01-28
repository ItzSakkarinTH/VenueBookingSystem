import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking, { IBooking } from '@/models/Booking';
import LockQueue, { ILockQueue } from '@/models/LockQueue';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: Request) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    interface TransformedBooking extends Partial<Omit<IBooking, 'status'>> {
        status: string;
        bookerName?: string;
        queueCount?: number;
        isHold?: boolean;
    }

    let transformedBookings: TransformedBooking[] = [];
    let queues: ILockQueue[] = [];

    if (date) {
        // Include booker info for display - populate userId to get name
        const bookings = await Booking.find({ date })
            .populate('userId', 'name phone')
            .select('lockId userId guestName guestPhone status paymentDeadline paymentGroupId')
            .lean();

        // Fetch queues for this date
        queues = await LockQueue.find({ date }).lean();

        // Mapping for frontend - map 'awaiting_payment' to 'holding' status
        transformedBookings = bookings.map(b => {
            const queueForLock = queues.filter(q => q.lockId === b.lockId);
            const queueCount = queueForLock.length;

            if (b.status === 'awaiting_payment') {
                return {
                    ...b,
                    status: 'holding',
                    guestName: 'กำลังทำรายการ',
                    isHold: true,
                    queueCount
                };
            }
            return {
                ...b,
                queueCount
            };
        });
    } else {
        // Even without date, we might want to know all queues in general for the user
        queues = await LockQueue.find().lean();
    }

    const user = await getUserFromCookie();

    const formattedUserQueues = queues
        .filter(q => user && q.userId.toString() === user.userId)
        .map(uq => {
            const lockQueue = queues
                .filter(q => q.lockId === uq.lockId && q.date === uq.date)
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            const position = lockQueue.findIndex(q => q._id.toString() === uq._id.toString()) + 1;

            return {
                lockId: uq.lockId,
                date: uq.date,
                position,
                expiresAt: uq.expiresAt
            };
        });

    // Find any active hold by this user (check database directly to be sure and scope independent)
    const myActiveHold = user ? await Booking.findOne({
        status: 'awaiting_payment',
        userId: user.userId
    }).lean() : null;

    return NextResponse.json({
        bookings: transformedBookings,
        userQueues: formattedUserQueues,
        myActiveHold
    });
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
        let { lockId, lockIds, paymentGroupId, zone, date, amount, slipImage, paymentDetails, productType } = body;

        // 1. If we have a paymentGroupId, identify the locks first
        if (paymentGroupId && (!lockIds || lockIds.length === 0)) {
            const groupBookings = await Booking.find({ paymentGroupId, userId: user.userId });
            lockIds = groupBookings.map(b => b.lockId);
            if (!date && groupBookings.length > 0) date = groupBookings[0].date;
        }

        // Normalize to array
        if (lockId && (!lockIds || lockIds.length === 0)) lockIds = [lockId];
        if (!lockIds || !Array.isArray(lockIds) || lockIds.length === 0) {
            return NextResponse.json({ error: 'No locks specified' }, { status: 400 });
        }

        const amountPerLock = amount / lockIds.length;

        // 2. Try to update existing 'awaiting_payment' bookings
        const updateQuery: Record<string, unknown> = {
            date,
            lockId: { $in: lockIds },
            userId: user.userId,
            status: 'awaiting_payment'
        };

        // If we have a group ID, definitely include it in the query to be precise
        if (paymentGroupId) updateQuery.paymentGroupId = paymentGroupId;

        const updateResult = await Booking.updateMany(
            updateQuery,
            {
                $set: {
                    status: 'pending',
                    slipImage,
                    paymentDetails,
                    productType,
                    amount: amountPerLock
                },
                $unset: { paymentDeadline: 1 }
            }
        );

        // 3. If some were NOT updated (e.g. they didn't go through hold or it expired),
        // we check which ones are missing and try to insert them.
        const updatedCount = updateResult.modifiedCount;

        if (updatedCount < lockIds.length) {
            // Find which ones were NOT updated
            const existingInDb = await Booking.find({
                date,
                lockId: { $in: lockIds },
                status: { $in: ['pending', 'approved', 'awaiting_payment'] }
            });
            const existingLockIds = new Set(existingInDb.map(b => b.lockId));
            const missingLockIds = lockIds.filter(id => !existingLockIds.has(id));

            if (missingLockIds.length > 0) {
                const newBookingDocs = missingLockIds.map((id: string) => ({
                    lockId: id,
                    zone,
                    date,
                    amount: amountPerLock,
                    slipImage,
                    paymentDetails,
                    productType,
                    status: 'pending',
                    userId: user.userId,
                    paymentGroupId // Keep it in the group even if manually entered
                }));
                await Booking.insertMany(newBookingDocs);
            } else if (updatedCount === 0) {
                // Nothing updated and nothing missing to insert? Means they were taken by others
                return NextResponse.json({ error: 'บางรายการถูกจองไปแล้วโดยผู้อื่น' }, { status: 409 });
            }
        }

        // Fetch all relevant bookings to return
        const finalBookings = await Booking.find({
            date,
            lockId: { $in: lockIds },
            userId: user.userId
        });

        return NextResponse.json({ success: true, bookings: finalBookings });
    } catch (err: unknown) {
        if ((err as { code?: number }).code === 11000) {
            return NextResponse.json({ error: 'บางรายการถูกจองไปแล้ว (Duplicate)' }, { status: 409 });
        }
        return NextResponse.json({ error: (err as Error).message || 'An error occurred' }, { status: 500 });
    }
}

