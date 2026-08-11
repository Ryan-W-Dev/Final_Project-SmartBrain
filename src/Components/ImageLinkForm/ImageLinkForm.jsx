import React, { useState } from 'react';

const ImageLinkForm = ({ error, isLoading, onFileSubmit, onInputChange, onButtonSubmit }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const onUploadSubmit = (event) => {
    event.preventDefault();
    onFileSubmit(selectedFile);
  };

  return (
    <div className="image-link-form">
      <p className="image-link-copy">
        {'This magic brain will detect people in your pictures. Give it a try.'}
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
        <div className="image-source-divider" aria-hidden="true">
          <span>or</span>
        </div>
        <form className="image-upload-form" onSubmit={onUploadSubmit}>
          <div className="image-upload-row">
            <label
              className={`btn image-upload-picker${isLoading ? ' is-disabled' : ''}`}
              htmlFor="detection-image-upload"
            >
              Choose photo
            </label>
            <input
              accept="image/*"
              aria-describedby="image-upload-hint"
              className="image-upload-input"
              disabled={isLoading}
              id="detection-image-upload"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              type="file"
            />
            <span className="image-upload-name">
              {selectedFile ? selectedFile.name : 'No image selected'}
            </span>
            <button
              className="btn image-upload-submit"
              disabled={isLoading || !selectedFile}
              type="submit"
            >
              {isLoading ? 'Detecting…' : 'Detect photo'}
            </button>
          </div>
          <p className="image-link-hint" id="image-upload-hint">
            On iPhone or Android, choose an image from your photo library. On desktop, select one
            from your files. Maximum size: 10 MB.
          </p>
        </form>
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
