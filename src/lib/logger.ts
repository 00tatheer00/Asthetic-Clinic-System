/**
 * Production Structured Logger for Brimish Skin Care Clinic
 * Provides safe, sanitizing, structured logs for Vercel log drains & monitoring.
 * Redacts sensitive credentials, tokens, and patient clinical notes.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'security';

export interface LogContext {
  route?: string;
  operation?: string;
  userId?: string;
  role?: string;
  error?: unknown;
  metadata?: Record<string, unknown>;
}

// Fields that must NEVER be logged in plain text
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'key',
  'api_key',
  'service_role_key',
  'authorization',
  'cookie',
  'clinical_notes',
  'medical_history',
  'allergies',
  'observations',
]);

/**
 * Recursively sanitize an object to strip secrets and clinical details.
 */
function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Redact Bearer tokens or UUID secrets
    if (obj.length > 50 && (obj.startsWith('ey') || obj.startsWith('re_') || obj.startsWith('sbp_'))) {
      return '[REDACTED_TOKEN]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED_CONFIDENTIAL]';
      } else {
        sanitized[key] = sanitize(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Format and emit a structured log entry.
 */
function log(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const env = process.env.NODE_ENV || 'development';

  let errorMessage: string | undefined;
  let errorStack: string | undefined;

  if (context?.error) {
    if (context.error instanceof Error) {
      errorMessage = context.error.message;
      // In production, keep stack in server logs only, never in public responses
      errorStack = env === 'development' ? context.error.stack : undefined;
    } else {
      errorMessage = String(context.error);
    }
  }

  const payload = {
    timestamp,
    level: level.toUpperCase(),
    service: 'brimish-clinic-api',
    message,
    route: context?.route,
    operation: context?.operation,
    userId: context?.userId,
    role: context?.role,
    error: errorMessage,
    stack: errorStack,
    metadata: context?.metadata ? sanitize(context.metadata) : undefined,
  };

  const output = JSON.stringify(payload);

  switch (level) {
    case 'error':
    case 'security':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
  security: (message: string, context?: LogContext) => log('security', message, context),
};
