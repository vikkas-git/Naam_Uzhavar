// What this file does: Reusable section header component with eyebrow badge, title, subtitle, and optional action button.

import React from 'react';

/**
 * Reusable SectionHeader Component
 * Built purely from Bootstrap utility classes.
 * Preserves exact props API: title, subtitle, badge, badgeIcon, action, align, as.
 */
export default function SectionHeader({
  title,
  subtitle,
  badge,
  badgeIcon,
  action,
  align = 'left',
  as: HeadingTag = 'h2',
  className = '',
  ...rest
}) {
  const isCenter = align === 'center';

  return (
    <div
      className={`mb-4 w-100 ${isCenter ? 'text-center mx-auto' : ''} ${className}`}
      style={isCenter ? { maxWidth: 760 } : undefined}
      {...rest}
    >
      {badge && (
        <div className={`mb-2 ${isCenter ? 'd-flex justify-content-center' : ''}`}>
          <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5">
            {badgeIcon && <span aria-hidden="true">{badgeIcon}</span>}
            <span>{badge}</span>
          </span>
        </div>
      )}

      <div className={`d-flex flex-column flex-md-row ${isCenter ? 'justify-content-center text-center' : 'justify-content-between align-items-md-end'} gap-3 w-100`}>
        <div>
          {title && (
            <HeadingTag className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.3px' }}>
              {title}
            </HeadingTag>
          )}
          {subtitle && (
            <p className="text-muted mb-0 lead fs-6">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
