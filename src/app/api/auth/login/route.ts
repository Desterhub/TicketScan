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
  email: z.string().min(1, 'Email is required'),
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

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // 1. Rate Limiting Check (5 attempts per 15 minutes)
    const rateLimit = await checkLoginRateLimit(normalizedEmail);
    if (rateLimit.isRateLimited) {
      await logAuditEvent({
        action: 'failed_login',
        metadata: {
          email: normalizedEmail,
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

    // 2. Fetch user by email
    const supabase = getServiceRoleClient();
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, password_hash, full_name, role, is_active')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (fetchError || !user) {
      recordLocalFailedAttempt(normalizedEmail);
      await logAuditEvent({
        action: 'failed_login',
        metadata: { email: normalizedEmail, reason: 'user_not_found' },
        ipAddress,
      });

      return NextResponse.json(
        {
          error: 'Invalid email or password.',
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
      recordLocalFailedAttempt(normalizedEmail);
      await logAuditEvent({
        userId: user.id,
        action: 'failed_login',
        metadata: { email: normalizedEmail, reason: 'invalid_password' },
        ipAddress,
      });

      return NextResponse.json(
        {
          error: 'Invalid email or password.',
          remainingAttempts: rateLimit.remainingAttempts - 1,
        },
        { status: 401 }
      );
    }

    // 4. Successful login: reset rate limit & update last_login_at
    resetLoginAttempts(normalizedEmail);
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    await logAuditEvent({
      userId: user.id,
      action: 'login',
      metadata: { email: normalizedEmail, role: user.role },
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
