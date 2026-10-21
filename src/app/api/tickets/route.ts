import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getServiceRoleClient } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const mode = searchParams.get('mode') || 'all';
    const status = searchParams.get('status') || 'all';
    const risk = searchParams.get('risk') || 'all';
    const forAdmin = searchParams.get('forAdmin') === 'true' && session.role === 'admin';

    const supabase = getServiceRoleClient();
    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });

    // Non-admins can only see their own tickets
    if (!forAdmin) {
      query = query.eq('user_id', session.userId);
    }

    if (mode !== 'all') {
      query = query.eq('transport_mode', mode);
    }

    if (status !== 'all') {
      query = query.eq('booking_status', status);
    }

    if (risk === 'low') {
      query = query.lte('tamper_risk_score', 0.3);
    } else if (risk === 'medium') {
      query = query.gt('tamper_risk_score', 0.3).lte('tamper_risk_score', 0.65);
    } else if (risk === 'high') {
      query = query.gt('tamper_risk_score', 0.65);
    }

    let tickets: any[] = [];
    try {
      const { data, error } = await query;
      if (!error && data) {
        tickets = data;
      }
    } catch {}

    if (tickets.length === 0) {
      const { localDb } = await import('@/lib/local-store');
      let all = localDb.getTickets();
      if (!forAdmin) {
        all = all.filter((t) => t.user_id === session.userId);
      }
      if (mode !== 'all') {
        all = all.filter((t) => t.transport_mode === mode);
      }
      if (status !== 'all') {
        all = all.filter((t) => t.booking_status === status);
      }
      if (risk === 'low') {
        all = all.filter((t) => Number(t.tamper_risk_score || 0) <= 0.3);
      } else if (risk === 'medium') {
        all = all.filter((t) => Number(t.tamper_risk_score || 0) > 0.3 && Number(t.tamper_risk_score || 0) <= 0.65);
      } else if (risk === 'high') {
        all = all.filter((t) => Number(t.tamper_risk_score || 0) > 0.65);
      }
      tickets = all;
    }

    // In-memory text filter for search query across passenger, PNR, carrier, routes
    let filtered = tickets || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.passenger_name?.toLowerCase().includes(q) ||
          t.pnr_booking_id?.toLowerCase().includes(q) ||
          t.carrier_name?.toLowerCase().includes(q) ||
          t.boarding_place?.toLowerCase().includes(q) ||
          t.destination_place?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, tickets: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
