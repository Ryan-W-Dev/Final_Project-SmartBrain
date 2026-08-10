import React from 'react';

const ImageLinkForm = ({ error, isLoading, onInputChange, onButtonSubmit }) => {
  return (
    <div className="image-link-form">
      <p className="image-link-copy">
        {'This magic brain will detect faces in your pictures. Give it a try.'}
      </p>
      <div className="image-link-box">
        <form className="image-link-row" onSubmit={onButtonSubmit}>
          <input
            aria-label="Direct image URL"
            className="form-input image-link-input"
            disabled={isLoading}
            onChange={onInputChange}
            placeholder="https://example.com/photo.jpg"
            type="url"
          />
          <button className="btn image-link-button" disabled={isLoading} type="submit">
            {isLoading ? 'Detecting…' : 'Detect'}
          </button>
        </form>
        <p className="image-link-hint">
          Paste a direct JPG, PNG, GIF, or WebP image address—not a webpage address.
        </p>
        {error && (
          <p className="image-link-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageLinkForm;
