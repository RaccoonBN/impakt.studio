import {
  randomUUID,
} from 'node:crypto';

import {
  ApiError,
} from './http.js';

import {
  cleanText,
} from './validation.js';

const DEFAULT_TIMEOUT_MS = 15_000;
const MIN_TIMEOUT_MS = 3_000;
const MAX_TIMEOUT_MS = 30_000;
const DEFAULT_RETRY_COUNT = 1;
const MAX_RETRY_COUNT = 2;

const RETRYABLE_HTTP_STATUSES = new Set([
  408,
  425,
  429,
  500,
  502,
  503,
  504,
]);

const sleep = (milliseconds) =>
  new Promise((resolve) =>
    setTimeout(resolve, milliseconds),
  );

const getTimeoutMs = (
  overrideValue,
) => {
  const rawValue =
    overrideValue ??
    process.env
      .APPS_SCRIPT_TIMEOUT_MS ??
    DEFAULT_TIMEOUT_MS;

  const timeoutMs = Number(rawValue);

  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < MIN_TIMEOUT_MS ||
    timeoutMs > MAX_TIMEOUT_MS
  ) {
    throw new ApiError(
      500,
      'INVALID_APPS_SCRIPT_TIMEOUT',
      `APPS_SCRIPT_TIMEOUT_MS must be an integer from ${MIN_TIMEOUT_MS} to ${MAX_TIMEOUT_MS}.`,
    );
  }

  return timeoutMs;
};

const getRetryCount = (
  overrideValue,
) => {
  const rawValue =
    overrideValue ??
    process.env
      .APPS_SCRIPT_RETRY_COUNT ??
    DEFAULT_RETRY_COUNT;

  const retryCount = Number(rawValue);

  if (
    !Number.isInteger(retryCount) ||
    retryCount < 0 ||
    retryCount > MAX_RETRY_COUNT
  ) {
    throw new ApiError(
      500,
      'INVALID_APPS_SCRIPT_RETRY_COUNT',
      `APPS_SCRIPT_RETRY_COUNT must be an integer from 0 to ${MAX_RETRY_COUNT}.`,
    );
  }

  return retryCount;
};

const validateAppsScriptUrl = (
  value,
) => {
  const rawUrl = cleanText(value, {
    field:
      'CONTACT_APPS_SCRIPT_URL',
    required: true,
    maxLength: 1000,
  });

  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new ApiError(
      500,
      'INVALID_APPS_SCRIPT_URL',
      'CONTACT_APPS_SCRIPT_URL is invalid.',
    );
  }

  const allowedHosts = new Set([
    'script.google.com',
    'script.googleusercontent.com',
  ]);

  if (
    url.protocol !== 'https:' ||
    !allowedHosts.has(url.hostname)
  ) {
    throw new ApiError(
      500,
      'INVALID_APPS_SCRIPT_URL',
      'CONTACT_APPS_SCRIPT_URL must use an HTTPS Google Apps Script URL.',
    );
  }

  return url.toString();
};

const getWebhookToken = () => {
  const token = String(
    process.env
      .CONTACT_WEBHOOK_TOKEN ??
      '',
  );

  if (token.length < 16) {
    throw new ApiError(
      500,
      'CONTACT_WEBHOOK_TOKEN_NOT_CONFIGURED',
      'CONTACT_WEBHOOK_TOKEN must contain at least 16 characters.',
    );
  }

  if (token.length > 500) {
    throw new ApiError(
      500,
      'CONTACT_WEBHOOK_TOKEN_TOO_LONG',
      'CONTACT_WEBHOOK_TOKEN is too long.',
    );
  }

  return token;
};

export const getAppsScriptConfig = (
  options = {},
) => ({
  url: validateAppsScriptUrl(
    options.url ??
      process.env
        .CONTACT_APPS_SCRIPT_URL,
  ),

  token:
    options.token ??
    getWebhookToken(),

  timeoutMs: getTimeoutMs(
    options.timeoutMs,
  ),

  retryCount: getRetryCount(
    options.retryCount,
  ),
});

const parseAppsScriptResponse = (
  responseText,
) => {
  if (!responseText) {
    throw new ApiError(
      502,
      'EMPTY_APPS_SCRIPT_RESPONSE',
      'Google Apps Script returned an empty response.',
    );
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new ApiError(
      502,
      'INVALID_APPS_SCRIPT_RESPONSE',
      'Google Apps Script returned invalid JSON.',
      {
        responsePreview:
          responseText.slice(0, 500),
      },
    );
  }
};

const createRequestMeta = (
  options,
) => {
  const actor = cleanText(
    options.actor,
    {
      field: 'actor',
      maxLength: 100,
    },
  );

  const source = cleanText(
    options.source ||
      'vercel-api',
    {
      field: 'source',
      maxLength: 100,
    },
  );

  return {
    requestId:
      cleanText(
        options.requestId ||
          randomUUID(),
        {
          field: 'requestId',
          required: true,
          maxLength: 100,
        },
      ),

    requestedAt:
      new Date().toISOString(),

    actor,
    source,
  };
};

const shouldRetry = (
  error,
  attempt,
  retryCount,
) => {
  if (attempt >= retryCount) {
    return false;
  }

  if (
    error instanceof ApiError &&
    error.code ===
      'APPS_SCRIPT_TIMEOUT'
  ) {
    return true;
  }

  if (
    error instanceof ApiError &&
    error.details?.httpStatus &&
    RETRYABLE_HTTP_STATUSES.has(
      error.details.httpStatus,
    )
  ) {
    return true;
  }

  return (
    error instanceof TypeError ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'ENOTFOUND'
  );
};

const getRetryDelayMs = (
  attempt,
) =>
  Math.min(
    350 * 2 ** attempt,
    1_500,
  );

const mapAppsScriptFailure = (
  result,
  httpStatus,
) => {
  const remoteCode = cleanText(
    result?.message ||
      result?.error ||
      'APPS_SCRIPT_REQUEST_FAILED',
    {
      field: 'remoteCode',
      maxLength: 200,
    },
  );

  const configurationErrors =
    new Set([
      'UNAUTHORIZED',
      'MISSING_SCRIPT_PROPERTIES',
      'UNKNOWN_ACTION',
    ]);

  const notFoundErrors =
    new Set([
      'LEAD_NOT_FOUND',
      'CUSTOMER_NOT_FOUND',
      'PROJECT_NOT_FOUND',
      'QUOTATION_NOT_FOUND',
      'CONTRACT_NOT_FOUND',
    ]);

  const conflictErrors =
    new Set([
      'DUPLICATE_CUSTOMER',
      'DUPLICATE_PROJECT',
      'DUPLICATE_QUOTATION',
      'DUPLICATE_CONTRACT',
      'RECORD_ALREADY_EXISTS',
    ]);

  let statusCode = 502;

  if (
    notFoundErrors.has(remoteCode)
  ) {
    statusCode = 404;
  } else if (
    conflictErrors.has(remoteCode)
  ) {
    statusCode = 409;
  } else if (
    configurationErrors.has(remoteCode)
  ) {
    statusCode = 502;
  } else if (
    remoteCode.startsWith(
      'INVALID_',
    ) ||
    remoteCode.startsWith(
      'MISSING_',
    ) ||
    remoteCode.endsWith(
      '_REQUIRED',
    )
  ) {
    statusCode = 400;
  }

  return new ApiError(
    statusCode,
    remoteCode,
    'Google Apps Script rejected the request.',
    {
      httpStatus,
      remote:
        result &&
        typeof result === 'object'
          ? result
          : null,
    },
  );
};

const executeRequest = async (
  action,
  payload,
  options,
) => {
  const config =
    getAppsScriptConfig(options);

  const meta =
    createRequestMeta(options);

  const requestBody = {
    token: config.token,
    action,
    payload,
    meta,
  };

  const controller =
    new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    config.timeoutMs,
  );

  try {
    const response = await fetch(
      config.url,
      {
        method: 'POST',

        headers: {
          Accept:
            'application/json',
          'Content-Type':
            'application/json; charset=utf-8',
          'User-Agent':
            'IMPAKT-Vercel-API/1.0',
        },

        body: JSON.stringify(
          requestBody,
        ),

        redirect: 'follow',
        signal: controller.signal,
      },
    );

    const responseText =
      await response.text();

    const result =
      parseAppsScriptResponse(
        responseText,
      );

    if (
      !response.ok ||
      result?.success !== true
    ) {
      throw mapAppsScriptFailure(
        result,
        response.status,
      );
    }

    return {
      ...result,
      requestId:
        result.requestId ||
        meta.requestId,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      throw new ApiError(
        504,
        'APPS_SCRIPT_TIMEOUT',
        'Google Apps Script did not respond in time.',
        {
          timeoutMs:
            config.timeoutMs,
        },
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      502,
      'APPS_SCRIPT_UNAVAILABLE',
      'Unable to connect to Google Apps Script.',
      {
        cause:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );
  } finally {
    clearTimeout(timeout);
  }
};

export const callAppsScript = async (
  action,
  payload = {},
  options = {},
) => {
  const normalizedAction =
    cleanText(action, {
      field: 'action',
      required: true,
      minLength: 2,
      maxLength: 80,
    });

  if (
    payload === null ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw new ApiError(
      400,
      'INVALID_APPS_SCRIPT_PAYLOAD',
      'Apps Script payload must be an object.',
    );
  }

  const retryCount =
    getRetryCount(
      options.retryCount,
    );

  let lastError;

  for (
    let attempt = 0;
    attempt <= retryCount;
    attempt += 1
  ) {
    try {
      return await executeRequest(
        normalizedAction,
        payload,
        {
          ...options,
          retryCount,
        },
      );
    } catch (error) {
      lastError = error;

      if (
        !shouldRetry(
          error,
          attempt,
          retryCount,
        )
      ) {
        throw error;
      }

      await sleep(
        getRetryDelayMs(attempt),
      );
    }
  }

  throw (
    lastError ||
    new ApiError(
      502,
      'APPS_SCRIPT_REQUEST_FAILED',
      'Google Apps Script request failed.',
    )
  );
};

export const checkAppsScriptHealth =
  async (options = {}) =>
    callAppsScript(
      'healthCheck',
      {},
      {
        ...options,
        retryCount: 0,
      },
    );
