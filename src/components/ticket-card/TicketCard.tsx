'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  Train,
  Bus,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  MapPin,
  Users,
  User,
  Armchair,
  Sparkles,
  Wallet,
  Compass,
  Link2,
  FileText,
  ExternalLink,
  Edit2,
  Trash2,
  Ticket as TicketIcon,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react';
import { Ticket, TransportMode, BookingStatus, TamperSignal } from '@/types/database';
import {
  HERO_IMAGES,
  CURATED_LOCATION_REGISTRY,
  normalizeLocationKey,
} from '@/lib/location-images-client';

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

  // Initial synchronous image resolution from local curated registry for instant rendering
  const originNorm = normalizeLocationKey(ticket.boarding_place, ticket.transport_mode);
  const destNorm = normalizeLocationKey(ticket.destination_place, ticket.transport_mode);

  const initialOriginSrc =
    CURATED_LOCATION_REGISTRY[originNorm.locationKey]?.imagePath ||
    CURATED_LOCATION_REGISTRY['default'].imagePath;
  const initialDestSrc =
    CURATED_LOCATION_REGISTRY[destNorm.locationKey]?.imagePath ||
    CURATED_LOCATION_REGISTRY['default'].imagePath;

  const [originImage, setOriginImage] = useState<string>(initialOriginSrc);
  const [destImage, setDestImage] = useState<string>(initialDestSrc);
  const [originLoaded, setOriginLoaded] = useState(false);
  const [destLoaded, setDestLoaded] = useState(false);

  // Mode hero banner image
  const heroImage = HERO_IMAGES[ticket.transport_mode] || HERO_IMAGES.flight;

  // Asynchronously query location-images API for dynamic cached locations
  useEffect(() => {
    let isMounted = true;
    const fetchImages = async () => {
      try {
        const queryParams = new URLSearchParams({
          origin: ticket.boarding_place || '',
          destination: ticket.destination_place || '',
          mode: ticket.transport_mode,
        });

        const res = await fetch(`/api/location-images?${queryParams.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success) {
          if (data.origin?.image_path) {
            setOriginImage(data.origin.image_path);
          }
          if (data.destination?.image_path) {
            setDestImage(data.destination.image_path);
          }
        }
      } catch (err) {
        console.warn('Location image fetch notice:', err);
      }
    };

    fetchImages();
    return () => {
      isMounted = false;
    };
  }, [ticket.boarding_place, ticket.destination_place, ticket.transport_mode]);

  // Mode Icon
  const getTransportIcon = (mode: TransportMode, className = 'w-5 h-5') => {
    switch (mode) {
      case 'flight':
        return <Plane className={className} />;
      case 'train':
        return <Train className={className} />;
      case 'bus':
        return <Bus className={className} />;
      default:
        return <Plane className={className} />;
    }
  };

  // Status Badge
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 text-xs font-mono font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            CONFIRMED
          </span>
        );
      case 'waitlisted':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 border border-amber-500/40 text-xs font-mono font-extrabold uppercase tracking-wider">
            WAITLISTED
          </span>
        );
      case 'rac':
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-700 border border-blue-500/40 text-xs font-mono font-extrabold uppercase tracking-wider">
            RAC
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-700 border border-red-500/40 text-xs font-mono font-extrabold uppercase tracking-wider">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-slate-300 text-slate-700 border border-slate-400 text-xs font-mono uppercase font-semibold">
            UNKNOWN
          </span>
        );
    }
  };

  // Tamper Risk Badge
  const score = ticket.tamper_risk_score !== null ? Number(ticket.tamper_risk_score) : 0;
  const signals: TamperSignal[] = Array.isArray(ticket.tamper_signals)
    ? ticket.tamper_signals
    : [];

  const getTamperBadge = () => {
    if (score < 0.3) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-medium">Verified Integrity (Risk: {Math.round(score * 100)}%)</span>
        </div>
      );
    }
    if (score < 0.65) {
      return (
        <button
          type="button"
          onClick={() => setExpandedSignals(!expandedSignals)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[11px] font-mono hover:bg-amber-900/70 transition cursor-pointer shadow-sm"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/60 text-red-300 text-[11px] font-mono hover:bg-red-900/70 transition cursor-pointer shadow-sm"
      >
        <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />
        <span>Potential Inconsistencies ({signals.length} signals)</span>
        {expandedSignals ? (
          <ChevronUp className="w-3 h-3 ml-0.5" />
        ) : (
          <ChevronDown className="w-3 h-3 ml-0.5" />
        )}
      </button>
    );
  };

  // Date / Time Formatting
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        timeZone: 'UTC',
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
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '--:--';
    }
  };

  // Meta parsing
  const meta: any = ticket.raw_extraction_json || {};
  const paxList: string[] =
    Array.isArray(meta.passengers) && meta.passengers.length > 0
      ? meta.passengers.map((p: any) => p.name)
      : ticket.passenger_name
      ? ticket.passenger_name.split(',').map((s) => s.trim())
      : [];
  const leadPax = paxList[0] || ticket.passenger_name || 'Passenger';
  const otherPaxCount = Math.max(0, paxList.length - 1);

  // Confidence & Progress
  const confidencePercent = ticket.extraction_confidence
    ? Math.round(Number(ticket.extraction_confidence) * 100)
    : 98;

  // Carrier Title
  const carrierTitle =
    ticket.carrier_name ||
    (ticket.transport_mode === 'flight'
      ? 'Flight Service'
      : ticket.transport_mode === 'bus'
      ? 'Express Coach'
      : 'Superfast Express');

  // Gate / Terminal
  const gateInfo =
    meta.gate ||
    (ticket.transport_mode === 'flight' ? (meta.terminal ? `T${meta.terminal}` : 'TS --') : '--');

  return (
    <div className="w-full rounded-[26px] bg-[#0c1222] border border-slate-800/90 shadow-2xl overflow-hidden hover:border-slate-700/80 transition-all duration-300 relative group/card flex flex-col space-y-3 p-3 sm:p-4">
      {/* Top Subtle Amber-Cyan Border Glow Strip */}
      <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-amber-500/80 via-sky-400/90 to-amber-500/80 rounded-b-full opacity-90 shadow-[0_0_12px_rgba(56,189,248,0.35)]" />

      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP HERO BANNER (Mode-specific static imagery with gradient mask)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-[100px] sm:h-[108px] rounded-2xl bg-[#0f172a] border border-slate-800/80 overflow-hidden flex items-center justify-between p-3.5 sm:p-4 shadow-lg group/hero">
        {/* Photographic Mode Hero Banner Image on right, faded smoothly to card background */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[58%] sm:w-[50%] h-full pointer-events-none select-none overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.85) 60%, black 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.85) 60%, black 100%)',
          }}
        >
          <img
            src={heroImage}
            alt={`${ticket.transport_mode} hero`}
            className="w-full h-full object-cover object-center transform group-hover/hero:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        </div>

        {/* Left Side: Mode Icon + Carrier Name + Clearance */}
        <div className="relative z-10 flex flex-col justify-center h-full max-w-[70%] sm:max-w-[65%]">
          <div className="flex items-center gap-3">
            {/* Rounded-square icon badge matching mockup */}
            <div
              className={`p-2.5 rounded-2xl border flex items-center justify-center shadow-md shrink-0 ${
                ticket.transport_mode === 'flight'
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-400 shadow-sky-500/20'
                  : ticket.transport_mode === 'train'
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-400 shadow-amber-500/20'
                  : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400 shadow-emerald-500/20'
              }`}
            >
              {getTransportIcon(ticket.transport_mode, 'w-5 h-5')}
            </div>

            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate flex items-center gap-2">
                <span>{carrierTitle}</span>
                {ticket.manually_corrected && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-950 border border-sky-500/40 text-sky-300">
                    Edited
                  </span>
                )}
              </h3>
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-slate-400">
                {ticket.transport_mode} clearance
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. ORIGIN / DESTINATION SPLIT PHOTO BANNER (Side-by-side against each other)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-inner">
        <div className="grid grid-cols-2 relative min-h-[160px] sm:min-h-[175px]">
          {/* Origin Panel (Left) */}
          <div className="relative min-h-[160px] sm:min-h-[175px] overflow-hidden group/origin border-r border-slate-800/80">
            {/* Location Photo */}
            <img
              src={originImage}
              alt={ticket.boarding_place || 'Origin location'}
              loading="lazy"
              onLoad={() => setOriginLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover object-center transform group-hover/origin:scale-105 transition-all duration-700 ease-out ${
                originLoaded ? 'opacity-90' : 'opacity-0'
              }`}
            />
            {!originLoaded && (
              <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
                <MapPin className="w-5 h-5 text-slate-700 animate-bounce" />
              </div>
            )}

            {/* Dark Gradient Overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />

            {/* Origin Content Overlay */}
            <div className="relative z-10 p-3 sm:p-5 flex flex-col justify-between h-full">
              <div className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>ORIGIN</span>
              </div>

              <div className="pt-3 sm:pt-4">
                <div className="text-xs sm:text-base md:text-lg font-extrabold text-white tracking-tight drop-shadow-md truncate">
                  {ticket.boarding_place || 'Origin TBD'}
                </div>
                <div className="text-[10px] sm:text-xs font-mono text-slate-300/90 pt-0.5 truncate">
                  {formatDate(ticket.departure_datetime)} • {formatTime(ticket.departure_datetime)}
                </div>
              </div>
            </div>
          </div>

          {/* Center Route Connector */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-950/85 border border-slate-700/80 backdrop-blur-md shadow-xl text-slate-300">
              <div className="w-2.5 sm:w-4 h-0.5 border-t border-dashed border-slate-500" />
              {getTransportIcon(ticket.transport_mode, 'w-3.5 h-3.5 text-slate-200')}
              <div className="w-2.5 sm:w-4 h-0.5 border-t border-dashed border-slate-500" />
            </div>
            <div className="mt-0.5 sm:mt-1 flex flex-col items-center">
              <span className="text-[8px] sm:text-[9px] font-mono tracking-widest uppercase text-slate-400 font-bold">
                {meta.route_type || 'DIRECT'}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-4 sm:w-6 h-0.5 bg-slate-600 rounded-full" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Destination Panel (Right) */}
          <div className="relative min-h-[160px] sm:min-h-[175px] overflow-hidden group/dest text-right">
            {/* Location Photo */}
            <img
              src={destImage}
              alt={ticket.destination_place || 'Destination location'}
              loading="lazy"
              onLoad={() => setDestLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover object-center transform group-hover/dest:scale-105 transition-all duration-700 ease-out ${
                destLoaded ? 'opacity-90' : 'opacity-0'
              }`}
            />
            {!destLoaded && (
              <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
                <MapPin className="w-5 h-5 text-slate-700 animate-bounce" />
              </div>
            )}

            {/* Dark Gradient Overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />

            {/* Destination Content Overlay */}
            <div className="relative z-10 p-3 sm:p-5 flex flex-col justify-between h-full">
              <div className="inline-flex items-center justify-end gap-1.5 text-sky-400 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>DESTINATION</span>
              </div>

              <div className="pt-3 sm:pt-4">
                <div className="text-xs sm:text-base md:text-lg font-extrabold text-white tracking-tight drop-shadow-md truncate">
                  {ticket.destination_place || 'Destination TBD'}
                </div>
                <div className="text-[10px] sm:text-xs font-mono text-slate-300/90 pt-0.5 truncate">
                  {formatDate(ticket.arrival_datetime)} • {formatTime(ticket.arrival_datetime)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. INFO CHIP GRID (Icon-led cards matching mockups)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-2 sm:space-y-2.5">
        {/* Row 1: Passengers & Seat / Coach (Always 2 chips side-by-side) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {/* Passengers Chip */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#111927] border border-slate-800/80 flex flex-col justify-between space-y-1.5 sm:space-y-2 shadow-sm min-w-0">
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
              <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">PASSENGERS ({paxList.length > 0 ? paxList.length : 1})</span>
            </div>
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <User className="w-3 h-3 text-slate-300" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  {leadPax}
                </span>
              </div>
              {otherPaxCount > 0 && (
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 shrink-0">
                  +{otherPaxCount} more
                </span>
              )}
            </div>
          </div>

          {/* Seat / Coach Chip */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#111927] border border-slate-800/80 flex flex-col justify-between space-y-1.5 sm:space-y-2 shadow-sm min-w-0">
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
              <Armchair className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">SEAT / COACH</span>
            </div>
            <div className="flex items-center justify-between gap-1 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-amber-400 font-mono tracking-tight truncate">
                {ticket.seat_class_coach ||
                  (ticket.transport_mode === 'flight'
                    ? 'Economy'
                    : ticket.transport_mode === 'bus'
                    ? 'Window / Pushback'
                    : 'Chair Car (CC)')}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
            </div>
          </div>
        </div>

        {/* Row 2: Dynamic chips based on presence of Quota (train vs flight/bus) */}
        {meta.quota ? (
          <>
            {/* Train Layout: 3 chips in Row 2 (AI Confidence, Quota, Fare) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {/* AI Confidence Chip with glowing progress bar */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#111927] border border-slate-800/80 flex flex-col justify-between space-y-1 sm:space-y-1.5 shadow-sm min-w-0">
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                  <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="truncate">AI CONFIDENCE</span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm sm:text-base font-bold text-white font-mono">{confidencePercent}%</div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)] transition-all duration-1000 ease-out"
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quota Chip */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#111927] border border-slate-800/80 flex flex-col justify-between space-y-1 sm:space-y-1.5 shadow-sm min-w-0">
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                  <FileText className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="truncate">Quota</span>
                </div>
                <div className="truncate">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-white border border-slate-700/80 text-[10px] sm:text-xs font-mono font-bold tracking-tight inline-block truncate max-w-full">
                    {meta.quota}
                  </span>
                </div>
              </div>

              {/* Fare Chip */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#111927] border border-slate-800/80 flex flex-col justify-between space-y-1 sm:space-y-1.5 shadow-sm min-w-0">
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                  <Wallet className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="truncate">Fare</span>
                </div>
                <div className="truncate">
                  <span className="px-2 py-1 rounded-xl bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-[11px] sm:text-xs font-mono font-black tracking-tight inline-block truncate">
                    {meta.total_fare || '₹943.60'}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3 (Train): Distance Chip */}
            <div className="flex">
              <div className="p-2 sm:p-2.5 px-3 sm:px-4 rounded-2xl bg-[#111927] border border-slate-800/80 inline-flex items-center gap-2.5 shadow-sm">
                <Link2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Distance</span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700/80 text-xs font-mono font-bold">
                  {meta.distance_km || '252 KM'}
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Flight / Bus Layout: 3 chips in Row 2 (AI Confidence, Fare, Distance) */
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {/* AI Confidence Chip with glowing progress bar */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-[#111927] border border-slate-800/80 flex flex-col justify-between space-y-1 sm:space-y-1.5 shadow-sm min-w-0">
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate">AI CONFIDENCE</span>
              </div>
              <div className="space-y-1">
                <div className="text-sm sm:text-base font-bold text-white font-mono">{confidencePercent}%</div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Fare Chip */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-[#111927] border border-slate-800/80 flex flex-col justify-between space-y-1 sm:space-y-1.5 shadow-sm min-w-0">
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                <Wallet className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate">Fare</span>
              </div>
              <div className="truncate">
                <span className="px-2 py-1 rounded-xl bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-[11px] sm:text-xs font-mono font-black tracking-tight inline-block truncate">
                  {meta.total_fare || '₹55,350.00'}
                </span>
              </div>
            </div>

            {/* Distance Chip */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-[#111927] border border-slate-800/80 flex flex-col justify-between space-y-1 sm:space-y-1.5 shadow-sm min-w-0">
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                <Compass className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate">Distance</span>
              </div>
              <div className="truncate">
                <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700/80 text-[10px] sm:text-xs font-mono font-semibold tracking-tight inline-block truncate max-w-full">
                  {meta.distance_km || 'Direct Air Route'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. BOARDING STUB (Cream/off-white background with die-cut edges)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full rounded-2xl bg-[#f7f3e8] p-4 sm:p-5 text-slate-900 shadow-md border border-amber-200/60 overflow-hidden space-y-3.5">
        {/* Die-Cut Circular Notches on Left and Right Edges */}
        <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#0c1222] border-r border-slate-800 shadow-inner z-20 pointer-events-none" />
        <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#0c1222] border-l border-slate-800 shadow-inner z-20 pointer-events-none" />

        {/* Top Perforation Edge Marker */}
        <div className="flex items-center justify-between text-slate-700">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-black tracking-widest uppercase">
            <TicketIcon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <span>BOARDING STUB</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 font-bold uppercase">
            {getTransportIcon(ticket.transport_mode, 'w-3.5 h-3.5 text-slate-600')}
            <span>GATE {gateInfo}</span>
          </div>
        </div>

        {/* Dark Inset Monospace PNR Box with Faded Mode Watermark */}
        <div className="relative rounded-2xl bg-[#0b1220] p-4 border border-slate-800 shadow-inner overflow-hidden flex flex-col justify-between">
          {/* Faded Mode Watermark Icon on right side of inset box */}
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-15 text-slate-400 pointer-events-none select-none">
            {getTransportIcon(ticket.transport_mode, 'w-24 h-24')}
          </div>

          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
            PNR / BOOKING REF
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 tracking-wider pt-1">
            {ticket.pnr_booking_id || 'UNKNOWN'}
          </div>
        </div>

        {/* Status Badge & Barcode Pattern */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div>{getStatusBadge(ticket.booking_status)}</div>

          {/* Barcode graphic lines */}
          <div
            className="w-36 sm:w-52 h-8 barcode-dark opacity-85 rounded-sm"
            title="Ticket Barcode"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          5. ACTION BUTTONS (Details, Edit, Delete)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2.5 pt-1">
        <Link
          href={`/tickets/${ticket.id}`}
          className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Details</span>
        </Link>

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(ticket)}
            className="p-3 rounded-2xl bg-[#111927] hover:bg-amber-500/20 hover:text-amber-400 text-slate-300 border border-slate-800 transition cursor-pointer"
            title="Edit ticket details"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(ticket.id)}
            className="p-3 rounded-2xl bg-[#111927] hover:bg-red-500/20 hover:text-red-400 text-slate-300 border border-slate-800 transition cursor-pointer"
            title="Delete ticket"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          6. EXPANDABLE FORENSIC SIGNALS DRAWER
         ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {expandedSignals && signals.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800 bg-slate-950/90 rounded-2xl p-4 text-xs space-y-2.5 overflow-hidden"
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
