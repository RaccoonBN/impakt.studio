import {
  ApiError,
} from './http.js';

export const LEAD_STATUSES = Object.freeze([
  'Chưa liên hệ',
  'Đã liên hệ',
]);

export const CUSTOMER_TYPES = Object.freeze([
  'Cá nhân',
  'Doanh nghiệp',
]);

export const CUSTOMER_STATUSES = Object.freeze([
  'Tiềm năng',
  'Đang hợp tác',
  'Tạm dừng',
  'Đã hoàn tất',
  'Ngừng hợp tác',
]);

export const CUSTOMER_SOURCES = Object.freeze([
  'Website',
  'Facebook',
  'Giới thiệu',
  'Khách cũ',
  'Đối tác',
  'Nhập thủ công',
  'Nguồn khác',
]);

export const PROJECT_STATUSES = Object.freeze([
  'Chưa bắt đầu',
  'Đang thực hiện',
  'Tạm dừng',
  'Chờ phản hồi',
  'Đã hoàn thành',
  'Đã hủy',
]);

export const PROJECT_PHASES = Object.freeze([
  'Tiếp nhận yêu cầu',
  'Phân tích',
  'Thiết kế',
  'Lập trình',
  'Kiểm thử',
  'Bàn giao',
  'Bảo hành',
  'Bảo trì',
]);

export const QUOTATION_STATUSES = Object.freeze([
  'Bản nháp',
  'Đã gửi',
  'Đang trao đổi',
  'Đã chấp nhận',
  'Đã từ chối',
  'Hết hiệu lực',
  'Đã hủy',
]);

export const CONTRACT_STATUSES = Object.freeze([
  'Bản nháp',
  'Chờ ký',
  'Đã ký',
  'Đang thực hiện',
  'Tạm dừng',
  'Đã hoàn thành',
  'Đã thanh lý',
  'Đã hủy',
]);

export const PAYMENT_STATUSES = Object.freeze([
  'Chưa thanh toán',
  'Thanh toán một phần',
  'Đã thanh toán',
  'Quá hạn',
  'Đã hoàn tiền',
]);

const DANGEROUS_SHEET_PREFIX =
  /^[=+\-@]/;

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_PATTERN =
  /^[+()\d\s.\-]{7,30}$/;

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const ID_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._\-/:]{1,99}$/;

const TAX_CODE_PATTERN =
  /^\d{10}(?:-\d{3})?$/;

const IDENTITY_NUMBER_PATTERN =
  /^[A-Za-z0-9]{6,20}$/;

export const cleanText = (
  value,
  options = {},
) => {
  const {
    field = 'value',
    maxLength = 3000,
    minLength = 0,
    required = false,
    preserveNewLines = false,
  } = options;

  let text = String(value ?? '')
    .replace(/\u0000/g, '');

  text = preserveNewLines
    ? text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()
    : text
        .replace(/\s+/g, ' ')
        .trim();

  if (required && !text) {
    throw new ApiError(
      400,
      'FIELD_REQUIRED',
      `${field} is required.`,
      { field },
    );
  }

  if (
    text &&
    text.length < minLength
  ) {
    throw new ApiError(
      400,
      'FIELD_TOO_SHORT',
      `${field} is too short.`,
      {
        field,
        minLength,
      },
    );
  }

  if (text.length > maxLength) {
    throw new ApiError(
      400,
      'FIELD_TOO_LONG',
      `${field} is too long.`,
      {
        field,
        maxLength,
      },
    );
  }

  return text;
};

export const cleanSheetText = (
  value,
  options = {},
) => {
  const text = cleanText(
    value,
    options,
  );

  if (
    text &&
    DANGEROUS_SHEET_PREFIX.test(text)
  ) {
    return `'${text}`;
  }

  return text;
};

export const cleanId = (
  value,
  options = {},
) => {
  const field =
    options.field || 'id';

  const required =
    options.required !== false;

  const id = cleanText(value, {
    field,
    required,
    minLength: required ? 2 : 0,
    maxLength:
      options.maxLength || 100,
  });

  if (!id) {
    return '';
  }

  if (!ID_PATTERN.test(id)) {
    throw new ApiError(
      400,
      'INVALID_ID',
      `${field} has an invalid format.`,
      { field },
    );
  }

  return id;
};

export const cleanEmail = (
  value,
  options = {},
) => {
  const field =
    options.field || 'email';

  const email = cleanText(value, {
    field,
    required:
      options.required === true,
    maxLength: 160,
  }).toLowerCase();

  if (!email) {
    return '';
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new ApiError(
      400,
      'INVALID_EMAIL',
      `${field} is invalid.`,
      { field },
    );
  }

  return email;
};

export const cleanPhone = (
  value,
  options = {},
) => {
  const field =
    options.field || 'phone';

  const phone = cleanText(value, {
    field,
    required:
      options.required === true,
    maxLength: 30,
  });

  if (!phone) {
    return '';
  }

  if (!PHONE_PATTERN.test(phone)) {
    throw new ApiError(
      400,
      'INVALID_PHONE',
      `${field} is invalid.`,
      { field },
    );
  }

  return phone;
};

export const cleanTaxCode = (
  value,
  options = {},
) => {
  const field =
    options.field || 'taxCode';

  const taxCode = cleanText(value, {
    field,
    required:
      options.required === true,
    maxLength: 20,
  })
    .replace(/\s+/g, '');

  if (!taxCode) {
    return '';
  }

  if (!TAX_CODE_PATTERN.test(taxCode)) {
    throw new ApiError(
      400,
      'INVALID_TAX_CODE',
      `${field} is invalid.`,
      { field },
    );
  }

  return taxCode;
};

export const cleanIdentityNumber = (
  value,
  options = {},
) => {
  const field =
    options.field ||
    'identityNumber';

  const identityNumber =
    cleanText(value, {
      field,
      required:
        options.required === true,
      maxLength: 20,
    })
      .replace(/[\s.\-]/g, '')
      .toUpperCase();

  if (!identityNumber) {
    return '';
  }

  if (
    !IDENTITY_NUMBER_PATTERN.test(
      identityNumber,
    )
  ) {
    throw new ApiError(
      400,
      'INVALID_IDENTITY_NUMBER',
      `${field} is invalid.`,
      { field },
    );
  }

  return identityNumber;
};

export const cleanIsoDate = (
  value,
  options = {},
) => {
  const field =
    options.field || 'date';

  const dateText = cleanText(value, {
    field,
    required:
      options.required === true,
    maxLength: 10,
  });

  if (!dateText) {
    return '';
  }

  if (!ISO_DATE_PATTERN.test(dateText)) {
    throw new ApiError(
      400,
      'INVALID_DATE',
      `${field} must use YYYY-MM-DD.`,
      { field },
    );
  }

  const date = new Date(
    `${dateText}T00:00:00Z`,
  );

  if (
    Number.isNaN(date.getTime()) ||
    date
      .toISOString()
      .slice(0, 10) !== dateText
  ) {
    throw new ApiError(
      400,
      'INVALID_DATE',
      `${field} is invalid.`,
      { field },
    );
  }

  return dateText;
};

export const cleanDateTime = (
  value,
  options = {},
) => {
  const field =
    options.field || 'dateTime';

  const text = cleanText(value, {
    field,
    required:
      options.required === true,
    maxLength: 100,
  });

  if (!text) {
    return '';
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(
      400,
      'INVALID_DATETIME',
      `${field} is invalid.`,
      { field },
    );
  }

  return date.toISOString();
};

export const cleanBoolean = (
  value,
  options = {},
) => {
  const field =
    options.field || 'value';

  if (
    value === true ||
    value === false
  ) {
    return value;
  }

  const normalized = String(
    value ?? '',
  )
    .trim()
    .toLowerCase();

  if (
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'yes'
  ) {
    return true;
  }

  if (
    normalized === 'false' ||
    normalized === '0' ||
    normalized === 'no' ||
    normalized === ''
  ) {
    return false;
  }

  throw new ApiError(
    400,
    'INVALID_BOOLEAN',
    `${field} must be a boolean.`,
    { field },
  );
};

export const cleanNumber = (
  value,
  options = {},
) => {
  const {
    field = 'value',
    required = false,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    integer = false,
    defaultValue = null,
  } = options;

  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    if (required) {
      throw new ApiError(
        400,
        'FIELD_REQUIRED',
        `${field} is required.`,
        { field },
      );
    }

    return defaultValue;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    (integer && !Number.isInteger(number))
  ) {
    throw new ApiError(
      400,
      integer
        ? 'INVALID_INTEGER'
        : 'INVALID_NUMBER',
      `${field} is invalid.`,
      { field },
    );
  }

  if (number < min || number > max) {
    throw new ApiError(
      400,
      'NUMBER_OUT_OF_RANGE',
      `${field} is out of range.`,
      {
        field,
        min,
        max,
      },
    );
  }

  return number;
};

export const cleanEnum = (
  value,
  allowedValues,
  options = {},
) => {
  const field =
    options.field || 'value';

  const text = cleanText(value, {
    field,
    required:
      options.required !== false,
    maxLength:
      options.maxLength || 100,
  });

  if (!text) {
    return '';
  }

  if (
    !Array.isArray(allowedValues) ||
    !allowedValues.includes(text)
  ) {
    throw new ApiError(
      400,
      'INVALID_ENUM_VALUE',
      `${field} is invalid.`,
      {
        field,
        allowedValues,
      },
    );
  }

  return text;
};

export const cleanStringArray = (
  value,
  options = {},
) => {
  const {
    field = 'items',
    maxItems = 100,
    maxItemLength = 500,
  } = options;

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ApiError(
      400,
      'INVALID_ARRAY',
      `${field} must be an array.`,
      { field },
    );
  }

  if (value.length > maxItems) {
    throw new ApiError(
      400,
      'ARRAY_TOO_LARGE',
      `${field} has too many items.`,
      {
        field,
        maxItems,
      },
    );
  }

  return value
    .map((item, index) =>
      cleanText(item, {
        field: `${field}[${index}]`,
        maxLength: maxItemLength,
      }),
    )
    .filter(Boolean);
};

export const validatePagination = (
  query = {},
) => {
  const page = cleanNumber(
    query.page ?? 1,
    {
      field: 'page',
      integer: true,
      min: 1,
      max: 100000,
      defaultValue: 1,
    },
  );

  const pageSize = cleanNumber(
    query.pageSize ?? 20,
    {
      field: 'pageSize',
      integer: true,
      min: 1,
      max: 100,
      defaultValue: 20,
    },
  );

  const search = cleanText(
    query.search,
    {
      field: 'search',
      maxLength: 200,
    },
  );

  return {
    page,
    pageSize,
    search,
  };
};

export const validateLeadUpdate = (
  payload,
) => {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw new ApiError(
      400,
      'INVALID_PAYLOAD',
      'Lead payload is invalid.',
    );
  }

  return {
    submissionId: cleanId(
      payload.submissionId,
      {
        field: 'submissionId',
      },
    ),

    status: cleanEnum(
      payload.status,
      LEAD_STATUSES,
      {
        field: 'status',
      },
    ),

    notes: cleanText(
      payload.notes,
      {
        field: 'notes',
        maxLength: 3000,
        preserveNewLines: true,
      },
    ),
  };
};

const getCustomerDisplayName = (
  customer,
) =>
  customer.customerType === 'Doanh nghiệp'
    ? customer.companyName
    : customer.fullName;

export const validateCustomer = (
  payload,
  options = {},
) => {
  const partial =
    options.partial === true;

  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw new ApiError(
      400,
      'INVALID_PAYLOAD',
      'Customer payload is invalid.',
    );
  }

  const has = (key) =>
    Object.prototype.hasOwnProperty.call(
      payload,
      key,
    );

  const read = (
    key,
    cleaner,
    cleanerOptions,
  ) => {
    if (partial && !has(key)) {
      return undefined;
    }

    return cleaner(
      payload[key],
      cleanerOptions,
    );
  };

  const customerType = read(
    'customerType',
    cleanEnum,
    CUSTOMER_TYPES,
  );

  const result = {
    customerId:
      partial && !has('customerId')
        ? undefined
        : cleanId(
            payload.customerId,
            {
              field: 'customerId',
              required: false,
            },
          ),

    customerType:
      partial && !has('customerType')
        ? undefined
        : cleanEnum(
            payload.customerType,
            CUSTOMER_TYPES,
            {
              field: 'customerType',
            },
          ),

    fullName:
      partial && !has('fullName')
        ? undefined
        : cleanText(
            payload.fullName,
            {
              field: 'fullName',
              required:
                !partial &&
                payload.customerType !==
                  'Doanh nghiệp',
              maxLength: 160,
            },
          ),

    companyName:
      partial && !has('companyName')
        ? undefined
        : cleanText(
            payload.companyName,
            {
              field: 'companyName',
              required:
                !partial &&
                payload.customerType ===
                  'Doanh nghiệp',
              maxLength: 200,
            },
          ),

    representativeName:
      partial &&
      !has('representativeName')
        ? undefined
        : cleanText(
            payload.representativeName,
            {
              field:
                'representativeName',
              maxLength: 160,
            },
          ),

    representativeTitle:
      partial &&
      !has('representativeTitle')
        ? undefined
        : cleanText(
            payload.representativeTitle,
            {
              field:
                'representativeTitle',
              maxLength: 120,
            },
          ),

    taxCode:
      partial && !has('taxCode')
        ? undefined
        : cleanTaxCode(
            payload.taxCode,
            {
              field: 'taxCode',
            },
          ),

    identityNumber:
      partial &&
      !has('identityNumber')
        ? undefined
        : cleanIdentityNumber(
            payload.identityNumber,
            {
              field:
                'identityNumber',
            },
          ),

    identityIssueDate:
      partial &&
      !has('identityIssueDate')
        ? undefined
        : cleanIsoDate(
            payload.identityIssueDate,
            {
              field:
                'identityIssueDate',
            },
          ),

    identityIssuePlace:
      partial &&
      !has('identityIssuePlace')
        ? undefined
        : cleanText(
            payload.identityIssuePlace,
            {
              field:
                'identityIssuePlace',
              maxLength: 200,
            },
          ),

    phone:
      partial && !has('phone')
        ? undefined
        : cleanPhone(
            payload.phone,
            {
              field: 'phone',
              required: !partial,
            },
          ),

    email:
      partial && !has('email')
        ? undefined
        : cleanEmail(
            payload.email,
            {
              field: 'email',
              required: false,
            },
          ),

    address:
      partial && !has('address')
        ? undefined
        : cleanText(
            payload.address,
            {
              field: 'address',
              maxLength: 500,
            },
          ),

    source:
      partial && !has('source')
        ? undefined
        : cleanEnum(
            payload.source ||
              'Nhập thủ công',
            CUSTOMER_SOURCES,
            {
              field: 'source',
            },
          ),

    leadId:
      partial && !has('leadId')
        ? undefined
        : cleanId(
            payload.leadId,
            {
              field: 'leadId',
              required: false,
            },
          ),

    status:
      partial && !has('status')
        ? undefined
        : cleanEnum(
            payload.status ||
              'Tiềm năng',
            CUSTOMER_STATUSES,
            {
              field: 'status',
            },
          ),

    notes:
      partial && !has('notes')
        ? undefined
        : cleanText(
            payload.notes,
            {
              field: 'notes',
              maxLength: 5000,
              preserveNewLines: true,
            },
          ),
  };

  const effectiveType =
    result.customerType ||
    customerType ||
    payload.customerType;

  if (!partial) {
    if (
      effectiveType === 'Cá nhân' &&
      !result.fullName
    ) {
      throw new ApiError(
        400,
        'CUSTOMER_NAME_REQUIRED',
        'fullName is required for an individual customer.',
        { field: 'fullName' },
      );
    }

    if (
      effectiveType === 'Doanh nghiệp' &&
      !result.companyName
    ) {
      throw new ApiError(
        400,
        'COMPANY_NAME_REQUIRED',
        'companyName is required for a business customer.',
        { field: 'companyName' },
      );
    }
  }

  const compactResult = Object.fromEntries(
    Object.entries(result).filter(
      ([, value]) =>
        value !== undefined,
    ),
  );

  if (!partial) {
    compactResult.displayName =
      getCustomerDisplayName(
        compactResult,
      );
  }

  return compactResult;
};

export const validateProject = (
  payload,
  options = {},
) => {
  const partial =
    options.partial === true;

  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw new ApiError(
      400,
      'INVALID_PAYLOAD',
      'Project payload is invalid.',
    );
  }

  const has = (key) =>
    Object.prototype.hasOwnProperty.call(
      payload,
      key,
    );

  const result = {
    projectId:
      partial && !has('projectId')
        ? undefined
        : cleanId(
            payload.projectId,
            {
              field: 'projectId',
              required: false,
            },
          ),

    customerId:
      partial && !has('customerId')
        ? undefined
        : cleanId(
            payload.customerId,
            {
              field: 'customerId',
              required: !partial,
            },
          ),

    projectName:
      partial && !has('projectName')
        ? undefined
        : cleanText(
            payload.projectName,
            {
              field: 'projectName',
              required: !partial,
              minLength: 2,
              maxLength: 200,
            },
          ),

    projectType:
      partial && !has('projectType')
        ? undefined
        : cleanText(
            payload.projectType,
            {
              field: 'projectType',
              maxLength: 120,
            },
          ),

    startDate:
      partial && !has('startDate')
        ? undefined
        : cleanIsoDate(
            payload.startDate,
            {
              field: 'startDate',
            },
          ),

    expectedEndDate:
      partial &&
      !has('expectedEndDate')
        ? undefined
        : cleanIsoDate(
            payload.expectedEndDate,
            {
              field:
                'expectedEndDate',
            },
          ),

    progress:
      partial && !has('progress')
        ? undefined
        : cleanNumber(
            payload.progress ?? 0,
            {
              field: 'progress',
              min: 0,
              max: 100,
              defaultValue: 0,
            },
          ),

    phase:
      partial && !has('phase')
        ? undefined
        : cleanEnum(
            payload.phase ||
              'Tiếp nhận yêu cầu',
            PROJECT_PHASES,
            {
              field: 'phase',
            },
          ),

    status:
      partial && !has('status')
        ? undefined
        : cleanEnum(
            payload.status ||
              'Chưa bắt đầu',
            PROJECT_STATUSES,
            {
              field: 'status',
            },
          ),

    manager:
      partial && !has('manager')
        ? undefined
        : cleanText(
            payload.manager,
            {
              field: 'manager',
              maxLength: 160,
            },
          ),

    websiteUrl:
      partial && !has('websiteUrl')
        ? undefined
        : cleanText(
            payload.websiteUrl,
            {
              field: 'websiteUrl',
              maxLength: 500,
            },
          ),

    adminUrl:
      partial && !has('adminUrl')
        ? undefined
        : cleanText(
            payload.adminUrl,
            {
              field: 'adminUrl',
              maxLength: 500,
            },
          ),

    notes:
      partial && !has('notes')
        ? undefined
        : cleanText(
            payload.notes,
            {
              field: 'notes',
              maxLength: 5000,
              preserveNewLines: true,
            },
          ),
  };

  if (
    result.startDate &&
    result.expectedEndDate &&
    result.expectedEndDate <
      result.startDate
  ) {
    throw new ApiError(
      400,
      'INVALID_PROJECT_DATE_RANGE',
      'expectedEndDate must not be before startDate.',
    );
  }

  return Object.fromEntries(
    Object.entries(result).filter(
      ([, value]) =>
        value !== undefined,
    ),
  );
};

export const validateQuotationItem = (
  item,
  index = 0,
) => {
  if (
    !item ||
    typeof item !== 'object' ||
    Array.isArray(item)
  ) {
    throw new ApiError(
      400,
      'INVALID_QUOTATION_ITEM',
      `Quotation item ${index} is invalid.`,
      { index },
    );
  }

  const quantity = cleanNumber(
    item.quantity ?? 1,
    {
      field:
        `items[${index}].quantity`,
      required: true,
      min: 0.01,
      max: 1000000,
    },
  );

  const unitPrice = cleanNumber(
    item.unitPrice ?? 0,
    {
      field:
        `items[${index}].unitPrice`,
      required: true,
      min: 0,
      max: 1000000000000,
    },
  );

  return {
    itemId: cleanId(
      item.itemId,
      {
        field:
          `items[${index}].itemId`,
        required: false,
      },
    ),

    name: cleanText(
      item.name,
      {
        field:
          `items[${index}].name`,
        required: true,
        minLength: 2,
        maxLength: 250,
      },
    ),

    description: cleanText(
      item.description,
      {
        field:
          `items[${index}].description`,
        maxLength: 3000,
        preserveNewLines: true,
      },
    ),

    quantity,

    unit: cleanText(
      item.unit || 'Hạng mục',
      {
        field:
          `items[${index}].unit`,
        required: true,
        maxLength: 50,
      },
    ),

    unitPrice,

    amount: Number(
      (quantity * unitPrice)
        .toFixed(2),
    ),

    costType: cleanText(
      item.costType ||
        'Một lần',
      {
        field:
          `items[${index}].costType`,
        maxLength: 80,
      },
    ),

    note: cleanText(
      item.note,
      {
        field:
          `items[${index}].note`,
        maxLength: 500,
      },
    ),
  };
};

export const validateQuotation = (
  payload,
  options = {},
) => {
  const partial =
    options.partial === true;

  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw new ApiError(
      400,
      'INVALID_PAYLOAD',
      'Quotation payload is invalid.',
    );
  }

  const has = (key) =>
    Object.prototype.hasOwnProperty.call(
      payload,
      key,
    );

  let items;

  if (!partial || has('items')) {
    if (!Array.isArray(payload.items)) {
      throw new ApiError(
        400,
        'QUOTATION_ITEMS_REQUIRED',
        'items must be an array.',
      );
    }

    if (
      !partial &&
      payload.items.length === 0
    ) {
      throw new ApiError(
        400,
        'QUOTATION_ITEMS_REQUIRED',
        'At least one quotation item is required.',
      );
    }

    if (payload.items.length > 100) {
      throw new ApiError(
        400,
        'TOO_MANY_QUOTATION_ITEMS',
        'Quotation has too many items.',
      );
    }

    items = payload.items.map(
      validateQuotationItem,
    );
  }

  const discount = cleanNumber(
    partial && !has('discount')
      ? null
      : payload.discount ?? 0,
    {
      field: 'discount',
      min: 0,
      max: 1000000000000,
      defaultValue:
        partial && !has('discount')
          ? undefined
          : 0,
    },
  );

  const taxRate = cleanNumber(
    partial && !has('taxRate')
      ? null
      : payload.taxRate ?? 0,
    {
      field: 'taxRate',
      min: 0,
      max: 100,
      defaultValue:
        partial && !has('taxRate')
          ? undefined
          : 0,
    },
  );

  const result = {
    quotationId:
      partial && !has('quotationId')
        ? undefined
        : cleanId(
            payload.quotationId,
            {
              field: 'quotationId',
              required: false,
            },
          ),

    customerId:
      partial && !has('customerId')
        ? undefined
        : cleanId(
            payload.customerId,
            {
              field: 'customerId',
              required: !partial,
            },
          ),

    projectId:
      partial && !has('projectId')
        ? undefined
        : cleanId(
            payload.projectId,
            {
              field: 'projectId',
              required: false,
            },
          ),

    issueDate:
      partial && !has('issueDate')
        ? undefined
        : cleanIsoDate(
            payload.issueDate,
            {
              field: 'issueDate',
              required: !partial,
            },
          ),

    expiryDate:
      partial && !has('expiryDate')
        ? undefined
        : cleanIsoDate(
            payload.expiryDate,
            {
              field: 'expiryDate',
            },
          ),

    language:
      partial && !has('language')
        ? undefined
        : cleanEnum(
            payload.language || 'vi',
            ['vi', 'en'],
            {
              field: 'language',
            },
          ),

    currency:
      partial && !has('currency')
        ? undefined
        : cleanEnum(
            payload.currency || 'VND',
            ['VND', 'USD'],
            {
              field: 'currency',
            },
          ),

    discount,

    taxRate,

    depositPercent:
      partial &&
      !has('depositPercent')
        ? undefined
        : cleanNumber(
            payload.depositPercent ?? 0,
            {
              field:
                'depositPercent',
              min: 0,
              max: 100,
              defaultValue: 0,
            },
          ),

    status:
      partial && !has('status')
        ? undefined
        : cleanEnum(
            payload.status ||
              'Bản nháp',
            QUOTATION_STATUSES,
            {
              field: 'status',
            },
          ),

    notes:
      partial && !has('notes')
        ? undefined
        : cleanText(
            payload.notes,
            {
              field: 'notes',
              maxLength: 5000,
              preserveNewLines: true,
            },
          ),

    items,
  };

  if (
    result.issueDate &&
    result.expiryDate &&
    result.expiryDate <
      result.issueDate
  ) {
    throw new ApiError(
      400,
      'INVALID_QUOTATION_DATE_RANGE',
      'expiryDate must not be before issueDate.',
    );
  }

  if (items) {
    const subtotal = items.reduce(
      (sum, item) =>
        sum + item.amount,
      0,
    );

    const effectiveDiscount =
      discount || 0;

    const taxableAmount =
      Math.max(
        subtotal -
          effectiveDiscount,
        0,
      );

    const taxAmount =
      taxableAmount *
      ((taxRate || 0) / 100);

    result.subtotal = Number(
      subtotal.toFixed(2),
    );

    result.taxAmount = Number(
      taxAmount.toFixed(2),
    );

    result.total = Number(
      (
        taxableAmount +
        taxAmount
      ).toFixed(2),
    );
  }

  return Object.fromEntries(
    Object.entries(result).filter(
      ([, value]) =>
        value !== undefined,
    ),
  );
};

export const validateContract = (
  payload,
  options = {},
) => {
  const partial =
    options.partial === true;

  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw new ApiError(
      400,
      'INVALID_PAYLOAD',
      'Contract payload is invalid.',
    );
  }

  const has = (key) =>
    Object.prototype.hasOwnProperty.call(
      payload,
      key,
    );

  const result = {
    contractId:
      partial && !has('contractId')
        ? undefined
        : cleanId(
            payload.contractId,
            {
              field: 'contractId',
              required: false,
            },
          ),

    customerId:
      partial && !has('customerId')
        ? undefined
        : cleanId(
            payload.customerId,
            {
              field: 'customerId',
              required: !partial,
            },
          ),

    projectId:
      partial && !has('projectId')
        ? undefined
        : cleanId(
            payload.projectId,
            {
              field: 'projectId',
              required: false,
            },
          ),

    quotationId:
      partial && !has('quotationId')
        ? undefined
        : cleanId(
            payload.quotationId,
            {
              field: 'quotationId',
              required: false,
            },
          ),

    title:
      partial && !has('title')
        ? undefined
        : cleanText(
            payload.title,
            {
              field: 'title',
              required: !partial,
              minLength: 3,
              maxLength: 250,
            },
          ),

    signedDate:
      partial && !has('signedDate')
        ? undefined
        : cleanIsoDate(
            payload.signedDate,
            {
              field: 'signedDate',
            },
          ),

    effectiveDate:
      partial && !has('effectiveDate')
        ? undefined
        : cleanIsoDate(
            payload.effectiveDate,
            {
              field: 'effectiveDate',
            },
          ),

    value:
      partial && !has('value')
        ? undefined
        : cleanNumber(
            payload.value,
            {
              field: 'value',
              required: !partial,
              min: 0,
              max: 1000000000000,
            },
          ),

    depositAmount:
      partial &&
      !has('depositAmount')
        ? undefined
        : cleanNumber(
            payload.depositAmount ?? 0,
            {
              field:
                'depositAmount',
              min: 0,
              max: 1000000000000,
              defaultValue: 0,
            },
          ),

    durationText:
      partial &&
      !has('durationText')
        ? undefined
        : cleanText(
            payload.durationText,
            {
              field: 'durationText',
              maxLength: 500,
            },
          ),

    scope:
      partial && !has('scope')
        ? undefined
        : cleanText(
            payload.scope,
            {
              field: 'scope',
              maxLength: 10000,
              preserveNewLines: true,
            },
          ),

    paymentTerms:
      partial &&
      !has('paymentTerms')
        ? undefined
        : cleanText(
            payload.paymentTerms,
            {
              field: 'paymentTerms',
              maxLength: 10000,
              preserveNewLines: true,
            },
          ),

    warrantyTerms:
      partial &&
      !has('warrantyTerms')
        ? undefined
        : cleanText(
            payload.warrantyTerms,
            {
              field: 'warrantyTerms',
              maxLength: 10000,
              preserveNewLines: true,
            },
          ),

    terminationTerms:
      partial &&
      !has('terminationTerms')
        ? undefined
        : cleanText(
            payload.terminationTerms,
            {
              field:
                'terminationTerms',
              maxLength: 10000,
              preserveNewLines: true,
            },
          ),

    disputeTerms:
      partial &&
      !has('disputeTerms')
        ? undefined
        : cleanText(
            payload.disputeTerms,
            {
              field: 'disputeTerms',
              maxLength: 10000,
              preserveNewLines: true,
            },
          ),

    status:
      partial && !has('status')
        ? undefined
        : cleanEnum(
            payload.status ||
              'Bản nháp',
            CONTRACT_STATUSES,
            {
              field: 'status',
            },
          ),

    notes:
      partial && !has('notes')
        ? undefined
        : cleanText(
            payload.notes,
            {
              field: 'notes',
              maxLength: 5000,
              preserveNewLines: true,
            },
          ),
  };

  if (
    result.signedDate &&
    result.effectiveDate &&
    result.effectiveDate <
      result.signedDate
  ) {
    throw new ApiError(
      400,
      'INVALID_CONTRACT_DATE_RANGE',
      'effectiveDate must not be before signedDate.',
    );
  }

  if (
    result.value !== undefined &&
    result.depositAmount !== undefined &&
    result.depositAmount >
      result.value
  ) {
    throw new ApiError(
      400,
      'INVALID_DEPOSIT_AMOUNT',
      'depositAmount must not exceed contract value.',
    );
  }

  return Object.fromEntries(
    Object.entries(result).filter(
      ([, value]) =>
        value !== undefined,
    ),
  );
};
