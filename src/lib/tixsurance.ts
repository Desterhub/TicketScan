import {
  TixsurancePolicy,
  TixsuranceClaim,
  TixsurancePolicyType,
  TixsuranceAddress,
} from '@/types/tixsurance';

export const TIXSURANCE_HUB = {
  name: 'Tixsurance Verification Hub',
  address: 'Empressa 14, Western Express Highway, Sahar Rd, Andheri East, Mumbai - 400069, Maharashtra',
  phone: '+91 90821 77312',
  hours: '24/7 Intake for Event Wristbands',
};

export const DEFAULT_EVENT_VENUE = {
  name: 'DY Patil Sports Stadium',
  city: 'Navi Mumbai',
  state: 'Maharashtra',
  postalCode: '400706',
};

/**
 * 100km Geofence Radius Calculation
 * <= 100km: LOCAL policy (requires physical band return on claim)
 * > 100km: OUTSTATION policy (requires stay & travel insurance shields)
 */
export function evaluateGeofenceRadius(
  address: Partial<TixsuranceAddress>,
  venueCity: string = DEFAULT_EVENT_VENUE.city
): { distanceKm: number; policyType: TixsurancePolicyType; description: string } {
  const city = (address.city || '').trim().toLowerCase();
  const state = (address.state || '').trim().toLowerCase();
  const pCode = (address.postalCode || '').trim();

  // Known city distances relative to Mumbai Metropolitan Event Corridors (DY Patil / Bandra)
  const knownDistances: Record<string, number> = {
    mumbai: 18,
    'navi mumbai': 8,
    thane: 24,
    kalyan: 42,
    panvel: 22,
    dombivli: 38,
    vasai: 56,
    virar: 68,
    karjat: 65,
    alibaug: 92,
    lonavala: 82,
    // > 100km (Outstation)
    pune: 148,
    nashik: 165,
    surat: 285,
    satara: 255,
    aurangabad: 335,
    chhatrapati_sambhajinagar: 335,
    kolhapur: 375,
    ahmedabad: 525,
    vadodara: 410,
    delhi: 1420,
    bengaluru: 980,
    bangalore: 980,
    hyderabad: 710,
    jaipur: 1145,
    kolkata: 1960,
    chennai: 1330,
    goa: 580,
    indore: 585,
    chandigarh: 1650,
    lucknow: 1370,
  };

  let dist = 35; // Default local if in MMR

  if (knownDistances[city] !== undefined) {
    dist = knownDistances[city];
  } else if (pCode.startsWith('400') || pCode.startsWith('401') || pCode.startsWith('410')) {
    dist = 45; // MMR / Thane / Raigad local postal circle
  } else if (state === 'maharashtra') {
    dist = 180; // General Maharashtra outstation
  } else {
    dist = 650; // Interstate outstation
  }

  const isLocal = dist <= 100;

  return {
    distanceKm: dist,
    policyType: isLocal ? 'LOCAL' : 'OUTSTATION',
    description: isLocal
      ? `Local Radius (${dist} km <= 100 km) — Physical wristband return required if claim is filed`
      : `Outstation (${dist} km > 100 km) — Eligible for Travel & Accommodation Protection Shield`,
  };
}

/**
 * Premium Calculation
 * Checkout rate: 5% (0.05)
 * 48h Post-booking Grace Window rate: 7% (0.07)
 */
export function calculatePremiums(options: {
  ticketFare: number;
  isPostBookingGraceWindow?: boolean;
  stayAmount?: number;
  travelAmount?: number;
}) {
  const { ticketFare, isPostBookingGraceWindow = false, stayAmount = 0, travelAmount = 0 } = options;
  const rate: 0.05 | 0.07 = isPostBookingGraceWindow ? 0.07 : 0.05;

  const ticketPremium = Math.round(ticketFare * rate);
  const stayPremium = Math.round((stayAmount || 0) * rate);
  const travelPremium = Math.round((travelAmount || 0) * rate);
  const totalPremium = ticketPremium + stayPremium + travelPremium;

  return {
    rate,
    ratePercentage: `${rate * 100}%`,
    ticketPremium,
    stayPremium,
    travelPremium,
    totalPremium,
  };
}

// In-Memory persistent store for runtime environment
let inMemoryPolicies: TixsurancePolicy[] = [
  {
    id: 'POL-TIX-001',
    bookingId: 'FAREDEMO2139XG',
    ticketId: 't-demo-001',
    userId: 'admin-user-id',
    ticketFare: 3600,
    eventVenueCity: 'Navi Mumbai',
    eventVenueAddress: 'DY Patil Sports Stadium, Sector 7, Nerul, Navi Mumbai',
    distanceKm: 28,
    policyType: 'LOCAL',
    premiumRate: 0.05,
    ticketPremium: 180,
    totalPremiumPaid: 180,
    attendee: {
      fullName: 'Tirth Dixit Shah',
      email: 'tirth.shah@example.com',
      phone: '+91 98200 12345',
      permanentAddress: {
        addressLine1: 'Flat 402, Sea Green Apartments, JVPD Scheme',
        addressLine2: 'Gulmohar Cross Road 9, Juhu',
        country: 'India',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400049',
      },
      billingAddressSame: true,
      governmentIdPhotoUrl: '/demo/aadhar_card.jpg',
    },
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
  {
    id: 'POL-TIX-002',
    bookingId: 'LYEMA-7729',
    ticketId: 't-demo-002',
    userId: 'admin-user-id',
    ticketFare: 11070,
    eventVenueCity: 'Navi Mumbai',
    eventVenueAddress: 'DY Patil Sports Stadium, Sector 7, Nerul, Navi Mumbai',
    distanceKm: 1420,
    policyType: 'OUTSTATION',
    premiumRate: 0.05,
    ticketPremium: 554,
    totalPremiumPaid: 1354,
    attendee: {
      fullName: 'Dhwani Piyush Shah',
      email: 'dhwani.shah@example.com',
      phone: '+91 98111 88442',
      permanentAddress: {
        addressLine1: 'B-14, Defence Colony',
        addressLine2: 'Ring Road',
        country: 'India',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110024',
      },
      billingAddressSame: true,
      governmentIdPhotoUrl: '/demo/dl_delhi.jpg',
    },
    stayShield: {
      optOut: false,
      guestFullName: 'Dhwani Piyush Shah',
      guestEmail: 'dhwani.shah@example.com',
      guestPhone: '+91 98111 88442',
      hotelBookingDocName: 'Taj_Santacruz_Booking_Confirmation.pdf',
      amountBooked: 8500,
      premiumRate: 0.05,
      premiumToPay: 425,
    },
    travelShield: {
      optOut: false,
      travellerFullName: 'Dhwani Piyush Shah',
      travellerEmail: 'dhwani.shah@example.com',
      travellerPhone: '+91 98111 88442',
      travelBookingDocName: 'Akasa_Air_DEL_BOM_Ticket.pdf',
      amountBooked: 7500,
      premiumRate: 0.05,
      premiumToPay: 375,
    },
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
];

let inMemoryClaims: TixsuranceClaim[] = [
  {
    id: 'CLM-TIX-901',
    policyId: 'POL-TIX-001',
    bookingId: 'FAREDEMO2139XG',
    userId: 'admin-user-id',
    policyType: 'LOCAL',
    claimReason: 'Acute viral fever and clinical hospitalization recommendation prior to concert',
    proofOfEmergencyUrl: '/demo/hospital_admit_slip.pdf',
    proofOfEmergencyName: 'Lilavati_Hospital_Certificate.pdf',
    packagingVideoUrl: '/demo/wristband_packaging_video.mp4',
    packagingVideoName: 'Tirth_Shah_Wristband_Packaging_Video.mp4',
    hubAddress: TIXSURANCE_HUB.address,
    hubContactPhone: TIXSURANCE_HUB.phone,
    hubDeliveryDeadline: new Date(Date.now() + 8 * 3600 * 1000).toISOString(), // 8 hours remaining out of 12
    wristbandStatus: 'IN_TRANSIT',
    bandSerialVerified: false,
    claimStatus: 'HELD_PENDING_BAND',
    payoutAmount: 3600,
    payoutDueDate: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
];

export function getPolicies(): TixsurancePolicy[] {
  return [...inMemoryPolicies];
}

export function getPolicyByBookingId(bookingId: string): TixsurancePolicy | undefined {
  return inMemoryPolicies.find((p) => p.bookingId.toLowerCase() === bookingId.toLowerCase());
}

export function savePolicy(policy: TixsurancePolicy): TixsurancePolicy {
  const existingIdx = inMemoryPolicies.findIndex((p) => p.id === policy.id);
  if (existingIdx >= 0) {
    inMemoryPolicies[existingIdx] = { ...policy, updatedAt: new Date().toISOString() };
  } else {
    inMemoryPolicies.unshift({ ...policy, updatedAt: new Date().toISOString() });
  }
  return policy;
}

export function getClaims(): TixsuranceClaim[] {
  return [...inMemoryClaims];
}

export function getClaimByBookingId(bookingId: string): TixsuranceClaim | undefined {
  return inMemoryClaims.find((c) => c.bookingId.toLowerCase() === bookingId.toLowerCase());
}

export function saveClaim(claim: TixsuranceClaim): TixsuranceClaim {
  const existingIdx = inMemoryClaims.findIndex((c) => c.id === claim.id);
  if (existingIdx >= 0) {
    inMemoryClaims[existingIdx] = { ...claim, updatedAt: new Date().toISOString() };
  } else {
    inMemoryClaims.unshift({ ...claim, updatedAt: new Date().toISOString() });
  }

  // Update policy status to CLAIM_PENDING or corresponding
  const policy = inMemoryPolicies.find((p) => p.id === claim.policyId);
  if (policy) {
    policy.status =
      claim.claimStatus === 'APPROVED'
        ? 'CLAIM_APPROVED'
        : claim.claimStatus === 'REJECTED'
        ? 'CLAIM_REJECTED'
        : 'CLAIM_PENDING';
  }

  return claim;
}
