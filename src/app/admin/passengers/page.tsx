'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { PassengerProfile, LinkedPassengerJourney } from '@/lib/passenger-intelligence';
import {
  Users,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Receipt,
  Plane,
  Train,
  Bus,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  X,
  Loader2,
  Armchair,
  Hash,
} from 'lucide-react';

export default function AdminPassengersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [passengers, setPassengers] = useState<PassengerProfile[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('expenditure');

  // Selected traveler for dossier modal
  const [selectedPassenger, setSelectedPassenger] = useState<PassengerProfile | null>(null);

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
          loadPassengers();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const loadPassengers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/passengers');
      const data = await res.json();
      if (data.success) {
        setPassengers(data.passengers || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed loading passengers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering & sorting
  const filteredPassengers = passengers
    .filter((p) => {
      // Mode filter
      if (modeFilter === 'flight' && p.modes.flight === 0) return false;
      if (modeFilter === 'train' && p.modes.train === 0) return false;
      if (modeFilter === 'bus' && p.modes.bus === 0) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.fullName.toLowerCase().includes(q) || p.canonicalName.toLowerCase().includes(q);
        const matchesJourneys = p.journeys.some(
          (j) =>
            j.pnr.toLowerCase().includes(q) ||
            j.carrierName.toLowerCase().includes(q) ||
            j.origin.toLowerCase().includes(q) ||
            j.destination.toLowerCase().includes(q) ||
            j.seat.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesJourneys) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'trips') return b.totalJourneys - a.totalJourneys || b.totalExpenditure - a.totalExpenditure;
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'recent') {
        const tA = a.journeys[0]?.departureDatetime ? new Date(a.journeys[0].departureDatetime).getTime() : 0;
        const tB = b.journeys[0]?.departureDatetime ? new Date(b.journeys[0].departureDatetime).getTime() : 0;
        return tB - tA;
      }
      // Default: highest expenditure first
      return b.totalExpenditure - a.totalExpenditure || b.totalJourneys - a.totalJourneys;
    });

  return (
    <div className="min-h-screen bg-[#060a12] text-white flex flex-col font-sans">
      <Navbar user={currentUser} />

      <main className="flex-1 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-6 sm:space-y-8">
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-amber-400 transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Command Dashboard</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Traveler Master Intelligence</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] uppercase font-bold">
                    Entity Tracking
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Cross-ticket passenger linking, individualized fare splits, and travel expenditure history
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.open('/api/admin/export?type=tickets', '_blank')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
            >
              <span>Download Master Manifest (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Unique Passengers */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] sm:text-xs font-mono uppercase font-semibold">Unique Travelers</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              {stats?.totalUniquePassengers || passengers.length}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono block truncate">
              Linked across all tickets
            </span>
          </div>

          {/* Card 2: Cumulative Passenger Expenditure */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-950/30 border border-emerald-500/40 space-y-1 shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[10px] sm:text-xs font-mono uppercase font-bold">Total Expenditure</span>
              <Receipt className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300 truncate">
              {stats?.totalExpenditureFormatted || '₹0.00'}
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-400/80 font-mono block truncate">
              Sum of individual split fares
            </span>
          </div>

          {/* Card 3: Avg Spend per Traveler */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] sm:text-xs font-mono uppercase font-semibold">Avg Spend / Traveler</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 truncate">
              {stats?.averageExpenditureFormatted || '₹0.00'}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono block truncate">
              Across verified travelers
            </span>
          </div>

          {/* Card 4: Top Traveler */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] sm:text-xs font-mono uppercase font-semibold">Top Traveler</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-white truncate">
              {stats?.topTraveler?.name || 'N/A'}
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-400 font-mono block truncate">
              {stats?.topTraveler ? `${stats.topTraveler.expenditure} (${stats.topTraveler.journeys} journeys)` : 'Awaiting data'}
            </span>
          </div>
        </div>

        {/* Search, Filter & Sort Toolbar */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search traveler by name, PNR, carrier, station, seat..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Mode Selector */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 text-xs font-mono">
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'all', label: 'All Modes' },
                { id: 'flight', label: '✈️ Flights' },
                { id: 'train', label: '🚆 Trains' },
                { id: 'bus', label: '🚌 Buses' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModeFilter(m.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition text-[11px] sm:text-xs font-semibold ${
                    modeFilter === m.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 outline-none text-[11px] sm:text-xs font-mono"
            >
              <option value="expenditure">Sort: Highest Expenditure</option>
              <option value="trips">Sort: Most Journeys</option>
              <option value="recent">Sort: Most Recent Travel</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Travelers Feed / Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-xs font-mono text-slate-400">Loading Traveler Intelligence...</span>
          </div>
        ) : filteredPassengers.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {filteredPassengers.map((p, idx) => (
              <div
                key={p.id || idx}
                onClick={() => setSelectedPassenger(p)}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition-all duration-200 cursor-pointer shadow-lg group relative overflow-hidden"
              >
                {/* Accent top line on hover */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-emerald-400 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Traveler Avatar, Name, Demographics */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700/80 flex items-center justify-center text-amber-400 font-bold text-base shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                      {p.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'PA'}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate group-hover:text-amber-400 transition-colors">
                          {p.fullName}
                        </h3>
                        {p.totalJourneys > 1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider bg-sky-950/80 border border-sky-500/40 text-sky-300">
                            Multi-Ticket Linked ({p.totalJourneys} Trips)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 flex-wrap">
                        <span>{p.age ? `${p.age} yrs` : 'Adult'}</span>
                        {p.gender && <span>• {p.gender}</span>}
                        <span>• Latest: {p.latestJourneyDate || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Mode breakdown & Recent Route */}
                  <div className="flex items-center gap-4 text-xs font-mono flex-wrap">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase block">Transport Modes</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.modes.flight > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-950/60 border border-sky-500/30 text-sky-300 text-[11px] flex items-center gap-1">
                            <Plane className="w-3 h-3" /> {p.modes.flight} {p.modes.flight === 1 ? 'Flight' : 'Flights'}
                          </span>
                        )}
                        {p.modes.train > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1">
                            <Train className="w-3 h-3" /> {p.modes.train} {p.modes.train === 1 ? 'Train' : 'Trains'}
                          </span>
                        )}
                        {p.modes.bus > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1">
                            <Bus className="w-3 h-3" /> {p.modes.bus} {p.modes.bus === 1 ? 'Bus' : 'Buses'}
                          </span>
                        )}
                      </div>
                    </div>

                    {p.frequentRoutes.length > 0 && (
                      <div className="space-y-1 hidden sm:block">
                        <span className="text-[10px] text-slate-500 uppercase block">Frequent Route</span>
                        <div className="text-slate-300 font-semibold truncate max-w-[200px]">
                          {p.frequentRoutes[0].route}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Individual Expenditure & Action */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60">
                    <div className="space-y-0.5 text-left lg:text-right">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">
                        Individual Expenditure
                      </span>
                      <div className="text-lg sm:text-xl font-black font-mono text-emerald-400 tracking-tight">
                        {p.totalExpenditureFormatted}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {p.totalJourneys} {p.totalJourneys === 1 ? 'split fare' : 'cumulative fares'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPassenger(p);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-3xl border border-dashed border-slate-800 p-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 flex items-center justify-center text-slate-600">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Manifested Travelers Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-mono">
              {search || modeFilter !== 'all'
                ? 'No passengers match the current search filters. Clear search to view all manifested travelers.'
                : 'Upload travel tickets to automatically populate the passenger intelligence directory.'}
            </p>
          </div>
        )}
      </main>

      {/* TRAVELER INTELLIGENCE DOSSIER MODAL */}
      {selectedPassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div
            className="w-full max-w-3xl rounded-3xl bg-[#090e17] border border-slate-800 shadow-2xl overflow-hidden my-auto space-y-6 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20">
                  {selectedPassenger.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'PA'}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>{selectedPassenger.fullName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                      {selectedPassenger.overallIntegrity}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedPassenger.age ? `${selectedPassenger.age} yrs` : 'Adult'}
                    {selectedPassenger.gender ? ` • ${selectedPassenger.gender}` : ''} • ID:{' '}
                    <span className="text-slate-300">{selectedPassenger.id}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPassenger(null)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Financial & Volume Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Total Expenditure</span>
                  <div className="text-base sm:text-lg font-black text-emerald-400">
                    {selectedPassenger.totalExpenditureFormatted}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Total Journeys</span>
                  <div className="text-base sm:text-lg font-black text-white">
                    {selectedPassenger.totalJourneys} {selectedPassenger.totalJourneys === 1 ? 'Trip' : 'Trips'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Flight Spend</span>
                  <div className="text-base sm:text-lg font-black text-sky-400">
                    ₹{selectedPassenger.expenditureByMode.flight.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Train Spend</span>
                  <div className="text-base sm:text-lg font-black text-amber-400">
                    ₹{selectedPassenger.expenditureByMode.train.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Complete Chronological Journey History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Travel History & Individual Fare Allocations ({selectedPassenger.journeys.length})</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    Chronological Order
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedPassenger.journeys.map((j, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 shadow-md hover:border-slate-700 transition"
                    >
                      {/* Journey Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                            {j.transportMode === 'flight' ? (
                              <Plane className="w-3.5 h-3.5 text-sky-400" />
                            ) : j.transportMode === 'train' ? (
                              <Train className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Bus className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </span>
                          <span className="font-bold text-white text-sm">{j.carrierName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-900 border border-slate-700 text-slate-300">
                            PNR: {j.pnr}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-md">
                            Fare Share: {j.individualFareFormatted}
                          </span>
                          <Link
                            href={`/tickets/${j.ticketId}`}
                            className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                            title="Inspect Ticket Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>

                      {/* Route & Timings */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800/60 font-mono">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" /> Origin → Destination
                          </span>
                          <div className="font-semibold text-slate-200">
                            {j.origin} → {j.destination}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Departure: {j.departureDate} • {j.departureTime}
                          </div>
                        </div>

                        <div className="space-y-0.5 sm:text-right">
                          <span className="text-[10px] text-slate-500 uppercase flex items-center sm:justify-end gap-1">
                            <Armchair className="w-3 h-3 text-sky-400" /> Allotted Seat & Status
                          </span>
                          <div className="font-semibold text-amber-300">
                            {j.seat} • {j.currentStatus}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Total Booking: {j.totalTicketFareFormatted} ({j.paxCountInTicket} {j.paxCountInTicket === 1 ? 'Pax' : 'Pax'})
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-mono text-slate-400">
                Data linked across {selectedPassenger.journeys.length} verified travel manifests
              </span>
              <button
                type="button"
                onClick={() => setSelectedPassenger(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
