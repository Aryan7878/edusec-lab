import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const result = await register(formData.username, formData.email, formData.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const fields = [
    { id: 'username', label: 'Username', type: 'text', placeholder: 'Choose a username' },
    { id: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter your email' },
    { id: 'password', label: 'Password', type: 'password', placeholder: 'Create a password (min. 6 characters)' },
    { id: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Confirm your password' },
  ];

  return (
    <div className="row justify-content-center" style={{ minHeight: '80vh', alignItems: 'center' }}>
      <div className="col-md-6 col-lg-5 col-xl-4">
        {/* Brand */}
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
            Join EduSec Labs
          </h2>
          <p style={{ color: 'rgba(240,242,248,0.55)', fontSize: '0.9rem', margin: 0 }}>
            Create your free account to start learning
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
            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <span style={{ fontSize: '0.875rem' }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {fields.map(({ id, label, type, placeholder }, idx) => (
                <div key={id} className={idx < fields.length - 1 ? 'mb-3' : 'mb-4'}>
                  <label
                    htmlFor={id}
                    className="form-label"
                    style={{ color: 'rgba(240,242,248,0.7)', fontSize: '0.85rem', fontWeight: 500 }}
                  >
                    {label}
                  </label>
                  <input
                    type={type}
                    className="form-control form-control-lg"
                    id={id}
                    name={id}
                    value={formData[id]}
                    onChange={handleChange}
                    required
                    placeholder={placeholder}
                    style={{ fontSize: '0.95rem' }}
                  />
                </div>
              ))}

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100"
                disabled={loading}
                style={{ borderRadius: 12, fontWeight: 600, letterSpacing: '0.02em', padding: '0.7rem' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus-fill me-2"></i>
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <span style={{ color: 'rgba(240,242,248,0.45)', fontSize: '0.875rem' }}>
                Already have an account?{' '}
              </span>
              <Link
                to="/login"
                style={{
                  color: '#a490ff',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}
              >
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;