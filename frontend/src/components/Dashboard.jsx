import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { getScore } from '../api/ctf.api';

const T = '#f0f2f8';          // bright text
const T2 = 'rgba(240,242,248,0.65)';  // secondary
const T3 = 'rgba(240,242,248,0.42)';  // muted

const STAT_CARDS = [
  { label: 'Total Labs',     key: 'totalLabs',    icon: '📚', cls: 'stat-card-blue'  },
  { label: 'Completed',      key: 'completedLabs', icon: '✅', cls: 'stat-card-green' },
  { label: 'In Progress',    key: 'inProgress',    icon: '🔄', cls: 'stat-card-amber' },
  { label: 'Total Score',    key: 'totalScore',    icon: '🏆', cls: 'stat-card-cyan'  },
  { label: 'Flags Captured', key: 'ctfFlags',      icon: '🚩', cls: 'stat-card-purple'},
];

const DIFF_COLOR = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
const STATUS_COLOR = {
  completed:   { bg: 'rgba(34,197,94,0.18)',   color: '#86efac' },
  in_progress: { bg: 'rgba(123,97,255,0.18)',  color: '#c4b5fd' },
  not_started: { bg: 'rgba(255,255,255,0.08)', color: T2        },
};

const levelStyle = {
  beginner:     { bg: 'rgba(6,182,212,0.2)',    color: '#67e8f9' },
  intermediate: { bg: 'rgba(245,158,11,0.2)',   color: '#fde68a' },
  advanced:     { bg: 'rgba(239,68,68,0.2)',    color: '#fca5a5' },
  expert:       { bg: 'rgba(123,97,255,0.25)',  color: '#c4b5fd' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,      setStats]      = useState({ totalLabs: 0, completedLabs: 0, inProgress: 0, totalScore: 0, ctfFlags: 0 });
  const [recentLabs, setRecentLabs] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: labs } = await api.get('/api/labs');
      const completed  = labs.filter(l => l.userProgress.status === 'completed').length;
      const inProgress = labs.filter(l => l.userProgress.status === 'in_progress').length;
      const totalScore = labs
        .filter(l => l.userProgress.status === 'completed')
        .reduce((s, l) => s + l.userProgress.score, 0);

      setStats({ totalLabs: labs.length, completedLabs: completed, inProgress, totalScore, ctfFlags: 0 });

      // Fetch CTF score in parallel (fails silently — CTF is optional)
      try {
        const ctf = await getScore();
        setStats(prev => ({ ...prev, ctfFlags: ctf.solved || 0 }));
      } catch (_) { /* CTF not yet seeded or unavailable — ignore */ }

      const sorted = labs
        .filter(l => l.userProgress?.status === 'in_progress' || l.userProgress?.status === 'completed')
        .sort((a, b) => {
          if (a.userProgress.status === 'in_progress' && b.userProgress.status !== 'in_progress') return -1;
          if (b.userProgress.status === 'in_progress' && a.userProgress.status !== 'in_progress') return 1;
          return 0;
        })
        .slice(0, 3);

      setRecentLabs(sorted.length > 0 ? sorted : labs.slice(0, 3));
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const lvl = user?.level || 'beginner';
  const lvlStyle = levelStyle[lvl] || levelStyle.beginner;
  const completionPct = stats.totalLabs > 0
    ? Math.round((stats.completedLabs / stats.totalLabs) * 100)
    : 0;

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: '#7b61ff' }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="mt-3" style={{ color: T2 }}>Loading your dashboard…</p>
      </div>
    );
  }

  /* ─── card base style ─────────────────────────────────── */
  const cardBase = {
    background: 'rgba(18,22,34,0.82)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    backdropFilter: 'blur(16px)',
    animation: 'none',
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-5">
        <h1 style={{ color: T, fontWeight: 700, fontSize: '1.9rem' }}>
          Welcome back, <span style={{ color: '#a490ff' }}>{user?.username}</span>! 👋
        </h1>
        <p style={{ color: T2, margin: 0 }}>Continue your cybersecurity learning journey</p>
      </div>

      {/* ── Stats ── */}
      <div className="row g-3 mb-5">
        {STAT_CARDS.map(({ label, key, icon, cls }) => (
          <div key={key} className="col-6 col-md-3">
            <div className={`card stat-card ${cls} h-100`} style={{ animation: 'none' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stat-label mb-2">{label}</div>
                    <div className="stat-value">{stats[key]}</div>
                  </div>
                  <div className="stat-icon">{icon}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions + Profile ── */}
      <div className="row g-4 mb-4">
        {/* Quick Actions */}
        <div className="col-md-6">
          <div className="card h-100" style={cardBase}>
            <div className="card-body p-4">
              <h5 style={{ color: T, fontWeight: 700, marginBottom: '1.2rem' }}>
                <i className="bi bi-lightning-charge me-2" style={{ color: '#a490ff' }}></i>
                Quick Actions
              </h5>
              <div className="d-grid gap-2">
                <Link to="/labs" className="btn btn-primary btn-lg" style={{ borderRadius: 12, fontWeight: 600 }}>
                  <i className="bi bi-play-circle me-2"></i>Start a New Lab
                </Link>
                <Link to="/kali-vm" className="btn btn-outline-primary btn-lg" style={{ borderRadius: 12, fontWeight: 500 }}>
                  <i className="bi bi-terminal me-2"></i>Access Kali VM
                </Link>
                <Link to="/ai-assistant" className="btn btn-outline-success btn-lg" style={{ borderRadius: 12, fontWeight: 500 }}>
                  <i className="bi bi-robot me-2"></i>Ask AI Assistant
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="col-md-6">
          <div className="card h-100" style={cardBase}>
            <div className="card-body p-4">
              <h5 style={{ color: T, fontWeight: 700, marginBottom: '1.2rem' }}>
                <i className="bi bi-person-circle me-2" style={{ color: '#a490ff' }}></i>
                Your Profile
              </h5>

              <div className="mb-3 d-flex align-items-center gap-2">
                <span style={{ color: T2, fontSize: '0.85rem', fontWeight: 500 }}>Level:</span>
                <span
                  className="badge"
                  style={{
                    background: lvlStyle.bg,
                    color: lvlStyle.color,
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    padding: '4px 10px',
                    borderRadius: 6,
                  }}
                >
                  {lvl}
                </span>
              </div>

              <div className="mb-4 d-flex align-items-center gap-2">
                <span style={{ color: T2, fontSize: '0.85rem', fontWeight: 500 }}>Badges:</span>
                <span
                  className="badge"
                  style={{ background: 'rgba(123,97,255,0.2)', color: '#c4b5fd', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}
                >
                  {user?.badges?.length || 0}
                </span>
              </div>

              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ color: T2, fontSize: '0.82rem' }}>Lab Completion</span>
                  <span style={{ color: '#a490ff', fontSize: '0.82rem', fontWeight: 700 }}>{completionPct}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${completionPct}%`,
                      background: 'linear-gradient(90deg, #7b61ff, #00dbde)',
                      borderRadius: 999,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
                <p style={{ color: T3, fontSize: '0.8rem', marginTop: 6, marginBottom: 0 }}>
                  {stats.completedLabs} of {stats.totalLabs} labs completed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Labs ── */}
      {recentLabs.length > 0 && (
        <div>
          <h5 style={{ color: T, fontWeight: 700, marginBottom: '1rem' }}>
            <i className="bi bi-clock-history me-2" style={{ color: '#a490ff' }}></i>
            Recent Labs
          </h5>
          <div className="row g-3">
            {recentLabs.map(lab => {
              const diff = lab.difficulty || 'easy';
              const statusKey = lab.userProgress.status || 'not_started';
              const st = STATUS_COLOR[statusKey] || STATUS_COLOR.not_started;
              return (
                <div key={lab._id} className="col-md-4">
                  <div
                    className="card h-100"
                    style={{
                      ...cardBase,
                      transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = 'rgba(123,97,255,0.35)';
                      e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.45)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div className="card-body p-4">
                      {/* Difficulty badge */}
                      <span
                        className="badge mb-2"
                        style={{
                          background: `${DIFF_COLOR[diff]}22`,
                          color: DIFF_COLOR[diff],
                          border: `1px solid ${DIFF_COLOR[diff]}55`,
                          fontWeight: 600, fontSize: '0.72rem', padding: '3px 9px', borderRadius: 6,
                        }}
                      >
                        {diff}
                      </span>

                      {/* Lab name */}
                      <h6 style={{ color: T, fontWeight: 700, fontSize: '0.97rem', marginBottom: '0.4rem' }}>
                        {lab.name}
                      </h6>

                      {/* Description */}
                      <p style={{ color: T2, fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                        {lab.description?.substring(0, 80)}…
                      </p>

                      {/* Status + action */}
                      <div className="d-flex justify-content-between align-items-center">
                        <span
                          className="badge"
                          style={{ background: st.bg, color: st.color, fontWeight: 600, fontSize: '0.72rem', padding: '4px 10px', borderRadius: 6 }}
                        >
                          {statusKey.replace('_', ' ')}
                        </span>
                        <Link to="/labs" className="btn btn-sm btn-outline-primary" style={{ borderRadius: 8 }}>
                          {statusKey === 'not_started' ? 'Start' : 'Continue'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
