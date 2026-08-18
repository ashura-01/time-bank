import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { servicesAPI, transactionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingTransaction, setCreatingTransaction] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [transactionData, setTransactionData] = useState({
    hours_exchanged: 1,
    scheduled_at: '',
    location: '',
    is_remote: false
  });

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await servicesAPI.getById(id);
        setService(response.data.service);
      } catch (err) {
        setError('Service not found');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (service.provider_id === user.id) {
      alert('You cannot transact with your own service');
      return;
    }

    setCreatingTransaction(true);
    try {
      await transactionsAPI.create({
        service_id: id,
        ...transactionData
      });
      alert('Transaction requested! The provider will need to confirm.');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create transaction');
    } finally {
      setCreatingTransaction(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this service? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await servicesAPI.delete(id);
      navigate('/services');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete service');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16">
        <div className="container">
          <div className="card animate-pulse">
            <div className="h-64 bg-gray-200"></div>
            <div className="p-6 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="py-16">
        <div className="container text-center">
          <div className="empty-state">
            <h3 className="text-lg font-medium">Service not found</h3>
            <Link to="/services" className="btn btn-primary mt-4 inline-block">Browse Services</Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwnService = user && service.provider_id === user.id;
  const isOffer = service.type === 'offer';

  return (
    <div className="py-8">
      <div className="container">
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            <li><Link to="/services" className="hover:text-primary">Services</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium truncate max-w-xs">{service.title}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="h-64 bg-gray-100 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl"
                     style={{ backgroundColor: service.category_color + '20', color: service.category_color }}>
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`badge ${isOffer ? 'badge-primary' : 'badge-warning'}`}>
                    {isOffer ? 'Offer' : 'Request'}
                  </span>
                  <span className="badge badge-gray"
                        style={{ backgroundColor: service.category_color + '20', color: service.category_color }}>
                    {service.category_name}
                  </span>
                  {service.is_remote && (
                    <span className="badge badge-gray">Remote Available</span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h1>

                <div className="prose text-gray-600 mb-6">
                  <p className="whitespace-pre-wrap">{service.description}</p>
                </div>

                <div className="grid grid-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold">{service.duration_hours} hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold">{service.location || 'To be arranged'}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-semibold mb-3">About the Provider</h3>
                  <div className="flex items-center gap-4">
                    <div className="avatar avatar-lg" style={{ backgroundColor: service.category_color }}>
                      {service.first_name[0]}{service.last_name[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{service.first_name} {service.last_name}</p>
                      <p className="text-sm text-gray-500">Member since {new Date(service.created_at).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">Time Balance: <span className="text-primary font-medium">{service.provider_balance}h</span></p>
                    </div>
                  </div>
                </div>

                {service.tags && service.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {service.tags.map(tag => (
                        <span key={tag} className="badge badge-gray">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="card sticky top-24">
              <div className="card-body">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-primary mb-1">{service.duration_hours}h</div>
                  <div className="text-gray-500">per session</div>
                </div>

                {isOwnService ? (
                  <div className="space-y-3">
                    <span className="badge badge-gray w-full text-center py-3">Your Service</span>
                    <Link to={`/services/${service.id}/edit`} className="btn btn-outline w-full">Edit Service</Link>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="btn btn-outline w-full text-danger border-danger hover:bg-red-50"
                    >
                      {deleting ? 'Deleting...' : 'Delete Service'}
                    </button>
                  </div>
                ) : isAuthenticated ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="hours" className="label">Hours to Exchange</label>
                      <input
                        type="number"
                        id="hours"
                        name="hours"
                        step="0.25"
                        min="0.25"
                        max={isOffer ? user.time_balance : 100}
                        value={transactionData.hours_exchanged}
                        onChange={e => setTransactionData(prev => ({ ...prev, hours_exchanged: parseFloat(e.target.value) || 0 }))}
                        className="w-full"
                        required
                      />
                      {isOffer && (
                        <p className="text-sm text-gray-500 mt-1">Your balance: {user.time_balance}h</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="scheduled_at" className="label">Preferred Date & Time (optional)</label>
                      <input
                        type="datetime-local"
                        id="scheduled_at"
                        name="scheduled_at"
                        value={transactionData.scheduled_at}
                        onChange={e => setTransactionData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="location" className="label">Location (optional)</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={transactionData.location}
                        onChange={e => setTransactionData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder={service.location || 'Enter location'}
                        className="w-full"
                      />
                    </div>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={transactionData.is_remote}
                        onChange={e => setTransactionData(prev => ({ ...prev, is_remote: e.target.checked }))}
                        className="w-4 h-4 text-primary rounded border-gray-300"
                      />
                      <span className="text-sm">Remote session</span>
                    </label>

                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                      disabled={creatingTransaction}
                    >
                      {creatingTransaction ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="spinner"></div>
                          Requesting...
                        </span>
                      ) : (
                        `Request ${isOffer ? 'Service' : 'Fulfillment'}`
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 mb-4">Sign in to request this service</p>
                    <Link to="/login" className="btn btn-primary w-full mb-2">Login</Link>
                    <Link to="/register" className="btn btn-outline w-full">Create Account</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}