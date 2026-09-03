import {
  createHmac,
  timingSafeEqual,
} from 'node:crypto';

import {
  ApiError,
} from './http.js';

import {
  cleanText,
} from './validation.js';

export const ADMIN_COOKIE_NAME =
  'impakt_admin_session';

export const ADMIN_ROLE =
  'admin';

const DEFAULT_SESSION_TTL_SECONDS =
  12 * 60 * 60;

const MIN_SESSION_TTL_SECONDS =
  15 * 60;

const MAX_SESSION_TTL_SECONDS =
  7 * 24 * 60 * 60;

const MIN_SESSION_SECRET_LENGTH = 32;

const encodeBase64Url = (value) =>
  Buffer.from(value, 'utf8')
    .toString('base64url');

const decodeBase64Url = (value) =>
  Buffer.from(
    value,
    'base64url',
  ).toString('utf8');

const safeEqualBuffers = (
  leftBuffer,
  rightBuffer,
) => {
  if (
    !Buffer.isBuffer(leftBuffer) ||
    !Buffer.isBuffer(rightBuffer) ||
    leftBuffer.length !==
      rightBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    leftBuffer,
    rightBuffer,
  );
};

export const safeEqualText = (
  left,
  right,
) =>
  safeEqualBuffers(
    Buffer.from(
      String(left ?? ''),
      'utf8',
    ),
    Buffer.from(
      String(right ?? ''),
      'utf8',
    ),
  );

const getConfiguredUsername = () =>
  cleanText(
    process.env.ADMIN_USERNAME,
    {
      field: 'ADMIN_USERNAME',
      required: true,
      minLength: 2,
      maxLength: 100,
    },
  );

const getConfiguredPassword = () => {
  const password = String(
    process.env.ADMIN_PASSWORD ?? '',
  );

  if (!password) {
    throw new ApiError(
      500,
      'ADMIN_PASSWORD_NOT_CONFIGURED',
      'ADMIN_PASSWORD is not configured.',
    );
  }

  if (password.length < 10) {
    throw new ApiError(
      500,
      'ADMIN_PASSWORD_TOO_WEAK',
      'ADMIN_PASSWORD must contain at least 10 characters.',
    );
  }

  if (password.length > 300) {
    throw new ApiError(
      500,
      'ADMIN_PASSWORD_TOO_LONG',
      'ADMIN_PASSWORD is too long.',
    );
  }

  return password;
};

const getSessionSecret = () => {
  const secret = String(
    process.env.ADMIN_SESSION_SECRET ?? '',
  );

  if (
    secret.length <
    MIN_SESSION_SECRET_LENGTH
  ) {
    throw new ApiError(
      500,
      'ADMIN_SESSION_SECRET_NOT_CONFIGURED',
      `ADMIN_SESSION_SECRET must contain at least ${MIN_SESSION_SECRET_LENGTH} characters.`,
    );
  }

  return secret;
};

const getPreviousSessionSecret = () => {
  const secret = String(
    process.env
      .ADMIN_SESSION_SECRET_PREVIOUS ?? '',
  );

  return secret.length >=
    MIN_SESSION_SECRET_LENGTH
    ? secret
    : '';
};

export const getSessionTtlSeconds = () => {
  const rawValue =
    process.env.ADMIN_SESSION_TTL_SECONDS;

  if (
    rawValue === undefined ||
    rawValue === null ||
    rawValue === ''
  ) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }

  const value = Number(rawValue);

  if (
    !Number.isInteger(value) ||
    value < MIN_SESSION_TTL_SECONDS ||
    value > MAX_SESSION_TTL_SECONDS
  ) {
    throw new ApiError(
      500,
      'INVALID_ADMIN_SESSION_TTL',
      `ADMIN_SESSION_TTL_SECONDS must be an integer from ${MIN_SESSION_TTL_SECONDS} to ${MAX_SESSION_TTL_SECONDS}.`,
    );
  }

  return value;
};

const signPayload = (
  encodedPayload,
  secret,
) =>
  createHmac(
    'sha256',
    secret,
  )
    .update(encodedPayload)
    .digest('base64url');

const verifySignatureWithSecret = (
  encodedPayload,
  signature,
  secret,
) => {
  if (!secret) {
    return false;
  }

  const expectedSignature =
    signPayload(
      encodedPayload,
      secret,
    );

  return safeEqualText(
    signature,
    expectedSignature,
  );
};

export const createAdminSessionToken = (
  username,
  options = {},
) => {
  const nowSeconds =
    Math.floor(Date.now() / 1000);

  const ttlSeconds =
    options.ttlSeconds ??
    getSessionTtlSeconds();

  if (
    !Number.isInteger(ttlSeconds) ||
    ttlSeconds < MIN_SESSION_TTL_SECONDS ||
    ttlSeconds > MAX_SESSION_TTL_SECONDS
  ) {
    throw new ApiError(
      500,
      'INVALID_ADMIN_SESSION_TTL',
      'Invalid Admin session duration.',
    );
  }

  const expiresAt =
    nowSeconds + ttlSeconds;

  const payload = {
    sub: cleanText(username, {
      field: 'username',
      required: true,
      minLength: 2,
      maxLength: 100,
    }),
    role: ADMIN_ROLE,
    iat: nowSeconds,
    exp: expiresAt,
    v: 1,
  };

  const encodedPayload =
    encodeBase64Url(
      JSON.stringify(payload),
    );

  const signature =
    signPayload(
      encodedPayload,
      getSessionSecret(),
    );

  return {
    token:
      `${encodedPayload}.${signature}`,
    expiresAt,
    maxAge: ttlSeconds,
    payload,
  };
};

export const verifyAdminSessionToken = (
  token,
) => {
  const value = String(
    token ?? '',
  ).trim();

  if (!value) {
    return null;
  }

  const parts = value.split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [
    encodedPayload,
    signature,
  ] = parts;

  if (
    !encodedPayload ||
    !signature
  ) {
    return null;
  }

  const signatureIsValid =
    verifySignatureWithSecret(
      encodedPayload,
      signature,
      getSessionSecret(),
    ) ||
    verifySignatureWithSecret(
      encodedPayload,
      signature,
      getPreviousSessionSecret(),
    );

  if (!signatureIsValid) {
    return null;
  }

  let payload;

  try {
    payload = JSON.parse(
      decodeBase64Url(
        encodedPayload,
      ),
    );
  } catch {
    return null;
  }

  const nowSeconds =
    Math.floor(Date.now() / 1000);

  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    payload.v !== 1 ||
    payload.role !== ADMIN_ROLE ||
    typeof payload.sub !== 'string' ||
    payload.sub.length < 2 ||
    !Number.isInteger(payload.iat) ||
    !Number.isInteger(payload.exp) ||
    payload.iat > nowSeconds + 60 ||
    payload.exp <= nowSeconds ||
    payload.exp <= payload.iat
  ) {
    return null;
  }

  return {
    username: payload.sub,
    role: payload.role,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  };
};

export const parseCookies = (
  request,
) => {
  const headerValue =
    request?.headers?.cookie;

  if (!headerValue) {
    return {};
  }

  return String(headerValue)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce(
      (cookies, part) => {
        const separatorIndex =
          part.indexOf('=');

        if (separatorIndex < 1) {
          return cookies;
        }

        const key = part
          .slice(0, separatorIndex)
          .trim();

        const rawValue = part
          .slice(separatorIndex + 1)
          .trim();

        if (!key) {
          return cookies;
        }

        try {
          cookies[key] =
            decodeURIComponent(
              rawValue,
            );
        } catch {
          cookies[key] =
            rawValue;
        }

        return cookies;
      },
      {},
    );
};

export const getAdminSession = (
  request,
) => {
  const cookies = parseCookies(request);

  return verifyAdminSessionToken(
    cookies[ADMIN_COOKIE_NAME],
  );
};

export const requireAdmin = (
  request,
) => {
  const session =
    getAdminSession(request);

  if (!session) {
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      'A valid Admin session is required.',
    );
  }

  return session;
};

export const validateAdminCredentials = (
  username,
  password,
) => {
  const submittedUsername =
    cleanText(username, {
      field: 'username',
      required: true,
      minLength: 2,
      maxLength: 100,
    });

  const submittedPassword =
    String(password ?? '');

  if (
    !submittedPassword ||
    submittedPassword.length > 300
  ) {
    return false;
  }

  const configuredUsername =
    getConfiguredUsername();

  const configuredPassword =
    getConfiguredPassword();

  return (
    safeEqualText(
      submittedUsername,
      configuredUsername,
    ) &&
    safeEqualText(
      submittedPassword,
      configuredPassword,
    )
  );
};

const requestUsesHttps = (
  request,
) => {
  if (
    process.env.VERCEL_ENV ===
    'production'
  ) {
    return true;
  }

  const forwardedProto = String(
    request?.headers?.[
      'x-forwarded-proto'
    ] ?? '',
  )
    .split(',')[0]
    .trim()
    .toLowerCase();

  return forwardedProto === 'https';
};

const serializeCookie = (
  name,
  value,
  options = {},
) => {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path || '/'}`,
  ];

  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }

  parts.push(
    `SameSite=${options.sameSite || 'Lax'}`,
  );

  if (options.secure) {
    parts.push('Secure');
  }

  if (
    Number.isInteger(options.maxAge)
  ) {
    parts.push(
      `Max-Age=${options.maxAge}`,
    );
  }

  if (options.expires) {
    parts.push(
      `Expires=${options.expires.toUTCString()}`,
    );
  }

  return parts.join('; ');
};

export const buildAdminSessionCookie = (
  request,
  sessionResult,
) => {
  const token =
    typeof sessionResult === 'string'
      ? sessionResult
      : sessionResult?.token;

  const maxAge =
    typeof sessionResult === 'object'
      ? sessionResult.maxAge
      : getSessionTtlSeconds();

  if (!token) {
    throw new ApiError(
      500,
      'INVALID_ADMIN_SESSION_TOKEN',
      'Unable to create Admin session cookie.',
    );
  }

  return serializeCookie(
    ADMIN_COOKIE_NAME,
    token,
    {
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure:
        requestUsesHttps(request),
      maxAge,
    },
  );
};

export const buildExpiredAdminCookie = (
  request,
) =>
  serializeCookie(
    ADMIN_COOKIE_NAME,
    '',
    {
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure:
        requestUsesHttps(request),
      maxAge: 0,
      expires: new Date(0),
    },
  );
