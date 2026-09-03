import {
  ApiError,
} from './http.js';

import {
  cleanEnum,
  cleanText,
} from './validation.js';

import {
  DOCUMENT_CURRENCIES,
  DOCUMENT_LANGUAGES,
  DOCUMENT_TYPES,
  amountToVietnameseWords,
  createSafeFileName,
  formatCurrency,
} from './documents.js';

const SUPPORTED_DOCUMENT_TYPES =
  Object.freeze([
    'quotation',
    'contract',
    'appendix',
    'acceptance',
    'paymentRequest',
    'liquidation',
  ]);

const DEFAULT_FONT_FAMILY = [
  'Inter',
  'Arial',
  'Helvetica',
  'sans-serif',
].join(', ');

const DEFAULT_BRAND = Object.freeze({
  name: 'IMPAKT Studio',
  tagline: 'Smart Design. Real Impact.',
  website: 'https://impakt-studio.vercel.app',
  email: 'impaktstudio.official@gmail.com',
  phone: '',
  address: '',
  primaryColor: '#7c3aed',
  secondaryColor: '#ec4899',
  accentColor: '#f97316',
});

const stripUnsafeControlCharacters = (
  value,
) =>
  String(value ?? '')
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      '',
    );

export const escapeHtml = (
  value,
) =>
  stripUnsafeControlCharacters(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const nl2br = (
  value,
) =>
  escapeHtml(value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '<br>');

export const sanitizeExternalUrl = (
  value,
  options = {},
) => {
  const allowDataImage =
    options.allowDataImage === true;

  const text = cleanText(value, {
    field:
      options.field || 'url',
    maxLength:
      options.maxLength || 5000,
  });

  if (!text) {
    return '';
  }

  if (
    allowDataImage &&
    /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(
      text,
    )
  ) {
    return text.replace(/\s+/g, '');
  }

  let url;

  try {
    url = new URL(text);
  } catch {
    throw new ApiError(
      400,
      'INVALID_EXTERNAL_URL',
      `${
        options.field || 'url'
      } is invalid.`,
      {
        field:
          options.field || 'url',
      },
    );
  }

  if (
    !['https:', 'http:'].includes(
      url.protocol,
    )
  ) {
    throw new ApiError(
      400,
      'UNSAFE_EXTERNAL_URL',
      `${
        options.field || 'url'
      } must use HTTP or HTTPS.`,
      {
        field:
          options.field || 'url',
      },
    );
  }

  return url.toString();
};

export const formatDocumentDate = (
  value,
  language = 'vi',
) => {
  const normalizedLanguage =
    cleanEnum(
      language,
      DOCUMENT_LANGUAGES,
      {
        field: 'language',
      },
    );

  if (!value) {
    return '';
  }

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

  return new Intl.DateTimeFormat(
    normalizedLanguage === 'vi'
      ? 'vi-VN'
      : 'en-US',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(date);
};

const buildBrand = (
  brand = {},
) => {
  const merged = {
    ...DEFAULT_BRAND,
    ...(brand || {}),
  };

  return {
    name: cleanText(
      merged.name,
      {
        field: 'brand.name',
        required: true,
        maxLength: 200,
      },
    ),

    tagline: cleanText(
      merged.tagline,
      {
        field: 'brand.tagline',
        maxLength: 250,
      },
    ),

    website:
      merged.website
        ? sanitizeExternalUrl(
            merged.website,
            {
              field:
                'brand.website',
            },
          )
        : '',

    email: cleanText(
      merged.email,
      {
        field: 'brand.email',
        maxLength: 160,
      },
    ),

    phone: cleanText(
      merged.phone,
      {
        field: 'brand.phone',
        maxLength: 60,
      },
    ),

    address: cleanText(
      merged.address,
      {
        field: 'brand.address',
        maxLength: 500,
      },
    ),

    logoUrl:
      merged.logoUrl
        ? sanitizeExternalUrl(
            merged.logoUrl,
            {
              field:
                'brand.logoUrl',
              allowDataImage: true,
              maxLength:
                2_000_000,
            },
          )
        : '',

    signatureUrl:
      merged.signatureUrl
        ? sanitizeExternalUrl(
            merged.signatureUrl,
            {
              field:
                'brand.signatureUrl',
              allowDataImage: true,
              maxLength:
                2_000_000,
            },
          )
        : '',

    primaryColor:
      normalizeHexColor(
        merged.primaryColor,
        DEFAULT_BRAND.primaryColor,
      ),

    secondaryColor:
      normalizeHexColor(
        merged.secondaryColor,
        DEFAULT_BRAND.secondaryColor,
      ),

    accentColor:
      normalizeHexColor(
        merged.accentColor,
        DEFAULT_BRAND.accentColor,
      ),
  };
};

const normalizeHexColor = (
  value,
  fallback,
) => {
  const text =
    String(value || '')
      .trim();

  if (
    /^#[0-9A-Fa-f]{6}$/.test(
      text,
    )
  ) {
    return text.toLowerCase();
  }

  return fallback;
};

const buildPartyRows = (
  party,
  language,
) => {
  const labels =
    language === 'vi'
      ? {
          customerType:
            'Loại khách hàng',
          fullName:
            'Họ và tên',
          companyName:
            'Tên doanh nghiệp',
          representative:
            'Người đại diện',
          representativeTitle:
            'Chức vụ',
          taxCode:
            'Mã số thuế',
          identityNumber:
            'CCCD/Hộ chiếu',
          identityIssueDate:
            'Ngày cấp',
          identityIssuePlace:
            'Nơi cấp',
          phone:
            'Số điện thoại',
          email: 'Email',
          address:
            'Địa chỉ',
          bankName:
            'Ngân hàng',
          bankAccountNumber:
            'Số tài khoản',
          bankAccountName:
            'Chủ tài khoản',
        }
      : {
          customerType:
            'Customer type',
          fullName:
            'Full name',
          companyName:
            'Company name',
          representative:
            'Representative',
          representativeTitle:
            'Title',
          taxCode:
            'Tax code',
          identityNumber:
            'ID/Passport',
          identityIssueDate:
            'Issue date',
          identityIssuePlace:
            'Issue place',
          phone: 'Phone',
          email: 'Email',
          address: 'Address',
          bankName: 'Bank',
          bankAccountNumber:
            'Bank account',
          bankAccountName:
            'Account holder',
        };

  const rows = [
    [
      labels.customerType,
      party.customerType,
    ],
    [
      labels.fullName,
      party.fullName,
    ],
    [
      labels.companyName,
      party.companyName,
    ],
    [
      labels.representative,
      party.representativeName,
    ],
    [
      labels.representativeTitle,
      party.representativeTitle,
    ],
    [
      labels.taxCode,
      party.taxCode,
    ],
    [
      labels.identityNumber,
      party.identityNumber,
    ],
    [
      labels.identityIssueDate,
      party.identityIssueDate,
    ],
    [
      labels.identityIssuePlace,
      party.identityIssuePlace,
    ],
    [
      labels.phone,
      party.phone,
    ],
    [
      labels.email,
      party.email,
    ],
    [
      labels.address,
      party.address,
    ],
    [
      labels.bankName,
      party.bankName,
    ],
    [
      labels.bankAccountNumber,
      party.bankAccountNumber,
    ],
    [
      labels.bankAccountName,
      party.bankAccountName,
    ],
  ];

  return rows.filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== '',
  );
};

const renderPartyTable = (
  title,
  party,
  language,
) => {
  const rows =
    buildPartyRows(
      party || {},
      language,
    );

  return `
    <section class="party-card">
      <h3>${escapeHtml(title)}</h3>
      <table class="party-table">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <th>${escapeHtml(label)}</th>
                  <td>${nl2br(value)}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </section>
  `;
};

const getText = (
  language,
) =>
  language === 'vi'
    ? {
        quotation:
          'BÁO GIÁ',
        contract:
          'HỢP ĐỒNG DỊCH VỤ',
        appendix:
          'PHỤ LỤC HỢP ĐỒNG',
        acceptance:
          'BIÊN BẢN NGHIỆM THU',
        paymentRequest:
          'ĐỀ NGHỊ THANH TOÁN',
        liquidation:
          'BIÊN BẢN THANH LÝ',
        documentNumber:
          'Số',
        issueDate:
          'Ngày phát hành',
        expiryDate:
          'Hiệu lực đến',
        seller:
          'BÊN CUNG CẤP',
        customer:
          'KHÁCH HÀNG',
        itemNumber:
          'STT',
        itemName:
          'Hạng mục',
        description:
          'Mô tả',
        quantity:
          'SL',
        unit:
          'Đơn vị',
        unitPrice:
          'Đơn giá',
        amount:
          'Thành tiền',
        note:
          'Ghi chú',
        subtotal:
          'Tạm tính',
        discount:
          'Giảm giá',
        taxableAmount:
          'Giá trị tính thuế',
        tax:
          'Thuế',
        total:
          'Tổng thanh toán',
        deposit:
          'Tiền đặt cọc',
        remaining:
          'Còn lại',
        amountInWords:
          'Bằng chữ',
        paymentSchedule:
          'TIẾN ĐỘ THANH TOÁN',
        stage:
          'Đợt',
        condition:
          'Điều kiện thanh toán',
        percent:
          'Tỷ lệ',
        dueDate:
          'Hạn thanh toán',
        notes:
          'GHI CHÚ',
        scope:
          'PHẠM VI CÔNG VIỆC',
        paymentTerms:
          'ĐIỀU KHOẢN THANH TOÁN',
        warrantyTerms:
          'BẢO HÀNH VÀ HỖ TRỢ',
        terminationTerms:
          'CHẤM DỨT HỢP ĐỒNG',
        disputeTerms:
          'GIẢI QUYẾT TRANH CHẤP',
        providerSignature:
          'ĐẠI DIỆN BÊN CUNG CẤP',
        customerSignature:
          'ĐẠI DIỆN KHÁCH HÀNG',
      }
    : {
        quotation:
          'QUOTATION',
        contract:
          'SERVICE CONTRACT',
        appendix:
          'CONTRACT APPENDIX',
        acceptance:
          'ACCEPTANCE MINUTES',
        paymentRequest:
          'PAYMENT REQUEST',
        liquidation:
          'CONTRACT LIQUIDATION',
        documentNumber:
          'No.',
        issueDate:
          'Issue date',
        expiryDate:
          'Valid until',
        seller:
          'SERVICE PROVIDER',
        customer:
          'CUSTOMER',
        itemNumber:
          'No.',
        itemName:
          'Item',
        description:
          'Description',
        quantity:
          'Qty',
        unit:
          'Unit',
        unitPrice:
          'Unit price',
        amount:
          'Amount',
        note:
          'Note',
        subtotal:
          'Subtotal',
        discount:
          'Discount',
        taxableAmount:
          'Taxable amount',
        tax:
          'Tax',
        total:
          'Total',
        deposit:
          'Deposit',
        remaining:
          'Remaining',
        amountInWords:
          'In words',
        paymentSchedule:
          'PAYMENT SCHEDULE',
        stage:
          'Stage',
        condition:
          'Payment condition',
        percent:
          'Percent',
        dueDate:
          'Due date',
        notes:
          'NOTES',
        scope:
          'SCOPE OF WORK',
        paymentTerms:
          'PAYMENT TERMS',
        warrantyTerms:
          'WARRANTY AND SUPPORT',
        terminationTerms:
          'TERMINATION',
        disputeTerms:
          'DISPUTE RESOLUTION',
        providerSignature:
          'SERVICE PROVIDER',
        customerSignature:
          'CUSTOMER',
      };

const renderItemsTable = (
  items,
  currency,
  language,
) => {
  const text = getText(language);

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new ApiError(
      400,
      'PDF_ITEMS_REQUIRED',
      'At least one document item is required.',
    );
  }

  return `
    <section class="document-section">
      <table class="items-table">
        <thead>
          <tr>
            <th class="col-index">${escapeHtml(text.itemNumber)}</th>
            <th>${escapeHtml(text.itemName)}</th>
            <th>${escapeHtml(text.description)}</th>
            <th class="col-number">${escapeHtml(text.quantity)}</th>
            <th class="col-unit">${escapeHtml(text.unit)}</th>
            <th class="col-money">${escapeHtml(text.unitPrice)}</th>
            <th class="col-money">${escapeHtml(text.amount)}</th>
            <th class="col-note">${escapeHtml(text.note)}</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td class="item-name">${nl2br(item.name)}</td>
                  <td>${nl2br(item.description)}</td>
                  <td class="text-right">${escapeHtml(item.quantity)}</td>
                  <td class="text-center">${escapeHtml(item.unit)}</td>
                  <td class="text-right">${escapeHtml(
                    formatCurrency(
                      item.unitPrice,
                      currency,
                      language === 'vi'
                        ? 'vi-VN'
                        : 'en-US',
                    ),
                  )}</td>
                  <td class="text-right strong">${escapeHtml(
                    formatCurrency(
                      item.amount,
                      currency,
                      language === 'vi'
                        ? 'vi-VN'
                        : 'en-US',
                    ),
                  )}</td>
                  <td>${nl2br(item.note)}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </section>
  `;
};

const renderTotalsTable = (
  totals,
  language,
) => {
  const text = getText(language);
  const currency =
    cleanEnum(
      totals.currency ||
        'VND',
      DOCUMENT_CURRENCIES,
      {
        field:
          'totals.currency',
      },
    );

  const locale =
    language === 'vi'
      ? 'vi-VN'
      : 'en-US';

  const money = (value) =>
    escapeHtml(
      formatCurrency(
        value || 0,
        currency,
        locale,
      ),
    );

  const rows = [
    [
      text.subtotal,
      money(totals.subtotal),
      false,
    ],
  ];

  if (
    Number(
      totals.discountAmount ||
        0,
    ) > 0
  ) {
    rows.push([
      text.discount,
      `- ${money(
        totals.discountAmount,
      )}`,
      false,
    ]);
  }

  rows.push([
    text.taxableAmount,
    money(
      totals.taxableAmount,
    ),
    false,
  ]);

  if (
    Number(
      totals.taxRate || 0,
    ) > 0 ||
    Number(
      totals.taxAmount || 0,
    ) > 0
  ) {
    rows.push([
      `${text.tax} (${escapeHtml(
        totals.taxRate || 0,
      )}%)`,
      money(totals.taxAmount),
      false,
    ]);
  }

  rows.push([
    text.total,
    money(totals.total),
    true,
  ]);

  if (
    Number(
      totals.depositAmount ||
        0,
    ) > 0
  ) {
    rows.push([
      `${text.deposit} (${escapeHtml(
        totals.depositPercent ||
          0,
      )}%)`,
      money(
        totals.depositAmount,
      ),
      false,
    ]);

    rows.push([
      text.remaining,
      money(
        totals.remainingAmount,
      ),
      false,
    ]);
  }

  let amountWords = '';

  if (
    language === 'vi' &&
    currency === 'VND'
  ) {
    amountWords =
      amountToVietnameseWords(
        totals.total,
        {
          currency,
        },
      );
  }

  return `
    <section class="totals-wrapper">
      <table class="totals-table">
        <tbody>
          ${rows
            .map(
              ([label, value, strong]) => `
                <tr class="${strong ? 'grand-total' : ''}">
                  <th>${escapeHtml(label)}</th>
                  <td>${value}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
      ${
        amountWords
          ? `
            <p class="amount-words">
              <strong>${escapeHtml(text.amountInWords)}:</strong>
              ${escapeHtml(amountWords)}.
            </p>
          `
          : ''
      }
    </section>
  `;
};

const renderPaymentSchedule = (
  paymentSchedule,
  language,
) => {
  if (
    !paymentSchedule ||
    !Array.isArray(
      paymentSchedule.stages,
    ) ||
    paymentSchedule.stages
      .length === 0
  ) {
    return '';
  }

  const text = getText(language);
  const currency =
    cleanEnum(
      paymentSchedule.currency ||
        'VND',
      DOCUMENT_CURRENCIES,
      {
        field:
          'paymentSchedule.currency',
      },
    );

  return `
    <section class="document-section">
      <h2>${escapeHtml(text.paymentSchedule)}</h2>
      <table class="payment-table">
        <thead>
          <tr>
            <th>${escapeHtml(text.stage)}</th>
            <th>${escapeHtml(text.condition)}</th>
            <th>${escapeHtml(text.percent)}</th>
            <th>${escapeHtml(text.amount)}</th>
            <th>${escapeHtml(text.dueDate)}</th>
          </tr>
        </thead>
        <tbody>
          ${paymentSchedule.stages
            .map(
              (stage) => `
                <tr>
                  <td>${escapeHtml(stage.title)}</td>
                  <td>${nl2br(stage.condition)}</td>
                  <td class="text-center">${escapeHtml(stage.percent)}%</td>
                  <td class="text-right">${escapeHtml(
                    formatCurrency(
                      stage.amount,
                      currency,
                      language === 'vi'
                        ? 'vi-VN'
                        : 'en-US',
                    ),
                  )}</td>
                  <td>${escapeHtml(stage.dueDate)}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    </section>
  `;
};

const renderTextSection = (
  title,
  content,
) => {
  if (!content) {
    return '';
  }

  return `
    <section class="document-section text-section">
      <h2>${escapeHtml(title)}</h2>
      <div class="rich-text">${nl2br(content)}</div>
    </section>
  `;
};

const renderSignatures = (
  options,
  text,
  brand,
) => {
  const providerName =
    options.providerSignatureName ||
    options.organization
      ?.representativeName ||
    '';

  const customerName =
    options.customerSignatureName ||
    options.customer
      ?.representativeName ||
    options.customer
      ?.fullName ||
    options.customer
      ?.displayName ||
    '';

  return `
    <section class="signature-grid">
      <div class="signature-box">
        <h3>${escapeHtml(text.providerSignature)}</h3>
        <p class="signature-note">${escapeHtml(
          options.signatureNote ||
            '',
        )}</p>
        ${
          brand.signatureUrl
            ? `
              <img
                class="signature-image"
                src="${escapeHtml(brand.signatureUrl)}"
                alt="Signature"
              >
            `
            : '<div class="signature-space"></div>'
        }
        <strong>${escapeHtml(providerName)}</strong>
      </div>

      <div class="signature-box">
        <h3>${escapeHtml(text.customerSignature)}</h3>
        <p class="signature-note">${escapeHtml(
          options.customerSignatureNote ||
            '',
        )}</p>
        <div class="signature-space"></div>
        <strong>${escapeHtml(customerName)}</strong>
      </div>
    </section>
  `;
};

const renderHeader = (
  options,
  brand,
  text,
) => {
  const title =
    options.title ||
    text[
      options.documentType
    ];

  return `
    <header class="document-header">
      <div class="brand-block">
        ${
          brand.logoUrl
            ? `
              <img
                class="brand-logo"
                src="${escapeHtml(brand.logoUrl)}"
                alt="${escapeHtml(brand.name)}"
              >
            `
            : `
              <div class="brand-wordmark">
                ${escapeHtml(brand.name)}
              </div>
            `
        }

        ${
          brand.tagline
            ? `<p>${escapeHtml(brand.tagline)}</p>`
            : ''
        }
      </div>

      <div class="document-title-block">
        <h1>${escapeHtml(title)}</h1>
        <p>
          <strong>${escapeHtml(text.documentNumber)}:</strong>
          ${escapeHtml(options.documentNumber)}
        </p>
        <p>
          <strong>${escapeHtml(text.issueDate)}:</strong>
          ${escapeHtml(
            formatDocumentDate(
              options.issueDate ||
                options.issuedAt,
              options.language,
            ),
          )}
        </p>
        ${
          options.expiryDate
            ? `
              <p>
                <strong>${escapeHtml(text.expiryDate)}:</strong>
                ${escapeHtml(
                  formatDocumentDate(
                    options.expiryDate,
                    options.language,
                  ),
                )}
              </p>
            `
            : ''
        }
      </div>
    </header>
  `;
};

const renderFooter = (
  brand,
) => {
  const contactParts = [
    brand.website,
    brand.email,
    brand.phone,
    brand.address,
  ].filter(Boolean);

  return `
    <footer class="document-footer">
      <strong>${escapeHtml(brand.name)}</strong>
      ${
        contactParts.length
          ? `<span>${escapeHtml(contactParts.join(' · '))}</span>`
          : ''
      }
    </footer>
  `;
};

const buildCss = (
  brand,
) => `
  :root {
    --brand-primary: ${brand.primaryColor};
    --brand-secondary: ${brand.secondaryColor};
    --brand-accent: ${brand.accentColor};
    --text: #1f2937;
    --muted: #6b7280;
    --line: #d1d5db;
    --soft: #f8fafc;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    color: var(--text);
    background: #ffffff;
    font-family: ${DEFAULT_FONT_FAMILY};
    font-size: 12px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    width: 100%;
  }

  .document {
    width: 100%;
    max-width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 15mm 14mm 16mm;
    background: #ffffff;
  }

  .document-header {
    display: grid;
    grid-template-columns: 1fr 1.25fr;
    gap: 24px;
    align-items: start;
    padding-bottom: 18px;
    border-bottom: 3px solid var(--brand-primary);
  }

  .brand-logo {
    display: block;
    width: auto;
    max-width: 180px;
    max-height: 70px;
    object-fit: contain;
  }

  .brand-wordmark {
    display: inline-block;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(
      90deg,
      var(--brand-primary),
      var(--brand-secondary),
      var(--brand-accent)
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .brand-block p {
    margin: 6px 0 0;
    color: var(--muted);
  }

  .document-title-block {
    text-align: right;
  }

  .document-title-block h1 {
    margin: 0 0 10px;
    font-size: 24px;
    line-height: 1.2;
    color: var(--brand-primary);
  }

  .document-title-block p {
    margin: 2px 0;
  }

  .party-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 18px;
  }

  .party-card {
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
    break-inside: avoid;
  }

  .party-card h3 {
    margin: 0;
    padding: 9px 11px;
    color: #ffffff;
    background: var(--brand-primary);
    font-size: 12px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    vertical-align: top;
  }

  .party-table th,
  .party-table td {
    padding: 5px 8px;
    border-bottom: 1px solid #e5e7eb;
  }

  .party-table tr:last-child th,
  .party-table tr:last-child td {
    border-bottom: 0;
  }

  .party-table th {
    width: 38%;
    text-align: left;
    font-weight: 600;
    color: var(--muted);
    background: var(--soft);
  }

  .document-section {
    margin-top: 20px;
    break-inside: avoid;
  }

  .document-section h2 {
    margin: 0 0 8px;
    padding-left: 9px;
    border-left: 4px solid var(--brand-secondary);
    font-size: 14px;
    color: var(--brand-primary);
  }

  .items-table,
  .payment-table {
    table-layout: fixed;
    border: 1px solid var(--line);
  }

  .items-table th,
  .items-table td,
  .payment-table th,
  .payment-table td {
    padding: 7px 6px;
    border: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  .items-table thead th,
  .payment-table thead th {
    color: #ffffff;
    background: var(--brand-primary);
    text-align: center;
    font-size: 10px;
  }

  .items-table tbody tr:nth-child(even),
  .payment-table tbody tr:nth-child(even) {
    background: var(--soft);
  }

  .col-index {
    width: 36px;
  }

  .col-number {
    width: 48px;
  }

  .col-unit {
    width: 58px;
  }

  .col-money {
    width: 88px;
  }

  .col-note {
    width: 76px;
  }

  .item-name,
  .strong {
    font-weight: 700;
  }

  .text-center {
    text-align: center;
  }

  .text-right {
    text-align: right;
  }

  .totals-wrapper {
    margin-top: 14px;
    margin-left: auto;
    width: 48%;
    min-width: 300px;
    break-inside: avoid;
  }

  .totals-table th,
  .totals-table td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
  }

  .totals-table th {
    text-align: left;
    font-weight: 600;
  }

  .totals-table td {
    text-align: right;
    font-weight: 700;
  }

  .totals-table .grand-total th,
  .totals-table .grand-total td {
    color: #ffffff;
    background: var(--brand-primary);
    font-size: 14px;
  }

  .amount-words {
    margin: 8px 0 0;
    font-style: italic;
  }

  .text-section {
    break-inside: auto;
  }

  .rich-text {
    white-space: normal;
    text-align: justify;
  }

  .signature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 50px;
    margin-top: 30px;
    break-inside: avoid;
  }

  .signature-box {
    text-align: center;
  }

  .signature-box h3 {
    margin: 0;
    font-size: 12px;
  }

  .signature-note {
    min-height: 18px;
    margin: 4px 0;
    color: var(--muted);
    font-size: 10px;
  }

  .signature-space {
    height: 75px;
  }

  .signature-image {
    display: block;
    width: auto;
    max-width: 180px;
    height: 75px;
    margin: 0 auto;
    object-fit: contain;
  }

  .document-footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 30px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-size: 10px;
  }

  @page {
    size: A4;
    margin: 0;
  }

  @media print {
    .document {
      max-width: none;
      min-height: auto;
      margin: 0;
    }

    thead {
      display: table-header-group;
    }

    tr,
    img,
    .party-card,
    .totals-wrapper,
    .signature-grid {
      break-inside: avoid;
    }
  }
`;

const normalizePdfOptions = (
  options,
) => {
  if (
    !options ||
    typeof options !== 'object' ||
    Array.isArray(options)
  ) {
    throw new ApiError(
      400,
      'INVALID_PDF_OPTIONS',
      'PDF options are invalid.',
    );
  }

  const documentType =
    cleanEnum(
      options.documentType,
      SUPPORTED_DOCUMENT_TYPES,
      {
        field:
          'documentType',
      },
    );

  const language =
    cleanEnum(
      options.language || 'vi',
      DOCUMENT_LANGUAGES,
      {
        field: 'language',
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

  return {
    ...options,
    documentType,
    language,
    documentNumber,
    customer:
      options.customer || {},
    organization:
      options.organization || {},
    brand:
      buildBrand(
        options.brand,
      ),
  };
};

export const renderDocumentHtml = (
  rawOptions,
) => {
  const options =
    normalizePdfOptions(
      rawOptions,
    );

  const {
    documentType,
    language,
    brand,
  } = options;

  const text =
    getText(language);

  const totals =
    options.totals || null;

  const bodyParts = [
    renderHeader(
      options,
      brand,
      text,
    ),

    `
      <div class="party-grid">
        ${renderPartyTable(
          text.seller,
          options.organization,
          language,
        )}
        ${renderPartyTable(
          text.customer,
          options.customer,
          language,
        )}
      </div>
    `,
  ];

  if (
    Array.isArray(
      options.items,
    ) &&
    options.items.length > 0
  ) {
    const currency =
      cleanEnum(
        options.currency ||
          totals?.currency ||
          'VND',
        DOCUMENT_CURRENCIES,
        {
          field: 'currency',
        },
      );

    bodyParts.push(
      renderItemsTable(
        options.items,
        currency,
        language,
      ),
    );
  }

  if (totals) {
    bodyParts.push(
      renderTotalsTable(
        totals,
        language,
      ),
    );
  }

  bodyParts.push(
    renderPaymentSchedule(
      options.paymentSchedule,
      language,
    ),
  );

  if (
    documentType === 'contract' ||
    documentType === 'appendix'
  ) {
    bodyParts.push(
      renderTextSection(
        text.scope,
        options.scope,
      ),

      renderTextSection(
        text.paymentTerms,
        options.paymentTerms,
      ),

      renderTextSection(
        text.warrantyTerms,
        options.warrantyTerms,
      ),

      renderTextSection(
        text.terminationTerms,
        options.terminationTerms,
      ),

      renderTextSection(
        text.disputeTerms,
        options.disputeTerms,
      ),
    );
  }

  bodyParts.push(
    renderTextSection(
      text.notes,
      options.notes,
    ),
  );

  if (
    options.showSignatures !== false
  ) {
    bodyParts.push(
      renderSignatures(
        options,
        text,
        brand,
      ),
    );
  }

  bodyParts.push(
    renderFooter(brand),
  );

  const pageTitle = [
    text[documentType],
    options.documentNumber,
  ]
    .filter(Boolean)
    .join(' - ');

  return `<!doctype html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >
  <title>${escapeHtml(pageTitle)}</title>
  <style>${buildCss(brand)}</style>
</head>
<body>
  <main class="document">
    ${bodyParts.join('\n')}
  </main>
</body>
</html>`;
};

export const renderQuotationHtml = (
  options,
) =>
  renderDocumentHtml({
    ...options,
    documentType: 'quotation',
  });

export const renderContractHtml = (
  options,
) =>
  renderDocumentHtml({
    ...options,
    documentType: 'contract',
  });

export const buildPdfFileName = (
  options,
) =>
  createSafeFileName({
    documentType:
      options.documentType,
    documentNumber:
      options.documentNumber,
    customerName:
      options.customerName ||
      options.customer
        ?.displayName ||
      options.customer
        ?.companyName ||
      options.customer
        ?.fullName ||
      '',
    extension: 'pdf',
  });

export const buildPdfResponseHeaders = (
  options,
) => {
  const fileName =
    buildPdfFileName(options);

  const encodedFileName =
    encodeURIComponent(fileName)
      .replace(
        /['()]/g,
        escape,
      )
      .replace(/\*/g, '%2A');

  return {
    'Content-Type':
      'application/pdf',

    'Content-Disposition':
      `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`,

    'Cache-Control':
      'private, no-store, no-cache, must-revalidate',

    Pragma: 'no-cache',

    Expires: '0',

    'X-Content-Type-Options':
      'nosniff',
  };
};

export const buildHtmlPreviewHeaders =
  () => ({
    'Content-Type':
      'text/html; charset=utf-8',

    'Cache-Control':
      'private, no-store, no-cache, must-revalidate',

    Pragma: 'no-cache',

    Expires: '0',

    'X-Content-Type-Options':
      'nosniff',

    'Content-Security-Policy': [
      "default-src 'none'",
      "img-src https: http: data:",
      "style-src 'unsafe-inline'",
      "font-src data:",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'self'",
    ].join('; '),
  });
