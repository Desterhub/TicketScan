import { NextRequest, NextResponse } from 'next/server';
import { getPolicies, getPolicyByBookingId, savePolicy, evaluateGeofenceRadius, calculatePremiums } from '@/lib/tixsurance';
import { TixsurancePolicy } from '@/types/tixsurance';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');
  const policyId = searchParams.get('id');

  const policies = getPolicies();

  if (bookingId) {
    const policy = getPolicyByBookingId(bookingId);
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found for this Booking ID' }, { status: 404 });
    }
    return NextResponse.json({ policy });
  }

  if (policyId) {
    const policy = policies.find((p) => p.id === policyId);
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }
    return NextResponse.json({ policy });
  }

  return NextResponse.json({ policies });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      ticketFare = 3600,
      attendee,
      stayShield,
      travelShield,
      isPostBookingGraceWindow = false,
      ticketId,
    } = body;

    if (!bookingId || !attendee?.fullName || !attendee?.email) {
      return NextResponse.json({ error: 'Missing required attendee or booking details' }, { status: 400 });
    }

    // Evaluate 100km Geofence
    const geofence = evaluateGeofenceRadius(attendee.permanentAddress || {});
    
    // Calculate premiums
    const stayAmt = stayShield && !stayShield.optOut ? Number(stayShield.amountBooked || 0) : 0;
    const travelAmt = travelShield && !travelShield.optOut ? Number(travelShield.amountBooked || 0) : 0;
    
    const premiums = calculatePremiums({
      ticketFare: Number(ticketFare),
      isPostBookingGraceWindow,
      stayAmount: stayAmt,
      travelAmount: travelAmt,
    });

    const newPolicy: TixsurancePolicy = {
      id: `POL-TIX-${Date.now().toString().slice(-6)}`,
      bookingId: bookingId.trim().toUpperCase(),
      ticketId,
      userId: 'current-user',
      ticketFare: Number(ticketFare),
      eventVenueCity: 'Navi Mumbai',
      eventVenueAddress: 'DY Patil Sports Stadium, Sector 7, Nerul, Navi Mumbai',
      distanceKm: geofence.distanceKm,
      policyType: geofence.policyType, // <=100km: LOCAL, >100km: OUTSTATION
      premiumRate: premiums.rate,
      ticketPremium: premiums.ticketPremium,
      totalPremiumPaid: premiums.totalPremium,
      attendee,
      stayShield: stayShield ? {
        ...stayShield,
        premiumRate: premiums.rate,
        premiumToPay: premiums.stayPremium,
      } : undefined,
      travelShield: travelShield ? {
        ...travelShield,
        premiumRate: premiums.rate,
        premiumToPay: premiums.travelPremium,
      } : undefined,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = savePolicy(newPolicy);
    return NextResponse.json({ success: true, policy: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save policy' }, { status: 500 });
  }
}
