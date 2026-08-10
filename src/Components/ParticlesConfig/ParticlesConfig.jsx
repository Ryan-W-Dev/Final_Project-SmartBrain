const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 600;

export const particleConfig = {
  num: isSmallScreen ? [1, 1] : [1, 2],
  rps: isSmallScreen ? 0.3 : 1,
  radius: [5, 40],
  life: [1.5, 3],
  v: [2, 3],
  tha: [-40, 40],
  scale: [1, 5],
  position: 'all',
  color: ['random', '#080808'],
  cross: 'dead',
  random: isSmallScreen ? 40 : 15,
};
