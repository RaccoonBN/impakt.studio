const DEFAULT_HEADERS = {
  Accept: 'application/json',
};

export const apiRequest = async (
  url,
  options = {},
) => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.body
        ? {
            'Content-Type':
              'application/json',
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  let result = {};

  try {
    result =
      await response.json();
  } catch {
    result = {};
  }

  if (
    response.status === 401 ||
    result?.message ===
      'UNAUTHORIZED'
  ) {
    const error =
      new Error('UNAUTHORIZED');

    error.status = 401;
    throw error;
  }

  if (
    !response.ok ||
    result?.success === false
  ) {
    const error =
      new Error(
        result?.message ||
          `HTTP_${response.status}`,
      );

    error.status =
      response.status;

    error.details =
      result?.details;

    throw error;
  }

  return result;
};

export const getSession = () =>
  apiRequest(
    '/api/admin/session',
  );

export const login = (
  credentials,
) =>
  apiRequest(
    '/api/admin/session',
    {
      method: 'POST',
      body: JSON.stringify(
        credentials,
      ),
    },
  );

export const logout = () =>
  apiRequest(
    '/api/admin/session',
    {
      method: 'DELETE',
    },
  );

export const buildQuery = (
  params = {},
) => {
  const query =
    new URLSearchParams();

  Object.entries(params)
    .forEach(
      ([
        key,
        value,
      ]) => {
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          value === 'Tất cả'
        ) {
          return;
        }

        query.set(
          key,
          String(value),
        );
      },
    );

  const string =
    query.toString();

  return string
    ? `?${string}`
    : '';
};

export const listLeads = (
  params = {},
) =>
  apiRequest(
    `/api/admin/leads${buildQuery(
      params,
    )}`,
  );

export const updateLead = (
  payload,
) =>
  apiRequest(
    '/api/admin/leads',
    {
      method: 'PATCH',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const listCustomers = (
  params = {},
) =>
  apiRequest(
    `/api/admin/customers${buildQuery(
      params,
    )}`,
  );

export const createCustomer = (
  payload,
) =>
  apiRequest(
    '/api/admin/customers',
    {
      method: 'POST',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const updateCustomer = (
  payload,
) =>
  apiRequest(
    '/api/admin/customers',
    {
      method: 'PATCH',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const deleteCustomer = (
  payload,
) =>
  apiRequest(
    '/api/admin/customers',
    {
      method: 'DELETE',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const listProjects = (
  params = {},
) =>
  apiRequest(
    `/api/admin/projects${buildQuery(
      params,
    )}`,
  );

export const getProject = (
  projectId,
) =>
  apiRequest(
    `/api/admin/projects${buildQuery({
      projectId,
    })}`,
  );

export const createProject = (
  payload,
) =>
  apiRequest(
    '/api/admin/projects',
    {
      method: 'POST',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const updateProject = (
  payload,
) =>
  apiRequest(
    '/api/admin/projects',
    {
      method: 'PATCH',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const addProjectTimeline = (
  payload,
) =>
  apiRequest(
    '/api/admin/projects',
    {
      method: 'POST',
      body: JSON.stringify({
        operation: 'timeline',
        ...payload,
      }),
    },
  );

export const deleteProject = (
  payload,
) =>
  apiRequest(
    '/api/admin/projects',
    {
      method: 'DELETE',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const listQuotations = (
  params = {},
) =>
  apiRequest(
    `/api/admin/quotations${buildQuery(
      params,
    )}`,
  );

export const createQuotation = (
  payload,
) =>
  apiRequest(
    '/api/admin/quotations',
    {
      method: 'POST',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const updateQuotation = (
  payload,
) =>
  apiRequest(
    '/api/admin/quotations',
    {
      method: 'PATCH',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const deleteQuotation = (
  payload,
) =>
  apiRequest(
    '/api/admin/quotations',
    {
      method: 'DELETE',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const listContracts = (
  params = {},
) =>
  apiRequest(
    `/api/admin/contracts${buildQuery(
      params,
    )}`,
  );

export const createContract = (
  payload,
) =>
  apiRequest(
    '/api/admin/contracts',
    {
      method: 'POST',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const updateContract = (
  payload,
) =>
  apiRequest(
    '/api/admin/contracts',
    {
      method: 'PATCH',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const deleteContract = (
  payload,
) =>
  apiRequest(
    '/api/admin/contracts',
    {
      method: 'DELETE',
      body: JSON.stringify(
        payload,
      ),
    },
  );

export const openDocument = (
  type,
  id,
  mode = 'preview',
) => {
  const query =
    new URLSearchParams({
      type,
      id,
      mode,
    });

  window.open(
    `/api/admin/export?${query.toString()}`,
    '_blank',
    'noopener,noreferrer',
  );
};
