import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getServiceRoleClient } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = getServiceRoleClient();

    // Fetch all users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at, last_login_at')
      .order('created_at', { ascending: false });

    let allUsers = users;
    if (userError || !allUsers || allUsers.length === 0) {
      const { localDb } = await import('@/lib/local-store');
      allUsers = localDb.getUsers() as any;
    }

    // Fetch ticket counts per user
    const { data: tickets } = await supabase.from('tickets').select('user_id');
    const countsMap: Record<string, number> = {};
    if (tickets && tickets.length > 0) {
      tickets.forEach((t) => {
        countsMap[t.user_id] = (countsMap[t.user_id] || 0) + 1;
      });
    } else {
      const { localDb } = await import('@/lib/local-store');
      localDb.getTickets().forEach((t) => {
        countsMap[t.user_id] = (countsMap[t.user_id] || 0) + 1;
      });
    }

    const enrichedUsers = (allUsers || []).map((u) => ({
      ...u,
      ticket_count: countsMap[u.id] || 0,
    }));

    return NextResponse.json({ success: true, users: enrichedUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
