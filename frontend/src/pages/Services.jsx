import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { servicesAPI } from '../services/api';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    category_id: searchParams.get('category') || '',
    type: searchParams.get('type') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, servicesRes] = await Promise.all([
        servicesAPI.getCategories(),
        servicesAPI.getAll({
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        })
      ]);
      setCategories(catsRes.data.categories);
      setServices(servicesRes.data.services);
      setPagination(prev => ({ ...prev, ...servicesRes.data.pagination }));
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.category_id, filters.type, filters.search, filters.sort, pagination.page]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    handleFilterChange('search', formData.get('search'));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="container">
        
        {/* Header Section */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>Browse Services</h1>
            <p style={{ color: '#6B7280', marginTop: '0.25rem' }}>Find offers and requests from the community</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: '1 1 250px' }}>
                <label htmlFor="search" className="sr-only" style={{ display: 'none' }}>Search services</label>
                <input
                  type="text"
                  id="search"
                  name="search"
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  placeholder="Search services..."
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <select
                value={filters.category_id}
                onChange={e => handleFilterChange('category_id', e.target.value)}
                style={{ flex: '1 1 150px', boxSizing: 'border-box' }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select
                value={filters.type}
                onChange={e => handleFilterChange('type', e.target.value)}
                style={{ flex: '1 1 150px', boxSizing: 'border-box' }}
              >
                <option value="">All Types</option>
                <option value="offer">Offers</option>
                <option value="request">Requests</option>
              </select>
              <select
                value={filters.sort}
                onChange={e => handleFilterChange('sort', e.target.value)}
                style={{ flex: '1 1 150px', boxSizing: 'border-box' }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="duration">Duration</option>
                <option value="title">Title A-Z</option>
              </select>
            </form>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-3" style={{ gap: '1.5rem' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card" style={{ opacity: 0.5 }}>
                <div style={{ height: '192px', backgroundColor: '#E5E7EB' }}></div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', width: '75%', marginBottom: '12px' }}></div>
                  <div style={{ height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', width: '50%', marginBottom: '12px' }}></div>
                  <div style={{ height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', width: '33%' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <svg style={{ width: '64px', height: '64px', margin: '0 auto 1rem auto', color: '#D1D5DB' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>No services found</h3>
            <p style={{ marginTop: '0.25rem', color: '#6B7280' }}>Try adjusting your filters or search terms</p>
            <Link to="/services/new" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>Post a Service</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
              {services.map(service => (
                <article key={service.id} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ height: '192px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <span className="badge badge-primary" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                      {service.type === 'offer' ? 'Offer' : 'Request'}
                    </span>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', backgroundColor: service.category_color + '20', color: service.category_color }}>
                      <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <span className="badge badge-gray" style={{ marginBottom: '0.5rem', backgroundColor: service.category_color + '20', color: service.category_color }}>
                      {service.category_name}
                    </span>
                    <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {service.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {service.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="avatar avatar-sm" style={{ backgroundColor: service.category_color }}>
                          {service.first_name[0]}{service.last_name[0]}
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{service.first_name} {service.last_name}</span>
                      </div>
                      <Link to={`/services/${service.id}`} className="btn btn-primary btn-sm">
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination Section */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn btn-outline btn-sm"
                  style={{ opacity: pagination.page === 1 ? 0.5 : 1, cursor: pagination.page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: '#4B5563' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="btn btn-outline btn-sm"
                  style={{ opacity: pagination.page === pagination.pages ? 0.5 : 1, cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}