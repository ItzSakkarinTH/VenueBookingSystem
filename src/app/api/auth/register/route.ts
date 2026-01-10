import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    await dbConnect();
    try {
        const { name, email, phone, password, idCard } = await req.json();

        // Check if user exists
        // Escape special characters for regex
        const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Check if user exists (case-insensitive for email)
        const existingUser = await User.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } },
                { phone },
                { idCard }
            ]
        });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this email, phone, or ID card already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: email.toLowerCase(),
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
