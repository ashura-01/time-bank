import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactionsAPI, reviewsAPI, disputesAPI, servicesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed'
};

const statusColors = {
  pending: 'badge-warning',
  confirmed: 'badge-primary',
  completed: 'badge-success',
  cancelled: 'badge-gray',
  disputed: 'badge-danger'
};

export default function Dashboard() {
  const { user, refetch } = useAuth();
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingServiceId, setDeletingServiceId] = useState(null);

  // Review modal state
  const [reviewTx, setReviewTx] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Dispute modal state
  const [disputeTx, setDisputeTx] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [txRes, reviewsRes, disputesRes, servicesRes] = await Promise.all([
          transactionsAPI.getAll({ limit: 20 }),
          reviewsAPI.getAll({ reviewee_id: user.id, limit: 10 }),
          disputesAPI.getAll({ limit: 10 }),
          servicesAPI.getAll({ provider_id: user.id, limit: 20 })
        ]);
        setTransactions(txRes.data.transactions);
        setReviews(reviewsRes.data.reviews);
        setDisputes(disputesRes.data.disputes);
        setMyServices(servicesRes.data.services);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const handleStatusUpdate = async (transactionId, newStatus) => {
    try {
      await transactionsAPI.updateStatus(transactionId, { status: newStatus });
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: newStatus } : t));
      refetch();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service? This cannot be undone.')) return;

    setDeletingServiceId(serviceId);
    try {
      await servicesAPI.delete(serviceId);
      setMyServices(prev => prev.filter(s => s.id !== serviceId));
      alert('Service deleted successfully');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete service');
    } finally {
      setDeletingServiceId(null);
    }
  };

  const openReviewModal = (tx) => {
    setReviewTx(tx);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
  };

  const closeReviewModal = () => {
    setReviewTx(null);
    setReviewError('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await reviewsAPI.create({
        transaction_id: reviewTx.id,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviews(prev => [res.data.review, ...prev]);
      closeReviewModal();
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const openDisputeModal = (tx) => {
    setDisputeTx(tx);
    setDisputeReason('');
    setDisputeEvidence('');
    setDisputeError('');
  };

  const closeDisputeModal = () => {
    setDisputeTx(null);
    setDisputeError('');
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    setDisputeSubmitting(true);
    setDisputeError('');
    try {
      const res = await disputesAPI.create({
        transaction_id: disputeTx.id,
        reason: disputeReason,
        evidence: disputeEvidence
      });
      setDisputes(prev => [res.data.dispute, ...prev]);
      setTransactions(prev => prev.map(t => t.id === disputeTx.id ? { ...t, status: 'disputed' } : t));
      closeDisputeModal();
    } catch (err) {
      setDisputeError(err.response?.data?.error || 'Failed to raise dispute');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="container">
          <div className="card animate-pulse" style={{ padding: '2rem' }}>
            <div style={{ height: '2rem', backgroundColor: '#E5E7EB', borderRadius: '0.25rem', width: '25%', marginBottom: '1.5rem' }}></div>
            <div className="grid grid-3" style={{ gap: '1.5rem' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ height: '6rem', backgroundColor: '#E5E7EB', borderRadius: '0.25rem' }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const myTransactions = transactions.filter(
    t => t.requester_id === user.id || t.provider_id === user.id
  );

  const pendingAsProvider = myTransactions.filter(
    t => t.provider_id === user.id && t.status === 'pending'
  );

  const pendingAsRequester = myTransactions.filter(
    t => t.requester_id === user.id && t.status === 'confirmed'
  );

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="container">
        
        {/* Header Section */}
        <div className="page-header" style={{ borderBottom: 'none', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Welcome back, {user.first_name}! Your balance: <span className="text-primary font-bold">{user.time_balance}h</span></p>
            </div>
            <Link to="/services/new" className="btn btn-primary">Post a Service</Link>
          </div>
        </div>

        {/* Alerts */}
        {pendingAsProvider.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
            <svg style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">You have {pendingAsProvider.length} transaction(s) awaiting confirmation</p>
              <p className="text-sm" style={{ opacity: 0.9 }}>Review and confirm pending requests from other members</p>
            </div>
          </div>
        )}

        {pendingAsRequester.length > 0 && (
          <div className="alert alert-info" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
            <svg style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-5a1 1 0 01-2 0v5a1 1 0 012 0V5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">You have {pendingAsRequester.length} confirmed transaction(s) ready to complete</p>
              <p className="text-sm" style={{ opacity: 0.9 }}>Mark them as completed to exchange time credits</p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header" style={{ paddingBottom: '0' }}>
            <nav style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem' }} aria-label="Dashboard tabs">
              {[
                { id: 'transactions', label: 'Transactions', count: myTransactions.length },
                { id: 'my-services', label: 'My Services', count: myServices.length },
                { id: 'reviews', label: 'Reviews', count: reviews.length },
                { id: 'disputes', label: 'Disputes', count: disputes.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: activeTab === tab.id ? '#3B82F6' : 'transparent',
                    color: activeTab === tab.id ? 'white' : '#4B5563',
                  }}
                  onMouseOver={(e) => { if(activeTab !== tab.id) e.currentTarget.style.backgroundColor = '#F3F4F6' }}
                  onMouseOut={(e) => { if(activeTab !== tab.id) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {tab.label} 
                  <span style={{ 
                    marginLeft: '0.5rem', 
                    padding: '0.125rem 0.5rem', 
                    fontSize: '0.75rem', 
                    backgroundColor: activeTab === tab.id ? '#2563EB' : '#E5E7EB',
                    color: activeTab === tab.id ? 'white' : '#1F2937',
                    borderRadius: '9999px' 
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="card-body">
            {activeTab === 'transactions' && (
              <div>
                {myTransactions.length === 0 ? (
                  <div className="empty-state">
                    <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '500' }}>No transactions yet</h3>
                    <p style={{ color: '#6B7280', marginTop: '0.25rem' }}>Start exchanging time by browsing services</p>
                    <Link to="/services" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>Browse Services</Link>
                  </div>
                ) : (
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
                        {myTransactions.map(tx => (
                          <tr key={tx.id}>
                            <td>
                              <Link to={`/services/${tx.service_id}`} className="font-medium" style={{ color: '#111827', textDecoration: 'none' }} onMouseOver={e => e.target.style.color = '#3B82F6'} onMouseOut={e => e.target.style.color = '#111827'}>
                                {tx.service_title}
                              </Link>
                            </td>
                            <td>
                              <span className={tx.requester_id === user.id ? 'badge badge-primary' : 'badge badge-success'}>
                                {tx.requester_id === user.id ? 'Requester' : 'Provider'}
                              </span>
                            </td>
                            <td className="font-medium">{tx.hours_exchanged}h</td>
                            <td>
                              <span className={`badge ${statusColors[tx.status]}`}>
                                {statusLabels[tx.status]}
                              </span>
                            </td>
                            <td className="text-sm" style={{ color: '#6B7280' }}>
                              {new Date(tx.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {tx.status === 'pending' && tx.provider_id === user.id && (
                                  <button
                                    onClick={() => handleStatusUpdate(tx.id, 'confirmed')}
                                    className="btn btn-primary btn-sm"
                                  >
                                    Confirm
                                  </button>
                                )}
                                {tx.status === 'confirmed' && (
                                  <button
                                    onClick={() => handleStatusUpdate(tx.id, 'completed')}
                                    className="btn btn-success btn-sm"
                                    style={{ backgroundColor: '#10B981', color: 'white' }}
                                  >
                                    Complete
                                  </button>
                                )}
                                {tx.status === 'pending' && tx.requester_id === user.id && (
                                  <button
                                    onClick={() => handleStatusUpdate(tx.id, 'cancelled')}
                                    className="btn btn-outline btn-sm"
                                    style={{ color: '#DC2626', borderColor: '#DC2626' }}
                                  >
                                    Cancel
                                  </button>
                                )}
                                {tx.status === 'completed' && (
                                  <button
                                    onClick={() => openReviewModal(tx)}
                                    className="btn btn-outline btn-sm"
                                  >
                                    Leave Review
                                  </button>
                                )}
                                {['pending', 'confirmed', 'completed'].includes(tx.status) && (
                                  <button
                                    onClick={() => openDisputeModal(tx)}
                                    className="btn btn-outline btn-sm"
                                    style={{ color: '#DC2626', borderColor: '#DC2626' }}
                                  >
                                    Raise Dispute
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'my-services' && (
              <div>
                {myServices.length === 0 ? (
                  <div className="empty-state">
                    <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '500' }}>No services posted yet</h3>
                    <p style={{ color: '#6B7280', marginTop: '0.25rem' }}>Create your first service to start offering or requesting help</p>
                    <Link to="/services/new" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>Post a Service</Link>
                  </div>
                ) : (
                  <div className="grid grid-3" style={{ gap: '1.5rem' }}>
                    {myServices.map(service => (
                      <article key={service.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '192px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          <span className="badge badge-primary" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                            {service.type === 'offer' ? 'Offer' : 'Request'}
                          </span>
                          <span className="badge badge-gray" style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: service.category_color + '20', color: service.category_color }}>
                            {service.category_name}
                          </span>
                          <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', backgroundColor: service.category_color + '20', color: service.category_color }}>
                            <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                          </div>
                        </div>
                        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {service.title}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {service.description}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #F3F4F6', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', fontSize: '0.875rem' }}>
                              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                              </svg>
                              {service.duration_hours}h
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Link to={`/services/${service.id}/edit`} className="btn btn-outline btn-sm">
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDeleteService(service.id)}
                                disabled={deletingServiceId === service.id}
                                className="btn btn-outline btn-sm"
                                style={{ color: '#DC2626', borderColor: '#DC2626' }}
                              >
                                {deletingServiceId === service.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviews.length === 0 ? (
                  <div className="empty-state">
                    <p style={{ color: '#6B7280' }}>No reviews received yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {reviews.map(review => (
                      <div key={review.id} className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="avatar" style={{ backgroundColor: '#3B82F6' }}>
                              {review.reviewer_first[0]}{review.reviewer_last[0]}
                            </div>
                            <div>
                              <p className="font-medium">{review.reviewer_first} {review.reviewer_last}</p>
                              <p className="text-sm" style={{ color: '#6B7280' }}>{review.service_title}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#F59E0B' }}>★ {review.rating}</span>
                            <span className="text-sm" style={{ color: '#6B7280' }}>{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {review.comment && (
                          <p style={{ marginTop: '0.75rem', color: '#4B5563' }}>{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'disputes' && (
              <div>
                {disputes.length === 0 ? (
                  <div className="empty-state">
                    <p style={{ color: '#6B7280' }}>No disputes</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Status</th>
                          <th>Raised By</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disputes.map(dispute => (
                          <tr key={dispute.id}>
                            <td>
                              <Link to={`/services/${dispute.service_id}`} className="font-medium" style={{ color: '#111827', textDecoration: 'none' }} onMouseOver={e => e.target.style.color = '#3B82F6'} onMouseOut={e => e.target.style.color = '#111827'}>
                                {dispute.service_title}
                              </Link>
                            </td>
                            <td>
                              <span className={`badge ${{
                                open: 'badge-warning',
                                under_review: 'badge-primary',
                                resolved: 'badge-success',
                                rejected: 'badge-gray'
                              }[dispute.status]}`}>
                                {dispute.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td>{dispute.raised_first} {dispute.raised_last}</td>
                            <td className="text-sm" style={{ color: '#6B7280' }}>{new Date(dispute.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {reviewTx && (
          <div className="modal-overlay" onClick={closeReviewModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="font-semibold">Leave a Review</h3>
                <button type="button" onClick={closeReviewModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '1.25rem' }} aria-label="Close">✕</button>
              </div>
              <form onSubmit={handleReviewSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    For <span className="font-medium" style={{ color: '#374151' }}>{reviewTx.service_title}</span>
                  </p>

                  {reviewError && <div className="alert alert-error text-sm">{reviewError}</div>}

                  <div>
                    <label className="label">Rating</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setReviewRating(n)}
                          style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: n <= reviewRating ? '#F59E0B' : '#D1D5DB' }}
                          aria-label={`${n} star`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reviewComment" className="label">Comment (optional)</label>
                    <textarea
                      id="reviewComment"
                      rows={4}
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="How was your experience?"
                      maxLength={1000}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={closeReviewModal} className="btn btn-outline">Cancel</button>
                  <button type="submit" disabled={reviewSubmitting} className="btn btn-primary">
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {disputeTx && (
          <div className="modal-overlay" onClick={closeDisputeModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="font-semibold">Raise a Dispute</h3>
                <button type="button" onClick={closeDisputeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '1.25rem' }} aria-label="Close">✕</button>
              </div>
              <form onSubmit={handleDisputeSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    For <span className="font-medium" style={{ color: '#374151' }}>{disputeTx.service_title}</span>
                  </p>

                  {disputeError && <div className="alert alert-error text-sm">{disputeError}</div>}

                  <div>
                    <label htmlFor="disputeReason" className="label">Reason (20-2000 characters)</label>
                    <textarea
                      id="disputeReason"
                      rows={4}
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="Explain what went wrong..."
                      minLength={20}
                      maxLength={2000}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="disputeEvidence" className="label">Evidence (optional)</label>
                    <textarea
                      id="disputeEvidence"
                      rows={3}
                      value={disputeEvidence}
                      onChange={e => setDisputeEvidence(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      placeholder="Links, notes, or other supporting details"
                      maxLength={5000}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={closeDisputeModal} className="btn btn-outline">Cancel</button>
                  <button type="submit" disabled={disputeSubmitting} className="btn btn-primary">
                    {disputeSubmitting ? 'Submitting...' : 'Submit Dispute'}
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