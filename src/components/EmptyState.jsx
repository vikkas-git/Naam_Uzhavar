// What this file does: Reusable empty state view displaying an icon, title, description, and optional action button.

import React from 'react';
import Button from './Button';

/**
 * Reusable EmptyState Component
 * Built purely from Bootstrap utility classes (d-flex, text-center, py-5, text-muted, etc.).
 * Preserves exact props API: icon, title, description, action, actionText, onAction.
 */
export default function EmptyState({
  icon = '🌾',
  title = 'No items found',
  description,
  action,
  actionText,
  onAction,
  children,
  className = '',
  ...rest
}) {
  return (
    <div
      className={`text-center py-5 px-3 d-flex flex-column align-items-center justify-content-center bg-white rounded-3 border border-light-subtle shadow-sm my-3 ${className}`}
      {...rest}
    >
      <div className="mb-3 fs-1 text-muted d-flex align-items-center justify-content-center" aria-hidden="true">
        {icon}
      </div>

      {title && <h4 className="h5 fw-bold text-dark mb-2">{title}</h4>}

      {description && (
        <p className="text-muted mb-4 text-center mx-auto" style={{ maxWidth: 440 }}>
          {description}
        </p>
      )}

      {(action || (actionText && onAction)) && (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {action || (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionText}
            </Button>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
