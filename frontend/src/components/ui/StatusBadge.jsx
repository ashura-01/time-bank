const statusMap = {
  // Transaction statuses
  pending: { label: 'Pending', className: 'badge-pending' },
  confirmed: { label: 'Confirmed', className: 'badge-info' },
  completed: { label: 'Completed', className: 'badge-success' },
  cancelled: { label: 'Cancelled', className: 'badge-danger' },
  disputed: { label: 'Disputed', className: 'badge-warning' },

  // Service statuses
  active: { label: 'Active', className: 'badge-success' },
  inactive: { label: 'Inactive', className: 'badge-secondary' },

  // Dispute statuses
  open: { label: 'Open', className: 'badge-warning' },
  under_review: { label: 'Under Review', className: 'badge-info' },
  resolved: { label: 'Resolved', className: 'badge-success' },
  rejected: { label: 'Rejected', className: 'badge-danger' },

  // Service Types
  offer: { label: 'Offer', className: 'badge-primary' },
  request: { label: 'Request', className: 'badge-secondary' }
};

export default function StatusBadge({ status, type, className = '' }) {
  const key = status || type;
  const config = statusMap[key] || { label: key, className: 'badge-secondary' };

  return (
    <span className={`badge ${config.className} ${className}`.trim()}>
      {config.label}
    </span>
  );
}
