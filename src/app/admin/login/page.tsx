'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Lock,
  UserCheck,
  ArrowRight,
  Clock,
  AlertTriangle,
  Loader2,
  Terminal,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Admin authentication failed.');
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Access Denied. Check your admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050811] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Security Ambient Grid / Scanline backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500/5 blur-[120px] pointer-events-none" />

      {/* Main Admin Portal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#0a101f]/95 border border-red-500/30 rounded-2xl shadow-2xl backdrop-blur-2xl p-7 relative z-10"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shadow-lg shadow-red-950/50">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-red-400 font-bold flex items-center gap-1.5">
                <span>SECURITY CLEARANCE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">Admin Terminal</h1>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Terminal className="w-3 h-3 text-red-400" />
            <span>SYS_ADMIN</span>
          </div>
        </div>

        {/* Security Alert Notice */}
        <div className="my-5 p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-red-300 text-xs flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-red-400 shrink-0" />
          <span className="leading-snug">
            30-minute inactivity session timeout enforced for data governance.
          </span>
        </div>

        {/* Error Feedback */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500 text-red-200 text-xs flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4" autoComplete="off">
          <input type="text" name="b_admin_usr" className="hidden" tabIndex={-1} autoComplete="off" />
          <input type="password" name="b_admin_pwd" className="hidden" tabIndex={-1} autoComplete="off" />
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Admin Identifier (Username or Email)
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="admin_ident_field"
                required
                autoComplete="new-password"
                data-lpignore="true"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="tirth"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition font-mono"
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-mono">
              Initial seeded admin account: <span className="text-slate-400">tirth</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="admin_sec_pass"
                required
                autoComplete="new-password"
                data-lpignore="true"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-red-950/60 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authorizing Security Key...</span>
              </>
            ) : (
              <>
                <span>Authenticate Admin Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] font-mono text-slate-500">
            Protected under TicketScan Threat Intelligence. Failed attempts are rate-limited and logged.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
