import { useState, useEffect } from 'react';
import { transactionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile, changePassword, refetch } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    const fetchLedger = async () => {
      setLedgerLoading(true);
      try {
        const res = await transactionsAPI.getLedger({ limit: 20 });
        setLedger(res.data.entries);
      } catch (error) {
        console.error('Failed to load ledger:', error);
      } finally {
        setLedgerLoading(false);
      }
    };
    fetchLedger();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');
    setLoading(true);
    try {
      await updateProfile(profileForm);
      refetch();
      setSuccess('Profile updated successfully');
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match' });
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setErrors({ new_password: 'Password must be at least 8 characters' });
      return;
    }
    setLoading(true);
    try {
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setSuccess('Password changed successfully');
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('current_') || name.startsWith('new_') || name === 'confirm_password') {
      setPasswordForm(prev => ({ ...prev, [name]: value }));
    } else {
      setProfileForm(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errors.submit) setErrors(prev => ({ ...prev, submit: '' }));
  };

  const formatBalance = (balance) => {
    return balance >= 0 ? `+${balance}h` : `${balance}h`;
  };

  return (
    <div className="py-8">
      <div className="container max-w-4xl">
        <div className="page-header">
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">Manage your account and view your time balance history</p>
        </div>

        <div className="card mb-8">
          <div className="card-header">
            <nav className="flex gap-1" aria-label="Profile tabs">
              {[
                { id: 'profile', label: 'Profile', icon: '👤' },
                { id: 'security', label: 'Security', icon: '🔒' },
                { id: 'ledger', label: 'Time Ledger', icon: '📊' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="card-body">
            {success && <div className="alert alert-success mb-6">{success}</div>}
            {errors.submit && <div className="alert alert-error mb-6">{errors.submit}</div>}

            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-2 gap-6">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={profileForm.first_name}
                      onChange={handleChange}
                      className={errors.first_name ? 'border-danger' : ''}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={profileForm.last_name}
                      onChange={handleChange}
                      className={errors.last_name ? 'border-danger' : ''}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={profileForm.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Your address for in-person services"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell others about yourself, your skills, experience..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="avatar_url">Avatar URL</label>
                  <input
                    type="url"
                    id="avatar_url"
                    name="avatar_url"
                    value={profileForm.avatar_url}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                <div className="form-group">
                  <label htmlFor="current_password">Current Password</label>
                  <input
                    type="password"
                    id="current_password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handleChange}
                    className={errors.current_password ? 'border-danger' : ''}
                    required
                  />
                  {errors.current_password && <p className="error-message">{errors.current_password}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="new_password">New Password</label>
                  <input
                    type="password"
                    id="new_password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handleChange}
                    className={errors.new_password ? 'border-danger' : ''}
                    minLength={8}
                    required
                  />
                  {errors.new_password && <p className="error-message">{errors.new_password}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirm_password">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    value={passwordForm.confirm_password}
                    onChange={handleChange}
                    className={errors.confirm_password ? 'border-danger' : ''}
                    required
                  />
                  {errors.confirm_password && <p className="error-message">{errors.confirm_password}</p>}
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'ledger' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <p className="text-3xl font-bold text-primary">{user.time_balance}h</p>
                  </div>
                </div>

                {ledgerLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="card animate-pulse p-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : ledger.length === 0 ? (
                  <div className="empty-state">
                    <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium">No ledger entries yet</h3>
                    <p className="text-gray-500 mt-1">Your time exchange history will appear here</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Hours</th>
                          <th>Balance After</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map(entry => (
                          <tr key={entry.id}>
                            <td className="text-sm text-gray-500">{new Date(entry.created_at).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${entry.entry_type === 'credit' ? 'badge-success' : 'badge-danger'}`}>
                                {entry.entry_type}
                              </span>
                            </td>
                            <td className="font-medium">
                              <span className={entry.entry_type === 'credit' ? 'text-success' : 'text-danger'}>
                                {formatBalance(entry.hours)}
                              </span>
                            </td>
                            <td className="font-medium">{entry.balance_after}h</td>
                            <td className="text-sm text-gray-600">{entry.description || '-'}</td>
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
      </div>
    </div>
  );
}