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
        .select('lockId userId guestName guestPhone status')
        .lean();

    // Mapping for frontend - map 'awaiting_payment' to 'holding' status
    const transformedBookings = bookings.map(b => {
        if (b.status === 'awaiting_payment') {
            return {
                ...b,
                status: 'holding',
                guestName: 'กำลังทำรายการ',
                isHold: true
            };
        }
        return b;
    });

    return NextResponse.json({ bookings: transformedBookings });
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

        // 1. Try to update existing 'awaiting_payment' bookings
        const updateResult = await Booking.updateMany(
            {
                date,
                lockId: { $in: lockIds },
                userId: user.userId,
                status: 'awaiting_payment'
            },
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

        // 2. If some were NOT updated (e.g. they didn't go through hold or it expired),
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
                    userId: user.userId
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

