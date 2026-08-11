import { useRef, useState } from 'react';
import Logo from '../Logo/Logo';
import './ProfileImageEditor.css';

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const ProfileImageEditor = ({ hasCustomImage, imageSrc, onUpdate }) => {
  const [error, setError] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [status, setStatus] = useState('');
  const fileInputRef = useRef(null);

  const clearSelection = () => {
    setSelectedImage('');
    setSelectedName('');
    setIsReading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onImageChange = (event) => {
    const file = event.target.files?.[0];
    setError('');
    setStatus('');

    if (!file) {
      clearSelection();
      return;
    }

    if (!SUPPORTED_PROFILE_IMAGE_TYPES.includes(file.type)) {
      clearSelection();
      setError('Choose a JPG, PNG, WebP, or GIF image.');
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      clearSelection();
      setError('Choose an image smaller than 5 MB.');
      return;
    }

    setIsReading(true);
    setSelectedName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(typeof reader.result === 'string' ? reader.result : '');
      setIsReading(false);
    };
    reader.onerror = () => {
      clearSelection();
      setError('That image could not be read. Please choose another image.');
    };
    reader.readAsDataURL(file);
  };

  const saveImage = async () => {
    if (!selectedImage) {
      return;
    }

    setError('');
    setStatus('');
    setIsSaving(true);

    try {
      await onUpdate(selectedImage);
      clearSelection();
      setStatus('Profile picture updated.');
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Your profile picture could not be updated.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const useDefaultImage = async () => {
    setError('');
    setStatus('');
    setIsSaving(true);

    try {
      await onUpdate('');
      clearSelection();
      setStatus('The default profile picture is now being used.');
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Your profile picture could not be updated.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isBusy = isReading || isSaving;

  return (
    <div className="profile-image-editor">
      <Logo imageSrc={selectedImage || imageSrc} />
      <div className="profile-image-controls">
        <input
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="profile-image-input"
          disabled={isBusy}
          id="profile-image-update"
          onChange={onImageChange}
          ref={fileInputRef}
          type="file"
        />
        <label
          aria-disabled={isBusy}
          className={`btn profile-image-picker${isBusy ? ' is-disabled' : ''}`}
          htmlFor="profile-image-update"
        >
          {isReading ? 'Reading image…' : 'Change profile picture'}
        </label>
        <p className="profile-image-hint">JPG, PNG, WebP, or GIF up to 5 MB.</p>
        {selectedName ? <p className="profile-image-name">Selected: {selectedName}</p> : null}
        {selectedImage ? (
          <div className="profile-image-actions">
            <button className="btn" disabled={isSaving} onClick={saveImage} type="button">
              {isSaving ? 'Saving…' : 'Save picture'}
            </button>
            <button
              className="profile-image-text-button"
              disabled={isSaving}
              onClick={clearSelection}
              type="button"
            >
              Cancel
            </button>
          </div>
        ) : hasCustomImage ? (
          <button
            className="profile-image-text-button"
            disabled={isSaving}
            onClick={useDefaultImage}
            type="button"
          >
            {isSaving ? 'Updating…' : 'Use default image'}
          </button>
        ) : null}
        {error ? (
          <p className="profile-image-message is-error" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="profile-image-message is-success" role="status">
            {status}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default ProfileImageEditor;
