const { GoogleGenAI } = require('@google/genai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { parseSceneJson } = require('./sceneSchema');

const ERROR_TYPES = {
  AUTH_ERROR: 'AUTH_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  TIMEOUT: 'TIMEOUT',
  SCHEMA_ERROR: 'SCHEMA_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
};

function sanitizeLog(message, apiKey) {
  if (!message) return '';
  let str = typeof message === 'string' ? message : message.stack || message.message || JSON.stringify(message);
  const currentKey = apiKey || process.env.GEMINI_API_KEY;
  if (currentKey && currentKey.length > 5) {
    str = str.split(currentKey).join('[REDACTED_API_KEY]');
  }
  // Also mask any standard Gemini key pattern AIzaSy and AQ.
  str = str.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, '[REDACTED_API_KEY]');
  str = str.replace(/AQ\.[A-Za-z0-9_-]{20,80}/g, '[REDACTED_API_KEY]');
  return str;
}

function classifyError(err) {
  if (!err) return ERROR_TYPES.SERVER_ERROR;
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.code;

  if (
    status === 401 ||
    status === 403 ||
    msg.includes('api key') ||
    msg.includes('api_key_invalid') ||
    msg.includes('permission_denied') ||
    msg.includes('unauthenticated')
  ) {
    return ERROR_TYPES.AUTH_ERROR;
  }

  if (
    status === 429 ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted')
  ) {
    return ERROR_TYPES.RATE_LIMIT;
  }

  if (
    msg.includes('timeout') ||
    msg.includes('deadline') ||
    msg.includes('etimedout') ||
    msg.includes('esockettimedout')
  ) {
    return ERROR_TYPES.TIMEOUT;
  }

  if (
    msg.includes('json') ||
    msg.includes('syntaxerror') ||
    msg.includes('zod') ||
    msg.includes('validation')
  ) {
    return ERROR_TYPES.SCHEMA_ERROR;
  }

  return ERROR_TYPES.SERVER_ERROR;
}

class GeminiClient {
  constructor() {
    const rawKey = process.env.GEMINI_API_KEY;
    this.apiKey = rawKey && rawKey !== 'YOUR_GEMINI_API_KEY' && rawKey.trim() !== '' ? rawKey.trim() : null;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    this.client = null;

    if (this.apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err) {
        console.warn('[GeminiClient] Initialization failed:', sanitizeLog(err.message, this.apiKey));
        this.client = null;
      }
    }
  }

  isAvailable() {
    return Boolean(this.client && this.apiKey);
  }

  async callWithRetry(prompt, systemPrompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Gemini API client is not initialized or API key is missing');
    }

    // 1. Coba Antigravity Agent Model via Interactions API (Kategori Agents, kuota 100 RPD)
    if (this.client.interactions && typeof this.client.interactions.create === 'function') {
      try {
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
        const response = await this.client.interactions.create({
          model: 'antigravity-preview-latest',
          input: fullPrompt
        });
        if (response && response.output_text) {
          return response.output_text.trim();
        }
      } catch (err) {
        const sanitizedMsg = sanitizeLog(err.message, this.apiKey);
        console.warn(`[GeminiClient] Antigravity Agent model fallback: ${sanitizedMsg}`);
      }
    }

    // 2. Fallback ke Text-out models
    const candidateModels = [
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite'
    ].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);

    let lastError = null;

    for (const model of candidateModels) {
      const maxAttempts = 2;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          if (attempt > 1) {
            const jitter = Math.floor(Math.random() * 600) + 400;
            await new Promise(r => setTimeout(r, jitter));
          }

          const requestConfig = {
            responseMimeType: 'application/json'
          };
          if (systemPrompt) {
            requestConfig.systemInstruction = systemPrompt;
          }

          const generatePromise = this.client.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ],
            config: requestConfig
          });

          const timeoutMs = options.timeoutMs || 8000;
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: Model ${model} took longer than ${timeoutMs}ms`)), timeoutMs)
          );

          const response = await Promise.race([generatePromise, timeoutPromise]);

          if (!response || !response.text) {
            throw new Error(`Empty response returned from model ${model}`);
          }

          const textResult = response.text.trim();
          return textResult;
        } catch (err) {
          lastError = err;
          const errType = classifyError(err);
          const sanitizedMsg = sanitizeLog(err.message, this.apiKey);

          console.warn(`[GeminiClient] Model '${model}' attempt ${attempt} failed [${errType}]: ${sanitizedMsg}`);

          // Auth errors must NOT be retried to prevent hammering with bad credentials
          if (errType === ERROR_TYPES.AUTH_ERROR) {
            throw err;
          }

          // Timeout only retried once per model
          if (errType === ERROR_TYPES.TIMEOUT && attempt >= 1) {
            break;
          }

          // Rate limit: backoff if we have another attempt
          if (errType === ERROR_TYPES.RATE_LIMIT && attempt < maxAttempts) {
            const backoff = 1500 * attempt;
            await new Promise(r => setTimeout(r, backoff));
          }
        }
      }
    }

    throw lastError || new Error('All candidate Gemini models failed');
  }

  async generateStructuredScene(prompt, systemPrompt) {
    const rawResponse = await this.callWithRetry(prompt, systemPrompt);
    return parseSceneJson(rawResponse);
  }
}

module.exports = {
  ERROR_TYPES,
  sanitizeLog,
  classifyError,
  GeminiClient
};
