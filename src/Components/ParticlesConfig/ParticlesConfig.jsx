const isSmallPhone = typeof window !== 'undefined' && window.innerWidth <= 430;

export const particleConfig = {
  num: isSmallPhone ? [0, 1] : [4, 6],
  rps: isSmallPhone ? 0.05 : 0.3,
  radius: [2, 4],
  life: [1, 2],
  v: [0.001, 0.003],
  tha: [-180, 180],
  scale: [1, 2],
  position: 'all',
  cross: 'dead',
  random: 8,
};
