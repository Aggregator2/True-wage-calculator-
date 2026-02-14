'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import PaymentMethodSelector from './PaymentMethodSelector';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type PlanType = 'monthly' | 'annual' | 'lifetime';

const plans: Record<PlanType, {
  name: string;
  price: string;
  rawPrice: number;
  period: string;
  savings?: string;
  popular?: boolean;
  lookupKey: string;
  perMonth?: string;
}> = {
  monthly: {
    name: 'Monthly',
    price: '£7',
    rawPrice: 700,
    period: '/month',
    perMonth: '£7/mo',
    lookupKey: 'premium_monthly',
  },
  annual: {
    name: 'Annual',
    price: '£60',
    rawPrice: 6000,
    period: '/year',
    savings: 'Save £24/year',
    popular: true,
    perMonth: '£5/mo',
    lookupKey: 'premium_annual',
  },
  lifetime: {
    name: 'Lifetime',
    price: '£500',
    rawPrice: 50000,
    period: 'one-time',
    savings: 'Never pay again',
    lookupKey: 'premium_lifetime',
  },
};

const premiumFeatures = [
  'Unlimited PDF downloads',
  'All premium calculators',
  'Save unlimited scenarios',
  '12-month progress tracking',
  'Geographic Arbitrage tool',
  'Work Intensity calculator',
  'Priority support',
  'Early access to new features',
];

// ─────────────────────────────────────────────────────────────────────────────
// Express Checkout (Apple Pay / Google Pay) via PaymentRequestButton
// ─────────────────────────────────────────────────────────────────────────────
function ExpressCheckout({
  plan,
  clientSecret,
  onSuccess,
}: {
  plan: PlanType;
  clientSecret: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'GB',
      currency: 'gbp',
      total: {
        label: `TrueWage Premium – ${plans[plan].name}`,
        amount: plans[plan].rawPrice,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });

    pr.on('paymentmethod', async (ev: any) => {
      if (!stripe) {
        ev.complete('fail');
        return;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: ev.paymentMethod.id },
        { handleActions: false }
      );

      if (error) {
        ev.complete('fail');
      } else {
        ev.complete('success');
        if (paymentIntent?.status === 'requires_action') {
          const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
          if (!confirmError) {
            onSuccess();
          }
        } else {
          onSuccess();
        }
      }
    });
  }, [stripe, plan, clientSecret, onSuccess]);

  if (!canMakePayment || !paymentRequest) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden">
        <PaymentRequestButtonElement
          options={{
            paymentRequest,
            style: {
              paymentRequestButton: {
                type: 'default',
                theme: 'light',
                height: '48px',
              },
            },
          }}
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">or pay with card</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout Form with Payment Method Selector + Stripe PaymentElement
// ─────────────────────────────────────────────────────────────────────────────
function CheckoutForm({
  plan,
  onBack,
  onSuccess,
  clientSecret,
}: {
  plan: PlanType;
  onBack: () => void;
  onSuccess: () => void;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('card');

  const handleSuccess = useCallback(() => onSuccess(), [onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Plan Summary Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#10b981]/15 via-[#1a1a1a] to-[#1a1a1a] border border-[#10b981]/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{plans[plan].name} Plan</p>
                <p className="text-xs text-[#10b981]">{plans[plan].savings || 'Flexible billing'}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white">{plans[plan].price}</span>
            <span className="text-neutral-500 text-xs ml-1">{plans[plan].period}</span>
          </div>
        </div>
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Express Checkout (Apple Pay / Google Pay) */}
      <ExpressCheckout
        plan={plan}
        clientSecret={clientSecret}
        onSuccess={handleSuccess}
      />

      {/* Stripe Payment Element */}
      <div className="rounded-xl overflow-hidden bg-[#0a0a0a] p-4 border border-white/8">
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                address: {
                  country: 'GB',
                },
              },
            },
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 py-3 rounded-xl font-medium text-sm bg-white/6 text-neutral-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 border border-white/6"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-[2] py-3 rounded-xl font-semibold text-sm bg-[#10b981] text-black hover:bg-[#10b981]/90 transition-all disabled:opacity-50 relative overflow-hidden group"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pay {plans[plan].price}
            </span>
          )}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </button>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <p className="text-xs text-neutral-600 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          256-bit SSL encrypted
        </p>
        <p className="text-xs text-neutral-600 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Powered by Stripe
        </p>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success View
// ─────────────────────────────────────────────────────────────────────────────
function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center py-8 relative">
      {/* Confetti-like decorative dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#10b981]/30 animate-pulse"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="w-20 h-20 rounded-full bg-[#10b981]/20 flex items-center justify-center mx-auto mb-6 relative">
        <svg className="w-10 h-10 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div className="absolute inset-0 rounded-full bg-[#10b981]/10 animate-ping" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Welcome to Premium!</h3>
      <p className="text-neutral-400 mb-8 max-w-xs mx-auto">
        Your account has been upgraded successfully. Enjoy unlimited access to all features.
      </p>
      <button
        onClick={onClose}
        className="px-8 py-3 rounded-xl font-semibold bg-[#10b981] text-black hover:bg-[#10b981]/90 transition-all"
      >
        Start Exploring
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan Card
// ─────────────────────────────────────────────────────────────────────────────
function PlanCard({
  planKey,
  plan,
  isSelected,
  isLoading,
  disabled,
  onSelect,
}: {
  planKey: PlanType;
  plan: typeof plans[PlanType];
  isSelected: boolean;
  isLoading: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={isLoading || disabled}
      className={`
        relative w-full text-left p-5 rounded-2xl border transition-all duration-300 group
        disabled:opacity-50 disabled:cursor-not-allowed
        ${plan.popular
          ? isSelected
            ? 'bg-[#10b981]/15 border-[#10b981]/60 shadow-lg shadow-[#10b981]/10'
            : 'bg-[#10b981]/8 border-[#10b981]/30 hover:border-[#10b981]/50 hover:bg-[#10b981]/12'
          : isSelected
            ? 'bg-white/8 border-white/20 shadow-lg shadow-white/5'
            : 'bg-[#1a1a1a]/60 border-white/6 hover:border-white/15 hover:bg-[#1a1a1a]'
        }
      `}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#10b981] rounded-full text-[10px] font-bold text-black uppercase tracking-wider">
          Most Popular
        </div>
      )}

      {/* Selected indicator */}
      <div className={`
        absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300
        ${isSelected
          ? 'border-[#10b981] bg-[#10b981]'
          : plan.popular
            ? 'border-[#10b981]/40 group-hover:border-[#10b981]/60'
            : 'border-neutral-600 group-hover:border-neutral-500'
        }
      `}>
        {isSelected && (
          <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="space-y-2 pr-8">
        <h3 className="text-base font-semibold text-white">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">{plan.price}</span>
          <span className="text-neutral-500 text-xs">{plan.period}</span>
        </div>
        {plan.savings && (
          <p className="text-xs text-[#10b981] font-medium">{plan.savings}</p>
        )}
        {plan.perMonth && planKey !== 'monthly' && (
          <p className="text-xs text-neutral-500">({plan.perMonth} equivalent)</p>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Premium Modal
// ─────────────────────────────────────────────────────────────────────────────
export default function PremiumModal() {
  const { showPremiumModal, setShowPremiumModal, user, setSubscriptionStatus } = useCalculatorStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [step, setStep] = useState<'select' | 'pay'>('select');

  // Reset state when modal closes
  useEffect(() => {
    if (!showPremiumModal) {
      setSelectedPlan('annual');
      setClientSecret(null);
      setError(null);
      setPaymentSuccess(false);
      setStep('select');
    }
  }, [showPremiumModal]);

  if (!showPremiumModal) return null;

  const handleProceedToPayment = async () => {
    if (!user) {
      setError('Please sign in first to upgrade');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          lookupKey: plans[selectedPlan].lookupKey,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setClientSecret(data.clientSecret);
        setStep('pay');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('select');
    setClientSecret(null);
    setError(null);
  };

  const handleSuccess = async () => {
    setPaymentSuccess(true);

    if (!user) return;

    // Call verify-payment IMMEDIATELY — this checks Stripe directly and
    // upgrades the user's DB profile without waiting for webhooks
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const result = await res.json();
      if (result.status === 'premium' || result.status === 'lifetime') {
        setSubscriptionStatus(result.status);
        return;
      }
    } catch {
      // fall through to polling
    }

    // Fallback: poll Supabase in case verify-payment didn't find it yet
    // (e.g. Stripe subscription still activating)
    const pollSubscription = async (attempts = 0) => {
      if (!user || attempts >= 10) return;

      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single();

        if (data && (data.subscription_status === 'premium' || data.subscription_status === 'lifetime')) {
          setSubscriptionStatus(data.subscription_status);
          return;
        }
      } catch {
        // ignore
      }

      setTimeout(() => pollSubscription(attempts + 1), 2000);
    };

    pollSubscription();
  };

  const handleClose = () => {
    setShowPremiumModal(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) handleClose();
      }}
    >
      <div className="relative max-w-lg w-full overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#10b981]/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative card card-glow w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* ─── Success View ─── */}
          {paymentSuccess ? (
            <SuccessView onClose={handleClose} />

          /* ─── Payment Step ─── */
          ) : step === 'pay' && clientSecret ? (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={handleBack}
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-500">Plan</span>
                  <svg className="w-3 h-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-white font-medium">Payment</span>
                </div>
              </div>

              <div className="text-center mb-5">
                <h2 className="text-xl font-bold text-white mb-1">Complete Payment</h2>
                <p className="text-sm text-neutral-500">Secure checkout powered by Stripe</p>
              </div>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#10b981',
                      colorBackground: '#0a0a0a',
                      colorText: '#ffffff',
                      colorTextSecondary: '#a3a3a3',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      borderRadius: '12px',
                      spacingUnit: '4px',
                    },
                    rules: {
                      '.Tab': {
                        border: '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: '#111111',
                      },
                      '.Tab--selected': {
                        border: '1px solid rgba(16,185,129,0.5)',
                        backgroundColor: 'rgba(16,185,129,0.1)',
                      },
                      '.Input': {
                        border: '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: '#111111',
                      },
                      '.Input:focus': {
                        border: '1px solid rgba(16,185,129,0.5)',
                        boxShadow: '0 0 0 3px rgba(16,185,129,0.1)',
                      },
                    },
                  },
                }}
              >
                <CheckoutForm
                  plan={selectedPlan}
                  onBack={handleBack}
                  onSuccess={handleSuccess}
                  clientSecret={clientSecret}
                />
              </Elements>
            </>

          /* ─── Plan Selection Step ─── */
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#10b981]/10 flex items-center justify-center mx-auto mb-4 relative">
                  <svg className="w-7 h-7 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                  <div className="absolute inset-0 rounded-2xl bg-[#10b981]/5 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Upgrade to Premium</h2>
                <p className="text-sm text-neutral-500">Unlock the full power of TrueWage</p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Not logged in warning */}
              {!user && (
                <div className="mb-5 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm text-center flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Please sign in to upgrade to Premium
                </div>
              )}

              {/* Plan Cards */}
              <div className="space-y-3 mb-6">
                {(Object.entries(plans) as [PlanType, typeof plans[PlanType]][]).map(([key, plan]) => (
                  <PlanCard
                    key={key}
                    planKey={key}
                    plan={plan}
                    isSelected={selectedPlan === key}
                    isLoading={isLoading}
                    disabled={!user}
                    onSelect={() => setSelectedPlan(key)}
                  />
                ))}
              </div>

              {/* Continue Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={isLoading || !user}
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#10b981] text-black hover:bg-[#10b981]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mb-5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Setting up payment...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Continue to Payment
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>

              {/* Features List */}
              <div className="rounded-xl bg-[#111]/60 border border-white/5 p-5">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Everything you get</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {premiumFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <svg className="w-3.5 h-3.5 text-[#10b981] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-400">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment methods accepted */}
              <div className="mt-5 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 text-neutral-600">
                  {/* Visa */}
                  <svg fill="currentColor" height={20} width={20} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M22.222 15.768l-.225-1.125h-2.514l-.4 1.117-2.015.004a4199.19 4199.19 0 0 1 2.884-6.918c.164-.391.455-.59.884-.588.328.003.863.003 1.606.001L24 15.765l-1.778.003zm-2.173-2.666h1.62l-.605-2.82-1.015 2.82zM7.06 8.257l2.026.002-3.132 7.51-2.051-.002a950.849 950.849 0 0 1-1.528-5.956c-.1-.396-.298-.673-.679-.804C1.357 8.89.792 8.71 0 8.465V8.26h3.237c.56 0 .887.271.992.827.106.557.372 1.975.8 4.254L7.06 8.257zm4.81.002l-1.602 7.508-1.928-.002L9.94 8.257l1.93.002zm3.91-.139c.577 0 1.304.18 1.722.345l-.338 1.557c-.378-.152-1-.357-1.523-.35-.76.013-1.23.332-1.23.638 0 .498.816.749 1.656 1.293.959.62 1.085 1.177 1.073 1.782-.013 1.256-1.073 2.495-3.309 2.495-1.02-.015-1.388-.101-2.22-.396l.352-1.625c.847.355 1.206.468 1.93.468.663 0 1.232-.268 1.237-.735.004-.332-.2-.497-.944-.907-.744-.411-1.788-.98-1.774-2.122.017-1.462 1.402-2.443 3.369-2.443z" />
                  </svg>
                  {/* Mastercard */}
                  <svg fill="currentColor" height={20} width={20} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.245 17.831h-6.49v-11.66h6.49v11.66zM9.167 12c0-2.362 1.094-4.467 2.833-5.83C10.74 5.17 9.205 4.583 7.5 4.583 3.358 4.583 0 7.91 0 12s3.358 7.417 7.5 7.417c1.705 0 3.24-.587 4.5-1.587A7.35 7.35 0 0 1 9.167 12zM24 12c0 4.09-3.358 7.417-7.5 7.417-1.705 0-3.24-.587-4.5-1.587A7.387 7.387 0 0 0 14.833 12 7.387 7.387 0 0 0 12 6.17c1.26-1 2.795-1.587 4.5-1.587C20.642 4.583 24 7.91 24 12z"/>
                  </svg>
                  {/* Apple Pay */}
                  <svg fill="currentColor" height={18} width={18} viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
                    <path d="M116.9 158.5c-7.5 8.9-19.5 15.9-31.5 14.9-1.5-12 4.4-24.8 11.3-32.6 7.5-9.1 20.6-15.6 31.3-16.1 1.2 12.4-3.7 24.7-11.1 33.8m10.9 17.2c-17.4-1-32.3 9.9-40.5 9.9-8.4 0-21-9.4-34.8-9.1-17.9.3-34.5 10.4-43.6 26.5-18.8 32.3-4.9 80 13.3 106.3 8.9 13 19.5 27.3 33.5 26.8 13.3-.5 18.5-8.6 34.5-8.6 16.1 0 20.8 8.6 34.8 8.4 14.5-.3 23.6-13 32.5-26 10.1-14.8 14.3-29.1 14.5-29.9-.3-.3-28-10.9-28.3-42.9-.3-26.8 21.9-39.5 22.9-40.3-12.5-18.6-32-20.6-38.8-21.1m100.4-36.2v194.9h30.3v-66.6h41.9c38.3 0 65.1-26.3 65.1-64.3s-26.4-64-64.1-64h-73.2zm30.3 25.5h34.9c26.3 0 41.3 14 41.3 38.6s-15 38.8-41.4 38.8h-34.8V165z" />
                  </svg>
                  {/* Google Pay */}
                  <svg fill="currentColor" viewBox="0 0 32 32" height={18} width={18} xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.443 10.667c1.344-0.016 2.646 0.479 3.641 1.391l-1.552 1.521c-0.568-0.526-1.318-0.813-2.089-0.797-1.385 0.005-2.609 0.891-3.057 2.198-0.229 0.661-0.229 1.38 0 2.042 0.448 1.307 1.672 2.193 3.057 2.198 0.734 0 1.365-0.182 1.854-0.505 0.568-0.375 0.964-0.958 1.083-1.625h-2.938v-2.052h5.13c0.063 0.359 0.094 0.719 0.094 1.083 0 1.625-0.594 3-1.62 3.927-0.901 0.813-2.135 1.286-3.604 1.286-2.047 0.010-3.922-1.125-4.865-2.938-0.771-1.505-0.771-3.286 0-4.792 0.943-1.813 2.818-2.948 4.859-2.938z" />
                  </svg>
                </div>
                <p className="text-[10px] text-neutral-600">
                  Secure payment &middot; Cancel anytime for subscriptions
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
