const isSmallPhone = typeof window !== 'undefined' && window.innerWidth <= 430;

export const particleConfig = {
  num: isSmallPhone ? [0, 1] : [4, 6],
  rps: isSmallPhone ? 0.05 : 0.3,
  v: isSmallPhone ? 0.1 : 0.3,
  radius: [2, 4],
  life: [1, 2],
  v: 0.1,
  tha: [-180, 180],
  scale: [1, 2],
  position: 'all',
  cross: 'dead',
  random: 8,
  zIndex: -1,
  top: 0,
  left: 0,
};
