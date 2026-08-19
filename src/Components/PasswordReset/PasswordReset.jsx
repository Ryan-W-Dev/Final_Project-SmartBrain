import React, { useState } from 'react';
import './PasswordReset.css';

const genericRequestMessage =
  'If an account exists for that email, a password reset link has been sent.';

export const PasswordResetRequest = ({ onRouteChange }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [developmentResetUrl, setDevelopmentResetUrl] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setDevelopmentResetUrl('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'A password reset link could not be requested.');
      }

      setMessage(result.message || genericRequestMessage);
      setDevelopmentResetUrl(result.developmentResetUrl || '');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'A password reset link could not be requested.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-reset-page">
      <section className="control-card password-reset" aria-labelledby="password-reset-request-title">
        <h2 className="password-reset-title" id="password-reset-request-title">
          Reset Password
        </h2>
        <p className="password-reset-intro">
          Enter the email address for your account and we will send you a secure reset link.
        </p>
        <form className="password-reset-form" onSubmit={onSubmit}>
          <div className="password-reset-field">
            <label className="password-reset-label" htmlFor="reset-email">
              Email
            </label>
            <input
              autoComplete="email"
              className="form-input password-reset-input"
              disabled={isLoading}
              id="reset-email"
              maxLength={320}
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          {error ? (
            <p className="password-reset-error" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <div className="password-reset-success" role="status">
              <p>{message}</p>
              {developmentResetUrl ? (
                <p>
                  Email delivery is not configured locally.{' '}
                  <a href={developmentResetUrl} rel="noreferrer">
                    Open the local reset link
                  </a>
                  .
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="password-reset-actions">
            <button className="btn password-reset-button" disabled={isLoading} type="submit">
              {isLoading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <button
              className="btn password-reset-button"
              disabled={isLoading}
              onClick={() => onRouteChange('signin')}
              type="button"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export const PasswordReset = ({ onComplete, onRouteChange, token }) => {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const passwordsDoNotMatch = password !== confirmPassword;
  const showPasswordError = confirmPasswordTouched && passwordsDoNotMatch;

  const onSubmit = async (event) => {
    event.preventDefault();

    if (passwordsDoNotMatch) {
      setConfirmPasswordTouched(true);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmPassword, password, token }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Your password could not be reset.');
      }

      setMessage(result.message || 'Your password has been reset. You can now sign in.');
      setConfirmPassword('');
      setPassword('');
    } catch (resetError) {
      setError(
        resetError instanceof Error ? resetError.message : 'Your password could not be reset.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-reset-page">
      <section className="control-card password-reset" aria-labelledby="password-reset-title">
        <h2 className="password-reset-title" id="password-reset-title">
          Choose a New Password
        </h2>
        {message ? (
          <>
            <p className="password-reset-success" role="status">
              {message}
            </p>
            <div className="password-reset-actions">
              <button className="btn password-reset-button" onClick={onComplete} type="button">
                Sign In
              </button>
            </div>
          </>
        ) : (
          <form className="password-reset-form" onSubmit={onSubmit}>
            <div className="password-reset-field">
              <label className="password-reset-label" htmlFor="new-password">
                New Password
              </label>
              <input
                autoComplete="new-password"
                className="form-input password-reset-input"
                disabled={isLoading}
                id="new-password"
                maxLength={128}
                minLength={8}
                name="new-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            <div className="password-reset-field">
              <label className="password-reset-label" htmlFor="confirm-new-password">
                Confirm New Password
              </label>
              <input
                aria-describedby={showPasswordError ? 'reset-password-match-error' : undefined}
                aria-invalid={showPasswordError}
                autoComplete="new-password"
                className="form-input password-reset-input"
                disabled={isLoading}
                id="confirm-new-password"
                maxLength={128}
                minLength={8}
                name="confirm-new-password"
                onBlur={() => setConfirmPasswordTouched(true)}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
              {showPasswordError ? (
                <p
                  className="password-reset-error"
                  id="reset-password-match-error"
                  role="alert"
                >
                  Passwords do not match.
                </p>
              ) : null}
            </div>
            {error ? (
              <div className="password-reset-error" role="alert">
                <p>{error}</p>
                <button
                  className="password-reset-text-button"
                  onClick={() => onRouteChange('forgot-password')}
                  type="button"
                >
                  Request a new reset link
                </button>
              </div>
            ) : null}
            <div className="password-reset-actions">
              <button className="btn password-reset-button" disabled={isLoading} type="submit">
                {isLoading ? 'Saving…' : 'Save New Password'}
              </button>
              <button
                className="btn password-reset-button"
                disabled={isLoading}
                onClick={() => onRouteChange('signin')}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
