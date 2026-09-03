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
  DOCUMENT_CURRENCIES,
  DOCUMENT_LANGUAGES,
} from '../_lib/documents.js';

import {
  QUOTATION_STATUSES,
  cleanEnum,
  cleanId,
  cleanText,
  validateCustomer,
  validatePagination,
  validateQuotation,
} from '../_lib/validation.js';

import {
  callAppsScript,
} from '../_lib/appsScript.js';

const MUTATION_BODY_LIMIT_BYTES =
  128 * 1024;

const PENDING_CUSTOMER_ID =
  'CUSTOMER-PENDING';

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

const getQuotationId = (
  quotation,
) =>
  cleanText(
    getFirstDefined(
      quotation,
      [
        'quotationId',
        'id',
        'quotation_id',
        'Mã báo giá',
      ],
    ),
    {
      field:
        'quotation.quotationId',
      maxLength: 100,
    },
  );

const getQuotationNumber = (
  quotation,
) =>
  cleanText(
    getFirstDefined(
      quotation,
      [
        'documentNumber',
        'quotationNumber',
        'number',
        'Số báo giá',
        'Mã báo giá',
      ],
    ),
    {
      field:
        'quotation.documentNumber',
      maxLength: 120,
    },
  );

const getQuotationStatus = (
  quotation,
) =>
  cleanText(
    getFirstDefined(
      quotation,
      [
        'status',
        'quotationStatus',
        'Trạng thái',
      ],
    ),
    {
      field:
        'quotation.status',
      maxLength: 100,
    },
  );

const getQuotationCustomerId = (
  quotation,
) =>
  cleanText(
    getFirstDefined(
      quotation,
      [
        'customerId',
        'customer_id',
        'Mã khách hàng',
      ],
    ),
    {
      field:
        'quotation.customerId',
      maxLength: 100,
    },
  );

const getQuotationProjectId = (
  quotation,
) =>
  cleanText(
    getFirstDefined(
      quotation,
      [
        'projectId',
        'project_id',
        'Mã dự án',
      ],
    ),
    {
      field:
        'quotation.projectId',
      maxLength: 100,
    },
  );

const getQuotationLanguage = (
  quotation,
) =>
  cleanText(
    getFirstDefined(
      quotation,
      [
        'language',
        'Ngôn ngữ',
      ],
    ),
    {
      field:
        'quotation.language',
      maxLength: 20,
    },
  );

const getQuotationCurrency = (
  quotation,
) =>
  cleanText(
    getFirstDefined(
      quotation,
      [
        'currency',
        'Đơn vị tiền tệ',
      ],
    ),
    {
      field:
        'quotation.currency',
      maxLength: 20,
    },
  );

const getQuotationTotal = (
  quotation,
) => {
  const value = Number(
    getFirstDefined(
      quotation,
      [
        'total',
        'totalAmount',
        'grandTotal',
        'Tổng thanh toán',
      ],
      0,
    ),
  );

  return Number.isFinite(value)
    ? value
    : 0;
};

const getQuotationDateValue = (
  quotation,
) => {
  const value = getFirstDefined(
    quotation,
    [
      'updatedAt',
      'issuedAt',
      'issueDate',
      'createdAt',
      'Ngày cập nhật',
      'Ngày phát hành',
    ],
  );

  const time = Date.parse(
    String(value || ''),
  );

  return Number.isNaN(time)
    ? 0
    : time;
};

const extractQuotations = (
  result,
) => {
  const candidates = [
    result?.quotations,
    result?.data?.quotations,
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

const extractQuotation = (
  result,
) => {
  const candidate =
    result?.quotation ||
    result?.data?.quotation ||
    result?.data ||
    result?.item;

  if (
    candidate &&
    typeof candidate === 'object' &&
    !Array.isArray(candidate)
  ) {
    return candidate;
  }

  return null;
};

const extractCustomer = (
  result,
) => {
  const candidate =
    result?.customer ||
    result?.data?.customer ||
    result?.createdCustomer ||
    result?.data?.createdCustomer;

  if (
    candidate &&
    typeof candidate === 'object' &&
    !Array.isArray(candidate)
  ) {
    return candidate;
  }

  return null;
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

const normalizeRemotePagination = (
  result,
  query,
  quotations,
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
    quotations.length;

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

const buildSearchText = (
  quotation,
) =>
  [
    getQuotationId(
      quotation,
    ),

    getQuotationNumber(
      quotation,
    ),

    getQuotationCustomerId(
      quotation,
    ),

    getQuotationProjectId(
      quotation,
    ),

    getFirstDefined(
      quotation,
      [
        'customerName',
        'customerDisplayName',
        'companyName',
        'fullName',
        'Tên khách hàng',
      ],
    ),

    getFirstDefined(
      quotation,
      [
        'projectName',
        'Tên dự án',
      ],
    ),

    getFirstDefined(
      quotation,
      [
        'notes',
        'Ghi chú',
      ],
    ),
  ]
    .map((value) =>
      String(value || '')
        .toLowerCase(),
    )
    .join(' ');

const filterAndPaginateQuotations = (
  quotations,
  query,
) => {
  const normalizedSearch =
    query.search.toLowerCase();

  const filtered = quotations
    .filter((quotation) => {
      if (
        query.customerId &&
        getQuotationCustomerId(
          quotation,
        ) !== query.customerId
      ) {
        return false;
      }

      if (
        query.projectId &&
        getQuotationProjectId(
          quotation,
        ) !== query.projectId
      ) {
        return false;
      }

      if (
        query.status &&
        getQuotationStatus(
          quotation,
        ) !== query.status
      ) {
        return false;
      }

      if (
        query.language &&
        getQuotationLanguage(
          quotation,
        ) !== query.language
      ) {
        return false;
      }

      if (
        query.currency &&
        getQuotationCurrency(
          quotation,
        ) !== query.currency
      ) {
        return false;
      }

      if (
        normalizedSearch &&
        !buildSearchText(
          quotation,
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
        getQuotationDateValue(right) -
        getQuotationDateValue(left),
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
    quotations: filtered.slice(
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

const buildQuotationStats = (
  quotations,
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

  const byStatus =
    Object.fromEntries(
      QUOTATION_STATUSES.map(
        (status) => [
          status,
          quotations.filter(
            (quotation) =>
              getQuotationStatus(
                quotation,
              ) === status,
          ).length,
        ],
      ),
    );

  const totalValue =
    quotations.reduce(
      (sum, quotation) =>
        sum +
        getQuotationTotal(
          quotation,
        ),
      0,
    );

  const acceptedValue =
    quotations
      .filter(
        (quotation) =>
          getQuotationStatus(
            quotation,
          ) === 'Đã chấp nhận',
      )
      .reduce(
        (sum, quotation) =>
          sum +
          getQuotationTotal(
            quotation,
          ),
        0,
      );

  return {
    total: quotations.length,
    totalValue,
    acceptedValue,
    byStatus,
  };
};

const normalizeListQuery = (
  request,
) => {
  const pagination =
    validatePagination(
      request.query || {},
    );

  return {
    ...pagination,

    customerId:
      cleanId(
        request.query
          ?.customerId,
        {
          field:
            'customerId',
          required: false,
        },
      ),

    projectId:
      cleanId(
        request.query
          ?.projectId,
        {
          field:
            'projectId',
          required: false,
        },
      ),

    status:
      cleanEnum(
        request.query?.status,
        QUOTATION_STATUSES,
        {
          field: 'status',
          required: false,
        },
      ),

    language:
      cleanEnum(
        request.query
          ?.language,
        DOCUMENT_LANGUAGES,
        {
          field:
            'language',
          required: false,
        },
      ),

    currency:
      cleanEnum(
        request.query
          ?.currency,
        DOCUMENT_CURRENCIES,
        {
          field:
            'currency',
          required: false,
        },
      ),
  };
};

const handleGetQuotation = async (
  response,
  session,
  quotationId,
) => {
  const result =
    await callAppsScript(
      'getQuotation',
      {
        quotationId,
        includeItems: true,
        includeCustomer: true,
        includeProject: true,
      },
      {
        actor:
          session.username,
        source:
          'admin-quotations-api',
      },
    );

  const quotation =
    extractQuotation(result);

  if (!quotation) {
    throw new ApiError(
      404,
      'QUOTATION_NOT_FOUND',
      'Quotation was not found.',
    );
  }

  return sendSuccess(
    response,
    {
      quotation,

      customer:
        extractCustomer(
          result,
        ),

      project:
        result?.project ||
        result?.data?.project ||
        null,
    },
  );
};

const handleListQuotations = async (
  request,
  response,
  session,
) => {
  const query =
    normalizeListQuery(request);

  const result =
    await callAppsScript(
      'listQuotations',
      query,
      {
        actor:
          session.username,
        source:
          'admin-quotations-api',
      },
    );

  const allQuotations =
    extractQuotations(result);

  if (hasRemotePagination(result)) {
    return sendSuccess(
      response,
      {
        quotations:
          allQuotations,

        pagination:
          normalizeRemotePagination(
            result,
            query,
            allQuotations,
          ),

        stats:
          buildQuotationStats(
            allQuotations,
            result.stats ||
              result.data?.stats,
          ),
      },
    );
  }

  const paginated =
    filterAndPaginateQuotations(
      allQuotations,
      query,
    );

  return sendSuccess(
    response,
    {
      ...paginated,

      stats:
        buildQuotationStats(
          allQuotations,
          result.stats ||
            result.data?.stats,
        ),
    },
  );
};

const handleGet = async (
  request,
  response,
  session,
) => {
  const quotationId =
    cleanId(
      request.query
        ?.quotationId,
      {
        field:
          'quotationId',
        required: false,
      },
    );

  if (quotationId) {
    return handleGetQuotation(
      response,
      session,
      quotationId,
    );
  }

  return handleListQuotations(
    request,
    response,
    session,
  );
};

const resolveQuotationCustomer = (
  body,
) => {
  const customerId =
    cleanId(
      body.customerId,
      {
        field:
          'customerId',
        required: false,
      },
    );

  const newCustomerInput =
    body.customer ||
    body.newCustomer ||
    null;

  if (
    customerId &&
    newCustomerInput
  ) {
    throw new ApiError(
      400,
      'AMBIGUOUS_QUOTATION_CUSTOMER',
      'Provide either customerId or customer, not both.',
    );
  }

  if (!customerId && !newCustomerInput) {
    throw new ApiError(
      400,
      'QUOTATION_CUSTOMER_REQUIRED',
      'Select an existing customer or provide a new customer.',
    );
  }

  if (customerId) {
    return {
      mode: 'existing',
      customerId,
      newCustomer: null,
    };
  }

  const newCustomer =
    validateCustomer(
      newCustomerInput,
    );

  const {
    customerId:
      ignoredCustomerId,
    ...customerInput
  } = newCustomer;

  return {
    mode: 'new',
    customerId: '',
    newCustomer:
      customerInput,
  };
};

const buildValidatedQuotationCreate = (
  body,
  customerResolution,
) => {
  const validated =
    validateQuotation({
      ...body,

      customerId:
        customerResolution
          .customerId ||
        PENDING_CUSTOMER_ID,
    });

  const {
    quotationId:
      ignoredQuotationId,

    customerId:
      validatedCustomerId,

    customer:
      ignoredCustomer,

    newCustomer:
      ignoredNewCustomer,

    ...quotationInput
  } = validated;

  return {
    ...quotationInput,

    customerId:
      customerResolution
        .mode === 'existing'
        ? validatedCustomerId
        : '',
  };
};

const handleCreateQuotation = async (
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
          MUTATION_BODY_LIMIT_BYTES,
      },
    );

  const customerResolution =
    resolveQuotationCustomer(
      body,
    );

  const quotationInput =
    buildValidatedQuotationCreate(
      body,
      customerResolution,
    );

  const result =
    await callAppsScript(
      'createQuotation',
      {
        customerMode:
          customerResolution.mode,

        customerId:
          customerResolution
            .customerId,

        newCustomer:
          customerResolution
            .newCustomer,

        quotation:
          quotationInput,
      },
      {
        actor:
          session.username,
        source:
          'admin-quotations-api',
      },
    );

  const quotation =
    extractQuotation(result);

  if (!quotation) {
    throw new ApiError(
      502,
      'INVALID_CREATE_QUOTATION_RESPONSE',
      'Google Apps Script did not return the created quotation.',
    );
  }

  return sendSuccess(
    response,
    {
      message:
        'QUOTATION_CREATED',

      quotation,

      customer:
        extractCustomer(
          result,
        ),
    },
    201,
  );
};

const handleUpdateQuotation = async (
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
          MUTATION_BODY_LIMIT_BYTES,
      },
    );

  const quotationId =
    cleanId(
      body.quotationId ||
        request.query
          ?.quotationId,
      {
        field:
          'quotationId',
      },
    );

  if (
    body.customer ||
    body.newCustomer
  ) {
    throw new ApiError(
      400,
      'NEW_CUSTOMER_NOT_ALLOWED_ON_QUOTATION_UPDATE',
      'Create the customer first, then update customerId.',
    );
  }

  const validated =
    validateQuotation(
      {
        ...body,
        quotationId,
      },
      {
        partial: true,
      },
    );

  const {
    quotationId:
      validatedQuotationId,

    ...changes
  } = validated;

  if (
    Object.keys(changes)
      .length === 0
  ) {
    throw new ApiError(
      400,
      'NO_QUOTATION_CHANGES',
      'No quotation fields were provided for update.',
    );
  }

  const result =
    await callAppsScript(
      'updateQuotation',
      {
        quotationId:
          validatedQuotationId,
        changes,
      },
      {
        actor:
          session.username,
        source:
          'admin-quotations-api',
      },
    );

  const quotation =
    extractQuotation(result);

  if (!quotation) {
    throw new ApiError(
      502,
      'INVALID_UPDATE_QUOTATION_RESPONSE',
      'Google Apps Script did not return the updated quotation.',
    );
  }

  return sendSuccess(
    response,
    {
      message:
        'QUOTATION_UPDATED',
      quotation,
    },
  );
};

const handleDeleteQuotation = async (
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
          MUTATION_BODY_LIMIT_BYTES,
      },
    );

  const quotationId =
    cleanId(
      body.quotationId ||
        request.query
          ?.quotationId,
      {
        field:
          'quotationId',
      },
    );

  const reason =
    cleanText(
      body.reason,
      {
        field: 'reason',
        maxLength: 1000,
        preserveNewLines: true,
      },
    );

  const result =
    await callAppsScript(
      'deleteQuotation',
      {
        quotationId,
        reason,
        softDelete: true,
      },
      {
        actor:
          session.username,
        source:
          'admin-quotations-api',
      },
    );

  return sendSuccess(
    response,
    {
      message:
        'QUOTATION_DELETED',

      quotationId,

      deletedAt:
        result.deletedAt ||
        result.data
          ?.deletedAt ||
        new Date()
          .toISOString(),

      softDelete: true,
    },
  );
};

const handleOptions = (
  response,
) => {
  setNoStore(response);

  response.setHeader(
    'Allow',
    'GET, POST, PATCH, DELETE, OPTIONS',
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
        return await handleGet(
          request,
          response,
          session,
        );

      case 'POST':
        return await handleCreateQuotation(
          request,
          response,
          session,
        );

      case 'PATCH':
        return await handleUpdateQuotation(
          request,
          response,
          session,
        );

      case 'DELETE':
        return await handleDeleteQuotation(
          request,
          response,
          session,
        );

      default:
        return methodNotAllowed(
          response,
          [
            'GET',
            'POST',
            'PATCH',
            'DELETE',
            'OPTIONS',
          ],
        );
    }
  } catch (error) {
    logApiError(
      'admin/quotations',
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
