import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { getChallenges, submitFlag } from '../api/ctf.api';

// ─── Design tokens (match existing project style) ─────────────────────────────
const T  = '#f0f2f8';
const T2 = 'rgba(240,242,248,0.65)';
const T3 = 'rgba(240,242,248,0.42)';

const cardBase = {
  background:    'rgba(18,22,34,0.82)',
  border:        '1px solid rgba(255,255,255,0.08)',
  borderRadius:  16,
  backdropFilter:'blur(16px)',
};

const DIFF_COLOR  = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
const DIFF_LABEL  = { easy: 'Easy',    medium: 'Medium',   hard: 'Hard'    };
const DIFF_POINTS = { easy: '50–100',  medium: '100–200',  hard: '200+'    };

const CAT_ICONS = {
  'Web Security':      '🌐',
  'Network Security':  '🔗',
  'Cryptography':      '🔐',
  'Forensics':         '🔍',
  'OSINT':             '👁️',
};

const CATEGORIES = ['All', 'Web Security', 'Network Security', 'Cryptography', 'Forensics', 'OSINT'];
const DIFFICULTIES = ['All', 'easy', 'medium', 'hard'];

// ─── Challenges Page ─────────────────────────────────────────────────────────
const Challenges = () => {
  const { showNotification } = useNotification();

  const [challenges,    setChallenges]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDiff,    setActiveDiff]    = useState('All');
  const [searchTerm,    setSearchTerm]    = useState('');
  const [expandedId,    setExpandedId]    = useState(null);  // which card is open
  const [flagInputs,    setFlagInputs]    = useState({});    // id → typed string
  const [submitting,    setSubmitting]    = useState({});    // id → bool
  const [results,       setResults]       = useState({});    // id → { correct, message, points }
  const [mounted,       setMounted]       = useState(false);

  // ── Fetch challenges ──────────────────────────────────────────────────────
  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getChallenges();
      setChallenges(data);
      // Pre-mark already-solved challenges in results state
      const pre = {};
      data.forEach(ch => {
        if (ch.isSolved) {
          pre[ch._id] = { correct: true, message: 'Already solved! 🎉', points: 0 };
        }
      });
      setResults(pre);
    } catch (err) {
      showNotification({
        type:    'error',
        title:   'Failed to load challenges',
        message: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMounted(true), 50);
    }
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return challenges.filter(ch => {
      const matchCat  = activeCategory === 'All' || ch.category  === activeCategory;
      const matchDiff = activeDiff     === 'All' || ch.difficulty === activeDiff;
      const matchSearch = !searchTerm.trim() ||
        ch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ch.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchDiff && matchSearch;
    });
  }, [challenges, activeCategory, activeDiff, searchTerm]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const solved     = challenges.filter(c => c.isSolved).length;
    const totalPts   = challenges.filter(c => c.isSolved).reduce((s, c) => s + c.points, 0);
    return { total: challenges.length, solved, totalPts };
  }, [challenges]);

  // ── Flag submission ───────────────────────────────────────────────────────
  const handleSubmit = async (ch) => {
    const flag = (flagInputs[ch._id] || '').trim();
    if (!flag) return;

    setSubmitting(prev => ({ ...prev, [ch._id]: true }));
    setResults(prev => ({ ...prev, [ch._id]: null }));

    try {
      const data = await submitFlag(ch._id, flag);

      setResults(prev => ({
        ...prev,
        [ch._id]: { correct: data.correct, message: data.message, points: data.pointsAwarded },
      }));

      if (data.correct && !data.alreadySolved) {
        // Mark solved in state immediately (no full refetch needed)
        setChallenges(prev =>
          prev.map(c => c._id === ch._id ? { ...c, isSolved: true } : c)
        );
        setFlagInputs(prev => ({ ...prev, [ch._id]: '' }));
        showNotification({
          type:     'success',
          title:    '🚩 Flag Captured!',
          message:  `${ch.title} — +${data.pointsAwarded} points`,
          duration: 5000,
        });
      }
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [ch._id]: {
          correct: false,
          message: err?.response?.data?.message || 'Submission failed. Try again.',
        },
      }));
    } finally {
      setSubmitting(prev => ({ ...prev, [ch._id]: false }));
    }
  };

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: '#7b61ff' }} role="status" />
        <p className="mt-3" style={{ color: T2 }}>Loading challenges...</p>
      </div>
    );
  }

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease' }}>

      {/* ── Page header ── */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ color: T, fontWeight: 700 }}>
            🚩 CTF Challenges
          </h1>
          <p style={{ color: T2, margin: 0 }}>
            Capture the flags. Earn points. Climb the leaderboard.
          </p>
        </div>

        {/* Score summary pill */}
        <div
          style={{
            background:   'rgba(123,97,255,0.15)',
            border:       '1px solid rgba(123,97,255,0.3)',
            borderRadius: 12,
            padding:      '10px 20px',
            textAlign:    'center',
          }}
        >
          <div style={{ color: '#c4b5fd', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            YOUR SCORE
          </div>
          <div style={{ color: T, fontWeight: 800, fontSize: '1.4rem', lineHeight: 1.2 }}>
            {stats.totalPts} <span style={{ color: T3, fontSize: '0.8rem', fontWeight: 400 }}>pts</span>
          </div>
          <div style={{ color: T3, fontSize: '0.72rem' }}>
            {stats.solved} / {stats.total} solved
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="card mb-4" style={cardBase}>
        <div className="card-body p-3">
          {/* Category tabs */}
          <div className="d-flex gap-2 flex-wrap mb-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background:   activeCategory === cat
                    ? 'rgba(123,97,255,0.25)'
                    : 'rgba(255,255,255,0.05)',
                  border:       `1px solid ${activeCategory === cat
                    ? 'rgba(123,97,255,0.5)'
                    : 'rgba(255,255,255,0.1)'}`,
                  color:        activeCategory === cat ? '#c4b5fd' : T2,
                  borderRadius: 8,
                  padding:      '5px 14px',
                  fontSize:     '0.82rem',
                  fontWeight:   activeCategory === cat ? 700 : 400,
                  cursor:       'pointer',
                  transition:   'all 0.15s ease',
                  whiteSpace:   'nowrap',
                }}
              >
                {cat !== 'All' ? `${CAT_ICONS[cat]} ` : ''}{cat}
              </button>
            ))}
          </div>

          {/* Difficulty + Search row */}
          <div className="row g-2">
            <div className="col-md-4">
              <select
                className="form-select form-select-sm"
                value={activeDiff}
                onChange={e => setActiveDiff(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.06)', color: T, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
              >
                {DIFFICULTIES.map(d => (
                  <option key={d} value={d} style={{ background: '#121622' }}>
                    {d === 'All' ? 'All Difficulties' : DIFF_LABEL[d]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-8">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="🔍 Search challenges..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.06)', color: T, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        {['easy', 'medium', 'hard'].map(d => {
          const total  = challenges.filter(c => c.difficulty === d).length;
          const solved = challenges.filter(c => c.difficulty === d && c.isSolved).length;
          return (
            <div
              key={d}
              style={{
                background:   `${DIFF_COLOR[d]}14`,
                border:       `1px solid ${DIFF_COLOR[d]}33`,
                borderRadius: 10,
                padding:      '8px 16px',
                display:      'flex',
                alignItems:   'center',
                gap:          10,
              }}
            >
              <span style={{ color: DIFF_COLOR[d], fontWeight: 700, fontSize: '0.9rem' }}>
                {DIFF_LABEL[d]}
              </span>
              <span style={{ color: T2, fontSize: '0.82rem' }}>
                {solved}/{total}
              </span>
              <div style={{ width: 50, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: total ? `${(solved/total)*100}%` : '0%', height: '100%', background: DIFF_COLOR[d], borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
        <div style={{ color: T3, fontSize: '0.82rem', display: 'flex', alignItems: 'center' }}>
          {filtered.length} challenges shown
        </div>
      </div>

      {/* ── Challenge grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-5 card" style={cardBase}>
          <div className="card-body py-5">
            <div style={{ fontSize: '3rem' }}>🔎</div>
            <h4 style={{ color: T, marginTop: '1rem' }}>No challenges found</h4>
            <p style={{ color: T2 }}>Try adjusting your filters or search term.</p>
            <button
              className="btn btn-outline-primary"
              onClick={() => { setActiveCategory('All'); setActiveDiff('All'); setSearchTerm(''); }}
              style={{ borderRadius: 8 }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {filtered.map(ch => {
            const isExpanded = expandedId === ch._id;
            const result     = results[ch._id];
            const isWrong    = result && !result.correct;

            return (
              <div key={ch._id} className="col-xl-4 col-md-6">
                <div
                  className="card h-100"
                  style={{
                    ...cardBase,
                    cursor:      'pointer',
                    transition:  'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
                    borderColor: ch.isSolved
                      ? 'rgba(34,197,94,0.3)'
                      : isExpanded
                        ? 'rgba(123,97,255,0.4)'
                        : 'rgba(255,255,255,0.08)',
                    boxShadow:   isExpanded ? '0 8px 32px rgba(123,97,255,0.2)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isExpanded) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isExpanded) {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '';
                    }
                  }}
                  onClick={() => toggleExpand(ch._id)}
                >
                  <div className="card-body p-4 d-flex flex-column">

                    {/* ── Card top row ── */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>
                        {CAT_ICONS[ch.category] || '📁'}
                      </span>
                      <div className="d-flex gap-2 align-items-center">
                        {/* Difficulty badge */}
                        <span
                          className="badge"
                          style={{
                            background:   `${DIFF_COLOR[ch.difficulty]}22`,
                            color:         DIFF_COLOR[ch.difficulty],
                            border:       `1px solid ${DIFF_COLOR[ch.difficulty]}55`,
                            fontWeight:   700,
                            fontSize:     '0.7rem',
                            padding:      '3px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {DIFF_LABEL[ch.difficulty]}
                        </span>
                        {/* Points badge */}
                        <span
                          className="badge"
                          style={{
                            background:   'rgba(123,97,255,0.2)',
                            color:        '#c4b5fd',
                            border:       '1px solid rgba(123,97,255,0.35)',
                            fontWeight:   700,
                            fontSize:     '0.7rem',
                            padding:      '3px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {ch.points} pts
                        </span>
                        {/* Solved checkmark */}
                        {ch.isSolved && (
                          <span style={{ color: '#22c55e', fontSize: '1.1rem' }}>✅</span>
                        )}
                      </div>
                    </div>

                    {/* ── Title ── */}
                    <h6
                      style={{
                        color:      ch.isSolved ? '#86efac' : T,
                        fontWeight: 700,
                        fontSize:   '0.97rem',
                        marginBottom: '0.4rem',
                      }}
                    >
                      {ch.title}
                    </h6>

                    {/* ── Category tag ── */}
                    <div style={{ color: T3, fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                      {ch.category}
                    </div>

                    {/* ── Short description (collapsed) ── */}
                    {!isExpanded && (
                      <p style={{ color: T2, fontSize: '0.82rem', lineHeight: 1.5, flex: 1, marginBottom: 0 }}>
                        {ch.description.substring(0, 100)}
                        {ch.description.length > 100 ? '…' : ''}
                      </p>
                    )}

                    {/* ── Expanded content ── */}
                    {isExpanded && (
                      <div onClick={e => e.stopPropagation()}>
                        {/* Full description */}
                        <p
                          style={{
                            color:      T2,
                            fontSize:   '0.85rem',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            marginBottom: '1rem',
                          }}
                        >
                          {ch.description}
                        </p>

                        {/* Hint toggle */}
                        {ch.hint && (
                          <details style={{ marginBottom: '1rem' }}>
                            <summary
                              style={{
                                color:      '#f59e0b',
                                fontSize:   '0.82rem',
                                cursor:     'pointer',
                                userSelect: 'none',
                                fontWeight: 600,
                              }}
                            >
                              💡 Show Hint
                            </summary>
                            <p
                              style={{
                                color:       T2,
                                fontSize:    '0.82rem',
                                marginTop:   8,
                                marginBottom:0,
                                paddingLeft: 16,
                                borderLeft:  '2px solid rgba(245,158,11,0.4)',
                              }}
                            >
                              {ch.hint}
                            </p>
                          </details>
                        )}

                        {/* Flag input — hidden if already solved */}
                        {!ch.isSolved ? (
                          <>
                            <div className="d-flex gap-2 mt-2">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Enter flag (e.g. EDUSEC{...})"
                                value={flagInputs[ch._id] || ''}
                                onChange={e =>
                                  setFlagInputs(prev => ({ ...prev, [ch._id]: e.target.value }))
                                }
                                onKeyDown={e => e.key === 'Enter' && handleSubmit(ch)}
                                style={{
                                  background:  'rgba(255,255,255,0.06)',
                                  border:      `1px solid ${isWrong ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
                                  color:       T,
                                  borderRadius:8,
                                  fontFamily:  'monospace',
                                  fontSize:    '0.85rem',
                                }}
                                disabled={submitting[ch._id]}
                                autoFocus
                              />
                              <button
                                className="btn btn-sm"
                                style={{
                                  background:   'rgba(123,97,255,0.25)',
                                  border:       '1px solid rgba(123,97,255,0.45)',
                                  color:        '#c4b5fd',
                                  borderRadius: 8,
                                  fontWeight:   700,
                                  whiteSpace:   'nowrap',
                                  minWidth:     80,
                                }}
                                onClick={() => handleSubmit(ch)}
                                disabled={submitting[ch._id] || !flagInputs[ch._id]?.trim()}
                              >
                                {submitting[ch._id]
                                  ? <><span className="spinner-border spinner-border-sm me-1" />Checking</>
                                  : '🚩 Submit'}
                              </button>
                            </div>

                            {/* Result feedback */}
                            {result && (
                              <div
                                className="mt-2 p-2"
                                style={{
                                  borderRadius: 8,
                                  background:   result.correct
                                    ? 'rgba(34,197,94,0.12)'
                                    : 'rgba(239,68,68,0.1)',
                                  border:       `1px solid ${result.correct
                                    ? 'rgba(34,197,94,0.3)'
                                    : 'rgba(239,68,68,0.25)'}`,
                                  color:        result.correct ? '#86efac' : '#fca5a5',
                                  fontSize:     '0.82rem',
                                  fontWeight:   600,
                                }}
                              >
                                {result.message}
                                {result.correct && result.points > 0 && (
                                  <span style={{ color: '#fbbf24', marginLeft: 8 }}>
                                    +{result.points} XP
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div
                            className="mt-2 p-2 text-center"
                            style={{
                              borderRadius: 8,
                              background:   'rgba(34,197,94,0.1)',
                              border:       '1px solid rgba(34,197,94,0.25)',
                              color:        '#86efac',
                              fontSize:     '0.85rem',
                              fontWeight:   600,
                            }}
                          >
                            ✅ Challenge Solved — {ch.points} points earned
                          </div>
                        )}

                        {/* Collapse hint */}
                        <button
                          className="btn btn-link p-0 mt-2"
                          style={{ color: T3, fontSize: '0.75rem', textDecoration: 'none' }}
                          onClick={() => setExpandedId(null)}
                        >
                          ▲ Collapse
                        </button>
                      </div>
                    )}

                    {/* Expand hint */}
                    {!isExpanded && (
                      <div
                        className="mt-auto pt-2"
                        style={{
                          color:    T3,
                          fontSize: '0.72rem',
                          borderTop:'1px solid rgba(255,255,255,0.05)',
                          marginTop:'auto',
                        }}
                      >
                        Click to {ch.isSolved ? 'view details' : 'attempt'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Challenges;
