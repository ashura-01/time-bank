import { useState, useEffect, useCallback } from 'react';
import { transactionsAPI, reviewsAPI, disputesAPI, servicesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useDashboardData() {
  const { user, refetch: refetchUser } = useAuth();
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingServiceId, setDeletingServiceId] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [txRes, reviewsRes, disputesRes, servicesRes] = await Promise.all([
        transactionsAPI.getAll({ limit: 20 }),
        reviewsAPI.getAll({ reviewee_id: user.id, limit: 10 }),
        disputesAPI.getAll({ limit: 10 }),
        servicesAPI.getAll({ provider_id: user.id, limit: 20 })
      ]);
      setTransactions(txRes.data.transactions || []);
      setReviews(reviewsRes.data.reviews || []);
      setDisputes(disputesRes.data.disputes || []);
      setMyServices(servicesRes.data.services || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateTransactionStatus = async (transactionId, newStatus) => {
    try {
      const res = await transactionsAPI.updateStatus(transactionId, { status: newStatus });
      const updatedTx = res.data.transaction;
      setTransactions(prev => prev.map(t => t.id === transactionId ? updatedTx : t));
      refetchUser();
      return {
        success: true,
        transaction: updatedTx,
        message: res.data.message,
        isDualCompleted: updatedTx?.status === 'completed'
      };
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to update transaction status';
      return { success: false, error: msg };
    }
  };

  const deleteService = async (serviceId) => {
    setDeletingServiceId(serviceId);
    try {
      await servicesAPI.delete(serviceId);
      setMyServices(prev => prev.filter(s => s.id !== serviceId));
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to delete service';
      return { success: false, error: msg };
    } finally {
      setDeletingServiceId(null);
    }
  };

  const addReview = (review) => {
    setReviews(prev => [review, ...prev]);
  };

  const addDispute = (dispute, transactionId) => {
    setDisputes(prev => [dispute, ...prev]);
    setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: 'disputed' } : t));
  };

  const myTransactions = transactions.filter(
    t => t.requester_id === user?.id || t.provider_id === user?.id
  );

  const pendingAsProvider = myTransactions.filter(
    t => t.provider_id === user?.id && t.status === 'pending'
  );

  const pendingAsRequester = myTransactions.filter(
    t => t.requester_id === user?.id && t.status === 'confirmed'
  );

  return {
    user,
    activeTab,
    setActiveTab,
    loading,
    transactions: myTransactions,
    myServices,
    reviews,
    disputes,
    pendingAsProvider,
    pendingAsRequester,
    deletingServiceId,
    updateTransactionStatus,
    deleteService,
    addReview,
    addDispute,
    refetch: fetchData
  };
}
