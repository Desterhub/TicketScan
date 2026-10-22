import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getServiceRoleClient } from '@/lib/db';
import { logAuditEvent } from '@/lib/auth';
import { generateTicketsExcelWorkbook, generateUsersExcelWorkbook } from '@/lib/excel-export';

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
    let excelBuffer: Buffer;

    if (type === 'users') {
      let query = supabase
        .from('users')
        .select('id, email, full_name, role, is_active, created_at, last_login_at')
        .order('created_at', { ascending: false });

      if (fromDate) query = query.gte('created_at', fromDate);
      if (toDate) query = query.lte('created_at', toDate);

      const { data: users, error } = await query;
      if (error) throw error;

      excelBuffer = await generateUsersExcelWorkbook(users || [], session.email || 'Admin');
    } else {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fromDate) query = query.gte('created_at', fromDate);
      if (toDate) query = query.lte('created_at', toDate);

      const { data: tickets, error } = await query;
      if (error) throw error;

      const filterLabel = fromDate && toDate ? `Period: ${fromDate} to ${toDate}` : 'Complete Dataset (All Time)';
      excelBuffer = await generateTicketsExcelWorkbook({
        tickets: tickets || [],
        generatedBy: session.email || 'Admin',
        filterLabel,
      });
    }

    // Record audit event
    await logAuditEvent({
      userId: session.userId,
      action: 'export',
      metadata: { exportType: type, fromDate, toDate },
    });

    const dateTag = new Date().toISOString().split('T')[0];
    const filename = `TicketScan_${type === 'tickets' ? 'Enterprise_Manifest_Analytics' : 'Users_Directory'}_${dateTag}.xlsx`;

    return new NextResponse(excelBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Export route error:', error);
    return NextResponse.json({ error: error?.message || 'Export error' }, { status: 500 });
  }
}
