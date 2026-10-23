export type TixsurancePolicyType = 'LOCAL' | 'OUTSTATION';

export type TixsurancePolicyStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CLAIM_PENDING'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'VOIDED';

export type TixsuranceClaimStatus =
  | 'HELD_PENDING_BAND'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type WristbandStatus =
  | 'AWAITING_SHIPMENT'
  | 'IN_TRANSIT'
  | 'RECEIVED_AT_HUB'
  | 'VERIFIED'
  | 'TAMPERED';

export interface TixsuranceAddress {
  addressLine1: string;
  addressLine2?: string;
  country: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface TixsuranceAttendee {
  fullName: string;
  email: string;
  phone: string;
  permanentAddress: TixsuranceAddress;
  billingAddressSame: boolean;
  billingAddress?: TixsuranceAddress;
  governmentIdPhotoUrl?: string;
}

export interface StayShieldData {
  optOut: boolean;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
  hotelBookingDocUrl?: string;
  hotelBookingDocName?: string;
  amountBooked: number;
  premiumRate: number; // 0.05 or 0.07
  premiumToPay: number;
}

export interface TravelShieldData {
  optOut: boolean;
  travellerFullName: string;
  travellerEmail: string;
  travellerPhone: string;
  travelBookingDocUrl?: string;
  travelBookingDocName?: string;
  amountBooked: number;
  premiumRate: number; // 0.05 or 0.07
  premiumToPay: number;
}

export interface TixsurancePolicy {
  id: string;
  bookingId: string;
  ticketId?: string;
  userId: string;
  ticketFare: number;
  eventVenueCity: string;
  eventVenueAddress: string;
  distanceKm: number;
  policyType: TixsurancePolicyType; // <=100km Local, >100km Outstation
  premiumRate: 0.05 | 0.07;
  ticketPremium: number;
  totalPremiumPaid: number;
  attendee: TixsuranceAttendee;
  stayShield?: StayShieldData;
  travelShield?: TravelShieldData;
  graceWindowExpiresAt?: string; // 48-hour window if not added at checkout
  status: TixsurancePolicyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TixsuranceClaim {
  id: string;
  policyId: string;
  bookingId: string;
  userId: string;
  policyType: TixsurancePolicyType;
  claimReason: string;
  proofOfEmergencyUrl: string;
  proofOfEmergencyName?: string;
  
  // Local (<= 100km) Anti-Freeloading Physical Return
  packagingVideoUrl?: string;
  packagingVideoName?: string;
  hubAddress: string;
  hubContactPhone: string;
  hubDeliveryDeadline: string; // 12-hour countdown
  wristbandStatus: WristbandStatus;
  bandSerialVerified?: boolean;
  
  // Outstation (> 100km) Proofs
  stayCancellationReceiptUrl?: string;
  stayCancellationReceiptName?: string;
  travelCancellationReceiptUrl?: string;
  travelCancellationReceiptName?: string;
  
  // Review & Payout Lifecycle
  claimStatus: TixsuranceClaimStatus;
  payoutAmount: number;
  payoutDueDate?: string; // 15-20 days post event
  adminNotes?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}
