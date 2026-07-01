import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetData, setResetData] = useState({ email: '', newPassword: '', confirmPassword: '' });
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPassword) {
      setFormData({ email: savedEmail, password: savedPassword });
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResetChange = (e) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(formData.email, formData.password);
    if (result.success) {
      // Handle Remember Me credentials saving
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
        localStorage.setItem('rememberedPassword', formData.password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    if (resetData.newPassword !== resetData.confirmPassword) {
      setResetError('Passwords do not match');
      setResetLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/auth/reset-password', {
        email: resetData.email,
        newPassword: resetData.newPassword
      });

      if (response.data.success) {
        setResetSuccess('Password reset successfully! You can now log in.');
        setResetData({ email: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setResetError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="row justify-content-center" style={{ minHeight: '80vh', alignItems: 'center' }}>
      <div className="col-md-6 col-lg-5 col-xl-4">
        {/* Logo / Brand */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, #7b61ff, rgba(123,97,255,0.5))',
              boxShadow: '0 8px 24px rgba(123,97,255,0.35)'
            }}
          >
            <i className="bi bi-shield-lock-fill" style={{ fontSize: '1.5rem', color: '#fff' }}></i>
          </div>
          <h2 style={{ color: '#f0f2f8', fontWeight: 700, fontSize: '1.65rem', marginBottom: '0.35rem' }}>
            {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'rgba(240,242,248,0.55)', fontSize: '0.9rem', margin: 0 }}>
            {isForgotPassword ? 'Recover your EduSec Labs account credentials' : 'Sign in to your EduSec Labs account'}
          </p>
        </div>

        {/* Card */}
        <div
          className="card"
          style={{
            background: 'rgba(18, 22, 34, 0.85)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 18,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(123,97,255,0.07)',
            animation: 'none'
          }}
        >
          <div className="card-body p-4">
            {isForgotPassword ? (
              // Reset Password Form
              <form onSubmit={handleResetSubmit}>
                {resetError && (
                  <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <span style={{ fontSize: '0.875rem' }}>{resetError}</span>
                  </div>
                )}

                {resetSuccess && (
                  <div className="alert alert-success d-flex align-items-center mb-3" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <span style={{ fontSize: '0.875rem' }}>{resetSuccess}</span>
                  </div>
                )}

                <div className="mb-3">
                  <label
                    htmlFor="reset-email"
                    className="form-label"
                    style={{ color: 'rgba(240,242,248,0.7)', fontSize: '0.85rem', fontWeight: 500 }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    id="reset-email"
                    name="email"
                    value={resetData.email}
                    onChange={handleResetChange}
                    required
                    placeholder="Enter your registered email"
                    style={{ fontSize: '0.95rem' }}
                    disabled={resetLoading}
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="reset-newPassword"
                    className="form-label"
                    style={{ color: 'rgba(240,242,248,0.7)', fontSize: '0.85rem', fontWeight: 500 }}
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    id="reset-newPassword"
                    name="newPassword"
                    value={resetData.newPassword}
                    onChange={handleResetChange}
                    required
                    placeholder="Min 6 characters"
                    style={{ fontSize: '0.95rem' }}
                    disabled={resetLoading}
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="reset-confirmPassword"
                    className="form-label"
                    style={{ color: 'rgba(240,242,248,0.7)', fontSize: '0.85rem', fontWeight: 500 }}
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    id="reset-confirmPassword"
                    name="confirmPassword"
                    value={resetData.confirmPassword}
                    onChange={handleResetChange}
                    required
                    placeholder="Repeat new password"
                    style={{ fontSize: '0.95rem' }}
                    disabled={resetLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 mb-3"
                  disabled={resetLoading}
                  style={{ borderRadius: 12, fontWeight: 600, letterSpacing: '0.02em', padding: '0.7rem' }}
                >
                  {resetLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-counterclockwise me-2"></i>
                      Reset Password
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    style={{ color: '#a490ff', fontSize: '0.875rem', fontWeight: 600 }}
                    onClick={() => {
                      setIsForgotPassword(false);
                      setFormData({ email: resetData.email, password: '' });
                    }}
                    disabled={resetLoading}
                  >
                    <i className="bi bi-arrow-left me-1"></i> Back to Login
                  </button>
                </div>
              </form>
            ) : (
              // Login Form
              <>
                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <span style={{ fontSize: '0.875rem' }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label
                      htmlFor="email"
                      className="form-label"
                      style={{ color: 'rgba(240,242,248,0.7)', fontSize: '0.85rem', fontWeight: 500 }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                      style={{ fontSize: '0.95rem' }}
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="password"
                      className="form-label"
                      style={{ color: 'rgba(240,242,248,0.7)', fontSize: '0.85rem', fontWeight: 500 }}
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter your password"
                      style={{ fontSize: '0.95rem' }}
                      disabled={loading}
                    />
                  </div>

                  {/* Remember Me & Forgot Password link */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                        disabled={loading}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="rememberMe"
                        style={{ color: 'rgba(240,242,248,0.7)', fontSize: '0.85rem', userSelect: 'none', cursor: 'pointer' }}
                      >
                        Remember Me
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none"
                      style={{ color: '#a490ff', fontSize: '0.85rem', fontWeight: 600 }}
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setResetError('');
                        setResetSuccess('');
                        setResetData({ email: formData.email, newPassword: '', confirmPassword: '' });
                      }}
                      disabled={loading}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading}
                    style={{ borderRadius: 12, fontWeight: 600, letterSpacing: '0.02em', padding: '0.7rem' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <span style={{ color: 'rgba(240,242,248,0.45)', fontSize: '0.875rem' }}>
                    Don't have an account?{' '}
                  </span>
                  <Link
                    to="/register"
                    style={{
                      color: '#a490ff',
                      fontWeight: 600,
                      textDecoration: 'none',
                      fontSize: '0.875rem'
                    }}
                  >
                    Create one here
                  </Link>
                </div>

                {/* Demo creds */}
                <div
                  className="mt-4 p-3"
                  style={{
                    background: 'rgba(123,97,255,0.08)',
                    border: '1px solid rgba(123,97,255,0.2)',
                    borderRadius: 10
                  }}
                >
                  <small>
                    <i className="bi bi-key me-1" style={{ color: '#a490ff' }}></i>
                    <strong style={{ color: 'rgba(240,242,248,0.85)' }}>Demo Credentials</strong>
                    <br />
                    <span style={{ color: 'rgba(240,242,248,0.6)' }}>
                      Email: demo@edusec.com
                      <br />
                      Password: demo123
                    </span>
                  </small>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

