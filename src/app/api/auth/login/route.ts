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

const loginSchema = z.object({
  identifier: z.string().min(1, 'Passenger name is required').optional(),
  email: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid credentials' },
        { status: 400 }
      );
    }

    const { identifier, email, password } = parsed.data;
    const loginId = (identifier || email || '').trim();
    const normalizedId = loginId.toLowerCase();

    if (!loginId) {
      return NextResponse.json({ error: 'Passenger name or email is required' }, { status: 400 });
    }

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // 1. Rate Limiting Check (5 attempts per 15 minutes)
    const rateLimit = await checkLoginRateLimit(normalizedId);
    if (rateLimit.isRateLimited) {
      await logAuditEvent({
        action: 'failed_login',
        metadata: {
          identifier: loginId,
          reason: 'rate_limited',
          retryAfterMinutes: rateLimit.retryAfterMinutes,
        },
        ipAddress,
      });

      return NextResponse.json(
        {
          error: `Too many failed attempts. Account locked for ${rateLimit.retryAfterMinutes} minutes for security.`,
        },
        { status: 429 }
      );
    }

    // 2. Fetch user by full_name OR email
    const supabase = getServiceRoleClient();
    let user: any = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, email, password_hash, full_name, role, is_active')
        .or(`email.ilike.${normalizedId},full_name.ilike.${loginId}`)
        .maybeSingle();
      if (!fetchError && data) user = data;
    } catch {}

    if (!user) {
      const { localDb } = await import('@/lib/local-store');
      user = localDb.getUsers().find(
        (u) =>
          u.full_name?.toLowerCase() === normalizedId ||
          u.email?.toLowerCase() === normalizedId
      );
    }

    if (!user) {
      recordLocalFailedAttempt(normalizedId);
      await logAuditEvent({
        action: 'failed_login',
        metadata: { identifier: loginId, reason: 'user_not_found' },
        ipAddress,
      });

      return NextResponse.json(
        {
          error: 'Invalid passenger name or password.',
          remainingAttempts: rateLimit.remainingAttempts - 1,
        },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'This account has been deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // 3. Verify password hash using bcrypt
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      recordLocalFailedAttempt(normalizedId);
      await logAuditEvent({
        userId: user.id,
        action: 'failed_login',
        metadata: { identifier: loginId, reason: 'invalid_password' },
        ipAddress,
      });

      return NextResponse.json(
        {
          error: 'Invalid passenger name or password.',
          remainingAttempts: rateLimit.remainingAttempts - 1,
        },
        { status: 401 }
      );
    }

    // 4. Successful login: reset rate limit & update last_login_at
    resetLoginAttempts(normalizedId);
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    await logAuditEvent({
      userId: user.id,
      action: 'login',
      metadata: { identifier: loginId, email: user.email, role: user.role },
      ipAddress,
    });

    // 5. Sign token & set cookie
    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });

    const cookieOptions = getSessionCookieOptions(user.role);
    const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      redirectTo,
    });

    response.cookies.set(cookieOptions.name, token, cookieOptions.options);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error during login.' },
      { status: 500 }
    );
  }
}
