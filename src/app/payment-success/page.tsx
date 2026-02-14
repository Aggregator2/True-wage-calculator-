'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCalculatorStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { setSubscriptionStatus } = useCalculatorStore();

  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    if (redirectStatus === 'succeeded' || paymentIntent) {
      setStatus('success');

      // Try to refresh subscription status, falling back to verify-payment endpoint
      const refreshStatus = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // First check the DB (webhook may have already updated)
        const { data } = await supabase
          .from('user_profiles')
          .select('subscription_status')
          .eq('id', session.user.id)
          .single();

        if (data && (data.subscription_status === 'premium' || data.subscription_status === 'lifetime')) {
          setSubscriptionStatus(data.subscription_status);
          return;
        }

        // Webhook hasn't arrived yet — call verify-payment to check Stripe directly
        try {
          const res = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          const result = await res.json();
          if (result.status === 'premium' || result.status === 'lifetime') {
            setSubscriptionStatus(result.status);
          }
        } catch {
          // ignore - webhook will eventually update
        }
      };

      refreshStatus();
    } else {
      setStatus('error');
    }
  }, [searchParams, setSubscriptionStatus]);

  return (
    <div className="card card-glow max-w-md w-full p-8 text-center">
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-6">
            <svg className="animate-spin h-8 w-8 text-[#10b981]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Processing...</h1>
          <p className="text-neutral-400">Please wait while we confirm your payment.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-20 h-20 rounded-full bg-[#10b981]/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-neutral-400 mb-6">
            Welcome to TrueWage Premium! Your account has been upgraded.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-lg font-medium bg-[#10b981] text-black hover:bg-[#10b981]/90 transition-all"
          >
            Go to Calculator
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Issue</h1>
          <p className="text-neutral-400 mb-6">
            There was an issue processing your payment. Please try again.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-lg font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            Return to Calculator
          </Link>
        </>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <Suspense fallback={
        <div className="card card-glow max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-6">
            <svg className="animate-spin h-8 w-8 text-[#10b981]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Processing...</h1>
          <p className="text-neutral-400">Please wait while we confirm your payment.</p>
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </main>
  );
}
