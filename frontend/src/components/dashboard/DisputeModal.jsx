import { useState } from 'react';
import Modal from '../ui/Modal';
import { disputesAPI } from '../../services/api';

export default function DisputeModal({ tx, isOpen, onClose, onDisputeSubmitted }) {
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!tx) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for the dispute');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await disputesAPI.create({
        transaction_id: tx.id,
        reason,
        evidence
      });
      onDisputeSubmitted(res.data.dispute, tx.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to raise dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Raise Dispute for "${tx.service_title || 'Service'}"`}>
      {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="dispute-reason" className="form-label">Reason for Dispute</label>
          <textarea
            id="dispute-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="form-control"
            rows="3"
            required
            placeholder="Describe what went wrong or why you are disputing this transaction..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="dispute-evidence" className="form-label">Evidence / Notes (Optional)</label>
          <textarea
            id="dispute-evidence"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            className="form-control"
            rows="2"
            placeholder="Links, details, agreed terms, or conversation snippets..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn btn-warning">
            {submitting ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
