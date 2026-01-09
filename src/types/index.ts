export interface QRData {
    merchantID: string;
    amount: string;
    reference: string;
    billPaymentRef1: string;
    billPaymentRef2: string;
}

export interface OCRData {
    amount: string | null;
    fee: string | null;
    date: string | null;
    time: string | null;
    reference: string | null;
    transactionNo: string | null;
    fromAccount: string | null;
    toAccount: string | null;
    transferType: string | null;
}

export interface SlipData {
    qrData: QRData | null;
    ocrData: OCRData | null;
    slipImage: string;
}

export interface User {
    _id: string;
    idCard: string;
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: 'user' | 'admin';
    createdAt?: string;
}

export interface Lock {
    id: string; // e.g., 'A1', 'B2'
    zone: string; // 'A', 'B', 'C'
    price: number;
    status: 'available' | 'booked' | 'maintenance';
    bookedBy?: string; // User ID
}

export interface ZonePrice {
    zone: string;
    price: number;
    color: string;
}
