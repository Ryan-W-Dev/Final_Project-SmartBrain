import React from 'react';

const ImageLinkForm = () => {
  return (
    <div className="image-link-form">
      <p className="text-md-center image-link-copy">
        {'This magic brain will detect faces in your pictures. Give it a try.'}
      </p>
      <div className="image-link-box">
        <div className="image-link-row">
          <input className="image-link-input" type="text" />
          <button className="btn btn-primary btn-lg image-link-button">Detect</button>
        </div>
      </div>
    </div>
  );
};

export default ImageLinkForm;
