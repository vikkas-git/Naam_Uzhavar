// What this file does: Reusable button component wrapping React-Bootstrap Button with custom variants and loading state.

import React, { forwardRef } from 'react';
import BButton from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

/**
 * Reusable Button Component (Thin wrapper around react-bootstrap/Button)
 * Preserves exact props API: variant, size, isLoading, fullWidth, leftIcon, rightIcon.
 */
const Button = forwardRef(function Button(
  {
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    loadingText,
    disabled = false,
    icon,
    leftIcon,
    rightIcon,
    className = '',
    onClick,
    ...rest
  },
  ref
) {
  const isButtonDisabled = disabled || isLoading;
  const effectiveLeftIcon = leftIcon || icon;

  // Map custom design-system variants to Bootstrap variants / classes
  let bsVariant = variant;
  let customClass = '';

  if (variant === 'ghost') {
    bsVariant = 'link';
    customClass = 'btn-ghost text-decoration-none';
  } else if (variant === 'outline' || variant === 'secondary') {
    bsVariant = 'outline-secondary';
    customClass = 'buyer-btn-outline';
  } else if (variant === 'primary') {
    bsVariant = 'primary';
    customClass = 'buyer-btn-primary';
  } else if (variant === 'danger') {
    bsVariant = 'danger';
    customClass = 'buyer-btn-danger';
  } else if (variant === 'harvest') {
    bsVariant = 'warning';
    customClass = 'btn-harvest';
  }

  // Size mapping (Bootstrap supports 'sm' and 'lg'; 'md' is default)
  const bsSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : undefined;
  if (size === 'sm') {
    customClass += ' small';
  }

  const classes = [
    'd-inline-flex align-items-center justify-content-center gap-2 fw-semibold',
    fullWidth ? 'w-100' : '',
    customClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <BButton
      ref={ref}
      type={type}
      variant={bsVariant}
      size={bsSize}
      className={classes}
      disabled={isButtonDisabled}
      onClick={onClick}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? (
        <>
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className="me-1"
          />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {effectiveLeftIcon && <span className="d-inline-flex align-items-center">{effectiveLeftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="d-inline-flex align-items-center">{rightIcon}</span>}
        </>
      )}
    </BButton>
  );
});

export default Button;
