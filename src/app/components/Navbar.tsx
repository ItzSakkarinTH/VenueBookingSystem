'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, LogOut, Home, Menu, ChevronDown, Receipt } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState('user');
    const [userName, setUserName] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check for role cookie
        const storedRole = getCookie('role');
        const storedName = getCookie('name');

        if (storedRole) {
            import('react').then(({ startTransition }) => {
                startTransition(() => {
                    setIsLoggedIn(true);
                    setRole(storedRole as string);
                    if (storedName) {
                        setUserName(decodeURIComponent(storedName as string));
                    }
                });
            });
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        deleteCookie('token');
        deleteCookie('role');
        deleteCookie('name');
        setIsLoggedIn(false);
        router.push('/login');
        router.refresh();
    };

    const navLinks = [
        { href: '/', label: 'หน้าแรก', icon: Home },
        { href: '/booking', label: 'จองล็อก', icon: ShoppingBag },
    ];

    // Add "My Bookings" link for logged-in users
    if (isLoggedIn) {
        navLinks.push({ href: '/my-bookings', label: 'การจองของฉัน', icon: Receipt });
    }

    if (isLoggedIn && role === 'admin') {
        navLinks.push({ href: '/admin', label: 'ผู้ดูแลระบบ', icon: User });
    }

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--border)'
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '4rem'
            }}>
                {/* Logo */}
                <Link href="/" style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    background: 'var(--gradient-main)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    🛍️ TaladNad
                </Link>


                {/* Desktop Nav */}
                <div className="hidden-mobile" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: isActive ? 'var(--primary-orange)' : 'var(--text-muted)',
                                    fontWeight: isActive ? 600 : 500,
                                    transition: 'color 0.2s',
                                    fontSize: '0.95rem'
                                }}
                            >
                                <Icon size={18} />
                                {link.label}
                            </Link>
                        );
                    })}

                    {isLoggedIn ? (
                        <div style={{ position: 'relative' }} ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'transparent',
                                    border: '1px solid var(--border)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-full)',
                                    color: 'var(--text-main)',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: '32px', height: '32px',
                                    background: 'var(--primary-orange)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 'bold'
                                }}>
                                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span style={{ fontWeight: 500 }}>{userName || 'ผู้ใช้งาน'}</span>
                                <ChevronDown size={16} />
                            </button>

                            {isUserMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '120%', right: 0,
                                    width: '200px',
                                    background: 'white',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-lg)',
                                    border: '1px solid var(--border)',
                                    overflow: 'hidden',
                                    zIndex: 51
                                }}>
                                    <Link href="/my-bookings"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '0.75rem 1rem',
                                            color: 'var(--text-main)',
                                            borderBottom: '1px solid #f0f0f0'
                                        }}
                                        onMouseEnter={(e: React.MouseEvent<HTMLElement>) => e.currentTarget.style.background = '#f7fafc'}
                                        onMouseLeave={(e: React.MouseEvent<HTMLElement>) => e.currentTarget.style.background = 'white'}
                                    >
                                        <Receipt size={16} /> การจองของฉัน
                                    </Link>
                                    <Link href="/profile"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '0.75rem 1rem',
                                            color: 'var(--text-main)',
                                            borderBottom: '1px solid #f0f0f0'
                                        }}
                                        onMouseEnter={(e: React.MouseEvent<HTMLElement>) => e.currentTarget.style.background = '#f7fafc'}
                                        onMouseLeave={(e: React.MouseEvent<HTMLElement>) => e.currentTarget.style.background = 'white'}
                                    >
                                        <User size={16} /> โปรไฟล์
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            width: '100%',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '0.75rem 1rem',
                                            color: 'var(--error)',
                                            border: 'none',
                                            background: 'white',
                                            textAlign: 'left'
                                        }}
                                        onMouseEnter={(e: React.MouseEvent<HTMLElement>) => e.currentTarget.style.background = '#fef2f2'}
                                        onMouseLeave={(e: React.MouseEvent<HTMLElement>) => e.currentTarget.style.background = 'white'}
                                    >
                                        <LogOut size={16} /> ออกจากระบบ
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                            เข้าสู่ระบบ
                        </Link>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="show-mobile"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-main)' }}
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div style={{
                    position: 'absolute',
                    top: '4rem',
                    left: 0,
                    right: 0,
                    background: 'var(--surface)',
                    padding: '1rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 49
                }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMenuOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: pathname === link.href ? 'var(--background)' : 'transparent',
                                color: pathname === link.href ? 'var(--primary-orange)' : 'var(--text-main)'
                            }}
                        >
                            <link.icon size={20} />
                            {link.label}
                        </Link>
                    ))}
                    {isLoggedIn ? (
                        <>
                            <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }}></div>
                            <div style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                                สวัสดี, {userName || 'User'}
                            </div>
                            <Link href="/my-bookings" onClick={() => setIsMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem' }}>
                                <Receipt size={20} /> การจองของฉัน
                            </Link>
                            <Link href="/profile" onClick={() => setIsMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem' }}>
                                <User size={20} /> โปรไฟล์
                            </Link>
                            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', color: 'var(--error)', border: 'none', background: 'none' }}>
                                <LogOut size={20} /> ออกจากระบบ
                            </button>
                        </>
                    ) : (
                        <Link href="/login" onClick={() => setIsMenuOpen(false)} style={{ padding: '0.75rem', color: 'var(--primary-blue)' }}>
                            เข้าสู่ระบบ
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
