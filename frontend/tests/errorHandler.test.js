import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatErrorMessage } from '../src/utils/errorHandler.js';

describe('Frontend Error Handler Utility', () => {
  it('should return raw string when error is a string', () => {
    const msg = formatErrorMessage('Koneksi ke backend gagal.');
    assert.equal(msg, 'Koneksi ke backend gagal.');
  });

  it('should extract message from structured error object { code, message }', () => {
    const errorObj = {
      code: 'SESSION_NOT_FOUND',
      message: 'Sesi petualangan tidak ditemukan.'
    };
    const msg = formatErrorMessage(errorObj);
    assert.equal(msg, 'Sesi petualangan tidak ditemukan.');
  });

  it('should extract message from nested error object { error: { message } }', () => {
    const nested = {
      error: {
        code: 'INVALID_SCENE',
        message: 'Adegan tidak valid.'
      }
    };
    const msg = formatErrorMessage(nested);
    assert.equal(msg, 'Adegan tidak valid.');
  });

  it('should handle native Error instances', () => {
    const nativeErr = new Error('Database unreachable');
    const msg = formatErrorMessage(nativeErr);
    assert.equal(msg, 'Database unreachable');
  });

  it('should format code when message is absent', () => {
    const codeOnly = { code: 'UNAUTHORIZED' };
    const msg = formatErrorMessage(codeOnly);
    assert.equal(msg, 'Error [UNAUTHORIZED]');
  });

  it('should return fallback when error is null, undefined, or empty', () => {
    assert.equal(formatErrorMessage(null, 'Terjadi kendala'), 'Terjadi kendala');
    assert.equal(formatErrorMessage(undefined, 'Gagal'), 'Gagal');
    assert.equal(formatErrorMessage('', 'Default error'), 'Default error');
  });
});
