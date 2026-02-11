'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useCalculatorStore } from '@/lib/store';
import AnimatedEntry from '@/components/ui/AnimatedEntry';
import Link from 'next/link';

const tiers = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Everything you need to get started',
    cta: 'Start Free',
    ctaStyle: 'btn-secondary',
    href: '/calculator',
    features: [
      { text: 'Full calculator (all 13 factors)', included: true },
      { text: 'Shareable results URLs', included: true },
      { text: '3 saved scenarios', included: true },
      { text: 'Basic FIRE projection', included: true },
      { text: '1 AI report preview', included: true },
      { text: 'Unlimited scenarios', included: false },
      { text: 'Full AI reports & PDF export', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Premium',
    monthlyPrice: 7,
    annualPrice: 60,
    description: 'For serious financial planning',
    cta: 'Upgrade to Premium',
    ctaStyle: 'btn-primary',
    popular: true,
    features: [
      { text: 'Full calculator (all 13 factors)', included: true },
      { text: 'Shareable results URLs', included: true },
      { text: 'Unlimited saved scenarios', included: true },
      { text: 'Advanced FIRE projections', included: true },
      { text: 'Full AI reports & insights', included: true },
      { text: 'PDF export', included: true },
      { text: 'Scenario comparison', included: true },
      { text: 'Priority support', included: true },
    ],
  },
  {
    name: 'Lifetime',
    monthlyPrice: null,
    annualPrice: null,
    lifetimePrice: 500,
    description: 'One payment, forever access',
    cta: 'Get Lifetime Access',
    ctaStyle: 'btn-secondary',
    features: [
      { text: 'Everything in Premium', included: true },
      { text: 'Never pay again', included: true },
      { text: 'All future features included', included: true },
      { text: 'Early access to new tools', included: true },
      { text: 'Priority support', included: true },
    ],
  },
];

const faqs = [
  {
    q: 'Can I try before I pay?',
    a: 'The free tier gives you full access to the calculator with all 13 factors. No credit card required.',
  },
  {
    q: 'How do I cancel?',
    a: 'Cancel anytime from your account settings. No questions asked, no cancellation fees.',
  },
  {
    q: 'Are the tax rates accurate?',
    a: 'We use the official 2025/26 HMRC rates for Income Tax, National Insurance, and Student Loans, including Scotland-specific bands.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major cards, Apple Pay, and Google Pay via Stripe.',
  },
  {
    q: 'Is my data secure?',
    a: 'Your data is stored securely on Supabase with encryption at rest. We never share your financial information.',
  },
];

export default function PricingSection() {
  const [annual, setAnnual] = useState(true);
  const { setShowPremiumModal, user } = useCalculatorStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedEntry>
          <div className="text-center mb-10">
            <p className="text-emerald-400 text-sm font-medium mb-3">Pricing</p>
            <h2 className="heading-lg text-3xl md:text-4xl text-white mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
              Start free. Upgrade when you need more.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 rounded-full p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !annual ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  annual ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Annual
                <span className="ml-1.5 text-emerald-400 text-xs">Save 29%</span>
              </button>
            </div>
          </div>
        </AnimatedEntry>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {tiers.map((tier, i) => (
            <AnimatedEntry key={tier.name} delay={i * 60}>
              <div className={`card p-6 h-full flex flex-col relative ${
                tier.popular ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : ''
              }`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 rounded-full text-[10px] font-bold text-black uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="font-semibold text-white text-lg mb-1">{tier.name}</h3>
                  <p className="text-xs text-zinc-500">{tier.description}</p>
                </div>

                <div className="mb-6">
                  {tier.lifetimePrice ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">£{tier.lifetimePrice}</span>
                      <span className="text-zinc-500 text-sm">one-time</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        £{annual ? Math.round((tier.annualPrice || 0) / 12) || 0 : tier.monthlyPrice}
                      </span>
                      <span className="text-zinc-500 text-sm">/month</span>
                    </div>
                  )}
                  {annual && tier.annualPrice ? (
                    <p className="text-xs text-zinc-500 mt-1">£{tier.annualPrice} billed annually</p>
                  ) : null}
                </div>

                <div className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((f, fi) => (
                    <div key={fi} className="flex items-start gap-2.5 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={f.included ? 'text-zinc-300' : 'text-zinc-600'}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>

                {tier.name === 'Free' ? (
                  <Link href={tier.href || '/calculator'} className={`${tier.ctaStyle} py-3 text-sm font-semibold text-center block`}>
                    {tier.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      if (!user) {
                        useCalculatorStore.getState().setShowAuthModal(true, 'sign_up');
                      } else {
                        setShowPremiumModal(true);
                      }
                    }}
                    className={`${tier.ctaStyle} py-3 text-sm font-semibold w-full`}
                  >
                    {tier.cta}
                  </button>
                )}
              </div>
            </AnimatedEntry>
          ))}
        </div>

        {/* FAQ */}
        <AnimatedEntry>
          <div className="max-w-2xl mx-auto">
            <h3 className="heading-lg text-xl text-white text-center mb-8">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-sm font-medium text-white">{faq.q}</span>
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className="overflow-hidden transition-all"
                    style={{
                      maxHeight: openFaq === i ? '200px' : '0',
                      opacity: openFaq === i ? 1 : 0,
                      transition: 'max-height 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <p className="px-4 pb-4 text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedEntry>
      </div>
    </section>
  );
}
