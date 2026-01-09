'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', password: '' });

    useEffect(() => {
        fetch('/api/user/profile')
            .then(res => {
                if (!res.ok) throw new Error('Unauthorized');
                return res.json();
            })
            .then(data => {
                setUser(data.user);
                setEditForm({ name: data.user.name, phone: data.user.phone, password: '' });
                setLoading(false);
            })
            .catch(() => {
                router.push('/login');
            });
    }, [router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm)
        });
        if (res.ok) {
            alert('Updated successfully');
            setIsEditing(false);
            setUser({ ...user, ...editForm });
        } else {
            alert('Update failed');
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;

    return (
        <div className="container" style={{ marginTop: '2rem', maxWidth: '600px' }}>
            <div className="glass-panel" style={{ padding: '2rem', background: 'white' }}>
                <h1 style={{ marginBottom: '1.5rem' }}>จัดการโปรไฟล์</h1>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ color: 'var(--text-muted)' }}>เลขบัตรประชาชน</label>
                    <div style={{ padding: '0.75rem', background: '#e2e8f0', borderRadius: '0.5rem', color: '#718096' }}>
                        {user.idCard} (ไม่สามารถแก้ไขได้)
                    </div>
                </div>

                {isEditing ? (
                    <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>ชื่อ - นามสกุล</label>
                            <input
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e0' }}
                            />
                        </div>
                        <div>
                            <label>เบอร์โทรศัพท์</label>
                            <input
                                value={editForm.phone}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e0' }}
                            />
                        </div>
                        <div>
                            <label>รหัสผ่านใหม่ (ว่างไว้ถ้าไม่เปลี่ยน)</label>
                            <input
                                type="password"
                                value={editForm.password}
                                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                placeholder="********"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e0' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn-primary">บันทึก</button>
                            <button type="button" onClick={() => setIsEditing(false)} className="btn-outline" style={{ border: 'none' }}>ยกเลิก</button>
                        </div>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-muted)' }}>ชื่อ - นามสกุล</label>
                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.name}</div>
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-muted)' }}>เบอร์โทรศัพท์</label>
                            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.phone}</div>
                        </div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn-outline"
                            style={{ marginTop: '1rem' }}
                        >
                            แก้ไขข้อมูล
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
