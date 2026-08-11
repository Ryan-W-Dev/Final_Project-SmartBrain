import React from 'react';

const Rank = ({ detectionCount = 0, name = 'User', rank = 1 }) => {
  return (
    <div>
      <div
        className="rank"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        {`${name}, your current rank is...`}
      </div>
      <div
        className="rank-2"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        {`#${rank}`}
      </div>
      <div className="rank-count">
        {`${detectionCount} successful ${detectionCount === 1 ? 'detection' : 'detections'}`}
      </div>
    </div>
  );
};

export default Rank;
