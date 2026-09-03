import {
  ApiError,
  assertAllowedOrigin,
  getClientIp,
  getHeader,
  logApiError,
  methodNotAllowed,
  parseCommaSeparatedList,
  readJsonBody,
  sendError,
  sendSuccess,
  setNoStore,
} from '../_lib/http.js';

import {
  requireAdmin,
} from '../_lib/adminAuth.js';

import {
  PROJECT_PHASES,
  PROJECT_STATUSES,
  cleanEnum,
  cleanId,
  cleanNumber,
  cleanText,
  validatePagination,
  validateProject,
} from '../_lib/validation.js';

import {
  callAppsScript,
} from '../_lib/appsScript.js';

const MUTATION_BODY_LIMIT_BYTES =
  32 * 1024;

const PROJECT_OPERATIONS =
  Object.freeze([
    'create',
    'timeline',
  ]);

const normalizeEnvironmentUrl = (
  value,
) => {
  const text = String(
    value || '',
  ).trim();

  if (!text) {
    return '';
  }

  if (
    text.startsWith('http://') ||
    text.startsWith('https://')
  ) {
    return text;
  }

  return `https://${text}`;
};

const getAllowedAdminOrigins = () => {
  const configuredOrigins =
    parseCommaSeparatedList(
      process.env
        .ADMIN_ALLOWED_ORIGINS ||
      process.env
        .CONTACT_ALLOWED_ORIGINS,
    );

  const vercelOrigins = [
    normalizeEnvironmentUrl(
      process.env.VERCEL_URL,
    ),

    normalizeEnvironmentUrl(
      process.env
        .VERCEL_PROJECT_PRODUCTION_URL,
    ),

    normalizeEnvironmentUrl(
      process.env
        .VERCEL_BRANCH_URL,
    ),
  ];

  const allowedOrigins = [
    ...new Set([
      ...configuredOrigins,
      ...vercelOrigins,
    ]),
  ].filter(Boolean);

  if (!allowedOrigins.length) {
    throw new ApiError(
      500,
      'ADMIN_ALLOWED_ORIGINS_NOT_CONFIGURED',
      'Configure ADMIN_ALLOWED_ORIGINS or CONTACT_ALLOWED_ORIGINS.',
    );
  }

  return allowedOrigins;
};

const assertAdminMutationOrigin = (
  request,
) =>
  assertAllowedOrigin(
    request,
    getAllowedAdminOrigins(),
  );

const getFirstDefined = (
  object,
  keys,
  fallback = '',
) => {
  if (
    !object ||
    typeof object !== 'object'
  ) {
    return fallback;
  }

  for (const key of keys) {
    const value = object[key];

    if (
      value !== undefined &&
      value !== null
    ) {
      return value;
    }
  }

  return fallback;
};

const getProjectId = (
  project,
) =>
  cleanText(
    getFirstDefined(
      project,
      [
        'projectId',
        'id',
        'project_id',
        'Mã dự án',
      ],
    ),
    {
      field:
        'project.projectId',
      maxLength: 100,
    },
  );

const getProjectName = (
  project,
) =>
  cleanText(
    getFirstDefined(
      project,
      [
        'projectName',
        'name',
        'Tên dự án',
      ],
    ),
    {
      field:
        'project.projectName',
      maxLength: 250,
    },
  );

const getProjectStatus = (
  project,
) =>
  cleanText(
    getFirstDefined(
      project,
      [
        'status',
        'projectStatus',
        'Trạng thái',
      ],
    ),
    {
      field:
        'project.status',
      maxLength: 100,
    },
  );

const getProjectPhase = (
  project,
) =>
  cleanText(
    getFirstDefined(
      project,
      [
        'phase',
        'currentPhase',
        'Giai đoạn hiện tại',
      ],
    ),
    {
      field:
        'project.phase',
      maxLength: 100,
    },
  );

const getProjectCustomerId = (
  project,
) =>
  cleanText(
    getFirstDefined(
      project,
      [
        'customerId',
        'customer_id',
        'Mã khách hàng',
      ],
    ),
    {
      field:
        'project.customerId',
      maxLength: 100,
    },
  );

const getProjectProgress = (
  project,
) => {
  const rawValue =
    getFirstDefined(
      project,
      [
        'progress',
        'progressPercent',
        'Tiến độ phần trăm',
      ],
      0,
    );

  const progress =
    Number(rawValue);

  return Number.isFinite(progress)
    ? progress
    : 0;
};

const getProjectDateValue = (
  project,
) => {
  const value = getFirstDefined(
    project,
    [
      'updatedAt',
      'createdAt',
      'startDate',
      'Ngày cập nhật',
      'Ngày tạo',
    ],
  );

  const time = Date.parse(
    String(value || ''),
  );

  return Number.isNaN(time)
    ? 0
    : time;
};

const extractProjects = (
  result,
) => {
  const candidates = [
    result?.projects,
    result?.data?.projects,
    result?.data,
    result?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const extractProject = (
  result,
) => {
  const candidate =
    result?.project ||
    result?.data?.project ||
    result?.data ||
    result?.item;

  if (
    candidate &&
    typeof candidate === 'object' &&
    !Array.isArray(candidate)
  ) {
    return candidate;
  }

  return null;
};

const extractTimeline = (
  result,
) => {
  const candidates = [
    result?.timeline,
    result?.data?.timeline,
    result?.activities,
    result?.data?.activities,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const hasRemotePagination = (
  result,
) =>
  Boolean(
    result?.pagination &&
      Number.isFinite(
        Number(
          result.pagination.total,
        ),
      ),
  ) ||
  (
    Number.isFinite(
      Number(result?.total),
    ) &&
    Number.isFinite(
      Number(result?.page),
    )
  );

const normalizeRemotePagination = (
  result,
  query,
  projects,
) => {
  const source =
    result.pagination || result;

  const page =
    Number(source.page) ||
    query.page;

  const pageSize =
    Number(source.pageSize) ||
    query.pageSize;

  const total =
    Number(source.total) ||
    projects.length;

  const totalPages =
    Number(
      source.totalPages,
    ) ||
    (
      total === 0
        ? 0
        : Math.ceil(
            total / pageSize,
          )
    );

  return {
    page,
    pageSize,
    total,
    totalPages,
  };
};

const buildSearchText = (
  project,
) =>
  [
    getProjectId(project),
    getProjectName(project),
    getProjectCustomerId(
      project,
    ),

    getFirstDefined(
      project,
      [
        'customerName',
        'customerDisplayName',
        'Tên khách hàng',
      ],
    ),

    getFirstDefined(
      project,
      [
        'projectType',
        'Loại website',
      ],
    ),

    getFirstDefined(
      project,
      [
        'manager',
        'Người phụ trách',
      ],
    ),

    getFirstDefined(
      project,
      [
        'websiteUrl',
        'Link website',
      ],
    ),

    getFirstDefined(
      project,
      [
        'notes',
        'Ghi chú',
      ],
    ),
  ]
    .map((value) =>
      String(value || '')
        .toLowerCase(),
    )
    .join(' ');

const filterAndPaginateProjects = (
  projects,
  query,
) => {
  const normalizedSearch =
    query.search.toLowerCase();

  const filtered = projects
    .filter((project) => {
      if (
        query.customerId &&
        getProjectCustomerId(
          project,
        ) !== query.customerId
      ) {
        return false;
      }

      if (
        query.status &&
        getProjectStatus(
          project,
        ) !== query.status
      ) {
        return false;
      }

      if (
        query.phase &&
        getProjectPhase(
          project,
        ) !== query.phase
      ) {
        return false;
      }

      if (
        normalizedSearch &&
        !buildSearchText(
          project,
        ).includes(
          normalizedSearch,
        )
      ) {
        return false;
      }

      return true;
    })
    .sort(
      (left, right) =>
        getProjectDateValue(right) -
        getProjectDateValue(left),
    );

  const total = filtered.length;

  const totalPages =
    total === 0
      ? 0
      : Math.ceil(
          total /
          query.pageSize,
        );

  const safePage =
    totalPages === 0
      ? 1
      : Math.min(
          query.page,
          totalPages,
        );

  const startIndex =
    (safePage - 1) *
    query.pageSize;

  return {
    projects: filtered.slice(
      startIndex,
      startIndex +
        query.pageSize,
    ),

    pagination: {
      page: safePage,
      pageSize: query.pageSize,
      total,
      totalPages,
    },
  };
};

const buildProjectStats = (
  projects,
  remoteStats,
) => {
  if (
    remoteStats &&
    typeof remoteStats ===
      'object' &&
    !Array.isArray(remoteStats)
  ) {
    return remoteStats;
  }

  const byStatus =
    Object.fromEntries(
      PROJECT_STATUSES.map(
        (status) => [
          status,
          projects.filter(
            (project) =>
              getProjectStatus(
                project,
              ) === status,
          ).length,
        ],
      ),
    );

  const active =
    projects.filter(
      (project) =>
        getProjectStatus(
          project,
        ) === 'Đang thực hiện',
    ).length;

  const completed =
    projects.filter(
      (project) =>
        getProjectStatus(
          project,
        ) === 'Đã hoàn thành',
    ).length;

  const averageProgress =
    projects.length === 0
      ? 0
      : Number(
          (
            projects.reduce(
              (sum, project) =>
                sum +
                getProjectProgress(
                  project,
                ),
              0,
            ) /
            projects.length
          ).toFixed(1),
        );

  return {
    total: projects.length,
    active,
    completed,
    averageProgress,
    byStatus,
  };
};

const normalizeListQuery = (
  request,
) => {
  const pagination =
    validatePagination(
      request.query || {},
    );

  return {
    ...pagination,

    customerId:
      cleanId(
        request.query
          ?.customerId,
        {
          field:
            'customerId',
          required: false,
        },
      ),

    status:
      cleanEnum(
        request.query?.status,
        PROJECT_STATUSES,
        {
          field: 'status',
          required: false,
        },
      ),

    phase:
      cleanEnum(
        request.query?.phase,
        PROJECT_PHASES,
        {
          field: 'phase',
          required: false,
        },
      ),
  };
};

const handleGetProject = async (
  response,
  session,
  projectId,
) => {
  const result =
    await callAppsScript(
      'getProject',
      {
        projectId,
        includeTimeline: true,
      },
      {
        actor:
          session.username,
        source:
          'admin-projects-api',
      },
    );

  const project =
    extractProject(result);

  if (!project) {
    throw new ApiError(
      404,
      'PROJECT_NOT_FOUND',
      'Project was not found.',
    );
  }

  return sendSuccess(
    response,
    {
      project,
      timeline:
        extractTimeline(result),
    },
  );
};

const handleListProjects = async (
  request,
  response,
  session,
) => {
  const query =
    normalizeListQuery(request);

  const result =
    await callAppsScript(
      'listProjects',
      query,
      {
        actor:
          session.username,
        source:
          'admin-projects-api',
      },
    );

  const allProjects =
    extractProjects(result);

  if (hasRemotePagination(result)) {
    return sendSuccess(
      response,
      {
        projects:
          allProjects,

        pagination:
          normalizeRemotePagination(
            result,
            query,
            allProjects,
          ),

        stats:
          buildProjectStats(
            allProjects,
            result.stats ||
              result.data?.stats,
          ),
      },
    );
  }

  const paginated =
    filterAndPaginateProjects(
      allProjects,
      query,
    );

  return sendSuccess(
    response,
    {
      ...paginated,

      stats:
        buildProjectStats(
          allProjects,
          result.stats ||
            result.data?.stats,
        ),
    },
  );
};

const handleGet = async (
  request,
  response,
  session,
) => {
  const projectId =
    cleanId(
      request.query
        ?.projectId,
      {
        field: 'projectId',
        required: false,
      },
    );

  if (projectId) {
    return handleGetProject(
      response,
      session,
      projectId,
    );
  }

  return handleListProjects(
    request,
    response,
    session,
  );
};

const handleCreateProject = async (
  body,
  response,
  session,
) => {
  const validated =
    validateProject(body);

  const {
    projectId:
      ignoredProjectId,
    ...projectInput
  } = validated;

  const result =
    await callAppsScript(
      'createProject',
      projectInput,
      {
        actor:
          session.username,
        source:
          'admin-projects-api',
      },
    );

  const project =
    extractProject(result);

  if (!project) {
    throw new ApiError(
      502,
      'INVALID_CREATE_PROJECT_RESPONSE',
      'Google Apps Script did not return the created project.',
    );
  }

  return sendSuccess(
    response,
    {
      message:
        'PROJECT_CREATED',
      project,
    },
    201,
  );
};

const validateTimelineEntry = (
  body,
) => {
  const projectId =
    cleanId(
      body.projectId,
      {
        field: 'projectId',
      },
    );

  const content =
    cleanText(
      body.content,
      {
        field: 'content',
        required: true,
        minLength: 2,
        maxLength: 5000,
        preserveNewLines: true,
      },
    );

  const phase =
    cleanEnum(
      body.phase,
      PROJECT_PHASES,
      {
        field: 'phase',
        required: false,
      },
    );

  const status =
    cleanEnum(
      body.status,
      PROJECT_STATUSES,
      {
        field: 'status',
        required: false,
      },
    );

  const progress =
    body.progress ===
      undefined ||
    body.progress === null ||
    body.progress === ''
      ? undefined
      : cleanNumber(
          body.progress,
          {
            field: 'progress',
            min: 0,
            max: 100,
          },
        );

  return Object.fromEntries(
    Object.entries({
      projectId,
      content,
      phase,
      status,
      progress,
    }).filter(
      ([, value]) =>
        value !== undefined &&
        value !== '',
    ),
  );
};

const handleAddTimeline = async (
  body,
  response,
  session,
) => {
  const timelineEntry =
    validateTimelineEntry(body);

  const result =
    await callAppsScript(
      'addProjectTimeline',
      timelineEntry,
      {
        actor:
          session.username,
        source:
          'admin-projects-api',
      },
    );

  const project =
    extractProject(result);

  const timelineItem =
    result?.timelineItem ||
    result?.data
      ?.timelineItem ||
    result?.activity ||
    result?.data?.activity ||
    timelineEntry;

  return sendSuccess(
    response,
    {
      message:
        'PROJECT_TIMELINE_ADDED',

      project,

      timelineItem,
    },
    201,
  );
};

const handlePost = async (
  request,
  response,
  session,
) => {
  assertAdminMutationOrigin(
    request,
  );

  const body =
    await readJsonBody(
      request,
      {
        maxBytes:
          MUTATION_BODY_LIMIT_BYTES,
      },
    );

  const operation =
    cleanEnum(
      body.operation ||
        'create',
      PROJECT_OPERATIONS,
      {
        field: 'operation',
      },
    );

  if (
    operation === 'timeline'
  ) {
    return handleAddTimeline(
      body,
      response,
      session,
    );
  }

  return handleCreateProject(
    body,
    response,
    session,
  );
};

const handleUpdateProject = async (
  request,
  response,
  session,
) => {
  assertAdminMutationOrigin(
    request,
  );

  const body =
    await readJsonBody(
      request,
      {
        maxBytes:
          MUTATION_BODY_LIMIT_BYTES,
      },
    );

  const projectId =
    cleanId(
      body.projectId ||
        request.query
          ?.projectId,
      {
        field: 'projectId',
      },
    );

  const validated =
    validateProject(
      {
        ...body,
        projectId,
      },
      {
        partial: true,
      },
    );

  const {
    projectId:
      validatedProjectId,
    ...changes
  } = validated;

  if (
    Object.keys(changes)
      .length === 0
  ) {
    throw new ApiError(
      400,
      'NO_PROJECT_CHANGES',
      'No project fields were provided for update.',
    );
  }

  const timelineNote =
    cleanText(
      body.timelineNote,
      {
        field:
          'timelineNote',
        maxLength: 5000,
        preserveNewLines: true,
      },
    );

  const result =
    await callAppsScript(
      'updateProject',
      {
        projectId:
          validatedProjectId,
        changes,
        timelineNote,
      },
      {
        actor:
          session.username,
        source:
          'admin-projects-api',
      },
    );

  const project =
    extractProject(result);

  if (!project) {
    throw new ApiError(
      502,
      'INVALID_UPDATE_PROJECT_RESPONSE',
      'Google Apps Script did not return the updated project.',
    );
  }

  return sendSuccess(
    response,
    {
      message:
        'PROJECT_UPDATED',
      project,
      timelineItem:
        result.timelineItem ||
        result.data
          ?.timelineItem ||
        null,
    },
  );
};

const handleDeleteProject = async (
  request,
  response,
  session,
) => {
  assertAdminMutationOrigin(
    request,
  );

  const body =
    await readJsonBody(
      request,
      {
        maxBytes:
          MUTATION_BODY_LIMIT_BYTES,
      },
    );

  const projectId =
    cleanId(
      body.projectId ||
        request.query
          ?.projectId,
      {
        field: 'projectId',
      },
    );

  const reason =
    cleanText(
      body.reason,
      {
        field: 'reason',
        maxLength: 1000,
        preserveNewLines: true,
      },
    );

  const result =
    await callAppsScript(
      'deleteProject',
      {
        projectId,
        reason,
        softDelete: true,
      },
      {
        actor:
          session.username,
        source:
          'admin-projects-api',
      },
    );

  return sendSuccess(
    response,
    {
      message:
        'PROJECT_DELETED',

      projectId,

      deletedAt:
        result.deletedAt ||
        result.data
          ?.deletedAt ||
        new Date()
          .toISOString(),

      softDelete: true,
    },
  );
};

const handleOptions = (
  response,
) => {
  setNoStore(response);

  response.setHeader(
    'Allow',
    'GET, POST, PATCH, DELETE, OPTIONS',
  );

  return response
    .status(204)
    .end();
};

export default async function handler(
  request,
  response,
) {
  setNoStore(response);

  let session = null;

  try {
    if (
      request.method ===
      'OPTIONS'
    ) {
      return handleOptions(
        response,
      );
    }

    session =
      requireAdmin(request);

    switch (request.method) {
      case 'GET':
        return await handleGet(
          request,
          response,
          session,
        );

      case 'POST':
        return await handlePost(
          request,
          response,
          session,
        );

      case 'PATCH':
        return await handleUpdateProject(
          request,
          response,
          session,
        );

      case 'DELETE':
        return await handleDeleteProject(
          request,
          response,
          session,
        );

      default:
        return methodNotAllowed(
          response,
          [
            'GET',
            'POST',
            'PATCH',
            'DELETE',
            'OPTIONS',
          ],
        );
    }
  } catch (error) {
    logApiError(
      'admin/projects',
      error,
      {
        method:
          request.method,

        username:
          session?.username,

        clientIp:
          getClientIp(
            request,
          ),

        origin:
          getHeader(
            request,
            'origin',
          ),
      },
    );

    return sendError(
      response,
      error,
    );
  }
}
