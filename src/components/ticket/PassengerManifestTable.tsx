'use client';

import React from 'react';
import { Ticket, PassengerItem } from '@/types/database';
import { calculateSplitFare } from '@/lib/passenger-intelligence';
import {
  Users,
  CreditCard,
  Hash,
  Calendar,
  MapPin,
  Train,
  Plane,
  Bus,
  Tag,
  Clock,
  Compass,
  DollarSign,
  Receipt,
  FileCheck2,
  Armchair,
} from 'lucide-react';

interface Props {
  ticket: Ticket;
}

export function PassengerManifestTable({ ticket }: Props) {
  const meta: any = ticket.raw_extraction_json || {};
  const isFlight = ticket.transport_mode === 'flight';
  const isBus = ticket.transport_mode === 'bus';

  // Extract passenger list or build from primary
  const passengers: PassengerItem[] =
    Array.isArray(meta.passengers) && meta.passengers.length > 0
      ? meta.passengers
      : ticket.passenger_name
      ? ticket.passenger_name.split(',').map((name, i) => ({
          num: i + 1,
          name: name.trim(),
          age: i === 0 ? ticket.passenger_age : null,
          gender: null,
          booking_status: ticket.booking_status,
          current_status: ticket.booking_status,
          seat: ticket.seat_class_coach,
        }))
      : [];

  const fareStr = meta.total_fare || meta.ticket_fare || '';
  const splitInfo = calculateSplitFare(fareStr, passengers.length);

  const formatUtcTime = (iso: string | null) => {
    if (!iso) return '--:--';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '--:--';
    }
  };

  const getCleanStatus = (status?: string | null) => {
    if (!status) return 'Confirmed';
    return status.trim();
  };

  const getStatusBadge = (rawStatus?: string | null) => {
    const status = getCleanStatus(rawStatus);
    const s = status.toLowerCase();

    if (s.includes('wl') || s.includes('waitlist')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold whitespace-nowrap">
          {status}
        </span>
      );
    }
    if (s.includes('cnf') || s.includes('confirm')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold whitespace-nowrap">
          {status}
        </span>
      );
    }
    if (s.includes('rac')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono text-[11px] font-bold whitespace-nowrap">
          {status}
        </span>
      );
    }
    if (s.includes('can')) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 font-mono text-[11px] font-bold whitespace-nowrap">
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] whitespace-nowrap">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. PASSENGER MANIFEST SECTION */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Header Banner */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Passenger Manifest & Seat Allotment
              </h3>
              <p className="text-xs text-slate-400">
                Exact passenger list, age, gender, and booking vs. current status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-medium">
              {passengers.length} {passengers.length === 1 ? 'Passenger' : 'Passengers'}
            </span>
            {meta.quota && (
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                {meta.quota}
              </span>
            )}
          </div>
        </div>

        {/* MOBILE VIEW: Clean, Responsive Passenger Cards (< md) */}
        <div className="md:hidden p-3.5 space-y-3">
          {passengers.length > 0 ? (
            passengers.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-3 shadow-md"
              >
                {/* Passenger Header: Index, Name & Lead Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {p.num || idx + 1}
                    </span>
                    <span className="font-bold text-white text-sm tracking-tight truncate">
                      {p.name}
                    </span>
                  </div>
                  {idx === 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950/80 border border-sky-500/40 text-sky-300 uppercase shrink-0 font-bold">
                      Lead
                    </span>
                  )}
                </div>

                {/* Details Grid: Age/Gender + Designated Seat */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/70 font-mono">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                      Age & Gender
                    </span>
                    <span className="text-slate-200">
                      {p.age ? `${p.age} yrs` : 'Adult'}
                      {p.gender ? ` • ${p.gender}` : ''}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold flex items-center gap-1">
                      <Armchair className="w-3 h-3 text-amber-400" />
                      {isFlight ? 'Seat / Cabin' : 'Coach / Seat'}
                    </span>
                    <span className="text-amber-300 font-bold">
                      {p.seat
                        ? isFlight
                          ? `Seat ${p.seat}`
                          : p.seat
                        : ticket.seat_class_coach || 'Assigned'}
                    </span>
                  </div>
                </div>

                {/* Individual Split Fare in Mobile Card */}
                {splitInfo.splitAmount > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-xs font-mono">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      Individual Fare Share:
                    </span>
                    <span className="font-bold text-emerald-400">
                      {splitInfo.formattedSplit} {passengers.length > 1 ? `(1 of ${passengers.length} pax)` : ''}
                    </span>
                  </div>
                )}

                {/* Status Section */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/70 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                      Current:
                    </span>
                    {getStatusBadge(p.current_status || p.booking_status || 'Confirmed')}
                  </div>

                  {p.booking_status && p.booking_status !== p.current_status && (
                    <div className="text-[10px] font-mono text-slate-400">
                      Booked: <span className="text-slate-300">{p.booking_status}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-slate-400 font-mono text-xs">
              No individual passenger names recorded on ticket
            </div>
          )}
        </div>

        {/* DESKTOP VIEW: Full Structured Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800/80 font-mono uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="py-3 px-5 w-12 text-center">#</th>
                <th className="py-3 px-5">Passenger Name</th>
                <th className="py-3 px-5">Age & Gender</th>
                <th className="py-3 px-5">Booking Status</th>
                <th className="py-3 px-5">Current Status</th>
                <th className="py-3 px-5">{isFlight ? 'Seat / Cabin Class' : 'Coach / Seat / Class'}</th>
                <th className="py-3 px-5">Individual Split Fare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {passengers.length > 0 ? (
                passengers.map((p, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-800/40 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-5 font-mono text-slate-500 text-center font-bold whitespace-nowrap">
                      {p.num || idx + 1}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                        <span>{p.name}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-950/80 border border-sky-500/40 text-sky-300 uppercase">
                            Lead
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300 font-mono whitespace-nowrap">
                      {p.age ? `${p.age} yrs` : 'Adult'}
                      {p.gender ? ` • ${p.gender}` : ''}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {getStatusBadge(p.booking_status || 'Confirmed')}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {getStatusBadge(p.current_status || p.booking_status || 'Confirmed')}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-medium text-amber-300 whitespace-nowrap">
                      {p.seat ? (isFlight ? `Seat ${p.seat}` : p.seat) : (ticket.seat_class_coach || 'Assigned')}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {splitInfo.formattedSplit}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 font-mono">
                    No individual passenger names recorded on ticket
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. THREE KEY METRIC CARDS: FARES, BOOKING REF, ROUTE LOGISTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full">
        {/* CARD A: Fare & Payment Details */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400">
            <Receipt className="w-4 h-4" />
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white">
              Payment & Fares
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Ticket Base Fare</span>
              <span className="font-mono font-semibold text-slate-200">
                {meta.ticket_fare || meta.total_fare || 'N/A'}
              </span>
            </div>
            {meta.convenience_fee && (
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">
                  {isFlight ? 'Taxes & Surcharges' : isBus ? 'Platform Fee' : 'Convenience Fee'}
                </span>
                <span className="font-mono font-semibold text-slate-200">
                  {meta.convenience_fee}
                </span>
              </div>
            )}
            {splitInfo.paxCount > 1 && splitInfo.splitAmount > 0 && (
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Individual Share</span>
                <span className="font-mono font-bold text-emerald-400">
                  {splitInfo.formattedSplit} <span className="text-slate-400 text-[10px]">({splitInfo.paxCount} pax)</span>
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-white">Total Amount Paid</span>
              <span className="font-mono text-base font-extrabold text-amber-400">
                {meta.total_fare || meta.ticket_fare || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD B: Booking & System Details */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sky-400">
            <Hash className="w-4 h-4" />
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white">
              {isFlight ? 'Flight Booking Details' : 'Booking Verification'}
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">{isFlight ? 'Airline PNR' : 'PNR Reference'}</span>
              <span className="font-mono font-bold text-amber-400 truncate max-w-[150px]">
                {ticket.pnr_booking_id || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">{isFlight ? 'Booking ID' : 'Transaction ID'}</span>
              <span className="font-mono font-semibold text-slate-200 truncate max-w-[150px]">
                {meta.transaction_id || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Booked On</span>
              <span className="font-mono text-[11px] text-slate-300">
                {meta.booking_date || (ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-GB') : 'N/A')}
              </span>
            </div>
          </div>
        </div>

        {/* CARD C: Journey Logistics */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400">
            <Compass className="w-4 h-4" />
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white">
              Journey Logistics
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">
                {isFlight ? 'Airline / Carrier' : isBus ? 'Bus Operator' : 'Train / Carrier'}
              </span>
              <span className="font-bold text-white truncate max-w-[150px]">
                {ticket.carrier_name || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">
                {isFlight ? 'Flight Route' : 'Travel Distance'}
              </span>
              <span className="font-mono font-semibold text-slate-200">
                {meta.distance_km || (isFlight ? 'Direct Flight' : 'N/A')}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Schedule</span>
              <span className="font-mono text-[11px] text-amber-300">
                {formatUtcTime(ticket.departure_datetime)} → {formatUtcTime(ticket.arrival_datetime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
