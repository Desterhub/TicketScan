import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { logAuditEvent } from '@/lib/auth';

export async function POST() {
  const session = await getSession();
  if (session) {
    await logAuditEvent({
      userId: session.userId,
      action: 'login', // logged out event tag
      metadata: { event: 'logout', email: session.email },
    });
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete('ticketscan_session');
  return response;
}
