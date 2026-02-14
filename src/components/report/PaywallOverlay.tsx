'use client';

import { Lock, Sparkles, Check } from 'lucide-react';
import { LiquidButton } from './LiquidCard';
import { useCalculatorStore } from '@/lib/store';

interface PaywallOverlayProps {
  sectionTitle: string;
  /** When true, renders as a standalone card instead of an absolute overlay */
  standalone?: boolean;
}

const PREMIUM_BENEFITS = [
  'Full AI-powered financial analysis',
  'Personalised controversial recommendations',
  'Interactive FIRE projections & scenarios',
  'Detailed risk assessment & action plans',
  'Unlimited report generations',
  'PDF export with all sections',
];

export default function PaywallOverlay({ sectionTitle, standalone = false }: PaywallOverlayProps) {
  const { setShowPremiumModal } = useCalculatorStore();

  const content = (
    <div className={standalone ? 'relative max-w-md mx-auto px-6 py-10 text-center' : 'relative z-10 max-w-md mx-auto px-6 text-center'}>
      {/* Lock icon with glow */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="absolute w-20 h-20 rounded-full bg-[#10B981]/20 animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981]/30 to-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center backdrop-blur-sm">
          <Lock className="w-7 h-7 text-[#10B981]" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2">
        Unlock {sectionTitle}
      </h3>
      <p className="text-sm text-[#94A3B8] mb-6">
        This section contains personalised insights generated specifically for your financial data.
      </p>

      {/* Benefits list */}
      <div className="text-left space-y-2.5 mb-8">
        {PREMIUM_BENEFITS.map((benefit, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center">
              <Check className="w-3 h-3 text-[#10B981]" />
            </div>
            <span className="text-sm text-[#E2E8F0]">{benefit}</span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <LiquidButton
        variant="primary"
        onClick={() => setShowPremiumModal(true)}
        className="w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Upgrade to Premium
      </LiquidButton>

      <p className="text-xs text-[#64748B] mt-3">
        Starting from just £7/month
      </p>
    </div>
  );

  // Standalone mode: renders as a bordered card, no absolute positioning
  if (standalone) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0A1628]/50 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  // Overlay mode: absolute positioned over blurred content
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center">
      {/* Frosted glass backdrop */}
      <div className="absolute inset-0 backdrop-blur-md bg-[#0A1628]/70" />
      {content}
    </div>
  );
}
