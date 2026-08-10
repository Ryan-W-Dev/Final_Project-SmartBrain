import './App.css';
import { useEffect, useMemo, useState } from 'react';
import Navigation from './Components/Navigation/Navigation';
import Logo from './Components/Logo/Logo';
import ImageLinkForm from './Components/ImageLinkForm/ImageLinkForm';
import Rank from './Components/Rank/Rank';
import ParticlesBg from 'particles-bg';

const BASE_CONFIG = {
  rps: 0.1,
  life: [1.5, 3],
  v: [2, 3],
  tha: [-40, 40],
  alpha: [0.6, 0],
  scale: [0.1, 0.4],
  position: 'all',
  color: ['random', '#080808'],
  cross: 'dead',
  random: 15,
  onParticleUpdate: (ctx, particle) => {
    ctx.beginPath();
    ctx.rect(particle.p.x, particle.p.y, particle.radius * 2, particle.radius * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.closePath();
  },
};

const BASE_VIEWPORT_AREA = 1366 * 768;
const BASE_PARTICLE_NUM = [4, 7];
const BASE_PARTICLE_RADIUS = [5, 40];
const DENSITY_EXPONENT = 2;

const getParticleSettings = (width, height) => {
  const area = Math.max(1, width * height);
  const areaScale = Math.min(1, area / BASE_VIEWPORT_AREA);
  const densityScale = Math.pow(areaScale, DENSITY_EXPONENT);

  const numMin = Math.max(1, Math.round(BASE_PARTICLE_NUM[0] * densityScale));
  const numMax = Math.max(numMin, Math.round(BASE_PARTICLE_NUM[1] * densityScale));

  const radiusMin = Math.max(3, Math.round(BASE_PARTICLE_RADIUS[0] * (0.65 + 0.35 * densityScale)));
  const radiusMax = Math.max(
    radiusMin + 1,
    Math.round(BASE_PARTICLE_RADIUS[1] * (0.45 + 0.55 * densityScale))
  );

  return {
    num: [numMin, numMax],
    radius: [radiusMin, radiusMax],
  };
};

function App() {
  const [particleSettings, setParticleSettings] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        num: BASE_PARTICLE_NUM,
        radius: BASE_PARTICLE_RADIUS,
      };
    }

    return getParticleSettings(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    const handleResize = () => {
      setParticleSettings(getParticleSettings(window.innerWidth, window.innerHeight));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const particleConfig = useMemo(
    () => ({
      ...BASE_CONFIG,
      num: particleSettings.num,
      radius: particleSettings.radius,
    }),
    [particleSettings]
  );

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
