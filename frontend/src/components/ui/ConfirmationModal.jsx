import { Link } from 'react-router-dom';
import Modal from './Modal';

export default function ConfirmationModal({
  isOpen,
  onClose,
  title = 'Request Submitted Successfully!',
  serviceTitle,
  hours,
  providerName,
  isRemote,
  location,
  scheduledAt
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="480px">
      <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem 0' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#DCFCE7',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 1rem auto'
          }}
        >
          ✓
        </div>

        <h4 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#111827' }}>
          Exchange Request Sent
        </h4>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
          Your exchange request has been dispatched to{' '}
          <strong style={{ color: '#1F2937' }}>{providerName || 'the provider'}</strong>. Once they confirm, the time exchange will be scheduled.
        </p>

        {/* Details Box */}
        <div
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '0.5rem',
            padding: '0.875rem 1rem',
            textAlign: 'left',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7280' }}>Service:</span>
            <span style={{ fontWeight: '500', color: '#111827', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {serviceTitle}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7280' }}>Hours:</span>
            <span style={{ fontWeight: '600', color: '#3B82F6' }}>{hours}h</span>
          </div>
          {scheduledAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Preferred Date:</span>
              <span style={{ fontWeight: '500', color: '#111827' }}>
                {new Date(scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7280' }}>Format:</span>
            <span style={{ fontWeight: '500', color: '#111827' }}>
              {isRemote ? 'Remote Session' : (location || 'In Person')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            to="/dashboard"
            className="btn btn-primary"
            style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
          >
            Go to My Dashboard
          </Link>
          <Link
            to="/services"
            className="btn btn-secondary"
            style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
          >
            Browse More Services
          </Link>
        </div>
      </div>
    </Modal>
  );
}
