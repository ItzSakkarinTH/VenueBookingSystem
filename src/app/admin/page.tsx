'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import Image from 'next/image';
import { Calendar, Filter, Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight, Search, RefreshCw, X, LayoutDashboard, Users, Megaphone } from 'lucide-react';

interface Booking {
    _id: string;
    userId?: User & { email?: string; idCard?: string };
    guestInfo?: {
        name: string;
        phone: string;
        idCard: string;
    };
    lockId: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    slipImage?: string;
    amount: number;
    productType?: string;
    zone?: string;
    createdAt?: string;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('bookings');
    const [users, setUsers] = useState<User[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [announcement, setAnnouncement] = useState({ title: '', content: '', image: '' });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filterDate, setFilterDate] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Detail Modal
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    useEffect(() => {
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
        setSelectedBooking(null);
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

    // Filter bookings
    const filteredBookings = bookings.filter(b => {
        const matchDate = !filterDate || b.date === filterDate;
        const matchStatus = filterStatus === 'all' || b.status === filterStatus;
        const matchSearch = !searchTerm ||
            b.lockId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.guestInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchDate && matchStatus && matchSearch;
    });

    // Pagination
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Get unique dates for filter dropdown
    const uniqueDates = [...new Set(bookings.map(b => b.date))].sort().reverse();

    // Stats
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        approved: bookings.filter(b => b.status === 'approved').length,
        rejected: bookings.filter(b => b.status === 'rejected').length,
    };

    // Format date for display
    const formatThaiDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
                padding: '1.5rem',
                color: 'white'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <LayoutDashboard size={28} />
                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                                    Admin Dashboard
                                </h1>
                                <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: 0 }}>จัดการระบบจองล็อกตลาดนัด</p>
                            </div>
                        </div>
                        <button
                            onClick={refreshData}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 1.25rem',
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                color: 'white',
                                fontWeight: '500'
                            }}
                        >
                            <RefreshCw size={16} />
                            รีเฟรช
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                background: activeTab === 'bookings' ? 'white' : 'rgba(255,255,255,0.15)',
                                color: activeTab === 'bookings' ? '#e84a0e' : 'white',
                                border: 'none',
                                borderRadius: '12px 12px 0 0',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.95rem'
                            }}
                        >
                            <Calendar size={18} /> รายการจอง
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                background: activeTab === 'users' ? 'white' : 'rgba(255,255,255,0.15)',
                                color: activeTab === 'users' ? '#e84a0e' : 'white',
                                border: 'none',
                                borderRadius: '12px 12px 0 0',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.95rem'
                            }}
                        >
                            <Users size={18} /> สมาชิก
                        </button>
                        <button
                            onClick={() => setActiveTab('announcements')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                background: activeTab === 'announcements' ? 'white' : 'rgba(255,255,255,0.15)',
                                color: activeTab === 'announcements' ? '#e84a0e' : 'white',
                                border: 'none',
                                borderRadius: '12px 12px 0 0',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.95rem'
                            }}
                        >
                            <Megaphone size={18} /> ประกาศ
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
                {loading && <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังโหลด...</div>}

                {!loading && activeTab === 'bookings' && (
                    <div>
                        {/* Stats Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>ทั้งหมด</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{stats.total}</div>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: '1.25rem', borderRadius: '16px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#92400e', marginBottom: '0.25rem' }}>รอตรวจสอบ</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>{stats.pending}</div>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)', padding: '1.25rem', borderRadius: '16px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '0.25rem' }}>อนุมัติแล้ว</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#166534' }}>{stats.approved}</div>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)', padding: '1.25rem', borderRadius: '16px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#991b1b', marginBottom: '0.25rem' }}>ปฏิเสธ</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b' }}>{stats.rejected}</div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div style={{
                            background: 'white',
                            padding: '1rem 1.25rem',
                            borderRadius: '16px',
                            marginBottom: '1rem',
                            display: 'flex',
                            gap: '0.75rem',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#e84a0e',
                                fontWeight: '600'
                            }}>
                                <Filter size={18} />
                                <span>กรอง:</span>
                            </div>

                            {/* Date Filter */}
                            <select
                                value={filterDate}
                                onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }}
                                style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    minWidth: '180px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value="">📅 ทุกวัน</option>
                                {uniqueDates.map(date => (
                                    <option key={date} value={date}>{formatThaiDate(date)}</option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                value={filterStatus}
                                onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value="all">📊 ทุกสถานะ</option>
                                <option value="pending">🟡 รอตรวจสอบ</option>
                                <option value="approved">🟢 อนุมัติแล้ว</option>
                                <option value="rejected">🔴 ปฏิเสธ</option>
                            </select>

                            {/* Items per page */}
                            <select
                                value={itemsPerPage}
                                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value={5}>5 รายการ</option>
                                <option value={10}>10 รายการ</option>
                                <option value={25}>25 รายการ</option>
                                <option value={50}>50 รายการ</option>
                            </select>

                            {/* Search */}
                            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="ค้นหาล็อก, ชื่อ..."
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem 1rem 0.6rem 2.5rem',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        background: '#f8fafc',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Bookings Table */}
                        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                    <thead>
                                        <tr style={{ background: 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#9a3412', fontSize: '0.85rem' }}>ล็อก</th>
                                            <th style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#9a3412', fontSize: '0.85rem' }}>ผู้จอง</th>
                                            <th style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#9a3412', fontSize: '0.85rem' }}>วันที่จอง</th>
                                            <th style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#9a3412', fontSize: '0.85rem' }}>ยอดเงิน</th>
                                            <th style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#9a3412', fontSize: '0.85rem' }}>สถานะ</th>
                                            <th style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#9a3412', fontSize: '0.85rem' }}>การดำเนินการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedBookings.map((booking, idx) => (
                                            <tr key={booking._id} style={{
                                                borderBottom: '1px solid #f1f5f9',
                                                background: idx % 2 === 0 ? 'white' : '#fafafa'
                                            }}>
                                                <td style={{ padding: '1rem 1.25rem' }}>
                                                    <span style={{
                                                        fontWeight: '700',
                                                        color: '#e84a0e',
                                                        background: '#fff7ed',
                                                        padding: '0.35rem 0.85rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.95rem'
                                                    }}>
                                                        {booking.lockId}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 1.25rem' }}>
                                                    <div style={{ fontWeight: '500', color: '#1e293b' }}>
                                                        {booking.userId?.name || booking.guestInfo?.name || '-'}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        {booking.userId?.phone || booking.guestInfo?.phone || ''}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem 1.25rem' }}>
                                                    <div style={{ fontWeight: '500', color: '#1e293b' }}>{formatThaiDate(booking.date)}</div>
                                                </td>
                                                <td style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#1e293b' }}>{booking.amount} ฿</td>
                                                <td style={{ padding: '1rem 1.25rem' }}>
                                                    <span style={{
                                                        padding: '0.35rem 0.85rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        background: booking.status === 'approved' ? '#dcfce7' : booking.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                                        color: booking.status === 'approved' ? '#166534' : booking.status === 'pending' ? '#92400e' : '#991b1b',
                                                    }}>
                                                        {booking.status === 'approved' ? '✓ อนุมัติ' : booking.status === 'pending' ? '⏳ รอตรวจ' : '✗ ปฏิเสธ'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 1.25rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => setSelectedBooking(booking)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.35rem',
                                                                background: '#e0f2fe',
                                                                color: '#0369a1',
                                                                border: 'none',
                                                                padding: '0.5rem 0.85rem',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            <Eye size={14} /> ดู
                                                        </button>
                                                        {booking.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateBookingStatus(booking._id, 'approved')}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        background: '#dcfce7',
                                                                        color: '#166534',
                                                                        border: 'none',
                                                                        padding: '0.5rem 0.75rem',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateBookingStatus(booking._id, 'rejected')}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        background: '#fee2e2',
                                                                        color: '#991b1b',
                                                                        border: 'none',
                                                                        padding: '0.5rem 0.75rem',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {paginatedBookings.length === 0 && (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                                    ไม่พบรายการที่ตรงกับเงื่อนไข
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{
                                    padding: '1rem 1.25rem',
                                    borderTop: '1px solid #f1f5f9',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '1rem',
                                    background: '#fafafa'
                                }}>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredBookings.length)} จาก {filteredBookings.length} รายการ
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            style={{
                                                padding: '0.5rem',
                                                border: 'none',
                                                borderRadius: '8px',
                                                background: currentPage === 1 ? '#f1f5f9' : '#e84a0e',
                                                color: currentPage === 1 ? '#94a3b8' : 'white',
                                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <span style={{
                                            padding: '0.5rem 1rem',
                                            background: '#fff7ed',
                                            borderRadius: '8px',
                                            color: '#e84a0e',
                                            fontWeight: '600'
                                        }}>
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            style={{
                                                padding: '0.5rem',
                                                border: 'none',
                                                borderRadius: '8px',
                                                background: currentPage === totalPages ? '#f1f5f9' : '#e84a0e',
                                                color: currentPage === totalPages ? '#94a3b8' : 'white',
                                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!loading && activeTab === 'users' && (
                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#9a3412' }}>ชื่อ-นามสกุล</th>
                                        <th style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#9a3412' }}>เลขบัตรประชาชน</th>
                                        <th style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#9a3412' }}>เบอร์โทร</th>
                                        <th style={{ padding: '1rem 1.25rem', fontWeight: '600', color: '#9a3412' }}>การดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u, idx) => (
                                        <tr key={u._id} style={{
                                            borderBottom: '1px solid #f1f5f9',
                                            background: idx % 2 === 0 ? 'white' : '#fafafa'
                                        }}>
                                            <td style={{ padding: '1rem 1.25rem', fontWeight: '500' }}>{u.name}</td>
                                            <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>{u.idCard}</td>
                                            <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>{u.phone}</td>
                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => setEditingUser(u)}
                                                        style={{
                                                            background: '#e0f2fe',
                                                            color: '#0369a1',
                                                            border: 'none',
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        แก้ไข
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id)}
                                                        style={{
                                                            background: '#fee2e2',
                                                            color: '#991b1b',
                                                            border: 'none',
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        ลบ
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && activeTab === 'announcements' && (
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '16px',
                        maxWidth: '600px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '1.5rem' }}>
                            สร้างประกาศใหม่
                        </h3>
                        <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>หัวข้อ</label>
                                <input
                                    placeholder="ระบุหัวข้อประกาศ"
                                    value={announcement.title}
                                    onChange={e => setAnnouncement({ ...announcement, title: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>รายละเอียด</label>
                                <textarea
                                    placeholder="ระบุรายละเอียด"
                                    value={announcement.content}
                                    rows={4}
                                    onChange={e => setAnnouncement({ ...announcement, content: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '1rem',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>รูปภาพ (URL)</label>
                                <input
                                    placeholder="https://example.com/image.jpg"
                                    value={announcement.image}
                                    onChange={e => setAnnouncement({ ...announcement, image: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                style={{
                                    marginTop: '0.5rem',
                                    padding: '0.875rem',
                                    background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                โพสต์ประกาศ
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Booking Detail Modal - Enhanced */}
            {selectedBooking && (
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
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '550px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderRadius: '20px 20px 0 0'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                                    รายละเอียดการจอง
                                </h3>
                                <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem' }}>
                                    รหัส: #{selectedBooking._id.slice(-8).toUpperCase()}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.35rem',
                                    borderRadius: '8px',
                                    display: 'flex'
                                }}
                            >
                                <X size={20} color="white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '1.5rem' }}>
                            {/* Lock & Status Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                                borderRadius: '16px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
                                        borderRadius: '14px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        boxShadow: '0 4px 12px rgba(232, 74, 14, 0.3)'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>ล็อก</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedBooking.lockId}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>วันที่จอง</div>
                                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '1rem' }}>
                                            {formatThaiDate(selectedBooking.date)}
                                        </div>
                                    </div>
                                </div>
                                <span style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    background: selectedBooking.status === 'approved' ? '#dcfce7' : selectedBooking.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                    color: selectedBooking.status === 'approved' ? '#166534' : selectedBooking.status === 'pending' ? '#92400e' : '#991b1b',
                                }}>
                                    {selectedBooking.status === 'approved' ? '✓ อนุมัติแล้ว' : selectedBooking.status === 'pending' ? '⏳ รอตรวจสอบ' : '✗ ปฏิเสธ'}
                                </span>
                            </div>

                            {/* Booker Information Section */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#e84a0e',
                                    marginBottom: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <Users size={16} /> ข้อมูลผู้จอง
                                </h4>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '1rem'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>ชื่อ-นามสกุล</div>
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                                {selectedBooking.userId?.name || selectedBooking.guestInfo?.name || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>เบอร์โทรศัพท์</div>
                                            <div style={{ fontWeight: '500', color: '#1e293b' }}>
                                                {selectedBooking.userId?.phone || selectedBooking.guestInfo?.phone || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>อีเมล</div>
                                            <div style={{ fontWeight: '500', color: '#1e293b' }}>
                                                {selectedBooking.userId?.email || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>เลขบัตรประชาชน</div>
                                            <div style={{ fontWeight: '500', color: '#1e293b' }}>
                                                {selectedBooking.userId?.idCard || selectedBooking.guestInfo?.idCard || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Details Section */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#e84a0e',
                                    marginBottom: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <Calendar size={16} /> รายละเอียดการจอง
                                </h4>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '1rem'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>รหัสการจอง</div>
                                            <div style={{ fontWeight: '600', color: '#1e293b', fontFamily: 'monospace' }}>
                                                #{selectedBooking._id.slice(-8).toUpperCase()}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>วันที่ทำรายการ</div>
                                            <div style={{ fontWeight: '500', color: '#1e293b' }}>
                                                {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString('th-TH', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>ตำแหน่ง</div>
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                                ล็อก {selectedBooking.lockId} {selectedBooking.zone ? `(โซน ${selectedBooking.zone})` : ''}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>ประเภทสินค้า</div>
                                            <div style={{ fontWeight: '500', color: '#1e293b' }}>
                                                {selectedBooking.productType === 'general' ? 'สินค้าทั่วไป' :
                                                    selectedBooking.productType === 'food' ? 'อาหาร' :
                                                        selectedBooking.productType === 'clothing' ? 'เสื้อผ้า' :
                                                            selectedBooking.productType || '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amount Highlight */}
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.75rem 1rem',
                                        background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontSize: '0.9rem', color: '#9a3412', fontWeight: '500' }}>ยอดชำระ</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#e84a0e' }}>
                                            {selectedBooking.amount} บาท
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Slip Image */}
                            {selectedBooking.slipImage && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: '#e84a0e',
                                        marginBottom: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        📄 หลักฐานการชำระเงิน
                                    </h4>
                                    <a href={selectedBooking.slipImage} target="_blank" rel="noopener noreferrer">
                                        <Image
                                            src={selectedBooking.slipImage}
                                            alt="Payment Slip"
                                            width={400}
                                            height={300}
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                maxHeight: '350px',
                                                objectFit: 'contain',
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                background: '#f8fafc'
                                            }}
                                        />
                                    </a>
                                </div>
                            )}

                            {/* Status Message */}
                            {selectedBooking.status === 'pending' && (
                                <div style={{
                                    marginBottom: '1.5rem',
                                    padding: '1rem',
                                    background: '#fff7ed',
                                    borderRadius: '12px',
                                    border: '1px solid #fed7aa',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        background: '#f59e0b',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <span style={{ fontSize: '0.8rem' }}>⏳</span>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.25rem' }}>รอการตรวจสอบ</div>
                                        <div style={{ fontSize: '0.85rem', color: '#b45309' }}>
                                            กรุณาตรวจสอบหลักฐานการชำระเงินและข้อมูลผู้จอง จากนั้นอนุมัติหรือปฏิเสธรายการนี้
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {selectedBooking.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => handleUpdateBookingStatus(selectedBooking._id, 'approved')}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.875rem',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '1rem',
                                            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                                        }}
                                    >
                                        <CheckCircle size={18} /> อนุมัติ
                                    </button>
                                    <button
                                        onClick={() => handleUpdateBookingStatus(selectedBooking._id, 'rejected')}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.875rem',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '1rem',
                                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                        }}
                                    >
                                        <XCircle size={18} /> ปฏิเสธ
                                    </button>
                                </div>
                            )}

                            {/* Close button for non-pending */}
                            {selectedBooking.status !== 'pending' && (
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '1rem'
                                    }}
                                >
                                    ปิด
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
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
                        padding: '2rem',
                        width: '90%',
                        maxWidth: '500px',
                        borderRadius: '20px'
                    }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>แก้ไขข้อมูลสมาชิก</h3>
                        <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>ชื่อ-นามสกุล</label>
                                <input
                                    value={editingUser.name}
                                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>อีเมล</label>
                                <input
                                    value={editingUser.email}
                                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>เบอร์โทรศัพท์</label>
                                <input
                                    value={editingUser.phone}
                                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>เลขบัตรประชาชน</label>
                                <input
                                    value={editingUser.idCard}
                                    onChange={e => setEditingUser({ ...editingUser, idCard: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>บทบาท</label>
                                <select
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as 'user' | 'admin' })}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px' }}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '10px',
                                        background: 'white',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
