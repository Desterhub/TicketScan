'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  ShieldCheck,
  Plane,
  Train,
  Bus,
  ArrowRight,
  Lock,
  User as UserIcon,
  Mail,
  Play,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onWatchIntro?: () => void;
  isInPortal?: boolean;
}

export function LoginForm({ onSuccess, onWatchIntro, isInPortal = false }: LoginFormProps) {
  const router = useRouter();
  // Default to 'signup' for first-time visitors
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [passengerName, setPassengerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if this browser has already registered previously
  useEffect(() => {
    try {
      const hasRegistered = localStorage.getItem('ticketscan_has_registered');
      if (hasRegistered === 'true') {
        setMode('login');
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedsRegistration(false);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!email.trim() || !email.includes('@')) {
          throw new Error('A valid email address is mandatory for notifications & ticket updates.');
        }
      }

      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload =
        mode === 'login'
          ? { identifier: passengerName.trim(), password }
          : { fullName: passengerName.trim(), email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsRegistration) {
          setNeedsRegistration(true);
        }
        throw new Error(data.error || 'Authentication failed. Please verify your details.');
      }

      // Mark that user has registered on this browser
      try {
        localStorage.setItem('ticketscan_has_registered', 'true');
      } catch {}

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(data.redirectTo || '/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full max-w-sm sm:max-w-md mx-auto rounded-2xl bg-[#0f172a]/95 border border-[#334155] shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all ${
        isInPortal ? 'p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)]' : 'p-6 sm:p-8'
      }`}
    >
      {/* Boarding Pass Header Stamp */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#334155]/80">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-mono tracking-widest uppercase text-amber-400 font-semibold flex items-center gap-1.5">
              <span>BOARDING PASS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">TicketScan Gate</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] font-mono text-slate-300">
          <Plane className="w-3.5 h-3.5 text-sky-400" />
          <Train className="w-3.5 h-3.5 text-amber-400" />
          <Bus className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className="grid grid-cols-2 p-1 my-4 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
            setNeedsRegistration(false);
          }}
          className={`py-2 rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5 ${
            mode === 'login'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError(null);
            setNeedsRegistration(false);
          }}
          className={`py-2 rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5 relative ${
            mode === 'signup'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Register</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-semibold ${
              mode === 'signup'
                ? 'bg-slate-950/80 text-amber-300'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            Required 1st
          </span>
        </button>
      </div>

      {/* Mandatory First-Time Notice */}
      {mode === 'signup' && (
        <div className="mb-3.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] flex items-center gap-2 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="leading-tight">
            First-time passengers must complete registration once before accessing the scanner gate.
          </span>
        </div>
      )}

      {/* Error Alert */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-3.5 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="leading-snug">{error}</p>
              {needsRegistration && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setNeedsRegistration(false);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] shadow hover:bg-amber-400 transition cursor-pointer"
                >
                  <span>Switch to Registration Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Fields with Browser Autofill Prevention */}
      <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off">
        {/* Hidden inputs to divert browser autofill / password managers */}
        <input
          type="text"
          name="prevent_autofill_name_trap"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <input
          type="password"
          name="prevent_autofill_pass_trap"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {/* Passenger Name Field (Used for both Register and Sign In) */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
            {mode === 'signup' ? 'Passenger Full Name' : 'Passenger Name'}
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="passenger_access_identifier"
              id="passenger_access_identifier"
              required
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck="false"
              data-lpignore="true"
              data-form-type="other"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              placeholder="e.g. Tirth Shah"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>
          {mode === 'login' ? (
            <p className="mt-1 text-[11px] font-mono text-slate-500">
              Enter the full name or username you registered with
            </p>
          ) : (
            <p className="mt-1 text-[11px] font-mono text-slate-500">
              This name will be your login ID for all future sign-ins
            </p>
          )}
        </div>

        {/* Mandatory Email Field (Visible ONLY in Registration Mode) */}
        {mode === 'signup' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                Email Address <span className="text-amber-400 font-bold">*Mandatory</span>
              </label>
              <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                For Alerts & Updates
              </span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="passenger_contact_dispatch"
                id="passenger_contact_dispatch"
                required
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck="false"
                data-lpignore="true"
                data-form-type="other"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex.morgan@example.com"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>
            <p className="mt-1 text-[11px] font-mono text-amber-400/80">
              Mandatory: Stored so we can email you ticket scanning reports & forensic tamper notifications.
            </p>
          </div>
        )}

        {/* Password Field */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
            {mode === 'signup' ? 'Create Password' : 'Password'}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              name="passenger_security_secret"
              id="passenger_security_secret"
              required
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition font-mono"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-amber-500/25 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking Clearance...</span>
            </>
          ) : (
            <>
              <span>{mode === 'login' ? 'Board & Enter Dashboard' : 'Register Passenger Pass'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Quick Mode Toggle Link */}
        <div className="text-center pt-1">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setNeedsRegistration(false);
              }}
              className="text-xs text-slate-400 hover:text-amber-400 font-mono transition inline-flex items-center gap-1 cursor-pointer"
            >
              <span>First time here?</span>
              <span className="text-amber-400 underline underline-offset-2 font-semibold">
                Register first (Compulsory)
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setNeedsRegistration(false);
              }}
              className="text-xs text-slate-400 hover:text-amber-400 font-mono transition inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Already registered?</span>
              <span className="text-amber-400 underline underline-offset-2 font-semibold">
                Sign In with your Passenger Name
              </span>
            </button>
          )}
        </div>
      </form>

      {/* Ticket Footer Perforation & Security Stub */}
      <div className="mt-5 pt-3.5 border-t border-dashed border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
        <div className="flex items-center gap-1.5 text-emerald-400 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-Bit Guard</span>
        </div>

        {/* Watch Intro Link */}
        {onWatchIntro ? (
          <button
            type="button"
            onClick={onWatchIntro}
            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Watch Intro</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push('/intro')}
            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Watch Intro</span>
          </button>
        )}
      </div>

      {/* Decorative Barcode Pattern */}
      <div className="mt-3 h-3.5 barcode-pattern opacity-25 rounded-sm" />
    </div>
  );
}
