'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const { error } = await supabase
        .from('email_subscribers')
        .update({
          is_active: false,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('email', email);

      if (error) {
        throw error;
      }

      setStatus('success');
      setMessage('You have been successfully unsubscribed from our newsletter.');
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setStatus('error');
      setMessage('Failed to unsubscribe. Please try again or contact support.');
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="card card-glow max-w-md w-full p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
              <span className="text-[#050505] font-bold text-lg">£</span>
            </div>
            <span className="font-semibold text-white text-xl">TrueWage</span>
          </Link>
        </div>

        {status === 'success' ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#10b981]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Unsubscribed</h1>
            <p className="text-neutral-400 mb-6">{message}</p>
            <p className="text-sm text-neutral-500 mb-6">
              We're sorry to see you go. You can always resubscribe from our website.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg font-medium bg-[#10b981] text-black hover:bg-[#10b981]/90 transition-all"
            >
              Return to Calculator
            </Link>
          </div>
        ) : status === 'error' ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-neutral-400 mb-6">{message}</p>
            <button
              onClick={() => setStatus('idle')}
              className="px-6 py-3 rounded-lg font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white text-center mb-2">Unsubscribe</h1>
            <p className="text-neutral-400 text-center mb-6">
              Enter your email to unsubscribe from our newsletter
            </p>

            <form onSubmit={handleUnsubscribe} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981]"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 rounded-lg font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 transition-all"
              >
                {status === 'loading' ? 'Processing...' : 'Unsubscribe'}
              </button>
            </form>

            <p className="text-xs text-neutral-500 text-center mt-6">
              Changed your mind?{' '}
              <Link href="/" className="text-[#10b981] hover:underline">
                Return to the calculator
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="card card-glow max-w-md w-full p-8 text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </main>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
