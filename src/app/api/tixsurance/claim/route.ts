import { NextRequest, NextResponse } from 'next/server';
import { getClaims, getClaimByBookingId, saveClaim, getPolicyByBookingId, TIXSURANCE_HUB } from '@/lib/tixsurance';
import { TixsuranceClaim } from '@/types/tixsurance';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');

  if (bookingId) {
    const claim = getClaimByBookingId(bookingId);
    if (!claim) {
      return NextResponse.json({ error: 'No claim on record for this Booking ID' }, { status: 404 });
    }
    return NextResponse.json({ claim });
  }

  const claims = getClaims();
  return NextResponse.json({ claims });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      policyId,
      claimReason,
      proofOfEmergencyUrl,
      proofOfEmergencyName,
      packagingVideoUrl,
      packagingVideoName,
      stayCancellationReceiptUrl,
      stayCancellationReceiptName,
      travelCancellationReceiptUrl,
      travelCancellationReceiptName,
    } = body;

    if (!bookingId || !claimReason || !proofOfEmergencyUrl) {
      return NextResponse.json(
        { error: 'Booking ID, Reason for cancellation, and Proof of Emergency are strictly mandatory' },
        { status: 400 }
      );
    }

    const policy = getPolicyByBookingId(bookingId);
    const policyType = policy?.policyType || 'LOCAL';
    const payoutAmount = policy?.ticketFare || 3600;

    // 12-Hour physical hub delivery deadline for local claims
    const deadline = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
    const dueDate = new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const newClaim: TixsuranceClaim = {
      id: `CLM-TIX-${Date.now().toString().slice(-6)}`,
      policyId: policyId || policy?.id || 'POL-UNKNOWN',
      bookingId: bookingId.trim().toUpperCase(),
      userId: policy?.userId || 'current-user',
      policyType,
      claimReason,
      proofOfEmergencyUrl,
      proofOfEmergencyName: proofOfEmergencyName || 'Emergency_Proof_Document.pdf',
      
      // Local specifics
      packagingVideoUrl,
      packagingVideoName,
      hubAddress: TIXSURANCE_HUB.address,
      hubContactPhone: TIXSURANCE_HUB.phone,
      hubDeliveryDeadline: deadline,
      wristbandStatus: policyType === 'LOCAL' ? 'IN_TRANSIT' : 'VERIFIED',
      bandSerialVerified: false,

      // Outstation specifics
      stayCancellationReceiptUrl,
      stayCancellationReceiptName,
      travelCancellationReceiptUrl,
      travelCancellationReceiptName,

      // Status
      claimStatus: policyType === 'LOCAL' ? 'HELD_PENDING_BAND' : 'UNDER_REVIEW',
      payoutAmount,
      payoutDueDate: dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = saveClaim(newClaim);
    return NextResponse.json({ success: true, claim: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to file claim' }, { status: 500 });
  }
}
