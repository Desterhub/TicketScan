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

    const { data: tickets, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
