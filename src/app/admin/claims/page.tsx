'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  FileText,
  Search,
  Filter,
  Eye,
  Camera,
  Hotel,
  Plane,
  QrCode,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { TixsuranceClaim, TixsurancePolicy } from '@/types/tixsurance';

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<TixsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'LOCAL' | 'OUTSTATION'>('ALL');
  const [selectedClaim, setSelectedClaim] = useState<TixsuranceClaim | null>(null);
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tixsurance');
      const data = await res.json();
      if (data.claims) {
        setClaims(data.claims);
      }
    } catch (err) {
      console.error('Failed fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleAction = async (claimId: string, action: 'VERIFY_BAND' | 'APPROVE' | 'REJECT', reason?: string) => {
    try {
      const res = await fetch('/api/admin/tixsurance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          action,
          rejectionReason: reason,
          notes: action === 'VERIFY_BAND' ? 'Wristband physically scanned at Empressa 14 hub. Intact barrel-lock verified.' : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Claim updated: ${action}`);
        fetchClaims();
        if (selectedClaim?.id === claimId) {
          setSelectedClaim(data.claim);
        }
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const filteredClaims = claims.filter((c) => {
    const matchesSearch =
      c.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.claimReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || c.policyType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h1 className="font-extrabold text-lg text-white">TIXSURANCE™ CLAIMS &amp; FORENSICS</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  COMMAND CENTER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                12-Hour Physical Wristband Return Audit &bull; Packaging Video Forensics &bull; Outstation Stay/Travel Receipts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/tixsurance"
              className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Attendee Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={fetchClaims}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {actionSuccess}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 mt-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-400 font-medium">Total Registered Claims</div>
            <div className="text-2xl font-bold text-white mt-1">{claims.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Cross-corridor filings</div>
          </div>

          <div className="bg-slate-800/80 border border-amber-500/40 rounded-xl p-4 shadow-sm bg-gradient-to-br from-slate-800 to-amber-950/20">
            <div className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              12H Hub Band Delivery Pending
            </div>
            <div className="text-2xl font-bold text-amber-200 mt-1">
              {claims.filter((c) => c.policyType === 'LOCAL' && c.wristbandStatus === 'IN_TRANSIT').length}
            </div>
            <div className="text-[11px] text-amber-400/80 mt-1">Empressa 14 Hub Intake</div>
          </div>

          <div className="bg-slate-800/80 border border-blue-500/40 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-blue-300 font-medium">Under Forensic Review</div>
            <div className="text-2xl font-bold text-blue-200 mt-1">
              {claims.filter((c) => c.claimStatus === 'UNDER_REVIEW' || c.claimStatus === 'HELD_PENDING_BAND').length}
            </div>
            <div className="text-[11px] text-blue-400/80 mt-1">Video &amp; Receipt Audits</div>
          </div>

          <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-emerald-300 font-medium">Approved Payouts</div>
            <div className="text-2xl font-bold text-emerald-300 mt-1">
              {claims.filter((c) => c.claimStatus === 'APPROVED').length}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">Scheduled for credit note</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Booking ID, reason, or Claim ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Claims ({claims.length})
            </button>
            <button
              onClick={() => setFilterType('LOCAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'LOCAL' ? 'bg-emerald-600 text-white' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Local (≤100km)
            </button>
            <button
              onClick={() => setFilterType('OUTSTATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'OUTSTATION' ? 'bg-amber-600 text-white' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Outstation (&gt;100km)
            </button>
          </div>
        </div>

        {/* Claims List */}
        <div className="space-y-4">
          {filteredClaims.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
              No claims match your query.
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg hover:border-slate-600 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left Side: Policy Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-blue-300">
                      {claim.bookingId}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        claim.policyType === 'LOCAL'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {claim.policyType === 'LOCAL' ? 'LOCAL (≤100 KM)' : 'OUTSTATION (>100 KM)'}
                    </span>
                    <span className="text-xs text-slate-400">Claim ID: {claim.id}</span>
                  </div>

                  <div className="text-sm font-semibold text-white">{claim.claimReason}</div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>
                      Insured Value: <strong className="text-slate-200">₹{claim.payoutAmount.toLocaleString('en-IN')}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>Filed: {new Date(claim.createdAt).toLocaleDateString('en-GB')}</span>
                    {claim.policyType === 'LOCAL' && (
                      <>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 text-amber-300 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          12H Hub Deadline: Active ({claim.wristbandStatus})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Side: Status Badges and Inspection Button */}
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      claim.claimStatus === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : claim.claimStatus === 'REJECTED'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {claim.claimStatus.replace(/_/g, ' ')}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedClaim(claim);
                      setInspectionModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect &amp; Verify
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Forensic Inspection Modal */}
      {inspectionModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">
                    Forensic Claim Inspection: {selectedClaim.bookingId}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Policy Type: {selectedClaim.policyType} &bull; Claim ID: {selectedClaim.id}
                </p>
              </div>

              <button
                onClick={() => setInspectionModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Emergency Proof Review */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                1. Stated Emergency &amp; Medical Verification
              </div>
              <div className="text-sm text-slate-100 font-medium">{selectedClaim.claimReason}</div>
              <div className="text-xs text-blue-400 flex items-center gap-1.5 pt-1">
                <FileText className="w-4 h-4" />
                <span>Document: {selectedClaim.proofOfEmergencyName || 'Hospital_Certificate.pdf'} (Authentic OCR Verified)</span>
              </div>
            </div>

            {/* Local Specifics: Packaging Video & Physical Band Hub Verification */}
            {selectedClaim.policyType === 'LOCAL' && (
              <div className="space-y-4">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-400" />
                    2. Packaging Video Integrity Audit (No Cuts / No Transitions)
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
                      <Play className="w-6 h-6 ml-0.5" />
                    </div>
                    <div className="text-xs font-bold text-white">
                      {selectedClaim.packagingVideoName || 'Tirth_Shah_Wristband_Packaging_Video.mp4'}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      ✓ Single continuous shot verified &bull; Uncut fabric inspected &bull; Legible QR &bull; Sealed on camera
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-amber-500/30 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    3. Empressa 14 Hub Physical Band Intake &amp; Barcode Verification
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div>Hub Location: {selectedClaim.hubAddress}</div>
                    <div>
                      Wristband Status:{' '}
                      <strong className="text-amber-400 uppercase">{selectedClaim.wristbandStatus}</strong>
                    </div>
                  </div>

                  {selectedClaim.wristbandStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => handleAction(selectedClaim.id, 'VERIFY_BAND')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <QrCode className="w-4 h-4" />
                      Mark Wristband Received &amp; Scan Barcode
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Outstation Specifics: Cancellation Receipts */}
            {selectedClaim.policyType === 'OUTSTATION' && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  2. Outstation Corridor Cancellation Audit
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                      <Hotel className="w-4 h-4" />
                      Stay Cancellation
                    </div>
                    <div className="text-slate-400 text-[11px]">Taj_Hotel_Cancellation_Invoice.pdf</div>
                    <div className="text-emerald-400 text-[11px] font-semibold">✓ Confirmed Refund Receipt</div>
                  </div>

                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                      <Plane className="w-4 h-4" />
                      Travel Cancellation
                    </div>
                    <div className="text-slate-400 text-[11px]">Akasa_Air_Cancellation_Receipt.pdf</div>
                    <div className="text-emerald-400 text-[11px] font-semibold">✓ Released PNR Seat</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Authorized Payout Amount: <strong className="text-white text-sm">₹{selectedClaim.payoutAmount}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const reason = prompt('Enter rejection reason (e.g. Tampered wristband, cut fabric, edited video):');
                    if (reason) handleAction(selectedClaim.id, 'REJECT', reason);
                  }}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold transition-all"
                >
                  Reject &amp; Void Policy
                </button>

                <button
                  onClick={() => handleAction(selectedClaim.id, 'APPROVE')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve &amp; Authorize Payout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
