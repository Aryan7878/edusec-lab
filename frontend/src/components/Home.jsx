import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'On-Demand Sandboxed Labs',
    icon: '🚀',
    accent: 'rgba(0, 219, 222, 0.12)',
    border: 'rgba(0, 219, 222, 0.3)',
    glow: 'rgba(0, 219, 222, 0.15)',
    text: 'Spin up isolated target environments (like DVWA and OWASP Juice Shop) dynamically per session. Fully containerized security testing with zero impact on your local system.'
  },
  {
    title: 'Persistent Kali Linux VM',
    icon: '💻',
    accent: 'rgba(123, 97, 255, 0.15)',
    border: 'rgba(123, 97, 255, 0.35)',
    glow: 'rgba(123, 97, 255, 0.2)',
    text: 'Access a browser-based, tool-provisioned penetration testing container preloaded with nmap, gobuster, hydra, john, and sqlmap, backed by smart inactivity timeouts.'
  },
  {
    title: 'Socratic AI Tutor & Coach',
    icon: '🤖',
    accent: 'rgba(255, 107, 107, 0.12)',
    border: 'rgba(255, 107, 107, 0.3)',
    glow: 'rgba(255, 107, 107, 0.15)',
    text: 'Learn with an interactive assistant that analyzes target vulnerabilities to suggest methodologies. Enforces responsible disclosure guidelines and refuses direct answers.'
  },
  {
    title: 'Gamified CTF Arena',
    icon: '🔐',
    accent: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.3)',
    glow: 'rgba(34, 197, 94, 0.15)',
    text: 'Test your knowledge on realistic challenges. Capture security flags, submit solutions for instant validation, track scores, and compete on the global leaderboard.'
  }
];

const supportedLabs = [
  { name: 'DVWA (Damn Vulnerable Web App)', tag: 'OWASP Top 10', icon: 'bi-bug', level: 'Easy' },
  { name: 'OWASP Juice Shop', tag: 'Modern Node APIs', icon: 'bi-shop', level: 'Medium' },
  { name: 'Kali Linux Workspace', tag: 'Penetration Testing Tools', icon: 'bi-terminal', level: 'Any' }
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState('');
  const terminalLines = [
    'root@edusec:~# nmap -sS -sV 10.0.8.12',
    'Starting Nmap 7.93 ( https://nmap.org )',
    'Nmap scan report for 10.0.8.12',
    'PORT     STATE SERVICE VERSION',
    '80/tcp   open  http    Apache httpd 2.4.41',
    '3000/tcp open  http    Node.js (OWASP Juice Shop)',
    'Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel',
    'root@edusec:~# _'
  ];

  useEffect(() => {
    setMounted(true);
    let currentLine = 0;
    let currentChar = 0;
    let intervalId;

    const typeText = () => {
      if (currentLine >= terminalLines.length) {
        clearInterval(intervalId);
        return;
      }

      const line = terminalLines[currentLine];
      if (currentChar < line.length) {
        setTypedText(prev => prev + line[currentChar]);
        currentChar++;
      } else {
        setTypedText(prev => prev + '\n');
        currentLine++;
        currentChar = 0;
      }
    };

    intervalId = setInterval(typeText, 35);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={{ color: '#f0f2f8', overflowX: 'hidden' }}>
      {/* Hero Section */}
      <section className={`hero-section py-5 ${mounted ? 'mounted' : ''}`}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-7 text-start">
              <span
                className="badge mb-3 px-3 py-2"
                style={{
                  background: 'rgba(123, 97, 255, 0.15)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(123, 97, 255, 0.3)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                ⚡ AI-Powered Cybersecurity Sandbox
              </span>
              <h1 className="display-4 fw-extrabold mb-3" style={{ lineHeight: 1.1, fontWeight: 800 }}>
                Learn Hacking<br />
                <span
                  style={{
                    background: 'linear-gradient(90deg, #7b61ff, #00dbde)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  By Practicing Safely.
                </span>
              </h1>
              <p className="lead mb-4 fs-5" style={{ color: 'rgba(240, 242, 248, 0.78)', maxWidth: '560px', lineHeight: '1.7' }}>
                EduSec Labs provides isolated on-demand lab environments, preconfigured pen-testing workspaces, and an AI tutor—all fully accessible inside your browser.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/login" className="btn btn-primary btn-lg px-4 py-3 cta-raise" style={{ borderRadius: '10px', fontSize: '1rem', fontWeight: 600 }}>
                  <i className="bi bi-terminal me-2"></i>Launch Lab Arena
                </Link>
                <Link to="/register" className="btn btn-outline-light btn-lg px-4 py-3 cta-ghost" style={{ borderRadius: '10px', fontSize: '1rem', fontWeight: 600 }}>
                  Create Free Account
                </Link>
              </div>
            </div>
            <div className="col-lg-5">
              <div
                className="hero-illustration shadow-lg"
                style={{
                  borderRadius: '16px',
                  background: '#0c0f1d',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.65)'
                }}
              >
                <div
                  className="term-top d-flex align-items-center px-3 py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#121626' }}
                >
                  <span className="dot bg-danger rounded-circle me-1" style={{ width: '10px', height: '10px' }}></span>
                  <span className="dot bg-warning rounded-circle me-1" style={{ width: '10px', height: '10px' }}></span>
                  <span className="dot bg-success rounded-circle me-2" style={{ width: '10px', height: '10px' }}></span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>nmap_scan_telemetry.log</span>
                </div>
                <div className="term-body p-3 text-start">
                  <pre style={{ margin: 0, fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                    {typedText}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="container py-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold" style={{ color: '#ffffff' }}>Platform Core Features</h2>
          <p className="text-muted">State-of-the-art sandboxing infrastructure built for interactive education</p>
        </div>
        <div className="row g-4">
          {features.map((c, i) => (
            <div className="col-md-6" key={i}>
              <div
                className="card h-100"
                style={{
                  background: `linear-gradient(135deg, ${c.accent} 0%, rgba(22, 26, 37, 0.85) 100%)`,
                  border: `1px solid ${c.border}`,
                  boxShadow: `0 8px 32px ${c.glow}, 0 1px 0 rgba(255,255,255,0.04)`,
                  transition: 'transform 220ms ease, box-shadow 220ms ease',
                  borderRadius: '16px'
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
                <div className="card-body p-4 text-start">
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
                  <h5 className="fw-bold mb-2" style={{ color: '#f0f2f8', fontSize: '1.15rem' }}>
                    {c.title}
                  </h5>
                  <p className="mb-0" style={{ color: 'rgba(240, 242, 248, 0.72)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {c.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Labs section */}
      <section className="py-5" style={{ background: 'rgba(18, 22, 34, 0.4)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold" style={{ color: '#ffffff' }}>Active Laboratories</h2>
            <p className="text-muted">Simulate pentesting vectors across standardized environments</p>
          </div>
          <div className="row g-4 justify-content-center">
            {supportedLabs.map((lab, i) => (
              <div className="col-lg-4 col-md-6" key={i}>
                <div
                  className="p-4"
                  style={{
                    background: 'rgba(18, 22, 34, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-secondary px-2.5 py-1" style={{ fontSize: '0.75rem' }}>{lab.level}</span>
                    <i className={`bi ${lab.icon}`} style={{ fontSize: '1.5rem', color: '#7b61ff' }}></i>
                  </div>
                  <h6 className="fw-bold mb-2 text-start" style={{ color: '#ffffff' }}>{lab.name}</h6>
                  <p className="text-muted mb-0 text-start" style={{ fontSize: '0.85rem' }}>{lab.tag}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture overview */}
      <section className="container py-5 text-center">
        <h2 className="fw-bold mb-3" style={{ color: '#ffffff' }}>Architecture Overview</h2>
        <p className="text-muted mb-5">Micro-isolated web endpoints secure database integrity and student containers</p>
        <div
          className="p-4 shadow-lg mx-auto"
          style={{
            maxWidth: '850px',
            background: 'rgba(12, 15, 29, 0.9)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px'
          }}
        >
          <div className="row g-3 justify-content-center align-items-center">
            <div className="col-md-3">
              <div className="p-3 border border-secondary rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="fw-bold" style={{ color: '#a78bfa' }}>Client Workspace</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Vite + React SPA</div>
              </div>
            </div>
            <div className="col-md-1">➡️</div>
            <div className="col-md-4">
              <div className="p-3 border border-primary rounded" style={{ background: 'rgba(123, 97, 255, 0.1)' }}>
                <div className="fw-bold" style={{ color: '#38bdf8' }}>Express Node API</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>JWT Verification + LabManager</div>
              </div>
            </div>
            <div className="col-md-1">➡️</div>
            <div className="col-md-3">
              <div className="p-3 border border-success rounded" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                <div className="fw-bold" style={{ color: '#4ade80' }}>Isolated Docker</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Per-User sandboxes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="container py-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold" style={{ color: '#ffffff' }}>Demonstration Video</h2>
          <p className="text-muted">Take a visual tour of lab orchestration and the CTF arena</p>
        </div>
        <div
          className="ratio ratio-16x9 mx-auto shadow-lg"
          style={{
            maxWidth: '750px',
            borderRadius: '16px',
            border: '2px solid rgba(123, 97, 255, 0.35)',
            background: '#000000',
            overflow: 'hidden'
          }}
        >
          <div className="d-flex align-items-center justify-content-center flex-column text-muted p-4">
            <i className="bi bi-play-circle" style={{ fontSize: '4.5rem', color: '#7b61ff' }}></i>
            <span className="mt-3 fw-semibold">Interactive Video Preview Pending Recording</span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Includes container orchestration, AI Tutor, and flags verification</span>
          </div>
        </div>
      </section>

      {/* Branding Tech Grid */}
      <section className="py-5" style={{ background: 'rgba(18, 22, 34, 0.3)' }}>
        <div className="container text-center">
          <h5 className="text-muted text-uppercase mb-4" style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>Technologies Fueling the Platform</h5>
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-4">
            {['React', 'NodeJS', 'Express', 'MongoDB', 'Docker', 'Vite', 'xterm.js', 'Bootstrap'].map((tech, i) => (
              <span
                key={tech}
                className="px-3 py-1.5 border rounded"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: 'rgba(240,242,248,0.6)',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
