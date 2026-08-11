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

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState({ isSignedIn: false, route: 'signin' });
    } else if (route === 'home') {
      this.setState({ isSignedIn: true });
    }
    this.setState({ route });
  };

  onRegister = (profileImageSrc) => {
    this.setState({
      isSignedIn: true,
      profileImageSrc: profileImageSrc || DEFAULT_PROFILE_IMAGE,
      route: 'home',
    });
  };

  render() {
    const { isSignedIn, route, boxes, imageUrl, error, isLoading, profileImageSrc } = this.state;
    return (
      <div className="app-root">
        <ParticlesBg type="cobweb" config={particleConfig} bg={true} />
        <div className="app-shell">
          <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
          {route === 'home' ? (
            <div className="hero">
              <section className="control-card" aria-label="Image detection controls">
                <Logo imageSrc={profileImageSrc} />
                <Rank />
                <ImageLinkForm
                  error={error}
                  isLoading={isLoading}
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
