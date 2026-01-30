/**
 * Utility để extract error messages từ các loại errors khác nhau
 */

/**
 * Extract error message từ error object
 * @param {*} err - Error object hoặc string
 * @returns {string} - Error message
 */
export function extractErrorMessage(err) {
  if (!err) {
    return 'Lỗi không xác định';
  }

  // String error
  if (typeof err === 'string') {
    return err;
  }

  // Google Drive API error format: err.result.error
  if (err?.result?.error) {
    const apiError = err.result.error;
    return apiError.message || 
           apiError.errors?.[0]?.message || 
           apiError.error || 
           `Google Drive API Error: ${apiError.code || 'UNKNOWN'}`;
  }

  // Google API error format: err.error
  if (err?.error) {
    if (typeof err.error === 'string') {
      return err.error;
    }
    return err.error.message || 
           err.error.errors?.[0]?.message || 
           err.error.error || 
           JSON.stringify(err.error);
  }

  // Standard Error object
  if (err instanceof Error) {
    return err.message || 'Lỗi không xác định';
  }

  // Error với message property
  if (err?.message) {
    return err.message;
  }

  // Try toString nếu không phải [object Object]
  if (err?.toString && typeof err.toString === 'function') {
    const str = err.toString();
    if (str !== '[object Object]' && str !== '[object Error]') {
      return str;
    }
  }

  // Try to extract HTTP status
  if (err?.status || err?.statusCode) {
    const status = err.status || err.statusCode;
    return `HTTP ${status}: ${err.statusText || 'Request failed'}`;
  }

  // Fallback
  return 'Lỗi không xác định';
}

/**
 * Format error message cho display
 * @param {*} err - Error object
 * @param {string} prefix - Prefix message
 * @returns {string} - Formatted error message
 */
export function formatError(err, prefix = '') {
  const message = extractErrorMessage(err);
  return prefix ? `${prefix}: ${message}` : message;
}
