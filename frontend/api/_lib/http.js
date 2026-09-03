/**
 * Shared HTTP helpers for IMPAKT Vercel Functions.
 *
 * This file is a private utility module. It does not expose an API route.
 */

const DEFAULT_BODY_LIMIT_BYTES = 64 * 1024;

export class ApiError extends Error {
  constructor(
    statusCode,
    code,
    message = code,
    details = null,
  ) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = Number(statusCode) || 500;
    this.code = String(code || 'INTERNAL_SERVER_ERROR');
    this.details = details;
  }
}

export const setNoStore = (response) => {
  response.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  );

  response.setHeader('Pragma', 'no-cache');
  response.setHeader('Expires', '0');

  return response;
};

export const sendJson = (
  response,
  statusCode,
  payload,
) => {
  setNoStore(response);

  return response
    .status(statusCode)
    .json(payload);
};

export const sendSuccess = (
  response,
  data = {},
  statusCode = 200,
) =>
  sendJson(response, statusCode, {
    success: true,
    ...data,
  });

export const sendError = (
  response,
  error,
) => {
  const isApiError = error instanceof ApiError;

  const statusCode = isApiError
    ? error.statusCode
    : 500;

  const code = isApiError
    ? error.code
    : 'INTERNAL_SERVER_ERROR';

  const payload = {
    success: false,
    message: code,
  };

  if (
    isApiError &&
    error.details !== null &&
    error.details !== undefined
  ) {
    payload.details = error.details;
  }

  return sendJson(
    response,
    statusCode,
    payload,
  );
};

export const methodNotAllowed = (
  response,
  allowedMethods,
) => {
  const methods = Array.isArray(allowedMethods)
    ? allowedMethods
    : [];

  response.setHeader(
    'Allow',
    methods.join(', '),
  );

  return sendError(
    response,
    new ApiError(
      405,
      'METHOD_NOT_ALLOWED',
      'Method not allowed.',
      { allowedMethods: methods },
    ),
  );
};

const parseJsonString = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    throw new ApiError(
      400,
      'INVALID_JSON',
      'Request body must be valid JSON.',
    );
  }
};

export const readJsonBody = async (
  request,
  options = {},
) => {
  const maxBytes = Number(
    options.maxBytes ??
      DEFAULT_BODY_LIMIT_BYTES,
  );

  if (
    !Number.isFinite(maxBytes) ||
    maxBytes <= 0
  ) {
    throw new ApiError(
      500,
      'INVALID_BODY_LIMIT',
      'Invalid request body limit.',
    );
  }

  if (
    request.body &&
    typeof request.body === 'object' &&
    !Buffer.isBuffer(request.body)
  ) {
    return request.body;
  }

  if (Buffer.isBuffer(request.body)) {
    if (request.body.length > maxBytes) {
      throw new ApiError(
        413,
        'REQUEST_BODY_TOO_LARGE',
        'Request body is too large.',
      );
    }

    const text = request.body
      .toString('utf8')
      .trim();

    return text
      ? parseJsonString(text)
      : {};
  }

  if (typeof request.body === 'string') {
    const byteLength = Buffer.byteLength(
      request.body,
      'utf8',
    );

    if (byteLength > maxBytes) {
      throw new ApiError(
        413,
        'REQUEST_BODY_TOO_LARGE',
        'Request body is too large.',
      );
    }

    const text = request.body.trim();

    return text
      ? parseJsonString(text)
      : {};
  }

  const chunks = [];
  let totalBytes = 0;

  try {
    for await (const chunk of request) {
      const buffer = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);

      totalBytes += buffer.length;

      if (totalBytes > maxBytes) {
        throw new ApiError(
          413,
          'REQUEST_BODY_TOO_LARGE',
          'Request body is too large.',
        );
      }

      chunks.push(buffer);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      400,
      'REQUEST_BODY_READ_FAILED',
      'Unable to read request body.',
    );
  }

  if (!chunks.length) {
    return {};
  }

  const text = Buffer.concat(chunks)
    .toString('utf8')
    .trim();

  return text
    ? parseJsonString(text)
    : {};
};

export const getHeader = (
  request,
  headerName,
) => {
  const targetName = String(
    headerName || '',
  ).toLowerCase();

  if (!targetName) {
    return '';
  }

  const headers = request.headers || {};

  const directValue =
    headers[targetName] ??
    headers[headerName];

  if (Array.isArray(directValue)) {
    return directValue[0] || '';
  }

  return String(directValue || '').trim();
};

export const getClientIp = (request) => {
  const forwardedFor = getHeader(
    request,
    'x-forwarded-for',
  );

  if (forwardedFor) {
    return forwardedFor
      .split(',')[0]
      .trim()
      .slice(0, 100);
  }

  return (
    getHeader(request, 'x-real-ip') ||
    String(
      request.socket?.remoteAddress || '',
    )
  ).slice(0, 100);
};

export const getRequestOrigin = (
  request,
) => {
  const origin = getHeader(
    request,
    'origin',
  );

  if (origin) {
    return origin.replace(/\/+$/, '');
  }

  const protocol =
    getHeader(
      request,
      'x-forwarded-proto',
    ) || 'https';

  const host =
    getHeader(
      request,
      'x-forwarded-host',
    ) ||
    getHeader(request, 'host');

  if (!host) {
    return '';
  }

  return `${protocol}://${host}`
    .replace(/\/+$/, '');
};

export const parseCommaSeparatedList = (
  value,
) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeOrigin = (value) => {
  const text = String(value || '')
    .trim()
    .replace(/\/+$/, '');

  if (!text) {
    return '';
  }

  try {
    const url = new URL(text);

    return url.origin;
  } catch {
    return '';
  }
};

export const isOriginAllowed = (
  requestOrigin,
  allowedOrigins,
) => {
  const normalizedRequestOrigin =
    normalizeOrigin(requestOrigin);

  if (!normalizedRequestOrigin) {
    return false;
  }

  const normalizedAllowedOrigins =
    (Array.isArray(allowedOrigins)
      ? allowedOrigins
      : parseCommaSeparatedList(
          allowedOrigins,
        )
    )
      .map(normalizeOrigin)
      .filter(Boolean);

  return normalizedAllowedOrigins.includes(
    normalizedRequestOrigin,
  );
};

export const assertAllowedOrigin = (
  request,
  allowedOrigins,
  options = {},
) => {
  const allowMissingOrigin =
    options.allowMissingOrigin === true;

  const requestOrigin =
    getRequestOrigin(request);

  const explicitOrigin =
    getHeader(request, 'origin');

  if (
    !explicitOrigin &&
    allowMissingOrigin
  ) {
    return requestOrigin;
  }

  if (
    !isOriginAllowed(
      requestOrigin,
      allowedOrigins,
    )
  ) {
    throw new ApiError(
      403,
      'ORIGIN_NOT_ALLOWED',
      'Request origin is not allowed.',
    );
  }

  return requestOrigin;
};

export const getQueryValue = (
  request,
  key,
) => {
  const query = request.query || {};
  const value = query[key];

  if (Array.isArray(value)) {
    return String(value[0] || '');
  }

  return String(value || '');
};

export const logApiError = (
  scope,
  error,
  context = {},
) => {
  const safeError = {
    name:
      error instanceof Error
        ? error.name
        : 'UnknownError',

    message:
      error instanceof Error
        ? error.message
        : String(error),

    code:
      error instanceof ApiError
        ? error.code
        : undefined,

    statusCode:
      error instanceof ApiError
        ? error.statusCode
        : undefined,
  };

  console.error(
    `[${scope}]`,
    JSON.stringify({
      error: safeError,
      context,
    }),
  );
};
