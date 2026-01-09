import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export interface DecodedToken {
    userId: string;
    role: string;
}

export async function getUserFromCookie() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
        return decoded;
    } catch (err) {
        return null;
    }
}

export function signToken(payload: { userId: string; role: string }) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
