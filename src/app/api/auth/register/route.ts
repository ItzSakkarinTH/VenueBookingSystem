import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    await dbConnect();
    try {
        const { name, phone, password, idCard } = await req.json();

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ phone }, { idCard }] });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this phone or ID card already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            phone,
            idCard,
            password: hashedPassword,
            role: 'user', // Default role
        });

        // Auto login
        const token = signToken({ userId: user._id.toString(), role: user.role });
        const cookieStore = await cookies();
        cookieStore.set('token', token, { httpOnly: true, path: '/' });
        cookieStore.set('role', user.role, { path: '/' }); // Client readable for UI
        // Use encodeURIComponent to handle special characters (Thai) in cookies safely
        cookieStore.set('name', encodeURIComponent(user.name), { path: '/' });

        return NextResponse.json({ success: true, user: { name: user.name, role: user.role } });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
