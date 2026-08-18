import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CreateService() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    type: 'offer',
    duration_hours: 1,
    location: '',
    is_remote: false,
    tags: ''
  });

  useEffect(() => {
    servicesAPI.getCategories().then(res => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    servicesAPI.getById(id).then(res => {
      const s = res.data.service;
      if (user && s.provider_id !== user.id) {
        navigate('/services');
        return;
      }
      setFormData({
        category_id: s.category_id,
        title: s.title,
        description: s.description,
        type: s.type,
        duration_hours: s.duration_hours,
        location: s.location || '',
        is_remote: Boolean(s.is_remote),
        tags: (s.tags || []).join(', ')
      });
      setLoading(false);
    }).catch(() => {
      setErrors({ submit: 'Failed to load service' });
      setLoading(false);
    });
  }, [id, isEditMode, navigate, user]);

  const validate = () => {
    const newErrors = {};
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.title.trim() || formData.title.length < 5) newErrors.title = 'Title must be at least 5 characters';
    if (!formData.description.trim() || formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    if (!formData.duration_hours || formData.duration_hours < 0.25) newErrors.duration_hours = 'Duration must be at least 0.25 hours';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (isEditMode) {
        await servicesAPI.update(id, { ...formData, duration_hours: parseFloat(formData.duration_hours), tags });
        navigate(`/services/${id}`);
      } else {
        await servicesAPI.create({ ...formData, duration_hours: parseFloat(formData.duration_hours), tags });
        navigate('/dashboard');
      }
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} service` });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <div className="container">
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="container" style={{ maxWidth: '48rem', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>
            {isEditMode ? 'Edit Service' : 'Post a New Service'}
          </h1>
          <p style={{ color: '#6B7280', marginTop: '0.25rem' }}>
            {isEditMode ? 'Update the details of your listing' : 'Share your skills or request help from the community'}
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <div className="card-body">
            {errors.submit && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{errors.submit}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Type Selection */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>Service Type</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isEditMode ? 'not-allowed' : 'pointer', opacity: isEditMode && formData.type !== 'offer' ? 0.5 : 1 }}>
                    <input
                      type="radio"
                      name="type"
                      value="offer"
                      checked={formData.type === 'offer'}
                      onChange={handleChange}
                      disabled={isEditMode}
                      style={{ width: '1rem', height: '1rem', accentColor: '#3B82F6', cursor: isEditMode ? 'not-allowed' : 'pointer' }}
                    />
                    <span>I'm Offering a Service</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isEditMode ? 'not-allowed' : 'pointer', opacity: isEditMode && formData.type !== 'request' ? 0.5 : 1 }}>
                    <input
                      type="radio"
                      name="type"
                      value="request"
                      checked={formData.type === 'request'}
                      onChange={handleChange}
                      disabled={isEditMode}
                      style={{ width: '1rem', height: '1rem', accentColor: '#3B82F6', cursor: isEditMode ? 'not-allowed' : 'pointer' }}
                    />
                    <span>I'm Requesting a Service</span>
                  </label>
                </div>
                {isEditMode && <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>Type can't be changed after posting</p>}
              </div>

              {/* Category */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="category_id" style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Category <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', borderColor: errors.category_id ? '#EF4444' : '#D1D5DB' }}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className="error-message" style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.category_id}</p>}
              </div>

              {/* Title */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="title" style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Title <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', borderColor: errors.title ? '#EF4444' : '#D1D5DB' }}
                  placeholder="e.g., Math Tutoring - Algebra & Calculus"
                  maxLength={255}
                  required
                />
                {errors.title && <p className="error-message" style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="description" style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Description <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', borderColor: errors.description ? '#EF4444' : '#D1D5DB' }}
                  placeholder="Describe what you're offering or looking for. Include details about your experience, what's included, any requirements, etc."
                  rows={6}
                  required
                />
                {errors.description && <p className="error-message" style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.description}</p>}
              </div>

              {/* Duration and Location Grid */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                  <label htmlFor="duration_hours" style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Duration (hours) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    id="duration_hours"
                    name="duration_hours"
                    step="0.25"
                    min="0.25"
                    max="100"
                    value={formData.duration_hours}
                    onChange={handleChange}
                    style={{ width: '100%', boxSizing: 'border-box', borderColor: errors.duration_hours ? '#EF4444' : '#D1D5DB' }}
                    required
                  />
                  {errors.duration_hours && <p className="error-message" style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.duration_hours}</p>}
                </div>

                <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                  <label htmlFor="location" style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Location (optional)
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g., Downtown Library, Zoom"
                  />
                </div>
              </div>

              {/* Remote Checkbox */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500', color: '#374151' }}>
                  <input
                    type="checkbox"
                    name="is_remote"
                    checked={formData.is_remote}
                    onChange={handleChange}
                    style={{ width: '1.25rem', height: '1.25rem', accentColor: '#3B82F6', cursor: 'pointer', borderRadius: '0.25rem' }}
                  />
                  <span>Available remotely (video call, phone, etc.)</span>
                </label>
              </div>

              {/* Tags */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="tags" style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="e.g., math, algebra, homework-help, tutoring"
                />
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>Add relevant tags to help others find your service</p>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #F3F4F6', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : 'Post Service')}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => navigate(isEditMode ? `/services/${id}` : '/services')}>
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}