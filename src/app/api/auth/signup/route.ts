import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/db';
import { hashPassword, logAuditEvent } from '@/lib/auth';
import { signSessionToken, getSessionCookieOptions } from '@/lib/session';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Passenger name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
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

    const { fullName, password, email } = parsed.data;
    const cleanName = fullName.trim();
    const sanitizedEmailUser = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedEmail = (email && email.trim()) ? email.toLowerCase().trim() : `${sanitizedEmailUser || 'passenger'}@passenger.local`;
    const supabase = getServiceRoleClient();

    // Check if user already exists by name OR email in Supabase
    let exists = false;
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, full_name, email')
        .or(`email.ilike.${normalizedEmail},full_name.ilike.${cleanName}`)
        .maybeSingle();

      if (existingUser) exists = true;
    } catch {}

    // Also check local database
    if (!exists) {
      const { localDb } = await import('@/lib/local-store');
      const localUsers = localDb.getUsers();
      if (localUsers.some((u) => u.full_name?.toLowerCase() === cleanName.toLowerCase() || u.email?.toLowerCase() === normalizedEmail)) {
        exists = true;
      }
    }

    if (exists) {
      return NextResponse.json(
        { error: 'An account with this passenger name already exists. Please sign in or choose another name.' },
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
