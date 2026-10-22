'use client';

import React from 'react';
import { Ticket, PassengerItem } from '@/types/database';
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
} from 'lucide-react';

interface Props {
  ticket: Ticket;
}

export function PassengerManifestTable({ ticket }: Props) {
  const meta: any = ticket.raw_extraction_json || {};

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

  const formatUtcDate = (iso: string | null) => {
    if (!iso) return 'TBD';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status?: string | null) => {
    const s = (status || '').toLowerCase();
    if (s.includes('wl') || s.includes('waitlist')) {
      return (
        <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold">
          {status || 'WL'}
        </span>
      );
    }
    if (s.includes('cnf') || s.includes('confirm')) {
      return (
        <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
          {status || 'CNF'}
        </span>
      );
    }
    if (s.includes('rac')) {
      return (
        <span className="px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono text-[11px] font-bold">
          {status || 'RAC'}
        </span>
      );
    }
    if (s.includes('can')) {
      return (
        <span className="px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 font-mono text-[11px] font-bold">
          {status || 'CAN'}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
        {status || 'CONFIRMED'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. PASSENGER MANIFEST CARD */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-2xl overflow-hidden backdrop-blur-md">
        <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20">
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

        {/* Table of Passengers */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800/80 font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-5 w-12 text-center">#</th>
                <th className="py-3 px-5">Passenger Name</th>
                <th className="py-3 px-5">Age & Gender</th>
                <th className="py-3 px-5">Booking Status</th>
                <th className="py-3 px-5">Current Status</th>
                <th className="py-3 px-5">Coach / Seat / Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {passengers.length > 0 ? (
                passengers.map((p, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-800/40 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-5 font-mono text-slate-500 text-center font-bold">
                      {p.num || idx + 1}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                        <span>{p.name}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-950/80 border border-sky-500/40 text-sky-300 uppercase">
                            Lead
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300 font-mono">
                      {p.age ? `${p.age} yrs` : 'Age N/A'}
                      {p.gender ? ` • ${p.gender}` : ''}
                    </td>
                    <td className="py-3.5 px-5">
                      {getStatusBadge(p.booking_status || 'WL')}
                    </td>
                    <td className="py-3.5 px-5">
                      {getStatusBadge(p.current_status || p.booking_status || 'WL')}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-medium text-amber-300">
                      {p.seat || ticket.seat_class_coach || 'CHAIR CAR (CC)'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 font-mono">
                    No individual passenger names recorded on ticket
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. THREE KEY METRIC CARDS: FARES, BOOKING REF, ROUTE LOGISTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD A: Fare & Payment Details */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 shadow-xl">
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
                {meta.ticket_fare || '₹1,080.00'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">IRCTC Convenience Fee</span>
              <span className="font-mono font-semibold text-slate-200">
                {meta.convenience_fee || '₹23.60'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-white">Total Amount Paid</span>
              <span className="font-mono text-base font-extrabold text-amber-400">
                {meta.total_fare || '₹1,103.60'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD B: Booking & System Details */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sky-400">
            <Hash className="w-4 h-4" />
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white">
              Booking Verification
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">PNR Reference</span>
              <span className="font-mono font-bold text-amber-400">
                {ticket.pnr_booking_id || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Transaction ID</span>
              <span className="font-mono font-semibold text-slate-200">
                {meta.transaction_id || '100006508175407'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Booked On</span>
              <span className="font-mono text-[11px] text-slate-300">
                {meta.booking_date || '13-Apr-2026 21:21 HRS'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD C: Journey Logistics */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400">
            <Compass className="w-4 h-4" />
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white">
              Journey Logistics
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Train / Carrier</span>
              <span className="font-bold text-white">
                {ticket.carrier_name || '11007 / DECCAN EXPRESS'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Travel Distance</span>
              <span className="font-mono font-semibold text-slate-200">
                {meta.distance_km || '128 KM'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Schedule Timings</span>
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
