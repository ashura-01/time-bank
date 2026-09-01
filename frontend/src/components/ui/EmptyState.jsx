import { Link } from 'react-router-dom';

export default function EmptyState({ title, description, actionText, actionTo, onAction }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', marginTop: '1rem' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.7 }}>🍃</div>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{title}</h3>
      {description && <p style={{ color: 'var(--text-muted, #6c757d)', margin: '0 0 1.25rem 0' }}>{description}</p>}
      {actionText && actionTo && (
        <Link to={actionTo} className="btn btn-primary" style={{ display: 'inline-block' }}>
          {actionText}
        </Link>
      )}
      {actionText && onAction && !actionTo && (
        <button type="button" onClick={onAction} className="btn btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
}
