import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Announcement from '@/models/Announcement';

export async function GET() {
    await dbConnect();
    const announcement = await Announcement.findOne({ active: true }).sort({ createdAt: -1 });
    return NextResponse.json({ announcement });
}
