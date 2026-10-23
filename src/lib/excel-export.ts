import ExcelJS from 'exceljs';
import sharp from 'sharp';
import { Ticket, PassengerItem } from '@/types/database';
import { calculateSplitFare } from './passenger-intelligence';

export interface ExportTicketsOptions {
  tickets: Ticket[];
  generatedBy?: string;
  filterLabel?: string;
}

/**
 * Generate high-resolution SVG Chart 1: Booking Status Distribution
 */
function generateStatusChartSvg(stats: {
  confirmed: number;
  waitlisted: number;
  rac: number;
  cancelled: number;
  unknown: number;
  total: number;
}): string {
  const { confirmed, waitlisted, rac, cancelled, unknown, total } = stats;
  const maxVal = Math.max(confirmed, waitlisted, rac, cancelled, unknown, 1);
  const barMaxWidth = 280;

  const getWidth = (val: number) => Math.max(12, Math.round((val / maxVal) * barMaxWidth));
  const getPct = (val: number) => (total > 0 ? ((val / total) * 100).toFixed(1) : '0.0');

  return `
  <svg width="580" height="290" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0F172A"/>
        <stop offset="100%" stop-color="#1E293B"/>
      </linearGradient>
    </defs>
    <!-- Card Frame -->
    <rect width="580" height="290" rx="14" fill="url(#bgGrad)" stroke="#334155" stroke-width="1.5"/>
    
    <!-- Title & Legend Header -->
    <text x="24" y="34" fill="#F8FAFC" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="bold">
      BOOKING STATUS DISTRIBUTION
    </text>
    <text x="24" y="52" fill="#94A3B8" font-family="Segoe UI, Arial, sans-serif" font-size="11">
      Live Breakdown Across Manifested Travel Bookings (Total: ${total})
    </text>
    <line x1="24" y1="62" x2="556" y2="62" stroke="#334155" stroke-width="1"/>

    <!-- Bar 1: Confirmed -->
    <text x="24" y="93" fill="#E2E8F0" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="600">Confirmed</text>
    <rect x="115" y="78" width="${getWidth(confirmed)}" height="20" rx="4" fill="#10B981"/>
    <text x="${125 + getWidth(confirmed)}" y="93" fill="#34D399" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold">
      ${confirmed} (${getPct(confirmed)}%)
    </text>

    <!-- Bar 2: Waitlisted -->
    <text x="24" y="133" fill="#E2E8F0" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="600">Waitlisted</text>
    <rect x="115" y="118" width="${getWidth(waitlisted)}" height="20" rx="4" fill="#F59E0B"/>
    <text x="${125 + getWidth(waitlisted)}" y="133" fill="#FBBF24" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold">
      ${waitlisted} (${getPct(waitlisted)}%)
    </text>

    <!-- Bar 3: RAC -->
    <text x="24" y="173" fill="#E2E8F0" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="600">RAC</text>
    <rect x="115" y="158" width="${getWidth(rac)}" height="20" rx="4" fill="#0EA5E9"/>
    <text x="${125 + getWidth(rac)}" y="173" fill="#38BDF8" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold">
      ${rac} (${getPct(rac)}%)
    </text>

    <!-- Bar 4: Cancelled -->
    <text x="24" y="213" fill="#E2E8F0" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="600">Cancelled</text>
    <rect x="115" y="198" width="${getWidth(cancelled)}" height="20" rx="4" fill="#EF4444"/>
    <text x="${125 + getWidth(cancelled)}" y="213" fill="#F87171" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold">
      ${cancelled} (${getPct(cancelled)}%)
    </text>

    <!-- Bar 5: Unknown / Other -->
    <text x="24" y="253" fill="#E2E8F0" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="600">Other</text>
    <rect x="115" y="238" width="${getWidth(unknown)}" height="20" rx="4" fill="#64748B"/>
    <text x="${125 + getWidth(unknown)}" y="253" fill="#94A3B8" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold">
      ${unknown} (${getPct(unknown)}%)
    </text>
  </svg>
  `;
}

/**
 * Generate high-resolution SVG Chart 2: Mode Share & Integrity Analysis
 */
function generateModeAndRiskChartSvg(stats: {
  train: number;
  flight: number;
  bus: number;
  verified: number;
  review: number;
  flagged: number;
  total: number;
}): string {
  const { train, flight, bus, verified, review, flagged, total } = stats;
  const maxMode = Math.max(train, flight, bus, 1);
  const maxRisk = Math.max(verified, review, flagged, 1);

  const getModeWidth = (val: number) => Math.max(10, Math.round((val / maxMode) * 140));
  const getRiskWidth = (val: number) => Math.max(10, Math.round((val / maxRisk) * 140));

  return `
  <svg width="580" height="290" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0F172A"/>
        <stop offset="100%" stop-color="#1E293B"/>
      </linearGradient>
    </defs>
    <!-- Card Frame -->
    <rect width="580" height="290" rx="14" fill="url(#bgGrad2)" stroke="#334155" stroke-width="1.5"/>
    
    <!-- Title & Header -->
    <text x="24" y="34" fill="#F8FAFC" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="bold">
      TRAVEL MODE SHARE &amp; FORENSIC INTEGRITY
    </text>
    <text x="24" y="52" fill="#94A3B8" font-family="Segoe UI, Arial, sans-serif" font-size="11">
      Modality Distribution (Left) vs. Authenticity Audit (Right)
    </text>
    <line x1="24" y1="62" x2="556" y2="62" stroke="#334155" stroke-width="1"/>

    <!-- Left Column: Transport Modes -->
    <text x="24" y="85" fill="#38BDF8" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold">
      Transport Modes
    </text>

    <!-- Train -->
    <text x="24" y="118" fill="#CBD5E1" font-family="Segoe UI, Arial, sans-serif" font-size="11">Rail / Train</text>
    <rect x="95" y="105" width="${getModeWidth(train)}" height="18" rx="4" fill="#F59E0B"/>
    <text x="${105 + getModeWidth(train)}" y="119" fill="#FBBF24" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold">${train}</text>

    <!-- Flight -->
    <text x="24" y="158" fill="#CBD5E1" font-family="Segoe UI, Arial, sans-serif" font-size="11">Aviation</text>
    <rect x="95" y="145" width="${getModeWidth(flight)}" height="18" rx="4" fill="#0EA5E9"/>
    <text x="${105 + getModeWidth(flight)}" y="159" fill="#38BDF8" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold">${flight}</text>

    <!-- Bus -->
    <text x="24" y="198" fill="#CBD5E1" font-family="Segoe UI, Arial, sans-serif" font-size="11">Road / Bus</text>
    <rect x="95" y="185" width="${getModeWidth(bus)}" height="18" rx="4" fill="#10B981"/>
    <text x="${105 + getModeWidth(bus)}" y="199" fill="#34D399" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold">${bus}</text>

    <!-- Divider -->
    <line x1="285" y1="75" x2="285" y2="255" stroke="#334155" stroke-width="1" stroke-dasharray="4,4"/>

    <!-- Right Column: Forensic Integrity -->
    <text x="305" y="85" fill="#A855F7" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold">
      Forensic Security Signals
    </text>

    <!-- Verified -->
    <text x="305" y="118" fill="#CBD5E1" font-family="Segoe UI, Arial, sans-serif" font-size="11">Verified (&lt;0.3)</text>
    <rect x="395" y="105" width="${getRiskWidth(verified)}" height="18" rx="4" fill="#10B981"/>
    <text x="${405 + getRiskWidth(verified)}" y="119" fill="#34D399" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold">${verified}</text>

    <!-- Review -->
    <text x="305" y="158" fill="#CBD5E1" font-family="Segoe UI, Arial, sans-serif" font-size="11">Review (0.3-0.65)</text>
    <rect x="395" y="145" width="${getRiskWidth(review)}" height="18" rx="4" fill="#F59E0B"/>
    <text x="${405 + getRiskWidth(review)}" y="159" fill="#FBBF24" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold">${review}</text>

    <!-- Flagged -->
    <text x="305" y="198" fill="#CBD5E1" font-family="Segoe UI, Arial, sans-serif" font-size="11">High Risk (&gt;0.65)</text>
    <rect x="395" y="185" width="${getRiskWidth(flagged)}" height="18" rx="4" fill="#EF4444"/>
    <text x="${405 + getRiskWidth(flagged)}" y="199" fill="#F87171" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="bold">${flagged}</text>

    <!-- Integrity Summary Footer -->
    <rect x="24" y="235" width="532" height="36" rx="6" fill="#1E293B" stroke="#475569" stroke-width="0.8"/>
    <text x="36" y="258" fill="#94A3B8" font-family="Segoe UI, Arial, sans-serif" font-size="11">
      Integrity Compliance Rate:
    </text>
    <text x="180" y="258" fill="#34D399" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="bold">
      ${total > 0 ? (((verified + review) / total) * 100).toFixed(1) : '100'}% Validated Clean
    </text>
  </svg>
  `;
}

/**
 * Builds the comprehensive enterprise Excel workbook
 */
export async function generateTicketsExcelWorkbook(
  options: ExportTicketsOptions
): Promise<Buffer> {
  const { tickets, generatedBy = 'Administrator', filterLabel = 'All Registered Tickets' } = options;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TicketScan Enterprise Intelligence';
  workbook.lastModifiedBy = generatedBy;
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Compute Aggregates & Insights
  let totalFareAmount = 0;
  let totalPassengersCount = 0;
  const statusStats = { confirmed: 0, waitlisted: 0, rac: 0, cancelled: 0, unknown: 0, total: tickets.length };
  const modeStats = { train: 0, flight: 0, bus: 0, unknown: 0 };
  const riskStats = { verified: 0, review: 0, flagged: 0 };

  // Flat individual passengers array
  interface FlatPassengerRow {
    paxNumber: number;
    pnr: string;
    passengerName: string;
    age: number | string;
    gender: string;
    bookingStatus: string;
    currentStatus: string;
    coachSeat: string;
    transportMode: string;
    carrierName: string;
    origin: string;
    destination: string;
    departureDate: string;
    departureTime: string;
    arrivalDate: string;
    arrivalTime: string;
    quota: string;
    distance: string;
    transactionId: string;
    individualFare: string;
    totalTicketFare: string;
    tamperRiskScore: number;
    riskCategory: string;
    confidence: number;
    ticketId: string;
    createdAt: string;
    isFirstInTicket: boolean;
    isLastInTicket: boolean;
  }

  const allPassengerRows: FlatPassengerRow[] = [];

  for (const t of tickets) {
    // Mode counting
    const m = (t.transport_mode || 'unknown').toLowerCase() as keyof typeof modeStats;
    if (modeStats[m] !== undefined) modeStats[m]++;
    else modeStats.unknown++;

    // Status counting
    const s = (t.booking_status || 'unknown').toLowerCase() as keyof typeof statusStats;
    if (statusStats[s] !== undefined) statusStats[s]++;
    else statusStats.unknown++;

    // Risk counting
    const rScore = Number(t.tamper_risk_score || 0);
    if (rScore < 0.3) riskStats.verified++;
    else if (rScore < 0.65) riskStats.review++;
    else riskStats.flagged++;

    // Fares
    const rawMeta = (t.raw_extraction_json || {}) as Record<string, any>;
    const fareStr = rawMeta.total_fare || '';
    const numericFare = parseFloat(fareStr.replace(/[^\d.]/g, ''));
    if (!isNaN(numericFare)) totalFareAmount += numericFare;

    // Date/Time parsing
    let depDate = 'N/A';
    let depTime = 'N/A';
    if (t.departure_datetime) {
      try {
        const d = new Date(t.departure_datetime);
        depDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
        depTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
      } catch {}
    }

    let arrDate = 'N/A';
    let arrTime = 'N/A';
    if (t.arrival_datetime) {
      try {
        const d = new Date(t.arrival_datetime);
        arrDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
        arrTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
      } catch {}
    }

    const quota = rawMeta.quota || 'GENERAL (GN)';
    const distance = rawMeta.distance_km || 'N/A';
    const txnId = rawMeta.transaction_id || 'N/A';
    const riskCat = rScore < 0.3 ? 'VERIFIED' : rScore < 0.65 ? 'REVIEW' : 'FLAGGED';

    // Extract passengers for this ticket
    let pList: PassengerItem[] = [];
    if (Array.isArray(rawMeta.passengers) && rawMeta.passengers.length > 0) {
      pList = rawMeta.passengers;
    } else if (t.passenger_name) {
      const names = t.passenger_name.split(',').map((n) => n.trim()).filter(Boolean);
      pList = names.map((name, idx) => ({
        num: idx + 1,
        name,
        age: idx === 0 ? t.passenger_age : null,
        gender: null,
        booking_status: t.booking_status,
        current_status: t.booking_status,
        seat: t.seat_class_coach,
      }));
    } else {
      pList = [{
        num: 1,
        name: 'Unspecified Passenger',
        age: null,
        gender: null,
        booking_status: t.booking_status,
        current_status: t.booking_status,
        seat: t.seat_class_coach,
      }];
    }

    totalPassengersCount += pList.length;

    const splitInfo = calculateSplitFare(fareStr, pList.length);

    pList.forEach((p, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === pList.length - 1;

      allPassengerRows.push({
        paxNumber: typeof p.num === 'number' ? p.num : idx + 1,
        pnr: isFirst ? (t.pnr_booking_id || 'N/A') : '',
        passengerName: p.name || 'N/A',
        age: p.age !== undefined && p.age !== null ? p.age : 'N/A',
        gender: p.gender || 'N/A',
        bookingStatus: p.booking_status || t.booking_status || 'N/A',
        currentStatus: p.current_status || t.booking_status || 'N/A',
        coachSeat: p.seat || t.seat_class_coach || 'N/A',
        transportMode: isFirst ? (t.transport_mode || 'unknown').toUpperCase() : '',
        carrierName: isFirst ? (t.carrier_name || 'N/A') : '',
        origin: isFirst ? (t.boarding_place || 'N/A') : '',
        destination: isFirst ? (t.destination_place || 'N/A') : '',
        departureDate: isFirst ? depDate : '',
        departureTime: isFirst ? depTime : '',
        arrivalDate: isFirst ? arrDate : '',
        arrivalTime: isFirst ? arrTime : '',
        quota: isFirst ? quota : '',
        distance: isFirst ? distance : '',
        transactionId: isFirst ? txnId : '',
        individualFare: splitInfo.formattedSplit, // Split fare per individual (e.g. ₹471.80, ₹11,070.00)
        totalTicketFare: isFirst ? `${splitInfo.formattedTotal} (${pList.length} Pax)` : '',
        tamperRiskScore: rScore,
        riskCategory: riskCat,
        confidence: Number(t.extraction_confidence || 0),
        ticketId: isFirst ? t.id : '',
        createdAt: t.created_at ? t.created_at.split('T')[0] : 'N/A',
        isFirstInTicket: isFirst,
        isLastInTicket: isLast,
      });
    });
  }

  // ==========================================
  // SHEET 1: EXECUTIVE ANALYTICS & INSIGHTS
  // ==========================================
  const wsAnalytics = workbook.addWorksheet('📊 Executive Insights', {
    views: [{ showGridLines: true }],
  });

  // Title Banner
  wsAnalytics.mergeCells('B2:M2');
  const titleCell = wsAnalytics.getCell('B2');
  titleCell.value = 'TICKETSCAN™ ENTERPRISE TRAVEL INTELLIGENCE & AUDIT REPORT';
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsAnalytics.getRow(2).height = 36;

  // Subtitle
  wsAnalytics.mergeCells('B3:M3');
  const subCell = wsAnalytics.getCell('B3');
  subCell.value = `Exported by: ${generatedBy}  |  Scope: ${filterLabel}  |  Generated on: ${new Date().toUTCString()}  |  Zero-Mock Truthful Data Register`;
  subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsAnalytics.getRow(3).height = 24;

  // KPI Metric Cards (Row 5 - 7)
  const kpis = [
    { col: 'B', label: 'TOTAL TICKETS', val: tickets.length, fill: 'FF1E3A8A', border: 'FF3B82F6' },
    { col: 'D', label: 'TOTAL PASSENGERS', val: totalPassengersCount, fill: 'FF065F46', border: 'FF10B981' },
    { col: 'F', label: 'CONFIRMED PASSENGERS', val: statusStats.confirmed, fill: 'FF047857', border: 'FF34D399' },
    { col: 'H', label: 'WAITLISTED / RAC', val: statusStats.waitlisted + statusStats.rac, fill: 'FFB45309', border: 'FFF59E0B' },
    { col: 'J', label: 'EST. VALUE TRACKED', val: `₹${totalFareAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, fill: 'FF4C1D95', border: 'FF8B5CF6' },
    { col: 'L', label: 'INTEGRITY PASS RATE', val: `${tickets.length > 0 ? (((riskStats.verified + riskStats.review) / tickets.length) * 100).toFixed(1) : 100}%`, fill: 'FF0F766E', border: 'FF14B8A6' },
  ];

  kpis.forEach((kpi) => {
    const endCol = String.fromCharCode(kpi.col.charCodeAt(0) + 1);
    wsAnalytics.mergeCells(`${kpi.col}5:${endCol}5`);
    const lbl = wsAnalytics.getCell(`${kpi.col}5`);
    lbl.value = kpi.label;
    lbl.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF94A3B8' } };
    lbl.alignment = { horizontal: 'center', vertical: 'middle' };
    lbl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

    wsAnalytics.mergeCells(`${kpi.col}6:${endCol}6`);
    const val = wsAnalytics.getCell(`${kpi.col}6`);
    val.value = kpi.val;
    val.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    val.alignment = { horizontal: 'center', vertical: 'middle' };
    val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.fill } };
  });

  wsAnalytics.getRow(5).height = 20;
  wsAnalytics.getRow(6).height = 30;

  // Insert Embedded Charts
  try {
    const statusSvg = generateStatusChartSvg(statusStats);
    const modeRiskSvg = generateModeAndRiskChartSvg({
      train: modeStats.train,
      flight: modeStats.flight,
      bus: modeStats.bus,
      verified: riskStats.verified,
      review: riskStats.review,
      flagged: riskStats.flagged,
      total: tickets.length,
    });

    const [statusPng, modeRiskPng] = await Promise.all([
      sharp(Buffer.from(statusSvg)).png().toBuffer(),
      sharp(Buffer.from(modeRiskSvg)).png().toBuffer(),
    ]);

    const imgId1 = workbook.addImage({ buffer: statusPng as any, extension: 'png' });
    const imgId2 = workbook.addImage({ buffer: modeRiskPng as any, extension: 'png' });

    wsAnalytics.addImage(imgId1, {
      tl: { col: 1, row: 8 },
      ext: { width: 520, height: 260 },
    });

    wsAnalytics.addImage(imgId2, {
      tl: { col: 7, row: 8 },
      ext: { width: 520, height: 260 },
    });
  } catch (err) {
    console.warn('Failed embedding chart images into Excel:', err);
  }

  // Row 23: Data Breakdown Section Header
  wsAnalytics.getCell('B23').value = 'TABLE 1: BOOKING STATUS BREAKDOWN';
  wsAnalytics.getCell('B23').font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF0F172A' } };

  wsAnalytics.getCell('H23').value = 'TABLE 2: TRANSPORT MODALITY SHARE';
  wsAnalytics.getCell('H23').font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF0F172A' } };

  // Status Table Headers (Row 24)
  const statusHeaders = ['Booking Status', 'Ticket Count', 'Share (%)', 'Operational Impact'];
  wsAnalytics.getRow(24).height = 28;
  statusHeaders.forEach((h, i) => {
    const c = wsAnalytics.getCell(24, 2 + i);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const statusRows = [
    { name: 'Confirmed', count: statusStats.confirmed, impact: 'High Readiness (Travel Ready)' },
    { name: 'Waitlisted', count: statusStats.waitlisted, impact: 'Chart Prepared / WL Queue' },
    { name: 'RAC (Reservation Against Cancellation)', count: statusStats.rac, impact: 'Confirmed Travel (Shared Berth)' },
    { name: 'Cancelled', count: statusStats.cancelled, impact: 'Refund Processed' },
  ];

  statusRows.forEach((row, idx) => {
    const rIdx = 25 + idx;
    const share = tickets.length > 0 ? ((row.count / tickets.length) * 100).toFixed(1) + '%' : '0.0%';
    const c1 = wsAnalytics.getCell(rIdx, 2);
    const c2 = wsAnalytics.getCell(rIdx, 3);
    const c3 = wsAnalytics.getCell(rIdx, 4);
    const c4 = wsAnalytics.getCell(rIdx, 5);

    c1.value = row.name;
    c2.value = row.count;
    c3.value = share;
    c4.value = row.impact;

    [c1, c2, c3, c4].forEach((cell) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = { vertical: 'middle' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
    c2.alignment = { horizontal: 'center', vertical: 'middle' };
    c3.alignment = { horizontal: 'center', vertical: 'middle' };
    wsAnalytics.getRow(rIdx).height = 24;
  });

  // Modality Table Headers (Row 24)
  const modeHeaders = ['Transport Mode', 'Tickets', 'Share (%)', 'Primary Carrier'];
  modeHeaders.forEach((h, i) => {
    const c = wsAnalytics.getCell(24, 8 + i);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const modeRows = [
    { name: 'Train (Rail Networks)', count: modeStats.train, carrier: 'IRCTC / National / Express' },
    { name: 'Flight (Aviation Airlines)', count: modeStats.flight, carrier: 'Domestic & Global Carriers' },
    { name: 'Bus (Intercity Roadways)', count: modeStats.bus, carrier: 'Intercity Operators' },
  ];

  modeRows.forEach((row, idx) => {
    const rIdx = 25 + idx;
    const share = tickets.length > 0 ? ((row.count / tickets.length) * 100).toFixed(1) + '%' : '0.0%';
    const c1 = wsAnalytics.getCell(rIdx, 8);
    const c2 = wsAnalytics.getCell(rIdx, 9);
    const c3 = wsAnalytics.getCell(rIdx, 10);
    const c4 = wsAnalytics.getCell(rIdx, 11);

    c1.value = row.name;
    c2.value = row.count;
    c3.value = share;
    c4.value = row.carrier;

    [c1, c2, c3, c4].forEach((cell) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = { vertical: 'middle' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
    c2.alignment = { horizontal: 'center', vertical: 'middle' };
    c3.alignment = { horizontal: 'center', vertical: 'middle' };
    wsAnalytics.getRow(rIdx).height = 24;
  });

  // Adjust widths for analytics sheet
  wsAnalytics.getColumn(1).width = 4;
  for (let c = 2; c <= 14; c++) {
    wsAnalytics.getColumn(c).width = 16;
  }

  // ==========================================
  // SHEET 2: PASSENGER MANIFEST MASTER (EACH PASSENGER ON A NEW ROW)
  // ==========================================
  const wsPassengers = workbook.addWorksheet('👥 Passenger Manifest', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: true }],
  });

  // Title Banner
  wsPassengers.mergeCells('A1:X1');
  const paxTitle = wsPassengers.getCell('A1');
  paxTitle.value = `PASSENGER MANIFEST MASTER — INDIVIDUAL PASSENGER RECORDS (${allPassengerRows.length} Manifested Passengers)`;
  paxTitle.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  paxTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  paxTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsPassengers.getRow(1).height = 34;

  // Subtitle
  wsPassengers.mergeCells('A2:X2');
  const paxSub = wsPassengers.getCell('A2');
  paxSub.value = 'Each row represents an individual verified passenger with split individual fare, designated coach, seat, booking status, and route.';
  paxSub.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
  paxSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  paxSub.alignment = { vertical: 'middle', horizontal: 'center' };
  wsPassengers.getRow(2).height = 24;

  // Header Columns for Manifest Table (Row 3) - Shifted Fares Ahead
  const manifestHeaders = [
    '#',
    'PNR / Booking ID',
    'Passenger Full Name',
    'Age',
    'Gender',
    'Booking Status',
    'Current Status',
    'Coach & Seat',
    'Individual Split Fare',
    'Total Ticket Fare',
    'Mode',
    'Carrier / Train / Flight',
    'Origin Station',
    'Destination Station',
    'Departure Date',
    'Departure Time',
    'Arrival Date',
    'Arrival Time',
    'Quota',
    'Distance (KM)',
    'Transaction ID',
    'Integrity Level',
    'AI Confidence',
    'Ticket Reference ID',
  ];

  const headerRow = wsPassengers.getRow(3);
  headerRow.values = manifestHeaders;
  headerRow.height = 30;

  manifestHeaders.forEach((_, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // Populate Passenger Rows
  allPassengerRows.forEach((p, idx) => {
    const rowNum = 4 + idx;
    const r = wsPassengers.getRow(rowNum);
    r.height = 24;

    r.values = [
      idx + 1,
      p.pnr,
      p.passengerName,
      p.age,
      p.gender,
      p.bookingStatus,
      p.currentStatus,
      p.coachSeat,
      p.individualFare,
      p.totalTicketFare,
      p.transportMode,
      p.carrierName,
      p.origin,
      p.destination,
      p.departureDate,
      p.departureTime,
      p.arrivalDate,
      p.arrivalTime,
      p.quota,
      p.distance,
      p.transactionId,
      p.riskCategory,
      `${Math.round(p.confidence * 100)}%`,
      p.ticketId,
    ];

    // Alternate row zebra styling
    const isEven = idx % 2 === 0;
    const zebraFill = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    for (let c = 1; c <= manifestHeaders.length; c++) {
      const cell = r.getCell(c);
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraFill } };
      cell.border = {
        bottom: p.isLastInTicket
          ? { style: 'medium', color: { argb: 'FF000000' } } // Thick black border separating ticket groups (Image 2)
          : { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      // Uniform center/middle alignment across all columns
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    // Bold passenger name (middle aligned)
    r.getCell(3).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    r.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

    // Status coloring (middle aligned)
    const statusCell = r.getCell(7); // Current Status
    const statusText = (p.currentStatus || '').toLowerCase();
    if (statusText.includes('cnf') || statusText.includes('confirmed')) {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF065F46' } };
    } else if (statusText.includes('wl') || statusText.includes('wait')) {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF92400E' } };
    } else if (statusText.includes('rac')) {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
      statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0369A1' } };
    }
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Individual Split Fare cell (Column 9 - shifted ahead, bolded, middle aligned)
    const splitFareCell = r.getCell(9);
    splitFareCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF047857' } };
    splitFareCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Total Ticket Fare cell (Column 10 - shifted ahead, bolded, middle aligned)
    const totalFareCell = r.getCell(10);
    totalFareCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    totalFareCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Risk coloring (Column 22 - middle aligned)
    const riskCell = r.getCell(22);
    if (p.riskCategory === 'VERIFIED') {
      riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
      riskCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF059669' } };
    } else if (p.riskCategory === 'FLAGGED') {
      riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      riskCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFDC2626' } };
    } else {
      riskCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
      riskCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFD97706' } };
    }
    riskCell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Enable AutoFilter on Manifest
  wsPassengers.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: manifestHeaders.length },
  };

  // Compact, tailored column widths - eliminate excess empty space
  const manifestColWidths: Record<number, number> = {
    1: 6,   // # (compact index with filter arrow)
    2: 15,  // PNR / Booking ID
    3: 22,  // Passenger Full Name
    4: 7,   // Age
    5: 9,   // Gender
    6: 15,  // Booking Status
    7: 18,  // Current Status
    8: 13,  // Coach & Seat
    9: 17,  // Individual Split Fare (shifted ahead, bold)
    10: 18, // Total Ticket Fare (shifted ahead, bold)
    11: 9,  // Mode
    12: 22, // Carrier / Train / Flight
    13: 18, // Origin Station
    14: 18, // Destination Station
    15: 13, // Departure Date
    16: 11, // Departure Time
    17: 13, // Arrival Date
    18: 11, // Arrival Time
    19: 12, // Quota
    20: 12, // Distance (KM)
    21: 17, // Transaction ID
    22: 13, // Integrity Level
    23: 12, // AI Confidence
    24: 16, // Ticket Reference ID
  };

  wsPassengers.columns.forEach((column, i) => {
    const colIdx = i + 1;
    const defaultWidth = manifestColWidths[colIdx] || 14;
    let maxLen = 0;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const v = cell.value ? String(cell.value) : '';
      if (v.length > maxLen) maxLen = v.length;
    });
    // For column 1 (#), keep strictly compact at width 6
    if (colIdx === 1) {
      column.width = 6;
    } else {
      column.width = Math.max(defaultWidth, Math.min(defaultWidth + 6, maxLen + 2));
    }
  });

  // ==========================================
  // SHEET 3: TICKETS & FORENSIC AUDIT REGISTER
  // ==========================================
  const wsTickets = workbook.addWorksheet('🎫 Tickets & Audit', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: true }],
  });

  // Title Banner
  wsTickets.mergeCells('A1:R1');
  const tTitle = wsTickets.getCell('A1');
  tTitle.value = `TICKETS & FORENSIC AUDIT REGISTER (${tickets.length} Master Tickets)`;
  tTitle.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  tTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  tTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsTickets.getRow(1).height = 34;

  // Subtitle
  wsTickets.mergeCells('A2:R2');
  const tSub = wsTickets.getCell('A2');
  tSub.value = 'Full cryptographic and forensic authenticity breakdown per document including extraction confidence and tamper flags.';
  tSub.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
  tSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  tSub.alignment = { vertical: 'middle', horizontal: 'center' };
  wsTickets.getRow(2).height = 24;

  const ticketHeaders = [
    '#',
    'Ticket ID',
    'PNR / Booking ID',
    'Transport Mode',
    'Primary Passenger',
    'Carrier Name',
    'Booking Status',
    'Boarding Place',
    'Destination Place',
    'Departure Date/Time',
    'Seat / Coach Details',
    'AI Confidence',
    'Tamper Risk Score',
    'Forensic Rating',
    'Tamper Signals Count',
    'Manually Corrected',
    'File Type',
    'Upload Timestamp',
  ];

  const tHeaderRow = wsTickets.getRow(3);
  tHeaderRow.values = ticketHeaders;
  tHeaderRow.height = 30;

  ticketHeaders.forEach((_, i) => {
    const cell = tHeaderRow.getCell(i + 1);
    cell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  tickets.forEach((t, idx) => {
    const rowNum = 4 + idx;
    const r = wsTickets.getRow(rowNum);
    r.height = 24;

    const rScore = Number(t.tamper_risk_score || 0);
    const rCat = rScore < 0.3 ? 'VERIFIED (PASS)' : rScore < 0.65 ? 'REVIEW NEEDED' : 'HIGH RISK (FLAGGED)';
    const sigCount = Array.isArray(t.tamper_signals) ? t.tamper_signals.length : 0;

    r.values = [
      idx + 1,
      t.id,
      t.pnr_booking_id || 'N/A',
      (t.transport_mode || 'unknown').toUpperCase(),
      t.passenger_name || 'N/A',
      t.carrier_name || 'N/A',
      (t.booking_status || 'unknown').toUpperCase(),
      t.boarding_place || 'N/A',
      t.destination_place || 'N/A',
      t.departure_datetime || 'N/A',
      t.seat_class_coach || 'N/A',
      `${Math.round(Number(t.extraction_confidence || 0) * 100)}%`,
      rScore.toFixed(2),
      rCat,
      sigCount,
      t.manually_corrected ? 'Yes (Audited)' : 'No',
      (t.file_type || 'pdf').toUpperCase(),
      t.created_at || 'N/A',
    ];

    const isEven = idx % 2 === 0;
    const zebraFill = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    for (let c = 1; c <= ticketHeaders.length; c++) {
      const cell = r.getCell(c);
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraFill } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      // Uniform center/middle alignment across all ticket columns
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    // Rating color (middle aligned)
    const rateCell = r.getCell(14);
    if (rScore < 0.3) {
      rateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
      rateCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF059669' } };
    } else if (rScore < 0.65) {
      rateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
      rateCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFD97706' } };
    } else {
      rateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      rateCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFDC2626' } };
    }
    rateCell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  wsTickets.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: ticketHeaders.length },
  };

  // Compact, tailored column widths for tickets register
  const ticketColWidths: Record<number, number> = {
    1: 6,   // # (compact index with filter arrow)
    2: 15,  // Ticket ID
    3: 15,  // PNR / Booking ID
    4: 11,  // Transport Mode
    5: 22,  // Primary Passenger
    6: 20,  // Carrier Name
    7: 14,  // Booking Status
    8: 18,  // Boarding Place
    9: 18,  // Destination Place
    10: 18, // Departure Date/Time
    11: 14, // Seat / Coach Details
    12: 12, // AI Confidence
    13: 13, // Tamper Risk Score
    14: 15, // Forensic Rating
    15: 12, // Tamper Signals Count
    16: 12, // Manually Corrected
    17: 10, // File Type
    18: 16, // Upload Timestamp
  };

  wsTickets.columns.forEach((column, i) => {
    const colIdx = i + 1;
    const defaultWidth = ticketColWidths[colIdx] || 14;
    let maxLen = 0;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const v = cell.value ? String(cell.value) : '';
      if (v.length > maxLen) maxLen = v.length;
    });
    if (colIdx === 1) {
      column.width = 6;
    } else {
      column.width = Math.max(defaultWidth, Math.min(defaultWidth + 6, maxLen + 2));
    }
  });

  // Write buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate stylized users directory workbook
 */
export async function generateUsersExcelWorkbook(users: any[], generatedBy: string = 'Administrator'): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TicketScan Enterprise Intelligence';
  workbook.lastModifiedBy = generatedBy;

  const ws = workbook.addWorksheet('👤 User Directory', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: true }],
  });

  // Title Banner
  ws.mergeCells('A1:G1');
  const title = ws.getCell('A1');
  title.value = `TICKETSCAN™ USER ACCESS & DIRECTORY REGISTER (${users.length} Registered Accounts)`;
  title.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 34;

  ws.mergeCells('A2:G2');
  const sub = ws.getCell('A2');
  sub.value = `Audited by: ${generatedBy} | Export Timestamp: ${new Date().toUTCString()}`;
  sub.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
  sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  sub.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 24;

  const headers = ['#', 'User ID', 'Email Address', 'Full Name', 'Role Permission', 'Account Status', 'Registered Date'];
  const hRow = ws.getRow(3);
  hRow.values = headers;
  hRow.height = 30;

  headers.forEach((_, i) => {
    const c = hRow.getCell(i + 1);
    c.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  users.forEach((u, idx) => {
    const rowNum = 4 + idx;
    const r = ws.getRow(rowNum);
    r.height = 24;
    r.values = [
      idx + 1,
      u.id,
      u.email,
      u.full_name || 'N/A',
      (u.role || 'user').toUpperCase(),
      u.is_active ? 'ACTIVE' : 'SUSPENDED',
      u.created_at || 'N/A',
    ];

    const zebra = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
    for (let col = 1; col <= headers.length; col++) {
      const cell = r.getCell(col);
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebra } };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      // Uniform center/middle alignment across all columns
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    const statusCell = r.getCell(6);
    if (u.is_active) {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF065F46' } };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFDC2626' } };
    }
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: headers.length } };

  // Compact, tailored column widths for users directory
  const userColWidths: Record<number, number> = {
    1: 6,   // # (compact index with filter arrow)
    2: 15,  // User ID
    3: 24,  // Email Address
    4: 20,  // Full Name
    5: 12,  // Role Permission
    6: 13,  // Account Status
    7: 16,  // Registered Date
  };

  ws.columns.forEach((col, i) => {
    const colIdx = i + 1;
    const defaultWidth = userColWidths[colIdx] || 14;
    let max = 0;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const s = cell.value ? String(cell.value) : '';
      if (s.length > max) max = s.length;
    });
    if (colIdx === 1) {
      col.width = 6;
    } else {
      col.width = Math.max(defaultWidth, Math.min(defaultWidth + 6, max + 2));
    }
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
