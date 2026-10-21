'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { UploadZone } from '@/components/upload/UploadZone';
import { TicketCard } from '@/components/ticket-card/TicketCard';
import { Ticket } from '@/types/database';
import { ShieldCheck, Sparkles, Check, ArrowRight, RotateCcw } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [processedTicket, setProcessedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) router.push('/login');
        return res.json();
      })
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090e17] text-white flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full space-y-10">
        {!processedTicket ? (
          <>
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Vision & Forensics Ingestion</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Upload Travel Ticket
              </h1>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Submit an image or PDF of your flight boarding pass, train ticket, or bus voucher.
                TicketScan parses data and scans for tampering signals automatically.
              </p>
            </div>

            {/* Upload Zone */}
            <UploadZone
              onSuccess={(ticket) => {
                setProcessedTicket(ticket);
              }}
            />

            {/* Supported Ticket Types Guide */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
                <span className="text-sky-400 font-bold block">✈️ Airline Passes</span>
                <p className="text-slate-400">
                  IATA standard boarding passes, mobile e-tickets, PDF booking confirmations.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold block">🚆 Train Tickets</span>
                <p className="text-slate-400">
                  IRCTC e-tickets, Amtrak, SNCF, Eurostar, DB tickets with PNR & coach breakdown.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold block">🚌 Bus Vouchers</span>
                <p className="text-slate-400">
                  FlixBus, Megabus, Greyhound, RedBus vouchers with seat & boarding points.
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Immediate Review & Correct Step */
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  EXTRACTION COMPLETE
                </span>
                <h2 className="text-2xl font-bold text-white">Review Extracted Boarding Pass</h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setProcessedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Upload Another</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/tickets/${processedTicket.id}`)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-300 transition"
                >
                  <span>Save & Inspect Full Forensics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Display Boarding Pass Card */}
            <TicketCard ticket={processedTicket} />
          </div>
        )}
      </main>
    </div>
  );
}
