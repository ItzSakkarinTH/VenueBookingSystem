'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GENERATE_LOCKS, ZONES } from '@/lib/constants';
import SlipReaderIntegrated from '../components/SlipReader';
import { SlipData } from '@/types';
import { getCookie } from 'cookies-next';
import { Calendar, MapPin, User, CheckCircle, ChevronLeft, CreditCard, Info } from 'lucide-react';
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

        if (day === 6) { // Saturday
            dates.push({
                dateObj: d,
                date: d.toISOString().split('T')[0],
                label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long' }),
                dayName: 'วันเสาร์',
                key: 'Saturday' as const
            });
        }
        if (day === 0) { // Sunday
            dates.push({
                dateObj: d,
                date: d.toISOString().split('T')[0],
                label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long' }),
                dayName: 'วันอาทิตย์',
                key: 'Sunday' as const
            });
        }
    }
    return dates;
};

export default function BookingPage() {
    const router = useRouter();

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

    // Lock Selection
    const [occupiedLocks, setOccupiedLocks] = useState<string[]>([]);
    const [selectedLock, setSelectedLock] = useState<LockDef | null>(null);
    const [locks, setLocks] = useState<LockDef[]>([]);

    // User Info
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [guestInfo, setGuestInfo] = useState({ name: '', phone: '', idCard: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Init
    useEffect(() => {
        setDates(getUpcomingDates());
        const token = getCookie('token');
        setIsLoggedIn(!!token);
    }, []);

    // Fetch Bookings when date changes
    useEffect(() => {
        if (!selectedDateInfo) return;

        // Generate locks for this day
        setLocks(GENERATE_LOCKS(selectedDateInfo.key));

        // Fetch occupied
        setLoading(true);
        fetch(`/api/bookings?date=${selectedDateInfo.date}`)
            .then(res => res.json())
            .then(data => {
                if (data.bookings) {
                    setOccupiedLocks(data.bookings.map((b: { lockId: string }) => b.lockId));
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));

    }, [selectedDateInfo]);

    const handleDateSelect = (d: typeof dates[0]) => {
        setSelectedDateInfo(d);
        // Auto advance to step 2 logic? Maybe wait for user click "Next" or just go.
        // Let's go to step 2 automatically for smoother flow
        setStep(2);
        setSelectedLock(null); // Reset lock
    };

    const handleLockClick = (lock: LockDef) => {
        if (occupiedLocks.includes(lock.id)) return;
        setSelectedLock(lock);
        setStep(3); // Go to payment
    };

    const handleSlipVerified = async (slipData: SlipData) => {
        setLoading(true);
        setError('');

        if (!selectedDateInfo || !selectedLock) return;

        // Validation for guest
        if (!isLoggedIn) {
            if (!guestInfo.name || !guestInfo.phone) {
                setError('กรุณากรอกชื่อและเบอร์โทรศัพท์');
                setLoading(false);
                return;
            }
        }

        try {
            const payload: Record<string, unknown> = {
                lockId: selectedLock.id,
                date: selectedDateInfo.date,
                amount: selectedLock.price,
                slipImage: slipData.slipImage,
                paymentDetails: { ...slipData.qrData, ...slipData.ocrData }
            };

            if (!isLoggedIn) {
                payload.guestName = guestInfo.name;
                payload.guestPhone = guestInfo.phone;
                payload.guestIdCard = guestInfo.idCard;
            }

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Booking failed');

            alert('จองสำเร็จ! กรุณารอการอนุมัติ');
            router.push('/profile'); // Redirect to profile or history

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
                            <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.9rem' }} className="hidden-mobile">
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
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
                                        {d.key === 'Saturday' ? 'โซน A, B' : 'ทุกโซน'}
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

                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading locks...</div>
                        ) : (
                            <>
                                <div className="lock-grid" style={{ marginBottom: '2rem' }}>
                                    {locks.map((lock) => {
                                        const isBooked = occupiedLocks.includes(lock.id);
                                        const zone = ZONES.find(z => z.id === lock.zone);
                                        return (
                                            <div
                                                key={lock.id}
                                                className={`lock-item ${isBooked ? 'lock-booked' : 'lock-available'}`}
                                                onClick={() => !isBooked && handleLockClick(lock)}
                                                title={`${lock.label} - ${lock.price} บาท`}
                                                style={{
                                                    position: 'relative',
                                                    borderColor: isBooked ? '#cbd5e0' : zone?.color,
                                                    color: isBooked ? 'white' : zone?.color,
                                                    background: isBooked ? '#cbd5e0' : 'white',
                                                    cursor: isBooked ? 'not-allowed' : 'pointer',
                                                    opacity: isBooked ? 0.6 : 1
                                                }}
                                            >
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{lock.id}</div>
                                                    <div style={{ fontSize: '0.7rem' }}>{lock.price}฿</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', fontSize: '0.85rem' }}>
                                    {ZONES.map(z => (
                                        <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: 12, height: 12, backgroundColor: z.color, borderRadius: 2 }}></div>
                                            <span>{z.name}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: 12, height: 12, backgroundColor: '#cbd5e0', borderRadius: 2 }}></div>
                                        <span>ไม่ว่าง</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 3: Information & Payment */}
                {step === 3 && selectedLock && (
                    <div>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CreditCard size={20} color="var(--primary-orange)" /> ยืนยันข้อมูลและชำระเงิน
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flexWrap: 'wrap' }} className="responsive-grid">

                            {/* Summary */}
                            <div style={{ background: '#f7fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#4a5568' }}>สรุปรายการ</h3>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>วันที่:</span>
                                    <strong>{selectedDateInfo?.dayName} {selectedDateInfo?.label}</strong>
                                </div>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>ตำแหน่ง:</span>
                                    <strong>Lock {selectedLock.id}</strong>
                                </div>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>โซน:</span>
                                    <strong>{selectedLock.zone}</strong>
                                </div>
                                <div style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'var(--primary-orange)', fontWeight: 'bold' }}>
                                    <span>ยอดชำระ:</span>
                                    <span>{selectedLock.price} บาท</span>
                                </div>
                            </div>

                            {/* Form */}
                            <div>
                                {!isLoggedIn ? (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={18} /> ข้อมูลผู้จอง (Guest)
                                        </h3>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>ชื่อ-นามสกุล *</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={guestInfo.name}
                                                onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                                placeholder="กรอกชื่อจริงของคุณ"
                                            />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>เบอร์โทรศัพท์ *</label>
                                            <input
                                                type="tel"
                                                className="input-field"
                                                value={guestInfo.phone}
                                                onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                                                placeholder="08x-xxx-xxxx"
                                            />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>เลขบัตรประชาชน (ถ้ามี)</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={guestInfo.idCard}
                                                onChange={(e) => setGuestInfo({ ...guestInfo, idCard: e.target.value })}
                                                placeholder="เพื่อใช้ตรวจสอบสิทธิ์"
                                            />
                                        </div>
                                        <div style={{ padding: '0.75rem', background: '#ebf8ff', color: '#2b6cb0', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                                            <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                                            <span>แนะนำ: <Link href="/login" style={{ textDecoration: 'underline', fontWeight: 600 }}>เข้าสู่ระบบ</Link> เพื่อไม่ต้องกรอกข้อมูลทุกครั้ง</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                                            <CheckCircle size={18} /> คุณกำลังจองในชื่อสมาชิก
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ข้อมูลของคุณจะถูกบันทึกอัตโนมัติ</p>
                                    </div>
                                )}

                                <div style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>ชำระเงิน</h3>
                                    {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
                                    <SlipReaderIntegrated
                                        expectedAmount={selectedLock.price}
                                        onSlipVerified={handleSlipVerified}
                                        onError={(msg) => setError(msg)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
