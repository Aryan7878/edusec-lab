import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LabTerminal from './LabTerminal';
import LabDetails from './LabDetails';

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

const DIFF_COLOR = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
const STATUS_COLOR = {
  completed:   { bg: 'rgba(34,197,94,0.18)',   color: '#86efac' },
  in_progress: { bg: 'rgba(123,97,255,0.18)',  color: '#c4b5fd' },
  not_started: { bg: 'rgba(255,255,255,0.08)', color: T2        },
};

const Labs = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingLab, setStartingLab] = useState(null);
  const [stoppingLab, setStoppingLab] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeLab, setActiveLab] = useState(null);
  const [selectedLab, setSelectedLab] = useState(null);

  useEffect(() => {
    fetchLabs();
    const id = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(id);
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await axios.get('/api/labs');
      setLabs(response.data);
    } catch (error) {
      console.error('Error fetching labs:', error);
      showNotification({
        type: 'error',
        title: 'Error Fetching Labs',
        message: 'Could not retrieve labs from backend database.',
        details: error?.message
      });
    } finally {
      setLoading(false);
    }
  };

  const startLab = async (labId) => {
    setStartingLab(labId);
    try {
      const response = await axios.post(`/api/labs/${labId}/start`);

      if (response.data.lab) {
        setLabs(prevLabs =>
          prevLabs.map(lab =>
            lab._id === labId
              ? { ...lab, userProgress: { ...lab.userProgress, status: 'in_progress' } }
              : lab
          )
        );
        const selected = labs.find(l => l._id === labId);
        if (selected) {
          setActiveLab({
            id: labId,
            name: selected.name,
            accessUrl: response.data.lab.accessUrl
          });
        }
        showNotification({
          type: 'success',
          title: 'Lab Started Successfully',
          message: `The environment for "${selected?.name || 'Lab'}" is running.`,
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Error starting lab:', error);
      const detail = error?.response?.data?.error || error?.message || '';
      showNotification({
        type: 'error',
        title: 'Failed to Start Lab',
        message: 'Unable to start the lab container. Please try again.',
        details: detail,
        solutions: [
          'Ensure Docker Desktop is running on your system.',
          'Check your system disk space and CPU utilization.',
          'Try stopping other running containers and retry.'
        ]
      });
    } finally {
      setStartingLab(null);
    }
  };

  const stopLab = async (labId) => {
    setStoppingLab(labId);
    try {
      await axios.post(`/api/labs/${labId}/stop`);
      const selected = labs.find(l => l._id === labId);
      setLabs(prevLabs =>
        prevLabs.map(lab =>
          lab._id === labId
            ? { ...lab, userProgress: { ...lab.userProgress, status: 'not_started', score: lab.userProgress.score || 0 } }
            : lab
        )
      );
      showNotification({
        type: 'success',
        title: 'Lab Stopped Successfully',
        message: `The environment for "${selected?.name || 'Lab'}" has been shutdown.`,
        duration: 4000
      });
    } catch (error) {
      console.error('Error stopping lab:', error);
      showNotification({
        type: 'error',
        title: 'Failed to Stop Lab',
        message: 'Unable to safely spin down the lab container.',
        details: error?.response?.data?.error || error?.message
      });
    } finally {
      setStoppingLab(null);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Web Application': '🌐',
      'Network Security': '🔗',
      'Cryptography': '🔐',
      'Forensics': '🔍'
    };
    return icons[category] || '📁';
  };

  const labStats = React.useMemo(() => ({
    easy: labs.filter(l => l.difficulty === 'easy').length,
    medium: labs.filter(l => l.difficulty === 'medium').length,
    hard: labs.filter(l => l.difficulty === 'hard').length,
    completed: labs.filter(l => l.userProgress?.status === 'completed').length
  }), [labs]);

  const filteredLabs = React.useMemo(() => {
    return labs.filter(lab => {
      let matchesFilter = false;
      if (filter === 'all') {
        matchesFilter = true;
      } else if (filter === 'easy' || filter === 'medium' || filter === 'hard') {
        matchesFilter = lab.difficulty === filter;
      } else if (filter === 'web') {
        matchesFilter = lab.category.toLowerCase().includes('web');
      } else if (filter === 'network') {
        matchesFilter = lab.category.toLowerCase().includes('network');
      }

      const matchesSearch = !searchTerm.trim() ||
        lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lab.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [labs, filter, searchTerm]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: '#7b61ff' }} role="status">
          <span className="visually-hidden">Loading labs...</span>
        </div>
        <p className="mt-3" style={{ color: T2 }}>Loading available labs...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 style={{ color: T, fontWeight: 700 }}>Cybersecurity Labs</h1>
          <p className="lead" style={{ color: T2 }}>Practice your skills in safe, isolated environments</p>
        </div>
        <span className="badge bg-primary fs-6" style={{ borderRadius: 8, padding: '6px 12px' }}>
          {filteredLabs.length} labs available
        </span>
      </div>

      <div className="card mb-4" style={cardBase}>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search labs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Labs</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="web">Web Application</option>
                <option value="network">Network Security</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className={`row ${mounted ? 'mounted' : ''}`}>
        {filteredLabs.map(lab => {
          const diff = lab.difficulty || 'easy';
          const statusKey = lab.userProgress.status || 'not_started';
          const st = STATUS_COLOR[statusKey] || STATUS_COLOR.not_started;
          
          return (
            <div key={lab._id} className="col-xl-4 col-lg-6 mb-4">
              <div 
                className="card lab-card h-100" 
                onClick={() => setSelectedLab(lab)} 
                style={{
                  ...cardBase,
                  cursor: 'pointer',
                  transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease'
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
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 style={{ color: T, fontWeight: 700, fontSize: '1.1rem' }} className="mb-2">{lab.name}</h5>
                      <span
                        className="badge"
                        style={{
                          background: `${DIFF_COLOR[diff]}22`,
                          color: DIFF_COLOR[diff],
                          border: `1px solid ${DIFF_COLOR[diff]}55`,
                          fontWeight: 600, fontSize: '0.72rem', padding: '3px 9px', borderRadius: 6
                        }}
                      >
                        {diff}
                      </span>
                    </div>
                    <div className="text-end">
                      <div className="fs-4">{getCategoryIcon(lab.category)}</div>
                      <small style={{ color: T3 }}>{lab.category}</small>
                    </div>
                  </div>

                  <p style={{ color: T2, fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.2rem' }}>
                    {lab.description}
                  </p>

                  <div className="mt-auto">
                    {lab.category && (
                      <div className="mb-3">
                        <small style={{ color: T3, fontSize: '0.78rem' }}>
                          <i className="bi bi-tags me-1"></i>
                          Category: <span style={{ color: T2 }}>{lab.category}</span>
                          {lab.dockerImage && (
                            <span className="ms-2" style={{ color: '#67e8f9' }}>
                              <i className="bi bi-box me-1"></i>
                              Containerized
                            </span>
                          )}
                        </small>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center">
                      <span
                        className="badge"
                        style={{ background: st.bg, color: st.color, fontWeight: 600, fontSize: '0.72rem', padding: '4px 10px', borderRadius: 6 }}
                      >
                        {statusKey.replace('_', ' ')}
                      </span>

                      <div>
                        {!lab.dockerImage ? (
                          <button
                            className="btn btn-outline-info btn-sm"
                            style={{ borderRadius: 8, padding: '5px 12px' }}
                            onClick={(e) => { e.stopPropagation(); navigate('/kali-vm'); }}
                          >
                            <i className="bi bi-laptop me-2"></i>
                            Go to Kali VM
                          </button>
                        ) : statusKey === 'in_progress' ? (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            style={{ borderRadius: 8, padding: '5px 12px' }}
                            onClick={(e) => { e.stopPropagation(); stopLab(lab._id); }}
                            disabled={stoppingLab === lab._id}
                          >
                            {stoppingLab === lab._id ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Stopping...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-stop-circle me-2"></i>
                                Stop Lab
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ borderRadius: 8, padding: '5px 12px' }}
                            onClick={(e) => { e.stopPropagation(); startLab(lab._id); }}
                            disabled={startingLab === lab._id}
                          >
                            {startingLab === lab._id ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Starting...
                              </>
                            ) : statusKey === 'completed' ? (
                              <>
                                <i className="bi bi-arrow-repeat me-2"></i>
                                Restart
                              </>
                            ) : (
                              <>
                                <i className="bi bi-play-fill me-2"></i>
                                Start Lab
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {statusKey === 'completed' && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span style={{ color: T3, fontSize: '0.75rem' }}>Score</span>
                          <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 700 }}>
                            {lab.userProgress.score}/100
                          </span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${lab.userProgress.score}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLabs.length === 0 && (
        <div className="text-center py-5">
          <div className="card" style={cardBase}>
            <div className="card-body py-5">
              <i className="bi bi-search display-1" style={{ color: T3 }}></i>
              <h3 style={{ color: T, marginTop: '1rem', fontWeight: 700 }}>No labs found</h3>
              <p style={{ color: T2 }}>
                {searchTerm ? `No labs match "${searchTerm}"` : 'No labs available for the selected filter'}
              </p>
              <button
                className="btn btn-primary mt-2"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                style={{ borderRadius: 10 }}
              >
                Show All Labs
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="row mt-5">
        <div className="col-12">
          <div className="card" style={cardBase}>
            <div className="card-header" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h5 className="mb-0" style={{ color: T, fontWeight: 700 }}>Lab Statistics</h5>
            </div>
            <div className="card-body p-4">
              <div className="row text-center">
                <div className="col-md-3 col-6 mb-3 mb-md-0">
                  <h4 style={{ color: '#22c55e', fontWeight: 800, fontSize: '1.8rem' }}>{labStats.easy}</h4>
                  <p style={{ color: T2, marginBottom: 0, fontSize: '0.88rem' }}>Easy Labs</p>
                </div>
                <div className="col-md-3 col-6 mb-3 mb-md-0">
                  <h4 style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1.8rem' }}>{labStats.medium}</h4>
                  <p style={{ color: T2, marginBottom: 0, fontSize: '0.88rem' }}>Medium Labs</p>
                </div>
                <div className="col-md-3 col-6">
                  <h4 style={{ color: '#ef4444', fontWeight: 800, fontSize: '1.8rem' }}>{labStats.hard}</h4>
                  <p style={{ color: T2, marginBottom: 0, fontSize: '0.88rem' }}>Hard Labs</p>
                </div>
                <div className="col-md-3 col-6">
                  <h4 style={{ color: '#7b61ff', fontWeight: 800, fontSize: '1.8rem' }}>{labStats.completed}</h4>
                  <p style={{ color: T2, marginBottom: 0, fontSize: '0.88rem' }}>Your Completions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeLab && (
        <LabTerminal
          labId={activeLab.id}
          labName={activeLab.name}
          onClose={() => setActiveLab(null)}
        />
      )}

      {selectedLab && (
        <LabDetails
          lab={selectedLab}
          onClose={() => { setSelectedLab(null); setActiveLab(null); }}
          onStart={() => {
            setSelectedLab(null);
            startLab(selectedLab._id);
          }}
          onOpenTerminal={() => {
            if (selectedLab) {
              setActiveLab({
                id: selectedLab._id,
                name: selectedLab.name
              });
            }
          }}
          onGoToVM={() => navigate('/kali-vm')}
        />
      )}
    </div>
  );
};

export default Labs;
