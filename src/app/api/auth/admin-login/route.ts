import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/db';
import { verifyPassword, logAuditEvent } from '@/lib/auth';
import { signSessionToken, getSessionCookieOptions } from '@/lib/session';
import {
  checkLoginRateLimit,
  recordLocalFailedAttempt,
  resetLoginAttempts,
} from '@/lib/rate-limit';

const adminLoginSchema = z.object({
  identifier: z.string().min(1, 'Admin username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Admin credentials required' },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const cleanId = identifier.trim().toLowerCase();
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // 1. Rate limiting check
    const rateLimit = await checkLoginRateLimit(`admin_${cleanId}`);
    if (rateLimit.isRateLimited) {
      await logAuditEvent({
        action: 'failed_login',
        metadata: {
          identifier: cleanId,
          targetRole: 'admin',
          reason: 'admin_rate_limited',
        },
        ipAddress,
      });

      return NextResponse.json(
        {
          error: `Security lockdown: Too many failed admin login attempts. Try again in ${rateLimit.retryAfterMinutes} minutes.`,
        },
        { status: 429 }
      );
    }

    // 2. Query user where role = 'admin' matching email or username
    const supabase = getServiceRoleClient();
    let adminUsers: any[] = [];

    try {
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('id, email, password_hash, full_name, role, is_active')
        .eq('role', 'admin');

      if (!fetchError && users && users.length > 0) {
        adminUsers = users;
      }
    } catch {}

    // Fallback to local database if Supabase returned no users
    if (adminUsers.length === 0) {
      const { localDb } = await import('@/lib/local-store');
      adminUsers = localDb.getUsers().filter((u) => u.role === 'admin');
    }

    if (adminUsers.length === 0) {
      recordLocalFailedAttempt(`admin_${cleanId}`);
      await logAuditEvent({
        action: 'failed_login',
        metadata: { identifier: cleanId, reason: 'no_admins_found' },
        ipAddress,
      });

      return NextResponse.json(
        { error: 'Invalid admin credentials or account uninitialized.' },
        { status: 401 }
      );
    }

    const users = adminUsers;

    // Find admin matching either exact email or username prefix
    const adminUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.email.toLowerCase().startsWith(`${cleanId}@`) ||
        u.full_name?.toLowerCase() === cleanId
    );

    if (!adminUser) {
      recordLocalFailedAttempt(`admin_${cleanId}`);
      await logAuditEvent({
        action: 'failed_login',
        metadata: { identifier: cleanId, reason: 'admin_user_not_found' },
        ipAddress,
      });

      return NextResponse.json(
        {
          error: 'Invalid admin credentials.',
          remainingAttempts: rateLimit.remainingAttempts - 1,
        },
        { status: 401 }
      );
    }

    if (!adminUser.is_active) {
      return NextResponse.json(
        { error: 'Admin account has been suspended.' },
        { status: 403 }
      );
    }

    // 3. Verify bcrypt hash
    const isValid = await verifyPassword(password, adminUser.password_hash);
    if (!isValid) {
      recordLocalFailedAttempt(`admin_${cleanId}`);
      await logAuditEvent({
        userId: adminUser.id,
        action: 'failed_login',
        metadata: { identifier: cleanId, targetRole: 'admin', reason: 'invalid_password' },
        ipAddress,
      });

      return NextResponse.json(
        {
          error: 'Invalid admin credentials.',
          remainingAttempts: rateLimit.remainingAttempts - 1,
        },
        { status: 401 }
      );
    }

    // 4. Success: reset rate limit & update login time
    resetLoginAttempts(`admin_${cleanId}`);
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id);

    await logAuditEvent({
      userId: adminUser.id,
      action: 'login',
      metadata: { event: 'admin_authenticated', role: 'admin' },
      ipAddress,
    });

    // 5. Sign token with 30-minute inactivity limit for admin
    const token = signSessionToken(
      {
        userId: adminUser.id,
        email: adminUser.email,
        role: 'admin',
        fullName: adminUser.full_name,
      },
      30 * 60 // 30 minutes
    );

    const cookieOptions = getSessionCookieOptions('admin');
    const response = NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.full_name,
        role: 'admin',
      },
      redirectTo: '/admin/dashboard',
    });

    response.cookies.set(cookieOptions.name, token, cookieOptions.options);
    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error during admin login.' },
      { status: 500 }
    );
  }
}
