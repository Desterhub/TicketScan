'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Ticket,
  UploadCloud,
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  User,
  Users,
  Menu,
  X,
  Play,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  user?: {
    email: string;
    role: 'user' | 'admin';
    fullName?: string | null;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Prevent body scrolling when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSidebarOpen(false);
      router.push('/login');
    } catch {
      setSidebarOpen(false);
      router.push('/login');
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'My Tickets', icon: LayoutDashboard },
    { href: '/upload', label: 'Upload & Scan', icon: UploadCloud },
    { href: '/tixsurance', label: 'Tixsurance Shield', icon: ShieldCheck },
  ];

  if (user?.role === 'admin') {
    navLinks.push(
      { href: '/admin/dashboard', label: 'Admin Command', icon: ShieldAlert },
      { href: '/admin/claims', label: 'Claims Forensics', icon: Shield },
      { href: '/admin/passengers', label: 'Traveler Intelligence', icon: Users }
    );
  }

  return (
    <>
      <nav className="w-full bg-[#090e17]/95 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left section: Hamburger button (on mobile) + Brand Logo */}
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile (Top 3 lines) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-400/50 transition cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
                <Ticket className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white font-mono">
                TICKET<span className="text-amber-400">SCAN</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right section: Desktop Profile & Actions / Mobile Quick Link */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Intro video button */}
            <Link
              href="/intro"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 transition"
              title="Watch Cinematic Intro Portal"
            >
              <Play className="w-4 h-4 fill-current" />
            </Link>

            {/* Desktop User Info */}
            {user && (
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs font-mono">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-white text-[11px] leading-tight truncate max-w-[120px]">
                    {user.fullName || user.email.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                    {user.role}
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden md:flex p-2 rounded-xl bg-slate-900 hover:bg-red-950/80 hover:text-red-400 border border-slate-800 text-slate-400 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE SLIDE-OUT SIDEBAR DRAWER (Slides from LEFT) */}
      {/* 1. Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* 2. Side Drawer Container (Slides in from Left: translate-x-0, slides back: -translate-x-full) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 max-w-[82vw] bg-[#080d16] border-r border-slate-800/90 z-50 flex flex-col justify-between p-5 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl shadow-black ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation drawer"
      >
        {/* Top of Sidebar: Brand & Close Button */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
                <Ticket className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white font-mono">
                TICKET<span className="text-amber-400">SCAN</span>
              </span>
            </Link>

            {/* Close 'X' Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card inside Drawer */}
          {user && (
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-xs truncate">
                  {user.fullName || user.email.split('@')[0]}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {user.email}
                </div>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links List */}
          <div className="space-y-1.5">
            <div className="px-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-semibold">
              Menu Navigation
            </div>

            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              );
            })}

            {/* Cinematic Intro Link */}
            <Link
              href="/intro"
              onClick={() => setSidebarOpen(false)}
              className="w-full px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center justify-between text-slate-300 hover:text-white hover:bg-slate-900/80 transition"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <Play className="w-4 h-4 fill-current" />
                <span className="text-slate-300">Cinematic Intro</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </Link>
          </div>
        </div>

        {/* Bottom of Sidebar: Logout & System Status */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-2.5 px-4 rounded-xl bg-red-950/50 hover:bg-red-900/70 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Operational
            </span>
            <span>TicketScan v2.4</span>
          </div>
        </div>
      </aside>
    </>
  );
}
