import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/db';
import { hashPassword, logAuditEvent } from '@/lib/auth';
import { signSessionToken, getSessionCookieOptions } from '@/lib/session';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required').optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { email, password, fullName } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getServiceRoleClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // Create user record
    let newUser: any = null;
    try {
      const { data, error: createError } = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          password_hash: passwordHash,
          full_name: fullName || normalizedEmail.split('@')[0],
          role: 'user',
          is_active: true,
          last_login_at: new Date().toISOString(),
        })
        .select('id, email, full_name, role, created_at')
        .single();
      if (!createError && data) newUser = data;
    } catch {}

    if (!newUser) {
      const { localDb } = await import('@/lib/local-store');
      const users = localDb.getUsers();
      newUser = {
        id: `u-${Date.now()}`,
        email: normalizedEmail,
        password_hash: passwordHash,
        full_name: fullName || normalizedEmail.split('@')[0],
        role: 'user',
        is_active: true,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      };
      users.push(newUser);
      localDb.saveUsers(users);
    }

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Log audit event
    await logAuditEvent({
      userId: newUser.id,
      action: 'login',
      metadata: { event: 'signup_and_first_login', email: normalizedEmail },
      ipAddress,
    });

    // Create signed session token
    const token = signSessionToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.full_name,
    });

    const cookieOptions = getSessionCookieOptions(newUser.role);
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
      },
      redirectTo: '/dashboard',
    });

    response.cookies.set(cookieOptions.name, token, cookieOptions.options);
    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
