/**
 * AetherMaster Standardized Error Formatter
 * Prevents React rendering crashes when errors are returned as structured objects { code, message }
 * instead of raw strings.
 */

export function formatErrorMessage(error, fallback = 'Terjadi kesalahan pada sistem.') {
  if (!error) return fallback;

  if (typeof error === 'string') {
    return error.trim() ? error : fallback;
  }

  if (typeof error === 'object') {
    // If standard Error or custom { message: "..." }
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
    // If nested { error: "..." } or { error: { message: "..." } }
    if (error.error) {
      return formatErrorMessage(error.error, fallback);
    }
    // If code exists without message
    if (typeof error.code === 'string' && error.code.trim()) {
      return `Error [${error.code}]`;
    }
  }

  return fallback;
}

export default formatErrorMessage;
