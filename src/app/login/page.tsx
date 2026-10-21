import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Scan, FileCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Passenger Check-In | TicketScan',
  description: 'Sign in to your TicketScan account to upload and verify travel tickets.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#090e17] text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[130px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            TS
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white font-mono">
            TICKET<span className="text-amber-400">SCAN</span>
          </span>
        </div>

        <Link
          href="/intro"
          className="px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-mono transition flex items-center gap-1.5"
        >
          <span>▶ Watch Intro Portal</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto px-6 py-8 gap-12 z-10 w-full">
        {/* Left Hero Pitch */}
        <div className="flex-1 max-w-xl text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Travel Document Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Instant Ticket Extraction.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-sky-400">
              Uncompromising Forensics.
            </span>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed">
            Upload PDF or scanned tickets for flights, trains, and buses. TicketScan parses
            structured travel data in seconds and applies multi-layer forensic checks to surface
            tamper risks.
          </p>

          {/* Value Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <Scan className="w-5 h-5 text-sky-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-200">Vision AI</div>
                <div className="text-[11px] text-slate-500">Multi-page parsing</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-200">Forensics</div>
                <div className="text-[11px] text-slate-500">ELA & text signals</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-200">Boarding Pass</div>
                <div className="text-[11px] text-slate-500">Polished stub UI</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-3 z-10">
        <div>© 2026 TicketScan Forensic Terminal. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-400 transition cursor-pointer">Privacy Protocol</span>
          <span>•</span>
          <span className="hover:text-slate-400 transition cursor-pointer">Security Terms</span>
          <span>•</span>
          <Link href="/admin/login" className="text-slate-600 hover:text-amber-400/80 transition">
            Terminal Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
