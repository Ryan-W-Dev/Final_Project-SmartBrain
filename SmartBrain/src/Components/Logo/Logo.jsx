import React from 'react';
import Tilt from 'react-parallax-tilt';
import './Logo.css';

const Logo = () => {
  return (
    <div className="logo-container">
      <Tilt>
        <div className="inner-element">
          <img
            className="logo-image"
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="logo"
          />
        </div>
      </Tilt>
    </div>
  );
};

export default Logo;
