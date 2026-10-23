import { Ticket, PassengerItem } from '@/types/database';

export interface SplitFareInfo {
  totalAmount: number;
  splitAmount: number;
  currency: string;
  formattedTotal: string;
  formattedSplit: string;
  paxCount: number;
}

export interface LinkedPassengerJourney {
  ticketId: string;
  pnr: string;
  passengerIndex: number;
  passengerName: string;
  age: number | null;
  gender: string | null;
  bookingStatus: string;
  currentStatus: string;
  seat: string;
  transportMode: 'train' | 'flight' | 'bus' | 'unknown';
  carrierName: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  departureDatetime: string | null;
  arrivalDate: string;
  arrivalTime: string;
  arrivalDatetime: string | null;
  quota: string;
  distance: string;
  transactionId: string;
  tamperRiskScore: number;
  riskCategory: 'VERIFIED' | 'REVIEW' | 'FLAGGED';
  individualFareNumeric: number;
  individualFareFormatted: string;
  totalTicketFareNumeric: number;
  totalTicketFareFormatted: string;
  paxCountInTicket: number;
  createdAt: string;
  userId: string;
}

export interface PassengerProfile {
  id: string; // URL-safe normalized key
  normalizedKey: string;
  fullName: string;
  canonicalName: string;
  age: number | null;
  gender: string | null;
  totalJourneys: number;
  totalExpenditure: number;
  totalExpenditureFormatted: string;
  currency: string;
  modes: {
    flight: number;
    train: number;
    bus: number;
    unknown: number;
  };
  expenditureByMode: {
    flight: number;
    train: number;
    bus: number;
  };
  frequentRoutes: { route: string; count: number }[];
  latestJourneyDate: string;
  earliestJourneyDate: string;
  averageRiskScore: number;
  overallIntegrity: 'VERIFIED' | 'REVIEW' | 'FLAGGED';
  journeys: LinkedPassengerJourney[];
  associatedUsers: string[];
}

/**
 * Robust fare parser: handles currency symbols (₹, $, €, £, AED, INR, Rs.)
 * and numeric strings like "943.60", "55,350.00", "55350".
 */
export function parseFareString(rawFare: unknown): { amount: number; currency: string } {
  if (typeof rawFare === 'number') {
    return { amount: rawFare, currency: '₹' };
  }
  if (!rawFare || typeof rawFare !== 'string') {
    return { amount: 0, currency: '₹' };
  }

  let currency = '₹';
  const str = rawFare.trim();
  if (str.includes('$') || /USD/i.test(str)) currency = '$';
  else if (str.includes('€') || /EUR/i.test(str)) currency = '€';
  else if (str.includes('£') || /GBP/i.test(str)) currency = '£';
  else if (/AED/i.test(str)) currency = 'AED ';

  // Remove commas, currency symbols, and extract numeric float
  const clean = str.replace(/,/g, '');
  const match = clean.match(/(\d+(?:\.\d{1,2})?)/);
  const amount = match ? parseFloat(match[1]) : 0;

  return { amount: isNaN(amount) ? 0 : amount, currency };
}

/**
 * Format currency amount with commas and symbol
 */
export function formatCurrency(amount: number, currency = '₹'): string {
  if (amount <= 0 && isNaN(amount)) return `${currency}0.00`;
  return `${currency}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate per-passenger split fare from a ticket
 */
export function calculateSplitFare(rawFare: unknown, paxCount: number): SplitFareInfo {
  const { amount, currency } = parseFareString(rawFare);
  const count = Math.max(1, paxCount);
  const splitAmount = amount > 0 ? Number((amount / count).toFixed(2)) : 0;

  return {
    totalAmount: amount,
    splitAmount,
    currency,
    formattedTotal: amount > 0 ? formatCurrency(amount, currency) : 'N/A',
    formattedSplit: splitAmount > 0 ? formatCurrency(splitAmount, currency) : 'N/A',
    paxCount: count,
  };
}

/**
 * Normalize passenger names for entity linking across multiple tickets:
 * - Trims whitespace and strips honorific titles (Mr, Mrs, Ms, Master, Dr).
 * - Creates a canonical lookup key.
 */
export function normalizePassengerName(rawName: string): { displayName: string; normalizedKey: string } {
  if (!rawName) return { displayName: 'Unspecified Passenger', normalizedKey: 'unspecified' };

  let clean = rawName
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(MR|MRS|MS|MISS|DR|MASTER)\.?\s+/i, '')
    .trim();

  // Capitalize neatly
  const words = clean.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const displayName = words.join(' ');
  const normalizedKey = clean.toLowerCase().replace(/[^a-z0-9]/g, '');

  return { displayName: displayName || clean, normalizedKey: normalizedKey || 'unknown' };
}

/**
 * Extract all manifested passengers from a ticket with their split fares
 */
export function extractPassengersFromTicket(ticket: Ticket): LinkedPassengerJourney[] {
  const meta: any = ticket.raw_extraction_json || {};
  let pList: PassengerItem[] = [];

  if (Array.isArray(meta.passengers) && meta.passengers.length > 0) {
    pList = meta.passengers;
  } else if (ticket.passenger_name) {
    const names = ticket.passenger_name.split(',').map((n) => n.trim()).filter(Boolean);
    pList = names.map((name, idx) => ({
      num: idx + 1,
      name,
      age: idx === 0 ? ticket.passenger_age : null,
      gender: null,
      booking_status: ticket.booking_status,
      current_status: ticket.booking_status,
      seat: ticket.seat_class_coach,
    }));
  } else {
    pList = [
      {
        num: 1,
        name: 'Passenger',
        age: ticket.passenger_age || null,
        gender: null,
        booking_status: ticket.booking_status,
        current_status: ticket.booking_status,
        seat: ticket.seat_class_coach,
      },
    ];
  }

  // Parse fare and split
  const fareStr = meta.total_fare || meta.ticket_fare || '';
  const splitInfo = calculateSplitFare(fareStr, pList.length);

  // Date/Time formatting
  const formatDate = (iso: string | null) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      });
    } catch {
      return 'N/A';
    }
  };

  const riskScore = Number(ticket.tamper_risk_score || 0);
  const riskCategory = riskScore < 0.3 ? 'VERIFIED' : riskScore < 0.65 ? 'REVIEW' : 'FLAGGED';

  return pList.map((p, idx) => {
    const { displayName } = normalizePassengerName(p.name || 'Passenger');
    return {
      ticketId: ticket.id,
      pnr: ticket.pnr_booking_id || 'N/A',
      passengerIndex: typeof p.num === 'number' ? p.num : idx + 1,
      passengerName: displayName,
      age: p.age !== undefined && p.age !== null ? Number(p.age) : null,
      gender: p.gender || null,
      bookingStatus: p.booking_status || ticket.booking_status || 'Confirmed',
      currentStatus: p.current_status || ticket.booking_status || 'Confirmed',
      seat: p.seat || ticket.seat_class_coach || 'Assigned',
      transportMode: ticket.transport_mode || 'unknown',
      carrierName: ticket.carrier_name || 'Carrier Service',
      origin: ticket.boarding_place || 'Origin TBD',
      destination: ticket.destination_place || 'Destination TBD',
      departureDate: formatDate(ticket.departure_datetime),
      departureTime: formatTime(ticket.departure_datetime),
      departureDatetime: ticket.departure_datetime || null,
      arrivalDate: formatDate(ticket.arrival_datetime),
      arrivalTime: formatTime(ticket.arrival_datetime),
      arrivalDatetime: ticket.arrival_datetime || null,
      quota: meta.quota || 'GENERAL (GN)',
      distance: meta.distance_km || 'N/A',
      transactionId: meta.transaction_id || 'N/A',
      tamperRiskScore: riskScore,
      riskCategory,
      individualFareNumeric: splitInfo.splitAmount,
      individualFareFormatted: splitInfo.formattedSplit,
      totalTicketFareNumeric: splitInfo.totalAmount,
      totalTicketFareFormatted: splitInfo.formattedTotal,
      paxCountInTicket: pList.length,
      createdAt: ticket.created_at || new Date().toISOString(),
      userId: ticket.user_id,
    };
  });
}

/**
 * Aggregate all tickets into linked Passenger Profiles
 * Groups repeated passengers (e.g. "Tirth Shah" across multiple tickets)
 */
export function aggregatePassengerProfiles(tickets: Ticket[]): PassengerProfile[] {
  const profileMap: Map<string, PassengerProfile> = new Map();

  for (const ticket of tickets) {
    const journeys = extractPassengersFromTicket(ticket);

    for (const j of journeys) {
      const { displayName, normalizedKey } = normalizePassengerName(j.passengerName);

      // Try exact key first, or fuzzy match with same first and last name
      let key = normalizedKey;
      let existingProfile = profileMap.get(key);

      if (!existingProfile) {
        // Check if there's an existing profile with matching key prefix/suffix (e.g. "tirthdixitshah" vs "tirthshah")
        for (const [k, p] of profileMap.entries()) {
          const namesA = displayName.toLowerCase().split(' ');
          const namesB = p.fullName.toLowerCase().split(' ');
          if (
            namesA.length >= 2 &&
            namesB.length >= 2 &&
            namesA[0] === namesB[0] &&
            namesA[namesA.length - 1] === namesB[namesB.length - 1]
          ) {
            key = k;
            existingProfile = p;
            break;
          }
        }
      }

      if (!existingProfile) {
        const newProfile: PassengerProfile = {
          id: key,
          normalizedKey: key,
          fullName: displayName,
          canonicalName: displayName,
          age: j.age,
          gender: j.gender,
          totalJourneys: 0,
          totalExpenditure: 0,
          totalExpenditureFormatted: '₹0.00',
          currency: '₹',
          modes: { flight: 0, train: 0, bus: 0, unknown: 0 },
          expenditureByMode: { flight: 0, train: 0, bus: 0 },
          frequentRoutes: [],
          latestJourneyDate: j.departureDatetime || j.createdAt,
          earliestJourneyDate: j.departureDatetime || j.createdAt,
          averageRiskScore: 0,
          overallIntegrity: 'VERIFIED',
          journeys: [],
          associatedUsers: [],
        };
        profileMap.set(key, newProfile);
        existingProfile = newProfile;
      }

      // Update age/gender if previous was null
      if (!existingProfile.age && j.age) existingProfile.age = j.age;
      if (!existingProfile.gender && j.gender) existingProfile.gender = j.gender;

      // Update name to the longest/most complete version (e.g. "Tirth Dixit Shah" over "Tirth Shah")
      if (displayName.length > existingProfile.fullName.length) {
        existingProfile.fullName = displayName;
      }

      // Add journey
      existingProfile.journeys.push(j);
      existingProfile.totalJourneys++;
      existingProfile.totalExpenditure += j.individualFareNumeric;

      // Mode stats
      const mode = j.transportMode;
      if (mode === 'flight') {
        existingProfile.modes.flight++;
        existingProfile.expenditureByMode.flight += j.individualFareNumeric;
      } else if (mode === 'train') {
        existingProfile.modes.train++;
        existingProfile.expenditureByMode.train += j.individualFareNumeric;
      } else if (mode === 'bus') {
        existingProfile.modes.bus++;
        existingProfile.expenditureByMode.bus += j.individualFareNumeric;
      } else {
        existingProfile.modes.unknown++;
      }

      // Users
      if (!existingProfile.associatedUsers.includes(j.userId)) {
        existingProfile.associatedUsers.push(j.userId);
      }
    }
  }

  // Finalize averages and route distributions
  const profiles = Array.from(profileMap.values());
  for (const p of profiles) {
    p.totalExpenditure = Number(p.totalExpenditure.toFixed(2));
    p.totalExpenditureFormatted = formatCurrency(p.totalExpenditure, p.currency);

    // Calculate frequent routes
    const routeCounts: Record<string, number> = {};
    let totalRisk = 0;
    let flagged = 0;

    for (const j of p.journeys) {
      const rKey = `${j.origin} → ${j.destination}`;
      routeCounts[rKey] = (routeCounts[rKey] || 0) + 1;
      totalRisk += j.tamperRiskScore;
      if (j.riskCategory === 'FLAGGED') flagged++;
    }

    p.frequentRoutes = Object.entries(routeCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count);

    p.averageRiskScore = p.journeys.length > 0 ? Number((totalRisk / p.journeys.length).toFixed(2)) : 0;
    p.overallIntegrity = flagged > 0 ? 'FLAGGED' : p.averageRiskScore > 0.35 ? 'REVIEW' : 'VERIFIED';

    // Sort journeys by departure date descending
    p.journeys.sort((a, b) => {
      const timeA = a.departureDatetime ? new Date(a.departureDatetime).getTime() : 0;
      const timeB = b.departureDatetime ? new Date(b.departureDatetime).getTime() : 0;
      return timeB - timeA;
    });

    if (p.journeys.length > 0) {
      p.latestJourneyDate = p.journeys[0].departureDate || p.journeys[0].createdAt;
      p.earliestJourneyDate = p.journeys[p.journeys.length - 1].departureDate || p.journeys[p.journeys.length - 1].createdAt;
    }
  }

  // Sort profiles by total expenditure descending, then trips descending
  return profiles.sort((a, b) => b.totalExpenditure - a.totalExpenditure || b.totalJourneys - a.totalJourneys);
}
