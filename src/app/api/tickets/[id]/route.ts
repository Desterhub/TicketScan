import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getServiceRoleClient } from '@/lib/db';
import { getSignedFileUrl, deleteTicketFile } from '@/lib/storage';
import { logAuditEvent } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getServiceRoleClient();

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Access control: User can only see their own ticket, Admin can see all
    if (ticket.user_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate fresh signed URL with 5-minute expiration
    const signedUrl = await getSignedFileUrl(ticket.file_path);

    // If an admin is inspecting another user's ticket, record audit log
    if (session.role === 'admin' && ticket.user_id !== session.userId) {
      await logAuditEvent({
        userId: session.userId,
        action: 'admin_view',
        targetTicketId: ticket.id,
        metadata: { ticketOwnerId: ticket.user_id, pnr: ticket.pnr_booking_id },
      });
    }

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        signedUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const supabase = getServiceRoleClient();

    // Verify existing ticket
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id, user_id, pnr_booking_id')
      .eq('id', id)
      .maybeSingle();

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (existingTicket.user_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update allowable fields
    const {
      passenger_name,
      passenger_age,
      transport_mode,
      carrier_name,
      booking_status,
      pnr_booking_id,
      boarding_place,
      destination_place,
      departure_datetime,
      arrival_datetime,
      seat_class_coach,
    } = body;

    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update({
        passenger_name,
        passenger_age: passenger_age ? Number(passenger_age) : null,
        transport_mode,
        carrier_name,
        booking_status,
        pnr_booking_id,
        boarding_place,
        destination_place,
        departure_datetime,
        arrival_datetime,
        seat_class_coach,
        manually_corrected: true,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Record audit event
    await logAuditEvent({
      userId: session.userId,
      action: 'edit_field',
      targetTicketId: id,
      metadata: { editedFields: Object.keys(body) },
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getServiceRoleClient();

    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, user_id, file_path, pnr_booking_id')
      .eq('id', id)
      .maybeSingle();

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.user_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete from DB and file storage
    await supabase.from('tickets').delete().eq('id', id);
    if (ticket.file_path) {
      await deleteTicketFile(ticket.file_path);
    }

    await logAuditEvent({
      userId: session.userId,
      action: 'delete_ticket',
      targetTicketId: id,
      metadata: { pnr: ticket.pnr_booking_id },
    });

    return NextResponse.json({ success: true, message: 'Ticket deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
