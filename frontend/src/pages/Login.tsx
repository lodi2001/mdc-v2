import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      // Redirect to dashboard (Dashboard component will handle role-based rendering)
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="login-body">
      {/* Header */}
      <header className="login-header">
        <div className="container-fluid px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="logo">
              <img src="/MDC-logo-Black.png" alt="MDC Logo" height="48" />
            </div>
            <div className="language-toggle">
              <button className="btn btn-sm btn-outline-secondary active" data-lang="en">
                EN
              </button>
              <button className="btn btn-sm btn-outline-secondary" data-lang="ar">
                AR
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="login-main">
        <div className="login-container">
          {/* Welcome Section */}
          <div className="welcome-section d-none d-lg-flex">
            <div className="welcome-content">
              <div className="welcome-logo mb-4">
                <img src="/MDC-logo-tran.png" alt="MDC Logo" height="80" />
              </div>
              <h1 className="welcome-title">Transaction Tracking System</h1>
              <p className="welcome-subtitle">
                Streamline your financial transactions with our comprehensive management platform
              </p>
              <div className="welcome-features mt-5">
                <div className="feature-item">
                  <i className="bi bi-shield-check"></i>
                  <span>Secure Access</span>
                </div>
                <div className="feature-item">
                  <i className="bi bi-graph-up"></i>
                  <span>Real-time Tracking</span>
                </div>
                <div className="feature-item">
                  <i className="bi bi-people"></i>
                  <span>Team Collaboration</span>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form Section */}
          <div className="login-form-section">
            <div className="login-form-container">
              <h2 className="form-title mb-2">Welcome Back</h2>
              <p className="form-subtitle text-muted mb-5">
                Please sign in to your account to continue
              </p>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-circle me-2"></i>
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <Link to="/forgot-password" className="text-decoration-none">
                    Forgot Password?
                  </Link>
                </div>

                <button type="submit" className="btn btn-primary w-100 submit-btn" disabled={loading}>
                  {loading ? (
                    <div className="spinner-border spinner-border-sm text-light" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    <span className="btn-text">Sign In</span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="divider my-4">
                <span className="divider-text">OR</span>
              </div>

              {/* Google Sign-in */}
              <button className="btn btn-outline-secondary w-100 google-signin-btn">
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="me-2"
                  width="18"
                />
                Sign in with Google
              </button>

              {/* Footer Links */}
              <div className="login-footer mt-5 pt-4 border-top">
                <p className="text-muted text-center mb-0">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-decoration-none">
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;