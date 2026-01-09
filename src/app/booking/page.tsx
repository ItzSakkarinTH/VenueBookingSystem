'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GENERATE_LOCKS, ZONES } from '@/lib/constants';
import SlipReaderIntegrated from '../components/SlipReader';
import { SlipData } from '@/types';

export default function BookingPage() {
    const router = useRouter();
    const [selectedDateKey, setSelectedDateKey] = useState<'Saturday' | 'Sunday'>('Sunday');
    const [activeDate, setActiveDate] = useState<string>(''); // Actual YYYY-MM-DD
    const [occupiedLocks, setOccupiedLocks] = useState<string[]>([]);
    const [selectedLock, setSelectedLock] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Calculate next Saturday/Sunday
    useEffect(() => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sun, 6 = Sat
        let daysUntilTarget = 0;

        if (selectedDateKey === 'Saturday') {
            daysUntilTarget = (6 - dayOfWeek + 7) % 7;
            if (daysUntilTarget === 0) daysUntilTarget = 7; // Next Saturday
        } else {
            daysUntilTarget = (0 - dayOfWeek + 7) % 7;
            if (daysUntilTarget === 0) daysUntilTarget = 7; // Next Sunday
        }

        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysUntilTarget);
        setActiveDate(targetDate.toISOString().split('T')[0]);
    }, [selectedDateKey]);

    // Fetch Occupied Locks
    useEffect(() => {
        if (!activeDate) return;

        fetch(`/api/bookings?date=${activeDate}`)
            .then(res => res.json())
            .then(data => {
                if (data.bookings) {
                    setOccupiedLocks(data.bookings.map((b: any) => b.lockId));
                }
            });
    }, [activeDate]);

    const locks = GENERATE_LOCKS(selectedDateKey);

    const handleLockClick = (lock: any) => {
        if (occupiedLocks.includes(lock.id)) return;
        setSelectedLock(lock);
        setIsModalOpen(true);
        setSubmitError('');
    };

    const handleSlipVerified = async (slipData: SlipData) => {
        setLoading(true);
        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lockId: selectedLock.id,
                    date: activeDate,
                    amount: selectedLock.price,
                    slipImage: slipData.slipImage,
                    paymentDetails: { ...slipData.qrData, ...slipData.ocrData }
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Booking failed');
            }

            alert('Booking Successful!');
            setIsModalOpen(false);
            setSelectedLock(null);
            // Refresh locks
            const refresh = await fetch(`/api/bookings?date=${activeDate}`);
            const refreshData = await refresh.json();
            if (refreshData.bookings) {
                setOccupiedLocks(refreshData.bookings.map((b: any) => b.lockId));
            }

        } catch (err: any) {
            setSubmitError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <h1 style={{
                textAlign: 'center',
                marginBottom: '2rem',
                fontSize: '2rem',
                color: 'var(--primary-orange)'
            }}>
                🛒 จองล็อกตลาดนัด
            </h1>

            {/* Date Selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={selectedDateKey === 'Saturday' ? 'btn-primary' : 'btn-outline'}
                    onClick={() => setSelectedDateKey('Saturday')}
                >
                    วันเสาร์ (โซน A, B)
                </button>
                <button
                    className={selectedDateKey === 'Sunday' ? 'btn-primary' : 'btn-outline'}
                    onClick={() => setSelectedDateKey('Sunday')}
                >
                    วันอาทิตย์ (เต็มรูปแบบ)
                </button>
            </div>

            <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
                กำลังดูผังวันที่: <strong>{activeDate}</strong>
            </p>

            {/* Grid */}
            <div className="lock-grid">
                {locks.map((lock) => {
                    const isBooked = occupiedLocks.includes(lock.id);
                    const zone = ZONES.find(z => z.id === lock.zone);
                    return (
                        <div
                            key={lock.id}
                            className={`lock-item zone-${lock.zone} ${isBooked ? 'lock-booked' : 'lock-available'}`}
                            onClick={() => !isBooked && handleLockClick(lock)}
                            title={`${lock.label} - ${lock.price} บาท`}
                            style={{
                                position: 'relative',
                                borderColor: isBooked ? '#cbd5e0' : zone?.color,
                                color: isBooked ? 'white' : zone?.color,
                                background: isBooked ? '#cbd5e0' : 'white',
                            }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <div>{lock.id}</div>
                                <div style={{ fontSize: '0.7rem' }}>{lock.price}฿</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                {ZONES.map(z => (
                    <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 20, height: 20, border: `2px solid ${z.color}`, borderRadius: 4 }}></div>
                        <span>{z.name}</span>
                    </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 20, height: 20, background: '#cbd5e0', borderRadius: 4 }}></div>
                    <span>ไม่ว่าง</span>
                </div>
            </div>

            {/* Booking Modal */}
            {isModalOpen && selectedLock && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="glass-panel" style={{
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '2rem',
                        background: 'white'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h2>ยืนยันการจอง: ล็อก {selectedLock.id}</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f7fafc', borderRadius: '0.5rem' }}>
                            <p>วันที่: <strong>{activeDate}</strong></p>
                            <p>ราคา: <strong style={{ color: 'var(--primary-orange)', fontSize: '1.2rem' }}>{selectedLock.price} บาท</strong></p>
                            <p style={{ fontSize: '0.9rem', color: '#718096' }}>*กรุณาโอนเงินและแนบสลิปด้านล่าง (ระบบจะตรวจสอบอัตโนมัติ)</p>
                        </div>

                        {submitError && (
                            <div style={{ padding: '1rem', background: '#fed7d7', color: '#c53030', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                {submitError}
                            </div>
                        )}

                        <SlipReaderIntegrated
                            expectedAmount={selectedLock.price}
                            onSlipVerified={handleSlipVerified}
                            onError={(msg) => setSubmitError(msg)}
                        />

                        {loading && <p style={{ textAlign: 'center', marginTop: '1rem' }}>กำลังบันทึกข้อมูล...</p>}

                    </div>
                </div>
            )}
        </div>
    );
}
