import React, { useState } from 'react';

const Login = ({ onLogin, onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Form submitted:', { 
      isRegistering, 
      username, 
      password,
      onLoginType: typeof onLogin,
      onRegisterType: typeof onRegister
    });

    try {
      if (isRegistering) {
        console.log('Attempting registration...');
        if (typeof onRegister === 'function') {
          await onRegister(username, password);
        } else {
          throw new Error('Registration function not available');
        }
      } else {
        console.log('Attempting login...');
        if (typeof onLogin === 'function') {
          await onLogin(username, password);
        } else {
          throw new Error('Login function not available');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
        <p className="form-subtitle">
          {isRegistering ? 'Register to start chatting' : 'Sign in to continue'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={isRegistering ? 'register-btn' : 'login-btn'}
          >
            {loading ? (
              <span className="loading-spinner">⏳</span>
            ) : isRegistering ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="auth-toggle">
          <div className="mode-indicator">
            {isRegistering ? '📝 Registration Mode' : '🔐 Login Mode'}
          </div>
          
          <p>
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <button 
              type="button" 
              className="link-button"
              onClick={() => {
                console.log('Toggling mode from', isRegistering, 'to', !isRegistering);
                setIsRegistering(!isRegistering);
                setError(''); // Clear error when switching modes
              }}
              disabled={loading}
            >
              {isRegistering ? 'Sign in instead' : 'Create one now'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;