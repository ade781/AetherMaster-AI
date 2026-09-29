/**
 * Standard API Response & Error Helper
 * Standardizes backend API contract:
 * Success: { success: true, message?: string, data?: any }
 * Failure: { success: false, error: { code: string, message: string } }
 */

const ERROR_CODES = {
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  INVALID_SCENE: 'INVALID_SCENE',
  INVALID_ACTION: 'INVALID_ACTION',
  SAVE_FAILED: 'SAVE_FAILED',
  LOAD_FAILED: 'LOAD_FAILED',
  INVALID_SAVE_FILE: 'INVALID_SAVE_FILE',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

function resolveErrorCode(err, statusCode = 500) {
  if (err?.code && typeof err.code === 'string') return err.code;
  const msg = (err?.message || '').toLowerCase();
  if (statusCode === 404 || msg.includes('tidak ditemukan') || msg.includes('not found')) {
    return ERROR_CODES.SESSION_NOT_FOUND;
  }
  if (statusCode === 429 || msg.includes('terlalu banyak') || msg.includes('rate limit')) {
    return ERROR_CODES.RATE_LIMIT_EXCEEDED;
  }
  if (msg.includes('file') || msg.includes('import') || msg.includes('format data json')) {
    return ERROR_CODES.INVALID_SAVE_FILE;
  }
  if (msg.includes('simpan')) {
    return ERROR_CODES.SAVE_FAILED;
  }
  if (msg.includes('muat') || msg.includes('load')) {
    return ERROR_CODES.LOAD_FAILED;
  }
  if (msg.includes('tindakan') || msg.includes('choice') || msg.includes('aksi') || msg.includes('encounter')) {
    return ERROR_CODES.INVALID_ACTION;
  }
  if (msg.includes('scene') || msg.includes('adegan')) {
    return ERROR_CODES.INVALID_SCENE;
  }
  if (statusCode === 400 || msg.includes('tidak valid') || msg.includes('wajib') || msg.includes('invalid')) {
    return ERROR_CODES.VALIDATION_FAILED;
  }
  return ERROR_CODES.INTERNAL_ERROR;
}

function errorResponse(res, statusCode, code, message) {
  const finalCode = typeof code === 'string' ? code : resolveErrorCode(code, statusCode);
  const finalMsg = typeof message === 'string' ? message : (code?.message || 'Terjadi kesalahan pada server.');
  return res.status(statusCode).json({
    success: false,
    error: {
      code: finalCode,
      message: finalMsg
    }
  });
}

function successResponse(res, data = null, message = null, statusCode = 200) {
  const payload = { success: true };
  if (message) payload.message = message;
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
}

module.exports = {
  ERROR_CODES,
  resolveErrorCode,
  errorResponse,
  successResponse
};
