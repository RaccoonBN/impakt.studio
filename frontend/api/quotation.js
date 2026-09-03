import {
  createHmac,
  createHash,
  timingSafeEqual,
} from 'node:crypto';

import {
  ApiError,
  assertAllowedOrigin,
  getClientIp,
  getHeader,
  logApiError,
  methodNotAllowed,
  parseCommaSeparatedList,
  readJsonBody,
  sendError,
  sendSuccess,
  setNoStore,
} from './_lib/http.js';

import {
  buildExpiredAdminCookie,
  getAdminSession,
  parseCookies,
} from './_lib/adminAuth.js';

const QUOTATION_COOKIE_NAME =
  'impakt_quote_session';

const QUOTATION_ROLE =
  'quotation';

const DEFAULT_SESSION_TTL_SECONDS =
  12 * 60 * 60;

const MIN_SESSION_TTL_SECONDS =
  15 * 60;

const MAX_SESSION_TTL_SECONDS =
  7 * 24 * 60 * 60;

const MIN_SECRET_LENGTH = 32;

const LOGIN_BODY_LIMIT_BYTES =
  8 * 1024;

const INVALID_LOGIN_DELAY_MS =
  350;

const normalizeEnvironmentUrl = (
  value,
) => {
  const text = String(
    value || '',
  ).trim();

  if (!text) {
    return '';
  }

  if (
    text.startsWith('http://') ||
    text.startsWith('https://')
  ) {
    return text;
  }

  return `https://${text}`;
};

const getAllowedOrigins = () => {
  const configuredOrigins =
    parseCommaSeparatedList(
      process.env
        .ADMIN_ALLOWED_ORIGINS ||
      process.env
        .CONTACT_ALLOWED_ORIGINS,
    );

  const vercelOrigins = [
    normalizeEnvironmentUrl(
      process.env.VERCEL_URL,
    ),

    normalizeEnvironmentUrl(
      process.env
        .VERCEL_PROJECT_PRODUCTION_URL,
    ),

    normalizeEnvironmentUrl(
      process.env
        .VERCEL_BRANCH_URL,
    ),
  ];

  const allowedOrigins = [
    ...new Set([
      ...configuredOrigins,
      ...vercelOrigins,
    ]),
  ].filter(Boolean);

  if (!allowedOrigins.length) {
    throw new ApiError(
      500,
      'QUOTE_ALLOWED_ORIGINS_NOT_CONFIGURED',
      'Configure ADMIN_ALLOWED_ORIGINS or CONTACT_ALLOWED_ORIGINS.',
    );
  }

  return allowedOrigins;
};

const assertQuotationOrigin = (
  request,
) =>
  assertAllowedOrigin(
    request,
    getAllowedOrigins(),
  );

const getQuotationPassword = () => {
  const password = String(
    process.env
      .QUOTE_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    '',
  );

  if (!password) {
    throw new ApiError(
      500,
      'QUOTE_ADMIN_PASSWORD_NOT_CONFIGURED',
      'Configure QUOTE_ADMIN_PASSWORD or ADMIN_PASSWORD.',
    );
  }

  if (password.length < 10) {
    throw new ApiError(
      500,
      'QUOTE_ADMIN_PASSWORD_TOO_WEAK',
      'Quotation password must contain at least 10 characters.',
    );
  }

  if (password.length > 300) {
    throw new ApiError(
      500,
      'QUOTE_ADMIN_PASSWORD_TOO_LONG',
      'Quotation password is too long.',
    );
  }

  return password;
};

const getQuotationSessionSecret = () => {
  const secret = String(
    process.env
      .QUOTE_SESSION_SECRET ||
    process.env
      .ADMIN_SESSION_SECRET ||
    '',
  );

  if (
    secret.length <
    MIN_SECRET_LENGTH
  ) {
    throw new ApiError(
      500,
      'SESSION_NOT_CONFIGURED',
      `Configure QUOTE_SESSION_SECRET or ADMIN_SESSION_SECRET with at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }

  return secret;
};

const getPreviousQuotationSecret = () => {
  const secret = String(
    process.env
      .QUOTE_SESSION_SECRET_PREVIOUS ||
    process.env
      .ADMIN_SESSION_SECRET_PREVIOUS ||
    '',
  );

  return secret.length >=
    MIN_SECRET_LENGTH
    ? secret
    : '';
};

const getSessionTtlSeconds = () => {
  const rawValue =
    process.env
      .QUOTE_SESSION_TTL_SECONDS ??
    process.env
      .ADMIN_SESSION_TTL_SECONDS ??
    DEFAULT_SESSION_TTL_SECONDS;

  const value = Number(rawValue);

  if (
    !Number.isInteger(value) ||
    value <
      MIN_SESSION_TTL_SECONDS ||
    value >
      MAX_SESSION_TTL_SECONDS
  ) {
    throw new ApiError(
      500,
      'INVALID_QUOTE_SESSION_TTL',
      `Quotation session TTL must be an integer from ${MIN_SESSION_TTL_SECONDS} to ${MAX_SESSION_TTL_SECONDS}.`,
    );
  }

  return value;
};

const safeEqualPassword = (
  submitted,
  configured,
) => {
  const left =
    createHash('sha256')
      .update(
        String(
          submitted ?? '',
        ),
        'utf8',
      )
      .digest();

  const right =
    createHash('sha256')
      .update(
        String(
          configured ?? '',
        ),
        'utf8',
      )
      .digest();

  return timingSafeEqual(
    left,
    right,
  );
};

const encodeBase64Url = (
  value,
) =>
  Buffer.from(
    value,
    'utf8',
  ).toString('base64url');

const decodeBase64Url = (
  value,
) =>
  Buffer.from(
    value,
    'base64url',
  ).toString('utf8');

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

const safeEqualSignature = (
  left,
  right,
) => {
  const leftBuffer =
    Buffer.from(
      String(left || ''),
      'utf8',
    );

  const rightBuffer =
    Buffer.from(
      String(right || ''),
      'utf8',
    );

  if (
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

const createQuotationSessionToken =
  () => {
    const nowSeconds =
      Math.floor(
        Date.now() / 1000,
      );

    const ttlSeconds =
      getSessionTtlSeconds();

    const payload = {
      sub:
        String(
          process.env
            .ADMIN_USERNAME ||
          'quotation-admin',
        ).trim() ||
        'quotation-admin',

      role:
        QUOTATION_ROLE,

      iat:
        nowSeconds,

      exp:
        nowSeconds +
        ttlSeconds,

      v: 2,
    };

    const encodedPayload =
      encodeBase64Url(
        JSON.stringify(
          payload,
        ),
      );

    const signature =
      signPayload(
        encodedPayload,
        getQuotationSessionSecret(),
      );

    return {
      token:
        `${encodedPayload}.${signature}`,

      payload,

      maxAge:
        ttlSeconds,
    };
  };

const verifyQuotationTokenWithSecret = (
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

  return safeEqualSignature(
    signature,
    expectedSignature,
  );
};

const verifyQuotationSessionToken = (
  token,
) => {
  const value = String(
    token || '',
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

  const validSignature =
    verifyQuotationTokenWithSecret(
      encodedPayload,
      signature,
      getQuotationSessionSecret(),
    ) ||
    verifyQuotationTokenWithSecret(
      encodedPayload,
      signature,
      getPreviousQuotationSecret(),
    );

  if (!validSignature) {
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
    Math.floor(
      Date.now() / 1000,
    );

  if (
    !payload ||
    typeof payload !==
      'object' ||
    Array.isArray(payload) ||
    payload.v !== 2 ||
    payload.role !==
      QUOTATION_ROLE ||
    typeof payload.sub !==
      'string' ||
    !Number.isInteger(
      payload.iat,
    ) ||
    !Number.isInteger(
      payload.exp,
    ) ||
    payload.iat >
      nowSeconds + 60 ||
    payload.exp <=
      nowSeconds ||
    payload.exp <=
      payload.iat
  ) {
    return null;
  }

  return {
    username:
      payload.sub,

    role:
      payload.role,

    issuedAt:
      payload.iat,

    expiresAt:
      payload.exp,
  };
};

const getQuotationSession = (
  request,
) => {
  const cookies =
    parseCookies(request);

  const token =
    cookies[
      QUOTATION_COOKIE_NAME
    ];

  if (!token) {
    return null;
  }

  try {
    return verifyQuotationSessionToken(
      token,
    );
  } catch (
    error
  ) {
    if (
      error instanceof ApiError &&
      error.statusCode === 500
    ) {
      return null;
    }

    throw error;
  }
};

const requestUsesHttps = (
  request,
) => {
  if (
    process.env.VERCEL_ENV ===
      'production' ||
    process.env.VERCEL_ENV ===
      'preview' ||
    process.env.NODE_ENV ===
      'production'
  ) {
    return true;
  }

  const forwardedProto =
    String(
      getHeader(
        request,
        'x-forwarded-proto',
      ),
    )
      .split(',')[0]
      .trim()
      .toLowerCase();

  return forwardedProto ===
    'https';
};

const serializeCookie = (
  name,
  value,
  options = {},
) => {
  const parts = [
    `${name}=${encodeURIComponent(
      value,
    )}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
  ];

  if (options.secure) {
    parts.push('Secure');
  }

  if (
    Number.isInteger(
      options.maxAge,
    )
  ) {
    parts.push(
      `Max-Age=${options.maxAge}`,
    );
  }

  if (options.expires) {
    parts.push(
      `Expires=${
        options.expires
          .toUTCString()
      }`,
    );
  }

  return parts.join('; ');
};

const buildQuotationCookie = (
  request,
  sessionResult,
) =>
  serializeCookie(
    QUOTATION_COOKIE_NAME,
    sessionResult.token,
    {
      secure:
        requestUsesHttps(
          request,
        ),

      maxAge:
        sessionResult.maxAge,
    },
  );

const buildExpiredQuotationCookie = (
  request,
) =>
  serializeCookie(
    QUOTATION_COOKIE_NAME,
    '',
    {
      secure:
        requestUsesHttps(
          request,
        ),

      maxAge: 0,

      expires:
        new Date(0),
    },
  );

const getAccessSession = (
  request,
) => {
  let adminSession = null;

  try {
    adminSession =
      getAdminSession(
        request,
      );
  } catch (
    error
  ) {
    if (
      !(
        error instanceof ApiError &&
        error.statusCode === 500
      )
    ) {
      throw error;
    }
  }

  if (adminSession) {
    return {
      access: 'admin',
      session:
        adminSession,
    };
  }

  const quotationSession =
    getQuotationSession(
      request,
    );

  if (
    quotationSession
  ) {
    return {
      access:
        'quotation',

      session:
        quotationSession,
    };
  }

  return {
    access: null,
    session: null,
  };
};

const wait = (
  milliseconds,
) =>
  new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds,
      ),
  );

const handleStatus = (
  request,
  response,
) => {
  const accessSession =
    getAccessSession(
      request,
    );

  return sendSuccess(
    response,
    {
      authenticated:
        Boolean(
          accessSession.session,
        ),

      access:
        accessSession.access,

      user:
        accessSession.session
          ? {
              username:
                accessSession
                  .session
                  .username,

              role:
                accessSession
                  .session
                  .role,

              expiresAt:
                accessSession
                  .session
                  .expiresAt,
            }
          : null,
    },
  );
};

const handleLogin = async (
  request,
  response,
  body,
) => {
  const password =
    String(
      body.password ?? '',
    );

  if (
    !password ||
    password.length > 300
  ) {
    await wait(
      INVALID_LOGIN_DELAY_MS,
    );

    throw new ApiError(
      401,
      'INVALID_PASSWORD',
      'Password is incorrect.',
    );
  }

  const configuredPassword =
    getQuotationPassword();

  if (
    !safeEqualPassword(
      password,
      configuredPassword,
    )
  ) {
    await wait(
      INVALID_LOGIN_DELAY_MS,
    );

    throw new ApiError(
      401,
      'INVALID_PASSWORD',
      'Password is incorrect.',
    );
  }

  const sessionResult =
    createQuotationSessionToken();

  response.setHeader(
    'Set-Cookie',
    buildQuotationCookie(
      request,
      sessionResult,
    ),
  );

  return sendSuccess(
    response,
    {
      authenticated: true,
      access:
        'quotation',

      user: {
        username:
          sessionResult
            .payload.sub,

        role:
          sessionResult
            .payload.role,

        expiresAt:
          sessionResult
            .payload.exp,
      },
    },
  );
};

const handleLogout = (
  request,
  response,
) => {
  response.setHeader(
    'Set-Cookie',
    [
      buildExpiredQuotationCookie(
        request,
      ),

      buildExpiredAdminCookie(
        request,
      ),
    ],
  );

  return sendSuccess(
    response,
    {
      authenticated: false,
      access: null,
      user: null,
    },
  );
};

const handlePost = async (
  request,
  response,
) => {
  assertQuotationOrigin(
    request,
  );

  const body =
    await readJsonBody(
      request,
      {
        maxBytes:
          LOGIN_BODY_LIMIT_BYTES,
      },
    );

  const action =
    String(
      body.action || '',
    )
      .trim()
      .toLowerCase();

  if (action === 'login') {
    return handleLogin(
      request,
      response,
      body,
    );
  }

  if (action === 'logout') {
    return handleLogout(
      request,
      response,
    );
  }

  throw new ApiError(
    400,
    'INVALID_ACTION',
    'action must be login or logout.',
  );
};

const handleOptions = (
  response,
) => {
  setNoStore(response);

  response.setHeader(
    'Allow',
    'GET, POST, DELETE, OPTIONS',
  );

  return response
    .status(204)
    .end();
};

export default async function handler(
  request,
  response,
) {
  setNoStore(response);

  try {
    switch (request.method) {
      case 'GET':
        return handleStatus(
          request,
          response,
        );

      case 'POST':
        return await handlePost(
          request,
          response,
        );

      case 'DELETE':
        assertQuotationOrigin(
          request,
        );

        return handleLogout(
          request,
          response,
        );

      case 'OPTIONS':
        return handleOptions(
          response,
        );

      default:
        return methodNotAllowed(
          response,
          [
            'GET',
            'POST',
            'DELETE',
            'OPTIONS',
          ],
        );
    }
  } catch (error) {
    logApiError(
      'quotation-access',
      error,
      {
        method:
          request.method,

        clientIp:
          getClientIp(
            request,
          ),

        origin:
          getHeader(
            request,
            'origin',
          ),
      },
    );

    return sendError(
      response,
      error,
    );
  }
}
