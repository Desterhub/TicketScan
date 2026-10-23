'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Upload,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Phone,
  FileText,
  Hotel,
  Plane,
  Camera,
  Building2,
  Calendar,
  X,
  Menu,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Home,
} from 'lucide-react';
import { evaluateGeofenceRadius, calculatePremiums, TIXSURANCE_HUB, DEFAULT_EVENT_VENUE } from '@/lib/tixsurance';

// Uniform TIXSURANCE Brand Logo component with distinct highlighted colors
export function TixsuranceBrandLogo({
  tixColor = 'text-cyan-400',
  suranceColor = 'text-white',
  className = 'text-base sm:text-lg',
  showTrademark = true,
}: {
  tixColor?: string;
  suranceColor?: string;
  className?: string;
  showTrademark?: boolean;
}) {
  return (
    <span className={`font-black tracking-wider inline-flex items-center select-none ${className}`}>
      <span className={tixColor}>TIX</span>
      <span className={suranceColor}>SURANCE</span>
      {showTrademark && <span className="text-[10px] text-cyan-300 font-bold ml-0.5 align-super">™</span>}
    </span>
  );
}

// Navigation configuration for the Slidebar
const SCREENS = [
  {
    id: 'ticket' as const,
    step: '1',
    category: 'Protection Onboarding',
    title: '1 - Ticket Protection',
    badge: 'Phase 1',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Zero-Fraud Event Ticket Shield, Attendee KYC & 5% checkout / 7% grace policy',
    icon: ShieldCheck,
  },
  {
    id: 'stay' as const,
    step: '2',
    category: 'Protection Onboarding',
    title: '2 - Stay Shield',
    badge: 'Phase 2',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    description: 'Hotel, hostel & homestay cancellation protection buffer',
    icon: Hotel,
  },
  {
    id: 'travel' as const,
    step: '3',
    category: 'Protection Onboarding',
    title: '3 - Travel Shield',
    badge: 'Phase 3',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Flight, train & intercity transit safeguarding',
    icon: Plane,
  },
  {
    id: 'claim_local' as const,
    step: '4',
    category: 'Emergency Claims Filing',
    title: '4 - Claim (Local ≤100km)',
    badge: 'Rapid 12H Hub',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Within 100km radius: 12-hour rapid drop-off at Empressa 14 Hub',
    icon: MapPin,
  },
  {
    id: 'claim_outstation' as const,
    step: '5',
    category: 'Emergency Claims Filing',
    title: '5 - Claim (Outstation >100km)',
    badge: 'Courier Forensic',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Beyond 100km: Courier tracking, packaging video audit & transit cover',
    icon: ShieldAlert,
  },
];

function TixsuranceContent() {
  const searchParams = useSearchParams();

  // Screen tabs matching Canva design screens
  const [activeScreen, setActiveScreen] = useState<'ticket' | 'stay' | 'travel' | 'claim_local' | 'claim_outstation'>('ticket');
  const [slidebarOpen, setSlidebarOpen] = useState(false);

  // Close slidebar on Escape key & manage body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSlidebarOpen(false);
      }
    };
    if (slidebarOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [slidebarOpen]);

  // Screen 1: Ticket Onboarding State (Blank clean slate - no fake autofill)
  const [bookingId, setBookingId] = useState(searchParams.get('bookingId') || '');
  const [ticketFare, setTicketFare] = useState<number>(Number(searchParams.get('fare')) || 0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [country, setCountry] = useState('India');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [billingSame, setBillingSame] = useState(true);
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [ticketTermsAccepted, setTicketTermsAccepted] = useState(false);

  // Screen 2: Stay State (Clean slate)
  const [optOutStay, setOptOutStay] = useState(false);
  const [stayGuestName, setStayGuestName] = useState('');
  const [stayGuestEmail, setStayGuestEmail] = useState('');
  const [stayGuestPhone, setStayGuestPhone] = useState('');
  const [stayDocFile, setStayDocFile] = useState<File | null>(null);
  const [stayAmount, setStayAmount] = useState<number>(0);
  const [stayTermsAccepted, setStayTermsAccepted] = useState(false);

  // Screen 3: Travel State (Clean slate)
  const [optOutTravel, setOptOutTravel] = useState(false);
  const [travelName, setTravelName] = useState('');
  const [travelEmail, setTravelEmail] = useState('');
  const [travelPhone, setTravelPhone] = useState('');
  const [travelDocFile, setTravelDocFile] = useState<File | null>(null);
  const [travelAmount, setTravelAmount] = useState<number>(0);
  const [travelTermsAccepted, setTravelTermsAccepted] = useState(false);

  // Screen 4: Claim Local State (Clean slate)
  const [localClaimReason, setLocalClaimReason] = useState('');
  const [localProofFile, setLocalProofFile] = useState<File | null>(null);
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);
  const [localDeclarationAccepted, setLocalDeclarationAccepted] = useState(false);

  // Screen 5: Claim Outstation State (Clean slate)
  const [outClaimReason, setOutClaimReason] = useState('');
  const [outProofFile, setOutProofFile] = useState<File | null>(null);
  const [outStayReceiptFile, setOutStayReceiptFile] = useState<File | null>(null);
  const [outTravelReceiptFile, setOutTravelReceiptFile] = useState<File | null>(null);
  const [outDeclarationAccepted, setOutDeclarationAccepted] = useState(false);

  // Hidden file input refs
  const govIdRef = useRef<HTMLInputElement>(null);
  const stayDocRef = useRef<HTMLInputElement>(null);
  const travelDocRef = useRef<HTMLInputElement>(null);
  const localProofRef = useRef<HTMLInputElement>(null);
  const localVideoRef = useRef<HTMLInputElement>(null);
  const outProofRef = useRef<HTMLInputElement>(null);
  const outStayReceiptRef = useRef<HTMLInputElement>(null);
  const outTravelReceiptRef = useRef<HTMLInputElement>(null);

  // Submission / success notification states
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'info' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Geofence computation (100km radius rule)
  const geofence = evaluateGeofenceRadius({ city, state, postalCode });
  const premiums = calculatePremiums({
    ticketFare: ticketFare || 0,
    stayAmount: optOutStay ? 0 : stayAmount || 0,
    travelAmount: optOutTravel ? 0 : travelAmount || 0,
  });

  const showToast = (title: string, message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 6000);
  };

  const handleTicketSubmit = async () => {
    if (!bookingId.trim()) {
      alert('Please enter your Booking ID / PNR.');
      return;
    }
    if (!fullName.trim() || !email.trim() || !phone.trim() || !city.trim()) {
      alert('Please fill out all mandatory attendee information fields (*).');
      return;
    }
    if (!govIdFile) {
      alert('Please upload your Government ID photo (Aadhar/Passport/DL).');
      return;
    }
    if (!ticketTermsAccepted) {
      alert('Please accept the Tixsurance Terms & Declarations to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tixsurance/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId.trim().toUpperCase(),
          ticketFare: Number(ticketFare) || 0,
          attendee: {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            permanentAddress: {
              addressLine1,
              addressLine2,
              country,
              city,
              state,
              postalCode,
            },
            billingAddressSame: billingSame,
            governmentIdPhotoUrl: govIdFile ? URL.createObjectURL(govIdFile) : '',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate policy');

      showToast(
        'Policy Application Submitted!',
        `Your ticket is registered under ${geofence.policyType} classification (~${geofence.distanceKm} km from venue).`
      );

      if (geofence.policyType === 'OUTSTATION') {
        setActiveScreen('stay');
      }
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStaySubmit = () => {
    if (!optOutStay && !stayDocFile) {
      alert('Please upload your hotel / accommodation booking confirmation PDF or select the opt-out option.');
      return;
    }
    if (!optOutStay && !stayTermsAccepted) {
      alert('Please accept the Accommodation Protection terms & conditions.');
      return;
    }
    showToast('Stay Shield Saved', optOutStay ? 'Stay insurance opted out.' : 'Accommodation protection registered.');
    setActiveScreen('travel');
  };

  const handleTravelSubmit = () => {
    if (!optOutTravel && !travelDocFile) {
      alert('Please upload your transit ticket (Flight/Train/Bus) PDF or select the opt-out option.');
      return;
    }
    if (!optOutTravel && !travelTermsAccepted) {
      alert('Please accept the Travel Shield terms & conditions.');
      return;
    }
    showToast('Travel Shield Saved', optOutTravel ? 'Travel insurance opted out.' : 'Travel corridor protection active.');
    showToast('Enrollment Complete', 'Your Tixsurance coverage is now officially recorded on file!');
  };

  const handleLocalClaimSubmit = async () => {
    if (!bookingId.trim()) {
      alert('Please enter your Booking ID.');
      return;
    }
    if (!localClaimReason.trim()) {
      alert('Please specify the reason for cancellation.');
      return;
    }
    if (!localProofFile) {
      alert('Please upload your medical / emergency certificate.');
      return;
    }
    if (!localVideoFile) {
      alert('Please upload your continuous, unedited packaging video showing the uncut wristband and sealed envelope.');
      return;
    }
    if (!localDeclarationAccepted) {
      alert('Please accept the legal anti-fraud declaration to submit your claim.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tixsurance/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId.trim().toUpperCase(),
          claimReason: localClaimReason.trim(),
          proofOfEmergencyUrl: URL.createObjectURL(localProofFile),
          proofOfEmergencyName: localProofFile.name,
          packagingVideoUrl: URL.createObjectURL(localVideoFile),
          packagingVideoName: localVideoFile.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit claim');

      showToast(
        'Claim Submitted — Payout on HOLD',
        'Your 12-Hour delivery timer is active! Dispatch your uncut wristband to Empressa 14 Hub within 12 hours.'
      );
    } catch (err: any) {
      alert(err.message || 'Claim submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOutstationClaimSubmit = async () => {
    if (!bookingId.trim()) {
      alert('Please enter your Booking ID.');
      return;
    }
    if (!outClaimReason.trim()) {
      alert('Please specify the reason for cancellation.');
      return;
    }
    if (!outProofFile) {
      alert('Please upload your medical / emergency certificate.');
      return;
    }
    if (!outStayReceiptFile || !outTravelReceiptFile) {
      alert('Please upload both stay and travel cancellation receipts.');
      return;
    }
    if (!outDeclarationAccepted) {
      alert('Please accept the legal anti-fraud declaration.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tixsurance/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId.trim().toUpperCase(),
          claimReason: outClaimReason.trim(),
          proofOfEmergencyUrl: URL.createObjectURL(outProofFile),
          proofOfEmergencyName: outProofFile.name,
          stayCancellationReceiptUrl: URL.createObjectURL(outStayReceiptFile),
          stayCancellationReceiptName: outStayReceiptFile.name,
          travelCancellationReceiptUrl: URL.createObjectURL(outTravelReceiptFile),
          travelCancellationReceiptName: outTravelReceiptFile.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit claim');

      showToast(
        'Outstation Claim Submitted',
        'Our forensic team will audit your cancellation receipts. Payout scheduled post-verification.'
      );
    } catch (err: any) {
      alert(err.message || 'Claim submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Top Banner Navigation */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-4 py-2.5 sm:py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Left: 3 lines button placed LEFT of TIXSURANCE symbol, no description */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* The 3 lines (hamburger menu) button */}
            <button
              type="button"
              onClick={() => setSlidebarOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400/50 flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
              aria-label="Open menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-cyan-400" />
            </button>

            {/* TIXSURANCE symbol */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>

            {/* TIXSURANCE Name - NO DESCRIPTION */}
            <TixsuranceBrandLogo className="text-lg sm:text-xl" />
          </div>

          {/* Right: Phone Helpline Badge */}
          <a
            href="tel:+919004264161"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-200 text-xs font-mono hover:bg-blue-900/60 transition-colors whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-300 hidden sm:inline">Inquiries:</span>
            <strong className="text-white whitespace-nowrap font-bold font-mono">+91 90042 64161</strong>
          </a>
        </div>
      </div>

      {/* ========================================================
          SLIDEBAR (DRAWER): CLEAN, SIMPLE & EASY TO UNDERSTAND
      ======================================================== */}
      {/* Backdrop Blur Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          slidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSlidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Navigation Drawer from Left */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 sm:w-80 bg-slate-950 border-r border-slate-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          slidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Tixsurance Menu"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow shadow-blue-500/20">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <TixsuranceBrandLogo className="text-base" />
          </div>
          <button
            type="button"
            onClick={() => setSlidebarOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Back to TicketScan Dashboard */}
        <div className="p-3 pb-1">
          <Link
            href="/dashboard"
            onClick={() => setSlidebarOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all group"
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Clean, Simple Menu Items (NO complex text or descriptions) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Section: Protection */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1.5">
              Protection
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveScreen('ticket');
                  setSlidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeScreen === 'ticket'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 shrink-0 ${activeScreen === 'ticket' ? 'text-white' : 'text-cyan-400'}`} />
                <span>1. Ticket Protection</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveScreen('stay');
                  setSlidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeScreen === 'stay'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Hotel className={`w-4 h-4 shrink-0 ${activeScreen === 'stay' ? 'text-white' : 'text-indigo-400'}`} />
                <span>2. Stay Shield</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveScreen('travel');
                  setSlidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeScreen === 'travel'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Plane className={`w-4 h-4 shrink-0 ${activeScreen === 'travel' ? 'text-white' : 'text-sky-400'}`} />
                <span>3. Travel Shield</span>
              </button>
            </div>
          </div>

          {/* Section: Claims */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1.5">
              Claims
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveScreen('claim_local');
                  setSlidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeScreen === 'claim_local'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <MapPin className={`w-4 h-4 shrink-0 ${activeScreen === 'claim_local' ? 'text-white' : 'text-amber-400'}`} />
                <span>4. Claim (Local ≤100km)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveScreen('claim_outstation');
                  setSlidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeScreen === 'claim_outstation'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <ShieldAlert className={`w-4 h-4 shrink-0 ${activeScreen === 'claim_outstation' ? 'text-white' : 'text-amber-400'}`} />
                <span>5. Claim (Outstation &gt;100km)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 space-y-2">
          <a
            href="tel:+919004264161"
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-950/60 border border-blue-500/30 hover:bg-blue-900/50 text-xs font-mono transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-300 text-[11px]">Helpline:</span>
            <strong className="text-white font-bold whitespace-nowrap">+91 90042 64161</strong>
          </a>

          <Link
            href="/"
            onClick={() => setSlidebarOpen(false)}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-800"
          >
            <Home className="w-3.5 h-3.5" />
            <span>TicketScan Home</span>
          </Link>
        </div>
      </aside>

      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-800 border border-blue-500/40 text-white p-4 rounded-xl shadow-2xl shadow-blue-900/30 flex items-start gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="font-bold text-slate-100">{notification.title}</div>
            <div className="text-slate-300 text-xs mt-0.5">{notification.message}</div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Dynamic 100km Geofence Indicator Badge */}
        <div className="mb-4 bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="text-slate-400 font-medium">Event Venue: </span>
              <span className="text-slate-200 font-bold">{DEFAULT_EVENT_VENUE.name}, {DEFAULT_EVENT_VENUE.city}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                geofence.policyType === 'LOCAL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  geofence.policyType === 'LOCAL' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'
                }`}
              />
              {geofence.policyType === 'LOCAL' ? 'LOCAL RADIUS (≤100 KM)' : 'OUTSTATION (>100 KM)'}
            </div>
            <span className="text-slate-400">~{geofence.distanceKm} km from venue</span>
          </div>
        </div>

        {/* ========================================================
            SCREEN 1: TICKET PROTECTION (CANVA SCREEN 1)
        ======================================================== */}
        {activeScreen === 'ticket' && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden text-slate-800 font-sans">
            {/* Canva Blue Brand Header */}
            <div className="bg-[#10385C] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-blue-950">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h1 className="font-extrabold text-base md:text-lg tracking-wider">
                    <span className="text-cyan-400 font-black">TIX</span>
                    <span className="text-white font-extrabold">SURANCE</span>
                    <span className="text-blue-100 font-medium"> - TICKET PROTECTION</span>
                  </h1>
                </div>
                <p className="text-xs text-blue-100/90 mt-0.5">Secure your Tickets now by filling this form</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-blue-200 uppercase">Booking ID / PNR*:</label>
                <input
                  type="text"
                  placeholder="e.g. 8935414874"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-white/10 rounded border border-white/20 text-white placeholder-blue-300/60 focus:outline-none focus:bg-white/20"
                />
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Attendee Info Section */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Attendee&apos;s Information
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-300">
                    Primary Attendee
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full name (As per Aadhar Card)*
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50"
                      placeholder="Enter full legal name as per government ID"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email (On which ticket was booked)*
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50"
                        placeholder="yourname@domain.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number (On which ticket was booked)*
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50"
                        placeholder="+91 9XXXX XXXXX"
                      />
                    </div>
                  </div>

                  {/* Permanent Address */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-800 mb-2 uppercase">Permanent Address</label>
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Address Line 1 (Flat, House no., Building)*"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                      />
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Address Line 2 (Street, Landmark - Optional)"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="Country*"
                          className="px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                        />
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City*"
                          className="px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                        />
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="State*"
                          className="px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                        />
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="Postal Code*"
                          className="px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Address Checkbox */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="billingSame"
                      checked={billingSame}
                      onChange={(e) => setBillingSame(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="billingSame" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Same as permanent address
                    </label>
                  </div>

                  {/* Real Government ID Photo Upload */}
                  <div className="pt-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Government ID Photo*</label>
                    <input
                      type="file"
                      ref={govIdRef}
                      accept="image/*,.pdf"
                      onChange={(e) => setGovIdFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className={govIdFile ? 'font-bold text-slate-900' : 'text-slate-400 italic'}>
                          {govIdFile ? govIdFile.name : 'No file selected — Upload government ID image'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => govIdRef.current?.click()}
                        className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider transition-colors"
                      >
                        {govIdFile ? 'CHANGE' : 'UPLOAD'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Value & Real-time Premium Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="font-semibold text-slate-600">Ticket Fare (₹): </span>
                  <input
                    type="number"
                    value={ticketFare || ''}
                    placeholder="Enter Fare e.g. 3600"
                    onChange={(e) => setTicketFare(Number(e.target.value))}
                    className="w-32 px-2.5 py-1 text-sm font-bold border border-slate-300 rounded bg-white text-slate-900"
                  />
                  <span className="text-slate-400">(@ 5% fee)</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-600">Policy Premium: </span>
                  <span className="font-bold text-blue-700 text-sm">₹{premiums.ticketPremium}</span>
                </div>
              </div>

              {/* Exact Canva Legal Declaration Checkbox */}
              <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 text-[11px] text-slate-600 leading-relaxed space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="ticketTerms"
                    checked={ticketTermsAccepted}
                    onChange={(e) => setTicketTermsAccepted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-400 focus:ring-blue-500 shrink-0"
                  />
                  <label htmlFor="ticketTerms" className="cursor-pointer select-none">
                    I hereby declare that all information, booking values, and documents submitted in this onboarding
                    form are entirely true, accurate, and complete. I understand that providing false, fabricated, or
                    intentionally altered invoices/details constitutes civil insurance fraud and will result in the
                    immediate forfeiture of my premium and the permanent rejection of any future claims under this policy.
                    I acknowledge that Tixsurance utilizes cross-company database registries (IBB / Rama Bureau) to verify
                    claims, and holding secondary external travel insurance for this event corridor invalidates this ticket
                    protection. I certify that I bear the responsibility for returning the physical wristband in an
                    untampered condition via the designated courier guidelines should a claim arise.
                  </label>
                </div>
              </div>

              {/* Green Submit Button matching Canva */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleTicketSubmit}
                className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white font-bold text-sm tracking-wider uppercase rounded shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? 'ACTIVATING POLICY...' : 'SUBMIT AND ACTIVATE POLICY'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 2: STAY INSURANCE (CANVA SCREEN 2)
        ======================================================== */}
        {activeScreen === 'stay' && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden text-slate-800 font-sans">
            <div className="bg-[#10385C] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-blue-950">
              <div className="flex items-center gap-2">
                <Hotel className="w-5 h-5 text-cyan-400" />
                <h1 className="font-extrabold text-base md:text-lg tracking-wider">
                  <span className="text-cyan-400 font-black">TIX</span>
                  <span className="text-white font-extrabold">SURANCE</span>
                  <span className="text-blue-100 font-medium"> - ACCOMMODATION SHIELD</span>
                </h1>
              </div>
              <span className="text-xs font-bold uppercase px-2.5 py-1 bg-white/10 rounded">
                Booking ID: {bookingId || 'PENDING'}
              </span>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Opt-out Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900">
                <input
                  type="checkbox"
                  id="optOutStay"
                  checked={optOutStay}
                  onChange={(e) => setOptOutStay(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="optOutStay" className="cursor-pointer">
                  I do not need an insurance for Stay (Self-arranged / staying with friends)
                </label>
              </div>

              {!optOutStay && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                    Guest&apos;s Information
                  </h2>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name*</label>
                    <input
                      type="text"
                      value={stayGuestName}
                      onChange={(e) => setStayGuestName(e.target.value)}
                      placeholder="Primary guest name"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email*</label>
                      <input
                        type="email"
                        value={stayGuestEmail}
                        onChange={(e) => setStayGuestEmail(e.target.value)}
                        placeholder="guest@example.com"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number*</label>
                      <input
                        type="tel"
                        value={stayGuestPhone}
                        onChange={(e) => setStayGuestPhone(e.target.value)}
                        placeholder="+91 9XXXX XXXXX"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Hotel / Airbnb Booking Confirmation PDF*
                    </label>
                    <input
                      type="file"
                      ref={stayDocRef}
                      accept=".pdf,image/*"
                      onChange={(e) => setStayDocFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className={stayDocFile ? 'font-bold text-slate-900' : 'text-slate-400 italic'}>
                          {stayDocFile ? stayDocFile.name : 'No file selected — Attach booking invoice PDF'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => stayDocRef.current?.click()}
                        className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                      >
                        {stayDocFile ? 'CHANGE' : 'UPLOAD'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Booked (₹)*</label>
                      <input
                        type="number"
                        value={stayAmount || ''}
                        placeholder="Total hotel booking cost"
                        onChange={(e) => setStayAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Total Premium to be Paid (5%)</label>
                      <div className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-100 font-bold text-blue-700">
                        ₹{Math.round((stayAmount || 0) * 0.05)}
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="stayTerms"
                        checked={stayTermsAccepted}
                        onChange={(e) => setStayTermsAccepted(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label htmlFor="stayTerms" className="cursor-pointer">
                        I agree to the Tixsurance Accommodation Protection terms &amp; conditions.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleStaySubmit}
                className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white font-bold text-sm tracking-wider uppercase rounded shadow-lg shadow-emerald-700/20"
              >
                SUBMIT AND PROCEED TO TRAVEL SHIELD
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 3: TRAVEL INSURANCE (CANVA SCREEN 3)
        ======================================================== */}
        {activeScreen === 'travel' && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden text-slate-800 font-sans">
            <div className="bg-[#10385C] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-blue-950">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-cyan-400" />
                <h1 className="font-extrabold text-base md:text-lg tracking-wider">
                  <span className="text-cyan-400 font-black">TIX</span>
                  <span className="text-white font-extrabold">SURANCE</span>
                  <span className="text-blue-100 font-medium"> - TRAVEL SHIELD</span>
                </h1>
              </div>
              <span className="text-xs font-bold uppercase px-2.5 py-1 bg-white/10 rounded">
                Booking ID: {bookingId || 'PENDING'}
              </span>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Opt-out Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900">
                <input
                  type="checkbox"
                  id="optOutTravel"
                  checked={optOutTravel}
                  onChange={(e) => setOptOutTravel(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="optOutTravel" className="cursor-pointer">
                  I do not need an insurance for Travel (Self-driving or local transit)
                </label>
              </div>

              {!optOutTravel && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                    Traveller&apos;s Information
                  </h2>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name*</label>
                    <input
                      type="text"
                      value={travelName}
                      onChange={(e) => setTravelName(e.target.value)}
                      placeholder="Primary traveler name"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email*</label>
                      <input
                        type="email"
                        value={travelEmail}
                        onChange={(e) => setTravelEmail(e.target.value)}
                        placeholder="traveler@example.com"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number*</label>
                      <input
                        type="tel"
                        value={travelPhone}
                        onChange={(e) => setTravelPhone(e.target.value)}
                        placeholder="+91 9XXXX XXXXX"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Flight / Train / Bus Booking Ticket PDF*
                    </label>
                    <input
                      type="file"
                      ref={travelDocRef}
                      accept=".pdf,image/*"
                      onChange={(e) => setTravelDocFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className={travelDocFile ? 'font-bold text-slate-900' : 'text-slate-400 italic'}>
                          {travelDocFile ? travelDocFile.name : 'No file selected — Upload transit ticket PDF'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => travelDocRef.current?.click()}
                        className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                      >
                        {travelDocFile ? 'CHANGE' : 'UPLOAD'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Booked (₹)*</label>
                      <input
                        type="number"
                        value={travelAmount || ''}
                        placeholder="Total travel tickets cost"
                        onChange={(e) => setTravelAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Total Premium to be Paid (5%)</label>
                      <div className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-100 font-bold text-blue-700">
                        ₹{Math.round((travelAmount || 0) * 0.05)}
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="travelTerms"
                        checked={travelTermsAccepted}
                        onChange={(e) => setTravelTermsAccepted(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label htmlFor="travelTerms" className="cursor-pointer">
                        I agree to the Tixsurance Travel Shield terms &amp; conditions.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleTravelSubmit}
                className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white font-bold text-sm tracking-wider uppercase rounded shadow-lg shadow-emerald-700/20"
              >
                SUBMIT AND COMPLETE ENROLLMENT
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 4: CLAIM LOCAL (CANVA SCREEN 4)
        ======================================================== */}
        {activeScreen === 'claim_local' && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden text-slate-800 font-sans">
            <div className="bg-[#10385C] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-blue-950">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <h1 className="font-extrabold text-base md:text-lg tracking-wider">
                    <span className="text-cyan-400 font-black">TIX</span>
                    <span className="text-white font-extrabold">SURANCE</span>
                    <span className="text-blue-100 font-medium"> - FILE YOUR CLAIM</span>
                  </h1>
                </div>
                <p className="text-xs text-blue-100/90 mt-0.5">Local Policyholder Corridor (≤100km Radius)</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-blue-200">Booking ID:</label>
                <input
                  type="text"
                  placeholder="Enter Booking ID"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-white/10 rounded border border-white/20 text-white placeholder-blue-300/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Empathy Intro Message */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed font-medium">
                We are sorry to hear that you won&apos;t be heading for the event. Please let us know why, so that we can reimburse you.
              </div>

              {/* Attendee Info Section */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                  Claim Reason &amp; Proof of Emergency
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for cancellation*</label>
                  <textarea
                    rows={2}
                    value={localClaimReason}
                    onChange={(e) => setLocalClaimReason(e.target.value)}
                    placeholder="Describe emergency reason (hospitalization, injury, family emergency, etc.)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Proof of Emergency*</label>
                  <input
                    type="file"
                    ref={localProofRef}
                    accept=".pdf,image/*"
                    onChange={(e) => setLocalProofFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className={localProofFile ? 'font-bold text-slate-900' : 'text-slate-400 italic'}>
                        {localProofFile ? localProofFile.name : 'No file selected — Attach medical certificate / doctor note'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => localProofRef.current?.click()}
                      className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                    >
                      {localProofFile ? 'CHANGE' : 'UPLOAD'}
                    </button>
                  </div>
                </div>

                {/* Clean, Structured Step 2: Wristband Return (Empressa 14 Hub) */}
                <div className="border border-amber-300 bg-amber-50/60 rounded-xl p-4 text-slate-800 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-xs uppercase tracking-wide text-amber-950">
                          Step 2: Return Physical Wristband
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 text-amber-900">
                          12-Hour Hub Window
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">
                        Your reimbursement is released as soon as our hub receives and scans your uncut wristband.
                      </p>
                    </div>
                  </div>

                  {/* Hub Address & Courier Coordination Card */}
                  <div className="bg-white border border-amber-200 rounded-xl p-3.5 text-xs space-y-3 shadow-sm">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Courier / Drop-off Delivery Address:
                      </div>
                      <div className="flex items-start gap-2 text-slate-800">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 font-bold block">{TIXSURANCE_HUB.name}</strong>
                          <span className="text-slate-700 leading-relaxed">{TIXSURANCE_HUB.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dedicated Helpline Callout - NEVER WRAPS INTO 3 LINES! */}
                    <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                      <div className="flex items-center gap-2 text-slate-700 text-xs">
                        <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Courier Coordination &amp; Inquiries:</span>
                      </div>
                      <a
                        href="tel:+919004264161"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-blue-400/50 text-blue-700 font-mono font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors whitespace-nowrap self-start sm:self-auto"
                      >
                        <span className="text-xs">📞</span>
                        <span className="whitespace-nowrap tracking-wider">+91 90042 64161</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Clean, Structured Step 3: Packaging Video Proof */}
                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                      <Camera className="w-4 h-4 text-blue-600" />
                      Step 3: Continuous Packaging Video
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      Unedited
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-normal">
                    Record one continuous, unedited video before handing the package to the courier:
                  </p>

                  {/* 3 Simple Visual Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                        <span>Show Band</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">Show uncut band &amp; QR code clearly.</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                        <span>Pack Envelope</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">Place band inside envelope without cutting video.</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                        <span>Seal On Camera</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">Seal courier envelope completely on camera.</p>
                    </div>
                  </div>

                  {/* Gentle reassurance notice */}
                  <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Please ensure the video has no cuts or transitions so your claim verifies instantly.</span>
                  </div>

                  {/* Video Upload Button */}
                  <input
                    type="file"
                    ref={localVideoRef}
                    accept="video/*"
                    onChange={(e) => setLocalVideoFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="border border-slate-300 rounded-lg p-3 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                      <Camera className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className={`truncate ${localVideoFile ? 'font-bold text-slate-900' : 'text-slate-400 italic'}`}>
                        {localVideoFile ? localVideoFile.name : 'Attach Packaging Video'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => localVideoRef.current?.click()}
                      className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider shrink-0 transition-colors"
                    >
                      {localVideoFile ? 'CHANGE' : 'UPLOAD VIDEO'}
                    </button>
                  </div>
                </div>

                {/* Legal Declaration */}
                <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 text-[11px] text-slate-600 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="localDeclaration"
                      checked={localDeclarationAccepted}
                      onChange={(e) => setLocalDeclarationAccepted(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-blue-600 rounded shrink-0"
                    />
                    <label htmlFor="localDeclaration" className="cursor-pointer">
                      I hereby declare that all information, details, and documents submitted across this entire claim
                      form are 100% true, accurate, and complete. I certify that my emergency proof is genuine, the uploaded
                      packaging video is authentic and unedited, the wristband being dispatched is completely uncut, and I
                      hold no secondary travel insurance for this event from any external provider. I understand that any
                      false declaration, double-dipping, or misrepresentation constitutes insurance fraud, resulting in
                      immediate policy voidance, premium forfeiture, and the permanent rejection of my payout.
                    </label>
                  </div>
                </div>
              </div>

              {/* Green Submit Claim Button */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleLocalClaimSubmit}
                className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white font-bold text-sm tracking-wider uppercase rounded shadow-lg shadow-emerald-700/20"
              >
                {submitting ? 'RECORDING CLAIM...' : 'SUBMIT CLAIM & INITIATE 12-HOUR HUB DELIVERY'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 5: CLAIM OUTSTATION (CANVA SCREEN 5)
        ======================================================== */}
        {activeScreen === 'claim_outstation' && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden text-slate-800 font-sans">
            <div className="bg-[#10385C] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-blue-950">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <h1 className="font-extrabold text-base md:text-lg tracking-wider">
                    <span className="text-cyan-400 font-black">TIX</span>
                    <span className="text-white font-extrabold">SURANCE</span>
                    <span className="text-blue-100 font-medium"> - FILE YOUR CLAIM</span>
                  </h1>
                </div>
                <p className="text-xs text-blue-100/90 mt-0.5">Outstation Corridor (&gt;100km Radius) with Stay &amp; Travel</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-blue-200">Booking ID:</label>
                <input
                  type="text"
                  placeholder="Enter Booking ID"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-white/10 rounded border border-white/20 text-white placeholder-blue-300/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed font-medium">
                We are sorry to hear that you won&apos;t be heading for the event. Please let us know why, so that we can reimburse you.
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                  Reason for Cancellation &amp; Proof of Emergency
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for cancellation*</label>
                  <textarea
                    rows={2}
                    value={outClaimReason}
                    onChange={(e) => setOutClaimReason(e.target.value)}
                    placeholder="Describe emergency reason"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Proof of Emergency*</label>
                  <input
                    type="file"
                    ref={outProofRef}
                    accept=".pdf,image/*"
                    onChange={(e) => setOutProofFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className={outProofFile ? 'font-bold text-slate-900' : 'text-slate-400 italic'}>
                        {outProofFile ? outProofFile.name : 'No file selected — Attach emergency certificate'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => outProofRef.current?.click()}
                      className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                    >
                      {outProofFile ? 'CHANGE' : 'UPLOAD'}
                    </button>
                  </div>
                </div>

                {/* Out of Station Claims Proof Header */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 mb-2 border-b border-slate-200 pb-1">
                    Out-Of-Station Claims Proof (Mandatory for Outstation Corridor)
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Cancellation Receipt of Stay (Hotel / Airbnb)*
                      </label>
                      <input
                        type="file"
                        ref={outStayReceiptRef}
                        accept=".pdf,image/*"
                        onChange={(e) => setOutStayReceiptFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Hotel className="w-4 h-4 text-blue-600" />
                          <span className={outStayReceiptFile ? 'font-bold text-slate-900' : 'text-slate-400 italic'}>
                            {outStayReceiptFile ? outStayReceiptFile.name : 'No file selected — Upload stay cancellation receipt'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => outStayReceiptRef.current?.click()}
                          className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                        >
                          {outStayReceiptFile ? 'CHANGE' : 'UPLOAD'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Cancellation Receipt of Travel (Airline / IRCTC Railways)*
                      </label>
                      <input
                        type="file"
                        ref={outTravelReceiptRef}
                        accept=".pdf,image/*"
                        onChange={(e) => setOutTravelReceiptFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Plane className="w-4 h-4 text-blue-600" />
                          <span className={outTravelReceiptFile ? 'font-bold text-slate-900' : 'text-slate-400 italic'}>
                            {outTravelReceiptFile ? outTravelReceiptFile.name : 'No file selected — Upload travel cancellation receipt'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => outTravelReceiptRef.current?.click()}
                          className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                        >
                          {outTravelReceiptFile ? 'CHANGE' : 'UPLOAD'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Helpline & Courier Assistance for Outstation Claims */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Courier Coordination &amp; Claim Inquiries Helpline:</span>
                  </div>
                  <a
                    href="tel:+919004264161"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-400/50 text-blue-700 font-mono font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors whitespace-nowrap self-start sm:self-auto"
                  >
                    <span>📞</span>
                    <span className="whitespace-nowrap tracking-wider">+91 90042 64161</span>
                  </a>
                </div>

                {/* Legal Declaration */}
                <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 text-[11px] text-slate-600 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="outDeclaration"
                      checked={outDeclarationAccepted}
                      onChange={(e) => setOutDeclarationAccepted(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-blue-600 rounded shrink-0"
                    />
                    <label htmlFor="outDeclaration" className="cursor-pointer">
                      I hereby declare that all information, details, and documents submitted across this entire claim form are 100% true, accurate, and complete. I certify that my stay and travel cancellation receipts represent confirmed cancellations matching my initial onboarding details.
                    </label>
                  </div>
                </div>
              </div>

              {/* Green Submit Claim Button */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleOutstationClaimSubmit}
                className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white font-bold text-sm tracking-wider uppercase rounded shadow-lg shadow-emerald-700/20"
              >
                {submitting ? 'AUDITING...' : 'SUBMIT CLAIM FOR FORENSIC VERIFICATION'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TixsurancePortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Tixsurance...</div>}>
      <TixsuranceContent />
    </Suspense>
  );
}
