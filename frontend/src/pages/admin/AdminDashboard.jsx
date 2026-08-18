import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentDisputes, setRecentDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminAPI.getDashboard();
        setStats(res.data.stats);
        setRecentUsers(res.data.recentUsers);
        setRecentTransactions(res.data.recentTransactions);
        setRecentDisputes(res.data.recentDisputes);
      } catch (error) {
        console.error('Failed to load admin dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: '👥', color: 'text-primary' },
    { label: 'Active Services', value: stats?.active_services || 0, icon: '🔧', color: 'text-success' },
    { label: 'Total Transactions', value: stats?.total_transactions || 0, icon: '🔄', color: 'text-warning' },
    { label: 'Completed', value: stats?.completed_transactions || 0, icon: '✅', color: 'text-success' },
    { label: 'Open Disputes', value: stats?.open_disputes || 0, icon: '⚠️', color: 'text-danger' },
    { label: 'Hours Exchanged', value: stats?.total_hours_exchanged || 0, icon: '⏱️', color: 'text-primary' },
  ];

  if (loading) {
    return (
      <div className="py-8">
        <div className="container">
          <div className="grid grid-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Overview of platform activity and statistics</p>
        </div>

        <div className="grid grid-3 gap-6 mb-8">
          {statCards.map((stat, i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold {stat.color}">{stat.value}</p>
                </div>
                <span className="text-4xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-3 gap-6">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold">Recent Users</h3>
              <Link to="/admin/users" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="card-body p-0">
              {recentUsers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No users yet</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map(user => (
                        <tr key={user.id}>
                          <td className="font-medium">{user.first_name} {user.last_name}</td>
                          <td className="text-sm">{user.email}</td>
                          <td><span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-gray'}`}>{user.role}</span></td>
                          <td className="font-medium text-primary">{user.time_balance}h</td>
                          <td><span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                          <td className="text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold">Recent Transactions</h3>
              <Link to="/admin/transactions" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="card-body p-0">
              {recentTransactions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No transactions yet</div>
              ) : (
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
                      {recentTransactions.map(tx => (
                        <tr key={tx.id}>
                          <td className="font-medium">{tx.service_title}</td>
                          <td className="text-sm">{tx.requester_first} {tx.requester_last}</td>
                          <td className="text-sm">{tx.provider_first} {tx.provider_last}</td>
                          <td className="font-medium">{tx.hours_exchanged}h</td>
                          <td><span className={`badge ${{
                            pending: 'badge-warning',
                            confirmed: 'badge-primary',
                            completed: 'badge-success',
                            cancelled: 'badge-gray',
                            disputed: 'badge-danger'
                          }[tx.status]}`}>{tx.status}</span></td>
                          <td className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold">Recent Disputes</h3>
              <Link to="/admin/disputes" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="card-body p-0">
              {recentDisputes.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No disputes</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Raised By</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDisputes.map(dispute => (
                        <tr key={dispute.id}>
                          <td className="font-medium">{dispute.service_title}</td>
                          <td className="text-sm">{dispute.raised_first} {dispute.raised_last}</td>
                          <td><span className={`badge ${{
                            open: 'badge-warning',
                            under_review: 'badge-primary',
                            resolved: 'badge-success',
                            rejected: 'badge-gray'
                          }[dispute.status]}`}>{dispute.status.replace('_', ' ')}</span></td>
                          <td className="text-sm text-gray-500">{new Date(dispute.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}