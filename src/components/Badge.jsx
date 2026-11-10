// What this file does: Reusable status and category badge component wrapping React-Bootstrap Badge.

import React from 'react';
import BBadge from 'react-bootstrap/Badge';

/**
 * Reusable Badge Component (Thin wrapper around react-bootstrap/Badge)
 * Preserves exact props API: variant, grade, status, size, dot, icon.
 */
export default function Badge({
  children,
  variant = 'neutral',
  grade,
  status,
  size = 'md',
  dot = false,
  icon,
  className = '',
  ...rest
}) {
  // Normalize variant from grade or status
  let resolvedVariant = variant;
  if (grade) {
    const cleanGrade = grade.toLowerCase().replace(/\s+/g, '-');
    resolvedVariant = cleanGrade.startsWith('grade') ? cleanGrade : `grade-${cleanGrade}`;
  } else if (status) {
    resolvedVariant = status.toLowerCase().replace(/\s+/g, '-');
  }

  // Map to Bootstrap badge background or custom utility classes
  let bg = '';
  let customClass = '';

  switch (resolvedVariant) {
    case 'success':
    case 'delivered':
      customClass = 'badge-status-success';
      break;
    case 'grade-a':
    case 'grade-a+':
      customClass = 'badge-status-success fw-bold';
      break;
    case 'in-transit':
    case 'info':
      customClass = 'badge-status-info';
      break;
    case 'warning':
    case 'pending':
    case 'in-review':
    case 'preparing':
    case 'gold':
    case 'grade-b':
    case 'grade-c':
      customClass = 'badge-status-pending fw-bold';
      break;
    case 'danger':
    case 'error':
    case 'cancelled':
      customClass = 'badge-status-error';
      break;
    case 'brand':
    case 'farmer':
    case 'organic':
      customClass = 'badge-status-farmer';
      break;
    default:
      bg = 'secondary';
      customClass = 'bg-opacity-75';
      break;
  }

  // Size styling
  const sizeClass = {
    sm: 'fs-8 py-1 px-2',
    md: 'py-1 px-2.5',
    lg: 'fs-6 py-1.5 px-3',
  }[size] || 'py-1 px-2.5';

  const classes = [
    'rounded-pill d-inline-flex align-items-center gap-1 fw-semibold text-nowrap',
    sizeClass,
    customClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <BBadge bg={bg} className={classes} {...rest}>
      {dot && (
        <span
          className="rounded-circle d-inline-block bg-current"
          style={{ width: 6, height: 6, opacity: 0.8 }}
          aria-hidden="true"
        />
      )}
      {icon && <span className="d-inline-flex align-items-center">{icon}</span>}
      <span>{children || grade || status}</span>
    </BBadge>
  );
}
