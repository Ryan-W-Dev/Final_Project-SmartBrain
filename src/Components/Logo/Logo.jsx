import React from 'react';
import Tilt from 'react-parallax-tilt';
import './Logo.css';

export const DEFAULT_PROFILE_IMAGE =
  'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

const Logo = ({ imageSrc = DEFAULT_PROFILE_IMAGE }) => {
  return (
    <div className="logo-container">
      <Tilt className="logo-tilt">
        <div className="inner-element">
          <img
            className="logo-image"
            src={imageSrc}
            alt="Profile"
          />
        </div>
      </Tilt>
    </div>
  );
};

export default Logo;
