import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard } from '../api/ctf.api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T  = '#f0f2f8';
const T2 = 'rgba(240,242,248,0.65)';
const T3 = 'rgba(240,242,248,0.42)';

const cardBase = {
  background:    'rgba(18,22,34,0.82)',
  border:        '1px solid rgba(255,255,255,0.08)',
  borderRadius:  16,
  backdropFilter:'blur(16px)',
};

// Medal styling for top 3 ranks
const RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_COLOR = {
  1: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)'  },
  2: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.25)'},
  3: { color: '#cd7c2f', bg: 'rgba(205,124,47,0.12)',  border: 'rgba(205,124,47,0.3)'  },
};

// ─── Leaderboard Page ─────────────────────────────────────────────────────────
const Leaderboard = () => {
  const { user } = useAuth();

  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats,     setMyStats]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mounted,     setMounted]     = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard();
      setLeaderboard(data.leaderboard || []);
      setMyStats(data.myStats || null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setMounted(true), 50);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: '#7b61ff' }} role="status" />
        <p className="mt-3" style={{ color: T2 }}>Loading leaderboard...</p>
      </div>
    );
  }

  const isCurrentUser = (username) => username === user?.username;

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease' }}>

      {/* ── Page header ── */}
      <div className="d-flex justify-content-between align-items-start mb-5 flex-wrap gap-3">
        <div>
          <h1 style={{ color: T, fontWeight: 700 }}>🏆 Leaderboard</h1>
          <p style={{ color: T2, margin: 0 }}>
            Global ranking by CTF points
            {lastUpdated && (
              <span style={{ color: T3, fontSize: '0.78rem', marginLeft: 10 }}>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          className="btn btn-sm"
          style={{
            background:   'rgba(255,255,255,0.06)',
            border:       '1px solid rgba(255,255,255,0.12)',
            color:        T2,
            borderRadius: 8,
            fontSize:     '0.82rem',
          }}
          onClick={fetchLeaderboard}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* ── My rank card ── */}
      {myStats && (
        <div
          className="card mb-4"
          style={{
            ...cardBase,
            border:     '1px solid rgba(123,97,255,0.35)',
            background: 'rgba(123,97,255,0.08)',
          }}
        >
          <div className="card-body p-4">
            <div className="row align-items-center g-3">
              <div className="col-auto">
                <div
                  style={{
                    width:        52,
                    height:       52,
                    borderRadius: '50%',
                    background:   'rgba(123,97,255,0.2)',
                    border:       '2px solid rgba(123,97,255,0.4)',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent:'center',
                    fontSize:     '1.4rem',
                    fontWeight:   800,
                    color:        '#c4b5fd',
                  }}
                >
                  {myStats.rank <= 3 ? RANK_MEDAL[myStats.rank] : `#${myStats.rank}`}
                </div>
              </div>
              <div className="col">
                <div style={{ color: T, fontWeight: 700, fontSize: '1.05rem' }}>
                  {myStats.username}
                  <span
                    className="badge ms-2"
                    style={{ background: 'rgba(123,97,255,0.25)', color: '#c4b5fd', fontSize: '0.7rem', borderRadius: 6, padding: '3px 8px' }}
                  >
                    You
                  </span>
                </div>
                <div style={{ color: T3, fontSize: '0.8rem' }}>
                  Global Rank #{myStats.rank}
                </div>
              </div>
              <div className="col-auto text-end">
                <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1.5rem' }}>
                  {myStats.totalPoints}
                  <span style={{ color: T3, fontSize: '0.8rem', fontWeight: 400, marginLeft: 4 }}>pts</span>
                </div>
                <div style={{ color: T3, fontSize: '0.78rem' }}>
                  {myStats.solved} challenge{myStats.solved !== 1 ? 's' : ''} solved
                </div>
              </div>
            </div>

            {/* Progress towards next milestone */}
            {myStats.solved === 0 && (
              <div
                className="mt-3 p-2 text-center"
                style={{
                  background:   'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  color:        T3,
                  fontSize:     '0.8rem',
                }}
              >
                🚩 Solve your first challenge to appear on the leaderboard!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Leaderboard table ── */}
      {leaderboard.length === 0 ? (
        <div className="card text-center" style={cardBase}>
          <div className="card-body py-5">
            <div style={{ fontSize: '3rem' }}>🏆</div>
            <h4 style={{ color: T, marginTop: '1rem' }}>No scores yet</h4>
            <p style={{ color: T2 }}>
              Be the first to solve a challenge and claim the top spot!
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={cardBase}>
          <div
            className="card-header"
            style={{
              background:   'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding:      '1rem 1.5rem',
            }}
          >
            <div className="row" style={{ color: T3, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em' }}>
              <div className="col-1">RANK</div>
              <div className="col-5 col-md-6">PLAYER</div>
              <div className="col-3 col-md-3 text-center">CHALLENGES</div>
              <div className="col-3 col-md-2 text-end">POINTS</div>
            </div>
          </div>

          <div className="card-body p-0">
            {leaderboard.map((entry, idx) => {
              const rank     = idx + 1;
              const isMe     = isCurrentUser(entry.username);
              const medalStyle = RANK_COLOR[rank] || null;

              return (
                <div
                  key={entry.userId || idx}
                  style={{
                    padding:      '1rem 1.5rem',
                    borderBottom: idx < leaderboard.length - 1
                      ? '1px solid rgba(255,255,255,0.05)'
                      : 'none',
                    background:   isMe
                      ? 'rgba(123,97,255,0.08)'
                      : rank <= 3
                        ? medalStyle?.bg
                        : 'transparent',
                    borderLeft:   isMe ? '3px solid #7b61ff' : '3px solid transparent',
                    transition:   'background 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isMe) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isMe
                      ? 'rgba(123,97,255,0.08)'
                      : rank <= 3 ? medalStyle?.bg : 'transparent';
                  }}
                >
                  <div className="row align-items-center">
                    {/* Rank */}
                    <div className="col-1">
                      {rank <= 3 ? (
                        <span style={{ fontSize: '1.3rem' }}>{RANK_MEDAL[rank]}</span>
                      ) : (
                        <span
                          style={{
                            color:      T3,
                            fontWeight: 700,
                            fontSize:   '0.88rem',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          #{rank}
                        </span>
                      )}
                    </div>

                    {/* Username */}
                    <div className="col-5 col-md-6">
                      <div
                        style={{
                          color:      isMe ? '#c4b5fd' : rank <= 3 ? medalStyle?.color : T,
                          fontWeight: isMe || rank <= 3 ? 700 : 500,
                          fontSize:   '0.95rem',
                          display:    'flex',
                          alignItems: 'center',
                          gap:        8,
                        }}
                      >
                        {/* Avatar initial */}
                        <div
                          style={{
                            width:         30,
                            height:        30,
                            borderRadius:  '50%',
                            background:    isMe
                              ? 'rgba(123,97,255,0.3)'
                              : rank <= 3
                                ? `${medalStyle?.border}`
                                : 'rgba(255,255,255,0.08)',
                            display:       'flex',
                            alignItems:    'center',
                            justifyContent:'center',
                            fontSize:      '0.75rem',
                            fontWeight:    700,
                            color:         isMe ? '#c4b5fd' : T2,
                            flexShrink:    0,
                          }}
                        >
                          {entry.username?.[0]?.toUpperCase() || '?'}
                        </div>

                        {entry.username}

                        {isMe && (
                          <span
                            className="badge"
                            style={{
                              background:   'rgba(123,97,255,0.25)',
                              color:        '#c4b5fd',
                              fontSize:     '0.65rem',
                              borderRadius: 5,
                              padding:      '2px 6px',
                            }}
                          >
                            You
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Challenges solved */}
                    <div className="col-3 col-md-3 text-center">
                      <span
                        className="badge"
                        style={{
                          background:   'rgba(255,255,255,0.07)',
                          color:        T2,
                          borderRadius: 8,
                          fontSize:     '0.8rem',
                          padding:      '4px 10px',
                          fontWeight:   600,
                        }}
                      >
                        🚩 {entry.solved}
                      </span>
                    </div>

                    {/* Points */}
                    <div className="col-3 col-md-2 text-end">
                      <span
                        style={{
                          color:      rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7c2f' : '#a490ff',
                          fontWeight: 800,
                          fontSize:   '1.05rem',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {entry.totalPoints}
                        <span style={{ color: T3, fontSize: '0.72rem', fontWeight: 400, marginLeft: 3 }}>pts</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div
            className="card-footer"
            style={{
              background:   'rgba(255,255,255,0.02)',
              borderTop:    '1px solid rgba(255,255,255,0.06)',
              padding:      '0.75rem 1.5rem',
              color:        T3,
              fontSize:     '0.75rem',
              textAlign:    'center',
            }}
          >
            Showing top {leaderboard.length} players by total points.
            Ties broken by number of challenges solved.
          </div>
        </div>
      )}

      {/* ── How points work ── */}
      <div className="card mt-4" style={cardBase}>
        <div className="card-body p-4">
          <h6 style={{ color: T, fontWeight: 700, marginBottom: '1rem' }}>
            📊 How Points Work
          </h6>
          <div className="row g-3">
            {[
              { diff: 'Easy',   color: '#22c55e', range: '50–100 pts', desc: 'Great for beginners. Foundational concepts.' },
              { diff: 'Medium', color: '#f59e0b', range: '100–200 pts', desc: 'Requires deeper knowledge and tool proficiency.' },
              { diff: 'Hard',   color: '#ef4444', range: '200+ pts', desc: 'Advanced exploitation and research skills.' },
            ].map(({ diff, color, range, desc }) => (
              <div key={diff} className="col-md-4">
                <div
                  style={{
                    background:   `${color}10`,
                    border:       `1px solid ${color}30`,
                    borderRadius: 10,
                    padding:      '12px 16px',
                  }}
                >
                  <div style={{ color, fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>
                    {diff} — {range}
                  </div>
                  <div style={{ color: T3, fontSize: '0.78rem' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
