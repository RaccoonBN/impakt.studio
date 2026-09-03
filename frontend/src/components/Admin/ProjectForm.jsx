import React from 'react';

import {
  Field,
} from './AdminUI';

import {
  PROJECT_PHASES,
  PROJECT_STATUSES,
  getCustomerName,
} from './adminConfig';

import './ProjectForm.css';

const ProjectForm = ({
  form,
  setForm,
  customers,
}) => {
  const update = (
    field,
    value,
  ) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  return (
    <div className="ia-form-grid">
      <Field
        label="Khách hàng"
        required
      >
        <select
          value={form.customerId}
          onChange={(event) =>
            update(
              'customerId',
              event.target.value,
            )
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

      <Field
        label="Tên dự án"
        required
      >
        <input
          value={form.projectName}
          onChange={(event) =>
            update(
              'projectName',
              event.target.value,
            )
          }
        />
      </Field>

      <Field label="Loại dự án">
        <input
          value={form.projectType}
          onChange={(event) =>
            update(
              'projectType',
              event.target.value,
            )
          }
        />
      </Field>

      <Field label="Người phụ trách">
        <input
          value={form.manager}
          onChange={(event) =>
            update(
              'manager',
              event.target.value,
            )
          }
        />
      </Field>

      <Field label="Ngày bắt đầu">
        <input
          type="date"
          value={form.startDate}
          onChange={(event) =>
            update(
              'startDate',
              event.target.value,
            )
          }
        />
      </Field>

      <Field label="Ngày hoàn thành dự kiến">
        <input
          type="date"
          value={
            form.expectedEndDate
          }
          onChange={(event) =>
            update(
              'expectedEndDate',
              event.target.value,
            )
          }
        />
      </Field>

      <Field label="Giai đoạn">
        <select
          value={form.phase}
          onChange={(event) =>
            update(
              'phase',
              event.target.value,
            )
          }
        >
          {PROJECT_PHASES.map(
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
          value={form.status}
          onChange={(event) =>
            update(
              'status',
              event.target.value,
            )
          }
        >
          {PROJECT_STATUSES.map(
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
        label={`Tiến độ: ${form.progress}%`}
        full
      >
        <input
          type="range"
          min="0"
          max="100"
          value={form.progress}
          onChange={(event) =>
            update(
              'progress',
              event.target.value,
            )
          }
        />
      </Field>

      <Field label="Website">
        <input
          value={form.websiteUrl}
          onChange={(event) =>
            update(
              'websiteUrl',
              event.target.value,
            )
          }
        />
      </Field>

      <Field label="Trang quản trị">
        <input
          value={form.adminUrl}
          onChange={(event) =>
            update(
              'adminUrl',
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
  );
};

export default ProjectForm;
