import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';

export default function DisputesList({ disputes }) {
  if (disputes.length === 0) {
    return (
      <EmptyState
        title="No disputes raised"
        description="All your exchanges are currently running smoothly without open disputes"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {disputes.map((d) => (
        <div key={d.id} className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="font-semibold">{d.service_title || 'Disputed Service'}</span>
              <StatusBadge status={d.status} />
            </div>
            <span className="text-xs text-muted">
              {new Date(d.created_at).toLocaleDateString()}
            </span>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <span className="font-medium text-sm">Reason: </span>
            <span className="text-sm">{d.reason}</span>
          </div>
          {d.evidence && (
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="font-medium text-sm">Evidence: </span>
              <span className="text-sm text-muted">{d.evidence}</span>
            </div>
          )}
          {d.resolution && (
            <div className="alert alert-info" style={{ marginTop: '0.75rem', padding: '0.75rem' }}>
              <span className="font-medium text-sm">Resolution: </span>
              <span className="text-sm">{d.resolution}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
