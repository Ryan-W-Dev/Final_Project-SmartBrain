const Navigation = ({ onRouteChange, isSignedIn }) => {
  if (!isSignedIn) {
    return null;
  }

  return (
    <nav className="navigation">
      <button className="btn" type="button" onClick={() => onRouteChange('signout')}>
        Sign Out
      </button>
    </nav>
  );
};

export default Navigation;
