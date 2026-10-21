'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  Train,
  Bus,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Clock,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Ticket, TransportMode, BookingStatus, TamperSignal } from '@/types/database';

interface TicketCardProps {
  ticket: Ticket;
  onEdit?: (ticket: Ticket) => void;
  onDelete?: (id: string) => void;
  showAdminActions?: boolean;
}

export function TicketCard({
  ticket,
  onEdit,
  onDelete,
  showAdminActions = false,
}: TicketCardProps) {
  const [expandedSignals, setExpandedSignals] = useState(false);

  // Transport Icon
  const getTransportIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'flight':
        return <Plane className="w-5 h-5 text-sky-400" />;
      case 'train':
        return <Train className="w-5 h-5 text-amber-400" />;
      case 'bus':
        return <Bus className="w-5 h-5 text-emerald-400" />;
      default:
        return <Plane className="w-5 h-5 text-slate-400" />;
    }
  };

  // Status Styling
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            CONFIRMED
          </span>
        );
      case 'waitlisted':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider">
            WAITLISTED
          </span>
        );
      case 'rac':
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-mono font-bold uppercase tracking-wider">
            RAC
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-mono font-bold uppercase tracking-wider">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600 text-xs font-mono uppercase">
            UNKNOWN
          </span>
        );
    }
  };

  // Tamper Badge Framing
  const score = ticket.tamper_risk_score !== null ? Number(ticket.tamper_risk_score) : 0;
  const signals: TamperSignal[] = Array.isArray(ticket.tamper_signals)
    ? ticket.tamper_signals
    : [];

  const getTamperBadge = () => {
    if (score < 0.3) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified Integrity (Risk: {Math.round(score * 100)}%)</span>
        </div>
      );
    }
    if (score < 0.65) {
      return (
        <button
          type="button"
          onClick={() => setExpandedSignals(!expandedSignals)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/70 border border-amber-500/50 text-amber-300 text-[11px] font-mono hover:bg-amber-900/60 transition cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Review Recommended ({signals.length} signals)</span>
          {expandedSignals ? (
            <ChevronUp className="w-3 h-3 ml-0.5" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-0.5" />
          )}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setExpandedSignals(!expandedSignals)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/60 text-red-300 text-[11px] font-mono hover:bg-red-900/60 transition cursor-pointer"
      >
        <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
        <span>Potential Inconsistencies ({signals.length} signals)</span>
        {expandedSignals ? (
          <ChevronUp className="w-3 h-3 ml-0.5" />
        ) : (
          <ChevronDown className="w-3 h-3 ml-0.5" />
        )}
      </button>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '--:--';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 transition-all duration-300 relative group">
      {/* Decorative Top Airline Color Band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-sky-500 to-amber-400" />

      {/* Responsive Boarding Pass Layout */}
      <div className="flex flex-col lg:flex-row items-stretch">
        {/* MAIN TICKET SECTION */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          {/* Top Line: Carrier & Transport badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
                {getTransportIcon(ticket.transport_mode)}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{ticket.carrier_name || 'Travel Carrier'}</span>
                  {ticket.manually_corrected && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950/80 border border-sky-500/40 text-sky-300">
                      Edited
                    </span>
                  )}
                </h3>
                <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                  {ticket.transport_mode} clearance
                </span>
              </div>
            </div>

            {/* Tamper Risk Indicator */}
            <div>{getTamperBadge()}</div>
          </div>

          {/* Route Section: Origin -> Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 py-2 border-y border-slate-800/80">
            {/* Origin */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" /> Origin
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {ticket.boarding_place || 'Departure Place'}
              </div>
              <div className="text-xs font-mono text-slate-400">
                {formatDate(ticket.departure_datetime)} • {formatTime(ticket.departure_datetime)}
              </div>
            </div>

            {/* Direction Arrow */}
            <div className="hidden sm:flex flex-col items-center justify-center space-y-1">
              <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                Direct
              </span>
              <div className="w-full flex items-center gap-1">
                <div className="h-0.5 w-full bg-slate-700 border-t border-dashed border-slate-600" />
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-0.5 sm:text-right">
              <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center sm:justify-end gap-1">
                <MapPin className="w-3 h-3 text-sky-400" /> Destination
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {ticket.destination_place || 'Arrival Place'}
              </div>
              <div className="text-xs font-mono text-slate-400">
                {formatDate(ticket.arrival_datetime)} • {formatTime(ticket.arrival_datetime)}
              </div>
            </div>
          </div>

          {/* Passenger & Seat Meta Line */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Passenger</span>
              <div className="font-semibold text-slate-200 truncate flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {ticket.passenger_name || 'Anonymous'}{' '}
                  {ticket.passenger_age ? `(${ticket.passenger_age}y)` : ''}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Seat / Coach</span>
              <div className="font-semibold text-amber-300 truncate mt-0.5 font-mono">
                {ticket.seat_class_coach || 'General / Unassigned'}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">AI Confidence</span>
              <div className="font-semibold text-slate-200 mt-0.5 flex items-center gap-1 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  {ticket.extraction_confidence
                    ? `${Math.round(Number(ticket.extraction_confidence) * 100)}%`
                    : '90%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PERFORATION NOTCH DIVIDER (Desktop: Vertical, Mobile: Horizontal) */}
        <div className="relative flex items-center justify-center">
          {/* Desktop Vertical Perforated Border */}
          <div className="hidden lg:block w-px h-full border-r-2 border-dashed border-slate-700/70" />
          {/* Mobile Horizontal Perforated Border */}
          <div className="lg:hidden w-full h-px border-b-2 border-dashed border-slate-700/70" />

          {/* Die-Cut Circular Notches */}
          <div className="hidden lg:block absolute -top-3 w-6 h-6 rounded-full bg-[#090e17] border border-slate-800" />
          <div className="hidden lg:block absolute -bottom-3 w-6 h-6 rounded-full bg-[#090e17] border border-slate-800" />
          <div className="lg:hidden absolute -left-3 w-6 h-6 rounded-full bg-[#090e17] border border-slate-800" />
          <div className="lg:hidden absolute -right-3 w-6 h-6 rounded-full bg-[#090e17] border border-slate-800" />
        </div>

        {/* TICKET STUB SECTION */}
        <div className="w-full lg:w-72 bg-slate-900/60 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                BOARDING STUB
              </span>
              <span className="text-[10px] font-mono text-slate-500">GATE TS</span>
            </div>

            {/* PNR / Booking ID */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                PNR / BOOKING REF
              </span>
              <div className="text-base font-mono font-black text-amber-400 tracking-wider">
                {ticket.pnr_booking_id || 'UNKNOWN'}
              </div>
            </div>

            {/* Booking Status Badge */}
            <div className="flex justify-start">{getStatusBadge(ticket.booking_status)}</div>
          </div>

          {/* Barcode Graphic & Actions */}
          <div className="space-y-3 pt-2">
            <div className="h-6 barcode-pattern opacity-30 rounded-sm" />

            <div className="flex items-center gap-2 pt-1">
              <Link
                href={`/tickets/${ticket.id}`}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Details</span>
              </Link>

              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(ticket)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition cursor-pointer"
                  title="Edit details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(ticket.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-500 hover:text-white text-slate-300 transition cursor-pointer"
                  title="Delete ticket"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Tamper Signals Drawer */}
      <AnimatePresence>
        {expandedSignals && signals.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800 bg-slate-950/80 p-4 sm:p-5 text-xs space-y-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                Detected Forensic Signals ({signals.length})
              </span>
              <span className="text-[11px] font-mono text-slate-500">Risk Score: {score}</span>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {signals.map((sig, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold">
                    <span className="text-slate-200 capitalize">
                      {sig.signal.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`uppercase text-[10px] px-1.5 py-0.5 rounded ${
                        sig.risk_level === 'high'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {sig.risk_level}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{sig.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
