// What this file does: Helper utility functions for formatting prices, dates, statuses, and common application helpers.

/**
 * Format order / delivery / request status strings for human-readable frontend display.
 * Converts uppercase underscore identifiers to clean title capitalization:
 * Examples:
 * READY_FOR_PICKUP -> Ready for Pickup
 * IN_TRANSIT -> In Transit
 * OUT_FOR_DELIVERY -> Out for Delivery
 * DELIVERED -> Delivered
 * PENDING_CONFIRMATION -> Pending Confirmation
 * CANCELLED -> Cancelled
 * CONVERTED_TO_ORDER -> ORDER CONFIRMED
 *
 * Preserves internal status keys for APIs, logic, and CSS classes.
 */
export function formatOrderStatus(status) {
  if (!status || typeof status !== 'string') return status || '';

  const statusMap = {
    READY_FOR_PICKUP: 'Ready for Pickup',
    IN_TRANSIT: 'In Transit',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    PENDING_CONFIRMATION: 'Pending Confirmation',
    PENDING_FARMER_APPROVAL: 'Pending Farmer Approval',
    CONFIRMED: 'Confirmed',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected',
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    PICKED_UP: 'Picked Up',
    DRIVER_EN_ROUTE_PICKUP: 'Driver En Route Pickup',
    NOT_ASSIGNED: 'Not Assigned',
    CONVERTED_TO_ORDER: 'ORDER CONFIRMED',
    'CONVERTED TO ORDER': 'ORDER CONFIRMED',
    RELEASED_TO_FARMER: 'Released to Farmer',
    PAID: 'Paid',
    SOLD_OUT: 'Sold Out'
  };

  const key = status.trim().toUpperCase();
  if (statusMap[key]) {
    return statusMap[key];
  }

  // Fallback for any other underscore-separated status string
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b([a-z])/g, (match, ch, offset) => {
      const lower = match.toLowerCase();
      if (offset > 0 && ['for', 'in', 'to', 'of', 'and', 'on', 'by', 'from'].includes(lower)) {
        return lower;
      }
      return ch.toUpperCase();
    })
    .replace(/^([a-z])/, (ch) => ch.toUpperCase());
}

/**
 * Formats order dates into clean YYYY-MM-DD format.
 * Replaces relative labels such as "Today" and "Yesterday" with their corresponding actual dates.
 *
 * @param {string|Date} dateVal - Input date value or relative string ('Today', 'Yesterday', etc.)
 * @param {string|Date} [fallbackDate] - Optional fallback timestamp/date
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function formatOrderDate(dateVal, fallbackDate) {
  const str = String(dateVal || '').trim();
  const lower = str.toLowerCase();

  // "Today" -> Current date in YYYY-MM-DD
  if (lower.startsWith('today')) {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // "Yesterday" -> Previous day's date in YYYY-MM-DD
  if (lower.startsWith('yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Check if string already contains a YYYY-MM-DD pattern
  const match = str.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (match) {
    return match[0];
  }

  // Attempt standard date parsing
  const candidate = dateVal || fallbackDate;
  if (candidate) {
    const parsed = new Date(candidate);
    if (!isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // Safe fallback to today's date
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
