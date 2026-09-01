import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';

const statusColors = {
  active: 'badge-success',
  inactive: 'badge-gray',
  completed: 'badge-primary',
  cancelled: 'badge-danger'
};

const INSIGHT_OPTIONS = [
  { value: '', label: 'Browse all services' },
  { value: 'unused', label: 'Never requested (LEFT JOIN)' },
  { value: 'above_category_avg', label: 'Above category-avg duration (correlated subquery)' },
];

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [toastMessage, setToastMessage] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [insightType, setInsightType] = useState('');
  const [insightResults, setInsightResults] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getServices({ ...filters, page: pagination.page, limit: pagination.limit });
      setServices(res.data.services);
      setPagination(prev => ({ ...prev, ...res.data.pagination }));
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [filters.search, filters.status, pagination.page]);

  useEffect(() => {
    if (!insightType) {
      setInsightResults(null);
      return;
    }
    const fetchInsight = async () => {
      setInsightLoading(true);
      try {
        const res = await adminAPI.getServiceInsight(insightType);
        setInsightResults(res.data);
      } catch (error) {
        console.error('Failed to load insight:', error);
        setInsightResults({ services: [], count: 0 });
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

  const handleStatusChange = async (serviceId, status) => {
    try {
      await adminAPI.updateServiceStatus(serviceId, { status });
      setToastMessage({ text: 'Service status updated successfully', type: 'success' });
      fetchServices();
    } catch (error) {
      setToastMessage({ text: error.response?.data?.error || 'Failed to update service', type: 'error' });
    }
  };

  return (
    <div className="py-8">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Service Management</h1>
          <p className="page-subtitle">Moderate and manage all platform services</p>
        </div>

        <div className="card mb-6">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">Search services</label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by title or description..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                className="w-full lg:w-48"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
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
                {insightResults && <span className="text-gray-500 font-normal"> — {insightResults.count} service{insightResults.count === 1 ? '' : 's'}</span>}
              </h3>
              <button onClick={() => setInsightType('')} className="btn btn-outline btn-sm">Back to all services</button>
            </div>
            <div className="card-body p-0">
              {insightLoading ? (
                <div className="p-6 text-center text-gray-500">Loading...</div>
              ) : !insightResults?.services?.length ? (
                <div className="p-6 text-center text-gray-500">No services match this query</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        {insightType === 'unused' && <><th>Provider</th><th>Status</th></>}
                        {insightType === 'above_category_avg' && <><th>Duration</th><th>Category Avg</th></>}
                      </tr>
                    </thead>
                    <tbody>
                      {insightResults.services.map(s => (
                        <tr key={s.id}>
                          <td className="font-medium max-w-xs truncate">{s.title}</td>
                          <td className="text-sm">{s.category_name}</td>
                          {insightType === 'unused' && (
                            <>
                              <td className="text-sm">{s.first_name} {s.last_name}</td>
                              <td><span className={`badge ${statusColors[s.status]}`}>{s.status}</span></td>
                            </>
                          )}
                          {insightType === 'above_category_avg' && (
                            <>
                              <td className="font-medium">{s.duration_hours}h</td>
                              <td className="text-sm text-gray-500">{s.category_avg_hours}h avg</td>
                            </>
                          )}
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
                    <th>Title</th>
                    <th>Category</th>
                    <th>Provider</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : services.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <p className="text-gray-500">No services found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Provider</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(service => (
                      <tr key={service.id}>
                        <td className="font-medium max-w-xs truncate">{service.title}</td>
                        <td>
                          <span className="badge badge-gray" style={{ backgroundColor: service.category_color + '20', color: service.category_color }}>
                            {service.category_name}
                          </span>
                        </td>
                        <td className="text-sm">{service.first_name} {service.last_name} ({service.provider_email})</td>
                        <td>
                          <span className={`badge ${service.type === 'offer' ? 'badge-primary' : 'badge-warning'}`}>
                            {service.type}
                          </span>
                        </td>
                        <td>
                          <select
                            value={service.status}
                            onChange={e => handleStatusChange(service.id, e.target.value)}
                            className={`badge ${statusColors[service.status]} text-sm py-1 px-2`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="text-sm text-gray-500">{new Date(service.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="flex items-center gap-2">
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