'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EmailBanner() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('email-banner-dismissed');
    const alreadySubscribed = localStorage.getItem('email-subscribed');
    if (dismissed || alreadySubscribed) return;

    let triggered = false;

    const trigger = () => {
      if (triggered) return;
      triggered = true;
      window.removeEventListener('scroll', handleScroll);
      setMounted(true);
      requestAnimationFrame(() => setShow(true));
    };

    // Show after 15 seconds
    const timer = setTimeout(trigger, 15000);

    // Or on deep scroll (once)
    const handleScroll = () => {
      if (window.scrollY > 800) trigger();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('email-banner-dismissed', 'true');
    setTimeout(() => setMounted(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: dbError } = await supabase
        .from('email_subscribers')
        .insert({
          email: email.trim().toLowerCase(),
          gdpr_consent: true,
          source: 'calculator_banner',
        });

      if (dbError) {
        if (dbError.code === '23505') {
          setSubmitted(true);
        } else {
          throw dbError;
        }
        return;
      }

      setSubmitted(true);
      localStorage.setItem('email-subscribed', 'true');

      fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      }).catch(console.error);

      setTimeout(() => handleDismiss(), 4000);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-40 transition-all duration-500 ease-out ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <div className="relative bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Subtle top accent */}
        <div className="h-[2px] bg-gradient-to-r from-emerald-500/60 via-emerald-400/40 to-transparent" />

        <div className="p-5">
          {!submitted ? (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-4">
                  <p className="text-sm font-medium text-white/90 leading-snug">
                    Weekly UK finance tips & FIRE strategies
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Free weekly insights. No spam.
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors -mt-0.5"
                  aria-label="Dismiss"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 rounded-lg px-3 py-2 text-sm bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </form>

              {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
              )}

              <p className="text-[10px] text-zinc-600 mt-2.5">
                By subscribing you accept our{' '}
                <a href="/privacy" className="underline hover:text-zinc-400 transition-colors">
                  privacy policy
                </a>
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2.5 py-1">
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-zinc-300">
                You&apos;re in! Check your inbox.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
