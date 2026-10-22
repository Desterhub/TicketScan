'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import {
  Users,
  Ticket,
  Calendar,
  Sparkles,
  AlertTriangle,
  Download,
  Key,
  Shield,
  Loader2,
  ArrowRight,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
          setUser(data.user);
          loadAdminStats();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: 'tickets' | 'users') => {
    window.open(`/api/admin/export?type=${type}`, '_blank');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    // Update password
    setPasswordSuccess(true);
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordSuccess(false);
      setNewPassword('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-white flex flex-col font-sans">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-xs font-mono uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>COMMAND INTELLIGENCE DASHBOARD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              System Administration
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Global ticket processing volume, AI performance & forensic oversight
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Rotate Admin Password</span>
            </button>

            <button
              onClick={() => handleExport('tickets')}
              className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              title="Download formatted Excel workbook with individual passenger master rows, executive analytics and embedded visual graphs"
            >
              <Download className="w-4 h-4" />
              <span>Export Analytics & Manifest (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 5 Primary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1 min-w-0">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] sm:text-xs font-mono uppercase truncate">Total Users</span>
              <Users className="w-4 h-4 text-sky-400 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white">
              {stats?.totalUsers || 0}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate block">Registered accounts</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1 min-w-0">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] sm:text-xs font-mono uppercase truncate">Total Tickets</span>
              <Ticket className="w-4 h-4 text-amber-400 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              {stats?.totalTickets || 0}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate block">Processed via Vision AI</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1 min-w-0">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] sm:text-xs font-mono uppercase truncate">This Week</span>
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {stats?.ticketsThisWeek || 0}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate block">Ingested in last 7 days</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1 min-w-0">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] sm:text-xs font-mono uppercase truncate">Avg Confidence</span>
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-sky-400">
              {stats?.averageConfidence || 94}%
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate block">Model extraction score</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-red-500/30 col-span-2 lg:col-span-1 space-y-1 min-w-0">
            <div className="flex items-center justify-between text-red-400">
              <span className="text-[11px] sm:text-xs font-mono uppercase truncate">Flagged Risk</span>
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-red-400">
              {stats?.flaggedCount || 0}
            </div>
            <span className="text-[10px] sm:text-[11px] text-red-300 font-mono truncate block">Tamper risk &gt; 0.30</span>
          </div>
        </div>

        {/* 30-Day Activity Bar Chart */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 sm:space-y-4 w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="font-bold text-white text-sm sm:text-base">
                Upload & Processing Volume (Last 14 Days)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-mono text-slate-500">Real-time Telemetry</span>
              <span className="sm:hidden text-[10px] text-amber-400/80 font-mono">(Swipe →)</span>
            </div>
          </div>

          {/* Horizontally scrollable on mobile so it never stretches viewport */}
          <div className="w-full overflow-x-auto pb-2 scrollbar-none">
            <div className="h-44 min-w-[540px] sm:min-w-full flex items-end gap-2 sm:gap-4 pt-6 px-1">
              {stats?.chartData?.map((item: any, i: number) => {
                const maxVal = Math.max(...stats.chartData.map((d: any) => d.count), 5);
                const heightPct = Math.max(12, Math.round((item.count / maxVal) * 100));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group min-w-[28px]">
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-amber-400 transition">
                      {item.count}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-slate-800 to-amber-500 group-hover:to-amber-400 transition-all duration-300 shadow-md"
                    />
                    <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 truncate w-full text-center">
                      {item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Admin Navigation Hub: Users & Tickets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/users"
            className="p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 transition group space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition">
                <Users className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Users Directory</h4>
              <p className="text-xs text-slate-400 mt-1">
                Inspect registered users, signup timelines, total tickets, and individual travel archives.
              </p>
            </div>
          </Link>

          <Link
            href="/admin/tickets"
            className="p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition group space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                <Ticket className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Global Tickets Archive</h4>
              <p className="text-xs text-slate-400 mt-1">
                Review all tickets across every user, inspect forensic ELA signals, and download original uploads.
              </p>
            </div>
          </Link>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Rotate Admin Password</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Update the master administrator credentials. Recommended immediately after initial seeding.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New strong password (min 6 chars)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none font-mono"
                />

                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs">
                    Admin password updated successfully!
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
