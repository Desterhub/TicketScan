'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { TicketCard } from '@/components/ticket-card/TicketCard';
import { Ticket } from '@/types/database';
import {
  Ticket as TicketIcon,
  Search,
  Download,
  Filter,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from 'lucide-react';

function AdminTicketsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdFilter = searchParams.get('userId');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) router.push('/admin/login');
        return res.json();
      })
      .then((data) => {
        if (!data.authenticated || data.user.role !== 'admin') {
          router.push('/admin/login');
        } else {
          setCurrentUser(data.user);
          loadTickets();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router, userIdFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tickets?forAdmin=true');
      const data = await res.json();
      if (data.success) {
        let list = data.tickets || [];
        if (userIdFilter) {
          list = list.filter((t: Ticket) => t.user_id === userIdFilter);
        }
        setTickets(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTickets = () => {
    window.open('/api/admin/export?type=tickets', '_blank');
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to permanently delete this ticket record? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      } else {
        alert(data.error || 'Failed to delete ticket record');
      }
    } catch (err) {
      alert('Network error while deleting ticket record');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (modeFilter !== 'all' && t.transport_mode !== modeFilter) return false;
    if (statusFilter !== 'all' && t.booking_status !== statusFilter) return false;

    const score = Number(t.tamper_risk_score || 0);
    if (riskFilter === 'low' && score >= 0.3) return false;
    if (riskFilter === 'medium' && (score < 0.3 || score >= 0.65)) return false;
    if (riskFilter === 'high' && score < 0.65) return false;

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

  return (
    <div className="min-h-screen bg-[#060a12] text-white flex flex-col font-sans">
      <Navbar user={currentUser} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Command Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <TicketIcon className="w-7 h-7 text-amber-400" />
              <span>Global Tickets Audit Master</span>
            </h1>
            {userIdFilter && (
              <div className="mt-2 text-xs font-mono text-amber-400">
                Filtering by User ID: {userIdFilter}{' '}
                <button
                  onClick={() => router.push('/admin/tickets')}
                  className="underline ml-2 text-slate-400 hover:text-white"
                >
                  Clear user filter
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleExportTickets}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20"
            title="Download formatted Excel workbook with individual passenger master rows, executive analytics and embedded visual graphs"
          >
            <Download className="w-4 h-4" />
            <span>Export Analytics & Manifest (.xlsx)</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across all users' tickets by PNR, passenger, carrier..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 outline-none"
            >
              <option value="all">Mode: All</option>
              <option value="flight">Flight</option>
              <option value="train">Train</option>
              <option value="bus">Bus</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 outline-none"
            >
              <option value="all">Status: All</option>
              <option value="confirmed">Confirmed</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="rac">RAC</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 outline-none"
            >
              <option value="all">Tamper Risk: All</option>
              <option value="low">Low Risk (&lt;0.30)</option>
              <option value="medium">Medium Risk (0.30-0.65)</option>
              <option value="high">High Risk (&gt;0.65)</option>
            </select>
          </div>
        </div>

        {/* Tickets Feed */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="space-y-4">
            {filteredTickets.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                showAdminActions={true}
                onDelete={handleDeleteTicket}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-3xl border border-dashed border-slate-800 p-8">
            <h3 className="text-base font-bold text-white">No Tickets Match Filter</h3>
            <p className="text-xs text-slate-400 mt-1">
              Adjust your search keywords or reset filter dropdowns to inspect all uploads.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060a12] text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      }
    >
      <AdminTicketsContent />
    </Suspense>
  );
}
