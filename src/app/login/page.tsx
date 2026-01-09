'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            // Force full reload to update Navbar state (cookies)
            window.location.href = '/booking';
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Login failed');
            }
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', padding: '4rem 1rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', background: 'white' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary-blue)' }}>เข้าสู่ระบบ</h2>

                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label>อีเมล</label>
                        <input
                            type="email"
                            required
                            className="form-input"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        />
                    </div>
                    <div>
                        <label>รหัสผ่าน</label>
                        <input
                            type="password"
                            required
                            className="form-input"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
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
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    ยังไม่มีบัญชี? <Link href="/register" style={{ color: 'var(--primary-orange)' }}>สมัครสมาชิก</Link>
                </p>
            </div>
        </div>
    );
}
