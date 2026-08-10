import React from 'react';

const Navigation = ({ onRouteChange, isSignedIn }) => {
  if (isSignedIn) {
    return (
      <nav className="navigation">
        <a className="btn" href="#" role="button" onClick={() => onRouteChange('signin')}>
          Sign Out
        </a>
      </nav>
    );
  } else {
    return (
      <nav className="navigation">
        <a className="btn" href="#" role="button" onClick={() => onRouteChange('signin')}>
          Sign In
        </a>
        <a className="btn" href="#" role="button" onClick={() => onRouteChange('register')}>
          Register
        </a>
      </nav>
    );
  }
};

export default Navigation;
