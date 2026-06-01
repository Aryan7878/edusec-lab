import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Your Kali, Always On',
    icon: '💻',
    accent: 'rgba(123,97,255,0.15)',
    border: 'rgba(123,97,255,0.3)',
    glow: 'rgba(123,97,255,0.1)',
    text: 'Persistent storage and snapshots keep your tools and notes intact across every session.'
  },
  {
    title: 'Launch Labs Instantly',
    icon: '🚀',
    accent: 'rgba(0,219,222,0.12)',
    border: 'rgba(0,219,222,0.28)',
    glow: 'rgba(0,219,222,0.08)',
    text: 'Spin up vulnerable target machines with isolated networks in seconds — no setup required.'
  },
  {
    title: 'Learn Faster with AI',
    icon: '🤖',
    accent: 'rgba(255,107,107,0.12)',
    border: 'rgba(255,107,107,0.28)',
    glow: 'rgba(255,107,107,0.08)',
    text: 'Ask for contextual hints, fix tool syntax, and debug errors in real time — without spoilers.'
  }
];

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(id);
  }, []);

  return (
    <div>
      <section className={`hero-section ${mounted ? 'mounted' : ''}`}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <span
                className="badge mb-3 px-3 py-2"
                style={{
                  background: 'rgba(123,97,255,0.2)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(123,97,255,0.3)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em'
                }}
              >
                ⚡ Welcome to EduSec Labs
              </span>
              <h1 className="display-5 fw-bold mb-3" style={{ lineHeight: 1.15 }}>
                Learn Cybersecurity<br />
                <span style={{
                  background: 'linear-gradient(90deg, #7b61ff, #00dbde)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  by Doing.
                </span>
              </h1>
              <p className="lead mb-4" style={{ color: 'rgba(240,242,248,0.78)', maxWidth: '520px' }}>
                Your personal, persistent Kali machine and on‑demand target labs with AI guidance — all in your browser.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/login" className="btn btn-primary btn-lg cta-raise">
                  <i className="bi bi-terminal me-2"></i>Start Hacking
                </Link>
                <Link to="/register" className="btn btn-outline-light btn-lg cta-ghost">
                  Create Free Account
                </Link>
              </div>
            </div>
            <div className="col-lg-5 mt-4 mt-lg-0 d-flex justify-content-center align-items-center">
              <div className="hero-illustration me-3">
                <div className="term-top">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="term-body p-3">
                  <pre className="m-0">$ ssh kali@localhost -p 2222
Welcome to EduSec Labs
root@kali:~# nmap -sS 10.0.0.5
Starting Nmap 7.80 ( https://nmap.org )</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-4 mt-md-5 pb-5">
        <div className="row g-4">
          {features.map((c, i) => (
            <div className="col-md-4" key={i}>
              <div
                className="card h-100"
                style={{
                  background: `linear-gradient(135deg, ${c.accent} 0%, rgba(22,26,37,0.85) 100%)`,
                  border: `1px solid ${c.border}`,
                  boxShadow: `0 8px 32px ${c.glow}, 0 1px 0 rgba(255,255,255,0.04)`,
                  transition: 'transform 220ms ease, box-shadow 220ms ease',
                  animationDelay: `${i * 0.1}s`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = `0 20px 48px ${c.glow}, 0 1px 0 rgba(255,255,255,0.06)`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = `0 8px 32px ${c.glow}, 0 1px 0 rgba(255,255,255,0.04)`;
                }}
              >
                <div className="card-body p-4">
                  <div
                    className="mb-3 d-inline-flex align-items-center justify-content-center"
                    style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: c.accent,
                      border: `1px solid ${c.border}`,
                      fontSize: '1.6rem'
                    }}
                  >
                    {c.icon}
                  </div>
                  <h5
                    className="fw-bold mb-2"
                    style={{ color: '#f0f2f8', fontSize: '1.05rem' }}
                  >
                    {c.title}
                  </h5>
                  <p
                    className="mb-0"
                    style={{ color: 'rgba(240,242,248,0.7)', fontSize: '0.9rem', lineHeight: 1.65 }}
                  >
                    {c.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


