import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';

export default function MyServicesList({ myServices, deletingServiceId, onDeleteService }) {
  if (myServices.length === 0) {
    return (
      <EmptyState
        title="No services posted yet"
        description="Share your skills or request assistance by posting your first service"
        actionText="Post a Service"
        actionTo="/services/new"
      />
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Type</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {myServices.map((service) => (
            <tr key={service.id}>
              <td>
                <Link to={`/services/${service.id}`} className="font-medium text-primary">
                  {service.title}
                </Link>
                {service.category_name && (
                  <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                    {service.category_name}
                  </div>
                )}
              </td>
              <td>
                <StatusBadge type={service.type} />
              </td>
              <td className="font-semibold">{service.duration_hours}h</td>
              <td>
                <StatusBadge status={service.status} />
              </td>
              <td className="text-sm text-muted">
                {new Date(service.created_at).toLocaleDateString()}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    to={`/services/${service.id}/edit`}
                    className="btn btn-sm btn-outline-primary"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDeleteService(service.id)}
                    disabled={deletingServiceId === service.id}
                    className="btn btn-sm btn-danger"
                  >
                    {deletingServiceId === service.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
