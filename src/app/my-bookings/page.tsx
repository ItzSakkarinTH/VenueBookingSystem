'use client';

import { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Calendar,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Receipt,
    ArrowLeft,
    Package
} from 'lucide-react';

interface Booking {
    _id: string;
    lockId: string;
    zone?: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    amount: number;
    productType?: string;
    createdAt: string;
    approvedAt?: string;
    slipImage?: string;
}

const statusConfig = {
    pending: {
        label: 'รอตรวจสอบ',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        icon: AlertCircle
    },
    approved: {
        label: 'อนุมัติแล้ว',
        color: '#10b981',
        bgColor: '#d1fae5',
        icon: CheckCircle
    },
    rejected: {
        label: 'ไม่อนุมัติ',
        color: '#ef4444',
        bgColor: '#fee2e2',
        icon: XCircle
    }
};

const productTypeLabels: Record<string, string> = {
    general: 'สินค้าทั่วไป',
    food: 'อาหาร',
    clothing: 'เสื้อผ้า',
    electronics: 'อิเล็กทรอนิกส์',
    other: 'อื่นๆ'
};

export default function MyBookingsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        // Check login
        const nameCookie = getCookie('name');
        const roleCookie = getCookie('role');
        if (!nameCookie && !roleCookie) {
            router.push('/login?redirect=/my-bookings');
            return;
        }

        // Fetch bookings
        fetch('/api/user/bookings')
            .then(res => res.json())
            .then(data => {
                if (data.bookings) {
                    setBookings(data.bookings);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [router]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatCreatedAt = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Group bookings by status
    const upcomingBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return bookingDate >= today && b.status !== 'rejected';
    });

    const pastBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return bookingDate < today || b.status === 'rejected';
    });

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link
                    href="/booking"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-muted)',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                    }}
                >
                    <ArrowLeft size={18} /> กลับหน้าจอง
                </Link>
                <h1 style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <Receipt size={28} color="var(--primary-orange)" />
                    ประวัติการจองของฉัน
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    ติดตามสถานะและดูรายละเอียดการจองทั้งหมด
                </p>
            </div>

            {loading ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid var(--border)',
                        borderTopColor: 'var(--primary-orange)',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : bookings.length === 0 ? (
                <div className="card" style={{
                    padding: '4rem 2rem',
                    textAlign: 'center'
                }}>
                    <Package size={60} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        ยังไม่มีประวัติการจอง
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        เริ่มจองล็อกตลาดนัดได้เลย!
                    </p>
                    <Link
                        href="/booking"
                        className="btn-primary"
                        style={{ display: 'inline-block', padding: '0.75rem 2rem' }}
                    >
                        จองล็อกเลย
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Upcoming Bookings */}
                    {upcomingBookings.length > 0 && (
                        <section>
                            <h2 style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: 'var(--primary-orange)',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Calendar size={18} />
                                การจองที่กำลังจะมาถึง ({upcomingBookings.length})
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {upcomingBookings.map(booking => (
                                    <BookingCard
                                        key={booking._id}
                                        booking={booking}
                                        isExpanded={expandedId === booking._id}
                                        onToggle={() => setExpandedId(expandedId === booking._id ? null : booking._id)}
                                        formatDate={formatDate}
                                        formatCreatedAt={formatCreatedAt}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Past Bookings */}
                    {pastBookings.length > 0 && (
                        <section>
                            <h2 style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: 'var(--text-muted)',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Clock size={18} />
                                ประวัติที่ผ่านมา ({pastBookings.length})
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {pastBookings.map(booking => (
                                    <BookingCard
                                        key={booking._id}
                                        booking={booking}
                                        isExpanded={expandedId === booking._id}
                                        onToggle={() => setExpandedId(expandedId === booking._id ? null : booking._id)}
                                        formatDate={formatDate}
                                        formatCreatedAt={formatCreatedAt}
                                        isPast
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

// Booking Card Component
function BookingCard({
    booking,
    isExpanded,
    onToggle,
    formatDate,
    formatCreatedAt,
    isPast = false
}: {
    booking: Booking;
    isExpanded: boolean;
    onToggle: () => void;
    formatDate: (date: string) => string;
    formatCreatedAt: (date: string) => string;
    isPast?: boolean;
}) {
    const status = statusConfig[booking.status];
    const StatusIcon = status.icon;

    return (
        <div
            className="card"
            style={{
                overflow: 'hidden',
                opacity: isPast ? 0.85 : 1,
                transition: 'all 0.2s'
            }}
        >
            {/* Main Row */}
            <div
                onClick={onToggle}
                style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? '#fafafa' : 'white'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Lock Badge */}
                    <div style={{
                        width: '50px',
                        height: '50px',
                        background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <MapPin size={16} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{booking.lockId}</span>
                    </div>

                    {/* Info */}
                    <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                            {formatDate(booking.date)}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            ล็อก {booking.lockId} • โซน {booking.zone || booking.lockId.charAt(0)} • {booking.amount} บาท
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Status Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.75rem',
                        background: status.bgColor,
                        color: status.color,
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                    }}>
                        <StatusIcon size={14} />
                        <span className="hidden-mobile">{status.label}</span>
                    </div>

                    {/* Expand Icon */}
                    {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div style={{
                    padding: '1rem 1.25rem',
                    borderTop: '1px solid var(--border)',
                    background: '#fafafa'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem'
                    }}>
                        <DetailItem label="รหัสการจอง" value={booking._id.slice(-8).toUpperCase()} />
                        <DetailItem label="วันที่จอง" value={formatCreatedAt(booking.createdAt)} />
                        <DetailItem label="ตำแหน่ง" value={`ล็อก ${booking.lockId}`} />
                        <DetailItem label="โซน" value={`โซน ${booking.zone || booking.lockId.charAt(0)}`} />
                        <DetailItem label="ยอดชำระ" value={`${booking.amount} บาท`} />
                        <DetailItem label="ประเภทสินค้า" value={productTypeLabels[booking.productType || 'general'] || booking.productType || '-'} />
                        <DetailItem label="สถานะ" value={status.label} color={status.color} />
                    </div>

                    {/* Slip Image if available */}
                    {booking.slipImage && (
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                หลักฐานการชำระเงิน
                            </div>
                            <img
                                src={booking.slipImage}
                                alt="Slip"
                                style={{
                                    maxWidth: '200px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)'
                                }}
                            />
                        </div>
                    )}

                    {/* Status Message */}
                    {booking.status === 'pending' && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            background: '#fff7ed',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#92400e',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertCircle size={16} />
                            กำลังรอการตรวจสอบจากผู้ดูแลระบบ โปรดรอสักครู่
                        </div>
                    )}
                    {booking.status === 'approved' && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            background: '#ecfdf5',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#065f46',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <CheckCircle size={16} />
                            <div>
                                <div>การจองได้รับการอนุมัติแล้ว พบกันที่ตลาดนัด!</div>
                                {booking.approvedAt && (
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
                                        อนุมัติเมื่อ: {formatCreatedAt(booking.approvedAt)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {booking.status === 'rejected' && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            background: '#fef2f2',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#991b1b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <XCircle size={16} />
                            การจองไม่ได้รับการอนุมัติ กรุณาติดต่อผู้ดูแลระบบ
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Detail Item Component
function DetailItem({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                {label}
            </div>
            <div style={{ fontWeight: '600', color: color || 'var(--text-main)' }}>
                {value}
            </div>
        </div>
    );
}
