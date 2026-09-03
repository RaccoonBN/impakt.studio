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
} from '../_lib/http.js';

import {
  buildAdminSessionCookie,
  buildExpiredAdminCookie,
  createAdminSessionToken,
  getAdminSession,
  validateAdminCredentials,
} from '../_lib/adminAuth.js';

import {
  cleanText,
} from '../_lib/validation.js';

const LOGIN_BODY_LIMIT_BYTES =
  8 * 1024;

const INVALID_LOGIN_DELAY_MS =
  350;

const LOCAL_DEVELOPMENT_ORIGINS =
  Object.freeze([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);

const uniqueValues = (
  values,
) =>
  [...new Set(
    values.filter(Boolean),
  )];

const normalizeOrigin = (
  value,
) => {
  const text = String(
    value || '',
  ).trim();

  if (!text) {
    return '';
  }

  try {
    const url =
      text.startsWith('http://') ||
      text.startsWith('https://')
        ? new URL(text)
        : new URL(
            `https://${text}`,
          );

    return url.origin;
  } catch {
    return text.replace(
      /\/+$/,
      '',
    );
  }
};

const isDevelopmentRuntime = () =>
  process.env.VERCEL_ENV ===
    'development' ||
  process.env.NODE_ENV !==
    'production';

const getAllowedAdminOrigins = () => {
  const configuredOrigins =
    parseCommaSeparatedList(
      process.env
        .ADMIN_ALLOWED_ORIGINS ||
      process.env
        .CONTACT_ALLOWED_ORIGINS,
    ).map(normalizeOrigin);

  const vercelOrigins = [
    process.env.VERCEL_URL,
    process.env
      .VERCEL_PROJECT_PRODUCTION_URL,
    process.env
      .VERCEL_BRANCH_URL,
  ].map(normalizeOrigin);

  const developmentOrigins =
    isDevelopmentRuntime()
      ? [
          ...LOCAL_DEVELOPMENT_ORIGINS,
        ]
      : [];

  const allowedOrigins =
    uniqueValues([
      ...configuredOrigins,
      ...vercelOrigins,
      ...developmentOrigins,
    ]);

  if (!allowedOrigins.length) {
    throw new ApiError(
      500,
      'ADMIN_ALLOWED_ORIGINS_NOT_CONFIGURED',
      'Configure ADMIN_ALLOWED_ORIGINS or CONTACT_ALLOWED_ORIGINS.',
    );
  }

  return allowedOrigins;
};

const assertAdminMutationOrigin = (
  request,
) =>
  assertAllowedOrigin(
    request,
    getAllowedAdminOrigins(),
  );

const wait = (
  milliseconds,
) =>
  new Promise((resolve) =>
    setTimeout(
      resolve,
      milliseconds,
    ),
  );

const getPublicSession = (
  session,
) => {
  if (!session) {
    return null;
  }

  return {
    username: session.username,
    role: session.role,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
  };
};

const handleGetSession = (
  request,
  response,
) => {
  const session =
    getAdminSession(request);

  return sendSuccess(
    response,
    {
      authenticated:
        Boolean(session),

      user:
        getPublicSession(
          session,
        ),
    },
  );
};

const handleLogin = async (
  request,
  response,
) => {
  assertAdminMutationOrigin(
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

  const username =
    cleanText(
      body.username,
      {
        field: 'username',
        required: true,
        minLength: 2,
        maxLength: 100,
      },
    );

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
      'INVALID_CREDENTIALS',
      'Username or password is incorrect.',
    );
  }

  const credentialsAreValid =
    validateAdminCredentials(
      username,
      password,
    );

  if (!credentialsAreValid) {
    await wait(
      INVALID_LOGIN_DELAY_MS,
    );

    throw new ApiError(
      401,
      'INVALID_CREDENTIALS',
      'Username or password is incorrect.',
    );
  }

  const sessionResult =
    createAdminSessionToken(
      username,
    );

  response.setHeader(
    'Set-Cookie',
    buildAdminSessionCookie(
      request,
      sessionResult,
    ),
  );

  return sendSuccess(
    response,
    {
      authenticated: true,

      user: {
        username,
        role:
          sessionResult
            .payload.role,
        issuedAt:
          sessionResult
            .payload.iat,
        expiresAt:
          sessionResult
            .expiresAt,
      },
    },
  );
};

const handleLogout = (
  request,
  response,
) => {
  assertAdminMutationOrigin(
    request,
  );

  response.setHeader(
    'Set-Cookie',
    buildExpiredAdminCookie(
      request,
    ),
  );

  return sendSuccess(
    response,
    {
      authenticated: false,
      user: null,
    },
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
        return handleGetSession(
          request,
          response,
        );

      case 'POST':
        return await handleLogin(
          request,
          response,
        );

      case 'DELETE':
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
      'admin/session',
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
