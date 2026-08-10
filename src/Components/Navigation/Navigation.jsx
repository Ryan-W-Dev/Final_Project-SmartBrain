import React from 'react';

const Navigation = ({ onRouteChange }) => {
  return (
    <nav className="navigation">
      <a className="btn" href="#" role="button" onClick={() => onRouteChange('signin')}>
        Sign Out
      </a>
    </nav>
  );
};

export default Navigation;
