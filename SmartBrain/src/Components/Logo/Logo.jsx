import React from 'react';
import Tilt from 'react-parallax-tilt';

const Logo = () => {
  return (
    <div
      className="logo-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '150px',
        width: '150px',
        margin: '200px auto',
      }}
    >
      <Tilt>
        <div className="inner-element">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="logo" />
        </div>
      </Tilt>
    </div>
  );
};

export default Logo;
