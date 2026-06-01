import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useAuth } from '../contexts/AuthContext';
import { LAB_GUIDES, DEFAULT_GUIDE } from './LabGuides';

const getAILabId = (name) => {
    const n = name.toLowerCase();
    if (n.includes('dvwa')) return 'dvwa';
    if (n.includes('juice')) return 'juice-shop';
    if (n.includes('metasploit')) return 'metasploitable';
    return 'general';
};

const QUICK_ACTIONS_BY_LAB = {
    'dvwa': [
        "Explain SQL Injection in DVWA",
        "How to trigger Reflected XSS",
        "Explain low vs medium security"
    ],
    'juice-shop': [
        "How to find the Score Board?",
        "SQL injection admin bypass help",
        "Trigger DOM XSS in Juice Shop"
    ],
    'metasploitable': [
        "Nmap scan command for host IP",
        "How to exploit VSFTPD 2.3.4",
        "Help with msfconsole basics"
    ],
    'general': [
        "Nmap ping sweep command",
        "Hydra SSH brute force command",
        "John the Ripper MD5 format syntax"
    ]
};

export default function LabTerminal({ labId, labName, onClose }) {
    const { user } = useAuth();
    const terminalRef = useRef(null);
    const terminal = useRef(null);
    const fitAddon = useRef(null);
    const commandHistory = useRef([]);
    const historyIndex = useRef(-1);
    const currentLine = useRef('');
    
    // UI Panels State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('guide'); // 'guide' | 'ai'
    const [completedSteps, setCompletedSteps] = useState({});
    
    // AI Chat State
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Initialize welcome message for AI Cyber Tutor
    useEffect(() => {
        setMessages([
            {
                id: 1,
                text: `👋 Hello! I'm your AI Cyber Tutor for the "${labName}" lab. I can help you with steps, tool syntax, vulnerability explanations, or hints. Ask me anything!`,
                sender: 'ai',
                timestamp: new Date()
            }
        ]);
    }, [labName]);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fit terminal when sidebar opens/closes or window resizes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (fitAddon.current) {
                try {
                    fitAddon.current.fit();
                } catch (e) {
                    console.error('Fit error:', e);
                }
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [sidebarOpen]);

    useEffect(() => {
        if (terminalRef.current && !terminal.current) {
            initializeTerminal();
        }
        return () => {
            if (terminal.current) {
                terminal.current.dispose();
                terminal.current = null;
            }
        };
    }, []);

    const initializeTerminal = () => {
        if (terminal.current) return;

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Courier New, monospace',
            theme: {
                background: '#131722',
                foreground: '#00ff00',
                cursor: '#00ff00',
                selection: '#333333'
            }
        });

        fitAddon.current = new FitAddon();
        term.loadAddon(fitAddon.current);
        term.open(terminalRef.current);
        
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
        term.writeln(`\x1b[32m║     ${labName.padEnd(44, ' ')} ║\x1b[0m`);
        term.writeln('\x1b[32m╚════════════════════════════════════════════════╝\x1b[0m');
        term.writeln('');
        term.writeln('\x1b[36mWelcome to your lab environment!\x1b[0m');
        term.writeln('\x1b[33mType commands to interact with the lab container.\x1b[0m');
        term.writeln('');
        term.write('\x1b[36mroot@lab:~# \x1b[0m');

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
                    term.write('\x1b[36mroot@lab:~# \x1b[0m');
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
                            term.write('\r\x1b[K');
                            term.write('\x1b[36mroot@lab:~# \x1b[0m');
                            term.write(prevCmd);
                            currentLine.current = prevCmd;
                        }
                    } else if (arrow === 'B') { // Down
                        if (historyIndex.current < commandHistory.current.length - 1) {
                            historyIndex.current++;
                            const prevCmd = commandHistory.current[historyIndex.current];
                            term.write('\r\x1b[K');
                            term.write('\x1b[36mroot@lab:~# \x1b[0m');
                            term.write(prevCmd);
                            currentLine.current = prevCmd;
                        } else {
                            historyIndex.current = commandHistory.current.length;
                            term.write('\r\x1b[K');
                            term.write('\x1b[36mroot@lab:~# \x1b[0m');
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
            const response = await axios.post(`/api/labs/${labId}/execute`, { command: cmd });

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

        terminal.current.write('\r\n\x1b[36mroot@lab:~# \x1b[0m');
    };

    const handleSendMessage = async (e, directText = null) => {
        if (e) e.preventDefault();
        const text = (directText || inputMessage).trim();
        if (!text) return;

        const userMsg = {
            id: Date.now(),
            text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!directText) setInputMessage('');
        setAiLoading(true);

        try {
            const aiLabId = getAILabId(labName);
            const response = await axios.post('/api/ai/assist', {
                message: text,
                labId: aiLabId,
                context: {
                    userLevel: user?.level,
                    currentLab: aiLabId
                }
            });

            const aiMsg = {
                id: Date.now() + 1,
                text: response.data.response,
                sender: 'ai',
                hints: response.data.hints || null,
                usedModel: response.data.usedModel,
                usedKB: response.data.usedKB,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    text: "❌ Sorry, I'm having trouble responding right now. Please try again later or check your connection.",
                    sender: 'ai',
                    timestamp: new Date()
                }
            ]);
        } finally {
            setAiLoading(false);
        }
    };

    const toggleStep = (index) => {
        setCompletedSteps(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const guide = LAB_GUIDES[labName] || DEFAULT_GUIDE;
    const aiLabId = getAILabId(labName);
    const suggestions = QUICK_ACTIONS_BY_LAB[aiLabId] || QUICK_ACTIONS_BY_LAB['general'];

    return (
        <div style={styles.container}>
            {/* Top Chrome Header */}
            <div style={styles.chrome} className="d-flex align-items-center justify-content-between px-3 py-2">
                <div className="text-truncate d-flex align-items-center">
                    <strong style={{ color: '#fff' }}>{labName}</strong>
                    <span className="text-white-50 ms-2 small d-none d-sm-inline">Interactive Lab Session</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button 
                        className={`btn btn-sm ${sidebarOpen ? 'btn-info' : 'btn-outline-info'}`}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ borderRadius: 8, padding: '5px 12px', fontWeight: 600 }}
                    >
                        <i className={`bi ${sidebarOpen ? 'bi-layout-sidebar-inset-reverse' : 'bi-layout-sidebar-reverse'} me-1`}></i>
                        {sidebarOpen ? 'Hide Guide & AI' : 'Show Guide & AI'}
                    </button>
                    <button className="btn btn-outline-danger btn-sm" onClick={onClose} style={{ borderRadius: 8, padding: '5px 12px', fontWeight: 600 }}>
                        <i className="bi bi-x-lg me-1"></i> Close
                    </button>
                </div>
            </div>

            {/* Split Content Area */}
            <div style={styles.workspace}>
                {/* Left: Terminal */}
                <div style={styles.terminalContainer}>
                    <div
                        ref={terminalRef}
                        style={styles.terminal}
                    />
                </div>

                {/* Right: Sidebar (collapsible) */}
                <div style={{
                    ...styles.sidebar,
                    ...(sidebarOpen ? {} : styles.sidebarClosed)
                }}>
                    {/* Tab Navigation */}
                    <div style={styles.tabHeader}>
                        <button 
                            style={styles.tabButton(activeTab === 'guide')} 
                            onClick={() => setActiveTab('guide')}
                        >
                            <i className="bi bi-journal-code me-2"></i>
                            Lab Guide
                        </button>
                        <button 
                            style={styles.tabButton(activeTab === 'ai')} 
                            onClick={() => setActiveTab('ai')}
                        >
                            <i className="bi bi-robot me-2"></i>
                            AI Cyber Tutor
                        </button>
                    </div>

                    {/* Tab Body */}
                    <div style={styles.tabBody}>
                        {activeTab === 'guide' && (
                            <div className="d-flex flex-column h-100">
                                <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: '15px' }}>
                                    Instructions Checklist
                                </h5>
                                <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>
                                    {(guide.terminalSteps || guide.steps).map((step, idx) => (
                                        <div 
                                            key={idx} 
                                            style={styles.checkItem(completedSteps[idx])} 
                                            onClick={() => toggleStep(idx)}
                                        >
                                            <div style={styles.checkbox(completedSteps[idx])}>
                                                {completedSteps[idx] && <i className="bi bi-check" style={{ fontSize: '0.9rem', color: '#fff' }}></i>}
                                            </div>
                                            <span style={styles.stepText(completedSteps[idx])}>
                                                {step}
                                            </span>
                                        </div>
                                    ))}

                                    <div style={styles.hintsBox}>
                                        <h6 style={{ color: '#ffd93d', fontWeight: 700, fontSize: '0.9rem' }} className="mb-2">
                                            <i className="bi bi-lightbulb-fill me-2"></i>
                                            Hacking Hints & Tips
                                        </h6>
                                        <ul style={styles.hintsList}>
                                            {guide.hints.map((hint, idx) => (
                                                <li key={idx} className="mb-2">{hint}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="d-flex flex-column h-100" style={{ overflow: 'hidden' }}>
                                {/* Scrollable Chat Area */}
                                <div style={styles.chatArea}>
                                    {messages.map((msg) => (
                                        <div key={msg.id} style={styles.messageRow(msg.sender === 'user')}>
                                            <div style={styles.messageBubble(msg.sender === 'user')}>
                                                <div>{msg.text}</div>
                                                
                                                {msg.usedModel && (
                                                    <small style={{ color: '#86efac', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.72rem' }}>
                                                        <i className="bi bi-stars"></i> Powered by {msg.usedModel}
                                                    </small>
                                                )}

                                                <small style={styles.messageTime}>
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </small>
                                            </div>
                                        </div>
                                    ))}

                                    {aiLoading && (
                                        <div style={styles.messageRow(false)}>
                                            <div style={{ ...styles.messageBubble(false), display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="spinner-border spinner-border-sm text-info" role="status" style={{ width: '12px', height: '12px' }}></div>
                                                <span style={{ color: 'rgba(240, 242, 248, 0.65)' }}>Tutor is typing...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Quick Suggestions */}
                                <div style={styles.suggestionsContainer}>
                                    <small style={{ color: 'rgba(240, 242, 248, 0.42)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Suggested Questions
                                    </small>
                                    <div className="d-flex flex-column gap-2 mt-1">
                                        {suggestions.map((action, idx) => (
                                            <button 
                                                key={idx} 
                                                style={styles.suggestionBtn}
                                                onClick={(e) => handleSendMessage(e, action)}
                                                disabled={aiLoading}
                                            >
                                                <i className="bi bi-chat-dots-fill"></i>
                                                {action}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Chat Input Area */}
                                <div style={styles.inputArea}>
                                    <form onSubmit={handleSendMessage} style={styles.formGroup}>
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder="Ask a question..."
                                            style={styles.input}
                                            disabled={aiLoading}
                                        />
                                        <button 
                                            type="submit" 
                                            style={styles.sendBtn}
                                            disabled={aiLoading || !inputMessage.trim()}
                                        >
                                            <i className="bi bi-send-fill" style={{ fontSize: '0.9rem' }}></i>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: '#0d0f12',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    chrome: {
        color: '#fff',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(180deg, rgba(16,18,26,0.95), rgba(14,16,22,0.92))',
        flex: '0 0 auto'
    },
    workspace: {
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        background: '#0d0f12'
    },
    terminalContainer: {
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '100%',
        backgroundColor: '#131722',
        overflow: 'hidden',
        padding: '10px'
    },
    terminal: {
        width: '100%',
        height: '100%',
        backgroundColor: '#131722',
        overflow: 'hidden'
    },
    sidebar: {
        width: '420px',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'linear-gradient(180deg, rgba(18, 22, 34, 0.96) 0%, rgba(12, 14, 20, 0.98) 100%)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        flexShrink: 0
    },
    sidebarClosed: {
        width: '0px',
        borderLeft: 'none'
    },
    tabHeader: {
        display: 'flex',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.15)',
        flex: '0 0 auto'
    },
    tabButton: (isActive) => ({
        flex: 1,
        padding: '14px 16px',
        background: isActive ? 'rgba(123, 97, 255, 0.08)' : 'transparent',
        border: 'none',
        color: isActive ? '#a490ff' : 'rgba(240, 242, 248, 0.55)',
        fontWeight: 700,
        fontSize: '0.85rem',
        borderBottom: isActive ? '2px solid #7b61ff' : 'none',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }),
    tabBody: {
        flex: '1 1 auto',
        overflow: 'hidden',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    },
    checkItem: (completed) => ({
        display: 'flex',
        alignItems: 'flex-start',
        padding: '10px 12px',
        borderRadius: '10px',
        background: completed ? 'rgba(34, 197, 94, 0.04)' : 'rgba(255, 255, 255, 0.02)',
        border: completed ? '1px solid rgba(34, 197, 94, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
        cursor: 'pointer',
        marginBottom: '10px',
        transition: 'all 200ms ease'
    }),
    checkbox: (completed) => ({
        width: '18px',
        height: '18px',
        borderRadius: '4px',
        border: completed ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.25)',
        background: completed ? '#22c55e' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '12px',
        marginTop: '2px',
        flexShrink: 0,
        transition: 'all 150ms ease'
    }),
    stepText: (completed) => ({
        color: completed ? 'rgba(240, 242, 248, 0.42)' : '#f0f2f8',
        fontSize: '0.85rem',
        lineHeight: 1.5,
        textDecoration: completed ? 'line-through' : 'none',
        userSelect: 'none'
    }),
    hintsBox: {
        marginTop: '20px',
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(255, 217, 61, 0.03)',
        border: '1px solid rgba(255, 217, 61, 0.12)'
    },
    hintsList: {
        paddingLeft: '16px',
        color: 'rgba(240, 242, 248, 0.65)',
        fontSize: '0.82rem',
        lineHeight: 1.6,
        marginBottom: 0
    },
    chatArea: {
        flex: '1 1 auto',
        overflowY: 'auto',
        paddingRight: '6px',
        marginBottom: '12px'
    },
    messageRow: (isUser) => ({
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px'
    }),
    messageBubble: (isUser) => ({
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
        background: isUser 
            ? 'linear-gradient(135deg, #7b61ff 0%, #6366f1 100%)' 
            : 'rgba(255, 255, 255, 0.05)',
        border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
        color: '#f0f2f8',
        fontSize: '0.85rem',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    }),
    messageTime: {
        display: 'block',
        fontSize: '0.7rem',
        color: 'rgba(240, 242, 248, 0.4)',
        marginTop: '4px',
        textAlign: 'right'
    },
    inputArea: {
        paddingTop: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        flex: '0 0 auto'
    },
    formGroup: {
        display: 'flex',
        gap: '8px'
    },
    input: {
        flex: '1 1 auto',
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: '#fff',
        padding: '8px 12px',
        fontSize: '0.85rem',
        outline: 'none',
        transition: 'all 200ms ease'
    },
    sendBtn: {
        background: '#7b61ff',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        width: '38px',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 200ms ease'
    },
    suggestionsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '12px',
        padding: '10px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        flex: '0 0 auto'
    },
    suggestionBtn: {
        background: 'rgba(123, 97, 255, 0.06)',
        border: '1px solid rgba(123, 97, 255, 0.12)',
        borderRadius: '8px',
        color: '#c4b5fd',
        padding: '6px 10px',
        fontSize: '0.78rem',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    }
};
