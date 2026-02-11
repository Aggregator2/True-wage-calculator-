'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCalculatorStore } from '@/lib/store';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, setShowAuthModal } = useCalculatorStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#050505]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <span className="text-emerald-400 font-bold text-sm font-[var(--font-heading)]">TW</span>
          </div>
          <span className="font-[var(--font-heading)] font-bold text-white text-lg tracking-tight">
            TrueWage
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <a href="#features" className="btn-ghost px-4 py-2 text-sm">Features</a>
          <a href="#pricing" className="btn-ghost px-4 py-2 text-sm">Pricing</a>
          <Link href="/calculator" className="btn-ghost px-4 py-2 text-sm">Calculator</Link>
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="btn-primary px-5 py-2.5 text-sm"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <button
                onClick={() => setShowAuthModal(true, 'sign_in')}
                className="btn-ghost px-4 py-2.5 text-sm"
              >
                Sign In
              </button>
              <Link
                href="/calculator"
                className="btn-primary px-5 py-2.5 text-sm"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.04] bg-[#0a0a0a] px-6 py-4 space-y-2">
          <a href="#features" onClick={() => setMobileOpen(false)} className="block py-3 text-sm text-zinc-300 hover:text-white">Features</a>
          <a href="#pricing" onClick={() => setMobileOpen(false)} className="block py-3 text-sm text-zinc-300 hover:text-white">Pricing</a>
          <Link href="/calculator" onClick={() => setMobileOpen(false)} className="block py-3 text-sm text-zinc-300 hover:text-white">Calculator</Link>
          <div className="pt-3 border-t border-white/[0.04] space-y-2">
            {user ? (
              <Link href="/dashboard" className="btn-primary block text-center py-3 text-sm">Dashboard</Link>
            ) : (
              <>
                <button onClick={() => { setShowAuthModal(true, 'sign_in'); setMobileOpen(false); }} className="block w-full text-left py-3 text-sm text-zinc-300 hover:text-white">Sign In</button>
                <Link href="/calculator" className="btn-primary block text-center py-3 text-sm">Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
