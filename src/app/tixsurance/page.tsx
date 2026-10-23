'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Check,
  Building2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { evaluateGeofenceRadius, calculatePremiums, TIXSURANCE_HUB, DEFAULT_EVENT_VENUE } from '@/lib/tixsurance';

export default function TixsurancePortalPage() {
  // Navigation tabs matching the exact 5 Canva design screens
  const [activeScreen, setActiveScreen] = useState<'ticket' | 'stay' | 'travel' | 'claim_local' | 'claim_outstation'>('ticket');

  // Screen 1: Ticket Onboarding State
  const [bookingId, setBookingId] = useState('FAREDEMO2139XG');
  const [ticketFare, setTicketFare] = useState(3600);
  const [fullName, setFullName] = useState('Tirth Dixit Shah');
  const [email, setEmail] = useState('tirth.shah@example.com');
  const [phone, setPhone] = useState('+91 98200 12345');
  const [addressLine1, setAddressLine1] = useState('Flat 402, Sea Green Apartments, JVPD Scheme');
  const [addressLine2, setAddressLine2] = useState('Gulmohar Cross Road 9, Juhu');
  const [country, setCountry] = useState('India');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('400049');
  const [billingSame, setBillingSame] = useState(true);
  const [govIdUploaded, setGovIdUploaded] = useState(true);
  const [ticketTermsAccepted, setTicketTermsAccepted] = useState(true);

  // Screen 2: Stay State
  const [optOutStay, setOptOutStay] = useState(false);
  const [stayGuestName, setStayGuestName] = useState('Tirth Dixit Shah');
  const [stayGuestEmail, setStayGuestEmail] = useState('tirth.shah@example.com');
  const [stayGuestPhone, setStayGuestPhone] = useState('+91 98200 12345');
  const [stayDocUploaded, setStayDocUploaded] = useState(true);
  const [stayAmount, setStayAmount] = useState(8500);
  const [stayTermsAccepted, setStayTermsAccepted] = useState(true);

  // Screen 3: Travel State
  const [optOutTravel, setOptOutTravel] = useState(false);
  const [travelName, setTravelName] = useState('Tirth Dixit Shah');
  const [travelEmail, setTravelEmail] = useState('tirth.shah@example.com');
  const [travelPhone, setTravelPhone] = useState('+91 98200 12345');
  const [travelDocUploaded, setTravelDocUploaded] = useState(true);
  const [travelAmount, setTravelAmount] = useState(7500);
  const [travelTermsAccepted, setTravelTermsAccepted] = useState(true);

  // Screen 4: Claim Local State
  const [localClaimReason, setLocalClaimReason] = useState('Acute viral medical emergency with hospitalization recommendation');
  const [localProofUploaded, setLocalProofUploaded] = useState(true);
  const [localVideoUploaded, setLocalVideoUploaded] = useState(true);
  const [localDeclarationAccepted, setLocalDeclarationAccepted] = useState(true);

  // Screen 5: Claim Outstation State
  const [outClaimReason, setOutClaimReason] = useState('Severe flight cancellation and interstate emergency');
  const [outProofUploaded, setOutProofUploaded] = useState(true);
  const [outStayReceiptUploaded, setOutStayReceiptUploaded] = useState(true);
  const [outTravelReceiptUploaded, setOutTravelReceiptUploaded] = useState(true);
  const [outDeclarationAccepted, setOutDeclarationAccepted] = useState(true);

  // Submission / success notification states
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'info' } | null>(null);

  // Dynamic Geofence computation (100km radius rule)
  const geofence = evaluateGeofenceRadius({ city, state, postalCode });
  const premiums = calculatePremiums({
    ticketFare,
    stayAmount: optOutStay ? 0 : stayAmount,
    travelAmount: optOutTravel ? 0 : travelAmount,
  });

  const showToast = (title: string, message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 6000);
  };

  const handleTicketSubmit = () => {
    if (!ticketTermsAccepted) {
      alert('Please accept the Tixsurance Terms & Declarations to proceed.');
      return;
    }
    showToast(
      'Ticket Policy Activated!',
      `Tixsurance policy issued under ${geofence.policyType} classification (${geofence.distanceKm} km from venue).`
    );
    if (geofence.policyType === 'OUTSTATION') {
      setActiveScreen('stay');
    }
  };

  const handleStaySubmit = () => {
    showToast('Stay Shield Saved', optOutStay ? 'Stay insurance opted out.' : 'Accommodation protection active.');
    setActiveScreen('travel');
  };

  const handleTravelSubmit = () => {
    showToast('Travel Shield Saved', optOutTravel ? 'Travel insurance opted out.' : 'Travel corridor protection active.');
    showToast('Policy Setup Complete', 'Full Tixsurance coverage is now fully active for this booking!');
  };

  const handleLocalClaimSubmit = () => {
    if (!localDeclarationAccepted) {
      alert('Please check the legal declaration to submit your claim.');
      return;
    }
    showToast(
      'Claim Submitted — Payout on HOLD',
      '12-Hour countdown has started! Ship your uncut wristband to Empressa 14 Hub within 12 hours.'
    );
  };

  const handleOutstationClaimSubmit = () => {
    if (!outDeclarationAccepted) {
      alert('Please check the legal declaration to submit your claim.');
      return;
    }
    showToast(
      'Outstation Claim Filed',
      'Our forensic team is auditing your stay & travel cancellation receipts. Payout scheduled post-audit.'
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Top Banner Navigation & Screen Switcher */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-white">TIXSURANCE™</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  EVENT &amp; TRAVEL SHIELD
                </span>
              </div>
              <p className="text-xs text-slate-400">Zero-Fraud Event Ticket, Stay &amp; Travel Protection Ecosystem</p>
            </div>
          </div>

          {/* Quick Screen Switcher Tabs matching Canva screens */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveScreen('ticket')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeScreen === 'ticket'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1 - Ticket Protection
            </button>
            <button
              onClick={() => setActiveScreen('stay')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeScreen === 'stay'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              2 - Stay Shield
            </button>
            <button
              onClick={() => setActiveScreen('travel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeScreen === 'travel'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              3 - Travel Shield
            </button>
            <button
              onClick={() => setActiveScreen('claim_local')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeScreen === 'claim_local'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              4 - Claim (Local ≤100km)
            </button>
            <button
              onClick={() => setActiveScreen('claim_outstation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeScreen === 'claim_outstation'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              5 - Claim (Outstation &gt;100km)
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/admin/claims"
              className="text-xs px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              Admin Forensic Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

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

      {/* Main Canvas Container - Styled identically to Canva Document Artboard */}
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
                  <ShieldCheck className="w-5 h-5 text-blue-300" />
                  <h1 className="font-extrabold text-base md:text-lg tracking-wider">
                    TIXSURANCE - TICKET PROTECTION
                  </h1>
                </div>
                <p className="text-xs text-blue-100/90 mt-0.5">Secure your Tickets now by filling this form</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold tracking-wide uppercase px-2.5 py-1 bg-white/10 rounded border border-white/20">
                  Booking ID: {bookingId}
                </span>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Section: Attendee's Information */}
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
                      placeholder="e.g. TIRTH DIXIT SHAH"
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
                        placeholder="attendee@example.com"
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
                        placeholder="+91 98XXX XXXXX"
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
                        placeholder="Address Line 1*"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                      />
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Address Line 2 (Optional)"
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

                  {/* Government ID Photo Upload */}
                  <div className="pt-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Government ID Photo*</label>
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>{govIdUploaded ? 'Aadhar_Card_Front_Back.jpg (Verified)' : 'Select government ID image'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGovIdUploaded(!govIdUploaded)}
                        className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider transition-colors"
                      >
                        {govIdUploaded ? 'REPLACE' : 'UPLOAD'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Premium Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-600">Insured Ticket Value: </span>
                  <span className="font-bold text-slate-900 text-sm">₹{ticketFare.toLocaleString('en-IN')}</span>
                  <span className="text-slate-400 ml-2">(@ 5% checkout protection)</span>
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
                onClick={handleTicketSubmit}
                className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white font-bold text-sm tracking-wider uppercase rounded shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
              >
                SUBMIT AND ACTIVATE POLICY
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
                <Hotel className="w-5 h-5 text-blue-300" />
                <h1 className="font-extrabold text-base md:text-lg tracking-wider">
                  TIXSURANCE - ACCOMMODATION SHIELD
                </h1>
              </div>
              <span className="text-xs font-bold uppercase px-2.5 py-1 bg-white/10 rounded">
                Booking ID: {bookingId}
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
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number*</label>
                      <input
                        type="tel"
                        value={stayGuestPhone}
                        onChange={(e) => setStayGuestPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Hotel / Airbnb Booking Confirmation PDF*
                    </label>
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>{stayDocUploaded ? 'Taj_Santacruz_Booking_Confirmation.pdf' : 'Attach booking invoice'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStayDocUploaded(!stayDocUploaded)}
                        className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                      >
                        {stayDocUploaded ? 'REPLACE' : 'UPLOAD'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Booked (₹)*</label>
                      <input
                        type="number"
                        value={stayAmount}
                        onChange={(e) => setStayAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Total Premium to be Paid (5%)</label>
                      <div className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-100 font-bold text-blue-700">
                        ₹{Math.round(stayAmount * 0.05)}
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
                <Plane className="w-5 h-5 text-blue-300" />
                <h1 className="font-extrabold text-base md:text-lg tracking-wider">
                  TIXSURANCE - TRAVEL SHIELD
                </h1>
              </div>
              <span className="text-xs font-bold uppercase px-2.5 py-1 bg-white/10 rounded">
                Booking ID: {bookingId}
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
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number*</label>
                      <input
                        type="tel"
                        value={travelPhone}
                        onChange={(e) => setTravelPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Flight / Train / Bus Booking Ticket PDF*
                    </label>
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>{travelDocUploaded ? 'Akasa_Air_QP1120_Ticket.pdf' : 'Upload transit ticket PDF'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTravelDocUploaded(!travelDocUploaded)}
                        className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                      >
                        {travelDocUploaded ? 'REPLACE' : 'UPLOAD'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Booked (₹)*</label>
                      <input
                        type="number"
                        value={travelAmount}
                        onChange={(e) => setTravelAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Total Premium to be Paid (5%)</label>
                      <div className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-100 font-bold text-blue-700">
                        ₹{Math.round(travelAmount * 0.05)}
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
                    TIXSURANCE - FILE YOUR CLAIM
                  </h1>
                </div>
                <p className="text-xs text-blue-100/90 mt-0.5">Local Policyholder Corridor (≤100km Radius)</p>
              </div>
              <span className="text-xs font-bold uppercase px-2.5 py-1 bg-white/10 rounded">
                Booking ID: {bookingId}
              </span>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Empathy Intro Message from Canva */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed font-medium">
                We are sorry to hear that you won&apos;t be heading for the event. Please let us know why, so that we can reimburse you.
              </div>

              {/* Attendee Info Section */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                  Attendee&apos;s Information
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Booking ID</label>
                  <input
                    type="text"
                    value={bookingId}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for cancellation*</label>
                  <textarea
                    rows={2}
                    value={localClaimReason}
                    onChange={(e) => setLocalClaimReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Proof of Emergency*</label>
                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{localProofUploaded ? 'Doctor_Hospital_Emergency_Slip.pdf' : 'Attach medical / emergency certificate'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalProofUploaded(!localProofUploaded)}
                      className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                    >
                      {localProofUploaded ? 'REPLACE' : 'UPLOAD'}
                    </button>
                  </div>
                </div>

                {/* Initiation of the Return of Bands (Exact Canva Box & Address) */}
                <div className="border-2 border-amber-300 bg-amber-50/70 rounded-xl p-4 text-slate-800 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wide text-amber-950">
                        Initiation of the Return of Bands (Mandatory Anti-Freeloading Safeguard)
                      </h3>
                      <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                        To eliminate freeloading and fraud, your payout is <strong>HELD</strong> until we physically
                        receive and scan your uncut wristband. The Bands/Tickets should reach the designated address
                        within <strong>12 hours</strong> of filing the claim.
                      </p>
                    </div>
                  </div>

                  {/* Hub Address Card */}
                  <div className="bg-white border border-amber-200 rounded-lg p-3 text-xs space-y-1 shadow-sm">
                    <div className="font-bold text-slate-900">Please send your Wristbands/Tickets to the address mentioned below:</div>
                    <div className="text-slate-700 leading-snug">{TIXSURANCE_HUB.address}</div>
                    <div className="pt-2 text-slate-600 border-t border-slate-100 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Please Coordinate with the below number for courier purposes: </span>
                      <strong className="text-slate-900">{TIXSURANCE_HUB.phone}</strong>
                    </div>
                  </div>
                </div>

                {/* Proof of Bands: Packaging Video Upload (Canva Step 1, 2, 3) */}
                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                    <Camera className="w-4 h-4 text-blue-600" />
                    Proof of Bands (Continuous Packaging Video)
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Please upload a single, unedited video matching the following steps before handing the package to the courier:
                  </p>

                  <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-2 text-slate-700">
                    <div>
                      <strong>1. Show the Band Close-up:</strong> Clearly show the entire wristband on camera to prove the
                      fabric is uncut, the plastic barrel-lock is un-tampered, and the QR code is fully legible.
                    </div>
                    <div>
                      <strong>2. Pack the Envelope:</strong> Without cutting or pausing the video, place the wristband
                      directly inside your courier envelope.
                    </div>
                    <div>
                      <strong>3. Seal the Package:</strong> Show yourself sealing the envelope completely on camera.
                    </div>
                  </div>

                  {/* Red Warning Banner */}
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded text-[11px] text-red-800 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Note: Videos with cuts, edits, or transitions will result in immediate claim rejection. Our hub team will match the sealed package in your video to the package delivered by the courier.</span>
                  </div>

                  {/* Video Upload Button */}
                  <div className="border border-slate-300 rounded-lg p-3 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{localVideoUploaded ? 'Wristband_Sealed_Packaging_Video.mp4 (Ready for verification)' : 'Upload packaging video'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalVideoUploaded(!localVideoUploaded)}
                      className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                    >
                      {localVideoUploaded ? 'REPLACE VIDEO' : 'UPLOAD VIDEO'}
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
                onClick={handleLocalClaimSubmit}
                className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white font-bold text-sm tracking-wider uppercase rounded shadow-lg shadow-emerald-700/20"
              >
                SUBMIT CLAIM &amp; INITIATE 12-HOUR HUB DELIVERY
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
                    TIXSURANCE - FILE YOUR CLAIM
                  </h1>
                </div>
                <p className="text-xs text-blue-100/90 mt-0.5">Outstation Corridor (&gt;100km Radius) with Stay &amp; Travel</p>
              </div>
              <span className="text-xs font-bold uppercase px-2.5 py-1 bg-white/10 rounded">
                Booking ID: {bookingId}
              </span>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed font-medium">
                We are sorry to hear that you won&apos;t be heading for the event. Please let us know why, so that we can reimburse you.
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                  Attendee&apos;s Information
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Booking ID</label>
                  <input
                    type="text"
                    value={bookingId}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for cancellation*</label>
                  <textarea
                    rows={2}
                    value={outClaimReason}
                    onChange={(e) => setOutClaimReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Proof of Emergency*</label>
                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{outProofUploaded ? 'Medical_Emergency_Prescription.pdf' : 'Attach proof document'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOutProofUploaded(!outProofUploaded)}
                      className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                    >
                      {outProofUploaded ? 'REPLACE' : 'UPLOAD'}
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
                      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Hotel className="w-4 h-4 text-blue-600" />
                          <span>{outStayReceiptUploaded ? 'Taj_Hotel_Cancellation_Invoice.pdf' : 'Upload official stay cancellation receipt'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOutStayReceiptUploaded(!outStayReceiptUploaded)}
                          className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                        >
                          {outStayReceiptUploaded ? 'REPLACE' : 'UPLOAD'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Cancellation Receipt of Travel (Airline / IRCTC Railways)*
                      </label>
                      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Plane className="w-4 h-4 text-blue-600" />
                          <span>{outTravelReceiptUploaded ? 'Akasa_Air_Cancellation_Receipt.pdf' : 'Upload official travel cancellation receipt'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOutTravelReceiptUploaded(!outTravelReceiptUploaded)}
                          className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                        >
                          {outTravelReceiptUploaded ? 'REPLACE' : 'UPLOAD'}
                        </button>
                      </div>
                    </div>
                  </div>
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
                onClick={handleOutstationClaimSubmit}
                className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white font-bold text-sm tracking-wider uppercase rounded shadow-lg shadow-emerald-700/20"
              >
                SUBMIT CLAIM FOR FORENSIC VERIFICATION
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
