import React, {
  useEffect,
  useState,
} from 'react';

import {
  Building2,
  FileText,
  FolderKanban,
  ReceiptText,
  RefreshCw,
  Users,
} from 'lucide-react';

import {
  listContracts,
  listCustomers,
  listLeads,
  listProjects,
  listQuotations,
} from '../adminApi';

import {
  Alert,
  EmptyState,
  ProgressBar,
  StatusBadge,
  SummaryCard,
  formatMoney,
  formatValue,
  getErrorMessage,
} from '../../../components/Admin';

import './DashboardPage.css';

const DashboardPage = ({
  onNavigate,
  onUnauthorized,
}) => {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    data,
    setData,
  ] = useState({
    leads: [],
    customers: [],
    projects: [],
    quotations: [],
    contracts: [],
    stats: {},
  });

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        leads,
        customers,
        projects,
        quotations,
        contracts,
      ] = await Promise.all([
        listLeads({
          pageSize: 20,
        }),
        listCustomers({
          pageSize: 20,
        }),
        listProjects({
          pageSize: 20,
        }),
        listQuotations({
          pageSize: 20,
        }),
        listContracts({
          pageSize: 20,
        }),
      ]);

      setData({
        leads:
          leads.leads || [],
        customers:
          customers.customers || [],
        projects:
          projects.projects || [],
        quotations:
          quotations.quotations || [],
        contracts:
          contracts.contracts || [],
        stats: {
          leads:
            leads.stats || {},
          customers:
            customers.stats || {},
          projects:
            projects.stats || {},
          quotations:
            quotations.stats || {},
          contracts:
            contracts.stats || {},
        },
      });
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

  const cards = [
    {
      key: 'leads',
      label: 'Leads',
      value:
        data.stats.leads?.total ??
        data.leads.length,
      note:
        `${data.stats.leads?.notContacted ?? 0} chưa liên hệ`,
      icon: Users,
    },
    {
      key: 'customers',
      label: 'Customers',
      value:
        data.stats.customers?.total ??
        data.customers.length,
      note:
        `${data.stats.customers?.businesses ?? 0} doanh nghiệp`,
      icon: Building2,
    },
    {
      key: 'projects',
      label: 'Projects',
      value:
        data.stats.projects?.total ??
        data.projects.length,
      note:
        `${data.stats.projects?.active ?? 0} đang thực hiện`,
      icon: FolderKanban,
    },
    {
      key: 'quotations',
      label: 'Quotations',
      value:
        data.stats.quotations?.total ??
        data.quotations.length,
      note:
        formatMoney(
          data.stats.quotations?.totalValue ??
            0,
        ),
      icon: ReceiptText,
    },
    {
      key: 'contracts',
      label: 'Contracts',
      value:
        data.stats.contracts?.total ??
        data.contracts.length,
      note:
        formatMoney(
          data.stats.contracts?.activeValue ??
            0,
        ),
      icon: FileText,
    },
  ];

  return (
    <section>
      <header className="ia-page-header">
        <div>
          <span className="ia-eyebrow">
            IMPAKT Workspace
          </span>

          <h1>
            Tổng quan vận hành
          </h1>

          <p>
            Theo dõi nhanh khách hàng,
            dự án, báo giá và hợp đồng
            của IMPAKT Studio.
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

      <div className="ia-dashboard-cards">
        {cards.map(
          (card) => (
            <SummaryCard
              {...card}
              key={card.key}
              onClick={() =>
                onNavigate(
                  card.key,
                )
              }
            />
          ),
        )}
      </div>

      <div className="ia-dashboard-columns">
        <section className="ia-panel">
          <div className="ia-module-heading">
            <div>
              <small>
                Hoạt động mới
              </small>
              <h2>
                Leads gần nhất
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'leads',
                )
              }
            >
              Xem tất cả
            </button>
          </div>

          <div className="ia-dashboard-list">
            {data.leads
              .slice(0, 5)
              .map(
                (lead) => (
                  <article
                    key={
                      lead.submissionId
                    }
                  >
                    <span className="ia-avatar">
                      {String(
                        lead.name || 'I',
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div>
                      <strong>
                        {formatValue(
                          lead.name,
                        )}
                      </strong>
                      <small>
                        {formatValue(
                          lead.projectTypeLabel ||
                            lead.projectType,
                        )}
                      </small>
                    </div>

                    <StatusBadge
                      status={
                        lead.status ===
                        'Đã liên hệ'
                          ? 'Đã liên hệ'
                          : 'Chưa liên hệ'
                      }
                    />
                  </article>
                ),
              )}

            {!loading &&
              !data.leads.length && (
                <EmptyState
                  title="Chưa có Lead"
                  description="Lead từ website sẽ hiển thị tại đây."
                />
              )}
          </div>
        </section>

        <section className="ia-panel">
          <div className="ia-module-heading">
            <div>
              <small>
                Tiến độ
              </small>
              <h2>
                Dự án đang chạy
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'projects',
                )
              }
            >
              Xem tất cả
            </button>
          </div>

          <div className="ia-dashboard-list">
            {data.projects
              .filter(
                (project) =>
                  project.status ===
                  'Đang thực hiện',
              )
              .slice(0, 5)
              .map(
                (project) => (
                  <article
                    key={
                      project.projectId
                    }
                  >
                    <div>
                      <strong>
                        {formatValue(
                          project.projectName,
                        )}
                      </strong>
                      <small>
                        {formatValue(
                          project.customerName,
                        )}
                      </small>
                    </div>

                    <ProgressBar
                      value={
                        project.progress
                      }
                    />
                  </article>
                ),
              )}

            {!loading &&
              !data.projects.some(
                (project) =>
                  project.status ===
                  'Đang thực hiện',
              ) && (
                <EmptyState
                  title="Chưa có dự án đang chạy"
                  description="Dự án ở trạng thái Đang thực hiện sẽ hiển thị tại đây."
                />
              )}
          </div>
        </section>
      </div>
    </section>
  );
};

export default DashboardPage;
