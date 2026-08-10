import './App.css';
import React, { Component } from 'react';
import Navigation from './Components/Navigation/Navigation';
import Logo from './Components/Logo/Logo';
import ImageLinkForm from './Components/ImageLinkForm/ImageLinkForm';
import Rank from './Components/Rank/Rank';
import ParticlesBg from 'particles-bg';
import { particleConfig } from './Components/ParticlesConfig/particlesConfig';

class App extends Component {
  constructor() {
    super();
    this.state = {
      input: '',
      imageUrl: '',
    };
  }

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  };
  onButtonSubmit = () => {
    this.setState({ imageUrl: this.state.input });
  };

  render() {
    return (
      <div className="app-root">
        <ParticlesBg type="cobweb" config={particleConfig} bg={true} />
        <div className="app-shell">
          <Navigation />
          <div className="hero">
            <Logo />
            <Rank />
            <ImageLinkForm
              onInputChange={this.onInputChange}
              onButtonSubmit={this.onButtonSubmit}
            />
            {/* <FaceRecognition></FaceRecognition> */}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
