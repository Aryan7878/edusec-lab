import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback(({ type = 'info', title, message, details, solutions, duration = 6000 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    
    setNotifications((prev) => [
      ...prev,
      { id, type, title, message, details, solutions, duration }
    ]);

    if (duration) {
      setTimeout(() => {
        dismissNotification(id);
      }, duration);
    }
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = {
    showNotification,
    dismissNotification,
    notifications
  };

  // Color mapping based on notification type
  const getTypeColors = (type) => {
    switch (type) {
      case 'success':
        return {
          border: '#22c55e',
          bg: 'rgba(18, 26, 22, 0.95)',
          icon: 'bi-check-circle-fill',
          iconColor: '#22c55e'
        };
      case 'error':
        return {
          border: '#ef4444',
          bg: 'rgba(28, 18, 18, 0.95)',
          icon: 'bi-x-circle-fill',
          iconColor: '#ef4444'
        };
      case 'warning':
        return {
          border: '#f59e0b',
          bg: 'rgba(28, 24, 18, 0.95)',
          icon: 'bi-exclamation-triangle-fill',
          iconColor: '#f59e0b'
        };
      case 'info':
      default:
        return {
          border: '#7b61ff',
          bg: 'rgba(20, 22, 34, 0.95)',
          icon: 'bi-info-circle-fill',
          iconColor: '#7b61ff'
        };
    }
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notifications Portal/Container */}
      <div 
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '420px',
          width: 'calc(100% - 48px)',
          pointerEvents: 'none'
        }}
      >
        {notifications.map((n) => {
          const colors = getTypeColors(n.type);
          return (
            <div
              key={n.id}
              className="notification-toast"
              style={{
                pointerEvents: 'auto',
                background: colors.bg,
                borderLeft: `4px solid ${colors.border}`,
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.02)',
                color: '#f0f2f8',
                backdropFilter: 'blur(16px)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              {/* Header */}
              <div className="d-flex align-items-start gap-3">
                <i 
                  className={`bi ${colors.icon}`} 
                  style={{ 
                    fontSize: '1.25rem', 
                    color: colors.iconColor,
                    marginTop: '2px'
                  }}
                />
                <div style={{ flex: 1 }}>
                  {n.title && (
                    <h6 style={{ 
                      margin: '0 0 4px 0', 
                      fontWeight: 700, 
                      fontSize: '0.95rem',
                      color: '#ffffff'
                    }}>
                      {n.title}
                    </h6>
                  )}
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: 'rgba(240, 242, 248, 0.85)',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-line'
                  }}>
                    {n.message}
                  </div>
                  
                  {/* Detailed system error logs if present */}
                  {n.details && (
                    <div style={{
                      marginTop: '10px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: 'rgba(240, 242, 248, 0.65)',
                      overflowX: 'auto',
                      maxHeight: '100px'
                    }}>
                      {n.details}
                    </div>
                  )}

                  {/* Actionable solutions list if present */}
                  {n.solutions && n.solutions.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ 
                        fontSize: '0.78rem', 
                        fontWeight: 600, 
                        color: colors.border,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '6px'
                      }}>
                        💡 Solutions & Steps:
                      </div>
                      <ul style={{ 
                        margin: 0, 
                        paddingLeft: '16px',
                        fontSize: '0.82rem',
                        color: 'rgba(240, 242, 248, 0.75)'
                      }}>
                        {n.solutions.map((sol, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>{sol}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => dismissNotification(n.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(240, 242, 248, 0.4)',
                    padding: '2px',
                    lineHeight: 1,
                    cursor: 'pointer',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'rgba(240, 242, 248, 0.9)'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(240, 242, 248, 0.4)'}
                >
                  <i className="bi bi-x-lg" style={{ fontSize: '0.9rem' }} />
                </button>
              </div>

              {/* Progress duration indicator */}
              {n.duration && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '3px',
                    background: colors.border,
                    opacity: 0.65,
                    animation: `toastProgress ${n.duration}ms linear forwards`,
                    transformOrigin: 'left'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};
