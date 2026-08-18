import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect, Fragment } from 'react';

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'user' | 'admin' | null
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => (prev === name ? null : name));
  };

  const closeDropdowns = () => setActiveDropdown(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdowns();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    closeDropdowns();
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: '/services', label: 'Browse Services' },
    { path: '/dashboard', label: 'Dashboard', auth: true },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/services', label: 'Services' },
    { path: '/admin/transactions', label: 'Transactions' },
    { path: '/admin/disputes', label: 'Disputes' },
  ];

  const userMenuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Profile', path: '/profile', icon: '👤' },
    { label: 'Post a Service', path: '/services/new', icon: '➕' },
    { type: 'divider' },
    { label: `Balance: ${user?.time_balance}h`, type: 'balance' },
    ...(user?.role === 'admin' ? [
      { type: 'divider' },
      ...adminLinks.map(link => ({ label: link.label, path: link.path, icon: '🛠️' })),
    ] : []),
    { type: 'divider' },
    { label: 'Logout', type: 'logout', onClick: handleLogout, className: 'text-danger' },
  ];

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  return (
    <div className="layout">
      <header className="header" ref={dropdownRef}>
        <div className="container header-inner">
          <Link to="/" className="logo" aria-label="TimeBank Home">
            TimeBank
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Main navigation">
            <ul className="nav-list">
              {navLinks.map(link => (
                !link.auth || isAuthenticated ? (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ) : null
              ))}
            </ul>
          </nav>

          {/* Desktop User Actions */}
          <div className="desktop-actions">
            {isAuthenticated ? (
              <div className="dropdown-container">
                <button
                  className={`user-menu-trigger ${activeDropdown === 'user' ? 'open' : ''}`}
                  onClick={() => toggleDropdown('user')}
                  aria-expanded={activeDropdown === 'user'}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <div className="avatar">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <span className="user-name">{user?.first_name}</span>
                  <span className="chevron">▾</span>
                </button>
                {activeDropdown === 'user' && (
                  <ul className="dropdown-menu dropdown-menu--user" role="menu">
                    {userMenuItems.map((item, idx) => (
                      <Fragment key={idx}>
                        {item.type === 'divider' ? (
                          <li className="dropdown-divider" role="separator" />
                        ) : item.type === 'balance' ? (
                          <li className="dropdown-balance" role="none">
                            <span>{item.label}</span>
                          </li>
                        ) : item.type === 'logout' ? (
                          <li role="none">
                            <button
                              className={`dropdown-item ${item.className || ''}`}
                              role="menuitem"
                              onClick={() => { item.onClick?.(); closeDropdowns(); }}
                            >
                              {item.icon && <span className="dropdown-icon">{item.icon}</span>}
                              {item.label}
                            </button>
                          </li>
                        ) : (
                          <li role="none">
                            <Link
                              to={item.path}
                              className="dropdown-item"
                              role="menuitem"
                              onClick={closeDropdowns}
                            >
                              {item.icon && <span className="dropdown-icon">{item.icon}</span>}
                              {item.label}
                            </Link>
                          </li>
                        )}
                      </Fragment>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-ghost">Login</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            <svg className="hamburger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="mobile-menu" role="navigation" aria-label="Mobile navigation">
            <div className="container">
              <ul className="mobile-nav-list">
                {navLinks.map(link => (
                  !link.auth || isAuthenticated ? (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ) : null
                ))}
                {user?.role === 'admin' && (
                  <li className="mobile-nav-section">
                    <span className="mobile-nav-section-title">Admin</span>
                    <ul className="mobile-nav-sublist">
                      {adminLinks.map(link => (
                        <li key={link.path}>
                          <Link
                            to={link.path}
                            className="mobile-nav-link"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
                <li className="mobile-nav-divider" />
                {isAuthenticated ? (
                  <>
                    <li>
                      <Link to="/services/new" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>
                        Post a Service
                      </Link>
                    </li>
                    <li>
                      <button className="btn btn-outline btn-block" onClick={handleLogout}>
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link to="/login" className="btn btn-outline btn-block" onClick={() => setMobileMenuOpen(false)}>
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link to="/register" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>
                        Sign Up
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3 className="footer-title">TimeBank</h3>
              <p className="footer-desc">Community Skill & Time Bank — Where time is the currency.</p>
            </div>
            <nav className="footer-nav" aria-label="Quick links">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/services">Browse Services</Link></li>
                <li><Link to="/services/new">Post a Service</Link></li>
                <li><Link to="/dashboard">Dashboard</Link></li>
              </ul>
            </nav>
            <nav className="footer-nav" aria-label="Support">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-links">
                <li><Link to="/profile">Account Settings</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Sign Up</Link></li>
              </ul>
            </nav>
            <nav className="footer-nav" aria-label="Community">
              <h4 className="footer-heading">Community</h4>
              <ul className="footer-links">
                <li><span className="footer-placeholder">Guidelines (coming soon)</span></li>
                <li><span className="footer-placeholder">Safety Tips (coming soon)</span></li>
                <li><span className="footer-placeholder">FAQ (coming soon)</span></li>
              </ul>
            </nav>
          </div>
          <div className="footer-bottom">
            &copy; 2025 Community Skill & Time Bank. Built with MERN + MySQL.
          </div>
        </div>
      </footer>
    </div>
  );
}