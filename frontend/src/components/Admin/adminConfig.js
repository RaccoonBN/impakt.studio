export const LEAD_STATUSES = [
  'Chưa liên hệ',
  'Đã liên hệ',
];

export const CUSTOMER_TYPES = [
  'Cá nhân',
  'Doanh nghiệp',
];

export const CUSTOMER_STATUSES = [
  'Tiềm năng',
  'Đang hợp tác',
  'Tạm dừng',
  'Đã hoàn tất',
  'Ngừng hợp tác',
];

export const CUSTOMER_SOURCES = [
  'Website',
  'Facebook',
  'Giới thiệu',
  'Khách cũ',
  'Đối tác',
  'Nhập thủ công',
  'Nguồn khác',
];

export const PROJECT_STATUSES = [
  'Chưa bắt đầu',
  'Đang thực hiện',
  'Tạm dừng',
  'Chờ phản hồi',
  'Đã hoàn thành',
  'Đã hủy',
];

export const PROJECT_PHASES = [
  'Tiếp nhận yêu cầu',
  'Phân tích',
  'Thiết kế',
  'Lập trình',
  'Kiểm thử',
  'Bàn giao',
  'Bảo hành',
  'Bảo trì',
];

export const QUOTATION_STATUSES = [
  'Bản nháp',
  'Đã gửi',
  'Đang trao đổi',
  'Đã chấp nhận',
  'Đã từ chối',
  'Hết hiệu lực',
  'Đã hủy',
];

export const CONTRACT_STATUSES = [
  'Bản nháp',
  'Chờ ký',
  'Đã ký',
  'Đang thực hiện',
  'Tạm dừng',
  'Đã hoàn thành',
  'Đã thanh lý',
  'Đã hủy',
];

export const PAYMENT_STATUSES = [
  'Chưa thanh toán',
  'Thanh toán một phần',
  'Đã thanh toán',
  'Quá hạn',
  'Đã hoàn tiền',
];

export const TODAY =
  new Date()
    .toISOString()
    .slice(0, 10);

export const createCustomerForm = (
  overrides = {},
) => ({
  customerType: 'Cá nhân',
  fullName: '',
  companyName: '',
  representativeName: '',
  representativeTitle: '',
  taxCode: '',
  identityNumber: '',
  identityIssueDate: '',
  identityIssuePlace: '',
  phone: '',
  email: '',
  address: '',
  source: 'Nhập thủ công',
  leadId: '',
  status: 'Tiềm năng',
  notes: '',
  bankName: '',
  bankAccountNumber: '',
  bankAccountName: '',
  ...overrides,
});

export const createProjectForm = (
  overrides = {},
) => ({
  customerId: '',
  projectName: '',
  projectType: '',
  startDate: TODAY,
  expectedEndDate: '',
  progress: 0,
  phase:
    'Tiếp nhận yêu cầu',
  status:
    'Chưa bắt đầu',
  manager: '',
  websiteUrl: '',
  adminUrl: '',
  notes: '',
  ...overrides,
});

export const createQuotationItem = (
  overrides = {},
) => ({
  name: '',
  description: '',
  quantity: 1,
  unit: 'Gói',
  unitPrice: 0,
  costType: 'Một lần',
  note: '',
  ...overrides,
});

export const createQuotationForm = (
  overrides = {},
) => ({
  customerMode: 'existing',
  customerId: '',
  customer:
    createCustomerForm(),
  projectId: '',
  issueDate: TODAY,
  expiryDate: '',
  language: 'vi',
  currency: 'VND',
  items: [
    createQuotationItem(),
  ],
  discount: 0,
  taxRate: 0,
  depositPercent: 50,
  status: 'Bản nháp',
  notes: '',
  ...overrides,
});

export const createPaymentStage = (
  overrides = {},
) => ({
  title: '',
  percent: 50,
  condition: '',
  dueDate: '',
  status:
    'Chưa thanh toán',
  ...overrides,
});

export const createContractForm = (
  overrides = {},
) => ({
  customerMode: 'existing',
  customerId: '',
  customer:
    createCustomerForm(),
  projectId: '',
  quotationId: '',
  sourceMode: 'standalone',
  title: '',
  signedDate: '',
  effectiveDate: '',
  value: 0,
  depositAmount: 0,
  durationText: '',
  scope: '',
  paymentTerms: '',
  warrantyTerms: '',
  terminationTerms: '',
  disputeTerms: '',
  language: 'vi',
  currency: 'VND',
  status: 'Bản nháp',
  notes: '',
  paymentStages: [],
  ...overrides,
});

export const getCustomerName = (
  customer,
) =>
  customer?.displayName ||
  customer?.companyName ||
  customer?.fullName ||
  customer?.customerName ||
  'Chưa có tên';

export const formatValue = (
  value,
  fallback = 'Chưa có',
) => {
  const text =
    String(
      value ?? '',
    ).trim();

  return text || fallback;
};

export const formatDate = (
  value,
) => {
  if (!value) {
    return 'Chưa có';
  }

  const raw =
    String(value);

  if (
    /^\d{2}\/\d{2}\/\d{4}/.test(
      raw,
    )
  ) {
    return raw;
  }

  const date =
    new Date(raw);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return raw;
  }

  return new Intl
    .DateTimeFormat(
      'vi-VN',
      {
        dateStyle: 'short',
        timeStyle:
          raw.includes('T')
            ? 'short'
            : undefined,
      },
    )
    .format(date);
};

export const formatMoney = (
  value,
  currency = 'VND',
) =>
  new Intl
    .NumberFormat(
      currency === 'USD'
        ? 'en-US'
        : 'vi-VN',
      {
        style: 'currency',
        currency,
        maximumFractionDigits:
          currency === 'VND'
            ? 0
            : 2,
      },
    )
    .format(
      Number(value) || 0,
    );

export const getErrorMessage = (
  code,
) => {
  const map = {
    INVALID_CREDENTIALS:
      'Tên đăng nhập hoặc mật khẩu chưa đúng.',
    UNAUTHORIZED:
      'Phiên đăng nhập đã hết hạn.',
    ORIGIN_NOT_ALLOWED:
      'Tên miền hiện tại chưa được cấp quyền.',
    APPS_SCRIPT_TIMEOUT:
      'Google Sheet phản hồi quá lâu.',
    APPS_SCRIPT_UNAVAILABLE:
      'Không thể kết nối Google Apps Script.',
    CUSTOMER_NOT_FOUND:
      'Không tìm thấy khách hàng.',
    PROJECT_NOT_FOUND:
      'Không tìm thấy dự án.',
    QUOTATION_NOT_FOUND:
      'Không tìm thấy báo giá.',
    CONTRACT_NOT_FOUND:
      'Không tìm thấy hợp đồng.',
    LEAD_NOT_FOUND:
      'Không tìm thấy Lead.',
    INVALID_EMAIL:
      'Địa chỉ email chưa hợp lệ.',
    INVALID_PHONE:
      'Số điện thoại chưa hợp lệ.',
    INVALID_PAYMENT_PERCENT_TOTAL:
      'Tổng tỷ lệ thanh toán phải bằng 100%.',
    QUOTATION_ITEMS_REQUIRED:
      'Báo giá phải có ít nhất một hạng mục.',
    QUOTATION_CUSTOMER_REQUIRED:
      'Vui lòng chọn hoặc nhập khách hàng.',
    CONTRACT_CUSTOMER_REQUIRED:
      'Vui lòng chọn hoặc nhập khách hàng.',
  };

  return (
    map[code] ||
    code ||
    'Đã xảy ra lỗi.'
  );
};

export const statusClass = (
  status,
) => {
  if (
    [
      'Đã liên hệ',
      'Đang hợp tác',
      'Đang thực hiện',
      'Đã hoàn thành',
      'Đã chấp nhận',
      'Đã ký',
      'Đã thanh lý',
      'Đã thanh toán',
    ].includes(status)
  ) {
    return 'is-positive';
  }

  if (
    [
      'Đã hủy',
      'Đã từ chối',
      'Ngừng hợp tác',
      'Hết hiệu lực',
      'Quá hạn',
    ].includes(status)
  ) {
    return 'is-negative';
  }

  return 'is-warning';
};
