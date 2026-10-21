import bcrypt from 'bcrypt';
import { AuthSession, AuditAction } from '@/types/database';
import { getServiceRoleClient } from './db';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare plain text password against bcrypt hash
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Record an audit log entry in the audit_logs table
 */
export async function logAuditEvent({
  userId,
  action,
  targetTicketId,
  metadata = {},
  ipAddress,
}: {
  userId?: string | null;
  action: AuditAction;
  targetTicketId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  try {
    const supabase = getServiceRoleClient();
    await supabase.from('audit_logs').insert({
      user_id: userId || null,
      action,
      target_ticket_id: targetTicketId || null,
      metadata,
      ip_address: ipAddress || null,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
