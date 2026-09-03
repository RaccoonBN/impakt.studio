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
  CONTRACT_STATUSES,
  cleanEnum,
  cleanId,
  cleanText,
  validateContract,
  validateCustomer,
  validatePagination,
} from '../_lib/validation.js';

import {
  DOCUMENT_CURRENCIES,
  DOCUMENT_LANGUAGES,
  buildPaymentSchedule,
} from '../_lib/documents.js';

import {
  callAppsScript,
} from '../_lib/appsScript.js';

const MUTATION_BODY_LIMIT_BYTES = 160 * 1024;
const PENDING_CUSTOMER_ID = 'CUSTOMER-PENDING';
const CONTRACT_SOURCE_MODES = Object.freeze([
  'quotation',
  'standalone',
]);
const ACTIVE_STATUSES = new Set([
  'Đã ký',
  'Đang thực hiện',
  'Đã hoàn thành',
  'Đã thanh lý',
]);

const normalizeEnvironmentUrl = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  return `https://${text}`;
};

const getAllowedAdminOrigins = () => {
  const configured = parseCommaSeparatedList(
    process.env.ADMIN_ALLOWED_ORIGINS ||
      process.env.CONTACT_ALLOWED_ORIGINS,
  );

  const vercelOrigins = [
    normalizeEnvironmentUrl(process.env.VERCEL_URL),
    normalizeEnvironmentUrl(
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ),
    normalizeEnvironmentUrl(process.env.VERCEL_BRANCH_URL),
  ];

  const origins = [...new Set([...configured, ...vercelOrigins])]
    .filter(Boolean);

  if (!origins.length) {
    throw new ApiError(
      500,
      'ADMIN_ALLOWED_ORIGINS_NOT_CONFIGURED',
      'Configure ADMIN_ALLOWED_ORIGINS or CONTACT_ALLOWED_ORIGINS.',
    );
  }

  return origins;
};

const assertAdminMutationOrigin = (request) =>
  assertAllowedOrigin(request, getAllowedAdminOrigins());

const first = (record, keys, fallback = '') => {
  if (!record || typeof record !== 'object') return fallback;

  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value;
  }

  return fallback;
};

const textField = (record, keys, field) =>
  cleanText(first(record, keys), {
    field,
    maxLength: 250,
  });

const getContractId = (contract) =>
  textField(
    contract,
    ['contractId', 'id', 'contract_id', 'Mã hợp đồng'],
    'contract.contractId',
  );

const getContractNumber = (contract) =>
  textField(
    contract,
    ['documentNumber', 'contractNumber', 'number', 'Số hợp đồng'],
    'contract.documentNumber',
  );

const getContractTitle = (contract) =>
  textField(
    contract,
    ['title', 'contractTitle', 'Tên hợp đồng'],
    'contract.title',
  );

const getContractStatus = (contract) =>
  textField(
    contract,
    ['status', 'contractStatus', 'Trạng thái'],
    'contract.status',
  );

const getCustomerId = (contract) =>
  textField(
    contract,
    ['customerId', 'customer_id', 'Mã khách hàng'],
    'contract.customerId',
  );

const getProjectId = (contract) =>
  textField(
    contract,
    ['projectId', 'project_id', 'Mã dự án'],
    'contract.projectId',
  );

const getQuotationId = (contract) =>
  textField(
    contract,
    ['quotationId', 'quotation_id', 'Mã báo giá'],
    'contract.quotationId',
  );

const getLanguage = (contract) =>
  textField(contract, ['language', 'Ngôn ngữ'], 'contract.language');

const getCurrency = (contract) =>
  textField(
    contract,
    ['currency', 'Đơn vị tiền tệ'],
    'contract.currency',
  );

const getValue = (contract) => {
  const value = Number(
    first(
      contract,
      ['value', 'contractValue', 'total', 'Giá trị hợp đồng'],
      0,
    ),
  );

  return Number.isFinite(value) ? value : 0;
};

const getDateValue = (contract) => {
  const raw = first(contract, [
    'updatedAt',
    'signedDate',
    'effectiveDate',
    'createdAt',
    'Ngày cập nhật',
    'Ngày ký',
  ]);
  const time = Date.parse(String(raw || ''));
  return Number.isNaN(time) ? 0 : time;
};

const extractContracts = (result) => {
  const candidates = [
    result?.contracts,
    result?.data?.contracts,
    result?.data,
    result?.items,
  ];

  return candidates.find(Array.isArray) || [];
};

const extractContract = (result) => {
  const candidate =
    result?.contract ||
    result?.data?.contract ||
    result?.data ||
    result?.item;

  return candidate &&
    typeof candidate === 'object' &&
    !Array.isArray(candidate)
    ? candidate
    : null;
};

const extractCustomer = (result) => {
  const candidate =
    result?.customer ||
    result?.data?.customer ||
    result?.createdCustomer ||
    result?.data?.createdCustomer;

  return candidate &&
    typeof candidate === 'object' &&
    !Array.isArray(candidate)
    ? candidate
    : null;
};

const buildSearchText = (contract) =>
  [
    getContractId(contract),
    getContractNumber(contract),
    getContractTitle(contract),
    getCustomerId(contract),
    getProjectId(contract),
    getQuotationId(contract),
    first(contract, [
      'customerName',
      'customerDisplayName',
      'companyName',
      'fullName',
      'Tên khách hàng',
    ]),
    first(contract, ['projectName', 'Tên dự án']),
    first(contract, ['notes', 'Ghi chú']),
  ]
    .map((value) => String(value || '').toLowerCase())
    .join(' ');

const filterAndPaginate = (contracts, query) => {
  const search = query.search.toLowerCase();

  const filtered = contracts
    .filter((contract) => {
      if (query.customerId && getCustomerId(contract) !== query.customerId) {
        return false;
      }
      if (query.projectId && getProjectId(contract) !== query.projectId) {
        return false;
      }
      if (
        query.quotationId &&
        getQuotationId(contract) !== query.quotationId
      ) {
        return false;
      }
      if (query.status && getContractStatus(contract) !== query.status) {
        return false;
      }
      if (query.language && getLanguage(contract) !== query.language) {
        return false;
      }
      if (query.currency && getCurrency(contract) !== query.currency) {
        return false;
      }
      if (search && !buildSearchText(contract).includes(search)) {
        return false;
      }
      return true;
    })
    .sort((left, right) => getDateValue(right) - getDateValue(left));

  const total = filtered.length;
  const totalPages = total ? Math.ceil(total / query.pageSize) : 0;
  const page = totalPages ? Math.min(query.page, totalPages) : 1;
  const start = (page - 1) * query.pageSize;

  return {
    contracts: filtered.slice(start, start + query.pageSize),
    pagination: {
      page,
      pageSize: query.pageSize,
      total,
      totalPages,
    },
  };
};

const buildStats = (contracts, remoteStats) => {
  if (
    remoteStats &&
    typeof remoteStats === 'object' &&
    !Array.isArray(remoteStats)
  ) {
    return remoteStats;
  }

  const byStatus = Object.fromEntries(
    CONTRACT_STATUSES.map((status) => [
      status,
      contracts.filter(
        (contract) => getContractStatus(contract) === status,
      ).length,
    ]),
  );

  const totalValue = contracts.reduce(
    (sum, contract) => sum + getValue(contract),
    0,
  );

  const activeValue = contracts
    .filter((contract) => ACTIVE_STATUSES.has(getContractStatus(contract)))
    .reduce((sum, contract) => sum + getValue(contract), 0);

  return {
    total: contracts.length,
    totalValue,
    activeValue,
    byStatus,
  };
};

const normalizeListQuery = (request) => ({
  ...validatePagination(request.query || {}),

  customerId: cleanId(request.query?.customerId, {
    field: 'customerId',
    required: false,
  }),

  projectId: cleanId(request.query?.projectId, {
    field: 'projectId',
    required: false,
  }),

  quotationId: cleanId(request.query?.quotationId, {
    field: 'quotationId',
    required: false,
  }),

  status: cleanEnum(request.query?.status, CONTRACT_STATUSES, {
    field: 'status',
    required: false,
  }),

  language: cleanEnum(request.query?.language, DOCUMENT_LANGUAGES, {
    field: 'language',
    required: false,
  }),

  currency: cleanEnum(request.query?.currency, DOCUMENT_CURRENCIES, {
    field: 'currency',
    required: false,
  }),
});

const normalizeRemotePagination = (result, query, contracts) => {
  const source = result.pagination || result;
  const page = Number(source.page) || query.page;
  const pageSize = Number(source.pageSize) || query.pageSize;
  const total = Number(source.total) || contracts.length;
  const totalPages =
    Number(source.totalPages) || (total ? Math.ceil(total / pageSize) : 0);

  return { page, pageSize, total, totalPages };
};

const hasRemotePagination = (result) =>
  Boolean(
    result?.pagination &&
      Number.isFinite(Number(result.pagination.total)),
  ) ||
  (Number.isFinite(Number(result?.total)) &&
    Number.isFinite(Number(result?.page)));

const handleGet = async (request, response, session) => {
  const contractId = cleanId(request.query?.contractId, {
    field: 'contractId',
    required: false,
  });

  if (contractId) {
    const result = await callAppsScript(
      'getContract',
      {
        contractId,
        includeCustomer: true,
        includeProject: true,
        includeQuotation: true,
        includePaymentSchedule: true,
      },
      {
        actor: session.username,
        source: 'admin-contracts-api',
      },
    );

    const contract = extractContract(result);
    if (!contract) {
      throw new ApiError(
        404,
        'CONTRACT_NOT_FOUND',
        'Contract was not found.',
      );
    }

    return sendSuccess(response, {
      contract,
      customer: extractCustomer(result),
      project: result?.project || result?.data?.project || null,
      quotation: result?.quotation || result?.data?.quotation || null,
      paymentSchedule:
        result?.paymentSchedule || result?.data?.paymentSchedule || null,
    });
  }

  const query = normalizeListQuery(request);
  const result = await callAppsScript('listContracts', query, {
    actor: session.username,
    source: 'admin-contracts-api',
  });
  const allContracts = extractContracts(result);

  if (hasRemotePagination(result)) {
    return sendSuccess(response, {
      contracts: allContracts,
      pagination: normalizeRemotePagination(result, query, allContracts),
      stats: buildStats(
        allContracts,
        result.stats || result.data?.stats,
      ),
    });
  }

  const paginated = filterAndPaginate(allContracts, query);

  return sendSuccess(response, {
    ...paginated,
    stats: buildStats(
      allContracts,
      result.stats || result.data?.stats,
    ),
  });
};

const resolveCustomer = (body) => {
  const customerId = cleanId(body.customerId, {
    field: 'customerId',
    required: false,
  });
  const newCustomerInput = body.customer || body.newCustomer || null;

  if (customerId && newCustomerInput) {
    throw new ApiError(
      400,
      'AMBIGUOUS_CONTRACT_CUSTOMER',
      'Provide either customerId or customer, not both.',
    );
  }

  if (!customerId && !newCustomerInput) {
    throw new ApiError(
      400,
      'CONTRACT_CUSTOMER_REQUIRED',
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

  const validatedCustomer = validateCustomer(newCustomerInput);
  const { customerId: ignored, ...newCustomer } = validatedCustomer;

  return {
    mode: 'new',
    customerId: '',
    newCustomer,
  };
};

const normalizeDocumentSettings = (body, partial = false) => {
  const has = (key) =>
    Object.prototype.hasOwnProperty.call(body, key);
  const result = {};

  if (!partial || has('language')) {
    result.language = cleanEnum(
      body.language || 'vi',
      DOCUMENT_LANGUAGES,
      { field: 'language' },
    );
  }

  if (!partial || has('currency')) {
    result.currency = cleanEnum(
      body.currency || 'VND',
      DOCUMENT_CURRENCIES,
      { field: 'currency' },
    );
  }

  return result;
};

const resolveSourceMode = (quotationId, requestedMode) => {
  const inferred = quotationId ? 'quotation' : 'standalone';
  if (!requestedMode) return inferred;

  const sourceMode = cleanEnum(requestedMode, CONTRACT_SOURCE_MODES, {
    field: 'sourceMode',
  });

  if (sourceMode === 'quotation' && !quotationId) {
    throw new ApiError(
      400,
      'QUOTATION_ID_REQUIRED',
      'quotationId is required when sourceMode is quotation.',
    );
  }

  if (sourceMode === 'standalone' && quotationId) {
    throw new ApiError(
      400,
      'STANDALONE_CONTRACT_CANNOT_HAVE_QUOTATION',
      'Remove quotationId or use sourceMode quotation.',
    );
  }

  return sourceMode;
};

const handleCreate = async (request, response, session) => {
  assertAdminMutationOrigin(request);

  const body = await readJsonBody(request, {
    maxBytes: MUTATION_BODY_LIMIT_BYTES,
  });

  const customer = resolveCustomer(body);
  const settings = normalizeDocumentSettings(body);

  const validated = validateContract({
    ...body,
    customerId: customer.customerId || PENDING_CUSTOMER_ID,
  });

  const {
    contractId: ignoredContractId,
    customerId: validatedCustomerId,
    ...contractFields
  } = validated;

  const sourceMode = resolveSourceMode(
    contractFields.quotationId,
    body.sourceMode,
  );

  const contract = {
    ...contractFields,
    customerId:
      customer.mode === 'existing' ? validatedCustomerId : '',
    language: settings.language,
    currency: settings.currency,
    sourceMode,
  };

  const paymentSchedule = Array.isArray(body.paymentStages)
    ? buildPaymentSchedule(body.value, body.paymentStages, {
        currency: settings.currency,
      })
    : null;

  const result = await callAppsScript(
    'createContract',
    {
      customerMode: customer.mode,
      customerId: customer.customerId,
      newCustomer: customer.newCustomer,
      sourceMode,
      quotationId: contract.quotationId || '',
      projectId: contract.projectId || '',
      contract,
      paymentSchedule,
    },
    {
      actor: session.username,
      source: 'admin-contracts-api',
    },
  );

  const createdContract = extractContract(result);
  if (!createdContract) {
    throw new ApiError(
      502,
      'INVALID_CREATE_CONTRACT_RESPONSE',
      'Google Apps Script did not return the created contract.',
    );
  }

  return sendSuccess(
    response,
    {
      message: 'CONTRACT_CREATED',
      contract: createdContract,
      customer: extractCustomer(result),
      paymentSchedule:
        result?.paymentSchedule ||
        result?.data?.paymentSchedule ||
        paymentSchedule,
    },
    201,
  );
};

const handleUpdate = async (request, response, session) => {
  assertAdminMutationOrigin(request);

  const body = await readJsonBody(request, {
    maxBytes: MUTATION_BODY_LIMIT_BYTES,
  });

  const contractId = cleanId(
    body.contractId || request.query?.contractId,
    { field: 'contractId' },
  );

  if (body.customer || body.newCustomer) {
    throw new ApiError(
      400,
      'NEW_CUSTOMER_NOT_ALLOWED_ON_CONTRACT_UPDATE',
      'Create the customer first, then update customerId.',
    );
  }

  const validated = validateContract(
    { ...body, contractId },
    { partial: true },
  );
  const { contractId: validatedContractId, ...changes } = validated;
  Object.assign(changes, normalizeDocumentSettings(body, true));

  if (body.sourceMode !== undefined) {
    changes.sourceMode = resolveSourceMode(
      changes.quotationId || body.quotationId,
      body.sourceMode,
    );
  }

  let paymentSchedule = null;
  if (body.paymentStages !== undefined) {
    if (body.value === undefined || body.value === null || body.value === '') {
      throw new ApiError(
        400,
        'CONTRACT_VALUE_REQUIRED_FOR_PAYMENT_SCHEDULE',
        'value is required when updating paymentStages.',
      );
    }

    const currency = cleanEnum(
      body.currency || changes.currency || 'VND',
      DOCUMENT_CURRENCIES,
      { field: 'currency' },
    );

    paymentSchedule = buildPaymentSchedule(
      body.value,
      body.paymentStages,
      { currency },
    );
  }

  if (!Object.keys(changes).length && !paymentSchedule) {
    throw new ApiError(
      400,
      'NO_CONTRACT_CHANGES',
      'No contract fields were provided for update.',
    );
  }

  const result = await callAppsScript(
    'updateContract',
    {
      contractId: validatedContractId,
      changes,
      paymentSchedule,
    },
    {
      actor: session.username,
      source: 'admin-contracts-api',
    },
  );

  const updatedContract = extractContract(result);
  if (!updatedContract) {
    throw new ApiError(
      502,
      'INVALID_UPDATE_CONTRACT_RESPONSE',
      'Google Apps Script did not return the updated contract.',
    );
  }

  return sendSuccess(response, {
    message: 'CONTRACT_UPDATED',
    contract: updatedContract,
    paymentSchedule:
      result?.paymentSchedule ||
      result?.data?.paymentSchedule ||
      paymentSchedule,
  });
};

const handleDelete = async (request, response, session) => {
  assertAdminMutationOrigin(request);

  const body = await readJsonBody(request, {
    maxBytes: MUTATION_BODY_LIMIT_BYTES,
  });

  const contractId = cleanId(
    body.contractId || request.query?.contractId,
    { field: 'contractId' },
  );

  const reason = cleanText(body.reason, {
    field: 'reason',
    maxLength: 1000,
    preserveNewLines: true,
  });

  const result = await callAppsScript(
    'deleteContract',
    {
      contractId,
      reason,
      softDelete: true,
    },
    {
      actor: session.username,
      source: 'admin-contracts-api',
    },
  );

  return sendSuccess(response, {
    message: 'CONTRACT_DELETED',
    contractId,
    deletedAt:
      result.deletedAt ||
      result.data?.deletedAt ||
      new Date().toISOString(),
    softDelete: true,
  });
};

const handleOptions = (response) => {
  setNoStore(response);
  response.setHeader('Allow', 'GET, POST, PATCH, DELETE, OPTIONS');
  return response.status(204).end();
};

export default async function handler(request, response) {
  setNoStore(response);
  let session = null;

  try {
    if (request.method === 'OPTIONS') {
      return handleOptions(response);
    }

    session = requireAdmin(request);

    switch (request.method) {
      case 'GET':
        return await handleGet(request, response, session);
      case 'POST':
        return await handleCreate(request, response, session);
      case 'PATCH':
        return await handleUpdate(request, response, session);
      case 'DELETE':
        return await handleDelete(request, response, session);
      default:
        return methodNotAllowed(response, [
          'GET',
          'POST',
          'PATCH',
          'DELETE',
          'OPTIONS',
        ]);
    }
  } catch (error) {
    logApiError('admin/contracts', error, {
      method: request.method,
      username: session?.username,
      clientIp: getClientIp(request),
      origin: getHeader(request, 'origin'),
    });

    return sendError(response, error);
  }
}
