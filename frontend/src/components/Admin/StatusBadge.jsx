import React from 'react';

import {
  statusClass,
} from './adminConfig';

import './StatusBadge.css';

const StatusBadge = ({
  status,
}) => (
  <span
    className={`ia-status-badge ${statusClass(
      status,
    )}`}
  >
    {status || 'Chưa có'}
  </span>
);

export default StatusBadge;
