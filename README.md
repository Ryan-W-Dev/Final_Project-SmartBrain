# Smart Brain

Smart Brain is a responsive React application that detects people in images. Users can create an account, submit an image URL or upload a photo from their device, and compete for leaderboard rank based on their number of successful detections.

The browser communicates with an Express API, which keeps the Hugging Face token and all database access on the server.

The production application is available at [smartbrain.ryanwynn.dev](https://smartbrain.ryanwynn.dev). Vercel hosts the Vite client and Express function, Neon provides PostgreSQL, and Resend delivers password-reset email from the verified `mail.ryanwynn.dev` subdomain.

## Features

- Register with a name, properly formatted unique email address, and password confirmation
- Sign in only when the submitted email and password match a registered account
- Secure scrypt password hashing and database-backed HTTP-only sessions
- Password recovery links on both the sign-in and registration screens
- Single-use, 15-minute password reset tokens delivered by email
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

## Password Reset

The **Reset password** option is available from both the sign-in and registration screens.

1. Enter the email address associated with the account.
2. Open the reset link sent to that address.
3. Enter and confirm a new password of 8–128 characters.
4. Return to the sign-in screen and use the new password.

Reset links expire after 15 minutes and can only be used once. Requesting another link invalidates the account's previous link. After a successful reset, every existing session for that account is invalidated, so the user must sign in again on each device.

The public response does not reveal whether an email address is registered. Requests are limited to five attempts per email address within 15 minutes.

### Local password-reset testing

Email delivery is optional during local development. When `RESEND_API_KEY` and `RESET_EMAIL_FROM` are not configured, submitting a registered email displays an **Open the local reset link** link on the confirmation screen.

### Production email delivery

Production password resets use Resend. Configure these values in the production environment:

```dotenv
APP_URL=https://smartbrain.ryanwynn.dev
RESEND_API_KEY=re_your_resend_api_key
RESEND_EMAIL_DOMAIN=mail.ryanwynn.dev
RESET_EMAIL_FROM=Smart Brain <passwords@mail.ryanwynn.dev>
```

`APP_URL` must use HTTPS, and `RESET_EMAIL_FROM` must use a sender domain verified in Resend. These values belong on the server and must not use the public `VITE_*` prefix.

## Tech Stack

- React 19
- Vite 8
- Express 5
- PostgreSQL 17
- node-postgres (`pg`)
- Docker Compose for the local database
- Neon Postgres for the hosted database
- Vercel for the Vite frontend and Express serverless function
- Hugging Face Inference API
- Resend email API for production password recovery
- `particles-bg`
- `react-parallax-tilt`
- Oxlint
- `tsx` for the API runtime

## Prerequisites

- Node.js and npm
- Docker Desktop or another Docker Compose-compatible runtime
- A Hugging Face access token with permission to use the configured inference model
- Vercel, Neon, and Resend accounts when deploying the hosted application

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
APP_URL=http://localhost:5173
# RESEND_API_KEY=re_your_resend_api_key
# RESEND_EMAIL_DOMAIN=mail.your-domain.example
# RESET_EMAIL_FROM=Smart Brain <passwords@your-verified-domain.example>
```

Never commit `.env`. Do not expose the Hugging Face or Resend token through a `VITE_*` variable because Vite variables are included in browser code. See [Password Reset](#password-reset) for local testing and production email configuration.

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
- `npm run db:migrate` — apply `db/schema.sql`; prefers `DATABASE_URL_UNPOOLED` when available
- `npm run build` — create the production client build
- `npm run preview` — build and serve the production application locally
- `npm start` — serve the existing `dist` build and API
- `npm run lint` — run Oxlint

## Production Deployment

The repository is linked to the Vercel project `ryan-w-devs-projects/smart-brain`. Its production domain is `smartbrain.ryanwynn.dev`.

The following server-only variables are configured in Vercel:

- `DATABASE_URL` — Neon pooled connection used by the application
- `DATABASE_URL_UNPOOLED` — Neon direct connection used by migrations and database exports
- `HF_TOKEN` — Hugging Face inference token
- `APP_URL` — `https://smartbrain.ryanwynn.dev`
- `RESEND_API_KEY` — Resend API credential
- `RESEND_EMAIL_DOMAIN` — `mail.ryanwynn.dev`
- `RESET_EMAIL_FROM` — `Smart Brain <passwords@mail.ryanwynn.dev>`

Do not add these values to source control or rename them with a `VITE_*` prefix. Vite exposes `VITE_*` values to browser code.

Apply database changes with the direct Neon connection:

```bash
vercel env run --environment production -- npm run db:migrate
```

Build and deploy the current working tree:

```bash
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```

The Vercel project uses `api/index.js` as the serverless Express entry point and rewrites `/api/*` requests to that function. All other requests are served by the Vite build in `dist`.

For another hosted PostgreSQL provider, set `DATABASE_URL` to its runtime connection string and `DATABASE_URL_UNPOOLED` to its direct migration connection when the provider offers both. Set `DATABASE_SSL=true` only when TLS is required and is not already specified by the connection URL.

## Project Structure

```text
.
├── api/
│   └── index.js               Vercel Express function entry point
├── compose.yaml                 Local PostgreSQL service
├── database.js                 PostgreSQL connection and queries
├── db/
│   └── schema.sql              Users, sessions, reset tokens, and rate limits
├── scripts/
│   └── migrate-database.mjs    Local or hosted schema migration command
├── server.js                   Express authentication and detection API
├── vercel.json                 Vercel build, function, and API rewrite config
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
        ├── PasswordReset/      Password recovery request and update forms
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
- Password reset tokens are cryptographically random, stored only as hashes, expire after 15 minutes, and can be used once.
- A successful password reset invalidates all existing sessions for that account and requires a fresh sign-in.
- Password reset requests return the same public message whether or not an email is registered and are rate-limited per email address.
- Password reset rate limits are stored in PostgreSQL so they remain effective across serverless function instances.
- SQL queries use parameters for user-provided values.
- Profile-image and detection endpoints require an authenticated session.
- Uploaded detection images are processed for detection but are not stored in PostgreSQL.
