import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getServiceRoleClient } from '@/lib/db';
import { logAuditEvent } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'tickets'; // 'tickets' or 'users'
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    const supabase = getServiceRoleClient();
    const wb = XLSX.utils.book_new();

    if (type === 'users') {
      let query = supabase
        .from('users')
        .select('id, email, full_name, role, is_active, created_at, last_login_at')
        .order('created_at', { ascending: false });

      if (fromDate) query = query.gte('created_at', fromDate);
      if (toDate) query = query.lte('created_at', toDate);

      const { data: users, error } = await query;
      if (error) throw error;

      const userRows = (users || []).map((u) => ({
        'User ID': u.id,
        Email: u.email,
        'Full Name': u.full_name || 'N/A',
        Role: u.role,
        Active: u.is_active ? 'Yes' : 'No',
        'Created At': u.created_at,
        'Last Login': u.last_login_at || 'Never',
      }));

      const ws = XLSX.utils.json_to_sheet(userRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Users');
    } else {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fromDate) query = query.gte('created_at', fromDate);
      if (toDate) query = query.lte('created_at', toDate);

      const { data: tickets, error } = await query;
      if (error) throw error;

      const ticketRows = (tickets || []).map((t) => ({
        'Ticket ID': t.id,
        'User ID': t.user_id,
        'Transport Mode': t.transport_mode,
        'Passenger Name': t.passenger_name || 'N/A',
        'Passenger Age': t.passenger_age || 'N/A',
        Carrier: t.carrier_name || 'N/A',
        Status: t.booking_status,
        'PNR / Booking ID': t.pnr_booking_id || 'N/A',
        Origin: t.boarding_place || 'N/A',
        Destination: t.destination_place || 'N/A',
        Departure: t.departure_datetime || 'N/A',
        Arrival: t.arrival_datetime || 'N/A',
        'Seat / Coach': t.seat_class_coach || 'N/A',
        'AI Confidence': t.extraction_confidence,
        'Tamper Risk Score': t.tamper_risk_score,
        'Manually Corrected': t.manually_corrected ? 'Yes' : 'No',
        'Created At': t.created_at,
      }));

      const ws = XLSX.utils.json_to_sheet(ticketRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
    }

    // Write to Excel buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Record audit event
    await logAuditEvent({
      userId: session.userId,
      action: 'export',
      metadata: { exportType: type, fromDate, toDate },
    });

    const filename = `TicketScan_${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Export error' }, { status: 500 });
  }
}
