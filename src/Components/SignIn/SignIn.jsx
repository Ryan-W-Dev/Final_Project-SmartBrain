import React, { useState } from 'react';
import './SignIn.css';

const SignIn = ({ authError, isLoading, onRouteChange, onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();
    onSignIn({ email, password });
  };

  return (
    <div className="sign-in-page">
      <section className="control-card sign-in" aria-labelledby="sign-in-title">
        <h2 className="sign-in-title" id="sign-in-title">
          Sign In
        </h2>
        <form className="sign-in-form" onSubmit={onSubmit}>
          <div className="sign-in-field">
            <label className="sign-in-label" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="form-input sign-in-input"
              disabled={isLoading}
              id="email"
              maxLength={320}
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div className="sign-in-field">
            <label className="sign-in-label" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="form-input sign-in-input"
              disabled={isLoading}
              id="password"
              maxLength={128}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          {authError ? (
            <p className="sign-in-error" role="alert">
              {authError}
            </p>
          ) : null}
          <div className="sign-in-actions">
            <button className="btn sign-in-button" disabled={isLoading} type="submit">
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
            <button
              className="btn sign-in-button"
              disabled={isLoading}
              type="button"
              onClick={() => onRouteChange('register')}
            >
              Register
            </button>
          </div>
          <button
            className="sign-in-reset-password"
            disabled={isLoading}
            onClick={() => onRouteChange('forgot-password')}
            type="button"
          >
            Forgot your password? Reset password
          </button>
        </form>
      </section>
    </div>
  );
};

export default SignIn;
