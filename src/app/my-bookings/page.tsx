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
    Package,
    CreditCard,
    X,
    Bell,
    Info
} from 'lucide-react';
import SlipReaderIntegrated from '../components/SlipReader';
import { SlipData } from '@/types';

interface Booking {
    _id: string;
    lockId: string;
    zone?: string;
    date: string;
    status: 'awaiting_payment' | 'pending' | 'approved' | 'rejected';
    amount: number;
    productType?: string;
    createdAt: string;
    approvedAt?: string;
    slipImage?: string;
    paymentDeadline?: string;
    paymentGroupId?: string;
}

const statusConfig = {
    awaiting_payment: {
        label: 'รอชำระเงิน',
        color: '#e11d48',
        bgColor: '#ffe4e6',
        icon: Clock
    },
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
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    // Custom Alert / Notification
    const [notification, setNotification] = useState<{
        show: boolean;
        title: string;
        message: string;
        type: 'success' | 'info' | 'error';
    }>({ show: false, title: '', message: '', type: 'info' });

    const showAlert = (title: string, message: string, type: 'success' | 'info' | 'error' = 'info') => {
        setNotification({ show: true, title, message, type });
    };

    useEffect(() => {
        setMounted(true);
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

    // Group bookings by status and then by paymentGroupId
    const groupBookings = (list: Booking[]) => {
        const groups: Record<string, Booking> = {};
        list.forEach(b => {
            const key = b.paymentGroupId || b._id;
            if (!groups[key]) {
                groups[key] = { ...b };
            } else {
                // Combine lockIds for the display
                groups[key].lockId = `${groups[key].lockId}, ${b.lockId}`;
                groups[key].amount += b.amount;
            }
        });
        return Object.values(groups);
    };

    const upcomingBookings = groupBookings(bookings.filter(b => {
        const bookingDate = new Date(b.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return bookingDate >= today && b.status !== 'rejected';
    }));

    const pastBookings = groupBookings(bookings.filter(b => {
        const bookingDate = new Date(b.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return bookingDate < today || b.status === 'rejected';
    }));

    if (!mounted) {
        return <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>กำลังโหลด...</div>;
    }

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
                                        onPay={(b) => setSelectedBookingForPayment(b)}
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

            {/* Payment Modal */}
            {selectedBookingForPayment && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'sticky',
                            top: 0,
                            background: 'white',
                            zIndex: 10
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>อัปโหลดหลักฐานการโอนเงิน</h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>ล็อก {selectedBookingForPayment.lockId} • {formatDate(selectedBookingForPayment.date)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedBookingForPayment(null)}
                                style={{
                                    background: '#f1f5f9',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '1.5rem' }}>
                            {error && (
                                <div style={{
                                    padding: '1rem',
                                    background: '#fef2f2',
                                    color: '#b91c1c',
                                    borderRadius: '12px',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <SlipReaderIntegrated
                                expectedAmount={selectedBookingForPayment.amount}
                                onSlipVerified={async (slipData: SlipData) => {
                                    setIsSubmitting(true);
                                    setError('');
                                    try {
                                        const res = await fetch('/api/bookings', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                lockIds: selectedBookingForPayment.lockId.split(', '),
                                                paymentGroupId: selectedBookingForPayment.paymentGroupId,
                                                date: selectedBookingForPayment.date,
                                                amount: selectedBookingForPayment.amount,
                                                slipImage: slipData.slipImage,
                                                paymentDetails: { ...slipData.qrData, ...slipData.ocrData },
                                                productType: selectedBookingForPayment.productType || 'general'
                                            })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error || 'Failed to update booking');

                                        // Success - Refresh list and close modal
                                        setSelectedBookingForPayment(null);
                                        // Simple way to refresh: refetch
                                        fetch('/api/user/bookings')
                                            .then(r => r.json())
                                            .then(d => d.bookings && setBookings(d.bookings));

                                        showAlert('สำเร็จ! ✅', 'แจ้งชำระเงินเรียบร้อยแล้ว! ระบบกำลังดำเนินการตรวจสอบครับ', 'success');
                                    } catch (err) {
                                        setError((err as Error).message);
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                onError={(msg) => setError(msg)}
                            />

                            {isSubmitting && (
                                <div style={{
                                    marginTop: '1rem',
                                    textAlign: 'center',
                                    color: 'var(--primary-orange)',
                                    fontWeight: 'bold'
                                }}>
                                    กำลังบันทึกข้อมูล...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            {notification.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, padding: '1rem',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '24px',
                        width: '100%', maxWidth: '400px',
                        padding: '2rem',
                        textAlign: 'center',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <button
                            onClick={() => setNotification({ ...notification, show: false })}
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                                width: '32px', height: '32px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#64748b'
                            }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{
                            width: '72px', height: '72px',
                            backgroundColor: notification.type === 'success' ? '#dcfce7' : notification.type === 'error' ? '#fee2e2' : '#e0f2fe',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem auto',
                            color: notification.type === 'success' ? '#22c55e' : notification.type === 'error' ? '#ef4444' : '#0ea5e9'
                        }}>
                            {notification.type === 'success' ? <CheckCircle size={40} /> : notification.type === 'error' ? <Bell size={40} /> : <Info size={40} />}
                        </div>

                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem' }}>
                            {notification.title}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            {notification.message}
                        </p>

                        <button
                            onClick={() => setNotification({ ...notification, show: false })}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: notification.type === 'success' ? '#22c55e' : notification.type === 'error' ? '#ef4444' : '#0ea5e9',
                                color: 'white',
                                borderRadius: '12px',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                boxShadow: `0 10px 15px -3px ${notification.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : notification.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(14, 165, 233, 0.3)'}`
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            ตกลง
                        </button>
                    </div>
                </div>
            )}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

// Countdown hook for the card
function useCountdown(targetDate?: string) {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        if (!targetDate) return;

        const calculate = () => {
            const now = new Date().getTime();
            const deadline = new Date(targetDate).getTime();
            const diff = Math.max(0, Math.floor((deadline - now) / 1000));
            setTimeLeft(diff);
            return diff;
        };

        calculate();
        const timer = setInterval(() => {
            const left = calculate();
            if (left <= 0) clearInterval(timer);
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return timeLeft;
}

// Booking Card Component
function BookingCard({
    booking,
    isExpanded,
    onToggle,
    formatDate,
    formatCreatedAt,
    isPast = false,
    onPay
}: {
    booking: Booking;
    isExpanded: boolean;
    onToggle: () => void;
    formatDate: (date: string) => string;
    formatCreatedAt: (date: string) => string;
    isPast?: boolean;
    onPay?: (b: Booking) => void;
}) {
    const status = statusConfig[booking.status];
    const StatusIcon = status.icon;
    const timeLeft = useCountdown(booking.paymentDeadline);

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
                    {booking.status === 'awaiting_payment' && (
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{
                                padding: '1rem',
                                background: '#fff1f2',
                                borderRadius: '12px',
                                border: '1px solid #fecdd3',
                                color: '#be123c',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={18} />
                                        กรุณาชำระเงินและอัปโหลดสลิป
                                    </div>
                                    <div style={{
                                        background: '#be123c', color: 'white',
                                        padding: '0.25rem 0.75rem', borderRadius: '20px',
                                        fontSize: '0.85rem', fontWeight: 'bold'
                                    }}>
                                        เหลือเวลา: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#be123c', opacity: 0.8, marginBottom: '1rem' }}>
                                    กรุณาโอนเงินจำนวน <strong>{booking.amount} บาท</strong> และแนบหลักฐานการโอนเงินภายในเวลาที่กำหนด หากเกินกำหนดรายการจองนี้จะถูกยกเลิกโดยอัตโนมัติ
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPay?.(booking);
                                    }}
                                    disabled={timeLeft <= 0}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: timeLeft <= 0 ? '#fda4af' : '#e11d48',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        cursor: timeLeft <= 0 ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <CreditCard size={18} />
                                    {timeLeft <= 0 ? 'รายการหมดเวลาแล้ว' : 'แจ้งชำระเงิน (อัปโหลดสลิป)'}
                                </button>
                            </div>
                        </div>
                    )}

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
