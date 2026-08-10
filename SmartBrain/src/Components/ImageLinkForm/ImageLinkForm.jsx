import React from 'react';

const ImageLinkForm = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p className="text-md-center">
        {'This magic brain will detect faces in your pictures. Give it a try.'}
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          width: '100%',
          maxWidth: '720px',
        }}
      >
        <input style={{ flex: 1, minWidth: 0, padding: '10px 12px' }} type="text" />
        <button className="btn btn-primary btn-lg">Detect</button>
      </div>
    </div>
  );
};

export default ImageLinkForm;
