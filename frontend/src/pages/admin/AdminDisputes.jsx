import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { disputesAPI } from '../../services/api';

const statusColors = {
  open: 'badge-warning',
  under_review: 'badge-primary',
  resolved: 'badge-success',
  rejected: 'badge-gray'
};

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeDispute, setActiveDispute] = useState(null);
  const [resolution, setResolution] = useState('');
  const [resolveStatus, setResolveStatus] = useState('resolved');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await disputesAPI.getAll(statusFilter ? { status: statusFilter, limit: 50 } : { limit: 50 });
      setDisputes(res.data.disputes);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const openResolveModal = (dispute) => {
    setActiveDispute(dispute);
    setResolution(dispute.resolution || '');
    setResolveStatus('resolved');
    setError('');
  };

  const closeModal = () => {
    setActiveDispute(null);
    setResolution('');
    setError('');
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolution.trim()) {
      setError('Please provide a resolution note');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await disputesAPI.resolve(activeDispute.id, { resolution, status: resolveStatus });
      closeModal();
      fetchDisputes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resolve dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Dispute Management</h1>
          <p className="page-subtitle">Review and resolve disputes raised between members</p>
        </div>

        <div className="card mb-6">
          <div className="card-body">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full lg:w-64"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="card animate-pulse p-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded mb-3"></div>
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <p className="text-gray-500">No disputes found</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Raised By</th>
                    <th>Requester</th>
                    <th>Provider</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map(dispute => (
                    <tr key={dispute.id}>
                      <td>
                        <Link to={`/services/${dispute.service_id}`} className="font-medium hover:text-primary">
                          {dispute.service_title}
                        </Link>
                      </td>
                      <td className="text-sm">{dispute.raised_first} {dispute.raised_last}</td>
                      <td className="text-sm">{dispute.requester_first} {dispute.requester_last}</td>
                      <td className="text-sm">{dispute.provider_first} {dispute.provider_last}</td>
                      <td className="max-w-xs truncate text-sm text-gray-600">{dispute.reason}</td>
                      <td>
                        <span className={`badge ${statusColors[dispute.status]}`}>
                          {dispute.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-sm text-gray-500">{new Date(dispute.created_at).toLocaleDateString()}</td>
                      <td>
                        {dispute.status === 'open' || dispute.status === 'under_review' ? (
                          <button onClick={() => openResolveModal(dispute)} className="btn btn-primary btn-sm">
                            Resolve
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeDispute && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="font-semibold">Resolve Dispute</h3>
                <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
              </div>
              <form onSubmit={handleResolve}>
                <div className="modal-body space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium">{activeDispute.service_title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reason</p>
                    <p className="text-sm">{activeDispute.reason}</p>
                  </div>

                  {error && <div className="alert alert-error text-sm">{error}</div>}

                  <div>
                    <label htmlFor="resolveStatus" className="label">Outcome</label>
                    <select
                      id="resolveStatus"
                      value={resolveStatus}
                      onChange={e => setResolveStatus(e.target.value)}
                      className="w-full"
                    >
                      <option value="resolved">Resolved (uphold transaction)</option>
                      <option value="rejected">Rejected (dismiss dispute)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="resolution" className="label">Resolution Notes</label>
                    <textarea
                      id="resolution"
                      rows={4}
                      value={resolution}
                      onChange={e => setResolution(e.target.value)}
                      className="w-full"
                      placeholder="Explain the decision..."
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={closeModal} className="btn btn-outline">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Submitting...' : 'Submit Resolution'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
