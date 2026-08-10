import React from 'react';
import './Register.css';

const Register = ({ onRouteChange }) => {
  return (
    <div className="register-page">
      <section className="control-card register" aria-labelledby="register-title">
        <h2 className="register-title" id="register-title">
          Register
        </h2>
        <form className="register-form">
          <div className="register-field">
            <label className="register-label" htmlFor="name">
              Name
            </label>
            <input
              autoComplete="name"
              className="form-input register-input"
              id="name"
              name="name"
              required
              type="text"
            />
          </div>
          <div className="register-field">
            <label className="register-label" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="form-input register-input"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>
          <div className="register-field">
            <label className="register-label" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="form-input register-input"
              id="password"
              name="password"
              required
              type="password"
            />
          </div>
          <div className="register-field">
            <label className="register-label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              autoComplete="current-password"
              className="form-input register-input"
              id="confirm-password"
              name="confirm-password"
              required
              type="password"
            />
          </div>
          <div className="register-actions">
            <button
              className="btn register-button"
              type="submit"
              onClick={() => onRouteChange('home')}
            >
              Register
            </button>
            <button
              className="btn register-button"
              type="button"
              onClick={() => onRouteChange('signin')}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Register;
