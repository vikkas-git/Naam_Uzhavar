// What this file does: Reusable card container component wrapping React-Bootstrap Card with padding and variant options.

import React, { forwardRef } from 'react';
import BCard from 'react-bootstrap/Card';

const VARIANT_MAP = {
  default: 'shadow-sm border',
  elevated: 'shadow border-0',
  outlined: 'border shadow-none',
  tinted: 'bg-primary-subtle border-0',
  interactive: 'shadow-sm border',
  flat: 'border-0 shadow-none'
};

const PADDING_MAP = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-4 p-md-5'
};

/**
 * Reusable Card Component (Thin wrapper around react-bootstrap/Card)
 * Preserves exact props API: variant, padding, header, footer, interactive.
 */
const Card = forwardRef(function Card(
  {
    children,
    variant = 'default',
    padding = 'md',
    header,
    footer,
    className = '',
    bodyClassName = '',
    onClick,
    ...rest
  },
  ref
) {
  const isInteractive = variant === 'interactive' || !!onClick;

  // Bootstrap padding mapping
  const paddingClass = PADDING_MAP[padding] || 'p-4';

  // Variant classes
  const variantClass = VARIANT_MAP[variant] || VARIANT_MAP.default;

  const rootClasses = [
    variantClass,
    isInteractive ? 'cursor-pointer ui-card-interactive' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const mergedBodyClasses = [paddingClass, bodyClassName].filter(Boolean).join(' ');

  const handleKeyDown = (e) => {
    if (isInteractive && onClick) {
      // Only trigger card click if event was directly targeted at the card container,
      // avoiding stealing Enter or Space events from child inputs, textareas, or buttons.
      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(e);
      }
    }
  };

  return (
    <BCard
      ref={ref}
      className={rootClasses}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive && onClick ? handleKeyDown : undefined}
      {...rest}
    >
      {header && (
        <BCard.Header className="bg-transparent border-bottom fw-bold">
          {header}
        </BCard.Header>
      )}
      <BCard.Body className={mergedBodyClasses}>{children}</BCard.Body>
      {footer && (
        <BCard.Footer className="bg-transparent border-top">
          {footer}
        </BCard.Footer>
      )}
    </BCard>
  );
});

Card.displayName = 'Card';

// Subcomponents attached for compatibility
Card.Header = BCard.Header;
Card.Body = BCard.Body;
Card.Footer = BCard.Footer;
Card.Title = BCard.Title;
Card.Text = BCard.Text;

export default Card;
