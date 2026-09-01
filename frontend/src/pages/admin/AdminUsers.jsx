import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import PromptConfirmModal from '../../components/ui/PromptConfirmModal';
import Toast from '../../components/ui/Toast';

const roleColors = { admin: 'badge-danger', user: 'badge-gray' };
const statusColors = { true: 'badge-success', false: 'badge-danger' };

const INSIGHT_OPTIONS = [
  { value: '', label: 'Browse all users' },
  { value: 'no_transactions', label: 'Never transacted (LEFT JOIN)' },
  { value: 'never_reviewed', label: 'Never reviewed (NOT IN subquery)' },
  { value: 'above_avg_balance', label: 'Above-average balance (subquery)' },
  { value: 'dual_role', label: 'Both provider & requester (EXISTS x2)' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', role: '', is_active: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [insightType, setInsightType] = useState('');
  const [insightResults, setInsightResults] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ ...filters, page: pagination.page, limit: pagination.limit });
      setUsers(res.data.users);
      setPagination(prev => ({ ...prev, ...res.data.pagination }));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters.search, filters.role, filters.is_active, pagination.page]);

  useEffect(() => {
    if (!insightType) {
      setInsightResults(null);
      return;
    }
    const fetchInsight = async () => {
      setInsightLoading(true);
      try {
        const res = await adminAPI.getUserInsight(insightType);
        setInsightResults(res.data);
      } catch (error) {
        console.error('Failed to load insight:', error);
        setInsightResults({ users: [], count: 0 });
      } finally {
        setInsightLoading(false);
      }
    };
    fetchInsight();
  }, [insightType]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  const [toastMessage, setToastMessage] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const handleSave = async (user) => {
    try {
      await adminAPI.updateUser(user.id, { role: user.role, is_active: user.is_active, time_balance: user.time_balance });
      setEditingUser(null);
      setToastMessage({ text: 'User updated successfully', type: 'success' });
      fetchUsers();
    } catch (error) {
      setToastMessage({ text: error.response?.data?.error || 'Failed to update user', type: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await adminAPI.deleteUser(userToDelete);
      setUserToDelete(null);
      setToastMessage({ text: 'User deleted successfully', type: 'success' });
      fetchUsers();
    } catch (error) {
      setToastMessage({ text: error.response?.data?.error || 'Failed to delete user', type: 'error' });
    }
  };

  return (
    <div className="py-8">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage platform users and their accounts</p>
        </div>

        <div className="card mb-6">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">Search users</label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={filters.role}
                onChange={e => handleFilterChange('role', e.target.value)}
                className="w-full lg:w-40"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <select
                value={filters.is_active}
                onChange={e => handleFilterChange('is_active', e.target.value)}
                className="w-full lg:w-40"
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <select
                value={insightType}
                onChange={e => setInsightType(e.target.value)}
                className="w-full lg:w-64"
              >
                {INSIGHT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {insightType ? (
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold">
                {INSIGHT_OPTIONS.find(o => o.value === insightType)?.label}
                {insightResults && <span className="text-gray-500 font-normal"> — {insightResults.count} user{insightResults.count === 1 ? '' : 's'}</span>}
              </h3>
              <button onClick={() => setInsightType('')} className="btn btn-outline btn-sm">Back to all users</button>
            </div>
            <div className="card-body p-0">
              {insightLoading ? (
                <div className="p-6 text-center text-gray-500">Loading...</div>
              ) : !insightResults?.users?.length ? (
                <div className="p-6 text-center text-gray-500">No users match this query</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        {insightResults.users[0].time_balance !== undefined && <th>Balance</th>}
                        <th>Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insightResults.users.map(u => (
                        <tr key={u.id}>
                          <td className="font-medium">{u.first_name} {u.last_name}</td>
                          <td className="text-sm">{u.email}</td>
                          {u.time_balance !== undefined && <td className="font-medium text-primary">{u.time_balance}h</td>}
                          <td><Link to={`/admin/users/${u.id}/report`} className="btn btn-outline btn-sm">View Report</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="card animate-pulse">
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="card">
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="font-medium">{user.first_name} {user.last_name}</td>
                        <td className="text-sm">{user.email}</td>
                        <td>
                          {editingUser?.id === user.id ? (
                            <select
                              value={editingUser.role}
                              onChange={e => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                              className="text-sm"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`badge ${roleColors[user.role]}`}>{user.role}</span>
                          )}
                        </td>
                        <td>
                          {editingUser?.id === user.id ? (
                            <input
                              type="number"
                              step="0.25"
                              value={editingUser.time_balance}
                              onChange={e => setEditingUser(prev => ({ ...prev, time_balance: parseFloat(e.target.value) || 0 }))}
                              className="w-24 text-sm"
                            />
                          ) : (
                            <span className="font-medium text-primary">{user.time_balance}h</span>
                          )}
                        </td>
                        <td>
                          {editingUser?.id === user.id ? (
                            <select
                              value={editingUser.is_active.toString()}
                              onChange={e => setEditingUser(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                              className="text-sm"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          ) : (
                            <span className={`badge ${statusColors[user.is_active.toString()]}`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            {editingUser?.id === user.id ? (
                              <>
                                <button onClick={() => handleSave(editingUser)} className="btn btn-primary btn-sm">Save</button>
                                <button onClick={() => setEditingUser(null)} className="btn btn-outline btn-sm">Cancel</button>
                              </>
                            ) : (
                              <>
                                <Link to={`/admin/users/${user.id}/report`} className="btn btn-outline btn-sm">Report</Link>
                                <button onClick={() => handleEdit(user)} className="btn btn-outline btn-sm">Edit</button>
                                <button onClick={() => setUserToDelete(user.id)} className="btn btn-outline btn-sm text-danger border-danger hover:bg-red-50">Delete</button>
                              </>
                            )}
                          </div>
                        </td>
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

        <PromptConfirmModal
          isOpen={Boolean(userToDelete)}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete User"
          message="Are you sure you want to delete this user? This will remove their account and services."
          confirmText="Delete User"
          isDanger={true}
        />

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