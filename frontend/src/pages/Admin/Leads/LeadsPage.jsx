import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Eye,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
  UserPlus,
} from 'lucide-react';

import {
  createCustomer,
  listLeads,
  updateLead,
} from '../adminApi';

import {
  Alert,
  CustomerForm,
  EmptyState,
  Field,
  FormFooter,
  LEAD_STATUSES,
  AdminModal,
  StatusBadge,
  createCustomerForm,
  formatDate,
  formatValue,
  getErrorMessage,
} from '../../../components/Admin';

import './LeadsPage.css';

const LeadsPage = ({
  onUnauthorized,
}) => {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    stats,
    setStats,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    status,
    setStatus,
  ] = useState('Tất cả');

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  const [
    selected,
    setSelected,
  ] = useState(null);

  const [
    leadForm,
    setLeadForm,
  ] = useState(null);

  const [
    customerForm,
    setCustomerForm,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const result =
        await listLeads({
          pageSize: 100,
        });

      setItems(
        result.leads || [],
      );

      setStats(
        result.stats || {},
      );
    } catch (requestError) {
      if (
        requestError.message ===
        'UNAUTHORIZED'
      ) {
        onUnauthorized();
        return;
      }

      setError(
        getErrorMessage(
          requestError.message,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return items.filter(
        (lead) => {
          const leadStatus =
            lead.status ===
            'Đã liên hệ'
              ? 'Đã liên hệ'
              : 'Chưa liên hệ';

          if (
            status !==
              'Tất cả' &&
            leadStatus !==
              status
          ) {
            return false;
          }

          const content = [
            lead.name,
            lead.phone,
            lead.email,
            lead.projectTypeLabel,
            lead.projectType,
            lead.message,
            lead.submissionId,
          ]
            .join(' ')
            .toLowerCase();

          return (
            !query ||
            content.includes(
              query,
            )
          );
        },
      );
    }, [
      items,
      search,
      status,
    ]);

  const openLead = (
    lead,
  ) => {
    setSelected(lead);

    setLeadForm({
      submissionId:
        lead.submissionId,
      status:
        lead.status ===
        'Đã liên hệ'
          ? 'Đã liên hệ'
          : 'Chưa liên hệ',
      notes:
        lead.notes || '',
    });

    setFormError('');
  };

  const convertLead = (
    lead,
  ) => {
    setSelected(lead);

    setCustomerForm(
      createCustomerForm({
        fullName:
          lead.name || '',
        phone:
          lead.phone || '',
        email:
          lead.email || '',
        source:
          'Website',
        leadId:
          lead.submissionId,
        notes:
          lead.message
            ? `Nhu cầu từ website:\n${lead.message}`
            : '',
      }),
    );

    setFormError('');
  };

  const saveLead = async () => {
    setSaving(true);
    setFormError('');

    try {
      await updateLead(
        leadForm,
      );

      setSuccess(
        'Đã cập nhật Lead.',
      );

      setSelected(null);
      setLeadForm(null);

      await load();
    } catch (requestError) {
      if (
        requestError.message ===
        'UNAUTHORIZED'
      ) {
        onUnauthorized();
        return;
      }

      setFormError(
        getErrorMessage(
          requestError.message,
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const saveCustomer = async () => {
    setSaving(true);
    setFormError('');

    try {
      await createCustomer(
        customerForm,
      );

      setSuccess(
        'Đã chuyển Lead thành Customer.',
      );

      setSelected(null);
      setCustomerForm(null);

      await load();
    } catch (requestError) {
      if (
        requestError.message ===
        'UNAUTHORIZED'
      ) {
        onUnauthorized();
        return;
      }

      setFormError(
        getErrorMessage(
          requestError.message,
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <header className="ia-page-header">
        <div>
          <span className="ia-eyebrow">
            Website Leads
          </span>

          <h1>
            Khách hàng tiềm năng
          </h1>

          <p>
            Quản lý toàn bộ yêu cầu
            tư vấn được gửi từ website
            IMPAKT Studio.
          </p>
        </div>

        <button
          type="button"
          className="ia-secondary-button"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? 'ia-spin'
                : ''
            }
          />
          Làm mới
        </button>
      </header>

      <Alert message={error} />
      <Alert
        message={success}
        success
      />

      <div className="ia-lead-stats">
        <article>
          <small>
            Tổng Leads
          </small>
          <strong>
            {stats.total ??
              items.length}
          </strong>
        </article>

        <article>
          <small>
            Chưa liên hệ
          </small>
          <strong>
            {stats.notContacted ??
              items.filter(
                (item) =>
                  item.status !==
                  'Đã liên hệ',
              ).length}
          </strong>
        </article>

        <article>
          <small>
            Đã liên hệ
          </small>
          <strong>
            {stats.contacted ??
              items.filter(
                (item) =>
                  item.status ===
                  'Đã liên hệ',
              ).length}
          </strong>
        </article>
      </div>

      <section className="ia-panel">
        <div className="ia-toolbar">
          <label className="ia-search-box">
            <Search size={18} />

            <input
              type="search"
              placeholder="Tìm tên, email, số điện thoại…"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </label>

          <select
            className="ia-filter-select"
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value,
              )
            }
          >
            <option value="Tất cả">
              Tất cả trạng thái
            </option>

            {LEAD_STATUSES.map(
              (item) => (
                <option
                  value={item}
                  key={item}
                >
                  {item}
                </option>
              ),
            )}
          </select>
        </div>

        {!loading &&
          !filtered.length && (
            <EmptyState
              title="Chưa có Lead phù hợp"
              description="Thử đổi từ khóa hoặc trạng thái lọc."
            />
          )}

        {filtered.length > 0 && (
          <div className="ia-table-wrap">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Liên hệ</th>
                  <th>Nhu cầu</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (lead) => (
                    <tr
                      key={
                        lead.submissionId
                      }
                    >
                      <td>
                        <strong>
                          {formatValue(
                            lead.name,
                          )}
                        </strong>

                        <small>
                          {
                            lead.submissionId
                          }
                        </small>
                      </td>

                      <td>
                        <span className="ia-contact-line">
                          <Phone
                            size={14}
                          />
                          {formatValue(
                            lead.phone,
                          )}
                        </span>

                        <span className="ia-contact-line">
                          <Mail
                            size={14}
                          />
                          {formatValue(
                            lead.email,
                          )}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatValue(
                            lead.projectTypeLabel ||
                              lead.projectType,
                          )}
                        </strong>

                        <small className="ia-lead-message">
                          {formatValue(
                            lead.message,
                            'Không có nội dung bổ sung.',
                          )}
                        </small>
                      </td>

                      <td>
                        {formatDate(
                          lead.receivedAt,
                        )}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            lead.status ===
                            'Đã liên hệ'
                              ? 'Đã liên hệ'
                              : 'Chưa liên hệ'
                          }
                        />
                      </td>

                      <td>
                        <div className="ia-row-actions">
                          <button
                            type="button"
                            title="Chuyển thành Customer"
                            onClick={() =>
                              convertLead(
                                lead,
                              )
                            }
                          >
                            <UserPlus
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            title="Xem chi tiết"
                            onClick={() =>
                              openLead(
                                lead,
                              )
                            }
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected &&
        leadForm && (
          <AdminModal
            eyebrow="Lead từ website"
            title={formatValue(
              selected.name,
            )}
            onClose={() => {
              setSelected(null);
              setLeadForm(null);
            }}
          >
            <div className="ia-lead-detail">
              <article>
                <small>
                  Số điện thoại
                </small>
                <strong>
                  {formatValue(
                    selected.phone,
                  )}
                </strong>
              </article>

              <article>
                <small>Email</small>
                <strong>
                  {formatValue(
                    selected.email,
                  )}
                </strong>
              </article>

              <article>
                <small>Nhu cầu</small>
                <strong>
                  {formatValue(
                    selected.projectTypeLabel ||
                      selected.projectType,
                  )}
                </strong>
              </article>

              <article>
                <small>Ngày gửi</small>
                <strong>
                  {formatDate(
                    selected.receivedAt,
                  )}
                </strong>
              </article>
            </div>

            <div className="ia-message-box">
              <span>
                <MessageSquareText
                  size={17}
                />
                Nội dung yêu cầu
              </span>

              <p>
                {formatValue(
                  selected.message,
                  'Không có nội dung bổ sung.',
                )}
              </p>
            </div>

            <div className="ia-form-grid">
              <Field label="Trạng thái">
                <select
                  value={leadForm.status}
                  onChange={(event) =>
                    setLeadForm(
                      (current) => ({
                        ...current,
                        status:
                          event.target.value,
                      }),
                    )
                  }
                >
                  {LEAD_STATUSES.map(
                    (item) => (
                      <option
                        value={item}
                        key={item}
                      >
                        {item}
                      </option>
                    ),
                  )}
                </select>
              </Field>

              <Field
                label="Ghi chú nội bộ"
                full
              >
                <textarea
                  value={leadForm.notes}
                  onChange={(event) =>
                    setLeadForm(
                      (current) => ({
                        ...current,
                        notes:
                          event.target.value,
                      }),
                    )
                  }
                />
              </Field>
            </div>

            <Alert
              message={formError}
            />

            <FormFooter
              saving={saving}
              onCancel={() => {
                setSelected(null);
                setLeadForm(null);
              }}
              onSave={saveLead}
            />
          </AdminModal>
        )}

      {selected &&
        customerForm && (
          <AdminModal
            wide
            eyebrow="Lead → Customer"
            title="Tạo hồ sơ khách hàng"
            onClose={() => {
              setSelected(null);
              setCustomerForm(null);
            }}
          >
            <CustomerForm
              form={customerForm}
              setForm={
                setCustomerForm
              }
            />

            <Alert
              message={formError}
            />

            <FormFooter
              saving={saving}
              onCancel={() => {
                setSelected(null);
                setCustomerForm(null);
              }}
              onSave={saveCustomer}
            />
          </AdminModal>
        )}
    </section>
  );
};

export default LeadsPage;
