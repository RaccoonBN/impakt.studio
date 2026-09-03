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
  CUSTOMER_SOURCES,
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  cleanEnum,
  cleanId,
  cleanText,
  validateCustomer,
  validatePagination,
} from '../_lib/validation.js';

import {
  callAppsScript,
} from '../_lib/appsScript.js';

const MUTATION_BODY_LIMIT_BYTES =
  32 * 1024;

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

const getCustomerId = (
  customer,
) =>
  cleanText(
    getFirstDefined(
      customer,
      [
        'customerId',
        'id',
        'customer_id',
        'Mã khách hàng',
      ],
    ),
    {
      field:
        'customer.customerId',
      maxLength: 100,
    },
  );

const getCustomerDisplayName = (
  customer,
) =>
  cleanText(
    getFirstDefined(
      customer,
      [
        'displayName',
        'companyName',
        'fullName',
        'name',
        'Tên hiển thị',
        'Họ tên / Tên doanh nghiệp',
      ],
    ),
    {
      field:
        'customer.displayName',
      maxLength: 250,
    },
  );

const getCustomerType = (
  customer,
) =>
  cleanText(
    getFirstDefined(
      customer,
      [
        'customerType',
        'type',
        'Loại khách hàng',
      ],
    ),
    {
      field:
        'customer.customerType',
      maxLength: 100,
    },
  );

const getCustomerStatus = (
  customer,
) =>
  cleanText(
    getFirstDefined(
      customer,
      [
        'status',
        'customerStatus',
        'Trạng thái',
      ],
    ),
    {
      field:
        'customer.status',
      maxLength: 100,
    },
  );

const getCustomerSource = (
  customer,
) =>
  cleanText(
    getFirstDefined(
      customer,
      [
        'source',
        'customerSource',
        'Nguồn khách hàng',
      ],
    ),
    {
      field:
        'customer.source',
      maxLength: 100,
    },
  );

const getCustomerDateValue = (
  customer,
) => {
  const value = getFirstDefined(
    customer,
    [
      'updatedAt',
      'createdAt',
      'convertedAt',
      'Ngày cập nhật',
      'Ngày tạo',
    ],
  );

  const time = Date.parse(
    String(value || ''),
  );

  return Number.isNaN(time)
    ? 0
    : time;
};

const extractCustomers = (
  result,
) => {
  const candidates = [
    result?.customers,
    result?.data?.customers,
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

const extractCustomer = (
  result,
) => {
  const candidate =
    result?.customer ||
    result?.data?.customer ||
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
  customers,
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
    customers.length;

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
  customer,
) =>
  [
    getCustomerId(customer),
    getCustomerDisplayName(
      customer,
    ),

    getFirstDefined(
      customer,
      [
        'fullName',
        'Họ và tên',
      ],
    ),

    getFirstDefined(
      customer,
      [
        'companyName',
        'Tên doanh nghiệp',
      ],
    ),

    getFirstDefined(
      customer,
      [
        'representativeName',
        'Người đại diện',
      ],
    ),

    getFirstDefined(
      customer,
      [
        'taxCode',
        'Mã số thuế',
      ],
    ),

    getFirstDefined(
      customer,
      [
        'identityNumber',
        'CCCD/Hộ chiếu',
      ],
    ),

    getFirstDefined(
      customer,
      [
        'phone',
        'Số điện thoại',
      ],
    ),

    getFirstDefined(
      customer,
      [
        'email',
        'Email',
      ],
    ),

    getFirstDefined(
      customer,
      [
        'address',
        'Địa chỉ',
      ],
    ),

    getFirstDefined(
      customer,
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

const filterAndPaginateCustomers = (
  customers,
  query,
) => {
  const normalizedSearch =
    query.search.toLowerCase();

  const filtered = customers
    .filter((customer) => {
      if (
        query.customerType &&
        getCustomerType(
          customer,
        ) !== query.customerType
      ) {
        return false;
      }

      if (
        query.status &&
        getCustomerStatus(
          customer,
        ) !== query.status
      ) {
        return false;
      }

      if (
        query.source &&
        getCustomerSource(
          customer,
        ) !== query.source
      ) {
        return false;
      }

      if (
        normalizedSearch &&
        !buildSearchText(
          customer,
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
        getCustomerDateValue(right) -
        getCustomerDateValue(left),
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
    customers: filtered.slice(
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

const buildCustomerStats = (
  customers,
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
      CUSTOMER_STATUSES.map(
        (status) => [
          status,
          customers.filter(
            (customer) =>
              getCustomerStatus(
                customer,
              ) === status,
          ).length,
        ],
      ),
    );

  const individuals =
    customers.filter(
      (customer) =>
        getCustomerType(
          customer,
        ) === 'Cá nhân',
    ).length;

  const businesses =
    customers.filter(
      (customer) =>
        getCustomerType(
          customer,
        ) === 'Doanh nghiệp',
    ).length;

  return {
    total: customers.length,
    individuals,
    businesses,
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

    customerType:
      cleanEnum(
        request.query
          ?.customerType,
        CUSTOMER_TYPES,
        {
          field:
            'customerType',
          required: false,
        },
      ),

    status:
      cleanEnum(
        request.query?.status,
        CUSTOMER_STATUSES,
        {
          field: 'status',
          required: false,
        },
      ),

    source:
      cleanEnum(
        request.query?.source,
        CUSTOMER_SOURCES,
        {
          field: 'source',
          required: false,
        },
      ),
  };
};

const handleGetCustomer = async (
  response,
  session,
  customerId,
) => {
  const result =
    await callAppsScript(
      'getCustomer',
      {
        customerId,
      },
      {
        actor:
          session.username,
        source:
          'admin-customers-api',
      },
    );

  const customer =
    extractCustomer(result);

  if (!customer) {
    throw new ApiError(
      404,
      'CUSTOMER_NOT_FOUND',
      'Customer was not found.',
    );
  }

  return sendSuccess(
    response,
    {
      customer,
    },
  );
};

const handleListCustomers = async (
  request,
  response,
  session,
) => {
  const query =
    normalizeListQuery(request);

  const result =
    await callAppsScript(
      'listCustomers',
      query,
      {
        actor:
          session.username,
        source:
          'admin-customers-api',
      },
    );

  const allCustomers =
    extractCustomers(result);

  if (hasRemotePagination(result)) {
    return sendSuccess(
      response,
      {
        customers:
          allCustomers,

        pagination:
          normalizeRemotePagination(
            result,
            query,
            allCustomers,
          ),

        stats:
          buildCustomerStats(
            allCustomers,
            result.stats ||
              result.data?.stats,
          ),
      },
    );
  }

  const paginated =
    filterAndPaginateCustomers(
      allCustomers,
      query,
    );

  return sendSuccess(
    response,
    {
      ...paginated,

      stats:
        buildCustomerStats(
          allCustomers,
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
  const customerId =
    cleanId(
      request.query
        ?.customerId,
      {
        field:
          'customerId',
        required: false,
      },
    );

  if (customerId) {
    return handleGetCustomer(
      response,
      session,
      customerId,
    );
  }

  return handleListCustomers(
    request,
    response,
    session,
  );
};

const handleCreateCustomer = async (
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

  const validated =
    validateCustomer(body);

  const {
    customerId: ignoredCustomerId,
    ...customerInput
  } = validated;

  const result =
    await callAppsScript(
      'createCustomer',
      customerInput,
      {
        actor:
          session.username,
        source:
          'admin-customers-api',
      },
    );

  const customer =
    extractCustomer(result);

  if (!customer) {
    throw new ApiError(
      502,
      'INVALID_CREATE_CUSTOMER_RESPONSE',
      'Google Apps Script did not return the created customer.',
    );
  }

  return sendSuccess(
    response,
    {
      message:
        'CUSTOMER_CREATED',
      customer,
    },
    201,
  );
};

const handleUpdateCustomer = async (
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

  const customerId =
    cleanId(
      body.customerId ||
        request.query
          ?.customerId,
      {
        field:
          'customerId',
      },
    );

  const validated =
    validateCustomer(
      {
        ...body,
        customerId,
      },
      {
        partial: true,
      },
    );

  const {
    customerId:
      validatedCustomerId,
    ...changes
  } = validated;

  if (
    Object.keys(changes)
      .length === 0
  ) {
    throw new ApiError(
      400,
      'NO_CUSTOMER_CHANGES',
      'No customer fields were provided for update.',
    );
  }

  const result =
    await callAppsScript(
      'updateCustomer',
      {
        customerId:
          validatedCustomerId,
        changes,
      },
      {
        actor:
          session.username,
        source:
          'admin-customers-api',
      },
    );

  const customer =
    extractCustomer(result);

  if (!customer) {
    throw new ApiError(
      502,
      'INVALID_UPDATE_CUSTOMER_RESPONSE',
      'Google Apps Script did not return the updated customer.',
    );
  }

  return sendSuccess(
    response,
    {
      message:
        'CUSTOMER_UPDATED',
      customer,
    },
  );
};

const handleDeleteCustomer = async (
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

  const customerId =
    cleanId(
      body.customerId ||
        request.query
          ?.customerId,
      {
        field:
          'customerId',
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
      'deleteCustomer',
      {
        customerId,
        reason,
        softDelete: true,
      },
      {
        actor:
          session.username,
        source:
          'admin-customers-api',
      },
    );

  return sendSuccess(
    response,
    {
      message:
        'CUSTOMER_DELETED',

      customerId,

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
        return await handleCreateCustomer(
          request,
          response,
          session,
        );

      case 'PATCH':
        return await handleUpdateCustomer(
          request,
          response,
          session,
        );

      case 'DELETE':
        return await handleDeleteCustomer(
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
      'admin/customers',
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
