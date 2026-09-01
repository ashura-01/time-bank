import { useState } from 'react';
import Modal from '../ui/Modal';
import { reviewsAPI } from '../../services/api';

export default function ReviewModal({ tx, isOpen, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!tx) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await reviewsAPI.create({
        transaction_id: tx.id,
        rating: Number(rating),
        comment
      });
      onReviewSubmitted(res.data.review);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review "${tx.service_title || 'Service'}"`}>
      {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Rating</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.75rem',
                  cursor: 'pointer',
                  color: star <= rating ? '#F59E0B' : '#D1D5DB'
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="review-comment" className="form-label">Comment (Optional)</label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="form-control"
            rows="3"
            placeholder="Share your experience working together..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
