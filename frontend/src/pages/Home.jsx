import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { servicesAPI } from '../services/api';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, servicesRes] = await Promise.all([
          servicesAPI.getCategories(),
          servicesAPI.getAll({ limit: 6, sort: 'newest' })
        ]);
        setCategories(catsRes.data.categories);
        setFeaturedServices(servicesRes.data.services);
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Active Members', value: '1,234' },
    { label: 'Services Exchanged', value: '5,678' },
    { label: 'Hours Banked', value: '12,345h' },
    { label: 'Categories', value: '8+' },
  ];

  return (
    <div>
      {/* HERO */}
      <section 
        className="relative overflow-hidden bg-white"
        style={{ paddingTop: '6rem', paddingBottom: '6rem', background: 'linear-gradient(to bottom right, #EFF6FF, #FFFFFF, #ECFDF5)' }}
      >
        <div className="container relative text-center" style={{ padding: '0 1.5rem' }}>
          <span 
            className="inline-block text-sm font-semibold"
            style={{ marginBottom: '1.5rem', padding: '0.375rem 1rem', borderRadius: '9999px', backgroundColor: '#EFF6FF', color: '#3B82F6' }}
          >
            A time-based community marketplace
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight" style={{ marginBottom: '1.5rem' }}>
            Exchange Skills, <span style={{ color: '#3B82F6' }}>Not Money</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed" style={{ marginBottom: '2.5rem', maxWidth: '42rem', marginInline: 'auto' }}>
            Join a community where one hour of your time equals one hour of anyone else's.
            Share your skills, learn new ones, and build connections — all without spending a dime.
          </p>
          
          {/* Fixed Button Layout */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg shadow-lg">
              Get Started Free
            </Link>
            <Link to="/services" className="btn btn-outline btn-lg bg-white">
              Browse Services
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white border-b border-gray-100" style={{ paddingTop: '4rem', paddingBottom: '4rem', borderBottom: '1px solid #E5E7EB' }}>
        <div className="container">
          <div className="grid grid-4 gap-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="text-center p-6 bg-gray-50 rounded-lg border border-gray-100 transition-colors"
              >
                <div className="font-bold mb-1" style={{ fontSize: '2.25rem', color: '#3B82F6' }}>{stat.value}</div>
                <div className="text-sm font-medium uppercase tracking-wide" style={{ color: '#6B7280' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Service Categories</h2>
              <p className="mt-2" style={{ color: '#6B7280' }}>Find the help you need or share what you know</p>
            </div>
            <Link to="/services" className="btn btn-outline" style={{ display: 'inline-flex' }}>View All</Link>
          </div>

          {loading ? (
            <div className="grid grid-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card p-6" style={{ opacity: 0.5 }}>
                  <div style={{ height: '48px', width: '48px', backgroundColor: '#E5E7EB', borderRadius: '8px', margin: '0 auto 1rem auto' }}></div>
                  <div style={{ height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', width: '75%', margin: '0 auto' }}></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-4 gap-6">
              {categories.slice(0, 8).map(category => (
                <Link
                  key={category.id}
                  to={`/services?category=${category.id}`}
                  className="card p-6 text-center"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{ width: '56px', height: '56px', borderRadius: '12px', margin: '0 auto 1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: category.color + '1A', color: category.color }}
                  >
                    <svg style={{ width: '28px', height: '28px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm mt-2" style={{ color: '#6B7280' }}>{category.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* RECENT SERVICES */}
      <section className="bg-gray-50" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Recently Listed Services</h2>
              <p className="mt-2" style={{ color: '#6B7280' }}>Fresh opportunities to give and receive help</p>
            </div>
            <Link to="/services" className="btn btn-outline" style={{ display: 'inline-flex' }}>View All</Link>
          </div>

          {loading ? (
            <div className="grid grid-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card" style={{ opacity: 0.5 }}>
                  <div style={{ height: '192px', backgroundColor: '#E5E7EB' }}></div>
                  <div className="p-6">
                    <div style={{ height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', width: '75%', marginBottom: '12px' }}></div>
                    <div style={{ height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', width: '50%', marginBottom: '12px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredServices.length === 0 ? (
            <div className="empty-state bg-white rounded-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">No services yet</h3>
              <p className="mt-2">Be the first to post a service!</p>
              <Link to="/services/new" className="btn btn-primary mt-4">Post a Service</Link>
            </div>
          ) : (
            <div className="grid grid-3 gap-6">
              {featuredServices.map(service => (
                <article key={service.id} className="card overflow-hidden text-left">
                  <div style={{ height: '176px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div
                      style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: service.category_color + '1A', color: service.category_color }}
                    >
                      <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-6">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span className="badge badge-primary">{service.type === 'offer' ? 'Offer' : 'Request'}</span>
                      <span className="badge badge-gray" style={{ backgroundColor: service.category_color + '1A', color: service.category_color }}>
                        {service.category_name}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{service.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="avatar avatar-sm" style={{ backgroundColor: service.category_color }}>
                          {service.first_name[0]}{service.last_name[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{service.first_name} {service.last_name}</span>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: '#3B82F6' }}>{service.duration_hours}h</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden text-white" style={{ paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: '#3B82F6' }}>
        <div className="container relative text-center">
          <h2 className="font-bold mb-4" style={{ fontSize: '2.25rem' }}>Ready to Start Exchanging Time?</h2>
          <p className="text-lg mx-auto" style={{ color: '#DBEAFE', maxWidth: '42rem', marginBottom: '2rem' }}>
            Join thousands of members sharing skills and building community. Your first 5 hours are on us.
          </p>
          <Link to="/register" className="btn bg-white btn-lg" style={{ color: '#3B82F6', fontWeight: 'bold' }}>
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}