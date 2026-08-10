import React from 'react';

const ImageLinkForm = ({ onInputChange, onButtonSubmit }) => {
  return (
    <div className="image-link-form">
      <p className="image-link-copy">
        {'This magic brain will detect faces in your pictures. Give it a try.'}
      </p>
      <div className="image-link-box">
        <div className="image-link-row">
          <input className="image-link-input" type="text" onChange={onInputChange} />
          <button className="btn image-link-button" onClick={onButtonSubmit}>
            Detect
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageLinkForm;
