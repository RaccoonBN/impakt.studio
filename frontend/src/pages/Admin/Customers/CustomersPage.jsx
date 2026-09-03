import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Eye,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from '../adminApi';

import {
  Alert,
  ConfirmDialog,
  CUSTOMER_STATUSES,
  CustomerForm,
  EmptyState,
  FormFooter,
  AdminModal,
  StatusBadge,
  createCustomerForm,
  formatDate,
  formatValue,
  getCustomerName,
  getErrorMessage,
} from '../../../components/Admin';

import './CustomersPage.css';

const CustomersPage = ({
  onUnauthorized,
}) => {
  const [
    items,
    setItems,
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
      const result =
        await listCustomers({
          pageSize: 100,
        });

      setItems(
        result.customers || [],
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
        (customer) => {
          if (
            status !==
              'Tất cả' &&
            customer.status !==
              status
          ) {
            return false;
          }

          const content = [
            customer.customerId,
            getCustomerName(
              customer,
            ),
            customer.phone,
            customer.email,
            customer.customerType,
            customer.source,
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

  const openCreate = () => {
    setModal({
      mode: 'create',
    });

    setForm(
      createCustomerForm(),
    );

    setFormError('');
  };

  const openEdit = (
    customer,
  ) => {
    setModal({
      mode: 'edit',
      record: customer,
    });

    setForm(
      createCustomerForm({
        ...customer,
      }),
    );

    setFormError('');
  };

  const openView = (
    customer,
  ) => {
    setModal({
      mode: 'view',
      record: customer,
    });

    setForm(null);
  };

  const closeModal = () => {
    setModal(null);
    setForm(null);
    setFormError('');
  };

  const save = async () => {
    setSaving(true);
    setFormError('');

    try {
      if (
        modal.mode ===
        'edit'
      ) {
        await updateCustomer({
          ...form,
          customerId:
            modal.record
              .customerId,
        });
      } else {
        await createCustomer(
          form,
        );
      }

      setSuccess(
        modal.mode === 'edit'
          ? 'Đã cập nhật Customer.'
          : 'Đã tạo Customer mới.',
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
      await deleteCustomer({
        customerId:
          deleteTarget.customerId,
        reason,
      });

      setSuccess(
        'Đã xóa mềm Customer.',
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
            Customer Database
          </span>

          <h1>
            Quản lý khách hàng
          </h1>

          <p>
            Khách hàng có thể được
            nhập thủ công hoặc chuyển
            từ Lead website.
          </p>
        </div>

        <button
          type="button"
          className="ia-primary-button"
          onClick={openCreate}
        >
          <Plus size={17} />
          Thêm Customer
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
              placeholder="Tìm khách hàng…"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </label>

          <div className="ia-customer-toolbar">
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

              {CUSTOMER_STATUSES.map(
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
              title="Chưa có Customer"
              description="Thêm Customer thủ công hoặc chuyển từ Lead."
              action={
                <button
                  type="button"
                  className="ia-primary-button"
                  onClick={openCreate}
                >
                  <Plus size={17} />
                  Thêm Customer
                </button>
              }
            />
          )}

        {filtered.length > 0 && (
          <div className="ia-table-wrap">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Loại</th>
                  <th>Liên hệ</th>
                  <th>Nguồn</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (customer) => (
                    <tr
                      key={
                        customer.customerId
                      }
                    >
                      <td>
                        <strong>
                          {getCustomerName(
                            customer,
                          )}
                        </strong>
                        <small>
                          {
                            customer.customerId
                          }
                        </small>
                      </td>

                      <td>
                        {formatValue(
                          customer.customerType,
                        )}
                      </td>

                      <td>
                        <span className="ia-contact-line">
                          <Phone
                            size={14}
                          />
                          {formatValue(
                            customer.phone,
                          )}
                        </span>

                        <span className="ia-contact-line">
                          <Mail
                            size={14}
                          />
                          {formatValue(
                            customer.email,
                          )}
                        </span>
                      </td>

                      <td>
                        {formatValue(
                          customer.source,
                        )}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            customer.status
                          }
                        />
                      </td>

                      <td>
                        <div className="ia-row-actions">
                          <button
                            type="button"
                            onClick={() =>
                              openView(
                                customer,
                              )
                            }
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                customer,
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
                            onClick={() =>
                              setDeleteTarget(
                                customer,
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

      {modal?.mode ===
        'view' && (
          <AdminModal
            wide
            eyebrow="Customer"
            title={getCustomerName(
              modal.record,
            )}
            onClose={closeModal}
          >
            <div className="ia-customer-detail">
              {[
                [
                  'Mã khách hàng',
                  modal.record
                    .customerId,
                ],
                [
                  'Loại khách hàng',
                  modal.record
                    .customerType,
                ],
                [
                  'Số điện thoại',
                  modal.record.phone,
                ],
                [
                  'Email',
                  modal.record.email,
                ],
                [
                  'Nguồn',
                  modal.record.source,
                ],
                [
                  'Trạng thái',
                  modal.record.status,
                ],
                [
                  'Ngày tạo',
                  formatDate(
                    modal.record
                      .createdAt,
                  ),
                ],
                [
                  'Địa chỉ',
                  modal.record.address,
                ],
                [
                  'Người đại diện',
                  modal.record
                    .representativeName,
                ],
                [
                  'Mã số thuế',
                  modal.record.taxCode,
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
                onClick={closeModal}
              >
                Đóng
              </button>
            </footer>
          </AdminModal>
        )}

      {[
        'create',
        'edit',
      ].includes(
        modal?.mode,
      ) &&
        form && (
          <AdminModal
            wide
            eyebrow="Customer"
            title={
              modal.mode ===
              'edit'
                ? 'Chỉnh sửa Customer'
                : 'Thêm Customer'
            }
            onClose={closeModal}
          >
            <CustomerForm
              form={form}
              setForm={setForm}
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
      <ConfirmDialog
        open={Boolean(
          deleteTarget,
        )}
        title="Xóa Customer?"
        message={
          deleteTarget
            ? `Dữ liệu "${getCustomerName(deleteTarget)}" sẽ được xóa mềm và không còn xuất hiện trong danh sách mặc định.`
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

export default CustomersPage;
