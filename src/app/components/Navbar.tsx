'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, LogIn, LogOut, Home, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState('user');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        // Check for role cookie (which is client-readable) to determine auth state
        // We cannot read 'token' because it is httpOnly
        const storedRole = getCookie('role');
        if (storedRole) {
            import('react').then(({ startTransition }) => {
                startTransition(() => {
                    setIsLoggedIn(true);
                    setRole(storedRole as string);
                });
            });
        }
    }, []);

    const handleLogout = () => {
        deleteCookie('token');
        deleteCookie('role');
        setIsLoggedIn(false);
        router.push('/login');
        router.refresh();
    };

    const navLinks = [
        { href: '/', label: 'หน้าแรก', icon: Home },
        { href: '/booking', label: 'จองล็อก', icon: ShoppingBag },
    ];

    if (isLoggedIn) {
        navLinks.push({ href: '/profile', label: 'โปรไฟล์', icon: User });
        if (role === 'admin') {
            navLinks.push({ href: '/admin', label: 'ผู้ดูแลระบบ', icon: User }); // Reusing User icon
        }
    }

    return (
        <nav className="sticky top-0 z-50 w-full" style={{
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
                        <button
                            onClick={handleLogout}
                            className="btn-outline"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                        >
                            <LogOut size={16} /> ออกจากระบบ
                        </button>
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
                        <button onClick={handleLogout} style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--error)' }}>
                            ออกจากระบบ
                        </button>
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
