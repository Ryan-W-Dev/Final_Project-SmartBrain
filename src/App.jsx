import './App.css';
import Navigation from './Components/Navigation/Navigation';
import Logo from './Components/Logo/Logo';
import ImageLinkForm from './Components/ImageLinkForm/ImageLinkForm';
import Rank from './Components/Rank/Rank';
import ParticlesBg from 'particles-bg';
import { particleConfig } from './Components/ParticlesConfig/particlesConfig';

const App = () => (
  <div className="app-root">
    <ParticlesBg type="cobweb" config={particleConfig} bg={true} />
    <div className="app-shell">
      <Navigation />
      <div className="hero">
        <Logo />
        <Rank />
        <ImageLinkForm />
        {/* <FaceRecognition></FaceRecognition> */}
      </div>
    </div>
  </div>
);

export default App;
