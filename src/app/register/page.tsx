'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        confirmPassword: '',
        idCard: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    password: formData.password,
                    idCard: formData.idCard
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            window.location.href = '/booking';
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '500px', padding: '4rem 1rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', background: 'white' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary-orange)' }}>สมัครสมาชิกใหม่</h2>

                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label>ชื่อ - นามสกุล</label>
                        <input
                            type="text" required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        />
                    </div>
                    <div>
                        <label>เลขบัตรประชาชน (13 หลัก)</label>
                        <input
                            type="text" required maxLength={13}
                            value={formData.idCard}
                            onChange={e => setFormData({ ...formData, idCard: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        />
                        <small style={{ color: '#718096' }}>*ไม่สามารถแก้ไขได้ภายหลัง</small>
                    </div>
                    <div>
                        <label>เบอร์โทรศัพท์</label>
                        <input
                            type="tel" required
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        />
                    </div>
                    <div>
                        <label>รหัสผ่าน</label>
                        <input
                            type="password" required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        />
                    </div>
                    <div>
                        <label>ยืนยันรหัสผ่าน</label>
                        <input
                            type="password" required
                            value={formData.confirmPassword}
                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    {error && <div style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{error}</div>}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem' }}
                    >
                        {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    มีบัญชีแล้ว? <Link href="/login" style={{ color: 'var(--primary-blue)' }}>เข้าสู่ระบบ</Link>
                </p>
            </div>
        </div>
    );
}
