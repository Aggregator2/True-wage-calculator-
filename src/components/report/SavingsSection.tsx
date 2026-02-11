'use client';

import { useEffect, useRef, useState } from 'react';
import { PiggyBank, AlertTriangle, Clock, Target, Info } from 'lucide-react';
import CountUpNumber from './CountUpNumber';
import ScrollReveal from './ScrollReveal';
import { LiquidCard, CardContent } from './LiquidCard';

interface SavingsSectionProps {
  savingsRatePercent: number;
  ukAverageSavingsRate: number;
  monthlySavings: number;
  annualSavings: number;
  hiddenCosts: number;
  freeLabourHours: number;
  fireTargetYears: number;
  aiCommentary: string;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getSavingsColor(rate: number, average: number): string {
  if (rate >= average * 1.2) return '#10B981';
  if (rate >= average * 0.8) return '#F59E0B';
  return '#DC2626';
}

function getSavingsLabel(rate: number, average: number): string {
  if (rate >= average * 1.2) return 'Above Average';
  if (rate >= average * 0.8) return 'Near Average';
  return 'Below Average';
}

function AnimatedBar({
  widthPercent,
  color,
  label,
  value,
  delay = 0,
}: {
  widthPercent: number;
  color: string;
  label: string;
  value: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (barRef.current) observer.observe(barRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={barRef} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/70">{label}</span>
        <span className="text-sm font-bold text-white/90">{value}</span>
      </div>
      <div className="relative h-10 rounded-lg bg-white/[0.04] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-3"
          style={{
            width: isVisible ? `${Math.max(widthPercent, 4)}%` : '0%',
            backgroundColor: color,
            transition: `width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms`,
          }}
        >
          {widthPercent > 12 && (
            <span className="text-xs font-bold text-white drop-shadow-sm">
              {value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SavingsSection({
  savingsRatePercent,
  ukAverageSavingsRate,
  monthlySavings,
  annualSavings,
  hiddenCosts,
  freeLabourHours,
  fireTargetYears,
  aiCommentary,
}: SavingsSectionProps) {
  const savingsColor = getSavingsColor(savingsRatePercent, ukAverageSavingsRate);
  const savingsLabel = getSavingsLabel(savingsRatePercent, ukAverageSavingsRate);
  const isAboveAverage = savingsRatePercent >= ukAverageSavingsRate;

  // Scale bars so the larger value is 100%
  const maxRate = Math.max(savingsRatePercent, ukAverageSavingsRate, 1);
  const userBarWidth = (savingsRatePercent / maxRate) * 100;
  const avgBarWidth = (ukAverageSavingsRate / maxRate) * 100;

  // Calculate UK average equivalent monetary values
  const ukAvgMonthly =
    ukAverageSavingsRate > 0 && savingsRatePercent > 0
      ? (monthlySavings / savingsRatePercent) * ukAverageSavingsRate
      : 0;
  const ukAvgAnnual =
    ukAverageSavingsRate > 0 && savingsRatePercent > 0
      ? (annualSavings / savingsRatePercent) * ukAverageSavingsRate
      : 0;

  return (
    <section
      className="relative w-full overflow-hidden font-['Inter',sans-serif]"
      style={{
        background: 'linear-gradient(180deg, #1E293B 0%, #0A1628 50%, #1E293B 100%)',
      }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${savingsColor}08 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 sm:py-28">
        {/* Section header */}
        <ScrollReveal delay={0}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ backgroundColor: `${savingsColor}15` }}
            >
              <PiggyBank className="w-5 h-5" style={{ color: savingsColor }} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Savings Rate Analysis
            </h2>
          </div>
          <div className="h-px max-w-xs mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${savingsColor}40, transparent)` }} />
        </ScrollReveal>

        {/* Massive hero number */}
        <ScrollReveal delay={100}>
          <div className="mt-14 text-center">
            <div
              className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter"
              style={{ color: savingsColor }}
            >
              <CountUpNumber
                end={savingsRatePercent}
                decimals={1}
                suffix="%"
                duration={2000}
              />
            </div>
            <p className="mt-3 text-sm font-semibold tracking-[0.15em] uppercase text-white/50">
              Your Savings Rate
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: savingsColor }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: savingsColor }}
              >
                {savingsLabel}
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Side-by-side comparison cards */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ScrollReveal delay={200}>
            <LiquidCard
              className="h-full"
              glowColor={isAboveAverage ? '#10B981' : '#DC2626'}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: isAboveAverage
                        ? 'rgba(16,185,129,0.15)'
                        : 'rgba(220,38,38,0.15)',
                      color: isAboveAverage ? '#10B981' : '#DC2626',
                    }}
                  >
                    You
                  </div>
                  <span className="text-sm font-semibold text-white/80">
                    Your Numbers
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-wider">
                      Savings Rate
                    </span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: savingsColor }}
                    >
                      <CountUpNumber
                        end={savingsRatePercent}
                        decimals={1}
                        suffix="%"
                        duration={1600}
                      />
                    </span>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-wider">
                      Monthly
                    </span>
                    <span className="text-lg font-semibold text-white/90">
                      <CountUpNumber
                        end={monthlySavings}
                        prefix="£"
                        decimals={0}
                        duration={1600}
                      />
                    </span>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-wider">
                      Annual
                    </span>
                    <span className="text-lg font-semibold text-white/90">
                      <CountUpNumber
                        end={annualSavings}
                        prefix="£"
                        decimals={0}
                        duration={1600}
                      />
                    </span>
                  </div>
                </div>
              </CardContent>
            </LiquidCard>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <LiquidCard className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-white/[0.08] text-white/60">
                    UK
                  </div>
                  <span className="text-sm font-semibold text-white/80">
                    UK Average
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-wider">
                      Savings Rate
                    </span>
                    <span className="text-2xl font-bold text-white/60">
                      <CountUpNumber
                        end={ukAverageSavingsRate}
                        decimals={1}
                        suffix="%"
                        duration={1600}
                      />
                    </span>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-wider">
                      Monthly
                    </span>
                    <span className="text-lg font-semibold text-white/50">
                      £{formatCurrency(Math.round(ukAvgMonthly))}
                    </span>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-wider">
                      Annual
                    </span>
                    <span className="text-lg font-semibold text-white/50">
                      £{formatCurrency(Math.round(ukAvgAnnual))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </LiquidCard>
          </ScrollReveal>
        </div>

        {/* Dramatic horizontal bar chart */}
        <ScrollReveal delay={400}>
          <LiquidCard className="mt-10">
            <CardContent className="pt-6">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50 mb-6">
                Savings Rate Comparison
              </p>
              <div className="space-y-5">
                <AnimatedBar
                  widthPercent={userBarWidth}
                  color={savingsColor}
                  label="You"
                  value={`${savingsRatePercent.toFixed(1)}%`}
                  delay={0}
                />
                <AnimatedBar
                  widthPercent={avgBarWidth}
                  color="#64748B"
                  label="UK Average"
                  value={`${ukAverageSavingsRate.toFixed(1)}%`}
                  delay={200}
                />
              </div>
              {/* Difference callout */}
              <div className="mt-5 flex items-center justify-center gap-2">
                <div className="h-px w-8 bg-white/10" />
                <p className="text-sm font-medium text-white/60">
                  {isAboveAverage ? (
                    <>
                      <span style={{ color: '#10B981' }} className="font-bold">
                        +{(savingsRatePercent - ukAverageSavingsRate).toFixed(1)}%
                      </span>{' '}
                      above the national average
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#DC2626' }} className="font-bold">
                        {(savingsRatePercent - ukAverageSavingsRate).toFixed(1)}%
                      </span>{' '}
                      below the national average
                    </>
                  )}
                </p>
                <div className="h-px w-8 bg-white/10" />
              </div>
            </CardContent>
          </LiquidCard>
        </ScrollReveal>

        {/* Key metrics grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <ScrollReveal delay={500}>
            <LiquidCard className="h-full" hover>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#DC2626]/10">
                    <AlertTriangle className="w-5 h-5" style={{ color: '#DC2626' }} />
                  </div>
                </div>
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50 mb-2">
                  Hidden Costs
                </p>
                <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#DC2626' }}>
                  <CountUpNumber
                    end={hiddenCosts}
                    prefix="£"
                    decimals={0}
                    duration={1800}
                  />
                  <span className="text-sm font-medium text-white/40 ml-1">/yr</span>
                </div>
              </CardContent>
            </LiquidCard>
          </ScrollReveal>

          <ScrollReveal delay={600}>
            <LiquidCard className="h-full" hover>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F59E0B]/10">
                    <Clock className="w-5 h-5" style={{ color: '#F59E0B' }} />
                  </div>
                </div>
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50 mb-2">
                  Free Labour
                </p>
                <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#F59E0B' }}>
                  <CountUpNumber
                    end={freeLabourHours}
                    decimals={0}
                    duration={1800}
                  />
                  <span className="text-sm font-medium text-white/40 ml-1">hrs/yr</span>
                </div>
              </CardContent>
            </LiquidCard>
          </ScrollReveal>

          <ScrollReveal delay={700}>
            <LiquidCard className="h-full" hover>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#3B82F6]/10">
                    <Target className="w-5 h-5" style={{ color: '#3B82F6' }} />
                  </div>
                </div>
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50 mb-2">
                  FIRE Target
                </p>
                <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#3B82F6' }}>
                  <CountUpNumber
                    end={fireTargetYears}
                    decimals={1}
                    duration={1800}
                  />
                  <span className="text-sm font-medium text-white/40 ml-1">years</span>
                </div>
              </CardContent>
            </LiquidCard>
          </ScrollReveal>
        </div>

        {/* AI Commentary */}
        <ScrollReveal delay={850}>
          <div
            className="mt-14 rounded-2xl p-6 sm:p-8"
            style={{
              backgroundColor: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.15)',
            }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[#3B82F6]/15 mt-0.5">
                <Info className="w-4.5 h-4.5" style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#3B82F6]/70 mb-2">
                  AI Analysis
                </p>
                <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                  {aiCommentary}
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
