import React from 'react';

const Navigation = () => {
  return (
    <nav className="navigation" style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <p>
        <a className="btn btn-primary btn-sm" href="#" role="button">
          Sign Out
        </a>
      </p>
    </nav>
  );
};

export default Navigation;
