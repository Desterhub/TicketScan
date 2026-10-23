import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { uploadTicketFile } from '@/lib/storage';
import { extractTicketData } from '@/lib/ai-extraction';
import { analyzeTamperSignals } from '@/lib/tamper-detection';
import { getServiceRoleClient } from '@/lib/db';
import { logAuditEvent } from '@/lib/auth';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
];

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required to upload.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form-data.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds maximum allowed size (15MB).' },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.includes(mimeType) && !file.name.match(/\.(pdf|jpe?g|png|heic|webp)$/i)) {
      return NextResponse.json(
        { error: 'Unsupported format. Allowed: PDF, JPG, PNG, HEIC, WebP.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const fileType = mimeType === 'application/pdf' || file.name.endsWith('.pdf') ? 'pdf' : 'image';

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // 1. Upload to Private Storage
    const { filePath } = await uploadTicketFile({
      fileBuffer,
      fileName: file.name,
      mimeType,
      userId: session.userId,
    });

    // 2. Run Parallel AI Extraction & Tamper Detection
    const [extractionResult, tamperResult] = await Promise.all([
      extractTicketData({
        fileBuffer,
        mimeType,
        fileName: file.name,
      }),
      analyzeTamperSignals({
        fileBuffer,
        mimeType,
        fileName: file.name,
      }),
    ]);

    const { data: extracted, rawResponse } = extractionResult;
    const { tamperRiskScore, signals: tamperSignals } = tamperResult;

    // 3. Persist Ticket to Database
    const supabase = getServiceRoleClient();
    let ticket: any = null;

    try {
      const { data, error: dbError } = await supabase
        .from('tickets')
        .insert({
          user_id: session.userId,
          file_path: filePath,
          file_type: fileType,
          transport_mode: extracted.transport_mode,
          passenger_name: extracted.passenger_name,
          passenger_age: extracted.passenger_age,
          booking_status: extracted.booking_status,
          pnr_booking_id: extracted.pnr_booking_id,
          boarding_place: extracted.boarding_place,
          destination_place: extracted.destination_place,
          departure_datetime: extracted.departure_datetime,
          arrival_datetime: extracted.arrival_datetime,
          carrier_name: extracted.carrier_name,
          seat_class_coach: extracted.seat_class_coach,
          raw_extraction_json: rawResponse,
          extraction_confidence: extracted.extraction_confidence,
          tamper_risk_score: tamperRiskScore,
          tamper_signals: tamperSignals,
          manually_corrected: false,
        })
        .select('*')
        .single();

      if (!dbError && data) {
        ticket = data;
      }
    } catch {}

    if (!ticket) {
      const { localDb } = await import('@/lib/local-store');
      const tickets = localDb.getTickets();
      ticket = {
        id: `t-${Date.now()}`,
        user_id: session.userId,
        file_path: filePath,
        file_type: fileType,
        transport_mode: extracted.transport_mode,
        passenger_name: extracted.passenger_name,
        passenger_age: extracted.passenger_age,
        booking_status: extracted.booking_status,
        pnr_booking_id: extracted.pnr_booking_id,
        boarding_place: extracted.boarding_place,
        destination_place: extracted.destination_place,
        departure_datetime: extracted.departure_datetime,
        arrival_datetime: extracted.arrival_datetime,
        carrier_name: extracted.carrier_name,
        seat_class_coach: extracted.seat_class_coach,
        raw_extraction_json: rawResponse,
        extraction_confidence: extracted.extraction_confidence,
        tamper_risk_score: tamperRiskScore,
        tamper_signals: tamperSignals,
        manually_corrected: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      tickets.unshift(ticket);
      localDb.saveTickets(tickets);
    }

    // 4. Record Audit Log
    await logAuditEvent({
      userId: session.userId,
      action: 'upload',
      targetTicketId: ticket.id,
      metadata: {
        fileName: file.name,
        fileType,
        fileSize: file.size,
        transportMode: extracted.transport_mode,
        tamperRiskScore,
      },
      ipAddress,
    });

    // 5. Asynchronously pre-cache origin and destination images (non-blocking)
    if (extracted.boarding_place || extracted.destination_place) {
      import('@/lib/location-images').then(({ getOrResolveLocationImage }) => {
        Promise.all([
          extracted.boarding_place
            ? getOrResolveLocationImage(extracted.boarding_place, extracted.transport_mode)
            : null,
          extracted.destination_place
            ? getOrResolveLocationImage(extracted.destination_place, extracted.transport_mode)
            : null,
        ]).catch((err) => console.warn('Async location image pre-caching notice:', err));
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      ticket,
      extraction: extracted,
      tamper: tamperResult,
    });
  } catch (error: any) {
    console.error('Upload processing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process ticket upload.' },
      { status: 500 }
    );
  }
}
