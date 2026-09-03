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
  QUOTATION_STATUSES,
  createQuotationItem,
  formatMoney,
} from './adminConfig';

import './QuotationForm.css';

const QuotationForm = ({
  form,
  setForm,
  customers,
  projects,
  isEdit = false,
}) => {
  const update = (
    field,
    value,
  ) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  const updateItem = (
    index,
    field,
    value,
  ) =>
    setForm((current) => ({
      ...current,
      items:
        current.items.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item,
        ),
    }));

  const totals =
    form.items.reduce(
      (
        result,
        item,
      ) => {
        const amount =
          (Number(
            item.quantity,
          ) || 0) *
          (Number(
            item.unitPrice,
          ) || 0);

        return {
          ...result,
          subtotal:
            result.subtotal +
            amount,
        };
      },
      {
        subtotal: 0,
      },
    );

  const discount =
    Math.min(
      Number(
        form.discount,
      ) || 0,
      totals.subtotal,
    );

  const taxable =
    Math.max(
      totals.subtotal -
      discount,
      0,
    );

  const tax =
    taxable *
    ((Number(
      form.taxRate,
    ) || 0) / 100);

  const total =
    taxable + tax;

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
        <h3>Thông tin báo giá</h3>

        <div className="ia-form-grid">
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
            label="Ngày phát hành"
            required
          >
            <input
              type="date"
              value={form.issueDate}
              onChange={(event) =>
                update(
                  'issueDate',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Ngày hết hiệu lực">
            <input
              type="date"
              value={form.expiryDate}
              onChange={(event) =>
                update(
                  'expiryDate',
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
        </div>
      </section>

      <section className="ia-form-section">
        <div className="ia-section-row">
          <h3>Hạng mục báo giá</h3>

          <button
            type="button"
            className="ia-small-button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                items: [
                  ...current.items,
                  createQuotationItem(),
                ],
              }))
            }
          >
            Thêm hạng mục
          </button>
        </div>

        <div className="ia-item-list">
          {form.items.map(
            (item, index) => (
              <article
                className="ia-item-card"
                key={index}
              >
                <span>
                  {index + 1}
                </span>

                <div className="ia-form-grid">
                  <Field
                    label="Tên hạng mục"
                    required
                  >
                    <input
                      value={item.name}
                      onChange={(event) =>
                        updateItem(
                          index,
                          'name',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Đơn vị">
                    <input
                      value={item.unit}
                      onChange={(event) =>
                        updateItem(
                          index,
                          'unit',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Số lượng">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(
                          index,
                          'quantity',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Đơn giá">
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(event) =>
                        updateItem(
                          index,
                          'unitPrice',
                          event.target.value,
                        )
                      }
                    />
                  </Field>

                  <Field label="Loại chi phí">
                    <select
                      value={item.costType}
                      onChange={(event) =>
                        updateItem(
                          index,
                          'costType',
                          event.target.value,
                        )
                      }
                    >
                      <option value="Một lần">
                        Một lần
                      </option>
                      <option value="Hàng tháng">
                        Hàng tháng
                      </option>
                      <option value="Hàng năm">
                        Hàng năm
                      </option>
                    </select>
                  </Field>

                  <Field
                    label="Mô tả"
                    full
                  >
                    <textarea
                      value={
                        item.description
                      }
                      onChange={(event) =>
                        updateItem(
                          index,
                          'description',
                          event.target.value,
                        )
                      }
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  className="ia-remove-button"
                  disabled={
                    form.items.length ===
                    1
                  }
                  onClick={() =>
                    setForm(
                      (current) => ({
                        ...current,
                        items:
                          current.items.filter(
                            (
                              _,
                              itemIndex,
                            ) =>
                              itemIndex !==
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
      </section>

      <section className="ia-form-section">
        <div className="ia-form-grid">
          <Field label="Giảm giá">
            <input
              type="number"
              min="0"
              value={form.discount}
              onChange={(event) =>
                update(
                  'discount',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Thuế suất (%)">
            <input
              type="number"
              min="0"
              max="100"
              value={form.taxRate}
              onChange={(event) =>
                update(
                  'taxRate',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Đặt cọc (%)">
            <input
              type="number"
              min="0"
              max="100"
              value={
                form.depositPercent
              }
              onChange={(event) =>
                update(
                  'depositPercent',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field
            label="Ghi chú"
            full
          >
            <textarea
              value={form.notes}
              onChange={(event) =>
                update(
                  'notes',
                  event.target.value,
                )
              }
            />
          </Field>
        </div>

        <div className="ia-total-grid">
          {[
            [
              'Tạm tính',
              totals.subtotal,
            ],
            [
              'Giảm giá',
              discount,
            ],
            ['Thuế', tax],
            [
              'Tổng thanh toán',
              total,
            ],
            [
              'Đặt cọc',
              total *
                ((Number(
                  form.depositPercent,
                ) || 0) /
                  100),
            ],
            [
              'Còn lại',
              total -
                total *
                  ((Number(
                    form.depositPercent,
                  ) || 0) /
                    100),
            ],
          ].map(
            ([
              label,
              value,
            ]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>
                  {formatMoney(
                    value,
                    form.currency,
                  )}
                </strong>
              </div>
            ),
          )}
        </div>
      </section>
    </>
  );
};

export default QuotationForm;
