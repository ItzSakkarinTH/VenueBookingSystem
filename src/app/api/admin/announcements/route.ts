import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Announcement from '@/models/Announcement';

export async function POST(req: Request) {
    await dbConnect();
    const body = await req.json();
    await Announcement.updateMany({}, { active: false }); // Deactivate others if single announcement logic
    const announcement = await Announcement.create({ ...body, active: true });
    return NextResponse.json({ success: true, announcement });
}
