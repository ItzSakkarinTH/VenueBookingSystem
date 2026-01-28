import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LockQueue from '@/models/LockQueue';
import { getUserFromCookie } from '@/lib/auth';

export async function DELETE(req: Request) {
    await dbConnect();
    const user = await getUserFromCookie();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const lockId = searchParams.get('lockId');
        const date = searchParams.get('date');

        if (!lockId || !date) {
            return NextResponse.json({ error: 'Missing params' }, { status: 400 });
        }

        await LockQueue.deleteMany({
            lockId,
            date,
            userId: user.userId
        });

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
