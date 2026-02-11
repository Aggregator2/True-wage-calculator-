'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCalculatorStore, useIsPremium } from '@/lib/store';
import AuthButton from './AuthButton';

export default function Header() {
  const { user, setShowPremiumModal } = useCalculatorStore();
  const isPremium = useIsPremium();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-20 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-[#050505] font-bold text-sm">£</span>
            </div>
            <span className="font-semibold text-white text-[15px]">TrueWage</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: '#calculator', label: 'Calculator' },
              { href: '#products', label: 'Cost Explorer' },
              { href: '#sp500Calculator', label: 'Opportunity Cost' },
              { href: '#fireProgress', label: 'FIRE Tracker' },
              { href: '#methodology', label: 'How It Works' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-[13px] text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                {link.label}
              </a>
            ))}
            {user && (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-[13px] text-[#10b981] hover:text-[#34d399] rounded-lg hover:bg-[#10b981]/5 transition-all font-medium"
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Tax Rate Badge - hidden on mobile */}
          <span className="tag hidden sm:inline-flex">
            <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></span>
            2025/26 Tax Rates
          </span>

          {/* Upgrade button - only for logged-in non-premium users */}
          {user && !isPremium && (
            <button
              onClick={() => setShowPremiumModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white rounded-lg hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/20"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Upgrade
            </button>
          )}

          {/* Premium badge for premium users */}
          {user && isPremium && (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Premium
            </span>
          )}

          {/* Notifications bell - only for logged-in users */}
          {user && (
            <button
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
              aria-label="Notifications"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification dot — uncomment when you have notifications */}
              {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" /> */}
            </button>
          )}

          {/* Profile / Sign In */}
          <AuthButton />

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
            {[
              { href: '#calculator', label: 'Calculator' },
              { href: '#products', label: 'Cost Explorer' },
              { href: '#sp500Calculator', label: 'Opportunity Cost' },
              { href: '#fireProgress', label: 'FIRE Tracker' },
              { href: '#methodology', label: 'How It Works' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-sm text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                {link.label}
              </a>
            ))}
            {user && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-sm text-[#10b981] hover:text-[#34d399] rounded-lg hover:bg-[#10b981]/5 transition-all font-medium"
              >
                Dashboard
              </Link>
            )}
            {user && !isPremium && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowPremiumModal(true);
                }}
                className="mt-2 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white rounded-lg"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Upgrade to Premium
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
