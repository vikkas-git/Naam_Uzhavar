// What this file does: Order ID formatting and generator utility.
// Enforces new format: Exactly 3 uppercase letters, hyphen, unique numeric sequence (e.g. ORD-1024).
// Provides deterministic backward-compatible display mapping for legacy IDs.

/**
 * Format any order ID to strictly match 'ORD-XXXX' (3 uppercase letters, hyphen, numeric sequence)
 * @param {string|number} rawId
 * @returns {string} e.g. 'ORD-1024'
 */
export function formatDisplayOrderId(rawId) {
  if (!rawId) return 'ORD-1001';
  const str = String(rawId).trim();

  // If already exactly 3 uppercase letters, hyphen, and digits (e.g. ORD-1024)
  if (/^[A-Z]{3}-\d+$/.test(str)) {
    return str;
  }

  // If legacy format NU-2026-48210, NU-48210, or similar
  const match = str.match(/\d+$/);
  if (match) {
    let digits = match[0];
    if (digits.length > 4) {
      digits = digits.slice(-4);
    }
    // Pad to at least 4 digits if needed
    digits = digits.padStart(4, '0');
    return `ORD-${digits}`;
  }

  // Fallback hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 9000;
  }
  return `ORD-${1000 + Math.abs(hash)}`;
}

/**
 * Generate a new unique order ID in format ORD-XXXX (e.g. ORD-1024)
 * @param {Set<string>|Array<string>} existingIds
 * @returns {string}
 */
export function generateClientOrderId(existingIds = []) {
  const existingSet = new Set(Array.from(existingIds || []).map((id) => String(id)));
  let candidate = '';
  let tries = 0;

  while (tries < 1000) {
    const num = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
    candidate = `ORD-${num}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
    tries++;
  }

  return `ORD-${Date.now().toString().slice(-4)}`;
}

