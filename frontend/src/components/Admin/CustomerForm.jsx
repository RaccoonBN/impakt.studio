import React from 'react';

import {
  Field,
} from './AdminUI';

import {
  CUSTOMER_SOURCES,
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  getCustomerName,
} from './adminConfig';

import './CustomerForm.css';

const CustomerForm = ({
  form,
  setForm,
  nested = false,
  compact = false,
}) => {
  const data =
    nested
      ? form.customer
      : form;

  const update = (
    field,
    value,
  ) => {
    if (nested) {
      setForm((current) => ({
        ...current,
        customer: {
          ...current.customer,
          [field]: value,
        },
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="ia-form-grid">
      <Field
        label="Loại khách hàng"
        required
      >
        <select
          value={data.customerType}
          onChange={(event) =>
            update(
              'customerType',
              event.target.value,
            )
          }
        >
          {CUSTOMER_TYPES.map(
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

      {data.customerType ===
      'Doanh nghiệp' ? (
        <>
          <Field
            label="Tên doanh nghiệp"
            required
          >
            <input
              value={data.companyName}
              onChange={(event) =>
                update(
                  'companyName',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Người đại diện">
            <input
              value={
                data.representativeName
              }
              onChange={(event) =>
                update(
                  'representativeName',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Chức vụ">
            <input
              value={
                data.representativeTitle
              }
              onChange={(event) =>
                update(
                  'representativeTitle',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Mã số thuế">
            <input
              value={data.taxCode}
              onChange={(event) =>
                update(
                  'taxCode',
                  event.target.value,
                )
              }
            />
          </Field>
        </>
      ) : (
        <>
          <Field
            label="Họ và tên"
            required
          >
            <input
              value={data.fullName}
              onChange={(event) =>
                update(
                  'fullName',
                  event.target.value,
                )
              }
            />
          </Field>

          {!compact && (
            <Field label="CCCD / Hộ chiếu">
              <input
                value={
                  data.identityNumber
                }
                onChange={(event) =>
                  update(
                    'identityNumber',
                    event.target.value,
                  )
                }
              />
            </Field>
          )}
        </>
      )}

      <Field
        label="Số điện thoại"
        required
      >
        <input
          value={data.phone}
          onChange={(event) =>
            update(
              'phone',
              event.target.value,
            )
          }
        />
      </Field>

      <Field label="Email">
        <input
          type="email"
          value={data.email}
          onChange={(event) =>
            update(
              'email',
              event.target.value,
            )
          }
        />
      </Field>

      <Field label="Nguồn khách hàng">
        <select
          value={data.source}
          onChange={(event) =>
            update(
              'source',
              event.target.value,
            )
          }
        >
          {CUSTOMER_SOURCES.map(
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

      <Field label="Trạng thái">
        <select
          value={data.status}
          onChange={(event) =>
            update(
              'status',
              event.target.value,
            )
          }
        >
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
      </Field>

      <Field
        label="Địa chỉ"
        full
      >
        <input
          value={data.address}
          onChange={(event) =>
            update(
              'address',
              event.target.value,
            )
          }
        />
      </Field>

      {!compact && (
        <>
          <Field label="Ngân hàng">
            <input
              value={data.bankName}
              onChange={(event) =>
                update(
                  'bankName',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Số tài khoản">
            <input
              value={
                data.bankAccountNumber
              }
              onChange={(event) =>
                update(
                  'bankAccountNumber',
                  event.target.value,
                )
              }
            />
          </Field>

          <Field label="Chủ tài khoản">
            <input
              value={
                data.bankAccountName
              }
              onChange={(event) =>
                update(
                  'bankAccountName',
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
              value={data.notes}
              onChange={(event) =>
                update(
                  'notes',
                  event.target.value,
                )
              }
            />
          </Field>
        </>
      )}
    </div>
  );
};

const CustomerSelector = ({
  form,
  setForm,
  customers,
  isEdit = false,
}) => (
  <div>
    <div className="ia-segmented-control">
      <button
        type="button"
        className={
          form.customerMode ===
          'existing'
            ? 'is-active'
            : ''
        }
        onClick={() =>
          setForm((current) => ({
            ...current,
            customerMode:
              'existing',
          }))
        }
      >
        Khách có sẵn
      </button>

      <button
        type="button"
        disabled={isEdit}
        className={
          form.customerMode ===
          'new'
            ? 'is-active'
            : ''
        }
        onClick={() =>
          setForm((current) => ({
            ...current,
            customerMode: 'new',
          }))
        }
      >
        Nhập khách mới
      </button>
    </div>

    {form.customerMode ===
    'new' ? (
      <CustomerForm
        form={form}
        setForm={setForm}
        nested
        compact
      />
    ) : (
      <div className="ia-form-grid">
        <Field
          label="Khách hàng"
          required
          full
        >
          <select
            value={form.customerId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                customerId:
                  event.target.value,
                projectId: '',
                quotationId: '',
              }))
            }
          >
            <option value="">
              Chọn khách hàng
            </option>

            {customers.map(
              (customer) => (
                <option
                  value={
                    customer.customerId
                  }
                  key={
                    customer.customerId
                  }
                >
                  {getCustomerName(
                    customer,
                  )}
                </option>
              ),
            )}
          </select>
        </Field>
      </div>
    )}
  </div>
);

export {
  CustomerSelector,
};

export default CustomerForm;
