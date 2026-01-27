'use client';

import { useState, useEffect } from 'react';

import { GENERATE_LOCKS, ZONES } from '@/lib/constants';
import SlipReaderIntegrated from '../components/SlipReader';
import { SlipData } from '@/types';
import { getCookie } from 'cookies-next';
import { Calendar, MapPin, User, CheckCircle, ChevronLeft, CreditCard, Info, Bell, X } from 'lucide-react';
import Link from 'next/link';

// Helper to generate dates
const getUpcomingDates = () => {
    const dates = [];
    const today = new Date();
    // Look ahead 4 weeks
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const day = d.getDay();

        const fullDate = d.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const shortDate = d.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short'
        });

        if (day === 6) { // Saturday
            dates.push({
                dateObj: d,
                date: d.toISOString().split('T')[0],
                label: fullDate,
                shortLabel: shortDate,
                dayName: 'วันเสาร์',
                dayNum: d.getDate(),
                key: 'Saturday' as const
            });
        }
        if (day === 0) { // Sunday
            dates.push({
                dateObj: d,
                date: d.toISOString().split('T')[0],
                label: fullDate,
                shortLabel: shortDate,
                dayName: 'วันอาทิตย์',
                dayNum: d.getDate(),
                key: 'Sunday' as const
            });
        }
    }
    return dates;
};

export default function BookingPage() {

    // Steps: 1=Date, 2=Lock, 3=Info/Payment
    const [step, setStep] = useState(1);

    // Date Selection
    const [dates, setDates] = useState<ReturnType<typeof getUpcomingDates>>([]);
    const [selectedDateInfo, setSelectedDateInfo] = useState<ReturnType<typeof getUpcomingDates>[0] | null>(null);

    interface LockDef {
        id: string;
        label: string;
        zone: string;
        price: number;
    }

    // Booking info for occupied locks (who booked)
    interface BookingInfo {
        lockId: string;
        bookerName: string;
        status: string;
    }

    // Lock Selection
    const [occupiedLocks, setOccupiedLocks] = useState<string[]>([]);
    const [bookingsInfo, setBookingsInfo] = useState<BookingInfo[]>([]);
    const [selectedLocks, setSelectedLocks] = useState<LockDef[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [locks, setLocks] = useState<LockDef[]>([]);

    // User Info
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState<{ name: string; phone: string } | null>(null);
    const [productType, setProductType] = useState('general'); // Default
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Booking Confirmation
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [bookingId, setBookingId] = useState<string>('');

    // View booked lock details
    const [viewBookedLock, setViewBookedLock] = useState<BookingInfo | null>(null);

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

    // Init
    useEffect(() => {
        setDates(getUpcomingDates());

        // Use 'name' or 'role' cookie to check login status
        // 'token' is httpOnly and cannot be read from client-side JavaScript
        const nameCookie = getCookie('name');
        const roleCookie = getCookie('role');
        const isUserLoggedIn = !!(nameCookie || roleCookie);
        setIsLoggedIn(isUserLoggedIn);

        // Fetch user profile if logged in
        if (isUserLoggedIn) {
            fetch('/api/user/profile')
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setUserInfo({ name: data.user.name, phone: data.user.phone });
                    }
                })
                .catch(() => { });
        }
    }, []);

    // Zone Selection
    const [activeZone, setActiveZone] = useState<string | null>(null);

    // Fetch Bookings when date changes
    useEffect(() => {
        if (!selectedDateInfo) return;

        // Generate locks for this day
        setLocks(GENERATE_LOCKS(selectedDateInfo.key));

        // Fetch occupied with booker info
        setLoading(true);
        fetch(`/api/bookings?date=${selectedDateInfo.date}`)
            .then(res => res.json())
            .then(data => {
                if (data.bookings) {
                    // Extract lock IDs
                    setOccupiedLocks(data.bookings.map((b: { lockId: string }) => b.lockId));

                    // Store booking info with booker names
                    interface BookingResponse {
                        lockId: string;
                        userId?: { name?: string };
                        guestName?: string;
                        status: string;
                    }
                    const infos: BookingInfo[] = data.bookings.map((b: BookingResponse) => ({
                        lockId: b.lockId,
                        bookerName: b.userId?.name || b.guestName || 'ไม่ระบุชื่อ',
                        status: b.status
                    }));
                    setBookingsInfo(infos);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));

    }, [selectedDateInfo]);

    // Timer Effect
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    showAlert('หมดเวลา!', 'หมดเวลาทำรายการจอง กรุณาเลือกล็อกใหม่ครับ', 'error');
                    setStep(2);
                    setSelectedLocks([]);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleDateSelect = (d: typeof dates[0]) => {
        setSelectedDateInfo(d);
        setStep(2);
        setSelectedLocks([]);
    };

    const handleLockClick = (lock: LockDef) => {
        if (occupiedLocks.includes(lock.id)) return;

        setSelectedLocks(prev => {
            const exists = prev.find(l => l.id === lock.id);
            if (exists) return prev.filter(l => l.id !== lock.id);
            return [...prev, lock];
        });
    };

    const handleConfirmSelection = async () => {
        if (!isLoggedIn) {
            showAlert('เข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนทำการจองพื้นที่ครับ', 'info');
            // Optionally redirect after a short delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/bookings/hold', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lockIds: selectedLocks.map(l => l.id),
                    date: selectedDateInfo?.date
                })
            });
            const data = await res.json();
            if (!res.ok) {
                showAlert('ขออภัย', data.error || 'ไม่สามารถจองได้ในขณะนี้', 'error');
                return;
            }

            // Success
            showAlert('จองสำเร็จ! 🔒', 'ระบบได้ล็อกพื้นที่ให้คุณแล้วเป็นเวลา 5 นาที กรุณาโอนเงินและอัปโหลดสลิปเพื่อยืนยันการจองครับ', 'success');
            setTimeLeft(5 * 60); // 5 minutes
            setStep(3);

        } catch {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setLoading(false);
        }
    };

    const handleSlipVerified = async (slipData: SlipData) => {
        setLoading(true);
        setError('');

        if (!selectedDateInfo || selectedLocks.length === 0) return;

        // Require login
        if (!isLoggedIn) {
            setError('กรุณาเข้าสู่ระบบก่อนทำการจอง');
            setLoading(false);
            return;
        }

        try {
            const totalAmount = selectedLocks.reduce((sum, l) => sum + l.price, 0);

            const payload = {
                lockIds: selectedLocks.map(l => l.id),
                zone: selectedLocks[0]?.zone,
                date: selectedDateInfo.date,
                amount: totalAmount,
                slipImage: slipData.slipImage,
                paymentDetails: { ...slipData.qrData, ...slipData.ocrData },
                productType: productType
            };

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Booking failed');

            // Show receipt instead of redirect
            showAlert('การชำระเงินสำเร็จ ✅', 'แจ้งชำระเงินเรียบร้อยแล้ว! แอดมินจะรีบตรวจสอบข้อมูลให้เร็วที่สุดครับ', 'success');
            setBookingId(data.bookings?.[0]?._id || data.bookingId || 'BK' + Date.now());
            setBookingConfirmed(true);
            setStep(4); // Step 4 = Receipt
            setTimeLeft(0); // Stop timer

        } catch (err: unknown) {
            setError((err as Error).message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>

            {/* Header / Stepper */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '1rem' }}>
                    จองล็อกตลาดนัด
                </h1>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                    {[
                        { id: 1, label: 'เลือกวันที่', icon: Calendar },
                        { id: 2, label: 'เลือกล็อก', icon: MapPin },
                        { id: 3, label: 'ข้อมูล & ชำระเงิน', icon: CreditCard },
                    ].map((s, idx) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', opacity: step >= s.id ? 1 : 0.5 }}>
                            <div style={{
                                width: 32, height: 32,
                                borderRadius: '50%',
                                background: step >= s.id ? 'var(--primary-orange)' : '#e2e8f0',
                                color: step >= s.id ? 'white' : '#718096',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', marginRight: '0.5rem'
                            }}>
                                {s.id}
                            </div>
                            <span className="hidden-mobile" style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                {s.label}
                            </span>
                            {idx < 2 && <div style={{ width: 40, height: 2, background: '#e2e8f0', margin: '0 0.5rem' }} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="card" style={{ padding: '1.5rem', minHeight: '400px' }}>

                {/* Back Button */}
                {step > 1 && (
                    <button
                        onClick={() => setStep(step - 1)}
                        style={{
                            background: 'none', border: 'none',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem'
                        }}
                    >
                        <ChevronLeft size={20} /> ย้อนกลับ
                    </button>
                )}

                {/* Step 1: Date Selection */}
                {step === 1 && (
                    <div>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={20} color="var(--primary-orange)" /> เลือกวันที่ต้องการจอง
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                            {dates.map((d) => (
                                <button
                                    key={d.date}
                                    onClick={() => handleDateSelect(d)}
                                    style={{
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '1rem',
                                        background: selectedDateInfo?.date === d.date ? 'var(--orange-light)' : 'white',
                                        borderColor: selectedDateInfo?.date === d.date ? 'var(--primary-orange)' : 'var(--border)',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', color: 'var(--primary-orange)', marginBottom: '0.25rem' }}>{d.dayName}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{d.label}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.5rem' }}>
                                        {d.key === 'Saturday' ? 'โซน A-C' : 'ทุกโซน'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Lock Selection */}
                {step === 2 && selectedDateInfo && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <MapPin size={20} color="var(--primary-orange)" /> เลือกตำแหน่งร้าน
                            </h2>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                {selectedDateInfo.dayName} {selectedDateInfo.label}
                            </div>
                        </div>

                        {/* Zone Selection & Map Map */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                {ZONES.filter(z => selectedDateInfo?.key === 'Sunday' || ['A', 'B', 'C'].includes(z.id)).map(z => (
                                    <button
                                        key={z.id}
                                        onClick={() => setActiveZone(activeZone === z.id ? null : z.id)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '20px',
                                            border: `1px solid ${activeZone === z.id ? z.color : '#e2e8f0'}`,
                                            background: activeZone === z.id ? z.color : 'white',
                                            color: activeZone === z.id ? 'white' : '#4a5568',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {z.name}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setActiveZone(null)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        border: '1px solid #e2e8f0',
                                        background: !activeZone ? '#4a5568' : 'white',
                                        color: !activeZone ? 'white' : '#4a5568',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    ทั้งหมด
                                </button>
                            </div>

                            {/* Map Container - Visual Zone Layout */}
                            <div style={{
                                width: '100%',
                                height: '200px',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                position: 'relative',
                                border: '1px solid #e2e8f0',
                                marginBottom: '1rem',
                                background: 'linear-gradient(135deg, #e8f5e9 0%, #f5f5f5 50%, #e3f2fd 100%)'
                            }}>
                                {/* Road */}
                                <div style={{
                                    position: 'absolute',
                                    top: '40%',
                                    left: '-5%',
                                    width: '110%',
                                    height: '60px',
                                    background: 'white',
                                    transform: 'rotate(-5deg)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-around',
                                    padding: '5px 40px'
                                }}>
                                    {/* Zone Blocks */}
                                    {ZONES.filter(z => selectedDateInfo?.key === 'Sunday' || ['A', 'B', 'C'].includes(z.id)).map(z => (
                                        <div
                                            key={z.id}
                                            onClick={() => setActiveZone(activeZone === z.id ? null : z.id)}
                                            style={{
                                                width: '80px',
                                                height: '40px',
                                                background: z.color,
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '1.2rem',
                                                cursor: 'pointer',
                                                boxShadow: activeZone === z.id ? '0 0 0 3px white, 0 0 0 5px ' + z.color : 'none',
                                                transform: activeZone === z.id ? 'scale(1.1)' : 'scale(1)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {z.id}
                                        </div>
                                    ))}
                                </div>
                                {/* Pond indicator */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: '20px',
                                    width: '80px',
                                    height: '50px',
                                    background: '#7dd3fc',
                                    borderRadius: '50%',
                                    opacity: 0.7
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '50px',
                                    width: '60px',
                                    height: '35px',
                                    background: '#7dd3fc',
                                    borderRadius: '40%',
                                    opacity: 0.6
                                }} />
                                {/* Stadium indicator */}
                                <div style={{
                                    position: 'absolute',
                                    top: '20px',
                                    left: '20px',
                                    width: '70px',
                                    height: '45px',
                                    border: '3px solid #86efac',
                                    borderRadius: '50%',
                                    background: '#dcfce7'
                                }} />
                                {/* Label */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '8px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                    background: 'rgba(255,255,255,0.8)',
                                    padding: '2px 8px',
                                    borderRadius: '4px'
                                }}>
                                    ถ.โชติพันธ์ • แตะโซนเพื่อเลือก
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังโหลด...</div>
                        ) : activeZone ? (
                            /* Show detailed lock grid when zone is selected */
                            <div style={{
                                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1.5rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                {/* Zone Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '1rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        background: ZONES.find(z => z.id === activeZone)?.color,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '1.5rem',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }}>
                                        {activeZone}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1e293b' }}>
                                            {ZONES.find(z => z.id === activeZone)?.name}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            เลือกล็อกที่ต้องการจอง • {ZONES.find(z => z.id === activeZone)?.price} บาท/ล็อก
                                        </div>
                                    </div>
                                </div>

                                {/* Lock Grid - 3 Groups of 3x3 in a row */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    gap: '1rem',
                                    flexWrap: 'nowrap',
                                    overflowX: 'auto',
                                    paddingBottom: '0.5rem'
                                }}>
                                    {[0, 1, 2].map(groupIndex => {
                                        const groupLocks = locks
                                            .filter(l => l.zone === activeZone)
                                            .slice(groupIndex * 9, (groupIndex + 1) * 9);

                                        return (
                                            <div key={groupIndex} style={{
                                                background: 'white',
                                                borderRadius: '12px',
                                                padding: '1rem',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                            }}>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                    gap: '8px'
                                                }}>
                                                    {groupLocks.map(lock => {
                                                        const isBooked = occupiedLocks.includes(lock.id);
                                                        const isSelected = selectedLocks.some(l => l.id === lock.id);
                                                        const zone = ZONES.find(z => z.id === lock.zone);
                                                        const bookingInfo = bookingsInfo.find(b => b.lockId === lock.id);

                                                        const handleClick = () => {
                                                            if (isBooked && bookingInfo) {
                                                                setViewBookedLock(bookingInfo);
                                                            } else if (!isBooked) {
                                                                handleLockClick(lock);
                                                            }
                                                        };

                                                        return (
                                                            <div
                                                                key={lock.id}
                                                                onClick={handleClick}
                                                                style={{
                                                                    width: '55px',
                                                                    height: '55px',
                                                                    borderRadius: '8px',
                                                                    border: `2px solid ${isBooked ? '#f59e0b' : isSelected ? 'var(--primary-orange)' : zone?.color}`,
                                                                    background: isBooked ? '#fef3c7' : isSelected ? 'var(--orange-light)' : 'white',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    cursor: 'pointer',
                                                                    opacity: 1,
                                                                    transition: 'all 0.2s',
                                                                    transform: isSelected ? 'scale(0.95)' : 'scale(1)',
                                                                    position: 'relative'
                                                                }}
                                                                onMouseEnter={(e) => (e.currentTarget.style.transform = isSelected ? 'scale(0.95)' : 'scale(1.05)')}
                                                                onMouseLeave={(e) => (e.currentTarget.style.transform = isSelected ? 'scale(0.95)' : 'scale(1)')}
                                                                title={isBooked ? `จองโดย: ${bookingInfo?.bookerName || 'ไม่ระบุ'}` : 'ว่าง - คลิกเพื่อจอง'}
                                                            >
                                                                <div style={{
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.9rem',
                                                                    color: isBooked ? '#b45309' : isSelected ? 'var(--primary-orange)' : zone?.color
                                                                }}>
                                                                    {lock.id}
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '0.6rem',
                                                                    color: isBooked ? '#b45309' : isSelected ? 'var(--primary-orange)' : '#64748b',
                                                                    textAlign: 'center',
                                                                    lineHeight: 1.1
                                                                }}>
                                                                    {isBooked ? '🔒 ดู' : `${lock.price}฿`}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '2rem',
                                    marginTop: '1.5rem',
                                    fontSize: '0.8rem',
                                    color: '#64748b'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            border: `2px solid ${ZONES.find(z => z.id === activeZone)?.color}`,
                                            borderRadius: '4px',
                                            background: 'white'
                                        }} />
                                        <span>ว่าง</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            background: '#fef3c7',
                                            border: '2px solid #f59e0b',
                                            borderRadius: '4px'
                                        }} />
                                        <span>จองแล้ว (คลิกดูผู้จอง)</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            background: 'var(--orange-light)',
                                            border: '2px solid var(--primary-orange)',
                                            borderRadius: '4px'
                                        }} />
                                        <span>ที่เลือก</span>
                                    </div>
                                </div>

                                {selectedLocks.length > 0 && (
                                    <div style={{
                                        position: 'fixed',
                                        bottom: '20px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        zIndex: 100,
                                        width: '90%',
                                        maxWidth: '400px'
                                    }}>
                                        <button
                                            onClick={handleConfirmSelection}
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                background: 'var(--primary-orange)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50px',
                                                fontWeight: 'bold',
                                                fontSize: '1.1rem',
                                                boxShadow: '0 4px 20px rgba(249, 115, 22, 0.4)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            ยืนยัน {selectedLocks.length} รายการ <ChevronLeft style={{ transform: 'rotate(180deg)' }} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Prompt to select a zone */
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem',
                                background: '#f8fafc',
                                borderRadius: 'var(--radius-lg)',
                                border: '2px dashed #e2e8f0'
                            }}>
                                <MapPin size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                                <div style={{ color: '#64748b', fontSize: '1rem' }}>
                                    กรุณาเลือกโซนจากแผนที่ด้านบน
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                    แตะที่ปุ่มโซน หรือ กล่องสีบนแผนที่เพื่อดูล็อกที่ว่าง
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Information & Payment */}
                {step === 3 && selectedLocks.length > 0 && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <CreditCard size={20} color="var(--primary-orange)" /> ยืนยันข้อมูลและชำระเงิน
                            </h2>
                            {timeLeft > 0 && (
                                <div style={{
                                    background: '#ffe4e6', color: '#e11d48',
                                    padding: '0.5rem 1rem', borderRadius: '20px',
                                    fontSize: '0.9rem', fontWeight: 'bold'
                                }}>
                                    ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flexWrap: 'wrap' }} className="responsive-grid">

                            {/* Summary */}
                            <div style={{ background: '#f7fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#4a5568' }}>สรุปรายการ</h3>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>วันที่:</span>
                                    <strong>{selectedDateInfo?.dayName} {selectedDateInfo?.label}</strong>
                                </div>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span>ตำแหน่ง:</span>
                                    <div style={{ textAlign: 'right' }}>
                                        {selectedLocks.map(l => (
                                            <div key={l.id}><strong>{l.id}</strong> ({l.zone})</div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'var(--primary-orange)', fontWeight: 'bold' }}>
                                    <span>ยอดชำระ:</span>
                                    <span>{selectedLocks.reduce((s, l) => s + l.price, 0)} บาท</span>
                                </div>

                                {/* Bank Account Info */}
                                <div style={{
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    background: 'white',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                                        โอนเงินไปที่
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            background: '#00a651',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            fontSize: '0.6rem'
                                        }}>
                                            KBANK
                                        </div>
                                        <div style={{ fontWeight: '600', fontSize: '1rem', color: '#1e293b' }}>
                                            ธนาคารกสิกรไทย
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem 1rem',
                                        background: '#fff7ed',
                                        borderRadius: '8px',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#78716c' }}>เลขบัญชี</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', letterSpacing: '0.5px' }}>
                                                116-8-88618-3
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                                        ชื่อบัญชี: <strong style={{ color: '#1e293b' }}>ศักรินทร์ หาญทอง</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <div>
                                {!isLoggedIn ? (
                                    /* Require Login */
                                    <div style={{
                                        padding: '2rem',
                                        background: '#fff7ed',
                                        borderRadius: '16px',
                                        textAlign: 'center',
                                        border: '1px solid #fed7aa'
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1rem auto'
                                        }}>
                                            <User size={28} color="white" />
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                                            กรุณาเข้าสู่ระบบ
                                        </h3>
                                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                            คุณต้องเข้าสู่ระบบหรือสมัครสมาชิกก่อนจองล็อก<br />
                                            เพื่อให้เราสามารถติดต่อและยืนยันตัวตนได้
                                        </p>
                                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <Link
                                                href="/login"
                                                style={{
                                                    padding: '0.75rem 2rem',
                                                    background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
                                                    color: 'white',
                                                    borderRadius: '10px',
                                                    textDecoration: 'none',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                เข้าสู่ระบบ
                                            </Link>
                                            <Link
                                                href="/register"
                                                style={{
                                                    padding: '0.75rem 2rem',
                                                    background: 'white',
                                                    color: '#e84a0e',
                                                    border: '2px solid #e84a0e',
                                                    borderRadius: '10px',
                                                    textDecoration: 'none',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                สมัครสมาชิก
                                            </Link>
                                        </div>
                                        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                            สมัครสมาชิกฟรี ไม่มีค่าใช้จ่าย!
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: '2rem', padding: '1rem', background: '#dcfce7', borderRadius: 'var(--radius-md)' }}>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534' }}>
                                            <CheckCircle size={18} /> คุณกำลังจองในชื่อ: {userInfo?.name || 'สมาชิก'}
                                        </h3>
                                        <p style={{ color: '#166534', fontSize: '0.9rem', opacity: 0.8 }}>เบอร์โทร: {userInfo?.phone || '-'}</p>
                                    </div>
                                )}                                {/* Show these only when logged in */}
                                {isLoggedIn && (
                                    <>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>ประเภทสินค้าที่ขาย *</h3>
                                            <select
                                                className="input-field"
                                                value={productType}
                                                onChange={(e) => setProductType(e.target.value)}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                                            >
                                                <option value="general">สินค้าทั่วไป (เช่น เสื้อผ้า, ของใช้)</option>
                                                <option value="food">อาหาร / เครื่องดื่ม</option>
                                                <option value="other">อื่นๆ</option>
                                            </select>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                * โปรดเลือกประเภทสินค้าให้ตรงกับล็อกที่จอง (ล็อก 40-80 สำหรับอาหาร)
                                            </p>
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>ชำระเงิน</h3>
                                            {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
                                            <SlipReaderIntegrated
                                                expectedAmount={selectedLocks.reduce((s, l) => s + l.price, 0)}
                                                onSlipVerified={handleSlipVerified}
                                                onError={(msg) => setError(msg)}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Receipt / Confirmation */}
                {step === 4 && bookingConfirmed && selectedLocks.length > 0 && selectedDateInfo && (
                    <div style={{ textAlign: 'center' }}>
                        {/* Success Animation */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <CheckCircle size={40} color="white" />
                        </div>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534', marginBottom: '0.5rem' }}>
                            จองสำเร็จ!
                        </h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            กรุณารอการตรวจสอบและอนุมัติจากแอดมิน
                        </p>

                        {/* Receipt Card */}
                        <div id="receipt-card" style={{
                            background: 'white',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            maxWidth: '400px',
                            margin: '0 auto',
                            textAlign: 'left'
                        }}>
                            {/* Receipt Header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
                                padding: '1.5rem',
                                color: 'white',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                    ใบยืนยันการจอง
                                </div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                                    ตลาดนัดคนเดินศรีสะเกษ
                                </div>
                            </div>

                            {/* Receipt Body */}
                            <div style={{ padding: '1.5rem' }}>
                                {/* Booking ID */}
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    marginBottom: '1rem',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>หมายเลขการจอง</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', letterSpacing: '1px' }}>
                                        {bookingId}
                                    </div>
                                </div>

                                {/* Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                                        <span style={{ color: '#64748b' }}>วันที่ขาย</span>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                            {selectedDateInfo.dayName}ที่ {selectedDateInfo.label}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                                        <span style={{ color: '#64748b' }}>ล็อก</span>
                                        <span style={{ fontWeight: '700', color: '#e84a0e', fontSize: '1.1rem' }}>
                                            {selectedLocks.map(l => l.id).join(', ')}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                                        <span style={{ color: '#64748b' }}>โซน</span>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                            {selectedLocks[0]?.zone} (รวม)
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                                        <span style={{ color: '#64748b' }}>ผู้จอง</span>
                                        <span style={{ fontWeight: '500', color: '#1e293b' }}>
                                            {userInfo?.name || 'สมาชิก'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                                        <span style={{ color: '#64748b' }}>ประเภทสินค้า</span>
                                        <span style={{ fontWeight: '500', color: '#1e293b' }}>
                                            {productType === 'food' ? 'อาหาร/เครื่องดื่ม' : productType === 'general' ? 'สินค้าทั่วไป' : 'อื่นๆ'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>ยอดชำระ</span>
                                        <span style={{ fontWeight: 'bold', color: '#e84a0e', fontSize: '1.25rem' }}>
                                            {selectedLocks.reduce((s, l) => s + l.price, 0)} บาท
                                        </span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div style={{
                                    marginTop: '1.5rem',
                                    padding: '0.75rem',
                                    background: '#fef3c7',
                                    borderRadius: '10px',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ color: '#92400e', fontWeight: '500', fontSize: '0.9rem' }}>
                                        ⏳ สถานะ: รอตรวจสอบสลิป
                                    </span>
                                </div>

                                {/* Timestamp */}
                                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                                    จองเมื่อ: {new Date().toLocaleString('th-TH')}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => window.print()}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    color: '#475569'
                                }}
                            >
                                🖨️ พิมพ์ใบยืนยัน
                            </button>
                            <Link
                                href="/"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
                                    color: 'white',
                                    borderRadius: '10px',
                                    textDecoration: 'none',
                                    fontWeight: '600'
                                }}
                            >
                                กลับหน้าหลัก
                            </Link>
                        </div>

                        {/* Info Note */}
                        <div style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            background: '#f0f9ff',
                            borderRadius: '10px',
                            maxWidth: '400px',
                            margin: '2rem auto 0 auto'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <Info size={20} color="#0369a1" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div style={{ fontSize: '0.85rem', color: '#0369a1', textAlign: 'left' }}>
                                    <strong>หมายเหตุ:</strong> แอดมินจะตรวจสอบสลิปและอนุมัติภายใน 24 ชั่วโมง
                                    หากมีปัญหาสามารถติดต่อได้ที่ Line: @venuebooking
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: View Booked Lock Details */}
            {viewBookedLock && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '320px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            background: '#fef3c7',
                            padding: '1.25rem',
                            textAlign: 'center',
                            borderBottom: '1px solid #fcd34d'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#92400e' }}>
                                ล็อก {viewBookedLock.lockId}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#b45309' }}>
                                ถูกจองแล้ว
                            </div>
                        </div>
                        <div style={{ padding: '1.25rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>จองโดย</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>
                                    {viewBookedLock.bookerName}
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>สถานะ</div>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    background: viewBookedLock.status === 'approved' ? '#dcfce7' : viewBookedLock.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                    color: viewBookedLock.status === 'approved' ? '#166534' : viewBookedLock.status === 'pending' ? '#92400e' : '#991b1b'
                                }}>
                                    {viewBookedLock.status === 'approved' ? '✓ อนุมัติแล้ว' : viewBookedLock.status === 'pending' ? '⏳ รอตรวจสอบ' : '✗ ปฏิเสธ'}
                                </span>
                            </div>
                            <button
                                onClick={() => setViewBookedLock(null)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: '#f1f5f9',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    color: '#475569'
                                }}
                            >
                                ปิด
                            </button>
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
        </div >
    );
}
