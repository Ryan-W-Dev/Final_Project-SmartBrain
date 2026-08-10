import React from 'react';

const Rank = () => {
  return (
    <div>
      <div
        className="rank"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        {'Ryan, your current rank is...'}
      </div>
      <div
        className="rank-2"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        {'#5'}
      </div>
    </div>
  );
};

export default Rank;
