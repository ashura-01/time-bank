import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';

export default function TransactionList({
  transactions,
  userId,
  onStatusUpdate,
  onOpenReview,
  onOpenDispute
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Start exchanging time by browsing and requesting services in the community"
        actionText="Browse Services"
        actionTo="/services"
      />
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Role</th>
            <th>Hours</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isRequester = tx.requester_id === userId;
            const isProvider = tx.provider_id === userId;
            const counterPartyName = isRequester
              ? `${tx.provider_first || ''} ${tx.provider_last || ''}`.trim()
              : `${tx.requester_first || ''} ${tx.requester_last || ''}`.trim();

            const myCompleted = isRequester ? tx.requester_completed_at : tx.provider_completed_at;

            return (
              <tr key={tx.id}>
                <td>
                  <Link to={`/services/${tx.service_id}`} className="font-medium text-primary">
                    {tx.service_title || 'View Service'}
                  </Link>
                  <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                    {isRequester ? `Provider: ${counterPartyName}` : `Requester: ${counterPartyName}`}
                  </div>
                </td>
                <td>
                  <span className={`badge ${isRequester ? 'badge-info' : 'badge-primary'}`}>
                    {isRequester ? 'Requester' : 'Provider'}
                  </span>
                </td>
                <td className="font-semibold">{tx.hours_exchanged}h</td>
                <td>
                  <StatusBadge status={tx.status} />
                  {tx.status === 'confirmed' && myCompleted && (
                    <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                      ✓ Waiting for other party
                    </div>
                  )}
                </td>
                <td className="text-sm text-muted">
                  {new Date(tx.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {/* Pending Actions */}
                    {tx.status === 'pending' && isProvider && (
                      <>
                        <button
                          type="button"
                          onClick={() => onStatusUpdate(tx.id, 'confirmed')}
                          className="btn btn-sm btn-success"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusUpdate(tx.id, 'cancelled')}
                          className="btn btn-sm btn-danger"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {tx.status === 'pending' && isRequester && (
                      <button
                        type="button"
                        onClick={() => onStatusUpdate(tx.id, 'cancelled')}
                        className="btn btn-sm btn-secondary"
                      >
                        Cancel
                      </button>
                    )}

                    {/* Confirmed Actions */}
                    {tx.status === 'confirmed' && (
                      <>
                        {!myCompleted ? (
                          <button
                            type="button"
                            onClick={() => onStatusUpdate(tx.id, 'completed')}
                            className="btn btn-sm btn-primary"
                          >
                            Mark Complete
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="btn btn-sm btn-secondary"
                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                          >
                            Waiting...
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenDispute(tx)}
                          className="btn btn-sm btn-warning"
                        >
                          Dispute
                        </button>
                        <button
                          type="button"
                          onClick={() => onStatusUpdate(tx.id, 'cancelled')}
                          className="btn btn-sm btn-secondary"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {/* Completed Actions */}
                    {tx.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => onOpenReview(tx)}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
