import crypto from 'crypto';
import { cookies } from 'next/headers';
import { AuthSession, UserRole } from '@/types/database';

const SESSION_COOKIE_NAME = 'ticketscan_session';
const SECRET_KEY =
  process.env.SESSION_SECRET ||
  'ticketscan_super_secure_jwt_secret_key_32_characters_minimum_string';

export interface SessionTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string | null;
  exp: number; // unix timestamp in seconds
  iat: number;
}

/**
 * Encodes payload into a signed base64url JWT token
 */
export function signSessionToken(
  session: AuthSession,
  expiresInSeconds: number = 24 * 60 * 60
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;

  const payload: SessionTokenPayload = {
    userId: session.userId,
    email: session.email,
    role: session.role,
    fullName: session.fullName,
    iat,
    exp,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${b64Header}.${b64Payload}`;

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(signatureInput)
    .digest('base64url');

  return `${signatureInput}.${signature}`;
}

/**
 * Decodes and verifies a signed JWT session token
 */
export function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [b64Header, b64Payload, signature] = parts;
    const signatureInput = `${b64Header}.${b64Payload}`;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(signatureInput)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload: SessionTokenPayload = JSON.parse(
      Buffer.from(b64Payload, 'base64url').toString('utf-8')
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      // Token expired
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Read the current session from Next.js request cookies
 */
export async function getSession(): Promise<SessionTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Cookie config for session persistence
 */
export function getSessionCookieOptions(role: UserRole) {
  // Admin sessions expire in 30 minutes for security; Users 24 hours
  const maxAge = role === 'admin' ? 30 * 60 : 24 * 60 * 60;
  return {
    name: SESSION_COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge,
    },
  };
}
