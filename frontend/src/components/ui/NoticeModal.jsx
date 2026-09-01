import Modal from './Modal';

export default function NoticeModal({
  isOpen,
  onClose,
  type = 'info', // 'info' | 'success' | 'warning' | 'complete'
  title,
  message,
  primaryActionText = 'Got it',
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction
}) {
  const iconConfig = {
    info: { icon: '⏳', bg: '#EFF6FF', color: '#3B82F6' },
    success: { icon: '✓', bg: '#DCFCE7', color: '#16A34A' },
    complete: { icon: '🎉', bg: '#FEF3C7', color: '#D97706' },
    warning: { icon: '⚠️', bg: '#FEE2E2', color: '#DC2626' }
  }[type] || { icon: 'ℹ️', bg: '#EFF6FF', color: '#3B82F6' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="460px">
      <div style={{ textAlign: 'center', padding: '0.5rem 0 0.5rem 0' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: iconConfig.bg,
            color: iconConfig.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            margin: '0 auto 1rem auto'
          }}
        >
          {iconConfig.icon}
        </div>

        <p style={{ color: '#4B5563', fontSize: '0.95rem', margin: '0 0 1.5rem 0', lineHeight: 1.6 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          {secondaryActionText && (
            <button
              type="button"
              onClick={() => {
                if (onSecondaryAction) onSecondaryAction();
                onClose();
              }}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              {secondaryActionText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onPrimaryAction) onPrimaryAction();
              onClose();
            }}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            {primaryActionText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
