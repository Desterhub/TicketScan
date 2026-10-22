'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { TicketCard } from '@/components/ticket-card/TicketCard';
import { Ticket, TransportMode, BookingStatus } from '@/types/database';
import {
  Search,
  Filter,
  Plus,
  Plane,
  Train,
  Bus,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Ticket as TicketIcon,
} from 'lucide-react';

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) router.push('/login');
        return res.json();
      })
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          loadTickets();
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTickets(tickets.filter((t) => t.id !== id));
      }
    } catch {
      alert('Delete failed');
    }
  };

  // Filter calculations
  const filteredTickets = tickets.filter((t) => {
    // Mode
    if (modeFilter !== 'all' && t.transport_mode !== modeFilter) return false;
    // Status
    if (statusFilter !== 'all' && t.booking_status !== statusFilter) return false;
    // Risk
    const score = Number(t.tamper_risk_score || 0);
    if (riskFilter === 'low' && score >= 0.3) return false;
    if (riskFilter === 'flagged' && score < 0.3) return false;
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        t.passenger_name?.toLowerCase().includes(q) ||
        t.pnr_booking_id?.toLowerCase().includes(q) ||
        t.carrier_name?.toLowerCase().includes(q) ||
        t.boarding_place?.toLowerCase().includes(q) ||
        t.destination_place?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Metrics
  const totalCount = tickets.length;
  const flightCount = tickets.filter((t) => t.transport_mode === 'flight').length;
  const trainCount = tickets.filter((t) => t.transport_mode === 'train').length;
  const busCount = tickets.filter((t) => t.transport_mode === 'bus').length;
  const flaggedCount = tickets.filter((t) => Number(t.tamper_risk_score || 0) >= 0.3).length;

  return (
    <div className="min-h-screen bg-[#090e17] text-white flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-6 sm:space-y-8">
        {/* Header & Upload CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              My Travel Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
              Active boarding passes & forensic authenticity audit history
            </p>
          </div>

          <Link
            href="/upload"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Ticket</span>
          </Link>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-3.5">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Tickets</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">{totalCount}</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-sky-400 uppercase flex items-center gap-1">
              <Plane className="w-3 h-3" /> Flights
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">{flightCount}</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-amber-400 uppercase flex items-center gap-1">
              <Train className="w-3 h-3" /> Trains
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">{trainCount}</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1">
              <Bus className="w-3 h-3" /> Buses
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">{busCount}</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-red-400 uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Flagged
            </span>
            <div className="text-xl sm:text-2xl font-black text-red-400 mt-1 font-mono">{flaggedCount}</div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by PNR, passenger name, carrier, origin, destination..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Mode Selector & Risk Filter */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 text-xs font-mono">
            <div className="flex items-center gap-1 overflow-x-auto">
              {['all', 'flight', 'train', 'bus'].map((m) => (
                <button
                  key={m}
                  onClick={() => setModeFilter(m)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg uppercase transition text-[11px] sm:text-xs ${
                    modeFilter === m
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Tamper Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 outline-none text-[11px] sm:text-xs"
            >
              <option value="all">Risk: All</option>
              <option value="low">Clean Integrity (Low)</option>
              <option value="flagged">Flagged (Med / High)</option>
            </select>
          </div>
        </div>

        {/* Ticket Feed */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="space-y-5">
            {filteredTickets.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                onDelete={handleDeleteTicket}
                onEdit={(ticket) => router.push(`/tickets/${ticket.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-3xl border border-dashed border-slate-800 p-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 flex items-center justify-center text-slate-600">
              <TicketIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Tickets Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search || modeFilter !== 'all' || riskFilter !== 'all'
                ? 'No tickets match your filter criteria. Try clearing search or filters.'
                : 'You have not uploaded any travel tickets yet. Upload your first flight, train, or bus ticket!'}
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Ticket</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
