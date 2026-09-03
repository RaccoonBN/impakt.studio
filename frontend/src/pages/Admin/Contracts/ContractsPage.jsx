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
  createContract,
  deleteContract,
  listContracts,
  listCustomers,
  listProjects,
  listQuotations,
  openDocument,
  updateContract,
} from '../adminApi';

import {
  Alert,
  ConfirmDialog,
  CONTRACT_STATUSES,
  ContractForm,
  EmptyState,
  FormFooter,
  AdminModal,
  StatusBadge,
  createContractForm,
  formatDate,
  formatMoney,
  formatValue,
  getErrorMessage,
} from '../../../components/Admin';

import './ContractsPage.css';

const ContractsPage = ({
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
    quotations,
    setQuotations,
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
        contractsResult,
        customersResult,
        projectsResult,
        quotationsResult,
      ] = await Promise.all([
        listContracts({
          pageSize: 100,
        }),
        listCustomers({
          pageSize: 100,
        }),
        listProjects({
          pageSize: 100,
        }),
        listQuotations({
          pageSize: 100,
        }),
      ]);

      setItems(
        contractsResult.contracts ||
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

      setQuotations(
        quotationsResult.quotations ||
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
        (contract) => {
          if (
            status !==
              'Tất cả' &&
            contract.status !==
              status
          ) {
            return false;
          }

          const content = [
            contract.contractId,
            contract.documentNumber,
            contract.title,
            contract.customerName,
            contract.projectName,
            contract.quotationNumber,
            contract.status,
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

  const relatedQuotations =
    useMemo(() => {
      if (
        !form?.customerId
      ) {
        return quotations;
      }

      return quotations.filter(
        (quotation) =>
          quotation.customerId ===
          form.customerId,
      );
    }, [
      quotations,
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
      createContractForm(),
    );
  };

  const openEdit = (
    contract,
  ) => {
    setModal({
      mode: 'edit',
      record: contract,
    });

    setForm(
      createContractForm({
        ...contract,
        customerMode:
          'existing',
        customerId:
          contract.customerId ||
          '',
        projectId:
          contract.projectId ||
          '',
        quotationId:
          contract.quotationId ||
          '',
        sourceMode:
          contract.sourceMode ||
          (
            contract.quotationId
              ? 'quotation'
              : 'standalone'
          ),
        value:
          Number(
            contract.value,
          ) || 0,
        depositAmount:
          Number(
            contract.depositAmount,
          ) || 0,
        paymentStages:
          contract.paymentSchedule
            ?.stages ||
          [],
      }),
    );
  };

  const openView = (
    contract,
  ) => {
    setModal({
      mode: 'view',
      record: contract,
    });
  };

  const buildPayload = () => {
    const common = {
      projectId:
        form.projectId || '',
      quotationId:
        form.sourceMode ===
        'quotation'
          ? form.quotationId ||
            ''
          : '',
      sourceMode:
        form.sourceMode,
      title:
        form.title,
      signedDate:
        form.signedDate || '',
      effectiveDate:
        form.effectiveDate ||
        '',
      value:
        Number(
          form.value,
        ) || 0,
      depositAmount:
        Number(
          form.depositAmount,
        ) || 0,
      durationText:
        form.durationText || '',
      scope:
        form.scope || '',
      paymentTerms:
        form.paymentTerms || '',
      warrantyTerms:
        form.warrantyTerms ||
        '',
      terminationTerms:
        form.terminationTerms ||
        '',
      disputeTerms:
        form.disputeTerms || '',
      language:
        form.language,
      currency:
        form.currency,
      status:
        form.status,
      notes:
        form.notes || '',
      ...(form.paymentStages.length
        ? {
            paymentStages:
              form.paymentStages.map(
                (stage) => ({
                  ...stage,
                  percent:
                    Number(
                      stage.percent,
                    ) || 0,
                }),
              ),
          }
        : {}),
    };

    if (
      modal.mode ===
      'edit'
    ) {
      return {
        contractId:
          modal.record
            .contractId,
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
        await updateContract(
          buildPayload(),
        );
      } else {
        await createContract(
          buildPayload(),
        );
      }

      setSuccess(
        modal.mode === 'edit'
          ? 'Đã cập nhật Contract.'
          : 'Đã tạo Contract mới.',
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
      await deleteContract({
        contractId:
          deleteTarget.contractId,
        reason,
      });

      setSuccess(
        'Đã xóa mềm Contract.',
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
            Contract Management
          </span>

          <h1>
            Quản lý hợp đồng
          </h1>

          <p>
            Theo dõi hợp đồng,
            điều khoản và lịch
            thanh toán của khách hàng.
          </p>
        </div>

        <button
          type="button"
          className="ia-primary-button"
          onClick={openCreate}
        >
          <Plus size={17} />
          Tạo Contract
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
              placeholder="Tìm hợp đồng…"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </label>

          <div className="ia-contract-toolbar">
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

              {CONTRACT_STATUSES.map(
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
              title="Chưa có Contract"
              description="Tạo hợp đồng độc lập hoặc từ Quotation."
              action={
                <button
                  type="button"
                  className="ia-primary-button"
                  onClick={openCreate}
                >
                  <Plus size={17} />
                  Tạo Contract
                </button>
              }
            />
          )}

        {filtered.length > 0 && (
          <div className="ia-table-wrap">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Hợp đồng</th>
                  <th>Khách hàng</th>
                  <th>Giá trị</th>
                  <th>Ngày ký</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (contract) => (
                    <tr
                      key={
                        contract.contractId
                      }
                    >
                      <td>
                        <strong>
                          {formatValue(
                            contract.documentNumber,
                            contract.title,
                          )}
                        </strong>

                        <small>
                          {formatValue(
                            contract.title,
                          )}
                        </small>
                      </td>

                      <td>
                        {formatValue(
                          contract.customerName,
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatMoney(
                            contract.value,
                            contract.currency ||
                              'VND',
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          contract.signedDate,
                        )}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            contract.status
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
                                'contract',
                                contract.contractId,
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
                                'contract',
                                contract.contractId,
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
                                contract,
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
                                contract,
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
                                contract,
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
            eyebrow="Contract"
            title={
              modal.mode ===
              'edit'
                ? 'Chỉnh sửa Contract'
                : 'Tạo Contract mới'
            }
            onClose={closeModal}
          >
            <ContractForm
              form={form}
              setForm={setForm}
              customers={customers}
              projects={
                relatedProjects
              }
              quotations={
                relatedQuotations
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
            eyebrow="Contract"
            title={formatValue(
              modal.record
                .documentNumber,
              modal.record.title,
            )}
            onClose={closeModal}
          >
            <div className="ia-contract-detail">
              {[
                [
                  'Mã hợp đồng',
                  modal.record
                    .contractId,
                ],
                [
                  'Tên hợp đồng',
                  modal.record.title,
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
                  'Báo giá',
                  modal.record
                    .quotationNumber ||
                    modal.record
                      .quotationId,
                ],
                [
                  'Ngày ký',
                  formatDate(
                    modal.record
                      .signedDate,
                  ),
                ],
                [
                  'Ngày hiệu lực',
                  formatDate(
                    modal.record
                      .effectiveDate,
                  ),
                ],
                [
                  'Giá trị',
                  formatMoney(
                    modal.record.value,
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
                  'Thời hạn',
                  modal.record
                    .durationText,
                ],
                [
                  'Trạng thái',
                  modal.record.status,
                ],
                [
                  'Phạm vi công việc',
                  modal.record.scope,
                ],
                [
                  'Điều khoản thanh toán',
                  modal.record
                    .paymentTerms,
                ],
                [
                  'Bảo hành',
                  modal.record
                    .warrantyTerms,
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
                    'contract',
                    modal.record
                      .contractId,
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
                    'contract',
                    modal.record
                      .contractId,
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
        title="Xóa Contract?"
        message={
          deleteTarget
            ? `Dữ liệu "${deleteTarget.documentNumber || deleteTarget.contractId}" sẽ được xóa mềm và không còn xuất hiện trong danh sách mặc định.`
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

export default ContractsPage;
