'use client';

import React, { useState } from 'react';
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
  Mail,
  User as UserIcon,
  Play,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onWatchIntro?: () => void;
  isInPortal?: boolean;
}

export function LoginForm({ onSuccess, onWatchIntro, isInPortal = false }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload =
        mode === 'login'
          ? { email, password }
          : { email, password, fullName: fullName.trim() || undefined };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

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
      className={`w-full max-w-md mx-auto rounded-2xl bg-[#0f172a]/95 border border-[#334155] shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all ${
        isInPortal ? 'p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.2)]' : 'p-7 sm:p-8'
      }`}
    >
      {/* Boarding Pass Header Stamp */}
      <div className="flex items-center justify-between pb-4 border-b border-[#334155]/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono tracking-widest uppercase text-amber-400 font-semibold flex items-center gap-1.5">
              <span>BOARDING PASS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">TicketScan Gate</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-slate-300">
          <Plane className="w-3.5 h-3.5 text-sky-400" />
          <Train className="w-3.5 h-3.5 text-amber-400" />
          <Bus className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className="grid grid-cols-2 p-1 my-5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`py-2 rounded-lg transition-all font-semibold ${
            mode === 'login'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError(null);
          }}
          className={`py-2 rounded-lg transition-all font-semibold ${
            mode === 'signup'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Register
        </button>
      </div>

      {/* Error Alert */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Passenger Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="passenger@domain.com"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-amber-500/25 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validating Clearance...</span>
            </>
          ) : (
            <>
              <span>{mode === 'login' ? 'Board & Enter Dashboard' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Ticket Footer Perforation & Security Stub */}
      <div className="mt-6 pt-4 border-t border-dashed border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-Bit TLS Guard</span>
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
      <div className="mt-3 h-4 barcode-pattern opacity-25 rounded-sm" />
    </div>
  );
}
