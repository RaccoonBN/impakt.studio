import {
  randomUUID,
} from 'node:crypto';

import {
  ApiError,
} from './http.js';

import {
  cleanEmail,
  cleanEnum,
  cleanId,
  cleanNumber,
  cleanPhone,
  cleanTaxCode,
  cleanText,
} from './validation.js';

export const DOCUMENT_TYPES = Object.freeze({
  quotation: Object.freeze({
    key: 'quotation',
    prefix: 'BG',
    label: 'Báo giá',
  }),

  contract: Object.freeze({
    key: 'contract',
    prefix: 'HD',
    label: 'Hợp đồng',
  }),

  appendix: Object.freeze({
    key: 'appendix',
    prefix: 'PL',
    label: 'Phụ lục',
  }),

  acceptance: Object.freeze({
    key: 'acceptance',
    prefix: 'NT',
    label: 'Biên bản nghiệm thu',
  }),

  paymentRequest: Object.freeze({
    key: 'paymentRequest',
    prefix: 'DNTT',
    label: 'Đề nghị thanh toán',
  }),

  liquidation: Object.freeze({
    key: 'liquidation',
    prefix: 'TL',
    label: 'Biên bản thanh lý',
  }),
});

export const DOCUMENT_LANGUAGES =
  Object.freeze([
    'vi',
    'en',
  ]);

export const DOCUMENT_CURRENCIES =
  Object.freeze([
    'VND',
    'USD',
  ]);

export const DISCOUNT_TYPES =
  Object.freeze([
    'amount',
    'percent',
  ]);

const DOCUMENT_TYPE_KEYS =
  Object.freeze(
    Object.keys(DOCUMENT_TYPES),
  );

const MONEY_DECIMALS = Object.freeze({
  VND: 0,
  USD: 2,
});

const MONEY_EPSILON = 0.000001;

const VIETNAMESE_DIGITS = Object.freeze([
  'không',
  'một',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
]);

const VIETNAMESE_SCALE_GROUPS =
  Object.freeze([
    '',
    'nghìn',
    'triệu',
    'tỷ',
    'nghìn tỷ',
    'triệu tỷ',
  ]);

const padNumber = (
  value,
  length,
) =>
  String(value).padStart(
    length,
    '0',
  );

const normalizeDate = (
  value = new Date(),
) => {
  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(
      400,
      'INVALID_DOCUMENT_DATE',
      'Document date is invalid.',
    );
  }

  return date;
};

const normalizeDocumentType = (
  value,
) =>
  cleanEnum(
    value,
    DOCUMENT_TYPE_KEYS,
    {
      field: 'documentType',
    },
  );

const normalizeSequence = (
  value,
) =>
  cleanNumber(value, {
    field: 'sequence',
    required: true,
    integer: true,
    min: 1,
    max: 999999,
  });

export const getDocumentTypeConfig = (
  documentType,
) =>
  DOCUMENT_TYPES[
    normalizeDocumentType(
      documentType,
    )
  ];

export const generateRecordId = (
  prefix,
  options = {},
) => {
  const normalizedPrefix =
    cleanText(prefix, {
      field: 'prefix',
      required: true,
      minLength: 2,
      maxLength: 12,
    })
      .replace(
        /[^A-Za-z0-9]/g,
        '',
      )
      .toUpperCase();

  if (!normalizedPrefix) {
    throw new ApiError(
      400,
      'INVALID_RECORD_PREFIX',
      'Record prefix is invalid.',
    );
  }

  const date =
    normalizeDate(
      options.date ||
        new Date(),
    );

  const datePart = [
    date.getFullYear(),
    padNumber(
      date.getMonth() + 1,
      2,
    ),
    padNumber(
      date.getDate(),
      2,
    ),
  ].join('');

  const randomPart =
    randomUUID()
      .replace(/-/g, '')
      .slice(0, 8)
      .toUpperCase();

  return [
    normalizedPrefix,
    datePart,
    randomPart,
  ].join('-');
};

export const generateDocumentNumber = (
  options = {},
) => {
  const typeConfig =
    getDocumentTypeConfig(
      options.documentType,
    );

  const sequence =
    normalizeSequence(
      options.sequence,
    );

  const date =
    normalizeDate(
      options.date ||
        new Date(),
    );

  const prefix =
    cleanText(
      options.prefix ||
        typeConfig.prefix,
      {
        field: 'prefix',
        required: true,
        maxLength: 20,
      },
    )
      .replace(
        /[^A-Za-z0-9]/g,
        '',
      )
      .toUpperCase();

  if (!prefix) {
    throw new ApiError(
      400,
      'INVALID_DOCUMENT_PREFIX',
      'Document prefix is invalid.',
    );
  }

  const organizationCode =
    cleanText(
      options.organizationCode ||
        'IMPAKT',
      {
        field:
          'organizationCode',
        required: true,
        maxLength: 30,
      },
    )
      .replace(
        /[^A-Za-z0-9]/g,
        '',
      )
      .toUpperCase();

  const year =
    date.getFullYear();

  const sequencePart =
    padNumber(sequence, 4);

  return [
    prefix,
    year,
    sequencePart,
    organizationCode,
  ].join('-');
};

export const generateDocumentId = (
  documentType,
  options = {},
) => {
  const typeConfig =
    getDocumentTypeConfig(
      documentType,
    );

  return generateRecordId(
    typeConfig.prefix,
    options,
  );
};

export const roundMoney = (
  value,
  currency = 'VND',
) => {
  const normalizedCurrency =
    cleanEnum(
      currency,
      DOCUMENT_CURRENCIES,
      {
        field: 'currency',
      },
    );

  const number =
    cleanNumber(value, {
      field: 'money',
      required: true,
      min: -1000000000000000,
      max: 1000000000000000,
    });

  const decimals =
    MONEY_DECIMALS[
      normalizedCurrency
    ];

  const factor = 10 ** decimals;

  return (
    Math.round(
      (number +
        Number.EPSILON) *
        factor,
    ) / factor
  );
};

export const formatCurrency = (
  value,
  currency = 'VND',
  locale = 'vi-VN',
) => {
  const normalizedCurrency =
    cleanEnum(
      currency,
      DOCUMENT_CURRENCIES,
      {
        field: 'currency',
      },
    );

  const amount =
    roundMoney(
      value,
      normalizedCurrency,
    );

  return new Intl.NumberFormat(
    locale,
    {
      style: 'currency',
      currency:
        normalizedCurrency,
      minimumFractionDigits:
        MONEY_DECIMALS[
          normalizedCurrency
        ],
      maximumFractionDigits:
        MONEY_DECIMALS[
          normalizedCurrency
        ],
    },
  ).format(amount);
};

const readThreeDigitGroup = (
  value,
  options = {},
) => {
  const group = Number(value);

  if (
    !Number.isInteger(group) ||
    group < 0 ||
    group > 999
  ) {
    throw new ApiError(
      500,
      'INVALID_NUMBER_GROUP',
      'Unable to read number group.',
    );
  }

  if (group === 0) {
    return '';
  }

  const forceHundreds =
    options.forceHundreds === true;

  const hundreds =
    Math.floor(group / 100);

  const tens =
    Math.floor(
      (group % 100) / 10,
    );

  const units =
    group % 10;

  const words = [];

  if (
    hundreds > 0 ||
    forceHundreds
  ) {
    words.push(
      VIETNAMESE_DIGITS[
        hundreds
      ],
      'trăm',
    );
  }

  if (tens > 1) {
    words.push(
      VIETNAMESE_DIGITS[tens],
      'mươi',
    );

    if (units === 1) {
      words.push('mốt');
    } else if (units === 4) {
      words.push('tư');
    } else if (units === 5) {
      words.push('lăm');
    } else if (units > 0) {
      words.push(
        VIETNAMESE_DIGITS[
          units
        ],
      );
    }
  } else if (tens === 1) {
    words.push('mười');

    if (units === 5) {
      words.push('lăm');
    } else if (units > 0) {
      words.push(
        VIETNAMESE_DIGITS[
          units
        ],
      );
    }
  } else if (units > 0) {
    if (
      hundreds > 0 ||
      forceHundreds
    ) {
      words.push('lẻ');
    }

    words.push(
      VIETNAMESE_DIGITS[
        units
      ],
    );
  }

  return words.join(' ');
};

const capitalizeFirstLetter = (
  value,
) => {
  const text =
    String(value || '').trim();

  if (!text) {
    return '';
  }

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
};

export const amountToVietnameseWords = (
  value,
  options = {},
) => {
  const currency =
    cleanEnum(
      options.currency ||
        'VND',
      DOCUMENT_CURRENCIES,
      {
        field: 'currency',
      },
    );

  if (currency !== 'VND') {
    throw new ApiError(
      400,
      'UNSUPPORTED_MONEY_WORDS_CURRENCY',
      'Vietnamese money words currently support VND only.',
    );
  }

  const amount =
    roundMoney(value, 'VND');

  if (
    !Number.isSafeInteger(amount)
  ) {
    throw new ApiError(
      400,
      'MONEY_WORDS_AMOUNT_OUT_OF_RANGE',
      'Amount must be a safe integer.',
    );
  }

  const isNegative =
    amount < 0;

  const absoluteAmount =
    Math.abs(amount);

  if (absoluteAmount === 0) {
    return 'Không đồng';
  }

  const groups = [];
  let remaining =
    absoluteAmount;

  while (remaining > 0) {
    groups.push(
      remaining % 1000,
    );

    remaining =
      Math.floor(
        remaining / 1000,
      );
  }

  if (
    groups.length >
    VIETNAMESE_SCALE_GROUPS.length
  ) {
    throw new ApiError(
      400,
      'MONEY_WORDS_AMOUNT_OUT_OF_RANGE',
      'Amount is too large to convert.',
    );
  }

  const words = [];

  for (
    let index =
      groups.length - 1;
    index >= 0;
    index -= 1
  ) {
    const group =
      groups[index];

    if (group === 0) {
      continue;
    }

    const hasHigherGroup =
      index <
      groups.length - 1;

    const groupWords =
      readThreeDigitGroup(
        group,
        {
          forceHundreds:
            hasHigherGroup &&
            group < 100,
        },
      );

    if (groupWords) {
      words.push(groupWords);
    }

    const scale =
      VIETNAMESE_SCALE_GROUPS[
        index
      ];

    if (scale) {
      words.push(scale);
    }
  }

  const result = [
    isNegative ? 'âm' : '',
    words.join(' '),
    'đồng',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return capitalizeFirstLetter(
    result,
  );
};

const normalizeLineItem = (
  item,
  index,
  currency,
) => {
  if (
    !item ||
    typeof item !== 'object' ||
    Array.isArray(item)
  ) {
    throw new ApiError(
      400,
      'INVALID_DOCUMENT_ITEM',
      `Item ${index + 1} is invalid.`,
      { index },
    );
  }

  const quantity =
    cleanNumber(
      item.quantity ?? 1,
      {
        field:
          `items[${index}].quantity`,
        required: true,
        min: 0.01,
        max: 1000000,
      },
    );

  const unitPrice =
    cleanNumber(
      item.unitPrice ?? 0,
      {
        field:
          `items[${index}].unitPrice`,
        required: true,
        min: 0,
        max: 1000000000000,
      },
    );

  const amount =
    roundMoney(
      quantity * unitPrice,
      currency,
    );

  return {
    itemId:
      cleanId(
        item.itemId,
        {
          field:
            `items[${index}].itemId`,
          required: false,
        },
      ),

    name:
      cleanText(
        item.name,
        {
          field:
            `items[${index}].name`,
          required: true,
          minLength: 2,
          maxLength: 250,
        },
      ),

    description:
      cleanText(
        item.description,
        {
          field:
            `items[${index}].description`,
          maxLength: 3000,
          preserveNewLines: true,
        },
      ),

    quantity,

    unit:
      cleanText(
        item.unit ||
          'Hạng mục',
        {
          field:
            `items[${index}].unit`,
          required: true,
          maxLength: 50,
        },
      ),

    unitPrice:
      roundMoney(
        unitPrice,
        currency,
      ),

    amount,

    costType:
      cleanText(
        item.costType ||
          'Một lần',
        {
          field:
            `items[${index}].costType`,
          maxLength: 80,
        },
      ),

    note:
      cleanText(
        item.note,
        {
          field:
            `items[${index}].note`,
          maxLength: 500,
        },
      ),
  };
};

export const calculateDocumentTotals = (
  options = {},
) => {
  const currency =
    cleanEnum(
      options.currency ||
        'VND',
      DOCUMENT_CURRENCIES,
      {
        field: 'currency',
      },
    );

  if (!Array.isArray(options.items)) {
    throw new ApiError(
      400,
      'DOCUMENT_ITEMS_REQUIRED',
      'items must be an array.',
    );
  }

  if (options.items.length === 0) {
    throw new ApiError(
      400,
      'DOCUMENT_ITEMS_REQUIRED',
      'At least one item is required.',
    );
  }

  if (options.items.length > 100) {
    throw new ApiError(
      400,
      'TOO_MANY_DOCUMENT_ITEMS',
      'Document has too many items.',
    );
  }

  const items =
    options.items.map(
      (item, index) =>
        normalizeLineItem(
          item,
          index,
          currency,
        ),
    );

  const subtotal =
    roundMoney(
      items.reduce(
        (sum, item) =>
          sum + item.amount,
        0,
      ),
      currency,
    );

  const discountType =
    cleanEnum(
      options.discountType ||
        'amount',
      DISCOUNT_TYPES,
      {
        field:
          'discountType',
      },
    );

  const discountValue =
    cleanNumber(
      options.discountValue ??
        options.discount ??
        0,
      {
        field:
          'discountValue',
        min: 0,
        max:
          discountType ===
          'percent'
            ? 100
            : 1000000000000,
        defaultValue: 0,
      },
    );

  const rawDiscountAmount =
    discountType === 'percent'
      ? subtotal *
        (discountValue / 100)
      : discountValue;

  const discountAmount =
    roundMoney(
      Math.min(
        rawDiscountAmount,
        subtotal,
      ),
      currency,
    );

  const taxableAmount =
    roundMoney(
      Math.max(
        subtotal -
          discountAmount,
        0,
      ),
      currency,
    );

  const taxRate =
    cleanNumber(
      options.taxRate ?? 0,
      {
        field: 'taxRate',
        min: 0,
        max: 100,
        defaultValue: 0,
      },
    );

  const taxAmount =
    roundMoney(
      taxableAmount *
        (taxRate / 100),
      currency,
    );

  const total =
    roundMoney(
      taxableAmount +
        taxAmount,
      currency,
    );

  const depositPercent =
    cleanNumber(
      options.depositPercent ??
        0,
      {
        field:
          'depositPercent',
        min: 0,
        max: 100,
        defaultValue: 0,
      },
    );

  const depositAmount =
    roundMoney(
      total *
        (depositPercent / 100),
      currency,
    );

  const remainingAmount =
    roundMoney(
      total -
        depositAmount,
      currency,
    );

  return {
    currency,
    items,
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    taxableAmount,
    taxRate,
    taxAmount,
    total,
    depositPercent,
    depositAmount,
    remainingAmount,
  };
};

export const buildPaymentSchedule = (
  totalValue,
  stages,
  options = {},
) => {
  const currency =
    cleanEnum(
      options.currency ||
        'VND',
      DOCUMENT_CURRENCIES,
      {
        field: 'currency',
      },
    );

  const total =
    roundMoney(
      cleanNumber(
        totalValue,
        {
          field:
            'totalValue',
          required: true,
          min: 0,
          max:
            1000000000000,
        },
      ),
      currency,
    );

  if (!Array.isArray(stages)) {
    throw new ApiError(
      400,
      'PAYMENT_STAGES_REQUIRED',
      'stages must be an array.',
    );
  }

  if (
    stages.length < 1 ||
    stages.length > 20
  ) {
    throw new ApiError(
      400,
      'INVALID_PAYMENT_STAGE_COUNT',
      'Payment schedule must contain from 1 to 20 stages.',
    );
  }

  let allocatedAmount = 0;

  const normalizedStages =
    stages.map(
      (stage, index) => {
        if (
          !stage ||
          typeof stage !==
            'object' ||
          Array.isArray(stage)
        ) {
          throw new ApiError(
            400,
            'INVALID_PAYMENT_STAGE',
            `Payment stage ${index + 1} is invalid.`,
            { index },
          );
        }

        const percent =
          cleanNumber(
            stage.percent,
            {
              field:
                `stages[${index}].percent`,
              required: true,
              min: 0,
              max: 100,
            },
          );

        const isLastStage =
          index ===
          stages.length - 1;

        const amount =
          isLastStage
            ? roundMoney(
                total -
                  allocatedAmount,
                currency,
              )
            : roundMoney(
                total *
                  (percent / 100),
                currency,
              );

        allocatedAmount =
          roundMoney(
            allocatedAmount +
              amount,
            currency,
          );

        return {
          stageNumber:
            index + 1,

          title:
            cleanText(
              stage.title ||
                `Đợt ${index + 1}`,
              {
                field:
                  `stages[${index}].title`,
                required: true,
                maxLength: 200,
              },
            ),

          percent,

          amount,

          dueDate:
            cleanText(
              stage.dueDate,
              {
                field:
                  `stages[${index}].dueDate`,
                maxLength: 100,
              },
            ),

          condition:
            cleanText(
              stage.condition,
              {
                field:
                  `stages[${index}].condition`,
                maxLength: 1000,
                preserveNewLines: true,
              },
            ),

          status:
            cleanText(
              stage.status ||
                'Chưa thanh toán',
              {
                field:
                  `stages[${index}].status`,
                maxLength: 80,
              },
            ),
        };
      },
    );

  const totalPercent =
    normalizedStages.reduce(
      (sum, stage) =>
        sum + stage.percent,
      0,
    );

  if (
    Math.abs(
      totalPercent - 100,
    ) > MONEY_EPSILON
  ) {
    throw new ApiError(
      400,
      'INVALID_PAYMENT_PERCENT_TOTAL',
      'Payment stage percentages must total 100.',
      {
        totalPercent,
      },
    );
  }

  const scheduleAmount =
    roundMoney(
      normalizedStages.reduce(
        (sum, stage) =>
          sum + stage.amount,
        0,
      ),
      currency,
    );

  if (
    Math.abs(
      scheduleAmount - total,
    ) > MONEY_EPSILON
  ) {
    throw new ApiError(
      500,
      'PAYMENT_SCHEDULE_TOTAL_MISMATCH',
      'Payment schedule does not match document total.',
      {
        total,
        scheduleAmount,
      },
    );
  }

  return {
    currency,
    total,
    totalPercent,
    stages: normalizedStages,
  };
};

export const buildCustomerSnapshot = (
  customer,
) => {
  if (
    !customer ||
    typeof customer !== 'object' ||
    Array.isArray(customer)
  ) {
    throw new ApiError(
      400,
      'INVALID_CUSTOMER',
      'Customer is invalid.',
    );
  }

  const customerType =
    cleanEnum(
      customer.customerType,
      [
        'Cá nhân',
        'Doanh nghiệp',
      ],
      {
        field:
          'customer.customerType',
      },
    );

  const fullName =
    cleanText(
      customer.fullName,
      {
        field:
          'customer.fullName',
        maxLength: 160,
      },
    );

  const companyName =
    cleanText(
      customer.companyName,
      {
        field:
          'customer.companyName',
        maxLength: 200,
      },
    );

  const displayName =
    customerType ===
    'Doanh nghiệp'
      ? companyName
      : fullName;

  if (!displayName) {
    throw new ApiError(
      400,
      'CUSTOMER_DISPLAY_NAME_REQUIRED',
      'Customer name is required.',
    );
  }

  return Object.freeze({
    customerId:
      cleanId(
        customer.customerId,
        {
          field:
            'customer.customerId',
          required: false,
        },
      ),

    customerType,
    displayName,
    fullName,
    companyName,

    representativeName:
      cleanText(
        customer
          .representativeName,
        {
          field:
            'customer.representativeName',
          maxLength: 160,
        },
      ),

    representativeTitle:
      cleanText(
        customer
          .representativeTitle,
        {
          field:
            'customer.representativeTitle',
          maxLength: 120,
        },
      ),

    taxCode:
      cleanTaxCode(
        customer.taxCode,
        {
          field:
            'customer.taxCode',
        },
      ),

    identityNumber:
      cleanText(
        customer.identityNumber,
        {
          field:
            'customer.identityNumber',
          maxLength: 30,
        },
      ),

    identityIssueDate:
      cleanText(
        customer
          .identityIssueDate,
        {
          field:
            'customer.identityIssueDate',
          maxLength: 20,
        },
      ),

    identityIssuePlace:
      cleanText(
        customer
          .identityIssuePlace,
        {
          field:
            'customer.identityIssuePlace',
          maxLength: 200,
        },
      ),

    phone:
      cleanPhone(
        customer.phone,
        {
          field:
            'customer.phone',
        },
      ),

    email:
      cleanEmail(
        customer.email,
        {
          field:
            'customer.email',
        },
      ),

    address:
      cleanText(
        customer.address,
        {
          field:
            'customer.address',
          maxLength: 500,
        },
      ),

    bankName:
      cleanText(
        customer.bankName,
        {
          field:
            'customer.bankName',
          maxLength: 160,
        },
      ),

    bankAccountNumber:
      cleanText(
        customer
          .bankAccountNumber,
        {
          field:
            'customer.bankAccountNumber',
          maxLength: 80,
        },
      ),

    bankAccountName:
      cleanText(
        customer
          .bankAccountName,
        {
          field:
            'customer.bankAccountName',
          maxLength: 200,
        },
      ),
  });
};

export const buildOrganizationSnapshot = (
  organization,
) => {
  if (
    !organization ||
    typeof organization !==
      'object' ||
    Array.isArray(organization)
  ) {
    throw new ApiError(
      400,
      'INVALID_ORGANIZATION',
      'Organization is invalid.',
    );
  }

  const displayName =
    cleanText(
      organization.displayName ||
        organization.companyName,
      {
        field:
          'organization.displayName',
        required: true,
        minLength: 2,
        maxLength: 200,
      },
    );

  return Object.freeze({
    displayName,

    legalName:
      cleanText(
        organization.legalName,
        {
          field:
            'organization.legalName',
          maxLength: 250,
        },
      ),

    representativeName:
      cleanText(
        organization
          .representativeName,
        {
          field:
            'organization.representativeName',
          maxLength: 160,
        },
      ),

    representativeTitle:
      cleanText(
        organization
          .representativeTitle,
        {
          field:
            'organization.representativeTitle',
          maxLength: 120,
        },
      ),

    taxCode:
      cleanTaxCode(
        organization.taxCode,
        {
          field:
            'organization.taxCode',
        },
      ),

    phone:
      cleanPhone(
        organization.phone,
        {
          field:
            'organization.phone',
        },
      ),

    email:
      cleanEmail(
        organization.email,
        {
          field:
            'organization.email',
        },
      ),

    address:
      cleanText(
        organization.address,
        {
          field:
            'organization.address',
          maxLength: 500,
        },
      ),

    website:
      cleanText(
        organization.website,
        {
          field:
            'organization.website',
          maxLength: 500,
        },
      ),

    bankName:
      cleanText(
        organization.bankName,
        {
          field:
            'organization.bankName',
          maxLength: 160,
        },
      ),

    bankAccountNumber:
      cleanText(
        organization
          .bankAccountNumber,
        {
          field:
            'organization.bankAccountNumber',
          maxLength: 80,
        },
      ),

    bankAccountName:
      cleanText(
        organization
          .bankAccountName,
        {
          field:
            'organization.bankAccountName',
          maxLength: 200,
        },
      ),
  });
};

const removeVietnameseDiacritics = (
  value,
) =>
  String(value || '')
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

export const createSafeFileName = (
  options = {},
) => {
  const documentType =
    normalizeDocumentType(
      options.documentType,
    );

  const documentNumber =
    cleanText(
      options.documentNumber,
      {
        field:
          'documentNumber',
        required: true,
        maxLength: 100,
      },
    );

  const customerName =
    cleanText(
      options.customerName,
      {
        field:
          'customerName',
        maxLength: 200,
      },
    );

  const extension =
    cleanEnum(
      String(
        options.extension ||
          'pdf',
      ).toLowerCase(),
      [
        'pdf',
        'docx',
        'html',
      ],
      {
        field: 'extension',
      },
    );

  const typeLabel =
    DOCUMENT_TYPES[
      documentType
    ].prefix;

  const rawName = [
    typeLabel,
    documentNumber,
    customerName,
  ]
    .filter(Boolean)
    .join('-');

  const safeBaseName =
    removeVietnameseDiacritics(
      rawName,
    )
      .replace(
        /[^A-Za-z0-9._-]+/g,
        '-',
      )
      .replace(/-+/g, '-')
      .replace(
        /^[-_.]+|[-_.]+$/g,
        '',
      )
      .slice(0, 160);

  if (!safeBaseName) {
    throw new ApiError(
      400,
      'INVALID_DOCUMENT_FILE_NAME',
      'Unable to create document file name.',
    );
  }

  return `${safeBaseName}.${extension}`;
};

export const createDocumentSnapshot = (
  options = {},
) => {
  const documentType =
    normalizeDocumentType(
      options.documentType,
    );

  const language =
    cleanEnum(
      options.language || 'vi',
      DOCUMENT_LANGUAGES,
      {
        field: 'language',
      },
    );

  const currency =
    cleanEnum(
      options.currency || 'VND',
      DOCUMENT_CURRENCIES,
      {
        field: 'currency',
      },
    );

  const documentNumber =
    cleanText(
      options.documentNumber,
      {
        field:
          'documentNumber',
        required: true,
        maxLength: 100,
      },
    );

  const issuedAt =
    normalizeDate(
      options.issuedAt ||
        new Date(),
    ).toISOString();

  return Object.freeze({
    documentType,
    documentLabel:
      DOCUMENT_TYPES[
        documentType
      ].label,

    documentNumber,
    language,
    currency,
    issuedAt,

    customer:
      buildCustomerSnapshot(
        options.customer,
      ),

    organization:
      buildOrganizationSnapshot(
        options.organization,
      ),

    totals:
      options.totals &&
      typeof options.totals ===
        'object'
        ? structuredClone(
            options.totals,
          )
        : null,

    paymentSchedule:
      options.paymentSchedule &&
      typeof options
        .paymentSchedule ===
        'object'
        ? structuredClone(
            options
              .paymentSchedule,
          )
        : null,
  });
};
