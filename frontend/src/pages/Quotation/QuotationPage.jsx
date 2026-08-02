import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Copy,
  FileDown,
  FileText,
  GripVertical,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Languages,
  Percent,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import logoLight from '../../assets/logo_light.svg';
import signatureBaoNgoc from '../../assets/signature-bao-ngoc.png';
import './QuotationPage.css';

const STORAGE_KEY = 'impakt-quotation-draft-v1';
const DEFAULT_SIGNATURE_IMAGE = signatureBaoNgoc;

const TRANSLATIONS = {
  'Đang kiểm tra phiên đăng nhập...': 'Checking login session...',
  'Công cụ nội bộ': 'Internal tool',
  'Trình tạo báo giá IMPAKT': 'IMPAKT Quotation Builder',
  'Nhập mật khẩu quản trị để tạo, chỉnh sửa và xuất báo giá dành cho khách hàng.':
    'Enter the administrator password to create, edit and export client quotations.',
  'Mật khẩu truy cập': 'Access password',
  'Nhập mật khẩu...': 'Enter password...',
  'Mật khẩu không đúng hoặc hệ thống chưa được cấu hình.':
    'Incorrect password or the system has not been configured.',
  'Đang đăng nhập...': 'Signing in...',
  'Mở trình báo giá': 'Open quotation builder',
  'Chỉ dành cho quản trị viên': 'Administrator only',
  'Tự động lưu trên thiết bị': 'Automatically saved on this device',
  'Tạo mới': 'New quotation',
  'Lưu nháp': 'Save draft',
  'Xuất PDF': 'Export PDF',
  'Đăng xuất': 'Log out',
  'Thông tin báo giá': 'Quotation information',
  'Mã báo giá, ngày phát hành và thời hạn hiệu lực.':
    'Quotation number, issue date and validity period.',
  'Mã báo giá': 'Quotation number',
  'Đơn vị tiền tệ': 'Currency',
  'Ngày phát hành': 'Issue date',
  'Có hiệu lực đến': 'Valid until',
  'Thông tin khách hàng': 'Client information',
  'Thông tin sẽ xuất hiện ở phần người nhận báo giá.':
    'Information shown in the quotation recipient section.',
  'Tên người liên hệ': 'Contact person',
  'Doanh nghiệp': 'Company / Brand',
  'Số điện thoại': 'Phone number',
  'Địa chỉ': 'Address',
  'Tên công ty / thương hiệu': 'Company / brand name',
  'Địa chỉ khách hàng': 'Client address',
  'Thông tin dự án': 'Project information',
  'Mô tả ngắn gọn về mục tiêu và thời gian thực hiện.':
    'A brief description of the project objectives and timeline.',
  'Tên dự án': 'Project name',
  'Mô tả dự án': 'Project description',
  'Thời gian triển khai': 'Estimated timeline',
  'Hạng mục và chi phí': 'Items and pricing',
  'Thêm từng dịch vụ, số lượng và đơn giá.':
    'Add each service, quantity and unit price.',
  'Tên dịch vụ': 'Service name',
  'Mô tả': 'Description',
  'Số lượng': 'Quantity',
  'Đơn vị': 'Unit',
  'Đơn giá': 'Unit price',
  'Thành tiền:': 'Amount:',
  'Thêm hạng mục': 'Add item',
  'Hình thức giảm giá': 'Discount type',
  'Theo số tiền': 'Fixed amount',
  'Theo phần trăm': 'Percentage',
  'Giảm giá (%)': 'Discount (%)',
  'Giảm giá': 'Discount',
  'Đặt cọc (%)': 'Deposit (%)',
  'Quyền lợi của khách hàng': 'Client benefits',
  'Những giá trị, quyền lợi và kết quả khách hàng sẽ nhận được.':
    'The values, benefits and deliverables the client will receive.',
  'Thêm quyền lợi': 'Add benefit',
  'Điều khoản thanh toán': 'Payment terms',
  'Các mốc và nguyên tắc thanh toán của dự án.':
    'Project payment milestones and conditions.',
  'Thêm điều khoản thanh toán': 'Add payment term',
  'Điều kiện báo giá': 'Quotation conditions',
  'Phạm vi hiệu lực, chi phí phát sinh và nguyên tắc phối hợp.':
    'Validity, additional costs and collaboration principles.',
  'Thêm điều kiện': 'Add condition',
  'Thông tin thanh toán': 'Payment information',
  'Có thể để trống nếu chưa muốn hiển thị trên báo giá.':
    'Leave blank if you do not want to show this information.',
  'Ngân hàng': 'Bank',
  'Chủ tài khoản': 'Account name',
  'Số tài khoản': 'Account number',
  'Nội dung chuyển khoản': 'Transfer description',
  'Tên ngân hàng': 'Bank name',
  'Tên chủ tài khoản': 'Account holder name',
  'Ví dụ: QUOTE + TÊN KHÁCH HÀNG': 'Example: QUOTE + CLIENT NAME',
  'Ghi chú và đại diện': 'Notes and representative',
  'Thông điệp kết và thông tin người phát hành báo giá.':
    'Closing note and quotation issuer information.',
  'Ghi chú cuối báo giá': 'Closing note',
  'Người đại diện': 'Representative',
  'Chức danh': 'Title',
  'Ảnh chữ ký': 'Signature image',
  'Tải ảnh chữ ký PNG/JPG': 'Upload PNG/JPG signature',
  'Bản xem trước A4': 'A4 preview',
  'Nhấn “Xuất PDF” và chọn Save as PDF':
    'Click “Export PDF” and choose Save as PDF',
  'QUOTATION': 'QUOTATION',
  'BÁO GIÁ DỊCH VỤ': 'SERVICE QUOTATION',
  'Hiệu lực đến': 'Valid until',
  'ĐƠN VỊ BÁO GIÁ': 'ISSUED BY',
  'KHÁCH HÀNG': 'CLIENT',
  'Người liên hệ:': 'Contact person:',
  'DỰ ÁN ĐỀ XUẤT': 'PROPOSED PROJECT',
  'Thời gian dự kiến:': 'Estimated timeline:',
  'PHẠM VI CÔNG VIỆC': 'SCOPE OF WORK',
  'HẠNG MỤC': 'ITEM',
  'SL': 'QTY',
  'ĐƠN GIÁ': 'UNIT PRICE',
  'THÀNH TIỀN': 'AMOUNT',
  'Khoản thanh toán đầu tiên': 'Initial payment',
  'Tương đương': 'Equivalent to',
  'tổng giá trị báo giá': 'of the quotation total',
  'Tạm tính': 'Subtotal',
  'VAT': 'VAT',
  'TỔNG GIÁ TRỊ': 'TOTAL',
  'Còn lại sau đặt cọc': 'Remaining after deposit',
  'GIÁ TRỊ BÀN GIAO': 'DELIVERABLE VALUE',
  'THANH TOÁN': 'PAYMENT',
  'LƯU Ý': 'NOTES',
  'THÔNG TIN THANH TOÁN': 'PAYMENT INFORMATION',
  'Nội dung CK': 'Transfer note',
  'ĐẠI DIỆN IMPAKT STUDIO': 'IMPAKT STUDIO REPRESENTATIVE',
  'Hạng mục chưa đặt tên': 'Unnamed item',
  'Xóa bản nháp hiện tại và tạo báo giá mới?':
    'Delete the current draft and create a new quotation?',
  'Đã lưu lúc': 'Saved at',
  'Nhân bản hạng mục': 'Duplicate item',
  'Nhân bản': 'Duplicate',
  'Xóa hạng mục': 'Delete item',
  'Xóa': 'Delete',
  'Xóa nội dung': 'Delete content',

  // Default quotation content
  'TP. Hồ Chí Minh, Việt Nam': 'Ho Chi Minh City, Vietnam',
  'Thiết kế và phát triển website': 'Website design and development',
  'Giải pháp website được xây dựng theo nhu cầu, định hướng thương hiệu và mục tiêu vận hành thực tế của khách hàng.':
    'A tailored website solution based on the client’s brand direction, operational needs and business objectives.',
  '10–20 ngày làm việc kể từ khi nhận đủ nội dung và khoản thanh toán đầu tiên.':
    '10–20 business days after receiving all required content and the initial payment.',
  'Thiết kế & phát triển website': 'Website design & development',
  'Thiết kế giao diện riêng, responsive, lập trình chức năng và kiểm thử trước bàn giao.':
    'Custom responsive interface design, feature development and testing before handover.',
  'gói': 'package',
  'Thiết kế giao diện theo nhận diện và mục tiêu riêng của thương hiệu.':
    'Custom interface design aligned with the brand identity and objectives.',
  'Tương thích tốt trên máy tính, máy tính bảng và điện thoại.':
    'Optimized for desktop, tablet and mobile devices.',
  'Tối ưu cấu trúc SEO nền tảng và tốc độ tải trang.':
    'Foundational SEO structure and page-speed optimization.',
  'Bàn giao mã nguồn theo phạm vi đã thống nhất sau khi hoàn tất thanh toán.':
    'Source code handover within the agreed scope after full payment.',
  'Hướng dẫn vận hành cơ bản và hỗ trợ kỹ thuật trong thời gian bảo hành.':
    'Basic operation guidance and technical support during the warranty period.',
  'Thanh toán 50% để xác nhận triển khai dự án.':
    'A 50% payment is required to confirm project commencement.',
  'Thanh toán phần còn lại sau khi nghiệm thu và trước khi bàn giao chính thức.':
    'The remaining balance is due after acceptance and before final handover.',
  'Báo giá có hiệu lực đến ngày hết hạn được ghi trên phiếu.':
    'This quotation is valid until the expiry date stated above.',
  'Chi phí chưa bao gồm tên miền, hosting, email doanh nghiệp và dịch vụ bên thứ ba nếu không được ghi rõ.':
    'Fees exclude domain, hosting, business email and third-party services unless explicitly stated.',
  'Hạng mục phát sinh ngoài phạm vi sẽ được xác nhận và báo giá bổ sung trước khi thực hiện.':
    'Out-of-scope requests will be confirmed and quoted separately before implementation.',
  'Tiến độ có thể thay đổi khi khách hàng chậm cung cấp nội dung hoặc phản hồi.':
    'The timeline may change if content or feedback is provided late.',
  'Cảm ơn Quý khách đã quan tâm đến dịch vụ của IMPAKT Studio. Chúng tôi mong muốn đồng hành để tạo ra một website hiệu quả, dễ vận hành và phù hợp với định hướng phát triển lâu dài.':
    'Thank you for considering IMPAKT Studio. We look forward to creating an effective, easy-to-manage website aligned with your long-term growth.',
};

const REVERSE_TRANSLATIONS = Object.fromEntries(
  Object.entries(TRANSLATIONS).map(([vi, en]) => [en, vi]),
);

const tr = (language, text) =>
  language === 'en' ? TRANSLATIONS[text] || text : text;

const translateKnownValue = (value, language) => {
  if (typeof value !== 'string') {
    return value;
  }

  return language === 'en'
    ? TRANSLATIONS[value] || value
    : REVERSE_TRANSLATIONS[value] || value;
};


const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const toInputDate = (date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const createQuoteNumber = () => {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');

  return `IMPAKT-${stamp}-01`;
};

const createDefaultQuotation = () => {
  const today = new Date();

  return {
    language: 'vi',
    quoteNumber: createQuoteNumber(),
    issueDate: toInputDate(today),
    expiryDate: toInputDate(addDays(today, 15)),
    currency: 'VND',

    company: {
      name: 'IMPAKT Studio',
      slogan: 'Smart Design. Real Impact.',
      email: 'impaktstudio.official@gmail.com',
      phone: '+84 889 379 983',
      website: 'impakt-studio.vercel.app',
      address: 'TP. Hồ Chí Minh, Việt Nam',
    },

    client: {
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
    },

    project: {
      title: 'Thiết kế và phát triển website',
      summary:
        'Giải pháp website được xây dựng theo nhu cầu, định hướng thương hiệu và mục tiêu vận hành thực tế của khách hàng.',
      timeline: '10–20 ngày làm việc kể từ khi nhận đủ nội dung và khoản thanh toán đầu tiên.',
    },

    items: [
      {
        id: makeId(),
        name: 'Thiết kế & phát triển website',
        description:
          'Thiết kế giao diện riêng, responsive, lập trình chức năng và kiểm thử trước bàn giao.',
        quantity: 1,
        unit: 'gói',
        unitPrice: 4999000,
      },
    ],

    discountType: 'amount',
    discountValue: 0,
    vatRate: 0,
    depositPercent: 50,

    benefits: [
      {
        id: makeId(),
        text: 'Thiết kế giao diện theo nhận diện và mục tiêu riêng của thương hiệu.',
      },
      {
        id: makeId(),
        text: 'Tương thích tốt trên máy tính, máy tính bảng và điện thoại.',
      },
      {
        id: makeId(),
        text: 'Tối ưu cấu trúc SEO nền tảng và tốc độ tải trang.',
      },
      {
        id: makeId(),
        text: 'Bàn giao mã nguồn theo phạm vi đã thống nhất sau khi hoàn tất thanh toán.',
      },
      {
        id: makeId(),
        text: 'Hướng dẫn vận hành cơ bản và hỗ trợ kỹ thuật trong thời gian bảo hành.',
      },
    ],

    paymentTerms: [
      {
        id: makeId(),
        text: 'Thanh toán 50% để xác nhận triển khai dự án.',
      },
      {
        id: makeId(),
        text: 'Thanh toán phần còn lại sau khi nghiệm thu và trước khi bàn giao chính thức.',
      },
    ],

    terms: [
      {
        id: makeId(),
        text: 'Báo giá có hiệu lực đến ngày hết hạn được ghi trên phiếu.',
      },
      {
        id: makeId(),
        text: 'Chi phí chưa bao gồm tên miền, hosting, email doanh nghiệp và dịch vụ bên thứ ba nếu không được ghi rõ.',
      },
      {
        id: makeId(),
        text: 'Hạng mục phát sinh ngoài phạm vi sẽ được xác nhận và báo giá bổ sung trước khi thực hiện.',
      },
      {
        id: makeId(),
        text: 'Tiến độ có thể thay đổi khi khách hàng chậm cung cấp nội dung hoặc phản hồi.',
      },
    ],

    bank: {
      bankName: '',
      accountName: '',
      accountNumber: '',
      transferNote: '',
    },

    signature: {
      representative: 'TRẦN HUỲNH BẢO NGỌC',
      title: 'Founder — IMPAKT Studio',
      image: DEFAULT_SIGNATURE_IMAGE,
    },

    note:
      'Cảm ơn Quý khách đã quan tâm đến dịch vụ của IMPAKT Studio. Chúng tôi mong muốn đồng hành để tạo ra một website hiệu quả, dễ vận hành và phù hợp với định hướng phát triển lâu dài.',
  };
};

const formatCurrency = (value, currency = 'VND', language = 'vi') => {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(amount);
};

const formatDate = (value, language = 'vi') => {
  if (!value) {
    return '—';
  }

  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const normalizeNumber = (value) => {
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const QuotationPage = () => {
  const [authStatus, setAuthStatus] = useState('checking');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [quotation, setQuotation] = useState(() => {
    try {
      const defaults = createDefaultQuotation();
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return defaults;
      }

      const parsed = JSON.parse(stored);

      return {
        ...defaults,
        ...parsed,
        language: parsed.language || 'vi',
        company: { ...defaults.company, ...(parsed.company || {}) },
        client: { ...defaults.client, ...(parsed.client || {}) },
        project: { ...defaults.project, ...(parsed.project || {}) },
        bank: { ...defaults.bank, ...(parsed.bank || {}) },
        signature: {
          ...defaults.signature,
          ...(parsed.signature || {}),
          image:
            parsed.signature?.image &&
            parsed.signature.image !== '/images/signature-bao-ngoc.png'
              ? parsed.signature.image
              : DEFAULT_SIGNATURE_IMAGE,
        },
      };
    } catch {
      return createDefaultQuotation();
    }
  });

  const language = quotation.language || 'vi';
  const t = (text) => tr(language, text);

  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/quotation', {
          credentials: 'same-origin',
          cache: 'no-store',
        });

        const result = await response.json();

        if (active) {
          setAuthStatus(result.authenticated ? 'authenticated' : 'guest');
        }
      } catch {
        if (active) {
          setAuthStatus('guest');
        }
      }
    };

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quotation));
      setSavedAt(new Date());
    }, 500);

    return () => window.clearTimeout(timer);
  }, [authStatus, quotation]);

  const calculations = useMemo(() => {
    const subtotal = quotation.items.reduce(
      (sum, item) =>
        sum +
        normalizeNumber(item.quantity) *
          normalizeNumber(item.unitPrice),
      0,
    );

    const discount =
      quotation.discountType === 'percent'
        ? subtotal *
          (Math.min(Math.max(normalizeNumber(quotation.discountValue), 0), 100) /
            100)
        : Math.min(
            Math.max(normalizeNumber(quotation.discountValue), 0),
            subtotal,
          );

    const afterDiscount = Math.max(subtotal - discount, 0);
    const vat =
      afterDiscount *
      (Math.min(Math.max(normalizeNumber(quotation.vatRate), 0), 100) / 100);
    const total = afterDiscount + vat;
    const deposit =
      total *
      (Math.min(Math.max(normalizeNumber(quotation.depositPercent), 0), 100) /
        100);

    return {
      subtotal,
      discount,
      afterDiscount,
      vat,
      total,
      deposit,
      remaining: total - deposit,
    };
  }, [quotation]);

  const updateRoot = (field, value) => {
    setQuotation((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateNested = (section, field, value) => {
    setQuotation((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const updateItem = (id, field, value) => {
    setQuotation((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addItem = () => {
    setQuotation((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: makeId(),
          name: '',
          description: '',
          quantity: 1,
          unit: 'gói',
          unitPrice: 0,
        },
      ],
    }));
  };

  const removeItem = (id) => {
    setQuotation((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((item) => item.id !== id),
    }));
  };

  const duplicateItem = (id) => {
    setQuotation((current) => {
      const index = current.items.findIndex((item) => item.id === id);

      if (index < 0) {
        return current;
      }

      const clonedItem = {
        ...current.items[index],
        id: makeId(),
      };

      const items = [...current.items];
      items.splice(index + 1, 0, clonedItem);

      return {
        ...current,
        items,
      };
    });
  };

  const updateListItem = (listName, id, value) => {
    setQuotation((current) => ({
      ...current,
      [listName]: current[listName].map((item) =>
        item.id === id ? { ...item, text: value } : item,
      ),
    }));
  };

  const addListItem = (listName) => {
    setQuotation((current) => ({
      ...current,
      [listName]: [
        ...current[listName],
        {
          id: makeId(),
          text: '',
        },
      ],
    }));
  };

  const removeListItem = (listName, id) => {
    setQuotation((current) => ({
      ...current,
      [listName]:
        current[listName].length === 1
          ? current[listName]
          : current[listName].filter((item) => item.id !== id),
    }));
  };

  const handleLanguageChange = (nextLanguage) => {
    if (nextLanguage === language) {
      return;
    }

    setQuotation((current) => ({
      ...current,
      language: nextLanguage,
      company: {
        ...current.company,
        address: translateKnownValue(current.company.address, nextLanguage),
      },
      project: {
        ...current.project,
        title: translateKnownValue(current.project.title, nextLanguage),
        summary: translateKnownValue(current.project.summary, nextLanguage),
        timeline: translateKnownValue(current.project.timeline, nextLanguage),
      },
      items: current.items.map((item) => ({
        ...item,
        name: translateKnownValue(item.name, nextLanguage),
        description: translateKnownValue(item.description, nextLanguage),
        unit: translateKnownValue(item.unit, nextLanguage),
      })),
      benefits: current.benefits.map((item) => ({
        ...item,
        text: translateKnownValue(item.text, nextLanguage),
      })),
      paymentTerms: current.paymentTerms.map((item) => ({
        ...item,
        text: translateKnownValue(item.text, nextLanguage),
      })),
      terms: current.terms.map((item) => ({
        ...item,
        text: translateKnownValue(item.text, nextLanguage),
      })),
      note: translateKnownValue(current.note, nextLanguage),
    }));
  };

  const handleSignatureUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      updateNested('signature', 'image', String(reader.result || ''));
    };

    reader.readAsDataURL(file);
  };

  const saveNow = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotation));
    setSavedAt(new Date());
  };

  const resetQuotation = () => {
    const confirmed = window.confirm(
      t('Xóa bản nháp hiện tại và tạo báo giá mới?'),
    );

    if (!confirmed) {
      return;
    }

    const next = {
      ...createDefaultQuotation(),
      language,
    };
    setQuotation(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSavedAt(new Date());
  };

  const exportPdf = () => {
    saveNow();

    window.requestAnimationFrame(() => {
      window.print();
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/quotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'login', password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'LOGIN_FAILED');
      }

      setPassword('');
      setAuthStatus('authenticated');
    } catch {
      setLoginError('Mật khẩu không đúng hoặc hệ thống chưa được cấu hình.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/quotation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'logout' }),
    }).catch(() => null);

    setAuthStatus('guest');
  };

  if (authStatus === 'checking') {
    return (
      <main className="qb-auth-page">
        <LoaderCircle className="qb-spin" size={34} />
        <p>{t('Đang kiểm tra phiên đăng nhập...')}</p>
      </main>
    );
  }

  if (authStatus !== 'authenticated') {
    return (
      <main className="qb-auth-page">
        <section className="qb-login-card">
          <span className="qb-login-icon">
            <LockKeyhole size={27} />
          </span>

          <span className="qb-kicker">
            <Sparkles size={14} />
            {t('Công cụ nội bộ')}
          </span>

          <h1>{t('Trình tạo báo giá IMPAKT')}</h1>
          <p>
            {t(
              'Nhập mật khẩu quản trị để tạo, chỉnh sửa và xuất báo giá dành cho khách hàng.',
            )}
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="quotation-password">{t('Mật khẩu truy cập')}</label>
            <input
              id="quotation-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder={t('Nhập mật khẩu...')}
              required
            />

            {loginError && <div className="qb-login-error">{t(loginError)}</div>}

            <button type="submit" disabled={loginLoading}>
              {loginLoading ? (
                <LoaderCircle className="qb-spin" size={18} />
              ) : (
                <LockKeyhole size={18} />
              )}
              {loginLoading ? t('Đang đăng nhập...') : t('Mở trình báo giá')}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="qb-page">
      <header className="qb-toolbar">
        <div className="qb-toolbar-brand">
          <img src={logoLight} alt="IMPAKT Studio" />
          <div>
            <span>Private workspace</span>
            <strong>Quotation Builder</strong>
          </div>
        </div>

        <div className="qb-toolbar-status">
          <span>
            <ShieldCheck size={15} />
            {t('Chỉ dành cho quản trị viên')}
          </span>

          <small>
            {savedAt
              ? `${t('Đã lưu lúc')} ${savedAt.toLocaleTimeString(
                  language === 'en' ? 'en-US' : 'vi-VN',
                  {
                  hour: '2-digit',
                  minute: '2-digit',
                },
                )}`
              : t('Tự động lưu trên thiết bị')}
          </small>
        </div>

        <div className="qb-toolbar-actions">
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: 4,
              border: '1px solid rgba(124, 58, 237, 0.18)',
              borderRadius: 10,
            }}
            aria-label="Quotation language"
          >
            <button
              type="button"
              className="qb-btn-light"
              onClick={() => handleLanguageChange('vi')}
              style={{
                padding: '8px 10px',
                opacity: language === 'vi' ? 1 : 0.55,
                fontWeight: language === 'vi' ? 700 : 500,
              }}
            >
              <Languages size={16} />
              VN
            </button>

            <button
              type="button"
              className="qb-btn-light"
              onClick={() => handleLanguageChange('en')}
              style={{
                padding: '8px 10px',
                opacity: language === 'en' ? 1 : 0.55,
                fontWeight: language === 'en' ? 700 : 500,
              }}
            >
              ENG
            </button>
          </div>
          <button type="button" className="qb-btn-light" onClick={resetQuotation}>
            <RotateCcw size={17} />
            {t('Tạo mới')}
          </button>

          <button type="button" className="qb-btn-light" onClick={saveNow}>
            <Save size={17} />
            {t('Lưu nháp')}
          </button>

          <button type="button" className="qb-btn-primary" onClick={exportPdf}>
            <FileDown size={18} />
            {t('Xuất PDF')}
          </button>

          <button
            type="button"
            className="qb-btn-icon"
            onClick={handleLogout}
            aria-label={t('Đăng xuất')}
            title={t('Đăng xuất')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="qb-workspace">
        <aside className="qb-editor">
          <EditorSection
            icon={FileText}
            title={t('Thông tin báo giá')}
            description={t('Mã báo giá, ngày phát hành và thời hạn hiệu lực.')}
          >
            <div className="qb-form-grid qb-form-grid-2">
              <Field label={t('Mã báo giá')}>
                <input
                  value={quotation.quoteNumber}
                  onChange={(event) =>
                    updateRoot('quoteNumber', event.target.value)
                  }
                />
              </Field>

              <Field label={t('Đơn vị tiền tệ')}>
                <div className="qb-select-wrap">
                  <select
                    value={quotation.currency}
                    onChange={(event) =>
                      updateRoot('currency', event.target.value)
                    }
                  >
                    <option value="VND">VND — {language === 'en' ? 'Vietnamese Dong' : 'Việt Nam đồng'}</option>
                    <option value="USD">USD — US Dollar</option>
                  </select>
                  <ChevronDown size={16} />
                </div>
              </Field>

              <Field label={t('Ngày phát hành')}>
                <input
                  type="date"
                  value={quotation.issueDate}
                  onChange={(event) =>
                    updateRoot('issueDate', event.target.value)
                  }
                />
              </Field>

              <Field label={t('Có hiệu lực đến')}>
                <input
                  type="date"
                  value={quotation.expiryDate}
                  onChange={(event) =>
                    updateRoot('expiryDate', event.target.value)
                  }
                />
              </Field>
            </div>
          </EditorSection>

          <EditorSection
            icon={UserRound}
            title={t('Thông tin khách hàng')}
            description={t('Thông tin sẽ xuất hiện ở phần người nhận báo giá.')}
          >
            <div className="qb-form-grid qb-form-grid-2">
              <Field label={t('Tên người liên hệ')}>
                <input
                  value={quotation.client.name}
                  onChange={(event) =>
                    updateNested('client', 'name', event.target.value)
                  }
                  placeholder="Nguyễn Văn A"
                />
              </Field>

              <Field label={t('Doanh nghiệp')}>
                <input
                  value={quotation.client.company}
                  onChange={(event) =>
                    updateNested('client', 'company', event.target.value)
                  }
                  placeholder={t('Tên công ty / thương hiệu')}
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={quotation.client.email}
                  onChange={(event) =>
                    updateNested('client', 'email', event.target.value)
                  }
                  placeholder="client@email.com"
                />
              </Field>

              <Field label={t('Số điện thoại')}>
                <input
                  value={quotation.client.phone}
                  onChange={(event) =>
                    updateNested('client', 'phone', event.target.value)
                  }
                  placeholder="0900 000 000"
                />
              </Field>

              <Field label={t('Địa chỉ')} full>
                <input
                  value={quotation.client.address}
                  onChange={(event) =>
                    updateNested('client', 'address', event.target.value)
                  }
                  placeholder={t('Địa chỉ khách hàng')}
                />
              </Field>
            </div>
          </EditorSection>

          <EditorSection
            icon={Sparkles}
            title={t('Thông tin dự án')}
            description={t('Mô tả ngắn gọn về mục tiêu và thời gian thực hiện.')}
          >
            <div className="qb-form-grid">
              <Field label={t('Tên dự án')}>
                <input
                  value={quotation.project.title}
                  onChange={(event) =>
                    updateNested('project', 'title', event.target.value)
                  }
                />
              </Field>

              <Field label={t('Mô tả dự án')}>
                <textarea
                  rows="4"
                  value={quotation.project.summary}
                  onChange={(event) =>
                    updateNested('project', 'summary', event.target.value)
                  }
                />
              </Field>

              <Field label={t('Thời gian triển khai')}>
                <textarea
                  rows="2"
                  value={quotation.project.timeline}
                  onChange={(event) =>
                    updateNested('project', 'timeline', event.target.value)
                  }
                />
              </Field>
            </div>
          </EditorSection>

          <EditorSection
            icon={Banknote}
            title={t('Hạng mục và chi phí')}
            description={t('Thêm từng dịch vụ, số lượng và đơn giá.')}
          >
            <div className="qb-item-editor-list">
              {quotation.items.map((item, index) => (
                <div className="qb-item-editor" key={item.id}>
                  <div className="qb-item-editor-head">
                    <span>
                      <GripVertical size={16} />
                      {t('HẠNG MỤC')} {String(index + 1).padStart(2, '0')}
                    </span>

                    <div>
                      <button
                        type="button"
                        onClick={() => duplicateItem(item.id)}
                        aria-label={t('Nhân bản hạng mục')}
                        title={t('Nhân bản')}
                      >
                        <Copy size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={quotation.items.length === 1}
                        aria-label={t('Xóa hạng mục')}
                        title={t('Xóa')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="qb-form-grid">
                    <Field label={t('Tên dịch vụ')}>
                      <input
                        value={item.name}
                        onChange={(event) =>
                          updateItem(item.id, 'name', event.target.value)
                        }
                        placeholder="Ví dụ: Thiết kế website doanh nghiệp"
                      />
                    </Field>

                    <Field label={t('Mô tả')}>
                      <textarea
                        rows="3"
                        value={item.description}
                        onChange={(event) =>
                          updateItem(item.id, 'description', event.target.value)
                        }
                        placeholder="Phạm vi và kết quả bàn giao..."
                      />
                    </Field>

                    <div className="qb-form-grid qb-form-grid-3">
                      <Field label={t('Số lượng')}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(item.id, 'quantity', event.target.value)
                          }
                        />
                      </Field>

                      <Field label={t('Đơn vị')}>
                        <input
                          value={item.unit}
                          onChange={(event) =>
                            updateItem(item.id, 'unit', event.target.value)
                          }
                          placeholder={t('gói')}
                        />
                      </Field>

                      <Field label={t('Đơn giá')}>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItem(item.id, 'unitPrice', event.target.value)
                          }
                        />
                      </Field>
                    </div>

                    <div className="qb-item-editor-total">
                      {t('Thành tiền:')}
                      <strong>
                        {formatCurrency(
                          normalizeNumber(item.quantity) *
                            normalizeNumber(item.unitPrice), quotation.currency, language)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="qb-add-button" onClick={addItem}>
              <Plus size={17} />
              {t('Thêm hạng mục')}
            </button>

            <div className="qb-price-controls">
              <Field label={t('Hình thức giảm giá')}>
                <div className="qb-select-wrap">
                  <select
                    value={quotation.discountType}
                    onChange={(event) =>
                      updateRoot('discountType', event.target.value)
                    }
                  >
                    <option value="amount">{t('Theo số tiền')}</option>
                    <option value="percent">{t('Theo phần trăm')}</option>
                  </select>
                  <ChevronDown size={16} />
                </div>
              </Field>

              <Field
                label={
                  quotation.discountType === 'percent'
                    ? t('Giảm giá (%)')
                    : t('Giảm giá')
                }
              >
                <input
                  type="number"
                  min="0"
                  value={quotation.discountValue}
                  onChange={(event) =>
                    updateRoot('discountValue', event.target.value)
                  }
                />
              </Field>

              <Field label={t('VAT (%)')}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={quotation.vatRate}
                  onChange={(event) => updateRoot('vatRate', event.target.value)}
                />
              </Field>

              <Field label={t('Đặt cọc (%)')}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={quotation.depositPercent}
                  onChange={(event) =>
                    updateRoot('depositPercent', event.target.value)
                  }
                />
              </Field>
            </div>
          </EditorSection>

          <EditableListSection
            title={t('Quyền lợi của khách hàng')}
            description={t('Những giá trị, quyền lợi và kết quả khách hàng sẽ nhận được.')}
            icon={CheckCircle2}
            items={quotation.benefits}
            onChange={(id, value) => updateListItem('benefits', id, value)}
            onAdd={() => addListItem('benefits')}
            onRemove={(id) => removeListItem('benefits', id)}
            addLabel={t('Thêm quyền lợi')}
          />

          <EditableListSection
            title={t('Điều khoản thanh toán')}
            description={t('Các mốc và nguyên tắc thanh toán của dự án.')}
            icon={Percent}
            items={quotation.paymentTerms}
            onChange={(id, value) => updateListItem('paymentTerms', id, value)}
            onAdd={() => addListItem('paymentTerms')}
            onRemove={(id) => removeListItem('paymentTerms', id)}
            addLabel={t('Thêm điều khoản thanh toán')}
          />

          <EditableListSection
            title={t('Điều kiện báo giá')}
            description={t('Phạm vi hiệu lực, chi phí phát sinh và nguyên tắc phối hợp.')}
            icon={ShieldCheck}
            items={quotation.terms}
            onChange={(id, value) => updateListItem('terms', id, value)}
            onAdd={() => addListItem('terms')}
            onRemove={(id) => removeListItem('terms', id)}
            addLabel={t('Thêm điều kiện')}
          />

          <EditorSection
            icon={Banknote}
            title={t('Thông tin thanh toán')}
            description={t('Có thể để trống nếu chưa muốn hiển thị trên báo giá.')}
          >
            <div className="qb-form-grid qb-form-grid-2">
              <Field label={t('Ngân hàng')}>
                <input
                  value={quotation.bank.bankName}
                  onChange={(event) =>
                    updateNested('bank', 'bankName', event.target.value)
                  }
                  placeholder={t('Tên ngân hàng')}
                />
              </Field>

              <Field label={t('Chủ tài khoản')}>
                <input
                  value={quotation.bank.accountName}
                  onChange={(event) =>
                    updateNested('bank', 'accountName', event.target.value)
                  }
                  placeholder={t('Tên chủ tài khoản')}
                />
              </Field>

              <Field label={t('Số tài khoản')}>
                <input
                  value={quotation.bank.accountNumber}
                  onChange={(event) =>
                    updateNested('bank', 'accountNumber', event.target.value)
                  }
                  placeholder="Số tài khoản"
                />
              </Field>

              <Field label={t('Nội dung chuyển khoản')}>
                <input
                  value={quotation.bank.transferNote}
                  onChange={(event) =>
                    updateNested('bank', 'transferNote', event.target.value)
                  }
                  placeholder={t('Ví dụ: QUOTE + TÊN KHÁCH HÀNG')}
                />
              </Field>
            </div>
          </EditorSection>

          <EditorSection
            icon={FileText}
            title={t('Ghi chú và đại diện')}
            description={t('Thông điệp kết và thông tin người phát hành báo giá.')}
          >
            <div className="qb-form-grid">
              <Field label={t('Ghi chú cuối báo giá')}>
                <textarea
                  rows="4"
                  value={quotation.note}
                  onChange={(event) => updateRoot('note', event.target.value)}
                />
              </Field>

              <div className="qb-form-grid qb-form-grid-2">
                <Field label={t('Người đại diện')}>
                  <input
                    value={quotation.signature.representative}
                    onChange={(event) =>
                      updateNested(
                        'signature',
                        'representative',
                        event.target.value,
                      )
                    }
                  />
                </Field>

                <Field label={t('Chức danh')}>
                  <input
                    value={quotation.signature.title}
                    onChange={(event) =>
                      updateNested('signature', 'title', event.target.value)
                    }
                  />
                </Field>
              </div>

              <Field label={t('Ảnh chữ ký')}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSignatureUpload}
                />
                <small style={{ display: 'block', marginTop: 8, opacity: 0.68 }}>
                  {t('Tải ảnh chữ ký PNG/JPG')}
                </small>

                {quotation.signature.image && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <img
                      src={quotation.signature.image || DEFAULT_SIGNATURE_IMAGE}
                      alt="Signature preview"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_SIGNATURE_IMAGE;
                      }}
                      style={{
                        width: 130,
                        height: 65,
                        objectFit: 'contain',
                        background: '#fff',
                        borderRadius: 8,
                        border: '1px solid rgba(15, 23, 42, 0.1)',
                      }}
                    />
                    <button
                      type="button"
                      className="qb-btn-light"
                      onClick={() =>
                        updateNested(
                          'signature',
                          'image',
                          DEFAULT_SIGNATURE_IMAGE,
                        )
                      }
                    >
                      <Trash2 size={15} />
                      {t('Xóa')}
                    </button>
                  </div>
                )}
              </Field>
            </div>
          </EditorSection>
        </aside>

        <section className="qb-preview-shell">
          <div className="qb-preview-label">
            <span>
              <FileText size={16} />
              {t('Bản xem trước A4')}
            </span>
            <small>{t('Nhấn “Xuất PDF” và chọn Save as PDF')}</small>
          </div>

          <QuotationDocument
            quotation={quotation}
            calculations={calculations}
            language={language}
          />
        </section>
      </div>
    </main>
  );
};

const Field = ({ label, children, full = false }) => (
  <label className={`qb-field ${full ? 'qb-field-full' : ''}`}>
    <span>{label}</span>
    {children}
  </label>
);

const EditorSection = ({
  icon: Icon,
  title,
  description,
  children,
}) => (
  <section className="qb-editor-section">
    <header>
      <span className="qb-editor-section-icon">
        <Icon size={19} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
    {children}
  </section>
);

const EditableListSection = ({
  title,
  description,
  icon,
  items,
  onChange,
  onAdd,
  onRemove,
  addLabel,
}) => {
  const Icon = icon;

  return (
    <EditorSection icon={Icon} title={title} description={description}>
      <div className="qb-editable-list">
        {items.map((item, index) => (
          <div className="qb-editable-list-row" key={item.id}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <textarea
              rows="2"
              value={item.text}
              onChange={(event) => onChange(item.id, event.target.value)}
            />
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              disabled={items.length === 1}
              aria-label="Delete content"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="qb-add-button" onClick={onAdd}>
        <CirclePlus size={17} />
        {addLabel}
      </button>
    </EditorSection>
  );
};

const QuotationDocument = ({ quotation, calculations, language }) => {
  const t = (text) => tr(language, text);

  const hasBankInfo = Object.values(quotation.bank).some((value) =>
    String(value || '').trim(),
  );

  return (
    <article className="quote-document" lang={language}>
      <div className="quote-accent quote-accent-top" />

      <header className="quote-header">
        <div className="quote-brand">
          <img src={logoLight} alt="IMPAKT Studio" />
          <p>{quotation.company.slogan}</p>
        </div>

        <div className="quote-header-title">
          <span>{t('QUOTATION')}</span>
          <h1>{t('BÁO GIÁ DỊCH VỤ')}</h1>
          <strong>#{quotation.quoteNumber || '—'}</strong>
        </div>
      </header>

      <section className="quote-meta-grid">
        <div>
          <span>{t('Ngày phát hành')}</span>
          <strong>{formatDate(quotation.issueDate, language)}</strong>
        </div>
        <div>
          <span>{t('Hiệu lực đến')}</span>
          <strong>{formatDate(quotation.expiryDate, language)}</strong>
        </div>
        <div>
          <span>{t('Đơn vị tiền tệ')}</span>
          <strong>{quotation.currency}</strong>
        </div>
      </section>

      <section className="quote-parties">
        <div className="quote-party-card">
          <span className="quote-section-kicker">{t('ĐƠN VỊ BÁO GIÁ')}</span>
          <h2>{quotation.company.name}</h2>
          <p>{quotation.company.email}</p>
          <p>{quotation.company.phone}</p>
          <p>{quotation.company.website}</p>
          <p>{quotation.company.address}</p>
        </div>

        <div className="quote-party-card quote-party-client">
          <span className="quote-section-kicker">{t('KHÁCH HÀNG')}</span>
          <h2>{quotation.client.company || quotation.client.name || '—'}</h2>
          {quotation.client.company && quotation.client.name && (
            <p>{t('Người liên hệ:')} {quotation.client.name}</p>
          )}
          <p>{quotation.client.email || '—'}</p>
          <p>{quotation.client.phone || '—'}</p>
          <p>{quotation.client.address || '—'}</p>
        </div>
      </section>

      <section className="quote-project-summary">
        <span className="quote-section-kicker">{t('DỰ ÁN ĐỀ XUẤT')}</span>
        <h2>{translateKnownValue(quotation.project.title, language) || '—'}</h2>
        <p>{translateKnownValue(quotation.project.summary, language) || '—'}</p>

        <div>
          <strong>{t('Thời gian dự kiến:')}</strong>
          <span>{translateKnownValue(quotation.project.timeline, language) || '—'}</span>
        </div>
      </section>

      <section className="quote-section">
        <div className="quote-section-heading">
          <span>01</span>
          <div>
            <small>{t('PHẠM VI CÔNG VIỆC')}</small>
            <h2>{t('Hạng mục và chi phí')}</h2>
          </div>
        </div>

        <div className="quote-table-wrap">
          <table className="quote-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>{t('HẠNG MỤC')}</th>
                <th>{t('SL')}</th>
                <th>{t('ĐƠN GIÁ')}</th>
                <th>{t('THÀNH TIỀN')}</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{String(index + 1).padStart(2, '0')}</td>
                  <td>
                    <strong>{translateKnownValue(item.name, language) || t('Hạng mục chưa đặt tên')}</strong>
                    {item.description && <p>{translateKnownValue(item.description, language)}</p>}
                  </td>
                  <td>
                    {normalizeNumber(item.quantity)} {translateKnownValue(item.unit, language)}
                  </td>
                  <td>
                    {formatCurrency(item.unitPrice, quotation.currency, language)}
                  </td>
                  <td>
                    <strong>
                      {formatCurrency(
                        normalizeNumber(item.quantity) *
                          normalizeNumber(item.unitPrice), quotation.currency, language)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="quote-total-layout">
          <div className="quote-payment-highlight">
            <span>{t('Khoản thanh toán đầu tiên')}</span>
            <strong>
              {formatCurrency(calculations.deposit, quotation.currency, language)}
            </strong>
            <small>
              {t('Tương đương')} {normalizeNumber(quotation.depositPercent)}%{' '}
              {t('tổng giá trị báo giá')}
            </small>
          </div>

          <div className="quote-totals">
            <div>
              <span>{t('Tạm tính')}</span>
              <strong>
                {formatCurrency(calculations.subtotal, quotation.currency, language)}
              </strong>
            </div>

            {calculations.discount > 0 && (
              <div>
                <span>{t('Giảm giá')}</span>
                <strong>
                  -{formatCurrency(calculations.discount, quotation.currency, language)}
                </strong>
              </div>
            )}

            {normalizeNumber(quotation.vatRate) > 0 && (
              <div>
                <span>VAT ({normalizeNumber(quotation.vatRate)}%)</span>
                <strong>
                  {formatCurrency(calculations.vat, quotation.currency, language)}
                </strong>
              </div>
            )}

            <div className="quote-grand-total">
              <span>{t('TỔNG GIÁ TRỊ')}</span>
              <strong>
                {formatCurrency(calculations.total, quotation.currency, language)}
              </strong>
            </div>

            <div>
              <span>{t('Còn lại sau đặt cọc')}</span>
              <strong>
                {formatCurrency(calculations.remaining, quotation.currency, language)}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="quote-section quote-benefits-section">
        <div className="quote-section-heading">
          <span>02</span>
          <div>
            <small>{t('GIÁ TRỊ BÀN GIAO')}</small>
            <h2>{t('Quyền lợi của khách hàng')}</h2>
          </div>
        </div>

        <div className="quote-benefits-grid">
          {quotation.benefits
            .filter((item) => item.text.trim())
            .map((item) => (
              <div key={item.id}>
                <CheckCircle2 size={17} />
                <p>{translateKnownValue(item.text, language)}</p>
              </div>
            ))}
        </div>
      </section>

      <section className="quote-two-column-section">
        <div className="quote-section quote-compact-section">
          <div className="quote-section-heading">
            <span>03</span>
            <div>
              <small>{t('THANH TOÁN')}</small>
              <h2>{t('Điều khoản thanh toán')}</h2>
            </div>
          </div>

          <ol className="quote-number-list">
            {quotation.paymentTerms
              .filter((item) => item.text.trim())
              .map((item) => (
                <li key={item.id}>{translateKnownValue(item.text, language)}</li>
              ))}
          </ol>
        </div>

        <div className="quote-section quote-compact-section">
          <div className="quote-section-heading">
            <span>04</span>
            <div>
              <small>{t('LƯU Ý')}</small>
              <h2>{t('Điều kiện báo giá')}</h2>
            </div>
          </div>

          <ul className="quote-bullet-list">
            {quotation.terms
              .filter((item) => item.text.trim())
              .map((item) => (
                <li key={item.id}>{translateKnownValue(item.text, language)}</li>
              ))}
          </ul>
        </div>
      </section>

      {hasBankInfo && (
        <section className="quote-bank-card">
          <div>
            <span className="quote-section-kicker">{t('THÔNG TIN THANH TOÁN')}</span>
            <h2>{quotation.bank.bankName || 'Ngân hàng'}</h2>
          </div>

          <dl>
            <div>
              <dt>{t('Chủ tài khoản')}</dt>
              <dd>{quotation.bank.accountName || '—'}</dd>
            </div>
            <div>
              <dt>{t('Số tài khoản')}</dt>
              <dd>{quotation.bank.accountNumber || '—'}</dd>
            </div>
            <div>
              <dt>{t('Nội dung CK')}</dt>
              <dd>{quotation.bank.transferNote || '—'}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="quote-closing">
        <p>{translateKnownValue(quotation.note, language)}</p>

        <div className="quote-signature">
          <span>{t('ĐẠI DIỆN IMPAKT STUDIO')}</span>

          {(quotation.signature.image || DEFAULT_SIGNATURE_IMAGE) ? (
            <img
              className="quote-signature-image"
              src={quotation.signature.image || DEFAULT_SIGNATURE_IMAGE}
              alt={quotation.signature.representative || 'Signature'}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = DEFAULT_SIGNATURE_IMAGE;
              }}
            />
          ) : (
            <div className="quote-signature-space" />
          )}

          <strong>{quotation.signature.representative}</strong>
          <small>{quotation.signature.title}</small>
        </div>
      </section>

      <footer className="quote-footer">
        <span>{quotation.company.email}</span>
        <span>{quotation.company.phone}</span>
        <span>{quotation.company.website}</span>
      </footer>

      <div className="quote-accent quote-accent-bottom" />
    </article>
  );
};

export default QuotationPage;