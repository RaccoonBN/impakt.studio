import React from 'react';

import {
  Trash2,
} from 'lucide-react';

import {
  Field,
} from './AdminUI';

import {
  CustomerSelector,
} from './CustomerForm';

import {
  CONTRACT_STATUSES,
  PAYMENT_STATUSES,
  createPaymentStage,
} from './adminConfig';

import './ContractForm.css';

const ContractForm = ({
  form,
  setForm,
  customers,
  projects,
  quotations,
  isEdit = false,
}) => {
  const update = (
    field,
    value,
  ) =>
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field ===
        'sourceMode' &&
      value ===
        'standalone'
        ? {
            quotationId: '',
          }
        : {}),
    }));

  const updateStage = (
    index,
    field,
    value,
  ) =>
    setForm((current) => ({
      ...current,
      paymentStages:
        current.paymentStages.map(
          (stage, stageIndex) =>
            stageIndex === index
              ? {
                  ...stage,
                  [field]: value,
                }
              : stage,
        ),
    }));

  const totalPercent =
    form.paymentStages.reduce(
      (
        total,
        stage,
      ) =>
        total +
        (Number(
          stage.percent,
        ) || 0),
      0,
    );

  return (
    <>
      <section className="ia-form-section">
        <h3>Khách hàng</h3>

        <CustomerSelector
          form={form}
          setForm={setForm}
          customers={customers}
          isEdit={isEdit}
        />
      </section>

      <section className="ia-form-section">
        <h3>Thông tin hợp đồng</h3>

        <div className="ia-form-grid">
          <Field label="Nguồn hợp đồng">
            <select
              value={form.sourceMode}
              onChange={(event) =>
                update(
                  'sourceMode',
                  event.target.value,
                )
              }
            >
              <option value="standalone">
                Hợp đồng độc lập
              </option>
              <option value="quotation">
                Từ báo giá
              </option>
            </select>
          </Field>

          {form.sourceMode ===
            'quotation' && (
            <Field
              label="Báo giá"
              required
            >
              <select
                value={form.quotationId}
                onChange={(event) =>
                  update(
                    'quotationId',
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Chọn báo giá
                </option>

                {quotations.map(
                  (quotation) => (
                    <option
                      value={
                        quotation.quotationId
                      }
                      key={
                        quotation.quotationId
                      }
                    >
                      {quotation.documentNumber ||
                        quotation.quotationId}
                    </option>
                  ),
                )}
              </select>
            </Field>
          )}

          <Field label="Dự án">
            <select
              value={form.projectId}
              onChange={(event) =>
                update(
                  'projectId',
                  event.target.value,
                )
              }
            >
              <option value="">
                Không liên kết
              </option>

              {projects.map(
                (project) => (
                  <option
                    value={
                      project.projectId
                    }
                    key={
                      project.projectId
                    }
                  >
                    {
                      project.projectName
                    }
                  </option>
                ),
              )}
            </select>
          </Field>

          <Field
            label="Tên hợp đồng"
            required
            full
          >
            <input
              value={form.title}
              onChange={(event) =>
                update(
                  'title',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Ngày ký">
            <input
              type="date"
              value={form.signedDate}
              onChange={(event) =>
                update(
                  'signedDate',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Ngày hiệu lực">
            <input
              type="date"
              value={
                form.effectiveDate
              }
              onChange={(event) =>
                update(
                  'effectiveDate',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field
            label="Giá trị hợp đồng"
            required
          >
            <input
              type="number"
              min="0"
              value={form.value}
              onChange={(event) =>
                update(
                  'value',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Tiền đặt cọc">
            <input
              type="number"
              min="0"
              value={
                form.depositAmount
              }
              onChange={(event) =>
                update(
                  'depositAmount',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Thời hạn">
            <input
              value={
                form.durationText
              }
              onChange={(event) =>
                update(
                  'durationText',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Trạng thái">
            <select
              value={form.status}
              onChange={(event) =>
                update(
                  'status',
                  event.target.value,
                )
              }
            >
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
          </Field>

          <Field label="Ngôn ngữ">
            <select
              value={form.language}
              onChange={(event) =>
                update(
                  'language',
                  event.target.value,
                )
              }
            >
              <option value="vi">
                Tiếng Việt
              </option>
              <option value="en">
                English
              </option>
            </select>
          </Field>

          <Field label="Tiền tệ">
            <select
              value={form.currency}
              onChange={(event) =>
                update(
                  'currency',
                  event.target.value,
                )
              }
            >
              <option value="VND">
                VND
              </option>
              <option value="USD">
                USD
              </option>
            </select>
          </Field>

          {[
            [
              'scope',
              'Phạm vi công việc',
            ],
            [
              'paymentTerms',
              'Điều khoản thanh toán',
            ],
            [
              'warrantyTerms',
              'Bảo hành và hỗ trợ',
            ],
            [
              'terminationTerms',
              'Chấm dứt hợp đồng',
            ],
            [
              'disputeTerms',
              'Giải quyết tranh chấp',
            ],
            [
              'notes',
              'Ghi chú',
            ],
          ].map(
            ([
              field,
              label,
            ]) => (
              <Field
                label={label}
                full
                key={field}
              >
                <textarea
                  value={form[field]}
                  onChange={(event) =>
                    update(
                      field,
                      event.target.value,
                    )
                  }
                />
              </Field>
            ),
          )}
        </div>
      </section>

      <section className="ia-form-section">
        <div className="ia-section-row">
          <h3>Lịch thanh toán</h3>

          <button
            type="button"
            className="ia-small-button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                paymentStages: [
                  ...current.paymentStages,
                  createPaymentStage({
                    title:
                      `Đợt ${
                        current
                          .paymentStages
                          .length + 1
                      }`,
                  }),
                ],
              }))
            }
          >
            Thêm đợt
          </button>
        </div>

        <div className="ia-item-list">
          {form.paymentStages.map(
            (stage, index) => (
              <article
                className="ia-item-card"
                key={index}
              >
                <span>
                  {index + 1}
                </span>

                <div className="ia-form-grid">
                  <Field label="Tên đợt">
                    <input
                      value={stage.title}
                      onChange={(event) =>
                        updateStage(
                          index,
                          'title',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Tỷ lệ (%)">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={stage.percent}
                      onChange={(event) =>
                        updateStage(
                          index,
                          'percent',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Hạn thanh toán">
                    <input
                      type="date"
                      value={
                        stage.dueDate
                      }
                      onChange={(event) =>
                        updateStage(
                          index,
                          'dueDate',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Trạng thái">
                    <select
                      value={stage.status}
                      onChange={(event) =>
                        updateStage(
                          index,
                          'status',
                          event.target.value,
                        )
                      }
                    >
                      {PAYMENT_STATUSES.map(
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
                    label="Điều kiện"
                    full
                  >
                    <textarea
                      value={stage.condition}
                      onChange={(event) =>
                        updateStage(
                          index,
                          'condition',
                          event.target.value,
                        )
                      }
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  className="ia-remove-button"
                  onClick={() =>
                    setForm(
                      (current) => ({
                        ...current,
                        paymentStages:
                          current.paymentStages.filter(
                            (
                              _,
                              stageIndex,
                            ) =>
                              stageIndex !==
                              index,
                          ),
                      }),
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ),
          )}
        </div>

        <div
          className={`ia-percent-summary ${
            totalPercent === 100
              ? 'is-valid'
              : 'is-invalid'
          }`}
        >
          Tổng tỷ lệ:
          <strong>
            {totalPercent}%
          </strong>
        </div>
      </section>
    </>
  );
};

export default ContractForm;
