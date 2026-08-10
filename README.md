# Smart Brain (Frontend)

Smart Brain is a React + Vite frontend project for a face-detection style UI challenge.

The app currently includes:

- A hero layout with logo, rank display, and image URL form
- A fixed top-right navigation button that stays pinned during viewport changes
- A particles background that remains behind all UI content
- Responsive particle tuning for iPhone-sized viewports (lower density, slower speed, lower spawn rate)

## Tech Stack

- React 19
- Vite 8
- particles-bg
- react-parallax-tilt
- Oxlint

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## Scripts

- `npm run dev`: start local Vite dev server
- `npm run build`: production build
- `npm run preview`: preview production build locally
- `npm run lint`: run Oxlint

## Project Structure

```text
src/
	App.jsx
	App.css
	index.css
	main.jsx
	Components/
		ImageLinkForm/
			ImageLinkForm.jsx
		Logo/
			Logo.jsx
			Logo.css
		Navigation/
			Navigation.jsx
		ParticlesConfig/
			ParticlesConfig.jsx
		Rank/
			Rank.jsx
```

## Particle System Notes

Particle behavior is centralized in `src/Components/ParticlesConfig/ParticlesConfig.jsx`.

It includes:

- Base particle config
- Viewport-aware particle settings
- iPhone viewport detection and adjustments
- `useParticleConfig()` custom hook used by `src/App.jsx`

## Styling Notes

- Main layout and layering live in `src/App.css`
- Particles are forced below app content using z-index layering
- Navigation is fixed on the right side across breakpoints

## Current Scope

This repository is focused on the frontend UI layer. Face detection API wiring and authentication flows are not yet included in the current app state.
