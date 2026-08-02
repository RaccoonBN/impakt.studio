import { randomUUID } from 'node:crypto';

const MAX_REQUEST_BYTES = 64 * 1024;
const WEBHOOK_TIMEOUT_MS = 15_000;

const PROJECT_TYPE_LABELS = Object.freeze({
  personal: {
    vi: 'Website cá nhân / Landing Page',
    en: 'Personal website / Landing Page',
  },
  business: {
    vi: 'Website doanh nghiệp',
    en: 'Business website',
  },
  ecommerce: {
    vi: 'Website bán hàng / E-commerce',
    en: 'E-commerce website',
  },
});

const cleanText = (value, maxLength) =>
  String(value ?? '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidPhone = (value) =>
  /^[+()\d\s.-]{7,30}$/.test(value);

const jsonResponse = (response, status, payload) => {
  response.status(status);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
};

const getAllowedOrigins = () =>
  String(process.env.CONTACT_ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const isAllowedOrigin = (request) => {
  const allowedOrigins = getAllowedOrigins();

  if (!allowedOrigins.length) {
    return true;
  }

  const origin = cleanText(request.headers.origin, 500);

  // Một số request server-to-server không có Origin.
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin);
};

const readRequestBody = async (request) => {
  if (
    request.body &&
    typeof request.body === 'object' &&
    !Buffer.isBuffer(request.body)
  ) {
    return request.body;
  }

  if (typeof request.body === 'string') {
    return JSON.parse(request.body);
  }

  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk);

    totalBytes += buffer.length;

    if (totalBytes > MAX_REQUEST_BYTES) {
      throw new Error('REQUEST_TOO_LARGE');
    }

    chunks.push(buffer);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(
    Buffer.concat(chunks).toString('utf8'),
  );
};

const getClientIp = (request) => {
  const forwardedFor = cleanText(
    request.headers['x-forwarded-for'],
    500,
  );

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return cleanText(
    request.headers['x-real-ip'] ||
      request.socket?.remoteAddress ||
      '',
    100,
  );
};

const createSubmissionId = () => {
  const date = new Date();
  const stamp = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('');

  const randomPart = randomUUID()
    .replace(/-/g, '')
    .slice(0, 8)
    .toUpperCase();

  return `IMP-REQ-${stamp}-${randomPart}`;
};

const getProjectTypeLabel = (
  projectType,
  locale,
) => {
  const language = String(locale || '')
    .toLowerCase()
    .startsWith('en')
    ? 'en'
    : 'vi';

  return (
    PROJECT_TYPE_LABELS[projectType]?.[language] ||
    projectType
  );
};

const parseAppsScriptResult = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export default async function handler(
  request,
  response,
) {
  response.setHeader(
    'Allow',
    'GET, POST, OPTIONS',
  );

  if (request.method === 'OPTIONS') {
    return jsonResponse(response, 204, {});
  }

  if (request.method === 'GET') {
    return jsonResponse(response, 200, {
      success: true,
      service: 'IMPAKT Contact API',
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse(response, 405, {
      success: false,
      message: 'METHOD_NOT_ALLOWED',
    });
  }

  if (!isAllowedOrigin(request)) {
    return jsonResponse(response, 403, {
      success: false,
      message: 'ORIGIN_NOT_ALLOWED',
    });
  }

  const contentLength = Number(
    request.headers['content-length'] || 0,
  );

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_REQUEST_BYTES
  ) {
    return jsonResponse(response, 413, {
      success: false,
      message: 'REQUEST_TOO_LARGE',
    });
  }

  const webhookUrl = cleanText(
    process.env.CONTACT_APPS_SCRIPT_URL,
    2000,
  );

  const webhookToken = cleanText(
    process.env.CONTACT_WEBHOOK_TOKEN,
    1000,
  );

  if (!webhookUrl || !webhookToken) {
    console.error(
      'Missing CONTACT_APPS_SCRIPT_URL or CONTACT_WEBHOOK_TOKEN.',
    );

    return jsonResponse(response, 500, {
      success: false,
      message: 'CONTACT_BACKEND_NOT_CONFIGURED',
    });
  }

  let body;

  try {
    body = await readRequestBody(request);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'INVALID_JSON';

    return jsonResponse(
      response,
      message === 'REQUEST_TOO_LARGE'
        ? 413
        : 400,
      {
        success: false,
        message:
          message === 'REQUEST_TOO_LARGE'
            ? message
            : 'INVALID_JSON',
      },
    );
  }

  // Honeypot: bot thường tự điền trường ẩn "company".
  // Trả success giả để bot không thử gửi lại liên tục.
  const honeypot = cleanText(body.company, 200);

  if (honeypot) {
    return jsonResponse(response, 200, {
      success: true,
      ignored: true,
    });
  }

  const name = cleanText(body.name, 100);
  const phone = cleanText(body.phone, 30);
  const email = cleanText(body.email, 160);
  const projectType = cleanText(
    body.projectType,
    40,
  );
  const message = cleanText(body.message, 3000);
  const locale = cleanText(
    body.locale || 'vi-VN',
    20,
  );
  const sourceUrl = cleanText(
    body.sourceUrl,
    500,
  );

  const missingFields = [
    ['name', name],
    ['phone', phone],
    ['email', email],
    ['projectType', projectType],
  ]
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (missingFields.length) {
    return jsonResponse(response, 400, {
      success: false,
      message: 'MISSING_FIELDS',
      fields: missingFields,
    });
  }

  if (name.length < 2) {
    return jsonResponse(response, 400, {
      success: false,
      message: 'INVALID_NAME',
    });
  }

  if (!isValidPhone(phone)) {
    return jsonResponse(response, 400, {
      success: false,
      message: 'INVALID_PHONE',
    });
  }

  if (!isValidEmail(email)) {
    return jsonResponse(response, 400, {
      success: false,
      message: 'INVALID_EMAIL',
    });
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      PROJECT_TYPE_LABELS,
      projectType,
    )
  ) {
    return jsonResponse(response, 400, {
      success: false,
      message: 'INVALID_PROJECT_TYPE',
    });
  }


  const submissionId = createSubmissionId();

  const payload = {
    submissionId,
    name,
    phone,
    email,
    projectType,
    projectTypeLabel: getProjectTypeLabel(
      projectType,
      locale,
    ),
    message,
    locale,
    sourceUrl,
    ipAddress: getClientIp(request),
    userAgent: cleanText(
      request.headers['user-agent'],
      500,
    ),
    receivedAt: new Date().toISOString(),
  };

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    WEBHOOK_TIMEOUT_MS,
  );

  try {
    const webhookResponse = await fetch(
      webhookUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json; charset=utf-8',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          token: webhookToken,
          payload,
        }),
        redirect: 'follow',
        signal: controller.signal,
      },
    );

    const responseText =
      await webhookResponse.text();

    const webhookResult =
      parseAppsScriptResult(responseText);

    if (
      !webhookResponse.ok ||
      !webhookResult?.success
    ) {
      console.error(
        'Apps Script webhook failed:',
        {
          status: webhookResponse.status,
          result: webhookResult,
          responseText: responseText.slice(
            0,
            1000,
          ),
        },
      );

      return jsonResponse(response, 502, {
        success: false,
        message: 'SHEET_WEBHOOK_FAILED',
      });
    }

    return jsonResponse(response, 201, {
      success: true,
      submissionId,
      duplicate:
        Boolean(webhookResult.duplicate),
      emailSent:
        webhookResult.emailSent !== false,
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      error.name === 'AbortError';

    console.error(
      'Contact API failed:',
      error,
    );

    return jsonResponse(response, 502, {
      success: false,
      message: isTimeout
        ? 'SHEET_WEBHOOK_TIMEOUT'
        : 'SHEET_WEBHOOK_UNAVAILABLE',
    });
  } finally {
    clearTimeout(timeout);
  }
}
