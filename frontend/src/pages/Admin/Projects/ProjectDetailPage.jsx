import React, {
  useEffect,
  useState,
} from 'react';

import {
  CalendarDays,
  Clock3,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

import {
  getProject,
} from '../adminApi';

import {
  Alert,
  AdminModal,
  ProgressBar,
  StatusBadge,
  formatDate,
  formatValue,
  getErrorMessage,
} from '../../../components/Admin';

import './ProjectDetailPage.css';

const ProjectDetailPage = ({
  project,
  onClose,
  onUnauthorized,
}) => {
  const [
    detail,
    setDetail,
  ] = useState(project);

  const [
    timeline,
    setTimeline,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const result =
          await getProject(
            project.projectId,
          );

        setDetail(
          result.project ||
            project,
        );

        setTimeline(
          result.timeline || [],
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

    load();
  }, [project.projectId]);

  return (
    <AdminModal
      wide
      eyebrow="Project Detail"
      title={formatValue(
        detail.projectName,
      )}
      onClose={onClose}
    >
      <Alert message={error} />

      <div className="ia-project-detail-grid">
        {[
          [
            'Mã dự án',
            detail.projectId,
          ],
          [
            'Khách hàng',
            detail.customerName,
          ],
          [
            'Loại dự án',
            detail.projectType,
          ],
          [
            'Người phụ trách',
            detail.manager,
          ],
          [
            'Ngày bắt đầu',
            formatDate(
              detail.startDate,
            ),
          ],
          [
            'Ngày hoàn thành dự kiến',
            formatDate(
              detail.expectedEndDate,
            ),
          ],
          [
            'Giai đoạn',
            detail.phase,
          ],
          [
            'Trạng thái',
            detail.status,
          ],
        ].map(
          ([
            label,
            value,
          ]) => (
            <article key={label}>
              <small>{label}</small>
              <strong>
                {formatValue(
                  value,
                )}
              </strong>
            </article>
          ),
        )}
      </div>

      <section className="ia-project-progress-card">
        <div>
          <small>
            Tiến độ hiện tại
          </small>

          <strong>
            {Number(
              detail.progress,
            ) || 0}
            %
          </strong>
        </div>

        <ProgressBar
          value={detail.progress}
        />
      </section>

      {(detail.websiteUrl ||
        detail.adminUrl) && (
        <div className="ia-project-links">
          {detail.websiteUrl && (
            <a
              href={
                detail.websiteUrl
              }
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink
                size={16}
              />
              Website
            </a>
          )}

          {detail.adminUrl && (
            <a
              href={
                detail.adminUrl
              }
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink
                size={16}
              />
              Trang quản trị
            </a>
          )}
        </div>
      )}

      <section className="ia-project-timeline">
        <header>
          <div>
            <span>
              <Clock3 size={17} />
            </span>

            <div>
              <strong>
                Lịch sử cập nhật
              </strong>
              <small>
                Các thay đổi tiến độ
                của dự án.
              </small>
            </div>
          </div>

          {loading && (
            <RefreshCw
              className="ia-spin"
              size={17}
            />
          )}
        </header>

        {!loading &&
          !timeline.length && (
            <p className="ia-project-empty">
              Chưa có lịch sử cập nhật.
            </p>
          )}

        {timeline.map(
          (item) => (
            <article
              key={
                item.timelineId ||
                item.createdAt
              }
            >
              <span>
                <CalendarDays
                  size={16}
                />
              </span>

              <div>
                <strong>
                  {formatValue(
                    item.content,
                  )}
                </strong>

                <small>
                  {formatDate(
                    item.createdAt,
                  )}
                  {' • '}
                  {formatValue(
                    item.actor,
                    'Admin',
                  )}
                </small>
              </div>

              <div className="ia-project-timeline-status">
                {item.phase && (
                  <span>
                    {item.phase}
                  </span>
                )}

                {item.status && (
                  <StatusBadge
                    status={
                      item.status
                    }
                  />
                )}
              </div>
            </article>
          ),
        )}
      </section>

      {detail.notes && (
        <section className="ia-project-notes">
          <small>Ghi chú</small>
          <p>{detail.notes}</p>
        </section>
      )}

      <footer className="ia-modal-footer">
        <button
          type="button"
          className="ia-secondary-button"
          onClick={onClose}
        >
          Đóng
        </button>
      </footer>
    </AdminModal>
  );
};

export default ProjectDetailPage;
