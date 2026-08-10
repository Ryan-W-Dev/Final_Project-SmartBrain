import { useEffect, useMemo, useState } from 'react';

export const BASE_CONFIG = {
  life: [1.5, 3],
  tha: [-40, 40],
  scale: [0.1, 0.2],
  position: 'all',
  color: ['random', '#080808'],
  cross: 'dead',
  random: 15,
};

const BASE_VIEWPORT_AREA = 1366 * 768;
const BASE_PARTICLE_NUM = [4, 7];
const BASE_PARTICLE_RADIUS = [5, 40];
const BASE_PARTICLE_VELOCITY = [2, 3];
const DENSITY_EXPONENT = 2;
const SMALL_IPHONE_MAX_WIDTH = 430;
const SMALL_IPHONE_MAX_HEIGHT = 950;
const IPHONE_ACTIVITY_SCALE = 0.1;
const IPHONE_SPEED_SCALE = 0.15;
const DESKTOP_RPS = 0.1;
const IPHONE_RPS = 0.00225;

export const DEFAULT_PARTICLE_SETTINGS = {
  num: BASE_PARTICLE_NUM,
  radius: BASE_PARTICLE_RADIUS,
  rps: DESKTOP_RPS,
  v: BASE_PARTICLE_VELOCITY,
};

export const getParticleSettings = (width, height) => {
  const area = Math.max(1, width * height);
  const areaScale = Math.min(1, area / BASE_VIEWPORT_AREA);
  const isSmallIphoneViewport =
    Math.min(width, height) <= SMALL_IPHONE_MAX_WIDTH &&
    Math.max(width, height) <= SMALL_IPHONE_MAX_HEIGHT;
  const densityScaleBase = Math.pow(areaScale, DENSITY_EXPONENT);
  const densityScale = isSmallIphoneViewport
    ? densityScaleBase * IPHONE_ACTIVITY_SCALE
    : densityScaleBase;

  const numMin = Math.max(1, Math.round(BASE_PARTICLE_NUM[0] * densityScale));
  const numMax = Math.max(numMin, Math.round(BASE_PARTICLE_NUM[1] * densityScale));

  const radiusMin = Math.max(
    3,
    Math.round(
      BASE_PARTICLE_RADIUS[0] *
        (isSmallIphoneViewport ? 0.45 + 0.35 * densityScale : 0.65 + 0.35 * densityScale)
    )
  );
  const radiusMax = Math.max(
    radiusMin + 1,
    Math.round(
      BASE_PARTICLE_RADIUS[1] *
        (isSmallIphoneViewport ? 0.2 + 0.55 * densityScale : 0.45 + 0.55 * densityScale)
    )
  );
  const rps = isSmallIphoneViewport ? IPHONE_RPS : DESKTOP_RPS;
  const velocity = isSmallIphoneViewport
    ? [
        BASE_PARTICLE_VELOCITY[0] * IPHONE_SPEED_SCALE,
        BASE_PARTICLE_VELOCITY[1] * IPHONE_SPEED_SCALE,
      ]
    : BASE_PARTICLE_VELOCITY;

  return {
    num: [numMin, numMax],
    radius: [radiusMin, radiusMax],
    rps,
    v: velocity,
  };
};

export const useParticleConfig = () => {
  const [particleSettings, setParticleSettings] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_PARTICLE_SETTINGS;
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
      rps: particleSettings.rps,
      v: particleSettings.v,
      num: particleSettings.num,
      radius: particleSettings.radius,
    }),
    [particleSettings]
  );

  return particleConfig;
};
