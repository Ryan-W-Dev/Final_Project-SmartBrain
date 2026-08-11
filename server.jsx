import 'dotenv/config';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import express from 'express';
import {
  closeDatabase,
  createSession,
  createUser,
  deleteSession,
  findUserCredentialsByEmail,
  getProfileImage,
  getUserById,
  getUserBySession,
  incrementDetectionCount,
  initializeDatabase,
  updateProfileImage,
} from './database.jsx';

const app = express();
const port = Number(process.env.PORT) || 3001;
const maxImageBytes = 10 * 1024 * 1024;
const maxProfileImageBytes = 5 * 1024 * 1024;
const sessionDurationMilliseconds = 7 * 24 * 60 * 60 * 1000;
const sessionCookieName = 'smartbrain_session';
const scryptAsync = promisify(scrypt);
const modelUrl =
  process.env.HF_MODEL_URL ||
  'https://router.huggingface.co/hf-inference/models/facebook/detr-resnet-50';
const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const supportedUploadTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;
let dummyPasswordHash = '';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const hashPassword = async (password) => {
  const salt = randomBytes(16);
  const cost = 131_072;
  const blockSize = 8;
  const parallelization = 1;
  const derivedKey = await scryptAsync(password, salt, 64, {
    N: cost,
    maxmem: 256 * 1024 * 1024,
    p: parallelization,
    r: blockSize,
  });

  return [
    'scrypt',
    cost,
    blockSize,
    parallelization,
    salt.toString('hex'),
    derivedKey.toString('hex'),
  ].join('$');
};

const verifyPassword = async (password, storedHash) => {
  const [algorithm, cost, blockSize, parallelization, saltHex, hashHex] = storedHash.split('$');

  if (algorithm !== 'scrypt' || !cost || !blockSize || !parallelization || !saltHex || !hashHex) {
    return false;
  }

  const expectedHash = Buffer.from(hashHex, 'hex');
  const actualHash = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expectedHash.length, {
    N: Number(cost),
    maxmem: 256 * 1024 * 1024,
    p: Number(parallelization),
    r: Number(blockSize),
  });

  return expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash);
};

const hashSessionToken = (token) => createHash('sha256').update(token).digest('hex');

const getCookie = (request, name) => {
  const cookieHeader = request.get('cookie');
  if (!cookieHeader) {
    return '';
  }

  for (const cookie of cookieHeader.split(';')) {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const cookieName = cookie.slice(0, separatorIndex).trim();
    if (cookieName === name) {
      return decodeURIComponent(cookie.slice(separatorIndex + 1).trim());
    }
  }

  return '';
};

const setSessionCookie = (response, token) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const maxAge = Math.floor(sessionDurationMilliseconds / 1000);
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`
  );
};

const clearSessionCookie = (response) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`
  );
};

const startSession = async (response, userId) => {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + sessionDurationMilliseconds);
  await createSession({ expiresAt, tokenHash: hashSessionToken(token), userId });
  setSessionCookie(response, token);
};

const getAuthenticatedUser = async (request) => {
  const token = getCookie(request, sessionCookieName);
  return token ? getUserBySession(hashSessionToken(token)) : null;
};

const requireAuthenticatedUser = async (request) => {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new HttpError(401, 'Sign in to submit images for detection.');
  }
  return user;
};

const toClientUser = (user) => ({
  detectionCount: user.detection_count,
  email: user.email,
  id: user.id,
  name: user.name,
  profileImageSrc: user.profile_image_content_type
    ? `/api/users/${user.id}/profile-image?v=${randomBytes(8).toString('hex')}`
    : null,
  rank: user.rank,
});

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const validateEmail = (email) => {
  if (!email || email.length > 320 || !emailPattern.test(email)) {
    throw new HttpError(400, 'Enter a valid email address.');
  }
};

const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new HttpError(400, 'Password must be between 8 and 128 characters.');
  }
};

const parseProfileImage = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'The profile image is invalid.');
  }

  const match = value.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,([a-z0-9+/=]+)$/i);
  if (!match) {
    throw new HttpError(415, 'Choose a JPG, PNG, GIF, or WebP profile image.');
  }

  const image = Buffer.from(match[2], 'base64');
  if (!image.length) {
    throw new HttpError(400, 'The profile image is empty.');
  }
  if (image.length > maxProfileImageBytes) {
    throw new HttpError(413, 'The profile image is larger than the 5 MB limit.');
  }

  return { contentType: match[1].toLowerCase(), image };
};

const isPrivateIpv4 = (address) => {
  const [a, b] = address.split('.').map(Number);

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
};

const isPrivateAddress = (address) => {
  if (isIP(address) === 4) {
    return isPrivateIpv4(address);
  }

  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];

    return (
      normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith('ff') ||
      (mappedIpv4 ? isPrivateIpv4(mappedIpv4) : false)
    );
  }

  return true;
};

const validateUrl = (value) => {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new HttpError(400, 'Enter a valid direct image URL.');
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new HttpError(400, 'Only public HTTP or HTTPS image URLs are supported.');
  }

  return url;
};

const assertPublicHost = async (url) => {
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) {
    throw new HttpError(400, 'Local or private image addresses are not supported.');
  }

  let addresses;
  try {
    addresses = await lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new HttpError(400, 'The image hostname could not be resolved.');
  }

  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new HttpError(400, 'Local or private image addresses are not supported.');
  }
};

const downloadImage = async (initialUrl) => {
  let currentUrl = validateUrl(initialUrl);

  for (let redirects = 0; redirects <= 3; redirects += 1) {
    await assertPublicHost(currentUrl);

    let response;
    try {
      response = await fetch(currentUrl, {
        headers: { 'User-Agent': 'SmartBrain/1.0' },
        redirect: 'manual',
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new HttpError(502, 'The server could not download that image URL.');
    }

    if (redirectStatuses.has(response.status)) {
      const location = response.headers.get('location');
      if (!location || redirects === 3) {
        throw new HttpError(400, 'The image URL redirected too many times.');
      }
      currentUrl = validateUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!response.ok) {
      throw new HttpError(502, `The image host returned HTTP ${response.status}.`);
    }

    const contentType = response.headers.get('content-type')?.split(';')[0].toLowerCase();
    if (!contentType?.startsWith('image/')) {
      throw new HttpError(
        415,
        'That address is a webpage, not a direct image. Copy the image address itself.'
      );
    }

    const declaredLength = Number(response.headers.get('content-length'));
    if (declaredLength > maxImageBytes) {
      throw new HttpError(413, 'The image is larger than the 10 MB limit.');
    }

    const image = Buffer.from(await response.arrayBuffer());
    if (image.length > maxImageBytes) {
      throw new HttpError(413, 'The image is larger than the 10 MB limit.');
    }

    return { contentType, image };
  }

  throw new HttpError(400, 'The image URL could not be followed.');
};

const detectImage = async ({ contentType, image }) => {
  const token = process.env.HF_TOKEN;
  if (!token) {
    throw new HttpError(503, 'The server is missing its Hugging Face token.');
  }

  let modelResponse;
  try {
    modelResponse = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body: image,
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new HttpError(502, 'The Hugging Face service could not be reached.');
  }

  const modelResult = await modelResponse.json().catch(() => null);

  if (!modelResponse.ok) {
    const detail = modelResult?.error ? ` ${modelResult.error}` : '';
    throw new HttpError(502, `Hugging Face rejected the image.${detail}`);
  }

  if (!Array.isArray(modelResult)) {
    throw new HttpError(502, 'Hugging Face returned an unexpected response.');
  }

  return modelResult;
};

const sendDetectionResponse = async (response, submittedImage, userId) => {
  const predictions = await detectImage(submittedImage);
  const user = await incrementDetectionCount(userId);

  if (!user) {
    throw new HttpError(401, 'Your account could not be found. Sign in again.');
  }

  response.json({
    imageUrl: `data:${submittedImage.contentType};base64,${submittedImage.image.toString('base64')}`,
    predictions,
    user: toClientUser(user),
  });
};

app.use(express.raw({ type: 'image/*', limit: maxImageBytes }));
app.use(express.json({ limit: '8mb' }));

app.post('/api/auth/register', async (request, response, next) => {
  try {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
    const email = normalizeEmail(request.body?.email);
    const { password, confirmPassword, profileImageSrc } = request.body || {};

    if (!name || name.length > 100) {
      throw new HttpError(400, 'Name must be between 1 and 100 characters.');
    }
    validateEmail(email);
    validatePassword(password);
    if (password !== confirmPassword) {
      throw new HttpError(400, 'Passwords do not match.');
    }

    const passwordHash = await hashPassword(password);
    const profileImage = parseProfileImage(profileImageSrc);
    const user = await createUser({ email, name, passwordHash, profileImage });
    await startSession(response, user.id);

    response.status(201).json({ user: toClientUser(user) });
  } catch (error) {
    if (error?.code === '23505') {
      next(new HttpError(409, 'An account with that email already exists.'));
      return;
    }
    next(error);
  }
});

app.post('/api/auth/signin', async (request, response, next) => {
  try {
    const email = normalizeEmail(request.body?.email);
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    validateEmail(email);

    if (!password || password.length > 128) {
      throw new HttpError(
        401,
        'Email or password is incorrect. Please register and create an account.'
      );
    }

    const credentials = await findUserCredentialsByEmail(email);
    const passwordMatches = await verifyPassword(
      password,
      credentials?.password_hash || dummyPasswordHash
    );

    if (!credentials || !passwordMatches) {
      throw new HttpError(
        401,
        'Email or password is incorrect. Please register and create an account.'
      );
    }

    const user = await getUserById(credentials.id);
    await startSession(response, user.id);
    response.json({ user: toClientUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', async (request, response, next) => {
  try {
    const user = await requireAuthenticatedUser(request);
    response.json({ user: toClientUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/signout', async (request, response, next) => {
  try {
    const token = getCookie(request, sessionCookieName);
    if (token) {
      await deleteSession(hashSessionToken(token));
    }
    clearSessionCookie(response);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/users/:id/profile-image', async (request, response, next) => {
  try {
    const user = await requireAuthenticatedUser(request);
    if (String(user.id) !== request.params.id) {
      throw new HttpError(403, 'You cannot access that profile image.');
    }

    const profileImage = await getProfileImage(user.id);
    if (!profileImage?.profile_image || !profileImage.profile_image_content_type) {
      throw new HttpError(404, 'Profile image not found.');
    }

    response.set({
      'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      'Content-Type': profileImage.profile_image_content_type,
      Expires: '0',
      Pragma: 'no-cache',
    });
    response.send(profileImage.profile_image);
  } catch (error) {
    next(error);
  }
});

app.put('/api/auth/profile-image', async (request, response, next) => {
  try {
    const authenticatedUser = await requireAuthenticatedUser(request);
    const profileImage = parseProfileImage(request.body?.profileImageSrc);
    const user = await updateProfileImage(authenticatedUser.id, profileImage);

    if (!user) {
      throw new HttpError(401, 'Your account could not be found. Sign in again.');
    }

    response.json({ user: toClientUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/detect', async (request, response, next) => {
  try {
    const user = await requireAuthenticatedUser(request);
    if (typeof request.body?.imageUrl !== 'string') {
      throw new HttpError(400, 'An imageUrl string is required.');
    }

    const downloadedImage = await downloadImage(request.body.imageUrl.trim());
    await sendDetectionResponse(response, downloadedImage, user.id);
  } catch (error) {
    next(error);
  }
});

app.post('/api/detect-upload', async (request, response, next) => {
  try {
    const user = await requireAuthenticatedUser(request);
    const contentType = request.get('content-type')?.split(';')[0].toLowerCase();

    if (!supportedUploadTypes.has(contentType)) {
      throw new HttpError(415, 'Choose a JPG, PNG, GIF, or WebP image.');
    }
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      throw new HttpError(400, 'Choose an image from your device first.');
    }
    if (request.body.length > maxImageBytes) {
      throw new HttpError(413, 'The image is larger than the 10 MB limit.');
    }

    await sendDetectionResponse(response, { contentType, image: request.body }, user.id);
  } catch (error) {
    next(error);
  }
});

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.join(currentDirectory, 'dist');
app.use(express.static(distDirectory));
app.use((request, response, next) => {
  if (request.method !== 'GET') {
    next();
    return;
  }
  response.sendFile(path.join(distDirectory, 'index.html'));
});

app.use((error, request, response, _next) => {
  const isTooLarge = error?.type === 'entity.too.large';
  const isInvalidJson = error?.type === 'entity.parse.failed';
  const status =
    error instanceof HttpError ? error.status : isTooLarge ? 413 : isInvalidJson ? 400 : 500;
  const message =
    error instanceof HttpError
      ? error.message
      : isTooLarge
        ? request.path === '/api/auth/register' || request.path === '/api/auth/profile-image'
          ? 'The profile image is too large.'
          : 'The image is larger than the 10 MB limit.'
        : isInvalidJson
          ? 'The request body is invalid.'
          : 'The server could not process the request.';

  if (!(error instanceof HttpError) && !isTooLarge && !isInvalidJson) {
    console.error(error);
  }

  response.status(status).json({ error: message });
});

const startServer = async () => {
  await initializeDatabase();
  dummyPasswordHash = await hashPassword('invalid-account-password');

  app.listen(port, () => {
    console.log(`Smart Brain server listening on http://localhost:${port}`);
  });
};

const shutdown = async () => {
  await closeDatabase();
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

startServer().catch((error) => {
  console.error('Smart Brain could not start:', error);
  process.exitCode = 1;
});
