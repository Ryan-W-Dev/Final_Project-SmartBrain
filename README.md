# Smart Brain

Smart Brain is a responsive React application that detects people in images. Users can create an account, submit an image URL or upload a photo from their device, and compete for leaderboard rank based on their number of successful detections.

The browser communicates with an Express API, which keeps the Hugging Face token and all database access on the server.

## Features

- Register with a name, properly formatted unique email address, and password confirmation
- Sign in only when the submitted email and password match a registered account
- Secure scrypt password hashing and database-backed HTTP-only sessions
- Optional profile picture during registration, with a default image when none is selected
- Update or reset a profile picture from a click/tap menu inside the signed-in profile image
- Preview profile-picture changes, then explicitly save or cancel them
- Persist saved profile-picture replacements across sign-out and future sign-ins
- Consistent circular cropping and tilt effects for default and uploaded profile pictures
- Detect people using either a direct image URL or a photo from a phone, tablet, or desktop
- Support for JPG, PNG, GIF, and WebP detection images up to 10 MB
- iPhone HEIC/HEIF conversion when the browser can decode the selected image
- Persistent detection totals and dynamically calculated PostgreSQL rankings
- Responsive upload controls that keep **Choose photo** and **Detect photo** side by side on small screens
- A sign-out button that appears only when a user is signed in
- Responsive particle effects and a custom favicon

## Ranking

A user's detection total increases only after the detection service successfully processes an image. Rankings are recalculated from all registered users:

1. The user with the most successful detections receives rank `#1`.
2. The next-highest total receives rank `#2`, and so on.
3. If users have the same total, the account created first ranks higher. The database ID provides the final deterministic tie-break.

The signed-in user's registered name, current rank, and successful detection count are displayed above the image controls.

## Profile Pictures

Profile pictures are optional and stored with the user's PostgreSQL account. Supported formats are JPG, PNG, GIF, and WebP, with a maximum size of 5 MB.

After signing in, desktop users can hover over the profile picture to see the instruction **Click image to change your profile picture**. Clicking the image opens an in-image menu. On mobile and other touch devices, the hover-only instruction stays hidden and tapping the image opens the same menu.

The menu provides these options:

- **Change profile image** — select and preview a replacement picture
- **Use default image** — preview the application's default picture
- **Cancel** — close the menu without changing the current picture

Selecting a replacement or the default image stages a preview. The account is not changed until the user selects **Save**. A second **Cancel** option discards the staged preview. The menu can also be closed with Escape or by clicking outside it.

Saved changes update the authenticated user's PostgreSQL record. The saved picture is returned with a fresh, non-cached image URL during future sign-ins so the most recent version is displayed.

## Tech Stack

- React 19
- Vite 8
- Express 5
- PostgreSQL 17
- node-postgres (`pg`)
- Docker Compose for the local database
- Hugging Face Inference API
- `particles-bg`
- `react-parallax-tilt`
- Oxlint
- `tsx` for the API runtime

## Prerequisites

- Node.js and npm
- Docker Desktop or another Docker Compose-compatible runtime
- A Hugging Face access token with permission to use the configured inference model

## Getting Started

1. Install the dependencies:

```bash
npm install
```

2. Start PostgreSQL:

```bash
npm run db:start
```

The database runs from `compose.yaml`. Its schema is created automatically when the API starts, and its data remains in a Docker volume when the container is stopped.

3. Copy `.env.example` to `.env` and replace the sample Hugging Face token:

```dotenv
HF_TOKEN=hf_your_new_token
DATABASE_URL=postgresql://smartbrain:smartbrain@localhost:5432/smartbrain
DATABASE_SSL=false
PORT=3001
```

Never commit `.env`. Do not expose the Hugging Face token through a `VITE_*` variable because Vite variables are included in browser code.

4. Start the Vite client and Express API together:

```bash
npm run dev
```

5. Open the local URL shown by Vite in the terminal.

## Scripts

- `npm run dev` — start the Vite client and Express API together
- `npm run dev:client` — start only the Vite development server
- `npm run dev:server` — start only the API with file watching
- `npm run db:start` — start the local PostgreSQL container
- `npm run db:stop` — stop PostgreSQL without deleting its stored data
- `npm run build` — create the production client build
- `npm run preview` — build and serve the production application locally
- `npm start` — serve the existing `dist` build and API
- `npm run lint` — run Oxlint

## Production Database

For a hosted PostgreSQL provider, replace `DATABASE_URL` with the provider's connection string. Set `DATABASE_SSL=true` when the provider requires TLS.

The application requires `DATABASE_URL` when `NODE_ENV=production`.

## Project Structure

```text
.
├── compose.yaml                 Local PostgreSQL service
├── database.jsx                PostgreSQL connection and queries
├── db/
│   └── schema.sql              Users and sessions schema
├── server.jsx                  Express authentication and detection API
└── src/
    ├── App.jsx                 Application state and API integration
    ├── App.css                 Main and responsive layout
    ├── index.css               Shared global and button styles
    ├── assets/
    │   └── intelligenceai.png  Favicon asset
    └── Components/
        ├── FaceRecognition/    Detection image and bounding boxes
        ├── ImageLinkForm/      URL and device image controls
        ├── Logo/               Profile image display and tilt effect
        ├── Navigation/         Signed-in navigation
        ├── ParticlesConfig/    Responsive particle configuration
        ├── ProfileImageEditor/ Signed-in profile picture updates
        ├── Rank/               User rank and detection total
        ├── Register/           Account registration form
        └── SignIn/             Account sign-in form
```

## Image Detection Notes

For URL detection, enter a direct public HTTP or HTTPS image address whose response has an `image/*` content type. Gallery pages, search-result pages, and stock-photo webpages are not direct image URLs.

The API downloads URL images server-side to avoid browser CORS limitations. It rejects local or private-network addresses and images larger than 10 MB.

For device uploads, iPhone and Android users can select an image from their photo library. Desktop users can select one from their files.

## Database and Security Notes

- User emails are normalized and uniquely indexed in PostgreSQL.
- Password hashes, never plaintext passwords, are stored in the database.
- Session tokens are stored in the browser as HTTP-only cookies; only token hashes are persisted.
- SQL queries use parameters for user-provided values.
- Profile-image and detection endpoints require an authenticated session.
- Uploaded detection images are processed for detection but are not stored in PostgreSQL.
