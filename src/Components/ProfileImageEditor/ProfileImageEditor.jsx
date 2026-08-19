import { useCallback, useEffect, useRef, useState } from 'react';
import Logo, { DEFAULT_PROFILE_IMAGE } from '../Logo/Logo';
import './ProfileImageEditor.css';

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const ProfileImageEditor = ({ imageSrc, onUpdate }) => {
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [status, setStatus] = useState('');
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const clearPendingChange = useCallback(() => {
    setPendingAction('');
    setSelectedImage('');
    setIsReading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const closeMenu = useCallback(() => {
    if (isSaving) {
      return;
    }

    clearPendingChange();
    setError('');
    setIsMenuOpen(false);
  }, [clearPendingChange, isSaving]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const onPointerDown = (event) => {
      if (!editorRef.current?.contains(event.target)) {
        closeMenu();
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeMenu, isMenuOpen]);

  const toggleMenu = () => {
    if (isSaving) {
      return;
    }

    if (isMenuOpen) {
      closeMenu();
      return;
    }

    setError('');
    setStatus('');
    setIsMenuOpen(true);
  };

  const onImageChange = (event) => {
    const file = event.target.files?.[0];
    setError('');
    setStatus('');

    if (!file) {
      clearPendingChange();
      return;
    }

    if (!SUPPORTED_PROFILE_IMAGE_TYPES.includes(file.type)) {
      clearPendingChange();
      setError('Choose a JPG, PNG, WebP, or GIF image.');
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      clearPendingChange();
      setError('Choose an image smaller than 5 MB.');
      return;
    }

    setIsReading(true);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        clearPendingChange();
        setError('That image could not be read. Please choose another image.');
        return;
      }

      setSelectedImage(reader.result);
      setPendingAction('upload');
      setIsReading(false);
    };
    reader.onerror = () => {
      clearPendingChange();
      setError('That image could not be read. Please choose another image.');
    };
    reader.readAsDataURL(file);
  };

  const chooseDefaultImage = () => {
    setError('');
    setStatus('');
    setSelectedImage('');
    setPendingAction('default');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveImage = async () => {
    if (!pendingAction || (pendingAction === 'upload' && !selectedImage)) {
      return;
    }

    setError('');
    setStatus('');
    setIsSaving(true);

    try {
      await onUpdate(pendingAction === 'default' ? '' : selectedImage);
      const successMessage =
        pendingAction === 'default'
          ? 'The default profile picture is now being used.'
          : 'Profile picture updated.';

      clearPendingChange();
      setIsMenuOpen(false);
      setStatus(successMessage);
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

  const previewImage =
    pendingAction === 'default' ? DEFAULT_PROFILE_IMAGE : selectedImage || imageSrc;
  const isBusy = isReading || isSaving;

  return (
    <div className="profile-image-editor" ref={editorRef}>
      <div className={`profile-image-frame${isMenuOpen ? ' is-menu-open' : ''}`}>
        <Logo imageSrc={previewImage} />
        <button
          aria-controls="profile-image-menu"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-label="Change your profile picture"
          className="profile-image-toggle"
          disabled={isSaving}
          onClick={toggleMenu}
          type="button"
        >
          <span>Click image to change your profile picture</span>
        </button>

        {isMenuOpen ? (
          <div
            aria-label="Profile picture options"
            className="profile-image-menu"
            id="profile-image-menu"
            role="menu"
          >
            {!pendingAction ? (
              <>
                <button
                  className="profile-image-menu-link"
                  disabled={isBusy}
                  onClick={() => fileInputRef.current?.click()}
                  role="menuitem"
                  type="button"
                >
                  {isReading ? 'Reading image…' : 'Change profile image'}
                </button>
                <button
                  className="profile-image-menu-link"
                  disabled={isBusy}
                  onClick={chooseDefaultImage}
                  role="menuitem"
                  type="button"
                >
                  Use default image
                </button>
              </>
            ) : (
              <>
                <span className="profile-image-ready">
                  {pendingAction === 'default' ? 'Default image selected' : 'New image selected'}
                </span>
                <div className="profile-image-menu-actions">
                  <button
                    className="profile-image-save"
                    disabled={isSaving}
                    onClick={saveImage}
                    role="menuitem"
                    type="button"
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    className="profile-image-menu-link"
                    disabled={isSaving}
                    onClick={clearPendingChange}
                    role="menuitem"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="profile-image-input"
        disabled={isBusy}
        onChange={onImageChange}
        ref={fileInputRef}
        type="file"
      />

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
  );
};

export default ProfileImageEditor;
