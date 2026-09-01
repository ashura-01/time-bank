import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgColors = {
    success: '#10B981',
    error: '#EF4444',
    info: '#3B82F6',
    warning: '#F59E0B'
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        backgroundColor: bgColors[type] || bgColors.success,
        color: '#FFFFFF',
        padding: '0.875rem 1.25rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        maxWidth: '380px',
        animation: 'slideIn 0.2s ease-out'
      }}
      role="alert"
    >
      <span style={{ fontSize: '1.125rem' }}>
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ️'}
      </span>
      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          marginLeft: 'auto',
          fontSize: '1.25rem',
          padding: 0,
          lineHeight: 1
        }}
      >
        &times;
      </button>
    </div>
  );
}
