import './App.css';
import Navigation from './Components/Navigation/Navigation';
import Logo from './Components/Logo/Logo';
import ImageLinkForm from './Components/ImageLinkForm/ImageLinkForm';
import Rank from './Components/Rank/Rank';
import ParticlesBg from 'particles-bg';
import { useParticleConfig } from './particlesConfig';

function App() {
  const particleConfig = useParticleConfig();

  return (
    <>
      <ParticlesBg type="cobweb" config={particleConfig} bg={true} />
      <div className="app-shell">
        <Navigation></Navigation>
        <div className="hero">
          <Logo></Logo>
          <Rank></Rank>
          <ImageLinkForm></ImageLinkForm>
          {/* <FaceRecognition></FaceRecognition> */}
        </div>
      </div>
    </>
  );
}

export default App;
