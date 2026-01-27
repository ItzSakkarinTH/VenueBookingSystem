'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Bell, X, ArrowRight, Clock, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { getCookie } from 'cookies-next';

export default function HomePage() {
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  interface Announcement {
    title: string;
    content: string;
    image?: string;
    active: boolean;
  }

  useEffect(() => {
    // 1. Check login status
    const loggedIn = !!(getCookie('name') || getCookie('role'));
    // Use setTimeout to avoid synchronous setState lint error and satisfy hydration
    setTimeout(() => {
      setIsLoggedIn(loggedIn);
    }, 0);

    // 2. Fetch announcement
    fetch('/api/admin/announcements/latest')
      .then(res => res.json())
      .then(data => {
        if (data.announcement) {
          setAnnouncement(data.announcement);
          setShowAnnouncement(true);
        } else {
          setAnnouncement({
            title: 'ประกาศจากตลาดนัด',
            content: 'ยินดีต้อนรับสู่ตลาดนัดคนเดิน! เปิดจองทุกวันจันทร์ - ศุกร์ สำหรับขายวันเสาร์-อาทิตย์',
            active: true
          });
          setShowAnnouncement(true);
        }
      })
      .catch(() => {
        setShowAnnouncement(true);
      });
  }, []);

  const zones = [
    { id: 'A', name: 'โซนโชติพันธ์ 1', color: '#ef4444' },
    { id: 'B', name: 'โซนคนเดิน', color: '#f97316' },
    { id: 'C', name: 'โซนจุ่มแซบ', color: '#eab308' },
    { id: 'D', name: 'โซนหนองแคน', color: '#22c55e' },
    { id: 'E', name: 'โซนวิจิตร', color: '#3b82f6' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #ff8c42 0%, #ff5e1a 50%, #e84a0e 100%)',
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '2rem 1rem'
      }}>
        {/* Decorative Elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-15%',
          width: '500px',
          height: '500px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          filter: 'blur(80px)'
        }} />

        <div style={{
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          zIndex: 10,
          maxWidth: '700px'
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            padding: '8px 20px',
            borderRadius: '50px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            fontWeight: 500
          }}>
            <Sparkles size={16} />
            <span>ตลาดนัดคนเดินศรีสะเกษ</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            textShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            จองล็อกขายของ<br />ง่ายแค่ปลายนิ้ว
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 3vw, 1.3rem)',
            opacity: 0.95,
            marginBottom: '2.5rem',
            lineHeight: '1.7',
            maxWidth: '500px',
            margin: '0 auto 2.5rem auto'
          }}>
            ระบบจองพื้นที่ขายของออนไลน์ สะดวก รวดเร็ว ปลอดภัย
            จ่ายเงินปุ๊บ ได้ล็อกปั๊บ ไม่ต้องตื่นเช้ามาแย่งคิว
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <Link href="/booking" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'white',
              color: '#e84a0e',
              padding: '18px 40px',
              borderRadius: '50px',
              fontSize: '1.2rem',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
              <MapPin size={22} />
              <span>จองพื้นที่ตอนนี้</span>
              <ArrowRight size={20} />
            </Link>

            {!isLoggedIn && (
              <Link href="/login" style={{
                color: 'white',
                textDecoration: 'none',
                fontSize: '1rem',
                opacity: 0.9,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>มีบัญชีแล้ว?</span>
                <span style={{ textDecoration: 'underline' }}>เข้าสู่ระบบ</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '4rem 1rem',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
          fontWeight: '700',
          color: '#1a1a2e',
          marginBottom: '3rem'
        }}>
          ทำไมต้องจองกับเรา?
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          <FeatureCard
            icon={<Clock size={28} />}
            title="จองได้ 24 ชม."
            desc="ไม่ต้องรอเปิดทำการ จองได้ทุกเวลาที่สะดวก"
            color="#10b981"
          />
          <FeatureCard
            icon={<ShieldCheck size={28} />}
            title="ปลอดภัย 100%"
            desc="ระบบตรวจสอบสลิปอัตโนมัติ ไม่มีปัญหาซ้ำซ้อน"
            color="#3b82f6"
          />
          <FeatureCard
            icon={<Users size={28} />}
            title="ยุติธรรมทุกคน"
            desc="ใครโอนก่อนได้ก่อน ตัดปัญหาการเส้นสายเสียที"
            color="#8b5cf6"
          />
        </div>
      </section>

      {/* Zone Preview */}
      <section style={{
        background: 'linear-gradient(180deg, #fff8f3 0%, #fff 100%)',
        padding: '4rem 1rem'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(1.3rem, 4vw, 2rem)',
            fontWeight: '700',
            color: '#1a1a2e',
            marginBottom: '1rem'
          }}>
            5 โซน รองรับ 135 ล็อก
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            เลือกโซนที่ใช่ ในราคาเพียง 43 บาท/ล็อก
          </p>

          {/* Zone Cards */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}>
            {zones.map(zone => (
              <div key={zone.id} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: `2px solid ${zone.color}20`
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: zone.color,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {zone.id}
                </div>
              </div>
            ))}
          </div>

          <Link href="/booking" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
            color: 'white',
            padding: '14px 32px',
            borderRadius: '50px',
            fontSize: '1rem',
            fontWeight: '600',
            textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(232, 74, 14, 0.3)'
          }}>
            <span>ดูแผนที่และจองเลย</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{
        background: '#1a1a2e',
        color: 'white',
        padding: '3rem 1rem',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', opacity: 0.9 }}>
          {isLoggedIn ? 'พร้อมจองล็อกแล้วหรือยัง?' : 'พร้อมเริ่มขายของหรือยัง?'}
        </p>
        <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>
          {isLoggedIn ? 'เลือกโซนและล็อกที่ต้องการได้เลย!' : 'สมัครสมาชิกวันนี้ จองได้ทันที'}
        </p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {isLoggedIn ? (
            <>
              <Link href="/booking" style={{
                background: 'white',
                color: '#1a1a2e',
                padding: '12px 28px',
                borderRadius: '50px',
                fontWeight: '600',
                textDecoration: 'none'
              }}>
                จองล็อกเลย
              </Link>
              <Link href="/my-bookings" style={{
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '12px 28px',
                borderRadius: '50px',
                fontWeight: '500',
                textDecoration: 'none'
              }}>
                ดูประวัติการจอง
              </Link>
            </>
          ) : (
            <>
              <Link href="/register" style={{
                background: 'white',
                color: '#1a1a2e',
                padding: '12px 28px',
                borderRadius: '50px',
                fontWeight: '600',
                textDecoration: 'none'
              }}>
                สมัครสมาชิก
              </Link>
              <Link href="/booking" style={{
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '12px 28px',
                borderRadius: '50px',
                fontWeight: '500',
                textDecoration: 'none'
              }}>
                จองเลย
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Announcement Modal */}
      {showAnnouncement && announcement && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            maxWidth: '400px',
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)'
          }}>
            <button
              onClick={() => setShowAnnouncement(false)}
              style={{
                position: 'absolute',
                top: '16px', right: '16px',
                background: 'rgba(0,0,0,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '36px', height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <X size={18} color="#666" />
            </button>

            <div style={{
              background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              color: 'white'
            }}>
              <Bell size={32} style={{ marginBottom: '0.5rem' }} />
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{announcement.title}</h2>
            </div>

            {announcement.image && (
              <Image
                src={announcement.image}
                alt="Announcement"
                width={400}
                height={180}
                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
              />
            )}

            <div style={{ padding: '1.5rem' }}>
              <p style={{
                fontSize: '1rem',
                whiteSpace: 'pre-line',
                color: '#374151',
                lineHeight: '1.7',
                textAlign: 'center'
              }}>
                {announcement.content}
              </p>
              <button
                onClick={() => setShowAnnouncement(false)}
                style={{
                  marginTop: '1.5rem',
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #ff8c42 0%, #e84a0e 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '20px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      border: '1px solid #f1f5f9'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        background: `${color}15`,
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        marginBottom: '1rem'
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '1.15rem',
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: '0.5rem'
      }}>
        {title}
      </h3>
      <p style={{
        color: '#64748b',
        fontSize: '0.95rem',
        lineHeight: '1.6',
        margin: 0
      }}>
        {desc}
      </p>
    </div>
  );
}
