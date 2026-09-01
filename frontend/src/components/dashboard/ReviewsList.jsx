import EmptyState from '../ui/EmptyState';

export default function ReviewsList({ reviews }) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="No reviews yet"
        description="Reviews from community members will appear here once exchanges are completed"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {reviews.map((r) => (
        <div key={r.id} className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#F59E0B', fontSize: '1.125rem' }}>
                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
              </span>
              <span className="font-semibold">{r.rating}/5</span>
            </div>
            <span className="text-xs text-muted">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>
          {r.comment && <p style={{ margin: '0.5rem 0', color: '#374151' }}>{r.comment}</p>}
          <div className="text-xs text-muted">
            By {r.reviewer_first} {r.reviewer_last} {r.service_title ? `for "${r.service_title}"` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
