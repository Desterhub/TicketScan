'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { TixsurancePolicy } from '@/types/tixsurance';

interface TicketInsuranceCardProps {
  bookingId?: string;
  ticketFare?: number;
  origin?: string;
  destination?: string;
}

export function TicketInsuranceCard({
  bookingId = 'FAREDEMO2139XG',
  ticketFare = 3600,
  origin,
  destination,
}: TicketInsuranceCardProps) {
  const [policy, setPolicy] = useState<TixsurancePolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/tixsurance/policy?bookingId=${encodeURIComponent(bookingId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.policy) setPolicy(data.policy);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const premium5Pct = Math.round(ticketFare * 0.05);
  const premium7Pct = Math.round(ticketFare * 0.07);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-blue-500/30 rounded-2xl p-5 shadow-xl shadow-blue-950/20 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider text-white">TIXSURANCE™ SHIELD</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ZERO-FRAUD
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Event Ticket &amp; Travel Emergency Protection</p>
          </div>
        </div>

        {policy ? (
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              policy.policyType === 'LOCAL'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            PROTECTED ({policy.policyType} &bull; {policy.status})
          </span>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            <span>48H Post-Booking Grace Window</span>
          </div>
        )}
      </div>

      {policy ? (
        /* Insured State */
        <div className="pt-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
              <div className="text-slate-400 text-[10px]">Policy ID</div>
              <div className="font-bold text-slate-200 mt-0.5">{policy.id}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
              <div className="text-slate-400 text-[10px]">Insured Value</div>
              <div className="font-bold text-emerald-400 mt-0.5">₹{policy.ticketFare.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
              <div className="text-slate-400 text-[10px]">Corridor Radius</div>
              <div className="font-bold text-slate-200 mt-0.5">
                {policy.distanceKm} km ({policy.policyType === 'LOCAL' ? '≤100km' : '&gt;100km'})
              </div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
              <div className="text-slate-400 text-[10px]">Total Premium</div>
              <div className="font-bold text-blue-300 mt-0.5">₹{policy.totalPremiumPaid}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full coverage active against verified hospitalization, emergencies, &amp; cancellations.</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/tixsurance`}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
              >
                View Dossier
              </Link>
              <Link
                href={`/tixsurance`}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow-md shadow-amber-600/20"
              >
                File Claim
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Uninsured State with 48-Hour Fallback */
        <div className="pt-4 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Protect this booking with <strong>Tixsurance</strong>. Reimburses up to 100% of ticket, stay, and travel
            expenses for unexpected emergencies. Features 100km dynamic corridor geofencing and zero-fraud guarantee.
          </p>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Checkout Protection (5%): </span>
              <strong className="text-emerald-400">₹{premium5Pct}</strong>
              <span className="text-slate-500 mx-2">&bull;</span>
              <span className="text-slate-400">Post-Booking 48H Window (7%): </span>
              <strong className="text-amber-300">₹{premium7Pct}</strong>
            </div>

            <Link
              href={`/tixsurance`}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs tracking-wider uppercase shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition-all"
            >
              Protect Now
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
