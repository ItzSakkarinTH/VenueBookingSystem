import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
    await dbConnect();
    // Role check should be here or middleware
    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ users });
}

export async function DELETE(req: Request) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
    await dbConnect();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const user = await User.findByIdAndUpdate(id, updateData, { new: true });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, user });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
