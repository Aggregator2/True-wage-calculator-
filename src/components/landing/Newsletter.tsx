'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import AnimatedEntry from '@/components/ui/AnimatedEntry';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const { error } = await supabase
        .from('email_subscribers')
        .insert({
          email: email.trim().toLowerCase(),
          gdpr_consent: true,
          source: 'landing_newsletter',
        });

      if (error) {
        if (error.code === '23505') {
          // Already subscribed
          setStatus('success');
        } else {
          throw error;
        }
      } else {
        setStatus('success');
        localStorage.setItem('email-subscribed', 'true');

        // Send welcome email (fire-and-forget)
        fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }).catch(console.error);
      }
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="py-20 px-6 bg-[#0a0a0a]">
      <div className="max-w-xl mx-auto text-center">
        <AnimatedEntry>
          <p className="text-emerald-400 text-sm font-medium mb-3">Stay Updated</p>
          <h2 className="heading-lg text-2xl md:text-3xl text-white mb-4">
            Get the latest UK finance insights
          </h2>
          <p className="text-zinc-400 text-sm mb-8">Tax changes, calculator updates, and financial tips delivered weekly.</p>

          <form onSubmit={handleSubmit} className="flex gap-0 relative">
            <div className="flex-1 flex items-center border border-zinc-700 rounded-full h-14 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500/40 transition-all bg-zinc-900/40 pl-5 pr-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-500 outline-none"
                required
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full h-10 px-6 text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
              >
                {status === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Subscribe
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {status === 'success' && (
            <p className="text-emerald-400 text-sm mt-4">You&apos;re subscribed. Welcome aboard.</p>
          )}
          {status === 'error' && (
            <p className="text-red-400 text-sm mt-4">Something went wrong. Please try again.</p>
          )}
          {status === 'idle' && (
            <p className="text-zinc-600 text-xs mt-4">No spam. Unsubscribe anytime.</p>
          )}
        </AnimatedEntry>
      </div>
    </section>
  );
}
