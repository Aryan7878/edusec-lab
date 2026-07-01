import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../api/axios';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

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

export default function VMInterface() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [mounted, setMounted] = useState(false);
  const [vmStatus, setVmStatus] = useState('stopped');
  const [loading, setLoading] = useState(false);
  const [vmDetails, setVmDetails] = useState(null);
  const [dockerHealthy, setDockerHealthy] = useState(true);
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const commandHistory = useRef([]);
  const historyIndex = useRef(-1);
  const currentLine = useRef('');

  useEffect(() => {
    checkVMStatus();
    checkDockerHealth();
    const id = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(id);
  }, []);

  const checkDockerHealth = async () => {
    try {
      const response = await api.get('/api/vm/docker-health');
      setDockerHealthy(response.data.healthy);
    } catch (error) {
      setDockerHealthy(false);
    }
  };

  useEffect(() => {
    if (vmStatus === 'running' && terminalRef.current && !terminal.current) {
      initializeTerminal();
    }
    return () => {
      if (terminal.current) {
        terminal.current.dispose();
        terminal.current = null;
      }
    };
  }, [vmStatus]);

  const checkVMStatus = async () => {
    try {
      const response = await api.get('/api/vm/status');
      setVmStatus(response.data.status);
      setVmDetails(response.data);
      
      if (response.data.status === 'running' && !terminal.current) {
        setTimeout(() => {
          if (terminalRef.current && !terminal.current) {
            initializeTerminal();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error checking VM status:', error);
    }
  };

  const initializeTerminal = () => {
    if (terminal.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Courier New, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#00ff00',
        cursor: '#00ff00',
        selection: '#333333'
      }
    });

    fitAddon.current = new FitAddon();
    term.loadAddon(fitAddon.current);
    term.open(terminalRef.current);
    
    // Delayed fit ensures that the terminal parses sizes correctly after mount
    setTimeout(() => {
      if (fitAddon.current) {
        try {
          fitAddon.current.fit();
        } catch (e) {
          console.error('Fit error:', e);
        }
      }
    }, 150);

    // Handle window resize
    const handleResize = () => {
      if (fitAddon.current) {
        try {
          fitAddon.current.fit();
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('resize', handleResize);

    // Write welcome message
    term.writeln('\r\n\x1b[32m╔════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[32m║     Welcome to EduSec Labs Kali Environment     ║\x1b[0m');
    term.writeln('\x1b[32m╚════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.write('\x1b[36mroot@kali:~# \x1b[0m');

    // Handle input
    term.onData((data) => {
      const code = data.charCodeAt(0);
      
      if (code === 13) { // Enter
        const cmd = currentLine.current.trim();
        if (cmd) {
          term.write('\r\n');
          executeCommand(cmd);
          commandHistory.current.push(cmd);
          historyIndex.current = commandHistory.current.length;
        } else {
          term.write('\r\n');
          term.write('\x1b[36mroot@kali:~# \x1b[0m');
        }
        currentLine.current = '';
      } else if (code === 127) { // Backspace
        if (currentLine.current.length > 0) {
          currentLine.current = currentLine.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code === 27) { // Escape sequence (arrows)
        if (data.length === 3 && data[1] === '[') {
          const arrow = data[2];
          if (arrow === 'A') { // Up
            if (historyIndex.current > 0) {
              historyIndex.current--;
              const prevCmd = commandHistory.current[historyIndex.current];
              // Clear current line
              term.write('\r\x1b[K');
              term.write('\x1b[36mroot@kali:~# \x1b[0m');
              term.write(prevCmd);
              currentLine.current = prevCmd;
            }
          } else if (arrow === 'B') { // Down
            if (historyIndex.current < commandHistory.current.length - 1) {
              historyIndex.current++;
              const prevCmd = commandHistory.current[historyIndex.current];
              term.write('\r\x1b[K');
              term.write('\x1b[36mroot@kali:~# \x1b[0m');
              term.write(prevCmd);
              currentLine.current = prevCmd;
            } else {
              historyIndex.current = commandHistory.current.length;
              term.write('\r\x1b[K');
              term.write('\x1b[36mroot@kali:~# \x1b[0m');
              currentLine.current = '';
            }
          }
        }
      } else if (code >= 32 && code <= 126) { // Printable characters
        currentLine.current += data;
        term.write(data);
      }
    });

    terminal.current = term;

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const executeCommand = async (cmd) => {
    if (!terminal.current) return;

    try {
      const response = await api.post('/api/vm/execute', { command: cmd });
      
      if (response.data.success) {
        const output = response.data.output || '';
        if (output) {
          terminal.current.write(output.replace(/\r?\n/g, '\r\n'));
        }
      } else {
        terminal.current.write(`\x1b[31mError: ${(response.data.output || '').replace(/\r?\n/g, '\r\n')}\x1b[0m`);
      }
    } catch (error) {
      terminal.current.write(`\x1b[31mError executing command: ${(error.response?.data?.message || error.message || '').replace(/\r?\n/g, '\r\n')}\x1b[0m`);
    }
    
    terminal.current.write('\r\n\x1b[36mroot@kali:~# \x1b[0m');
  };

  const startVM = async () => {
    setLoading(true);
    let checkInterval = null;
    
    try {
      const response = await api.post('/api/vm/start');
      // Optimistically mark as running and initialize terminal; we'll verify in background
      setVmDetails(response.data.vm);
      setVmStatus('running');
      setTimeout(() => {
        if (terminalRef.current && !terminal.current) {
          initializeTerminal();
        }
      }, 300);

      // Background verify up to 60s; if check fails we fall back to stopped with message
      let attempts = 0;
      const maxAttempts = 60;
      checkInterval = setInterval(async () => {
        attempts++;
        try {
          const statusResponse = await api.get('/api/vm/status');
          if (statusResponse.data.status === 'running') {
            clearInterval(checkInterval);
            setLoading(false);
            showNotification({
              type: 'success',
              title: 'VM Started Successfully',
              message: 'Your personal Kali Linux VM is now active and ready.',
              duration: 4000
            });
          } else if (statusResponse.data.status === 'stopped') {
            clearInterval(checkInterval);
            setVmStatus('stopped');
            setLoading(false);
            showNotification({
              type: 'error',
              title: 'VM Failed to Start',
              message: 'The virtual machine container exited or failed to start.',
              solutions: [
                'Ensure Docker Desktop is open and showing "Docker is running".',
                'Verify no other containers are using the same port resources.',
                'Click "Start VM" again to retry.'
              ]
            });
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            setVmStatus('stopped');
            setLoading(false);
            
            // Try to get more detailed error info
            try {
              const finalStatus = await api.get('/api/vm/status');
              if (finalStatus.data.status === 'stopped' && finalStatus.data.error) {
                showNotification({
                  type: 'error',
                  title: 'VM Initialization Timeout',
                  message: `The virtual machine container failed to start after ${maxAttempts} seconds.`,
                  details: finalStatus.data.error,
                  solutions: [
                    'Verify that Docker Desktop is actively running.',
                    'Check for container port conflicts or resource restrictions in Docker Desktop settings.',
                    'Restart Docker Desktop and try launching the VM again.'
                  ]
                });
              } else {
                showNotification({
                  type: 'error',
                  title: 'VM Failed to Start',
                  message: `The virtual machine container failed to start after ${maxAttempts} seconds.`,
                  solutions: [
                    'Ensure Docker Desktop is running.',
                    'Wait a moment and try again.',
                    'Check Docker logs if the problem persists.'
                  ]
                });
              }
            } catch (err) {
              showNotification({
                type: 'error',
                title: 'VM Failed to Start',
                message: `The virtual machine container failed to start after ${maxAttempts} seconds.`,
                solutions: [
                  'Please check Docker Desktop is running and try again.'
                ]
              });
            }
          }
        } catch (err) {
          console.error('Error checking VM status:', err);
          if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            setVmStatus('stopped');
            setLoading(false);
            showNotification({
              type: 'error',
              title: 'VM Connection Error',
              message: 'Unable to check VM status. Connection error.',
              details: err.message || 'Connection error'
            });
          }
        }
      }, 1000);
      
    } catch (error) {
      if (checkInterval) clearInterval(checkInterval);
      
      console.error('Error starting VM:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
      
      // Show user-friendly error message
      if (errorMsg.includes('Docker Desktop')) {
        showNotification({
          type: 'error',
          title: 'Docker Desktop Offline',
          message: errorMsg,
          solutions: [
            'Open Docker Desktop.',
            'Wait for the Docker icon to turn green ("Docker is running").',
            'Try launching the VM again.'
          ]
        });
      } else if (errorMsg.includes('Conflict') || errorMsg.includes('already in use')) {
        showNotification({
          type: 'error',
          title: 'Container Name Conflict',
          message: 'A container with the same name or port already exists.',
          details: errorMsg,
          solutions: [
            'Try clicking "Start VM" again - the system should auto-resolve this.',
            'Manually stop or remove the conflicting container in Docker Desktop.',
            'Restart Docker Desktop.'
          ]
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Failed to Start VM',
          message: errorMsg,
          solutions: [
            'Docker Desktop is running',
            'You have enough disk space',
            'No firewall is blocking Docker'
          ]
        });
      }
      setLoading(false);
      setVmStatus('stopped');
    }
  };

  const stopVM = async () => {
    setLoading(true);
    try {
      await api.post('/api/vm/stop');
      setVmStatus('stopped');
      setVmDetails(null);
      
      if (terminal.current) {
        terminal.current.dispose();
        terminal.current = null;
        fitAddon.current = null;
      }
      
      commandHistory.current = [];
      historyIndex.current = -1;
      currentLine.current = '';
      showNotification({
        type: 'success',
        title: 'VM Stopped',
        message: 'Your personal Kali Linux VM has been successfully turned off.',
        duration: 4000
      });
    } catch (error) {
      console.error('Error stopping VM:', error);
      showNotification({
        type: 'error',
        title: 'Failed to Stop VM',
        message: 'An error occurred while attempting to spin down the container VM.',
        details: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      running: 'success',
      starting: 'warning',
      stopped: 'danger'
    };
    return colors[status] || 'secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      running: 'RUNNING',
      starting: 'STARTING',
      stopped: 'STOPPED'
    };
    return texts[status] || 'UNKNOWN';
  };

  const getStatusDesc = (status) => {
    const descs = {
      running: 'VM is ready to use',
      starting: 'VM is booting up...',
      stopped: 'VM is powered off'
    };
    return descs[status] || 'Unknown status';
  };

  return (
    <div className={mounted ? 'mounted' : ''}>
      <div className="row mb-4">
        <div className="col">
          <h1 style={{ color: T, fontWeight: 700 }}>Kali Linux VM</h1>
          <p className="lead" style={{ color: T2 }}>
            Access your personal Kali Linux environment - Just like TryHackMe!
          </p>
        </div>
      </div>

      {/* VM Status Card */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card" style={cardBase}>
            <div className="card-header" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h5 className="mb-0" style={{ color: T, fontWeight: 700 }}>
                <i className="bi bi-hdd me-2" style={{ color: '#a490ff' }}></i>
                Virtual Machine Status
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col">
                  <div className="d-flex align-items-center">
                    <span className={`badge bg-${getStatusColor(vmStatus)} me-3`} style={{ width: '12px', height: '12px', padding: 0, borderRadius: '50%' }}></span>
                    <div>
                      <h4 className={`text-${getStatusColor(vmStatus)} mb-0`} style={{ fontWeight: 800 }}>
                        {getStatusText(vmStatus)}
                      </h4>
                      <small style={{ color: T2 }}>
                        {getStatusDesc(vmStatus)}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-auto">
                  {vmStatus === 'stopped' ? (
                    <button
                      className="btn btn-success btn-lg"
                      style={{ borderRadius: 12, padding: '10px 24px', fontWeight: 600 }}
                      onClick={startVM}
                      disabled={loading || !dockerHealthy}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Starting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-play-fill me-2"></i>
                          Start VM
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn btn-danger"
                      style={{ borderRadius: 12, padding: '10px 24px', fontWeight: 600 }}
                      onClick={stopVM}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Stopping...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-stop-fill me-2"></i>
                          Stop VM
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {vmDetails && vmDetails.sshPort && (
                <div className="mt-3 p-3 ssh-details-panel">
                  <h6 style={{color:'#a490ff', fontWeight: 700}}><i className="bi bi-terminal me-2"></i>Connection Details</h6>
                  <div className="row small">
                    <div className="col-md-12">
                      <span style={{ color: T2 }}>SSH Access:</span><br/>
                      <code style={{color:'#67e8f9', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4}}>ssh root@localhost -p {vmDetails.sshPort}</code>
                      <br/>
                      <small style={{ color: T3, marginTop: 4, display: 'inline-block' }}>Password: root (default)</small>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!dockerHealthy && (
              <div className="alert alert-warning mx-3 mb-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Docker Desktop is not running.</strong> Please start Docker Desktop and wait for it to fully load.
                <button className="btn btn-sm btn-outline-primary ms-2" onClick={checkDockerHealth} style={{ borderRadius: 6 }}>
                  <i className="bi bi-arrow-clockwise me-1"></i>Check Again
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100" style={cardBase}>
            <div className="card-header" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h5 className="mb-0" style={{ color: T, fontWeight: 700 }}>
                <i className="bi bi-info-circle me-2" style={{ color: '#a490ff' }}></i>
                Available Tools
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-4">
                <h6 style={{ color: '#7b61ff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }} className="mb-2">🚀 INSTALLED IN WEB TERMINAL:</h6>
                <div className="row small">
                  <div className="col-6 mb-2" style={{ color: T2 }}>
                    <i className="bi bi-check-circle text-success me-1"></i>
                    nmap (Network Scanning)
                  </div>
                  <div className="col-6 mb-2" style={{ color: T2 }}>
                    <i className="bi bi-check-circle text-success me-1"></i>
                    gobuster (Directory Busting)
                  </div>
                  <div className="col-6 mb-2" style={{ color: T2 }}>
                    <i className="bi bi-check-circle text-success me-1"></i>
                    hydra (Brute Forcer)
                  </div>
                  <div className="col-6 mb-2" style={{ color: T2 }}>
                    <i className="bi bi-check-circle text-success me-1"></i>
                    john (Password Cracking)
                  </div>
                  <div className="col-6 mb-2" style={{ color: T2 }}>
                    <i className="bi bi-check-circle text-success me-1"></i>
                    curl & python3
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <h6 style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }} className="mb-2">💻 USE EXTERNAL KALI VM FOR:</h6>
                <div className="row small">
                  <div className="col-6 mb-1" style={{ color: T3 }}>
                    <i className="bi bi-laptop me-1"></i>
                    metasploit
                  </div>
                  <div className="col-6 mb-1" style={{ color: T3 }}>
                    <i className="bi bi-laptop me-1"></i>
                    burpsuite (GUI)
                  </div>
                  <div className="col-6 mb-1" style={{ color: T3 }}>
                    <i className="bi bi-laptop me-1"></i>
                    wireshark (GUI)
                  </div>
                  <div className="col-6 mb-1" style={{ color: T3 }}>
                    <i className="bi bi-laptop me-1"></i>
                    sqlmap
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <small style={{ color: T3, fontSize: '0.8rem' }}>
                  💡 In-browser terminal starts an Alpine container and auto-provisions hacking packages dynamically. Use your manual VirtualBox Kali VM for full-featured GUI tools!
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Interface */}
      {vmStatus === 'running' && (
        <div className="card terminal-card mb-4" style={{ border: '1px solid rgba(0, 255, 0, 0.2)', background: '#0d0f12', borderRadius: 16 }}>
          <div className="card-header d-flex justify-content-between align-items-center" style={{ background: 'rgba(0, 255, 0, 0.03)', borderBottom: '1px solid rgba(0, 255, 0, 0.15)' }}>
            <h5 className="mb-0" style={{ color: '#00ff00', fontWeight: 700 }}>
              <i className="bi bi-terminal me-2"></i>
              Web Terminal
            </h5>
            <small style={{ color: 'rgba(0, 255, 0, 0.65)' }}>Interactive terminal - Type commands directly</small>
          </div>
          <div className="card-body p-0 terminal-container">
            <div 
              ref={terminalRef}
              style={{ 
                height: '500px', 
                backgroundColor: '#0d0f12',
                overflow: 'hidden'
              }}
            />
          </div>
        </div>
      )}

      {/* Quick Start Guide */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card" style={cardBase}>
            <div className="card-header" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h5 className="mb-0" style={{ color: T, fontWeight: 700 }}>
                <i className="bi bi-lightbulb me-2" style={{ color: '#a490ff' }}></i>
                Quick Start Guide
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row">
                <div className="col-md-4 mb-3 mb-md-0">
                  <h6 style={{ color: T, fontWeight: 600 }}>1. Start the VM</h6>
                  <p className="small" style={{ color: T2, marginBottom: 0 }}>
                    Click "Start VM" to launch your Kali Linux environment. 
                    This may take a few moments.
                  </p>
                </div>
                <div className="col-md-4 mb-3 mb-md-0">
                  <h6 style={{ color: T, fontWeight: 600 }}>2. Use the Terminal</h6>
                  <p className="small" style={{ color: T2, marginBottom: 0 }}>
                    Type commands directly in the web terminal. All commands are 
                    executed in real-time on your VM.
                  </p>
                </div>
                <div className="col-md-4">
                  <h6 style={{ color: T, fontWeight: 600 }}>3. Practice Safely</h6>
                  <p className="small" style={{ color: T2, marginBottom: 0 }}>
                    All activities are contained within the VM. 
                    Experiment safely with various security tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
