/**
 * Structured Logging System for AetherMaster AI (Agent 3)
 * Provides structured, audit-ready logs for game sessions, turns, combat, and actions.
 * Masks sensitive information (API keys, authorization tokens, passwords, secrets).
 */

const SENSITIVE_PATTERNS = [
  /api[-_]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /authorization/i,
  /bearer\s+[a-zA-Z0-9_\-\.]+/i,
  /AIzaSy[a-zA-Z0-9_\-]{30,40}/g // Google Gemini API Key pattern
];

/**
 * Recursively sanitize objects and strings to redact sensitive credentials.
 */
function sanitizeData(data, depth = 0) {
  if (depth > 6) return '[MAX_DEPTH]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    let sanitized = data;
    // Mask explicit Gemini API Keys
    sanitized = sanitized.replace(/AIzaSy[a-zA-Z0-9_\-]{30,40}/g, '***REDACTED_API_KEY***');
    // Mask Bearer tokens
    sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer ***REDACTED_TOKEN***');
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitiveKey = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      if (isSensitiveKey) {
        clean[key] = '***REDACTED***';
      } else {
        clean[key] = sanitizeData(value, depth + 1);
      }
    }
    return clean;
  }

  return data;
}

const logger = {
  /**
   * Log player action lifecycle with structured metrics
   */
  logPlayerTurn({
    turn,
    sessionId,
    playerAction,
    resolvedIntent,
    hpBefore,
    hpAfter,
    narrativeResult,
    extra = {}
  }) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      type: 'PLAYER_TURN',
      turn: turn ?? null,
      sessionId: sessionId ?? 'unknown',
      playerAction: sanitizeData(playerAction),
      resolvedIntent: resolvedIntent ?? 'UNKNOWN',
      hpTransition: {
        before: hpBefore ?? null,
        after: hpAfter ?? null,
        delta: (hpBefore !== undefined && hpAfter !== undefined) ? (hpAfter - hpBefore) : 0
      },
      narrativeResult: sanitizeData(narrativeResult),
      metadata: sanitizeData(extra)
    };

    console.log(`[GAME_TURN][Turn ${entry.turn}][Session: ${entry.sessionId}] Action: "${typeof entry.playerAction === 'string' ? entry.playerAction : JSON.stringify(entry.playerAction)}" | Intent: ${entry.resolvedIntent} | HP: ${entry.hpTransition.before} -> ${entry.hpTransition.after}`);
    return entry;
  },

  /**
   * Log tactical combat actions
   */
  logCombatAction({
    sessionId,
    round,
    action,
    enemyName,
    damageDealt = 0,
    damageReceived = 0,
    playerHp,
    enemyHp,
    status = 'ACTIVE'
  }) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      type: 'COMBAT_ACTION',
      sessionId: sessionId ?? 'unknown',
      round: round ?? 1,
      action: action ?? 'ATTACK',
      enemyName: enemyName ?? 'Unknown Enemy',
      damageDealt,
      damageReceived,
      playerHp,
      enemyHp,
      status
    };

    console.log(`[COMBAT][Session: ${entry.sessionId}][Round ${entry.round}] ${entry.action} vs ${entry.enemyName} | Dealt: ${damageDealt}, Recv: ${damageReceived} | HP: Player ${playerHp}, Enemy ${enemyHp} | Status: ${status}`);
    return entry;
  },

  /**
   * General info log with automatic redaction
   */
  info(message, meta = {}) {
    const sanitizedMeta = sanitizeData(meta);
    console.log(`[INFO] ${message}`, Object.keys(sanitizedMeta).length ? JSON.stringify(sanitizedMeta) : '');
  },

  /**
   * General warning log with automatic redaction
   */
  warn(message, meta = {}) {
    const sanitizedMeta = sanitizeData(meta);
    console.warn(`[WARN] ${message}`, Object.keys(sanitizedMeta).length ? JSON.stringify(sanitizedMeta) : '');
  },

  /**
   * General error log with automatic redaction and safety
   */
  error(message, errorOrMeta = {}) {
    let cleanMeta = {};
    if (errorOrMeta instanceof Error) {
      cleanMeta = {
        message: sanitizeData(errorOrMeta.message),
        name: errorOrMeta.name
      };
      if (process.env.NODE_ENV !== 'production') {
        cleanMeta.stack = sanitizeData(errorOrMeta.stack);
      }
    } else {
      cleanMeta = sanitizeData(errorOrMeta);
    }
    console.error(`[ERROR] ${message}`, JSON.stringify(cleanMeta));
  },

  sanitize: sanitizeData
};

module.exports = logger;
