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
