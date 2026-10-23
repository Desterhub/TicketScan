'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { TicketCard } from '@/components/ticket-card/TicketCard';
import { PassengerManifestTable } from '@/components/ticket/PassengerManifestTable';
import { TicketInsuranceCard } from '@/components/tixsurance/TicketInsuranceCard';
import { Ticket, TransportMode, BookingStatus } from '@/types/database';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Edit3,
  Trash2,
  ExternalLink,
  Users,
  Check,
  X,
  Loader2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

function TicketDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'manifest' | 'forensics' | 'document'>('manifest');

  // Edit form state
  const [editForm, setEditForm] = useState({
    passenger_name: '',
    passenger_age: '',
    transport_mode: 'unknown' as TransportMode,
    carrier_name: '',
    booking_status: 'unknown' as BookingStatus,
    pnr_booking_id: '',
    boarding_place: '',
    destination_place: '',
    seat_class_coach: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setUser(data.user);
      });

    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTicket(data.ticket);
      setEditForm({
        passenger_name: data.ticket.passenger_name || '',
        passenger_age: data.ticket.passenger_age ? String(data.ticket.passenger_age) : '',
        transport_mode: data.ticket.transport_mode || 'unknown',
        carrier_name: data.ticket.carrier_name || '',
        booking_status: data.ticket.booking_status || 'unknown',
        pnr_booking_id: data.ticket.pnr_booking_id || '',
        boarding_place: data.ticket.boarding_place || '',
        destination_place: data.ticket.destination_place || '',
        seat_class_coach: data.ticket.seat_class_coach || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTicket({ ...ticket, ...data.ticket });
      setEditing(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this travel ticket?')) return;
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090e17] text-white flex flex-col">
        <Navbar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#090e17] text-white flex flex-col">
        <Navbar user={user} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <h2 className="text-xl font-bold">Ticket Not Found</h2>
          <p className="text-slate-400 text-sm">
            This ticket may have been deleted or you do not have permission to access it.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090e17] text-white flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-6xl mx-auto px-3.5 sm:px-6 py-5 sm:py-8 w-full space-y-6 sm:space-y-8">
        {/* Top Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tickets</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{editing ? 'Cancel Edit' : 'Edit Details'}</span>
            </button>

            <button
              onClick={handleDelete}
              className="px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Boarding Pass Card */}
        <TicketCard ticket={ticket} onEdit={() => setEditing(true)} />

        {/* Tixsurance Protection Shield */}
        <TicketInsuranceCard
          bookingId={ticket.pnr_booking_id || ticket.id}
          ticketFare={
            ticket.raw_extraction_json?.total_fare
              ? parseFloat(String(ticket.raw_extraction_json.total_fare).replace(/[^\d.]/g, '')) || 3600
              : 3600
          }
          origin={ticket.boarding_place || undefined}
          destination={ticket.destination_place || undefined}
        />

        {/* Inline Edit Form */}
        {editing && (
          <form
            onSubmit={handleSaveEdit}
            className="p-6 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>Review & Correct Ticket Information</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Sets manually_corrected = true
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Passenger Name</label>
                <input
                  type="text"
                  value={editForm.passenger_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, passenger_name: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Passenger Age</label>
                <input
                  type="number"
                  value={editForm.passenger_age}
                  onChange={(e) =>
                    setEditForm({ ...editForm, passenger_age: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Transport Mode</label>
                <select
                  value={editForm.transport_mode}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      transport_mode: e.target.value as TransportMode,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                >
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="bus">Bus</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Carrier Name</label>
                <input
                  type="text"
                  value={editForm.carrier_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, carrier_name: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Booking Status</label>
                <select
                  value={editForm.booking_status}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      booking_status: e.target.value as BookingStatus,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="waitlisted">Waitlisted</option>
                  <option value="rac">RAC</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">PNR / Booking ID</label>
                <input
                  type="text"
                  value={editForm.pnr_booking_id}
                  onChange={(e) =>
                    setEditForm({ ...editForm, pnr_booking_id: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Boarding Place (Origin)</label>
                <input
                  type="text"
                  value={editForm.boarding_place}
                  onChange={(e) =>
                    setEditForm({ ...editForm, boarding_place: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Destination Place</label>
                <input
                  type="text"
                  value={editForm.destination_place}
                  onChange={(e) =>
                    setEditForm({ ...editForm, destination_place: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Seat / Class / Coach</label>
                <input
                  type="text"
                  value={editForm.seat_class_coach}
                  onChange={(e) =>
                    setEditForm({ ...editForm, seat_class_coach: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Corrections</span>
              </button>
            </div>
          </form>
        )}

        {/* Detailed Tabs: Passenger Manifest, Forensics, Original Document */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none flex-nowrap py-1">
            <button
              onClick={() => setActiveTab('manifest')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 whitespace-nowrap ${
                activeTab === 'manifest'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">Manifest & Seats</span>
              <span className="hidden sm:inline">Passenger Manifest & Journey Details</span>
            </button>

            <button
              onClick={() => setActiveTab('forensics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 whitespace-nowrap ${
                activeTab === 'forensics'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">Forensic Signals</span>
              <span className="hidden sm:inline">Forensic & Authenticity Signals</span>
            </button>

            <button
              onClick={() => setActiveTab('document')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 whitespace-nowrap ${
                activeTab === 'document'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">Original Doc</span>
              <span className="hidden sm:inline">Original Document</span>
            </button>
          </div>

          {/* TAB 1: Passenger Manifest & Journey Breakdown */}
          {activeTab === 'manifest' && (
            <PassengerManifestTable ticket={ticket} />
          )}

          {/* TAB 2: Forensics */}
          {activeTab === 'forensics' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-base">Forensic Analysis Report</h4>
                  <p className="text-xs text-slate-400">
                    Heuristic and forensic checks inspect metadata, ELA pixel compression, and font integrity.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-black text-amber-400">
                    {ticket.tamper_risk_score !== null ? ticket.tamper_risk_score : 0.0}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Calculated Risk Score (0 - 1.0)
                  </span>
                </div>
              </div>

              {ticket.tamper_signals && ticket.tamper_signals.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {ticket.tamper_signals.map((sig: any, i: number) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-slate-200">
                          {sig.signal.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`uppercase text-[10px] px-2 py-0.5 rounded ${
                            sig.risk_level === 'high'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {sig.risk_level}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">{sig.detail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-mono">
                  No forensic risk indicators triggered. Document demonstrates clean origin signatures.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Document */}
          {activeTab === 'document' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  File: {ticket.file_path}
                </span>
                {ticket.signedUrl && (
                  <a
                    href={ticket.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono"
                  >
                    <span>Open in new window</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {ticket.signedUrl ? (
                ticket.file_type === 'pdf' ? (
                  <iframe
                    src={ticket.signedUrl}
                    className="w-full h-[600px] rounded-xl border border-slate-800 bg-slate-950"
                    title="Uploaded PDF Ticket"
                  />
                ) : (
                  <div className="flex justify-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <img
                      src={ticket.signedUrl}
                      alt="Uploaded Ticket"
                      className="max-h-[600px] object-contain rounded-lg"
                    />
                  </div>
                )
              ) : (
                <div className="text-center p-8 text-xs text-slate-500">
                  No preview available.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090e17] text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
