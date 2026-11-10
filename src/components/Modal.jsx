// What this file does: Reusable modal dialog component wrapping React-Bootstrap Modal.

import React from 'react';
import BModal from 'react-bootstrap/Modal';

/**
 * Reusable Modal Dialog Component (Thin wrapper around react-bootstrap/Modal)
 * Supports compound subcomponents (Modal.Header, Modal.Body, Modal.Footer)
 * and prop-based configurations (isOpen, onClose, title, footer, maxWidth).
 */
export default function Modal({
  isOpen,
  show,
  onClose,
  title,
  description,
  children,
  footer,
  hideHeader = false,
  size = 'md',
  maxWidth,
  className = '',
  dialogClassName = '',
  backdrop = true,
  keyboard = true,
  centered = true,
  ...rest
}) {
  const isModalVisible = show !== undefined ? show : !!isOpen;

  // Map sizes: 'sm' -> 'sm', 'lg' -> 'lg', 'xl' -> 'xl', 'md' -> undefined
  const bsSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : undefined;

  const style = maxWidth ? { maxWidth } : undefined;

  return (
    <BModal
      show={isModalVisible}
      onHide={onClose}
      size={bsSize}
      backdrop={backdrop}
      keyboard={keyboard}
      centered={centered}
      className={className}
      dialogClassName={dialogClassName}
      style={style}
      {...rest}
    >
      {!hideHeader && (
        (title || description) ? (
          <BModal.Header closeButton={!!onClose} className="border-bottom">
            <div>
              {title && <BModal.Title as="h5" className="fw-bold mb-0">{title}</BModal.Title>}
              {description && <p className="text-muted small mb-0 mt-1">{description}</p>}
            </div>
          </BModal.Header>
        ) : onClose ? (
          <BModal.Header closeButton className="border-0 pb-0 justify-content-end" />
        ) : null
      )}

      <BModal.Body>{children}</BModal.Body>

      {footer && <BModal.Footer className="border-top">{footer}</BModal.Footer>}
    </BModal>
  );
}

// Compound subcomponents attached for backward compatibility
Modal.Header = function ModalHeader({ children, title, onClose, className = '', ...props }) {
  return (
    <BModal.Header closeButton={!!onClose} className={`border-bottom ${className}`} {...props}>
      {title ? <BModal.Title as="h5" className="fw-bold mb-0">{title}</BModal.Title> : children}
    </BModal.Header>
  );
};

Modal.Body = function ModalBody({ children, className = '', ...props }) {
  return <BModal.Body className={className} {...props}>{children}</BModal.Body>;
};

Modal.Footer = function ModalFooter({ children, className = '', ...props }) {
  return <BModal.Footer className={`border-top ${className}`} {...props}>{children}</BModal.Footer>;
};

Modal.Title = BModal.Title;
