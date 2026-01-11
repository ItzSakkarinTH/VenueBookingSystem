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
    const [productType, setProductType] = useState('general'); // Default
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Init
    // Init
    useEffect(() => {
        setDates(getUpcomingDates());
        const token = getCookie('token');
        setIsLoggedIn(!!token);
    }, []);

    // Zoom Map Logic
    // Zoom Map Logic
    const [activeZone, setActiveZone] = useState<string | null>(null);
    const ZONE_COORDS: Record<string, { scale: number; x: string; y: string }> = {
        'A': { scale: 3.5, x: '12%', y: '50%' },
        'B': { scale: 3.5, x: '27%', y: '50%' },
        'C': { scale: 3.5, x: '42%', y: '50%' },
        'D': { scale: 3.5, x: '57%', y: '50%' },
        'E': { scale: 3.5, x: '73%', y: '50%' },
    };

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
                paymentDetails: { ...slipData.qrData, ...slipData.ocrData },
                productType: productType
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
                                                        const zone = ZONES.find(z => z.id === lock.zone);
                                                        return (
                                                            <div
                                                                key={lock.id}
                                                                onClick={() => !isBooked && handleLockClick(lock)}
                                                                style={{
                                                                    width: '55px',
                                                                    height: '55px',
                                                                    borderRadius: '8px',
                                                                    border: `2px solid ${isBooked ? '#cbd5e0' : zone?.color}`,
                                                                    background: isBooked ? '#e2e8f0' : 'white',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    cursor: isBooked ? 'not-allowed' : 'pointer',
                                                                    opacity: isBooked ? 0.5 : 1,
                                                                    transition: 'all 0.2s',
                                                                    transform: 'scale(1)',
                                                                }}
                                                                onMouseEnter={(e) => !isBooked && (e.currentTarget.style.transform = 'scale(1.05)')}
                                                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                                            >
                                                                <div style={{
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.9rem',
                                                                    color: isBooked ? '#94a3b8' : zone?.color
                                                                }}>
                                                                    {lock.id}
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '0.65rem',
                                                                    color: isBooked ? '#94a3b8' : '#64748b'
                                                                }}>
                                                                    {isBooked ? 'จองแล้ว' : `${lock.price}฿`}
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
                                            background: '#e2e8f0',
                                            borderRadius: '4px'
                                        }} />
                                        <span>จองแล้ว</span>
                                    </div>
                                </div>
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
        </div >
    );
}
