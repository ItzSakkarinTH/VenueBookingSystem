'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';

interface Booking {
    _id: string;
    userId?: User;
    lockId: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    slipImage?: string;
    amount: number;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('bookings');
    const [users, setUsers] = useState<User[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [announcement, setAnnouncement] = useState({ title: '', content: '', image: '' });
    const [editingUser, setEditingUser] = useState<User | null>(null); // State for editing
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Basic authorized fetch wrapper or check role
        // Fetch initial data
        const fetchData = async () => {
            setLoading(true);
            if (activeTab === 'users') {
                const res = await fetch('/api/admin/users');
                const data = await res.json();
                setUsers(data.users || []);
            } else if (activeTab === 'bookings') {
                const res = await fetch('/api/admin/bookings');
                const data = await res.json();
                setBookings(data.bookings || []);
            }
            setLoading(false);
        };
        fetchData();
    }, [activeTab]);

    const refreshData = async () => {
        setLoading(true);
        if (activeTab === 'users') {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(data.users || []);
        } else if (activeTab === 'bookings') {
            const res = await fetch('/api/admin/bookings');
            const data = await res.json();
            setBookings(data.bookings || []);
        }
        setLoading(false);
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
        refreshData();
    };

    const handleUpdateBookingStatus = async (id: string, status: string) => {
        await fetch('/api/admin/bookings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        refreshData();
    };

    const handlePostAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/admin/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(announcement)
        });
        alert('Announcement Posted!');
        setAnnouncement({ title: '', content: '', image: '' });
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingUser._id, ...editingUser })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update');
            }

            alert('User updated successfully');
            setEditingUser(null);
            refreshData();
        } catch (error) {
            alert((error as Error).message);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '2rem', color: 'var(--primary-blue)' }}>Admin Dashboard</h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button className={activeTab === 'bookings' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('bookings')}>รายการจอง/ตรวจสอบสลิป</button>
                <button className={activeTab === 'users' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('users')}>จัดการสมาชิก</button>
                <button className={activeTab === 'announcements' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('announcements')}>สร้างประกาศ</button>
            </div>

            {loading && <div>Loading...</div>}

            {!loading && activeTab === 'bookings' && (
                <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto', background: 'white' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f7fafc', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>User</th>
                                <th style={{ padding: '1rem' }}>Lock</th>
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Slip</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem' }}>{booking.userId?.name}</td>
                                    <td style={{ padding: '1rem' }}>{booking.lockId}</td>
                                    <td style={{ padding: '1rem' }}>{booking.date}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            background: booking.status === 'approved' ? '#C6F6D5' : booking.status === 'pending' ? '#FEEBC8' : '#FED7D7',
                                            color: booking.status === 'approved' ? '#22543D' : booking.status === 'pending' ? '#744210' : '#822727',
                                        }}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {booking.slipImage ? (
                                            <a href={booking.slipImage} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>View Slip</a>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleUpdateBookingStatus(booking._id, 'approved')} style={{ background: 'green', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Approve</button>
                                        <button onClick={() => handleUpdateBookingStatus(booking._id, 'rejected')} style={{ background: 'red', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Reject</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && activeTab === 'users' && (
                <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto', background: 'white' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f7fafc', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>ID Card</th>
                                <th style={{ padding: '1rem' }}>Phone</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem' }}>{u.name}</td>
                                    <td style={{ padding: '1rem' }}>{u.idCard}</td>
                                    <td style={{ padding: '1rem' }}>{u.phone}</td>
                                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setEditingUser(u)}
                                            style={{ background: '#3182ce', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                                        >
                                            Edit
                                        </button>
                                        <button onClick={() => handleDeleteUser(u._id)} style={{ background: 'red', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && activeTab === 'announcements' && (
                <div className="glass-panel" style={{ padding: '2rem', background: 'white', maxWidth: '600px' }}>
                    <h3>สร้างประกาศใหม่</h3>
                    <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <input
                            placeholder="หัวข้อ"
                            value={announcement.title}
                            onChange={e => setAnnouncement({ ...announcement, title: e.target.value })}
                            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e0' }}
                        />
                        <textarea
                            placeholder="รายละเอียด"
                            value={announcement.content}
                            rows={4}
                            onChange={e => setAnnouncement({ ...announcement, content: e.target.value })}
                            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e0' }}
                        />
                        <input
                            placeholder="Image URL (Optional)"
                            value={announcement.image}
                            onChange={e => setAnnouncement({ ...announcement, image: e.target.value })}
                            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e0' }}
                        />
                        <button className="btn-primary">Post Announcement</button>
                    </form>
                </div>
            )}

            {/* Edit User Modal */}
            {
                editingUser && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div className="glass-panel" style={{ background: 'white', padding: '2rem', width: '90%', maxWidth: '500px', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>แก้ไขข้อมูลสมาชิก</h3>
                            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>ชื่อ-นามสกุล</label>
                                    <input
                                        className="form-input"
                                        value={editingUser.name}
                                        onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>อีเมล</label>
                                    <input
                                        className="form-input"
                                        value={editingUser.email}
                                        onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>เบอร์โทรศัพท์</label>
                                    <input
                                        className="form-input"
                                        value={editingUser.phone}
                                        onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>เลขบัตรประชาชน</label>
                                    <input
                                        className="form-input"
                                        value={editingUser.idCard}
                                        onChange={e => setEditingUser({ ...editingUser, idCard: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>บทบาท (Role)</label>
                                    <select
                                        value={editingUser.role}
                                        onChange={e => editingUser && setEditingUser({ ...editingUser, role: e.target.value as 'user' | 'admin' })}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e0', borderRadius: '0.25rem', background: 'white' }}>ยกเลิก</button>
                                    <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem' }}>บันทึก</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
}
