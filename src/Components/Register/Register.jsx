import React, { useRef, useState } from 'react';
import Logo, { DEFAULT_PROFILE_IMAGE } from '../Logo/Logo';
import './Register.css';

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const Register = ({ onRegister, onRouteChange }) => {
  const [profileImage, setProfileImage] = useState('');
  const [profileImageError, setProfileImageError] = useState('');
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const fileInputRef = useRef(null);
  const passwordsDoNotMatch = password !== confirmPassword;
  const showPasswordError = confirmPasswordTouched && passwordsDoNotMatch;

  const clearProfileImage = () => {
    setProfileImage('');
    setProfileImageError('');
    setIsReadingImage(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      clearProfileImage();
      return;
    }

    if (!SUPPORTED_PROFILE_IMAGE_TYPES.includes(file.type)) {
      clearProfileImage();
      setProfileImageError('Choose a JPG, PNG, WebP, or GIF image. The default will be used instead.');
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      clearProfileImage();
      setProfileImageError('Choose an image smaller than 5 MB. The default will be used instead.');
      return;
    }

    setIsReadingImage(true);
    setProfileImageError('');

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(typeof reader.result === 'string' ? reader.result : '');
      setIsReadingImage(false);
    };
    reader.onerror = () => {
      clearProfileImage();
      setProfileImageError('That image could not be read. The default will be used instead.');
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (event) => {
    event.preventDefault();

    if (passwordsDoNotMatch) {
      setConfirmPasswordTouched(true);
      return;
    }

    onRegister(profileImage || DEFAULT_PROFILE_IMAGE);
  };

  return (
    <div className="register-page">
      <section className="control-card register" aria-labelledby="register-title">
        <h2 className="register-title" id="register-title">
          Register
        </h2>
        <form className="register-form" onSubmit={onSubmit}>
          <div className="register-upload">
            <Logo imageSrc={profileImage || DEFAULT_PROFILE_IMAGE} />
            <div className="register-upload-controls">
              <label className="register-label" htmlFor="profile-image">
                Profile image <span className="register-optional">(optional)</span>
              </label>
              <input
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="register-file-input"
                id="profile-image"
                name="profile-image"
                onChange={onProfileImageChange}
                ref={fileInputRef}
                type="file"
              />
              <p className="register-upload-hint">
                JPG, PNG, WebP, or GIF up to 5 MB. Leave blank to keep the default image.
              </p>
              {profileImageError ? (
                <p className="register-upload-error" role="status">
                  {profileImageError}
                </p>
              ) : null}
              {profileImage ? (
                <button className="register-remove-image" onClick={clearProfileImage} type="button">
                  Use default image
                </button>
              ) : null}
            </div>
          </div>
          <div className="register-field">
            <label className="register-label" htmlFor="name">
              Name
            </label>
            <input
              autoComplete="name"
              className="form-input register-input"
              id="name"
              name="name"
              required
              type="text"
            />
          </div>
          <div className="register-field">
            <label className="register-label" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="form-input register-input"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>
          <div className="register-field">
            <label className="register-label" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="new-password"
              className="form-input register-input"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          <div className="register-field">
            <label className="register-label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              aria-describedby={showPasswordError ? 'password-match-error' : undefined}
              aria-invalid={showPasswordError}
              autoComplete="new-password"
              className="form-input register-input"
              id="confirm-password"
              name="confirm-password"
              onBlur={() => setConfirmPasswordTouched(true)}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
            {showPasswordError ? (
              <p className="register-password-error" id="password-match-error" role="alert">
                Passwords do not match.
              </p>
            ) : null}
          </div>
          <div className="register-actions">
            <button
              className="btn register-button"
              disabled={isReadingImage}
              type="submit"
            >
              {isReadingImage ? 'Loading image…' : 'Register'}
            </button>
            <button
              className="btn register-button"
              type="button"
              onClick={() => onRouteChange('signin')}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Register;
