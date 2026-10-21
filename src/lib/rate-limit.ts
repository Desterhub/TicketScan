import { getServiceRoleClient } from './db';

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

// In-memory fallback map in case Supabase is offline/unconfigured
const localAttemptsMap = new Map<string, { count: number; firstAttemptAt: number }>();

/**
 * Checks whether an email/identifier has exceeded login rate limits
 */
export async function checkLoginRateLimit(identifier: string): Promise<{
  isRateLimited: boolean;
  remainingAttempts: number;
  retryAfterMinutes: number;
}> {
  const normalized = identifier.toLowerCase().trim();
  const cutoffTime = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  try {
    const supabase = getServiceRoleClient();
    // Count failed_login events for this user/email in audit_logs
    const { data, count, error } = await supabase
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'failed_login')
      .contains('metadata', { email: normalized })
      .gte('created_at', cutoffTime);

    if (!error && typeof count === 'number') {
      const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - count);
      return {
        isRateLimited: count >= MAX_FAILED_ATTEMPTS,
        remainingAttempts: remaining,
        retryAfterMinutes: WINDOW_MINUTES,
      };
    }
  } catch (err) {
    // Fall back to in-memory tracking
  }

  // Memory fallback check
  const now = Date.now();
  const entry = localAttemptsMap.get(normalized);
  if (!entry || now - entry.firstAttemptAt > WINDOW_MINUTES * 60 * 1000) {
    return { isRateLimited: false, remainingAttempts: MAX_FAILED_ATTEMPTS, retryAfterMinutes: WINDOW_MINUTES };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - entry.count);
  return {
    isRateLimited: entry.count >= MAX_FAILED_ATTEMPTS,
    remainingAttempts: remaining,
    retryAfterMinutes: Math.ceil((entry.firstAttemptAt + WINDOW_MINUTES * 60 * 1000 - now) / 60000),
  };
}

/**
 * Record a failed attempt
 */
export function recordLocalFailedAttempt(identifier: string) {
  const normalized = identifier.toLowerCase().trim();
  const now = Date.now();
  const entry = localAttemptsMap.get(normalized);

  if (!entry || now - entry.firstAttemptAt > WINDOW_MINUTES * 60 * 1000) {
    localAttemptsMap.set(normalized, { count: 1, firstAttemptAt: now });
  } else {
    localAttemptsMap.set(normalized, { count: entry.count + 1, firstAttemptAt: entry.firstAttemptAt });
  }
}

/**
 * Reset failed attempts upon successful login
 */
export function resetLoginAttempts(identifier: string) {
  const normalized = identifier.toLowerCase().trim();
  localAttemptsMap.delete(normalized);
}
