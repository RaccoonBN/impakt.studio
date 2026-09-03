import './AdminUI.css';

export {
  Alert,
  EmptyState,
  Field,
  FormFooter,
  ProgressBar,
  SummaryCard,
} from './AdminUI';

export {
  CONTRACT_STATUSES,
  CUSTOMER_SOURCES,
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  LEAD_STATUSES,
  PAYMENT_STATUSES,
  PROJECT_PHASES,
  PROJECT_STATUSES,
  QUOTATION_STATUSES,
  TODAY,
  createContractForm,
  createCustomerForm,
  createPaymentStage,
  createProjectForm,
  createQuotationForm,
  createQuotationItem,
  formatDate,
  formatMoney,
  formatValue,
  getCustomerName,
  getErrorMessage,
  statusClass,
} from './adminConfig';

export {
  CustomerSelector,
} from './CustomerForm';

export {
  default as AdminModal,
} from './AdminModal';

export {
  default as AdminSidebar,
} from './AdminSidebar';

export {
  default as AdminTopbar,
} from './AdminTopbar';

export {
  default as ConfirmDialog,
} from './ConfirmDialog';

export {
  default as ContractForm,
} from './ContractForm';

export {
  default as CustomerForm,
} from './CustomerForm';

export {
  default as ProjectForm,
} from './ProjectForm';

export {
  default as QuotationForm,
} from './QuotationForm';

export {
  default as StatusBadge,
} from './StatusBadge';
