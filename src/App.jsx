import './App.css';
import React, { Component } from 'react';
import Navigation from './Components/Navigation/Navigation';
import { DEFAULT_PROFILE_IMAGE } from './Components/Logo/Logo';
import ImageLinkForm from './Components/ImageLinkForm/ImageLinkForm';
import Rank from './Components/Rank/Rank';
import ParticlesBg from 'particles-bg';
import { particleConfig } from './Components/ParticlesConfig/particlesConfig';
import FaceRecognition from './Components/FaceRecognition/FaceRecognition';
import SignIn from './Components/SignIn/SignIn';
import Register from './Components/Register/Register';
import ProfileImageEditor from './Components/ProfileImageEditor/ProfileImageEditor';

const MAX_DETECTION_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_DETECTION_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);
const IPHONE_IMAGE_TYPES = new Set(['image/heic', 'image/heif']);

const convertToJpeg = (file) =>
  new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const maxDimension = 2048;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('This image could not be prepared for detection.'));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(imageUrl);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('This image could not be prepared for detection.'));
          }
        },
        'image/jpeg',
        0.9
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('This image format is not supported. Choose a JPG, PNG, GIF, or WebP.'));
    };

    image.src = imageUrl;
  });

const authenticatedUserState = (user) => ({
  authError: '',
  detectionCount: user.detectionCount,
  isAuthLoading: false,
  isSessionLoading: false,
  isSignedIn: true,
  hasCustomProfileImage: Boolean(user.profileImageSrc),
  profileImageSrc: user.profileImageSrc || DEFAULT_PROFILE_IMAGE,
  rank: user.rank,
  route: 'home',
  userName: user.name,
});

class App extends Component {
  constructor() {
    super();
    this.state = {
      input: '',
      imageUrl: '',
      boxes: [],
      detections: [],
      error: '',
      isLoading: false,
      route: 'signin',
      isSignedIn: false,
      isAuthLoading: false,
      isSessionLoading: true,
      authError: '',
      hasCustomProfileImage: false,
      profileImageSrc: DEFAULT_PROFILE_IMAGE,
      userName: 'User',
      rank: 1,
      detectionCount: 0,
    };
  }

  createClarifaiBoundingBox = (pixelBox, imageWidth, imageHeight) => {
    return {
      left_col: pixelBox.xmin / imageWidth,
      top_row: pixelBox.ymin / imageHeight,
      right_col: pixelBox.xmax / imageWidth,
      bottom_row: pixelBox.ymax / imageHeight,
    };
  };

  calculateFaceLocation = (data) => {
    const personItems = data.filter((item) => item.label === 'person');
    const image = document.getElementById('inputimage');
    if (!image || !image.naturalWidth || !image.naturalHeight) {
      return [];
    }

    const originalWidth = Number(image.naturalWidth);
    const originalHeight = Number(image.naturalHeight);
    const width = Number(image.width);
    const height = Number(image.height);

    return personItems.map((person) => {
      const clarifaiFace = this.createClarifaiBoundingBox(
        person.box,
        originalWidth,
        originalHeight
      );
      return {
        leftCol: clarifaiFace.left_col * width,
        topRow: clarifaiFace.top_row * height,
        rightCol: width - clarifaiFace.right_col * width,
        bottomRow: height - clarifaiFace.bottom_row * height,
      };
    });
  };

  displayFaceBox = (boxes) => {
    this.setState({ boxes });
  };

  onImageLoad = () => {
    this.displayFaceBox(this.calculateFaceLocation(this.state.detections));
  };

  componentDidMount() {
    window.addEventListener('resize', this.onImageLoad);
    this.restoreSession();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onImageLoad);
  }

  restoreSession = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.user) {
        this.setState(authenticatedUserState(result.user));
        return;
      }

      this.setState({
        authError:
          response.status === 401 ? '' : result.error || 'Sign-in is temporarily unavailable.',
        isSessionLoading: false,
      });
    } catch {
      this.setState({
        authError: 'Sign-in is temporarily unavailable.',
        isSessionLoading: false,
      });
    }
  };

  readAuthResponse = async (response) => {
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.user) {
      throw new Error(result.error || 'The account request could not be completed.');
    }
    return result.user;
  };

  onRegister = async (registration) => {
    this.setState({ authError: '', isAuthLoading: true });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration),
      });
      const user = await this.readAuthResponse(response);
      this.setState(authenticatedUserState(user));
    } catch (error) {
      this.setState({
        authError: error instanceof Error ? error.message : 'Registration failed.',
        isAuthLoading: false,
      });
    }
  };

  onSignIn = async (credentials) => {
    this.setState({ authError: '', isAuthLoading: true });

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const user = await this.readAuthResponse(response);
      this.setState(authenticatedUserState(user));
    } catch (error) {
      this.setState({
        authError: error instanceof Error ? error.message : 'Sign-in failed.',
        isAuthLoading: false,
      });
    }
  };

  onSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      // Clear local account state even if the server is temporarily unavailable.
    } finally {
      this.setState({
        authError: '',
        boxes: [],
        detectionCount: 0,
        detections: [],
        imageUrl: '',
        isSignedIn: false,
        hasCustomProfileImage: false,
        profileImageSrc: DEFAULT_PROFILE_IMAGE,
        rank: 1,
        route: 'signin',
        userName: 'User',
      });
    }
  };

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.onSignOut();
      return;
    }

    this.setState({ authError: '', route });
  };

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  };

  onProfileImageUpdate = async (profileImageSrc) => {
    const response = await fetch('/api/auth/profile-image', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileImageSrc }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.user) {
      if (response.status === 401) {
        this.setState({
          authError: result.error || 'Your session has expired. Please sign in again.',
          isSignedIn: false,
          route: 'signin',
        });
      }

      throw new Error(result.error || 'Your profile image could not be updated.');
    }

    const hasCustomProfileImage = Boolean(result.user.profileImageSrc);
    this.setState({
      hasCustomProfileImage,
      profileImageSrc: hasCustomProfileImage
        ? result.user.profileImageSrc
        : DEFAULT_PROFILE_IMAGE,
    });
  };

  readDetectionResponse = async (response) => {
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(result.error || 'Image detection failed.');
      error.status = response.status;
      throw error;
    }
    if (!Array.isArray(result.predictions) || !result.user) {
      throw new Error('The detection service returned an unexpected response.');
    }

    return result;
  };

  applyDetectionResult = (result) => {
    this.setState({
      detectionCount: result.user.detectionCount,
      detections: result.predictions,
      imageUrl: result.imageUrl,
      isLoading: false,
      rank: result.user.rank,
    });
  };

  handleDetectionError = (error) => {
    if (error?.status === 401) {
      this.setState({
        authError: error.message,
        isLoading: false,
        isSignedIn: false,
        route: 'signin',
      });
      return;
    }

    this.setState({
      error: error instanceof Error ? error.message : 'Image detection failed.',
      isLoading: false,
    });
  };

  startDetection = () => {
    this.setState({
      boxes: [],
      detections: [],
      error: '',
      imageUrl: '',
      isLoading: true,
    });
  };

  onButtonSubmit = async (event) => {
    event?.preventDefault();
    const imageUrl = this.state.input.trim();

    if (!imageUrl) {
      this.setState({ error: 'Enter a direct image URL first.' });
      return;
    }

    this.startDetection();

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      this.applyDetectionResult(await this.readDetectionResponse(response));
    } catch (error) {
      this.handleDetectionError(error);
    }
  };

  onFileSubmit = async (file) => {
    if (!file) {
      this.setState({ error: 'Choose an image from your device first.' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.setState({ error: 'Choose a valid image file.' });
      return;
    }
    if (file.size > MAX_DETECTION_IMAGE_BYTES) {
      this.setState({ error: 'The image is larger than the 10 MB limit.' });
      return;
    }

    this.startDetection();

    try {
      let uploadImage = file;

      if (!SUPPORTED_DETECTION_IMAGE_TYPES.has(file.type)) {
        if (!IPHONE_IMAGE_TYPES.has(file.type)) {
          throw new Error('This image format is not supported. Choose a JPG, PNG, GIF, or WebP.');
        }
        uploadImage = await convertToJpeg(file);
      }

      if (uploadImage.size > MAX_DETECTION_IMAGE_BYTES) {
        throw new Error('The prepared image is larger than the 10 MB limit.');
      }

      const response = await fetch('/api/detect-upload', {
        method: 'POST',
        headers: { 'Content-Type': uploadImage.type },
        body: uploadImage,
      });
      this.applyDetectionResult(await this.readDetectionResponse(response));
    } catch (error) {
      this.handleDetectionError(error);
    }
  };

  render() {
    const {
      authError,
      boxes,
      detectionCount,
      error,
      hasCustomProfileImage,
      imageUrl,
      isAuthLoading,
      isLoading,
      isSessionLoading,
      isSignedIn,
      profileImageSrc,
      rank,
      route,
      userName,
    } = this.state;

    return (
      <div className="app-root">
        <ParticlesBg type="cobweb" config={particleConfig} bg={true} />
        <div className="app-shell">
          {isSessionLoading ? (
            <div className="session-loading" role="status">
              Loading your account…
            </div>
          ) : (
            <>
              <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
              {route === 'home' && isSignedIn ? (
                <div className="hero">
                  <section className="control-card" aria-label="Image detection controls">
                    <ProfileImageEditor
                      hasCustomImage={hasCustomProfileImage}
                      imageSrc={profileImageSrc}
                      onUpdate={this.onProfileImageUpdate}
                    />
                    <Rank detectionCount={detectionCount} name={userName} rank={rank} />
                    <ImageLinkForm
                      error={error}
                      isLoading={isLoading}
                      onFileSubmit={this.onFileSubmit}
                      onInputChange={this.onInputChange}
                      onButtonSubmit={this.onButtonSubmit}
                    />
                  </section>
                  <FaceRecognition
                    boxes={boxes}
                    imageUrl={imageUrl}
                    onImageLoad={this.onImageLoad}
                  />
                </div>
              ) : route === 'register' ? (
                <Register
                  authError={authError}
                  isLoading={isAuthLoading}
                  onRegister={this.onRegister}
                  onRouteChange={this.onRouteChange}
                />
              ) : (
                <SignIn
                  authError={authError}
                  isLoading={isAuthLoading}
                  onRouteChange={this.onRouteChange}
                  onSignIn={this.onSignIn}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }
}

export default App;
