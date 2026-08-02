import crypto from 'node:crypto';

const COOKIE_NAME = 'impakt_quote_session';
const SESSION_DURATION_SECONDS = 12 * 60 * 60;

// Chỉ dùng khi chạy local bằng `npx vercel dev`.
const LOCAL_ADMIN_PASSWORD = 'Impakt@2026!';
const LOCAL_SESSION_SECRET = '1edbe14bad5530948bc55c7d016be9111784b9f232f1a8663455a879f32dc3ff8c738d3bd3d3fba0cf44bb43fe8e0a5463b97f1d1b3ab51c86fb6c0eeaa453f5';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const getAdminPassword = () =>
  process.env.QUOTE_ADMIN_PASSWORD ||
  (!IS_PRODUCTION ? LOCAL_ADMIN_PASSWORD : '');

const getSessionSecret = () =>
  process.env.QUOTE_SESSION_SECRET ||
  (!IS_PRODUCTION ? LOCAL_SESSION_SECRET : '');

const base64UrlEncode = (value) =>
  Buffer.from(value, 'utf8').toString('base64url');

const base64UrlDecode = (value) =>
  Buffer.from(value, 'base64url').toString('utf8');

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const sign = (payload, secret) =>
  crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

const parseCookies = (cookieHeader = '') =>
  cookieHeader.split(';').reduce((cookies, part) => {
    const separatorIndex = part.indexOf('=');

    if (separatorIndex < 0) {
      return cookies;
    }

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();

    if (key) {
      cookies[key] = decodeURIComponent(value);
    }

    return cookies;
  }, {});

const parseBody = (body) => {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return body;
};

const validatePassword = (inputPassword) => {
  const configuredPassword = getAdminPassword();

  if (!configuredPassword) {
    return {
      configured: false,
      valid: false,
    };
  }

  return {
    configured: true,
    valid: safeEqual(inputPassword, configuredPassword),
  };
};

const createSessionCookie = () => {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error('QUOTE_SESSION_SECRET_NOT_CONFIGURED');
  }

  const now = Math.floor(Date.now() / 1000);

  const payload = base64UrlEncode(
    JSON.stringify({
      issuedAt: now,
      expiresAt: now + SESSION_DURATION_SECONDS,
      nonce: crypto.randomBytes(16).toString('hex'),
    }),
  );

  const signature = sign(payload, secret);
  const token = `${payload}.${signature}`;

  const cookieParts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${SESSION_DURATION_SECONDS}`,
    'HttpOnly',
    'SameSite=Strict',
  ];

  if (process.env.NODE_ENV === 'production') {
    cookieParts.push('Secure');
  }

  return cookieParts.join('; ');
};

const clearSessionCookie = () => {
  const cookieParts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Strict',
  ];

  if (process.env.NODE_ENV === 'production') {
    cookieParts.push('Secure');
  }

  return cookieParts.join('; ');
};

const isAuthenticated = (request) => {
  const secret = getSessionSecret();

  if (!secret) {
    return false;
  }

  const cookies = parseCookies(request.headers.cookie || '');
  const token = cookies[COOKIE_NAME];

  if (!token) {
    return false;
  }

  const separatorIndex = token.lastIndexOf('.');

  if (separatorIndex < 1) {
    return false;
  }

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expectedSignature = sign(payload, secret);

  if (!safeEqual(signature, expectedSignature)) {
    return false;
  }

  try {
    const data = JSON.parse(base64UrlDecode(payload));
    const now = Math.floor(Date.now() / 1000);

    return (
      Number.isFinite(data.expiresAt) &&
      data.expiresAt > now
    );
  } catch {
    return false;
  }
};

const handleLogin = (response, body) => {
  const password = String(body.password || '');
  const validation = validatePassword(password);

  if (!validation.configured) {
    return response.status(500).json({
      success: false,
      message: 'QUOTE_ADMIN_PASSWORD_NOT_CONFIGURED',
    });
  }

  if (!validation.valid) {
    return response.status(401).json({
      success: false,
      message: 'INVALID_PASSWORD',
    });
  }

  try {
    response.setHeader('Set-Cookie', createSessionCookie());

    return response.status(200).json({
      success: true,
      authenticated: true,
    });
  } catch (error) {
    console.error('Quotation login failed:', error);

    return response.status(500).json({
      success: false,
      message: 'SESSION_NOT_CONFIGURED',
    });
  }
};

const handleLogout = (response) => {
  response.setHeader('Set-Cookie', clearSessionCookie());

  return response.status(200).json({
    success: true,
    authenticated: false,
  });
};

export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  // GET /api/quotation -> kiểm tra trạng thái đăng nhập.
  if (request.method === 'GET') {
    return response.status(200).json({
      success: true,
      authenticated: isAuthenticated(request),
    });
  }

  // POST /api/quotation -> đăng nhập hoặc đăng xuất.
  if (request.method === 'POST') {
    const body = parseBody(request.body);
    const action = String(body.action || '');

    if (action === 'login') {
      return handleLogin(response, body);
    }

    if (action === 'logout') {
      return handleLogout(response);
    }

    return response.status(400).json({
      success: false,
      message: 'INVALID_ACTION',
    });
  }

  response.setHeader('Allow', 'GET, POST');

  return response.status(405).json({
    success: false,
    message: 'METHOD_NOT_ALLOWED',
  });
}
