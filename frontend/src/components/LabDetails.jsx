import React from 'react';
import { LAB_GUIDES, DEFAULT_GUIDE } from './LabGuides';

const T = '#f0f2f8';          // bright text
const T2 = 'rgba(240,242,248,0.65)';  // secondary
const T3 = 'rgba(240,242,248,0.42)';  // muted

const cardBase = {
  background: 'rgba(18,22,34,0.82)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  backdropFilter: 'blur(16px)',
  animation: 'none',
};

export default function LabDetails({ lab, onClose, onStart, onOpenTerminal, onGoToVM }) {
  if (!lab) return null;

  const guide = LAB_GUIDES[lab.name] || DEFAULT_GUIDE;

  return (
    <div style={styles.overlay}>
      <div className="container py-4" style={{ maxWidth: 1200 }}>
        <div className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary btn-sm me-3" onClick={onClose} style={{ borderRadius: 10 }}>
              <i className="bi bi-arrow-left me-1"></i> Back to Labs
            </button>
            <h4 style={{ color: T, fontWeight: 700, margin: 0 }}>{lab.name}</h4>
            <span 
              className="badge ms-3"
              style={{
                background: 'rgba(34,197,94,0.15)',
                color: '#86efac',
                border: '1px solid rgba(34,197,94,0.3)',
                padding: '4px 10px',
                borderRadius: 6
              }}
            >
              {lab.difficulty}
            </span>
            <span className="badge bg-primary ms-2" style={{ padding: '4px 10px', borderRadius: 6 }}>{lab.category}</span>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            {/* Overview Card */}
            <div className="card mb-4" style={cardBase}>
              <div className="card-header" style={styles.header}>Overview</div>
              <div className="card-body p-4">
                <p className="mb-0" style={{ color: T2, fontSize: '0.9rem', lineHeight: 1.6 }}>{lab.description}</p>
              </div>
            </div>

            {/* Walkthrough & Guide Card */}
            <div className="card mb-4" style={cardBase}>
              <div className="card-header" style={{ ...styles.header, borderBottom: '1px solid rgba(123,97,255,0.15)' }}>
                <h5 className="mb-0" style={{ color: T, fontWeight: 700, fontSize: '1rem' }}>
                  <i className="bi bi-journal-code me-2" style={{ color: '#a490ff' }}></i>
                  Lab Guide & Walkthrough
                </h5>
              </div>
              <div className="card-body p-4">
                <h6 style={{ color: '#67e8f9', fontWeight: 600 }} className="mb-3">🏁 Step-by-Step Instructions:</h6>
                <ol className="mb-4" style={{ paddingLeft: '20px', color: T2, fontSize: '0.88rem', lineHeight: 1.7 }}>
                  {guide.steps.map((step, index) => (
                    <li key={index} className="mb-2">{step}</li>
                  ))}
                </ol>
                
                <h6 style={{ color: '#ffd93d', fontWeight: 600 }} className="mb-2">💡 Hacking Hints & Tips:</h6>
                <ul className="mb-0" style={{ paddingLeft: '20px', color: T3, fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {guide.hints.map((hint, index) => (
                    <li key={index} className="mb-1">{hint}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            {/* Lab Statistics */}
            <div className="card mb-4" style={cardBase}>
              <div className="card-header" style={styles.header}>Lab Statistics</div>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: T2 }}>Points</span>
                  <strong style={{ color: '#a490ff' }}>100</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: T2 }}>Est. Time</span>
                  <strong style={{ color: T }}>30 minutes</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span style={{ color: T2 }}>Completed</span>
                  <strong style={{ color: lab.userProgress?.status === 'completed' ? '#22c55e' : T3 }}>
                    {lab.userProgress?.status === 'completed' ? 'Yes' : 'No'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Your Progress */}
            <div className="card mb-4" style={cardBase}>
              <div className="card-header" style={styles.header}>Your Progress</div>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: T2, fontSize: '0.82rem' }}>Lab Completion</span>
                  <span style={{ color: '#a490ff', fontSize: '0.82rem', fontWeight: 700 }}>
                    {lab.userProgress?.status === 'completed' ? '100%' : '0%'}
                  </span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: lab.userProgress?.status === 'completed' ? '100%' : '0%',
                      background: 'linear-gradient(90deg, #7b61ff, #00dbde)',
                      borderRadius: 999,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={cardBase}>
              <div className="card-header" style={styles.header}>Quick Actions</div>
              <div className="card-body p-4 d-grid gap-2">
                {lab.dockerImage ? (
                  <>
                    <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onStart?.(); }} style={{ borderRadius: 10 }}>
                      <i className="bi bi-play-circle me-2"></i>Start Lab
                    </button>
                    <button className="btn btn-outline-primary" onClick={(e) => { e.stopPropagation(); onOpenTerminal?.(); }} style={{ borderRadius: 10 }}>
                      <i className="bi bi-terminal me-2"></i>Open Terminal
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn btn-outline-info" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onClose?.(); 
                      onGoToVM?.(); 
                    }} 
                    style={{ borderRadius: 10 }}
                  >
                    <i className="bi bi-laptop me-2"></i>Go to Kali VM
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', 
    inset: 0, 
    zIndex: 1050,
    background: '#0b0f16', 
    overflowY: 'auto'
  },
  header: {
    background: 'rgba(255,255,255,0.02)', 
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    color: T,
    fontWeight: 700
  }
};
