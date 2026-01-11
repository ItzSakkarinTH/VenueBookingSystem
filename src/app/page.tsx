'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Smartphone, Diamond, MapPin, Bell, X, ArrowRight, UserPlus } from 'lucide-react';

export default function HomePage() {
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  interface Announcement {
    title: string;
    content: string;
    image?: string;
    active: boolean;
  }
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    // Fetch latest active announcement
    fetch('/api/admin/announcements/latest')
      .then(res => res.json())
      .then(data => {
        if (data.announcement) {
          setAnnouncement(data.announcement);
          setShowAnnouncement(true);
        } else {
          // Fallback to static if no dynamic announcement
          setAnnouncement({
            title: 'ประกาศจากตลาดนัด',
            content: 'ยินดีต้อนรับสู่ตลาดนัดคนเดิน! เปิดจองทุกวันจันทร์ - ศุกร์ สำหรับขายวันเสาร์-อาทิตย์',
            active: true
          });
          setShowAnnouncement(true);
        }
      })
      .catch(() => {
        // Silently fail or show static
        setShowAnnouncement(true);
      });
  }, []);

  return (
    <div className="container" style={{
      padding: '2rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
      maxWidth: '100%'
    }}>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '0 0.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <MapPin size={28} color="var(--primary-orange)" />
          <span style={{
            fontSize: '0.9rem',
            color: 'var(--primary-orange)',
            fontWeight: 600,
            background: 'var(--orange-light)',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px'
          }}>
            ตลาดนัดคนเดินศรีสะเกษ
          </span>
        </div>

        <h1 className="animate-fade-in" style={{
          fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
          fontWeight: '800',
          lineHeight: '1.3',
          background: 'var(--gradient-main)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem'
        }}>
          จองล็อกง่ายๆ<br />แค่ปลายนิ้ว
        </h1>

        <p className="animate-fade-in" style={{
          fontSize: 'clamp(0.95rem, 3vw, 1.1rem)',
          color: 'var(--text-muted)',
          marginBottom: '2rem',
          animationDelay: '0.2s',
          lineHeight: '1.6'
        }}>
          ระบบจองพื้นที่ขายของที่ทันสมัย สะดวก รวดเร็ว<br />
          ไม่ต้องแย่งบัตรคิว ไม่ต้องตื่นเช้า
        </p>

        {/* CTA Buttons - Mobile Optimized */}
        <div className="animate-fade-in" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          justifyContent: 'center',
          animationDelay: '0.4s',
          width: '100%'
        }}>
          <Link href="/booking" className="btn-primary" style={{
            padding: '1rem 1.5rem',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%'
          }}>
            <MapPin size={20} />
            จองพื้นที่เลย
            <ArrowRight size={18} />
          </Link>
          <Link href="/register" className="btn-outline" style={{
            padding: '0.875rem 1.5rem',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%'
          }}>
            <UserPlus size={18} />
            สมัครสมาชิก
          </Link>
        </div>
      </div>

      {/* Feature Cards - Mobile First Grid */}
      <div style={{
        marginTop: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        width: '100%',
        maxWidth: '900px'
      }}>
        <FeatureCard
          icon={<Zap size={32} color="var(--primary-orange)" />}
          title="จองไว ได้เลย"
          desc="ระบบ Real-time ใครโอนก่อนได้ก่อน ตัดปัญหาการจองซ้ำ"
        />
        <FeatureCard
          icon={<Smartphone size={32} color="var(--primary-orange)" />}
          title="จ่ายง่าย ตรวจสอบไว"
          desc="รองรับการสแกนสลิปอัตโนมัติ ไม่ต้องรอนาน"
        />
        <FeatureCard
          icon={<Diamond size={32} color="var(--primary-orange)" />}
          title="เลือกทำเลทอง"
          desc="มีโซนให้เลือกหลากหลาย ราคาตามความต้องการ"
        />
      </div>

      {/* Announcement Modal */}
      {showAnnouncement && announcement && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="animate-fade-in" style={{
            background: 'white',
            padding: '0',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '420px',
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <button
              onClick={() => setShowAnnouncement(false)}
              style={{
                position: 'absolute',
                top: '12px', right: '12px',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px', height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
                zIndex: 10
              }}
            >
              <X size={18} color="#64748b" />
            </button>

            <div style={{
              background: 'var(--primary-orange)',
              padding: '1.25rem',
              textAlign: 'center',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <Bell size={22} />
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{announcement.title || 'ประกาศจากตลาดนัด'}</h2>
            </div>

            {announcement.image && (
              <Image
                src={announcement.image}
                alt="Announcement"
                width={420}
                height={200}
                style={{ width: '100%', height: 'auto', maxHeight: '180px', objectFit: 'cover' }}
              />
            )}

            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{
                fontSize: '1rem',
                marginBottom: '1rem',
                whiteSpace: 'pre-line',
                color: 'var(--text-main)',
                lineHeight: '1.6'
              }}>
                {announcement.content}
              </p>
              <button
                onClick={() => setShowAnnouncement(false)}
                className="btn-primary"
                style={{ marginTop: '1rem', width: '100%', padding: '0.875rem' }}
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

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="glass-panel" style={{
      padding: '1.5rem',
      textAlign: 'center',
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid #f1f5f9'
    }}>
      <div style={{
        marginBottom: '0.75rem',
        display: 'flex',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '1.1rem',
        marginBottom: '0.5rem',
        color: 'var(--text-main)',
        fontWeight: 600
      }}>
        {title}
      </h3>
      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        lineHeight: '1.5'
      }}>
        {desc}
      </p>
    </div>
  );
}
