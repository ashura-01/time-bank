import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import NoticeModal from '../components/ui/NoticeModal';
import PromptConfirmModal from '../components/ui/PromptConfirmModal';
import Toast from '../components/ui/Toast';
import TransactionList from '../components/dashboard/TransactionList';
import MyServicesList from '../components/dashboard/MyServicesList';
import ReviewsList from '../components/dashboard/ReviewsList';
import DisputesList from '../components/dashboard/DisputesList';
import ReviewModal from '../components/dashboard/ReviewModal';
import DisputeModal from '../components/dashboard/DisputeModal';

export default function Dashboard() {
  const {
    user,
    activeTab,
    setActiveTab,
    loading,
    transactions,
    myServices,
    reviews,
    disputes,
    pendingAsProvider,
    pendingAsRequester,
    deletingServiceId,
    updateTransactionStatus,
    deleteService,
    addReview,
    addDispute
  } = useDashboardData();

  const [reviewTx, setReviewTx] = useState(null);
  const [disputeTx, setDisputeTx] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Dedicated notice modal state
  const [noticeState, setNoticeState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    primaryActionText: 'Got it',
    onPrimaryAction: null,
    secondaryActionText: null,
    onSecondaryAction: null
  });

  const closeNotice = () => {
    setNoticeState(prev => ({ ...prev, isOpen: false }));
  };

  const handleStatusAction = async (transactionId, newStatus) => {
    const result = await updateTransactionStatus(transactionId, newStatus);
    if (!result.success) {
      setNoticeState({
        isOpen: true,
        type: 'warning',
        title: 'Action Failed',
        message: result.error || 'Failed to update transaction status',
        primaryActionText: 'Close',
        onPrimaryAction: null,
        secondaryActionText: null
      });
      return;
    }

    if (result.isDualCompleted) {
      // Both parties have confirmed - prompt for review immediately
      setNoticeState({
        isOpen: true,
        type: 'complete',
        title: 'Exchange Completed & Settled! 🎉',
        message: 'Both parties have confirmed completion and the time credits have been transferred. Would you like to leave a review now?',
        primaryActionText: 'Leave a Review ⭐',
        onPrimaryAction: () => {
          setReviewTx(result.transaction);
        },
        secondaryActionText: 'Maybe Later',
        onSecondaryAction: () => {
          setToastMessage({ text: 'Exchange completed successfully', type: 'success' });
        }
      });
    } else if (result.message) {
      // 1-sided confirmation waiting on the other party
      setNoticeState({
        isOpen: true,
        type: 'info',
        title: 'Marked Complete on Your Side',
        message: result.message,
        primaryActionText: 'Got it',
        onPrimaryAction: null,
        secondaryActionText: null
      });
    } else {
      setToastMessage({ text: 'Status updated successfully', type: 'success' });
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    const res = await deleteService(serviceToDelete);
    setServiceToDelete(null);
    if (res.success) {
      setToastMessage({ text: 'Service deleted successfully', type: 'success' });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  const tabs = [
    { id: 'transactions', label: 'Transactions', count: transactions.length },
    { id: 'my-services', label: 'My Services', count: myServices.length },
    { id: 'reviews', label: 'Reviews', count: reviews.length },
    { id: 'disputes', label: 'Disputes', count: disputes.length }
  ];

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="container">
        {/* Header Section */}
        <div className="page-header" style={{ borderBottom: 'none', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">
                Welcome back, {user?.first_name}! Available balance: <span className="text-primary font-bold">{user?.time_balance}h</span>
                {user?.held_balance > 0 && (
                  <span className="text-muted text-sm" style={{ marginLeft: '0.5rem' }}>
                    ({user.held_balance}h in escrow)
                  </span>
                )}
              </p>
            </div>
            <Link to="/services/new" className="btn btn-primary">Post a Service</Link>
          </div>
        </div>

        {/* Action Alerts */}
        {pendingAsProvider.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>⚠️</span>
            <div>
              <p className="font-medium">You have {pendingAsProvider.length} transaction(s) awaiting confirmation</p>
              <p className="text-sm" style={{ opacity: 0.9 }}>Review and confirm pending requests from other members</p>
            </div>
          </div>
        )}

        {pendingAsRequester.length > 0 && (
          <div className="alert alert-info" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>ℹ️</span>
            <div>
              <p className="font-medium">You have {pendingAsRequester.length} confirmed transaction(s) ready to complete</p>
              <p className="text-sm" style={{ opacity: 0.9 }}>Mark them as completed to exchange time credits</p>
            </div>
          </div>
        )}

        {/* Tabbed Main Card */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header" style={{ paddingBottom: '0' }}>
            <nav style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem' }} aria-label="Dashboard tabs">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
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
                      backgroundColor: isActive ? 'var(--color-primary, #3B82F6)' : 'transparent',
                      color: isActive ? 'white' : '#4B5563',
                    }}
                  >
                    {tab.label}
                    <span style={{
                      marginLeft: '0.5rem',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.75rem',
                      backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : '#E5E7EB',
                      color: isActive ? 'white' : '#1F2937',
                      borderRadius: '9999px'
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="card-body">
            {activeTab === 'transactions' && (
              <TransactionList
                transactions={transactions}
                userId={user?.id}
                onStatusUpdate={handleStatusAction}
                onOpenReview={setReviewTx}
                onOpenDispute={setDisputeTx}
              />
            )}

            {activeTab === 'my-services' && (
              <MyServicesList
                myServices={myServices}
                deletingServiceId={deletingServiceId}
                onDeleteService={(id) => setServiceToDelete(id)}
              />
            )}

            {activeTab === 'reviews' && (
              <ReviewsList reviews={reviews} />
            )}

            {activeTab === 'disputes' && (
              <DisputesList disputes={disputes} />
            )}
          </div>
        </div>

        {/* Modals & Dialogs */}
        <NoticeModal
          isOpen={noticeState.isOpen}
          onClose={closeNotice}
          type={noticeState.type}
          title={noticeState.title}
          message={noticeState.message}
          primaryActionText={noticeState.primaryActionText}
          onPrimaryAction={noticeState.onPrimaryAction}
          secondaryActionText={noticeState.secondaryActionText}
          onSecondaryAction={noticeState.onSecondaryAction}
        />

        <PromptConfirmModal
          isOpen={Boolean(serviceToDelete)}
          onClose={() => setServiceToDelete(null)}
          onConfirm={handleConfirmDeleteService}
          title="Delete Service"
          message="Are you sure you want to delete this service? This action cannot be undone."
          confirmText="Delete Service"
          isDanger={true}
          loading={Boolean(deletingServiceId)}
        />

        <ReviewModal
          tx={reviewTx}
          isOpen={Boolean(reviewTx)}
          onClose={() => setReviewTx(null)}
          onReviewSubmitted={(review) => {
            addReview(review);
            setToastMessage({ text: 'Review submitted successfully!', type: 'success' });
          }}
        />

        <DisputeModal
          tx={disputeTx}
          isOpen={Boolean(disputeTx)}
          onClose={() => setDisputeTx(null)}
          onDisputeSubmitted={(dispute, txId) => {
            addDispute(dispute, txId);
            setToastMessage({ text: 'Dispute submitted successfully', type: 'warning' });
          }}
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <Toast
            message={toastMessage.text}
            type={toastMessage.type}
            onClose={() => setToastMessage(null)}
          />
        )}
      </div>
    </div>
  );
}