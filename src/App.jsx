import './App.css';
import React, { Component } from 'react';
import Navigation from './Components/Navigation/Navigation';
import Logo, { DEFAULT_PROFILE_IMAGE } from './Components/Logo/Logo';
import ImageLinkForm from './Components/ImageLinkForm/ImageLinkForm';
import Rank from './Components/Rank/Rank';
import ParticlesBg from 'particles-bg';
import { particleConfig } from './Components/ParticlesConfig/particlesConfig';
import FaceRecognition from './Components/FaceRecognition/FaceRecognition';
import SignIn from './Components/SignIn/SignIn';
import Register from './Components/Register/Register';

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
      route: 'signin', // Default route is 'signin'
      isSignedIn: false,
      profileImageSrc: DEFAULT_PROFILE_IMAGE,
      userName: 'Ryan',
    };
  }

  // Convert HuggingFace API data to mimic Clarifai API data
  createClarifaiBoundingBox = (pixelBox, imageWidth, imageHeight) => {
    return {
      left_col: pixelBox.xmin / imageWidth,
      top_row: pixelBox.ymin / imageHeight,
      right_col: pixelBox.xmax / imageWidth,
      bottom_row: pixelBox.ymax / imageHeight,
    };
  };

  calculateFaceLocation = (data) => {
    // Get ALL items labeled "person" instead of just the first one
    const personItems = data.filter((item) => item.label === 'person');

    // With new HuggingFace API we need display width as well as original image width
    const image = document.getElementById('inputimage');
    if (!image || !image.naturalWidth || !image.naturalHeight) {
      return [];
    }

    const originalWidth = Number(image.naturalWidth);
    const originalHeight = Number(image.naturalHeight);
    const width = Number(image.width);
    const height = Number(image.height);

    // Loop through every person found and calculate their box
    const boundingBoxes = personItems.map((person) => {
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

    return boundingBoxes;
  };

  displayFaceBox = (boxes) => {
    this.setState({ boxes });
  };

  onImageLoad = () => {
    this.displayFaceBox(this.calculateFaceLocation(this.state.detections));
  };

  componentDidMount() {
    window.addEventListener('resize', this.onImageLoad);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onImageLoad);
  }

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  };

  onButtonSubmit = async (event) => {
    event?.preventDefault();
    const imageUrl = this.state.input.trim();

    if (!imageUrl) {
      this.setState({ error: 'Enter a direct image URL first.' });
      return;
    }

    this.setState({
      boxes: [],
      detections: [],
      error: '',
      imageUrl: '',
      isLoading: true,
    });

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Image detection failed.');
      }

      if (!Array.isArray(result.predictions)) {
        throw new Error('The detection service returned an unexpected response.');
      }

      this.setState({
        detections: result.predictions,
        imageUrl: result.imageUrl,
        isLoading: false,
      });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Image detection failed.',
        isLoading: false,
      });
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

    this.setState({
      boxes: [],
      detections: [],
      error: '',
      imageUrl: '',
      isLoading: true,
    });

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
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Image detection failed.');
      }

      if (!Array.isArray(result.predictions)) {
        throw new Error('The detection service returned an unexpected response.');
      }

      this.setState({
        detections: result.predictions,
        imageUrl: result.imageUrl,
        isLoading: false,
      });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Image detection failed.',
        isLoading: false,
      });
    }
  };

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState({ isSignedIn: false, route: 'signin' });
    } else if (route === 'home') {
      this.setState({ isSignedIn: true });
    }
    this.setState({ route });
  };

  onRegister = ({ name, profileImageSrc }) => {
    this.setState({
      isSignedIn: true,
      profileImageSrc: profileImageSrc || DEFAULT_PROFILE_IMAGE,
      route: 'home',
      userName: name || 'Ryan',
    });
  };

  render() {
    const { isSignedIn, route, boxes, imageUrl, error, isLoading, profileImageSrc, userName } =
      this.state;
    return (
      <div className="app-root">
        <ParticlesBg type="cobweb" config={particleConfig} bg={true} />
        <div className="app-shell">
          <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
          {route === 'home' ? (
            <div className="hero">
              <section className="control-card" aria-label="Image detection controls">
                <Logo imageSrc={profileImageSrc} />
                <Rank name={userName} />
                <ImageLinkForm
                  error={error}
                  isLoading={isLoading}
                  onFileSubmit={this.onFileSubmit}
                  onInputChange={this.onInputChange}
                  onButtonSubmit={this.onButtonSubmit}
                />
              </section>
              <FaceRecognition boxes={boxes} imageUrl={imageUrl} onImageLoad={this.onImageLoad} />
            </div>
          ) : route === 'signin' ? (
            <SignIn onRouteChange={this.onRouteChange} />
          ) : route === 'register' ? (
            <Register onRegister={this.onRegister} onRouteChange={this.onRouteChange} />
          ) : null}
        </div>
      </div>
    );
  }
}

export default App;
