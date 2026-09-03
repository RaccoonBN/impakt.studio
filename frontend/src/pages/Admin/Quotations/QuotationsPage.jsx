import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Download,
  Eye,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

import {
  createQuotation,
  deleteQuotation,
  listCustomers,
  listProjects,
  listQuotations,
  openDocument,
  updateQuotation,
} from '../adminApi';

import {
  Alert,
  ConfirmDialog,
  EmptyState,
  FormFooter,
  AdminModal,
  QUOTATION_STATUSES,
  QuotationForm,
  StatusBadge,
  createQuotationForm,
  formatDate,
  formatMoney,
  formatValue,
  getErrorMessage,
} from '../../../components/Admin';

import './QuotationsPage.css';

const QuotationsPage = ({
  onUnauthorized,
}) => {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    projects,
    setProjects,
  ] = useState([]);

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
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const [
    deleting,
    setDeleting,
  ] = useState(false);


  const [
    modal,
    setModal,
  ] = useState(null);

  const [
    form,
    setForm,
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
      const [
        quotationsResult,
        customersResult,
        projectsResult,
      ] = await Promise.all([
        listQuotations({
          pageSize: 100,
        }),
        listCustomers({
          pageSize: 100,
        }),
        listProjects({
          pageSize: 100,
        }),
      ]);

      setItems(
        quotationsResult.quotations ||
          [],
      );

      setCustomers(
        customersResult.customers ||
          [],
      );

      setProjects(
        projectsResult.projects ||
          [],
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
        (quotation) => {
          if (
            status !==
              'Tất cả' &&
            quotation.status !==
              status
          ) {
            return false;
          }

          const content = [
            quotation.quotationId,
            quotation.documentNumber,
            quotation.customerName,
            quotation.projectName,
            quotation.status,
            quotation.notes,
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

  const relatedProjects =
    useMemo(() => {
      if (
        !form?.customerId
      ) {
        return projects;
      }

      return projects.filter(
        (project) =>
          project.customerId ===
          form.customerId,
      );
    }, [
      projects,
      form?.customerId,
    ]);

  const closeModal = () => {
    setModal(null);
    setForm(null);
    setFormError('');
  };

  const openCreate = () => {
    setModal({
      mode: 'create',
    });

    setForm(
      createQuotationForm(),
    );
  };

  const openEdit = (
    quotation,
  ) => {
    setModal({
      mode: 'edit',
      record: quotation,
    });

    setForm(
      createQuotationForm({
        ...quotation,
        customerMode:
          'existing',
        customerId:
          quotation.customerId ||
          '',
        projectId:
          quotation.projectId ||
          '',
        items:
          Array.isArray(
            quotation.items,
          ) &&
          quotation.items.length
            ? quotation.items
            : createQuotationForm()
                .items,
        discount:
          Number(
            quotation.discount,
          ) || 0,
        taxRate:
          Number(
            quotation.taxRate,
          ) || 0,
        depositPercent:
          Number(
            quotation.depositPercent,
          ) || 0,
      }),
    );
  };

  const openView = (
    quotation,
  ) => {
    setModal({
      mode: 'view',
      record: quotation,
    });
  };

  const buildPayload = () => {
    const common = {
      projectId:
        form.projectId || '',
      issueDate:
        form.issueDate,
      expiryDate:
        form.expiryDate || '',
      language:
        form.language,
      currency:
        form.currency,
      items:
        form.items.map(
          (item) => ({
            ...item,
            quantity:
              Number(
                item.quantity,
              ) || 0,
            unitPrice:
              Number(
                item.unitPrice,
              ) || 0,
          }),
        ),
      discount:
        Number(
          form.discount,
        ) || 0,
      taxRate:
        Number(
          form.taxRate,
        ) || 0,
      depositPercent:
        Number(
          form.depositPercent,
        ) || 0,
      status:
        form.status,
      notes:
        form.notes || '',
    };

    if (
      modal.mode ===
      'edit'
    ) {
      return {
        quotationId:
          modal.record
            .quotationId,
        customerId:
          form.customerId,
        ...common,
      };
    }

    if (
      form.customerMode ===
      'new'
    ) {
      return {
        customer:
          form.customer,
        ...common,
      };
    }

    return {
      customerId:
        form.customerId,
      ...common,
    };
  };

  const save = async () => {
    setSaving(true);
    setFormError('');

    try {
      if (
        modal.mode ===
        'edit'
      ) {
        await updateQuotation(
          buildPayload(),
        );
      } else {
        await createQuotation(
          buildPayload(),
        );
      }

      setSuccess(
        modal.mode === 'edit'
          ? 'Đã cập nhật Quotation.'
          : 'Đã tạo Quotation mới.',
      );

      closeModal();
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

  const remove = async ({
    reason,
  }) => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deleteQuotation({
        quotationId:
          deleteTarget.quotationId,
        reason,
      });

      setSuccess(
        'Đã xóa mềm Quotation.',
      );

      setDeleteTarget(null);
      await load();
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
      setDeleting(false);
    }
  };

  return (
    <section>
      <header className="ia-page-header">
        <div>
          <span className="ia-eyebrow">
            Quotation Management
          </span>

          <h1>
            Quản lý báo giá
          </h1>

          <p>
            Tạo báo giá theo từng
            Customer, Project và
            theo dõi trạng thái gửi.
          </p>
        </div>

        <button
          type="button"
          className="ia-primary-button"
          onClick={openCreate}
        >
          <Plus size={17} />
          Tạo Quotation
        </button>
      </header>

      <Alert message={error} />
      <Alert
        message={success}
        success
      />

      <section className="ia-panel">
        <div className="ia-toolbar">
          <label className="ia-search-box">
            <Search size={18} />

            <input
              type="search"
              placeholder="Tìm số báo giá, khách hàng…"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </label>

          <div className="ia-quotation-toolbar">
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

              {QUOTATION_STATUSES.map(
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

            <button
              type="button"
              className="ia-icon-button"
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
            </button>
          </div>
        </div>

        {!loading &&
          !filtered.length && (
            <EmptyState
              title="Chưa có Quotation"
              description="Tạo báo giá từ Customer có sẵn hoặc nhập khách mới."
              action={
                <button
                  type="button"
                  className="ia-primary-button"
                  onClick={openCreate}
                >
                  <Plus size={17} />
                  Tạo Quotation
                </button>
              }
            />
          )}

        {filtered.length > 0 && (
          <div className="ia-table-wrap">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Báo giá</th>
                  <th>Khách hàng</th>
                  <th>Ngày phát hành</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (quotation) => (
                    <tr
                      key={
                        quotation.quotationId
                      }
                    >
                      <td>
                        <strong>
                          {formatValue(
                            quotation.documentNumber,
                            quotation.quotationId,
                          )}
                        </strong>

                        <small>
                          {
                            quotation.quotationId
                          }
                        </small>
                      </td>

                      <td>
                        {formatValue(
                          quotation.customerName,
                        )}
                      </td>

                      <td>
                        {formatDate(
                          quotation.issueDate,
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatMoney(
                            quotation.total,
                            quotation.currency ||
                              'VND',
                          )}
                        </strong>
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            quotation.status
                          }
                        />
                      </td>

                      <td>
                        <div className="ia-row-actions">
                          <button
                            type="button"
                            title="Xem bản A4"
                            onClick={() =>
                              openDocument(
                                'quotation',
                                quotation.quotationId,
                                'preview',
                              )
                            }
                          >
                            <ExternalLink
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            title="Xuất PDF"
                            onClick={() =>
                              openDocument(
                                'quotation',
                                quotation.quotationId,
                                'print',
                              )
                            }
                          >
                            <Download
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            title="Xem chi tiết"
                            onClick={() =>
                              openView(
                                quotation,
                              )
                            }
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            title="Chỉnh sửa"
                            onClick={() =>
                              openEdit(
                                quotation,
                              )
                            }
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            className="is-danger"
                            title="Xóa"
                            onClick={() =>
                              setDeleteTarget(
                                quotation,
                              )
                            }
                          >
                            <Trash2
                              size={16}
                            />
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

      {[
        'create',
        'edit',
      ].includes(
        modal?.mode,
      ) &&
        form && (
          <AdminModal
            wide
            eyebrow="Quotation"
            title={
              modal.mode ===
              'edit'
                ? 'Chỉnh sửa Quotation'
                : 'Tạo Quotation mới'
            }
            onClose={closeModal}
          >
            <QuotationForm
              form={form}
              setForm={setForm}
              customers={customers}
              projects={
                relatedProjects
              }
              isEdit={
                modal.mode ===
                'edit'
              }
            />

            <Alert
              message={formError}
            />

            <FormFooter
              saving={saving}
              onCancel={closeModal}
              onSave={save}
            />
          </AdminModal>
        )}

      {modal?.mode ===
        'view' && (
          <AdminModal
            wide
            eyebrow="Quotation"
            title={formatValue(
              modal.record
                .documentNumber,
              modal.record
                .quotationId,
            )}
            onClose={closeModal}
          >
            <div className="ia-quotation-detail">
              {[
                [
                  'Mã báo giá',
                  modal.record
                    .quotationId,
                ],
                [
                  'Khách hàng',
                  modal.record
                    .customerName,
                ],
                [
                  'Dự án',
                  modal.record
                    .projectName,
                ],
                [
                  'Ngày phát hành',
                  formatDate(
                    modal.record
                      .issueDate,
                  ),
                ],
                [
                  'Ngày hết hiệu lực',
                  formatDate(
                    modal.record
                      .expiryDate,
                  ),
                ],
                [
                  'Tổng thanh toán',
                  formatMoney(
                    modal.record.total,
                    modal.record
                      .currency ||
                      'VND',
                  ),
                ],
                [
                  'Đặt cọc',
                  formatMoney(
                    modal.record
                      .depositAmount,
                    modal.record
                      .currency ||
                      'VND',
                  ),
                ],
                [
                  'Trạng thái',
                  modal.record.status,
                ],
                [
                  'Ghi chú',
                  modal.record.notes,
                ],
              ].map(
                ([
                  label,
                  value,
                ]) => (
                  <article key={label}>
                    <small>
                      {label}
                    </small>
                    <strong>
                      {formatValue(
                        value,
                      )}
                    </strong>
                  </article>
                ),
              )}
            </div>

            <footer className="ia-modal-footer">
              <button
                type="button"
                className="ia-secondary-button"
                onClick={() =>
                  openDocument(
                    'quotation',
                    modal.record
                      .quotationId,
                    'preview',
                  )
                }
              >
                <ExternalLink
                  size={16}
                />
                Xem bản A4
              </button>

              <button
                type="button"
                className="ia-primary-button"
                onClick={() =>
                  openDocument(
                    'quotation',
                    modal.record
                      .quotationId,
                    'print',
                  )
                }
              >
                <Download
                  size={16}
                />
                Xuất PDF
              </button>

              <button
                type="button"
                className="ia-secondary-button"
                onClick={closeModal}
              >
                Đóng
              </button>
            </footer>
          </AdminModal>
        )}
      <ConfirmDialog
        open={Boolean(
          deleteTarget,
        )}
        title="Xóa Quotation?"
        message={
          deleteTarget
            ? `Dữ liệu "${deleteTarget.documentNumber || deleteTarget.quotationId}" sẽ được xóa mềm và không còn xuất hiện trong danh sách mặc định.`
            : ''
        }
        confirmLabel="Xóa dữ liệu"
        requireReason
        loading={deleting}
        onCancel={() =>
          setDeleteTarget(null)
        }
        onConfirm={remove}
      />

    </section>
  );
};

export default QuotationsPage;
