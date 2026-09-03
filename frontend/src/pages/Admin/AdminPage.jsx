import React, {
  useEffect,
  useState,
} from 'react';

import {
  Building2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  AdminSidebar,
  AdminTopbar,
  Alert,
  Field,
  getErrorMessage,
} from '../../components/Admin';

import {
  getSession,
  login,
  logout,
} from './adminApi';

import DashboardPage
  from './Dashboard/DashboardPage';

import LeadsPage
  from './Leads/LeadsPage';

import CustomersPage
  from './Customers/CustomersPage';

import ProjectsPage
  from './Projects/ProjectsPage';

import QuotationsPage
  from './Quotations/QuotationsPage';

import ContractsPage
  from './Contracts/ContractsPage';

import './AdminPage.css';

const MODULES = [
  {
    key: 'dashboard',
    label: 'Tổng quan',
    icon: LayoutDashboard,
  },
  {
    key: 'leads',
    label: 'Leads',
    icon: Users,
  },
  {
    key: 'customers',
    label: 'Customers',
    icon: Building2,
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: FolderKanban,
  },
  {
    key: 'quotations',
    label: 'Quotations',
    icon: ReceiptText,
  },
  {
    key: 'contracts',
    label: 'Contracts',
    icon: FileText,
  },
];

const AdminPage = () => {
  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);

  const [
    authenticated,
    setAuthenticated,
  ] = useState(false);

  const [
    username,
    setUsername,
  ] = useState('');

  const [
    activeModule,
    setActiveModule,
  ] = useState('dashboard');

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    loginForm,
    setLoginForm,
  ] = useState({
    username: '',
    password: '',
  });

  const [
    loginLoading,
    setLoginLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const logoutLocally = () => {
    setAuthenticated(false);
    setUsername('');
    setError('');
    setSidebarOpen(false);
  };

  useEffect(() => {
    const run = async () => {
      try {
        const result =
          await getSession();

        setAuthenticated(
          Boolean(
            result.authenticated,
          ),
        );

        setUsername(
          result.user?.username ||
            '',
        );
      } catch {
        setAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    run();
  }, []);

  const handleLogin = async (
    event,
  ) => {
    event.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      const result =
        await login(
          loginForm,
        );

      setAuthenticated(true);

      setUsername(
        result.user?.username ||
          loginForm.username,
      );

      setLoginForm({
        username: '',
        password: '',
      });
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError.message,
        ),
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Local session is cleared below.
    }

    logoutLocally();
  };

  const navigate = (
    moduleKey,
  ) => {
    setActiveModule(
      moduleKey,
    );
    setSidebarOpen(false);
  };

  const currentTitle =
    MODULES.find(
      (module) =>
        module.key ===
        activeModule,
    )?.label ||
    'Admin';

  if (authLoading) {
    return (
      <main className="ia-page ia-center-state">
        <RefreshCw
          className="ia-spin"
          size={27}
        />
        <p>
          Đang kiểm tra phiên đăng nhập…
        </p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="ia-page ia-login-page">
        <form
          className="ia-login-card"
          onSubmit={handleLogin}
        >
          <div className="ia-login-brand">
            <span className="ia-brand-mark">
              I
            </span>

            <div>
              <strong>
                IMPAKT Admin
              </strong>
              <small>
                Smart Design.
                Real Impact.
              </small>
            </div>
          </div>

          <div className="ia-login-heading">
            <span>
              <ShieldCheck
                size={17}
              />
              Khu vực nội bộ
            </span>

            <h1>
              Đăng nhập quản trị
            </h1>

            <p>
              Quản lý khách hàng,
              dự án, báo giá và
              hợp đồng trên cùng
              một hệ thống.
            </p>
          </div>

          <div className="ia-login-fields">
            <Field
              label="Tên đăng nhập"
              required
            >
              <input
                autoComplete="username"
                value={
                  loginForm.username
                }
                onChange={(event) =>
                  setLoginForm(
                    (current) => ({
                      ...current,
                      username:
                        event.target.value,
                    }),
                  )
                }
              />
            </Field>

            <Field
              label="Mật khẩu"
              required
            >
              <input
                type="password"
                autoComplete="current-password"
                value={
                  loginForm.password
                }
                onChange={(event) =>
                  setLoginForm(
                    (current) => ({
                      ...current,
                      password:
                        event.target.value,
                    }),
                  )
                }
              />
            </Field>
          </div>

          <Alert
            message={error}
          />

          <button
            type="submit"
            className="ia-primary-button"
            disabled={loginLoading}
          >
            {loginLoading ? (
              <RefreshCw
                className="ia-spin"
                size={17}
              />
            ) : (
              <ShieldCheck
                size={17}
              />
            )}

            {loginLoading
              ? 'Đang đăng nhập…'
              : 'Đăng nhập'}
          </button>
        </form>
      </main>
    );
  }

  const pageProps = {
    onUnauthorized:
      logoutLocally,
  };

  return (
    <main className="ia-page">
      <AdminSidebar
        items={MODULES}
        activeKey={activeModule}
        username={username}
        open={sidebarOpen}
        onNavigate={navigate}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <section className="ia-main">
        <AdminTopbar
          title={currentTitle}
          onMenu={() =>
            setSidebarOpen(
              (current) =>
                !current,
            )
          }
          onLogout={handleLogout}
        />

        <section className="ia-content">
          {activeModule ===
            'dashboard' && (
            <DashboardPage
              {...pageProps}
              onNavigate={navigate}
            />
          )}

          {activeModule ===
            'leads' && (
            <LeadsPage
              {...pageProps}
            />
          )}

          {activeModule ===
            'customers' && (
            <CustomersPage
              {...pageProps}
            />
          )}

          {activeModule ===
            'projects' && (
            <ProjectsPage
              {...pageProps}
            />
          )}

          {activeModule ===
            'quotations' && (
            <QuotationsPage
              {...pageProps}
            />
          )}

          {activeModule ===
            'contracts' && (
            <ContractsPage
              {...pageProps}
            />
          )}
        </section>
      </section>
    </main>
  );
};

export default AdminPage;
