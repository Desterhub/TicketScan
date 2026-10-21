'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Ticket,
  UploadCloud,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  User,
  Menu,
  X,
  Play,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'My Tickets', icon: LayoutDashboard },
    { href: '/upload', label: 'Upload & Scan', icon: UploadCloud },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ href: '/admin/dashboard', label: 'Admin Command', icon: ShieldAlert });
  }

  return (
    <nav className="w-full bg-[#090e17]/95 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white font-mono">
            TICKET<span className="text-amber-400">SCAN</span>
          </span>
        </Link>

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
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Badge & Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/intro"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 transition"
            title="Watch Cinematic Intro Portal"
          >
            <Play className="w-4 h-4 fill-current" />
          </Link>

          {user && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs font-mono">
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-[11px] leading-tight truncate max-w-[120px]">
                  {user.fullName || user.email.split('@')[0]}
                </div>
                <div className="text-[10px] text-amber-400 uppercase tracking-wider">
                  {user.role}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/80 hover:text-red-400 border border-slate-800 text-slate-400 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 border-t border-slate-800 bg-[#090e17] space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-red-400 font-semibold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
