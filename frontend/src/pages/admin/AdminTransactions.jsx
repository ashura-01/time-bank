import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const statusColors = {
  pending: 'badge-warning',
  confirmed: 'badge-primary',
  completed: 'badge-success',
  cancelled: 'badge-gray',
  disputed: 'badge-danger'
};

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ status: '' });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getTransactions({ ...filters, page: pagination.page, limit: pagination.limit });
      setTransactions(res.data.transactions);
      setPagination(prev => ({ ...prev, ...res.data.pagination }));
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters.status, pagination.page]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div className="py-8">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Transaction Management</h1>
          <p className="page-subtitle">View and monitor all platform transactions</p>
        </div>

        <div className="card mb-6">
          <div className="card-body">
            <div className="flex gap-4">
              <select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                className="w-full lg:w-48"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card animate-pulse">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Requester</th>
                    <th>Provider</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <p className="text-gray-500">No transactions found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Requester</th>
                      <th>Provider</th>
                      <th>Hours</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id}>
                        <td className="font-medium">{tx.service_title}</td>
                        <td className="text-sm">{tx.requester_first} {tx.requester_last} ({tx.requester_email})</td>
                        <td className="text-sm">{tx.provider_first} {tx.provider_last} ({tx.provider_email})</td>
                        <td className="font-medium">{tx.hours_exchanged}h</td>
                        <td>
                          <span className={`badge ${statusColors[tx.status]}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="btn btn-outline btn-sm">Previous</button>
                <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="btn btn-outline btn-sm">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}