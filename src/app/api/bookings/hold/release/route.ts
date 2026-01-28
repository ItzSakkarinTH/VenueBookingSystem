import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import { getUserFromCookie } from '@/lib/auth';

export async function DELETE(req: Request) {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const lockIds = searchParams.get('lockIds')?.split(',');
        const date = searchParams.get('date');

        if (!lockIds || !date) {
            return NextResponse.json({ error: 'Missing params' }, { status: 400 });
        }

        // Only delete if it's awaiting_payment and owned by this user
        await Booking.deleteMany({
            lockId: { $in: lockIds },
            date,
            userId: user.userId,
            status: 'awaiting_payment'
        });

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
