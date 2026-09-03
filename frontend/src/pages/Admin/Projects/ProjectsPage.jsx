import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Activity,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

import {
  addProjectTimeline,
  createProject,
  deleteProject,
  listCustomers,
  listProjects,
  updateProject,
} from '../adminApi';

import {
  Alert,
  ConfirmDialog,
  EmptyState,
  Field,
  FormFooter,
  AdminModal,
  PROJECT_PHASES,
  PROJECT_STATUSES,
  ProgressBar,
  ProjectForm,
  StatusBadge,
  createProjectForm,
  formatDate,
  formatValue,
  getCustomerName,
  getErrorMessage,
} from '../../../components/Admin';

import ProjectDetailPage
  from './ProjectDetailPage';

import './ProjectsPage.css';

const ProjectsPage = ({
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
        projectsResult,
        customersResult,
      ] = await Promise.all([
        listProjects({
          pageSize: 100,
        }),
        listCustomers({
          pageSize: 100,
        }),
      ]);

      setItems(
        projectsResult.projects ||
          [],
      );

      setCustomers(
        customersResult.customers ||
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
        (project) => {
          if (
            status !==
              'Tất cả' &&
            project.status !==
              status
          ) {
            return false;
          }

          const content = [
            project.projectId,
            project.projectName,
            project.projectType,
            project.customerName,
            project.phase,
            project.status,
            project.manager,
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
      createProjectForm(),
    );
  };

  const openEdit = (
    project,
  ) => {
    setModal({
      mode: 'edit',
      record: project,
    });

    setForm(
      createProjectForm({
        ...project,
        progress:
          Number(
            project.progress,
          ) || 0,
      }),
    );
  };

  const openTimeline = (
    project,
  ) => {
    setModal({
      mode: 'timeline',
      record: project,
    });

    setForm({
      projectId:
        project.projectId,
      content: '',
      phase:
        project.phase ||
        PROJECT_PHASES[0],
      status:
        project.status ||
        'Đang thực hiện',
      progress:
        Number(
          project.progress,
        ) || 0,
    });
  };

  const saveProject = async () => {
    setSaving(true);
    setFormError('');

    try {
      const payload = {
        ...form,
        progress:
          Number(
            form.progress,
          ) || 0,
      };

      if (
        modal.mode ===
        'edit'
      ) {
        await updateProject({
          ...payload,
          projectId:
            modal.record
              .projectId,
        });
      } else {
        await createProject(
          payload,
        );
      }

      setSuccess(
        modal.mode === 'edit'
          ? 'Đã cập nhật Project.'
          : 'Đã tạo Project mới.',
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

  const saveTimeline = async () => {
    setSaving(true);
    setFormError('');

    try {
      await addProjectTimeline({
        ...form,
        progress:
          Number(
            form.progress,
          ) || 0,
      });

      setSuccess(
        'Đã thêm cập nhật tiến độ.',
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
      await deleteProject({
        projectId:
          deleteTarget.projectId,
        reason,
      });

      setSuccess(
        'Đã xóa mềm Project.',
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
            Project Management
          </span>

          <h1>
            Quản lý dự án
          </h1>

          <p>
            Theo dõi giai đoạn,
            tiến độ và lịch sử
            cập nhật của từng dự án.
          </p>
        </div>

        <button
          type="button"
          className="ia-primary-button"
          onClick={openCreate}
        >
          <Plus size={17} />
          Tạo Project
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
              placeholder="Tìm dự án…"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </label>

          <div className="ia-project-toolbar">
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
              title="Chưa có Project"
              description="Tạo dự án mới và liên kết với Customer."
              action={
                <button
                  type="button"
                  className="ia-primary-button"
                  onClick={openCreate}
                >
                  <Plus size={17} />
                  Tạo Project
                </button>
              }
            />
          )}

        {filtered.length > 0 && (
          <div className="ia-table-wrap">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Dự án</th>
                  <th>Khách hàng</th>
                  <th>Giai đoạn</th>
                  <th>Tiến độ</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (project) => (
                    <tr
                      key={
                        project.projectId
                      }
                    >
                      <td>
                        <strong>
                          {formatValue(
                            project.projectName,
                          )}
                        </strong>

                        <small>
                          {
                            project.projectId
                          }
                        </small>
                      </td>

                      <td>
                        {formatValue(
                          project.customerName,
                        )}
                      </td>

                      <td>
                        {formatValue(
                          project.phase,
                        )}
                      </td>

                      <td>
                        <ProgressBar
                          value={
                            project.progress
                          }
                        />
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            project.status
                          }
                        />
                      </td>

                      <td>
                        <div className="ia-row-actions">
                          <button
                            type="button"
                            title="Cập nhật tiến độ"
                            onClick={() =>
                              openTimeline(
                                project,
                              )
                            }
                          >
                            <Activity
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            title="Xem chi tiết"
                            onClick={() =>
                              setModal({
                                mode: 'view',
                                record:
                                  project,
                              })
                            }
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            title="Chỉnh sửa"
                            onClick={() =>
                              openEdit(
                                project,
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
                                project,
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
          <ProjectDetailPage
            project={
              modal.record
            }
            onClose={closeModal}
            onUnauthorized={
              onUnauthorized
            }
          />
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
            eyebrow="Project"
            title={
              modal.mode ===
              'edit'
                ? 'Chỉnh sửa Project'
                : 'Tạo Project mới'
            }
            onClose={closeModal}
          >
            <ProjectForm
              form={form}
              setForm={setForm}
              customers={customers}
            />

            <Alert
              message={formError}
            />

            <FormFooter
              saving={saving}
              onCancel={closeModal}
              onSave={saveProject}
            />
          </AdminModal>
        )}

      {modal?.mode ===
        'timeline' &&
        form && (
          <AdminModal
            eyebrow="Project Timeline"
            title="Cập nhật tiến độ"
            onClose={closeModal}
          >
            <div className="ia-form-grid">
              <Field
                label="Nội dung cập nhật"
                required
                full
              >
                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        content:
                          event.target.value,
                      }),
                    )
                  }
                />
              </Field>

              <Field label="Giai đoạn">
                <select
                  value={form.phase}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        phase:
                          event.target.value,
                      }),
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
                    setForm(
                      (current) => ({
                        ...current,
                        status:
                          event.target.value,
                      }),
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
                    setForm(
                      (current) => ({
                        ...current,
                        progress:
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
              onCancel={closeModal}
              onSave={saveTimeline}
            />
          </AdminModal>
        )}
      <ConfirmDialog
        open={Boolean(
          deleteTarget,
        )}
        title="Xóa Project?"
        message={
          deleteTarget
            ? `Dữ liệu "${deleteTarget.projectName || deleteTarget.projectId}" sẽ được xóa mềm và không còn xuất hiện trong danh sách mặc định.`
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

export default ProjectsPage;
