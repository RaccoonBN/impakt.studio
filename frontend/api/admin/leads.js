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
  requireAdmin,
} from '../_lib/adminAuth.js';

import {
  LEAD_STATUSES,
  cleanEnum,
  cleanText,
  validateLeadUpdate,
  validatePagination,
} from '../_lib/validation.js';

import {
  callAppsScript,
} from '../_lib/appsScript.js';

const UPDATE_BODY_LIMIT_BYTES =
  16 * 1024;

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

const getAllowedAdminOrigins = () => {
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

const getFirstDefined = (
  object,
  keys,
  fallback = '',
) => {
  if (
    !object ||
    typeof object !== 'object'
  ) {
    return fallback;
  }

  for (const key of keys) {
    const value = object[key];

    if (
      value !== undefined &&
      value !== null
    ) {
      return value;
    }
  }

  return fallback;
};

const getLeadStatus = (
  lead,
) =>
  cleanText(
    getFirstDefined(
      lead,
      [
        'status',
        'contactStatus',
        'trangThai',
        'Trạng thái',
      ],
    ),
    {
      field: 'lead.status',
      maxLength: 100,
    },
  );

const getLeadDateValue = (
  lead,
) => {
  const value = getFirstDefined(
    lead,
    [
      'submittedAt',
      'createdAt',
      'receivedAt',
      'timestamp',
      'time',
      'Thời gian tiếp nhận',
    ],
  );

  const time = Date.parse(
    String(value || ''),
  );

  return Number.isNaN(time)
    ? 0
    : time;
};

const extractLeads = (
  result,
) => {
  const candidates = [
    result?.leads,
    result?.data?.leads,
    result?.data,
    result?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const hasRemotePagination = (
  result,
) =>
  Boolean(
    result?.pagination &&
      Number.isFinite(
        Number(
          result.pagination.total,
        ),
      ),
  ) ||
  (
    Number.isFinite(
      Number(result?.total),
    ) &&
    Number.isFinite(
      Number(result?.page),
    )
  );

const buildSearchText = (
  lead,
) =>
  [
    getFirstDefined(
      lead,
      [
        'submissionId',
        'leadId',
        'id',
        'Mã yêu cầu',
      ],
    ),

    getFirstDefined(
      lead,
      [
        'name',
        'fullName',
        'customerName',
        'Họ và tên',
      ],
    ),

    getFirstDefined(
      lead,
      [
        'phone',
        'phoneNumber',
        'Số điện thoại',
      ],
    ),

    getFirstDefined(
      lead,
      [
        'email',
        'Email',
      ],
    ),

    getFirstDefined(
      lead,
      [
        'projectType',
        'websiteType',
        'serviceType',
        'Loại website',
      ],
    ),

    getFirstDefined(
      lead,
      [
        'message',
        'content',
        'requestContent',
        'Nội dung yêu cầu',
      ],
    ),

    getFirstDefined(
      lead,
      [
        'notes',
        'internalNotes',
        'Ghi chú nội bộ',
      ],
    ),
  ]
    .map((value) =>
      String(value || '')
        .toLowerCase(),
    )
    .join(' ');

const filterAndPaginateLeads = (
  leads,
  query,
) => {
  const normalizedSearch =
    query.search.toLowerCase();

  const filtered = leads
    .filter((lead) => {
      if (
        query.status &&
        getLeadStatus(lead) !==
          query.status
      ) {
        return false;
      }

      if (
        normalizedSearch &&
        !buildSearchText(
          lead,
        ).includes(
          normalizedSearch,
        )
      ) {
        return false;
      }

      return true;
    })
    .sort(
      (left, right) =>
        getLeadDateValue(right) -
        getLeadDateValue(left),
    );

  const total = filtered.length;

  const totalPages =
    total === 0
      ? 0
      : Math.ceil(
          total /
          query.pageSize,
        );

  const safePage =
    totalPages === 0
      ? 1
      : Math.min(
          query.page,
          totalPages,
        );

  const startIndex =
    (safePage - 1) *
    query.pageSize;

  return {
    leads: filtered.slice(
      startIndex,
      startIndex +
        query.pageSize,
    ),

    pagination: {
      page: safePage,
      pageSize: query.pageSize,
      total,
      totalPages,
    },
  };
};

const buildLeadStats = (
  leads,
  remoteStats,
) => {
  if (
    remoteStats &&
    typeof remoteStats ===
      'object' &&
    !Array.isArray(remoteStats)
  ) {
    return remoteStats;
  }

  const total = leads.length;

  const contacted =
    leads.filter(
      (lead) =>
        getLeadStatus(lead) ===
        'Đã liên hệ',
    ).length;

  const notContacted =
    leads.filter(
      (lead) =>
        getLeadStatus(lead) ===
        'Chưa liên hệ',
    ).length;

  return {
    total,
    contacted,
    notContacted,
  };
};

const normalizeRemotePagination = (
  result,
  query,
  leads,
) => {
  const source =
    result.pagination || result;

  const page =
    Number(source.page) ||
    query.page;

  const pageSize =
    Number(source.pageSize) ||
    query.pageSize;

  const total =
    Number(source.total) ||
    leads.length;

  const totalPages =
    Number(
      source.totalPages,
    ) ||
    (
      total === 0
        ? 0
        : Math.ceil(
            total / pageSize,
          )
    );

  return {
    page,
    pageSize,
    total,
    totalPages,
  };
};

const handleListLeads = async (
  request,
  response,
  session,
) => {
  const query =
    validatePagination(
      request.query || {},
    );

  const status =
    cleanEnum(
      request.query?.status,
      LEAD_STATUSES,
      {
        field: 'status',
        required: false,
      },
    );

  const normalizedQuery = {
    ...query,
    status,
  };

  const result =
    await callAppsScript(
      'listLeads',
      normalizedQuery,
      {
        actor:
          session.username,
        source:
          'admin-leads-api',
      },
    );

  const allLeads =
    extractLeads(result);

  if (hasRemotePagination(result)) {
    return sendSuccess(
      response,
      {
        leads: allLeads,

        pagination:
          normalizeRemotePagination(
            result,
            normalizedQuery,
            allLeads,
          ),

        stats:
          buildLeadStats(
            allLeads,
            result.stats ||
              result.data?.stats,
          ),
      },
    );
  }

  const paginated =
    filterAndPaginateLeads(
      allLeads,
      normalizedQuery,
    );

  return sendSuccess(
    response,
    {
      ...paginated,

      stats:
        buildLeadStats(
          allLeads,
          result.stats ||
            result.data?.stats,
        ),
    },
  );
};

const extractUpdatedLead = (
  result,
  fallback,
) => {
  const candidate =
    result?.lead ||
    result?.data?.lead ||
    result?.data ||
    result?.updatedLead;

  if (
    candidate &&
    typeof candidate ===
      'object' &&
    !Array.isArray(candidate)
  ) {
    return candidate;
  }

  return fallback;
};

const handleUpdateLead = async (
  request,
  response,
  session,
) => {
  assertAdminMutationOrigin(
    request,
  );

  const body =
    await readJsonBody(
      request,
      {
        maxBytes:
          UPDATE_BODY_LIMIT_BYTES,
      },
    );

  const update =
    validateLeadUpdate(
      body,
    );

  const result =
    await callAppsScript(
      'updateLead',
      update,
      {
        actor:
          session.username,
        source:
          'admin-leads-api',
      },
    );

  return sendSuccess(
    response,
    {
      message: 'LEAD_UPDATED',

      lead:
        extractUpdatedLead(
          result,
          update,
        ),
    },
  );
};

const handleOptions = (
  response,
) => {
  setNoStore(response);

  response.setHeader(
    'Allow',
    'GET, PATCH, OPTIONS',
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

  let session = null;

  try {
    if (
      request.method ===
      'OPTIONS'
    ) {
      return handleOptions(
        response,
      );
    }

    session =
      requireAdmin(request);

    switch (request.method) {
      case 'GET':
        return await handleListLeads(
          request,
          response,
          session,
        );

      case 'PATCH':
        return await handleUpdateLead(
          request,
          response,
          session,
        );

      default:
        return methodNotAllowed(
          response,
          [
            'GET',
            'PATCH',
            'OPTIONS',
          ],
        );
    }
  } catch (error) {
    logApiError(
      'admin/leads',
      error,
      {
        method:
          request.method,

        username:
          session?.username,

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
