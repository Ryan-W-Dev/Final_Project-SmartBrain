import 'dotenv/config';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 3001;
const maxImageBytes = 10 * 1024 * 1024;
const modelUrl =
  process.env.HF_MODEL_URL ||
  'https://router.huggingface.co/hf-inference/models/facebook/detr-resnet-50';
const redirectStatuses = new Set([301, 302, 303, 307, 308]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

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

app.use(express.json({ limit: '4kb' }));

app.post('/api/detect', async (request, response, next) => {
  try {
    const token = process.env.HF_TOKEN;
    if (!token) {
      throw new HttpError(503, 'The server is missing its Hugging Face token.');
    }

    if (typeof request.body?.imageUrl !== 'string') {
      throw new HttpError(400, 'An imageUrl string is required.');
    }

    const { contentType, image } = await downloadImage(request.body.imageUrl.trim());
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

    response.json({
      imageUrl: `data:${contentType};base64,${image.toString('base64')}`,
      predictions: modelResult,
    });
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

app.use((error, _request, response, _next) => {
  const status = error instanceof HttpError ? error.status : 500;
  const message =
    error instanceof HttpError ? error.message : 'The server could not process the image.';

  if (!(error instanceof HttpError)) {
    console.error(error);
  }

  response.status(status).json({ error: message });
});

app.listen(port, () => {
  console.log(`Smart Brain server listening on http://localhost:${port}`);
});
