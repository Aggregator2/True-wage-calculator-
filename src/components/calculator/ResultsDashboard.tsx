'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useCalculatorStore } from '@/lib/store';
import { calculate, formatCurrency, encodeInputsToUrl } from '@/lib/calculator';
import CountUpNumber from '@/components/ui/CountUpNumber';
import AnimatedEntry from '@/components/ui/AnimatedEntry';

interface ResultsDashboardProps {
  onReset: () => void;
}

export default function ResultsDashboard({ onReset }: ResultsDashboardProps) {
  const { inputs, user, setShowAuthModal, setShowPremiumModal } = useCalculatorStore();

  const results = useMemo(() => calculate(inputs), [inputs]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const encoded = encodeInputsToUrl(inputs);
    return `${window.location.origin}/calculator?s=${encoded}`;
  }, [inputs]);

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // fallback
    }
  };

  const gap = results.assumedHourlyRate - results.trueHourlyRate;
  const gapPercent = Math.abs(results.percentOfAssumed - 100);

  return (
    <div className="space-y-8">
      {/* Hero metric */}
      <AnimatedEntry>
        <div className="text-center">
          <p className="text-sm text-zinc-500 mb-2">Your True Hourly Rate</p>
          <p className="text-6xl md:text-7xl font-bold text-emerald-400 font-[var(--font-heading)] tracking-tight">
            <CountUpNumber value={results.trueHourlyRate} prefix="£" decimals={2} duration={1400} />
          </p>
          <p className="text-sm text-zinc-400 mt-3">
            vs apparent rate of <span className="text-zinc-300 font-medium">{formatCurrency(results.assumedHourlyRate)}</span>
          </p>
        </div>
      </AnimatedEntry>

      {/* Comparison bar */}
      <AnimatedEntry delay={80}>
        <div className="card p-5 border-zinc-800">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-zinc-400">Apparent Rate</span>
            <span className="text-zinc-400">True Rate</span>
          </div>
          <div className="relative h-8 bg-zinc-800/50 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/30 to-emerald-500 rounded-full"
              style={{
                width: `${Math.min(results.percentOfAssumed, 100)}%`,
                transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">
                {results.percentOfAssumed.toFixed(0)}% of what you thought
              </span>
            </div>
          </div>
        </div>
      </AnimatedEntry>

      {/* Key insight */}
      <AnimatedEntry delay={160}>
        <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-xl p-4 text-center">
          <p className="text-sm text-zinc-300">
            You&apos;re actually earning <span className="text-emerald-400 font-semibold">{formatCurrency(results.trueHourlyRate)}/hr</span> after all costs &mdash;
            that&apos;s <span className="text-amber-400 font-semibold">{gapPercent.toFixed(0)}% less</span> than your apparent {formatCurrency(results.assumedHourlyRate)}/hr rate.
            That&apos;s <span className="font-semibold text-white">{formatCurrency(gap)}</span> per hour you&apos;re losing to tax, commute, and hidden costs.
          </p>
        </div>
      </AnimatedEntry>

      {/* Breakdown grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        <AnimatedEntry delay={200}>
          <div className="card p-5 border-zinc-800">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Tax Breakdown
            </h3>
            <div className="space-y-2.5">
              <Row label="Gross Salary" value={formatCurrency(results.taxBreakdown.grossSalary)} />
              <Row label="Income Tax" value={`-${formatCurrency(results.taxBreakdown.incomeTax)}`} />
              <Row label="National Insurance" value={`-${formatCurrency(results.taxBreakdown.nationalInsurance)}`} />
              <Row label="Pension" value={`-${formatCurrency(results.taxBreakdown.pensionContribution)}`} />
              {results.taxBreakdown.studentLoan > 0 && (
                <Row label="Student Loan" value={`-${formatCurrency(results.taxBreakdown.studentLoan)}`} />
              )}
              <div className="pt-2.5 border-t border-white/5">
                <Row label="Net Take-Home" value={formatCurrency(results.taxBreakdown.netSalary)} bold />
              </div>
              <div className="pt-2 space-y-1.5">
                <Row label="Effective Tax Rate" value={`${results.taxBreakdown.effectiveTaxRate.toFixed(1)}%`} muted />
                <Row label="Marginal Rate" value={`${results.taxBreakdown.effectiveMarginalRate.toFixed(1)}%`} muted />
              </div>
            </div>
          </div>
        </AnimatedEntry>

        <AnimatedEntry delay={260}>
          <div className="card p-5 border-zinc-800">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Time Breakdown
            </h3>
            <div className="space-y-2.5">
              <Row label="Contract Hours" value={`${results.timeBreakdown.weeklyContractHours}h/wk`} />
              <Row label="Commute" value={`+${(results.timeBreakdown.weeklyCommuteHours).toFixed(1)}h/wk`} />
              <Row label="Unpaid Breaks" value={`+${(results.timeBreakdown.weeklyBreakHours).toFixed(1)}h/wk`} />
              <Row label="Prep Time" value={`+${(results.timeBreakdown.weeklyPrepHours).toFixed(1)}h/wk`} />
              <div className="pt-2.5 border-t border-white/5">
                <Row label="True Weekly Hours" value={`${results.timeBreakdown.weeklyTotalHours.toFixed(1)}h/wk`} bold highlight />
              </div>
              <div className="pt-2 space-y-1.5">
                <Row label="Working Weeks/Year" value={results.timeBreakdown.workingWeeks.toFixed(1)} muted />
                <Row label="Annual True Hours" value={`${results.timeBreakdown.annualTotalHours.toFixed(0)}h`} muted />
              </div>
            </div>
          </div>
        </AnimatedEntry>
      </div>

      {/* Cost & Stress cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <AnimatedEntry delay={300}>
          <div className="card p-5 border-zinc-800">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              Work Costs
            </h3>
            <p className="text-2xl font-bold text-white font-[var(--font-heading)]">
              <CountUpNumber value={results.annualWorkCosts} prefix="£" decimals={0} />
              <span className="text-zinc-500 text-sm font-normal ml-1">/year</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Commute + clothing costs reduce your rate by {results.timeBreakdown.annualTotalHours > 0 ? formatCurrency(results.annualWorkCosts / results.timeBreakdown.annualTotalHours) : '£0'}/hr
            </p>
          </div>
        </AnimatedEntry>

        {inputs.stressTax > 0 && (
          <AnimatedEntry delay={340}>
            <div className="card p-5 border-zinc-800">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Stress Adjustment
              </h3>
              <p className="text-2xl font-bold text-white font-[var(--font-heading)]">
                -{inputs.stressTax}%
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Stress costs you {formatCurrency((results.taxBreakdown.netSalary - results.annualWorkCosts) * (inputs.stressTax / 100))}/year in personal value
              </p>
            </div>
          </AnimatedEntry>
        )}
      </div>

      {/* CTA buttons */}
      <AnimatedEntry delay={380}>
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (!user) {
                setShowAuthModal(true, 'sign_up');
              } else {
                // Navigate to dashboard
                window.location.href = '/dashboard';
              }
            }}
            className="btn-secondary py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            Save This Scenario
          </button>
          <button
            onClick={() => {
              if (!user) {
                setShowAuthModal(true, 'sign_up');
              } else {
                setShowPremiumModal(true);
              }
            }}
            className="btn-primary py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Get Your AI Report
          </button>
        </div>
      </AnimatedEntry>

      <AnimatedEntry delay={420}>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleCopyShare}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Share Results
          </button>
          <button
            onClick={onReset}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Start New Scenario
          </button>
        </div>
      </AnimatedEntry>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className={muted ? 'text-zinc-600' : bold ? 'text-white font-medium' : 'text-zinc-400'}>
        {label}
      </span>
      <span className={`font-medium ${highlight ? 'text-emerald-400' : muted ? 'text-zinc-500' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}
