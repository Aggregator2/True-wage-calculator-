'use client';

import { useState, useRef, useEffect } from 'react';
import { useCalculatorStore, useIsPremium } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AuthButton() {
  const { user, subscriptionStatus, setShowAuthModal, setUser, setSubscriptionStatus, setShowPremiumModal } = useCalculatorStore();
  const isPremium = useIsPremium();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    setSubscriptionStatus(null);
  };

  // ─── Not logged in: Sign In button ───
  if (!user) {
    return (
      <button
        onClick={() => setShowAuthModal(true, 'sign_in')}
        className="px-4 py-2 text-sm font-medium rounded-xl bg-[#10b981] text-black hover:bg-[#10b981]/90 transition-all"
      >
        Sign In
      </button>
    );
  }

  // ─── Logged in: Avatar + dropdown ───
  const initials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : '??';

  const statusLabel = subscriptionStatus === 'lifetime'
    ? 'Lifetime'
    : subscriptionStatus === 'premium'
      ? 'Premium'
      : 'Free';

  const statusColor = isPremium
    ? 'text-[#10b981]'
    : 'text-neutral-500';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-9 h-9 rounded-full flex items-center justify-center
          text-xs font-bold transition-all duration-200
          ${isPremium
            ? 'bg-gradient-to-br from-[#10b981] to-[#059669] text-black ring-2 ring-[#10b981]/30'
            : 'bg-[#1a1a1a] text-neutral-300 ring-1 ring-white/10 hover:ring-white/20'
          }
        `}
        aria-label="Profile menu"
      >
        {initials}
        {/* Online indicator */}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10b981] rounded-full border-2 border-[#050505]" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#111111] border border-white/8 shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-white/6">
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                ${isPremium
                  ? 'bg-gradient-to-br from-[#10b981] to-[#059669] text-black'
                  : 'bg-[#1a1a1a] text-neutral-300'
                }
              `}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{user.email}</p>
                <p className={`text-xs font-medium ${statusColor} flex items-center gap-1`}>
                  {isPremium && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )}
                  {statusLabel} Plan
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>

            {!isPremium && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowPremiumModal(true);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-amber-400 hover:text-amber-300 hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Upgrade to Premium
              </button>
            )}

            {isPremium && (
              <button
                onClick={async () => {
                  setIsOpen(false);
                  try {
                    const res = await fetch('/api/create-portal-session', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: user.id }),
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.open(data.url, '_blank');
                    }
                  } catch (err) {
                    console.error('Portal session error:', err);
                  }
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Manage Billing
              </button>
            )}
          </div>

          {/* Sign out */}
          <div className="border-t border-white/6 py-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-400 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
