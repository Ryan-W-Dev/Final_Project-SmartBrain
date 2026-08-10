# Smart Brain

Smart Brain is a React + Vite image-detection UI with an Express API that safely keeps the Hugging Face token out of the browser.

The app currently includes:

- A hero layout with logo, rank display, and image URL form
- A fixed top-right navigation button that stays pinned during viewport changes
- A particles background that remains behind all UI content
- Responsive particle tuning for iPhone-sized viewports (lower density, slower speed, lower spawn rate)
- Server-side image downloading so direct image URLs are not blocked by browser CORS
- Hugging Face object detection with server-side credentials

## Tech Stack

- React 19
- Vite 8
- particles-bg
- react-parallax-tilt
- Oxlint
- Express

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and replace the placeholder with a newly generated Hugging Face access token:

```text
HF_TOKEN=hf_your_new_token
```

Never commit `.env` or put the token in a `VITE_*` variable; Vite variables are visible in the browser.

3. Start the React and API development servers together:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

5. Preview the production build through the Express server:

```bash
npm run preview
```

## Scripts

- `npm run dev`: start Vite and the Express API together
- `npm run dev:client`: start only Vite
- `npm run dev:server`: start only the API with file watching
- `npm run build`: production build
- `npm run preview`: build and serve the production app locally
- `npm start`: serve the existing `dist` build and API

The API entry point is `server.jsx` and runs through the `tsx` runtime.
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
		FaceRecognition/
			FaceRecognition.jsx
			FaceRecognition.css
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

## Image URL Notes

Paste a direct image address whose response has an `image/*` content type. A gallery, search result, or stock-photo webpage is not a direct image URL. The API accepts public HTTP/HTTPS images up to 10 MB and rejects local/private network addresses.
