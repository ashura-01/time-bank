export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
      {message && <p style={{ color: 'var(--text-muted, #6c757d)' }}>{message}</p>}
    </div>
  );
}
