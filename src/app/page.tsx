'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    <div className="container" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>

      <div style={{ textAlign: 'center', maxWidth: '800px' }}>
        <h1 className="animate-fade-in" style={{
          fontSize: '3.5rem',
          fontWeight: '800',
          lineHeight: '1.2',
          background: 'var(--gradient-main)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem'
        }}>
          ตลาดนัดคนเดิน<br />จองล็อกง่ายๆ แค่ปลายนิ้ว
        </h1>
        <p className="animate-fade-in" style={{
          fontSize: '1.25rem',
          color: 'var(--text-muted)',
          marginBottom: '3rem',
          animationDelay: '0.2s'
        }}>
          ระบบจองพื้นที่ขายของที่ทันสมัยที่สุด สะดวก รวดเร็ว จ่ายเงินปุ๊บ ได้ล็อกปั๊บ<br />
          ไม่ต้องแย่งบัตรคิว ไม่ต้องตื่นเช้า
        </p>

        <div className="animate-fade-in" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', animationDelay: '0.4s' }}>
          <Link href="/booking" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem' }}>
            🚀 จองพื้นที่เลย
          </Link>
          <Link href="/register" className="btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem' }}>
            📝 สมัครสมาชิก
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%' }}>
        <FeatureCard
          icon="⚡"
          title="จองไว ได้เลย"
          desc="ระบบ Real-time ใครโอนก่อนได้ก่อน ตัดปัญหาการจองซ้ำ"
        />
        <FeatureCard
          icon="📱"
          title="จ่ายง่าย ตรวจสอบไว"
          desc="รองรับการสแกนสลิปอัตโนมัติ ไม่ต้องรอนาน"
        />
        <FeatureCard
          icon="💎"
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
          backdropFilter: 'blur(5px)'
        }}>
          <div className="animate-fade-in" style={{
            background: 'white',
            padding: '0',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '500px',
            width: '90%',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <button
              onClick={() => setShowAnnouncement(false)}
              style={{
                position: 'absolute',
                top: '10px', right: '10px',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px', height: '32px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              ✕
            </button>
            <div style={{ background: 'var(--primary-orange)', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
              <h2 style={{ margin: 0 }}>📢 {announcement.title || 'ประกาศจากตลาดนัด'}</h2>
            </div>

            {announcement.image && (
              <img src={announcement.image} alt="Announcement" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
            )}

            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                {announcement.content}
              </p>
              <button
                onClick={() => setShowAnnouncement(false)}
                className="btn-primary"
                style={{ marginTop: '1.5rem', width: '100%' }}
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

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', background: 'white' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)' }}>{desc}</p>
    </div>
  );
}
