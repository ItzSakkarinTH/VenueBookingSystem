import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getUserFromCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
    await dbConnect();
    const userData = await getUserFromCookie();
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(userData.userId).select('-password');
    return NextResponse.json({ user });
}

export async function PUT(req: Request) {
    await dbConnect();
    const userData = await getUserFromCookie();
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, email, phone, password } = await req.json();
    const updateData: { name: string; email: string; phone: string; password?: string } = { name, email, phone };

    if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await User.findByIdAndUpdate(userData.userId, updateData);
    return NextResponse.json({ success: true });
}
