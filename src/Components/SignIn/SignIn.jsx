import React from 'react';
import './SignIn.css';

const SignIn = () => {
  return (
    <section className="control-card sign-in" aria-labelledby="sign-in-title">
      <h2 className="sign-in-title" id="sign-in-title">
        Sign In
      </h2>
      <form className="sign-in-form">
        <div className="sign-in-field">
          <label className="sign-in-label" htmlFor="email">
            Email
          </label>
          <input
            autoComplete="email"
            className="form-input sign-in-input"
            id="email"
            name="email"
            required
            type="email"
          />
        </div>
        <div className="sign-in-field">
          <label className="sign-in-label" htmlFor="password">
            Password
          </label>
          <input
            autoComplete="current-password"
            className="form-input sign-in-input"
            id="password"
            name="password"
            required
            type="password"
          />
        </div>
        <button className="btn sign-in-button" type="submit">
          Sign In
        </button>
      </form>
    </section>
  );
};

export default SignIn;
