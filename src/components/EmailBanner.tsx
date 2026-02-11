'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EmailBanner() {
  const [email, setEmail] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show banner after a delay or scroll
  useEffect(() => {
    // Check if already dismissed in this session
    const dismissed = sessionStorage.getItem('email-banner-dismissed');
    if (dismissed) return;

    // Show after 10 seconds or on scroll
    const timer = setTimeout(() => setIsVisible(true), 10000);

    const handleScroll = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('email-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!gdprConsent) {
      setError('Please accept the privacy policy to continue');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: dbError } = await supabase
        .from('email_subscribers')
        .insert({
          email,
          gdpr_consent: true,
          source: 'calculator_banner',
        });

      if (dbError) {
        if (dbError.code === '23505') {
          setError('This email is already subscribed!');
        } else {
          throw dbError;
        }
        return;
      }

      setSubmitted(true);

      // Try to send welcome email (don't block on failure)
      fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(console.error);

      // Auto-hide after success
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('email-banner-dismissed', 'true');
      }, 4000);
    } catch (err) {
      console.error('Email signup error:', err);
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#10b981] to-[#059669] p-4 shadow-2xl border-t border-white/10">
      <div className="mx-auto max-w-5xl">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Text */}
            <div className="flex-1">
              <p className="text-base font-semibold text-white flex items-center gap-2">
                <span className="text-xl">💡</span>
                Get weekly FIRE tips & calculator updates
              </p>
              <p className="text-sm text-white/80 mt-1">
                Join 2,000+ UK professionals optimising their true hourly wage
              </p>
            </div>

            {/* Input */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="rounded-lg px-4 py-2.5 text-sm bg-white/95 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[200px]"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#050505] px-6 py-2.5 font-medium text-white hover:bg-[#1a1a1a] disabled:opacity-50 transition-all whitespace-nowrap"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Subscribing...
                  </span>
                ) : (
                  'Subscribe Free'
                )}
              </button>
            </div>

            {/* GDPR Checkbox */}
            <label className="flex items-start gap-2 text-xs text-white/90 cursor-pointer lg:max-w-[180px]">
              <input
                type="checkbox"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                className="mt-0.5 rounded border-white/30 bg-white/20 text-[#050505] focus:ring-white/50"
              />
              <span>
                I accept the{' '}
                <a href="/privacy" className="underline hover:text-white">
                  privacy policy
                </a>
              </span>
            </label>

            {/* Close button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-2 right-2 lg:relative lg:top-0 lg:right-0 text-white/70 hover:text-white p-1 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-medium">
              Thanks for subscribing! Check your email for a welcome message.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-200 mt-2 text-center lg:text-left">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
