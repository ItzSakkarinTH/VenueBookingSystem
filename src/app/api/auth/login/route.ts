import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    await dbConnect();
    try {
        const { email, password } = await req.json();

        // Escape special characters for regex
        const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } });

        if (!user) {
            console.log(`Login failed: User not found for email: ${email}`);
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) {
            console.log(`Login failed: Password mismatch for user: ${email}`);
            return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
        }

        const token = signToken({ userId: user._id.toString(), role: user.role });
        const cookieStore = await cookies();
        cookieStore.set('token', token, { httpOnly: true, path: '/' }); // Secure HTTP Only
        cookieStore.set('role', user.role, { path: '/' }); // Readable for UI changes
        // Use encodeURIComponent to handle special characters (Thai) in cookies safely
        cookieStore.set('name', encodeURIComponent(user.name), { path: '/' });

        return NextResponse.json({ success: true, user: { name: user.name, role: user.role } });
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
