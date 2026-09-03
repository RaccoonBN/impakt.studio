import {
  randomUUID,
} from 'node:crypto';

import {
  ApiError,
  assertAllowedOrigin,
  getClientIp,
  getHeader,
  getRequestOrigin,
  isOriginAllowed,
  logApiError,
  methodNotAllowed,
  parseCommaSeparatedList,
  readJsonBody,
  sendError,
  sendSuccess,
  setNoStore,
} from './_lib/http.js';

import {
  cleanEmail,
  cleanPhone,
  cleanText,
} from './_lib/validation.js';

import {
  callAppsScript,
} from './_lib/appsScript.js';

const MAX_REQUEST_BYTES =
  64 * 1024;

const PROJECT_TYPE_LABELS =
  Object.freeze({
    personal: Object.freeze({
      vi:
        'Website cá nhân / Landing Page',
      en:
        'Personal website / Landing Page',
    }),

    business: Object.freeze({
      vi:
        'Website doanh nghiệp',
      en:
        'Business website',
    }),

    ecommerce: Object.freeze({
      vi:
        'Website bán hàng / E-commerce',
      en:
        'E-commerce website',
    }),
  });

const PROJECT_TYPES =
  Object.freeze(
    Object.keys(
      PROJECT_TYPE_LABELS,
    ),
  );

const PUBLIC_VALIDATION_CODES =
  new Set([
    'MISSING_FIELDS',
    'INVALID_NAME',
    'INVALID_PHONE',
    'INVALID_EMAIL',
    'INVALID_PROJECT_TYPE',
    'REQUEST_TOO_LARGE',
    'INVALID_JSON',
    'ORIGIN_NOT_ALLOWED',
  ]);

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

const getAllowedContactOrigins = () => {
  const configuredOrigins =
    parseCommaSeparatedList(
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
      'CONTACT_BACKEND_NOT_CONFIGURED',
      'CONTACT_ALLOWED_ORIGINS is not configured.',
    );
  }

  return allowedOrigins;
};

const assertRequestSize = (
  request,
) => {
  const contentLength =
    Number(
      getHeader(
        request,
        'content-length',
      ) || 0,
    );

  if (
    Number.isFinite(
      contentLength,
    ) &&
    contentLength >
      MAX_REQUEST_BYTES
  ) {
    throw new ApiError(
      413,
      'REQUEST_TOO_LARGE',
      'Request body is too large.',
    );
  }
};

const assertParsedBodySize = (
  body,
) => {
  let byteLength = 0;

  try {
    byteLength =
      Buffer.byteLength(
        JSON.stringify(
          body ?? {},
        ),
        'utf8',
      );
  } catch {
    throw new ApiError(
      400,
      'INVALID_JSON',
      'Request body is invalid.',
    );
  }

  if (
    byteLength >
    MAX_REQUEST_BYTES
  ) {
    throw new ApiError(
      413,
      'REQUEST_TOO_LARGE',
      'Request body is too large.',
    );
  }
};

const createSubmissionId = () => {
  const date = new Date();

  const datePart = [
    date.getUTCFullYear(),

    String(
      date.getUTCMonth() + 1,
    ).padStart(2, '0'),

    String(
      date.getUTCDate(),
    ).padStart(2, '0'),
  ].join('');

  const randomPart =
    randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase();

  return [
    'IMP',
    'REQ',
    datePart,
    randomPart,
  ].join('-');
};

const normalizeLocale = (
  value,
) => {
  const locale =
    cleanText(
      value || 'vi-VN',
      {
        field: 'locale',
        maxLength: 20,
      },
    ).toLowerCase();

  return locale.startsWith('en')
    ? 'en-US'
    : 'vi-VN';
};

const getProjectTypeLabel = (
  projectType,
  locale,
) => {
  const language =
    locale.startsWith('en')
      ? 'en'
      : 'vi';

  return (
    PROJECT_TYPE_LABELS[
      projectType
    ]?.[language] ||
    projectType
  );
};

const validateProjectType = (
  value,
) => {
  const projectType =
    cleanText(
      value,
      {
        field:
          'projectType',
        maxLength: 40,
      },
    );

  if (!projectType) {
    return '';
  }

  if (
    !PROJECT_TYPES.includes(
      projectType,
    )
  ) {
    throw new ApiError(
      400,
      'INVALID_PROJECT_TYPE',
      'projectType is invalid.',
    );
  }

  return projectType;
};

const normalizeSourceUrl = (
  value,
  request,
  allowedOrigins,
) => {
  const fallbackOrigin =
    getRequestOrigin(request);

  const sourceUrl =
    cleanText(
      value || fallbackOrigin,
      {
        field: 'sourceUrl',
        maxLength: 500,
      },
    );

  if (!sourceUrl) {
    return '';
  }

  let parsedUrl;

  try {
    parsedUrl =
      new URL(sourceUrl);
  } catch {
    return fallbackOrigin;
  }

  if (
    !['http:', 'https:'].includes(
      parsedUrl.protocol,
    )
  ) {
    return fallbackOrigin;
  }

  if (
    !isOriginAllowed(
      parsedUrl.origin,
      allowedOrigins,
    )
  ) {
    return fallbackOrigin;
  }

  parsedUrl.hash = '';

  return parsedUrl.toString();
};

const validateContactBody = (
  body,
  request,
  allowedOrigins,
) => {
  const name =
    cleanText(
      body.name,
      {
        field: 'name',
        maxLength: 100,
      },
    );

  const phoneText =
    cleanText(
      body.phone,
      {
        field: 'phone',
        maxLength: 30,
      },
    );

  const emailText =
    cleanText(
      body.email,
      {
        field: 'email',
        maxLength: 160,
      },
    );

  const projectType =
    validateProjectType(
      body.projectType,
    );

  const missingFields = [
    ['name', name],
    ['phone', phoneText],
    ['email', emailText],
    [
      'projectType',
      projectType,
    ],
  ]
    .filter(
      ([, value]) =>
        !value,
    )
    .map(
      ([field]) => field,
    );

  if (missingFields.length) {
    throw new ApiError(
      400,
      'MISSING_FIELDS',
      'Required contact fields are missing.',
      {
        fields:
          missingFields,
      },
    );
  }

  if (name.length < 2) {
    throw new ApiError(
      400,
      'INVALID_NAME',
      'name is invalid.',
    );
  }

  let phone;

  try {
    phone = cleanPhone(
      phoneText,
      {
        field: 'phone',
        required: true,
      },
    );
  } catch {
    throw new ApiError(
      400,
      'INVALID_PHONE',
      'phone is invalid.',
    );
  }

  let email;

  try {
    email = cleanEmail(
      emailText,
      {
        field: 'email',
        required: true,
      },
    );
  } catch {
    throw new ApiError(
      400,
      'INVALID_EMAIL',
      'email is invalid.',
    );
  }

  const locale =
    normalizeLocale(
      body.locale,
    );

  return {
    name,
    phone,
    email,
    projectType,

    projectTypeLabel:
      getProjectTypeLabel(
        projectType,
        locale,
      ),

    message:
      cleanText(
        body.message,
        {
          field: 'message',
          maxLength: 3000,
          preserveNewLines:
            true,
        },
      ),

    locale,

    sourceUrl:
      normalizeSourceUrl(
        body.sourceUrl,
        request,
        allowedOrigins,
      ),
  };
};

const mapContactError = (
  error,
) => {
  if (
    error instanceof ApiError &&
    PUBLIC_VALIDATION_CODES.has(
      error.code,
    )
  ) {
    return error;
  }

  if (
    error instanceof ApiError &&
    error.code ===
      'REQUEST_BODY_TOO_LARGE'
  ) {
    return new ApiError(
      413,
      'REQUEST_TOO_LARGE',
      'Request body is too large.',
    );
  }

  if (
    error instanceof ApiError &&
    error.code ===
      'APPS_SCRIPT_TIMEOUT'
  ) {
    return new ApiError(
      504,
      'SHEET_WEBHOOK_TIMEOUT',
      'The contact backend timed out.',
    );
  }

  if (
    error instanceof ApiError &&
    error.code ===
      'APPS_SCRIPT_UNAVAILABLE'
  ) {
    return new ApiError(
      502,
      'SHEET_WEBHOOK_UNAVAILABLE',
      'The contact backend is unavailable.',
    );
  }

  if (
    error instanceof ApiError &&
    [
      'CONTACT_APPS_SCRIPT_URL_NOT_CONFIGURED',
      'INVALID_APPS_SCRIPT_URL',
      'CONTACT_WEBHOOK_TOKEN_NOT_CONFIGURED',
      'CONTACT_WEBHOOK_TOKEN_TOO_LONG',
      'INVALID_APPS_SCRIPT_TIMEOUT',
      'INVALID_APPS_SCRIPT_RETRY_COUNT',
    ].includes(error.code)
  ) {
    return new ApiError(
      500,
      'CONTACT_BACKEND_NOT_CONFIGURED',
      'The contact backend is not configured.',
    );
  }

  if (
    error instanceof ApiError &&
    [
      'INVALID_EMAIL',
      'INVALID_PHONE',
      'INVALID_NAME',
      'INVALID_PROJECT_TYPE',
    ].includes(error.code)
  ) {
    return new ApiError(
      400,
      error.code,
      error.message,
      error.details,
    );
  }

  return new ApiError(
    502,
    'SHEET_WEBHOOK_FAILED',
    'Unable to save the contact request.',
  );
};

const handleHealthCheck = (
  response,
) =>
  sendSuccess(
    response,
    {
      service:
        'IMPAKT Contact API',
      version: 2,
    },
  );

const handleContactSubmission =
  async (
    request,
    response,
  ) => {
    const allowedOrigins =
      getAllowedContactOrigins();

    assertAllowedOrigin(
      request,
      allowedOrigins,
    );

    assertRequestSize(
      request,
    );

    let body;

    try {
      body =
        await readJsonBody(
          request,
          {
            maxBytes:
              MAX_REQUEST_BYTES,
          },
        );
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code ===
          'REQUEST_BODY_TOO_LARGE'
      ) {
        throw new ApiError(
          413,
          'REQUEST_TOO_LARGE',
          'Request body is too large.',
        );
      }

      throw error;
    }

    assertParsedBodySize(
      body,
    );

    const honeypot =
      cleanText(
        body.company,
        {
          field: 'company',
          maxLength: 200,
        },
      );

    if (honeypot) {
      return sendSuccess(
        response,
        {
          ignored: true,
        },
      );
    }

    const submissionId =
      createSubmissionId();

    const contact =
      validateContactBody(
        body,
        request,
        allowedOrigins,
      );

    const payload = {
      submissionId,
      ...contact,

      ipAddress:
        getClientIp(
          request,
        ),

      userAgent:
        cleanText(
          getHeader(
            request,
            'user-agent',
          ),
          {
            field:
              'userAgent',
            maxLength: 500,
          },
        ),

      receivedAt:
        new Date()
          .toISOString(),
    };

    const result =
      await callAppsScript(
        'createLead',
        payload,
        {
          actor:
            'public-contact-form',

          source:
            'contact-api',

          requestId:
            submissionId,
        },
      );

    const resultData =
      result?.data &&
      typeof result.data ===
        'object'
        ? result.data
        : {};

    return sendSuccess(
      response,
      {
        submissionId,

        duplicate:
          Boolean(
            result.duplicate ??
            resultData.duplicate,
          ),

        emailSent:
          (
            result.emailSent ??
            resultData.emailSent
          ) !== false,
      },
      201,
    );
  };

const handleOptions = (
  response,
) => {
  setNoStore(response);

  response.setHeader(
    'Allow',
    'GET, POST, OPTIONS',
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
        return handleHealthCheck(
          response,
        );

      case 'POST':
        return await handleContactSubmission(
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
            'OPTIONS',
          ],
        );
    }
  } catch (error) {
    const mappedError =
      mapContactError(error);

    logApiError(
      'contact',
      mappedError,
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
      mappedError,
    );
  }
}
