'use client';

import { useEffect, useRef, useState } from 'react';
import { DollarSign, ArrowRight, Info } from 'lucide-react';
import CountUpNumber from './CountUpNumber';
import ScrollReveal from './ScrollReveal';
import { LiquidCard, CardContent, CardHeader } from './LiquidCard';

interface IncomeData {
  grossSalary: number;
  incomeTax: number;
  nationalInsurance: number;
  pensionContribution: number;
  studentLoanRepayment: number;
  takeHomePay: number;
  effectiveTaxRate: number;
  trueHourlyWage: number;
  statedHourlyWage: number;
  unpaidOvertimeHours: number;
  annualFreeLabourHours: number;
  aiCommentary: string;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function AnimatedDonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  centerValue: string;
}) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const chartRef = useRef<SVGSVGElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const duration = 1200;

          function animate(currentTime: number) {
            const elapsed = currentTime - startTime;
            const t = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - t, 3);
            setAnimationProgress(eased);
            if (t < 1) {
              requestAnimationFrame(animate);
            }
          }

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (chartRef.current) observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  if (total === 0) return null;

  const radius = 70;
  const strokeWidth = 30;
  const circumference = 2 * Math.PI * radius;
  const cx = 100;
  const cy = 100;

  // Build segment data with cumulative offsets
  let cumulativeOffset = 0;
  const segmentData = segments.map((seg) => {
    const proportion = seg.value / total;
    const segLength = proportion * circumference;
    const offset = cumulativeOffset;
    cumulativeOffset += segLength;
    return { ...seg, proportion, segLength, offset };
  });

  return (
    <svg
      ref={chartRef}
      viewBox="0 0 200 200"
      className="w-full max-w-[280px] mx-auto"
      aria-label="Income breakdown donut chart"
    >
      {/* Background track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={strokeWidth}
      />

      {/* Segments */}
      {segmentData.map((seg, i) => {
        const animatedLength = seg.segLength * animationProgress;
        // Small gap between segments for visual separation
        const gap = 2;
        const displayLength = Math.max(animatedLength - gap, 0);

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${displayLength} ${circumference - displayLength}`}
            strokeDashoffset={-seg.offset * animationProgress}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{
              transition: 'opacity 0.3s ease',
              opacity: animationProgress > 0 ? 1 : 0,
            }}
          />
        );
      })}

      {/* Center text */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        className="fill-white/50 text-[10px]"
        style={{ fontSize: '10px' }}
      >
        {centerLabel}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className="fill-white font-bold"
        style={{ fontSize: '20px', fontWeight: 700 }}
      >
        {centerValue}
      </text>
    </svg>
  );
}

export default function IncomeSection({
  grossSalary,
  incomeTax,
  nationalInsurance,
  pensionContribution,
  studentLoanRepayment,
  takeHomePay,
  effectiveTaxRate,
  trueHourlyWage,
  statedHourlyWage,
  unpaidOvertimeHours,
  annualFreeLabourHours,
  aiCommentary,
}: IncomeData) {
  const wageDelta = statedHourlyWage - trueHourlyWage;

  const donutSegments: DonutSegment[] = [
    { label: 'Income Tax', value: incomeTax, color: '#DC2626' },
    { label: 'National Insurance', value: nationalInsurance, color: '#F59E0B' },
    { label: 'Pension', value: pensionContribution, color: '#3B82F6' },
    { label: 'Take-Home Pay', value: takeHomePay, color: '#10B981' },
  ];

  // Include student loan as a segment if present
  if (studentLoanRepayment > 0) {
    donutSegments.splice(3, 0, {
      label: 'Student Loan',
      value: studentLoanRepayment,
      color: '#8B5CF6',
    });
  }

  const commentaryParagraphs = aiCommentary
    .split('\n')
    .filter((p) => p.trim().length > 0);

  return (
    <section className="space-y-8">
      {/* Section Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20">
            <DollarSign className="w-5 h-5 text-[#10B981]" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Income Reality Check
          </h2>
        </div>
        <p className="text-white/50 text-sm ml-[52px]">
          Where your{' '}
          <span className="text-white/70 font-medium">
            {formatCurrency(grossSalary)}
          </span>{' '}
          gross salary actually goes
        </p>
      </ScrollReveal>

      {/* Donut Chart + Legend Card */}
      <ScrollReveal delay={100}>
        <LiquidCard glowColor="#10B981">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Donut Chart */}
              <div className="flex justify-center">
                <AnimatedDonutChart
                  segments={donutSegments}
                  centerLabel="Take-Home"
                  centerValue={formatCurrency(takeHomePay)}
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-1 gap-3">
                {donutSegments.map((seg, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="text-sm text-white/70">{seg.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-white tabular-nums">
                      {formatCurrency(seg.value)}
                    </span>
                  </div>
                ))}

                {/* Total row */}
                <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-white/[0.08]">
                  <span className="text-sm font-medium text-white/50">
                    Gross Salary
                  </span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {formatCurrency(grossSalary)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </LiquidCard>
      </ScrollReveal>

      {/* Wage Comparison Visual */}
      <ScrollReveal delay={200}>
        <LiquidCard glowColor="#DC2626">
          <CardHeader>
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">
              Your Real Hourly Rate
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
              {/* Stated Wage */}
              <div className="text-center">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  Stated Wage
                </p>
                <p className="text-4xl font-bold text-white tabular-nums">
                  <CountUpNumber
                    end={statedHourlyWage}
                    prefix="\u00A3"
                    decimals={2}
                    className="text-4xl font-bold text-white"
                  />
                </p>
                <p className="text-xs text-white/30 mt-1">per hour</p>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="w-6 h-6 text-white/20" />
                <span className="text-xs text-[#DC2626] font-semibold tabular-nums">
                  -<CountUpNumber
                    end={wageDelta}
                    prefix="\u00A3"
                    decimals={2}
                    className="text-xs text-[#DC2626] font-semibold"
                  />
                </span>
              </div>

              {/* True Wage */}
              <div className="text-center">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  True Wage
                </p>
                <p className="text-4xl font-bold text-[#DC2626] tabular-nums">
                  <CountUpNumber
                    end={trueHourlyWage}
                    prefix="\u00A3"
                    decimals={2}
                    className="text-4xl font-bold text-[#DC2626]"
                  />
                </p>
                <p className="text-xs text-white/30 mt-1">per hour</p>
              </div>
            </div>

            {/* Delta callout */}
            {wageDelta > 0 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-white/40">
                  You effectively lose{' '}
                  <span className="text-[#DC2626] font-semibold">
                    {formatCurrency(wageDelta)}
                  </span>{' '}
                  per hour working for free
                </p>
              </div>
            )}
          </CardContent>
        </LiquidCard>
      </ScrollReveal>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ScrollReveal delay={300}>
          <LiquidCard hover className="h-full">
            <CardContent className="pt-5 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                Effective Tax Rate
              </p>
              <p className="text-3xl font-bold text-white tabular-nums">
                <CountUpNumber
                  end={effectiveTaxRate}
                  suffix="%"
                  decimals={1}
                  className="text-3xl font-bold text-white"
                />
              </p>
              <p className="text-xs text-white/30 mt-1">
                of gross income
              </p>
            </CardContent>
          </LiquidCard>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <LiquidCard hover className="h-full">
            <CardContent className="pt-5 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                Unpaid Overtime
              </p>
              <p className="text-3xl font-bold text-[#F59E0B] tabular-nums">
                <CountUpNumber
                  end={unpaidOvertimeHours}
                  decimals={1}
                  className="text-3xl font-bold text-[#F59E0B]"
                />
              </p>
              <p className="text-xs text-white/30 mt-1">
                hours / week
              </p>
            </CardContent>
          </LiquidCard>
        </ScrollReveal>

        <ScrollReveal delay={500}>
          <LiquidCard hover className="h-full">
            <CardContent className="pt-5 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                Annual Free Labour
              </p>
              <p className="text-3xl font-bold text-[#DC2626] tabular-nums">
                <CountUpNumber
                  end={annualFreeLabourHours}
                  suffix=" hrs"
                  decimals={0}
                  className="text-3xl font-bold text-[#DC2626]"
                />
              </p>
              <p className="text-xs text-white/30 mt-1">
                unpaid per year
              </p>
            </CardContent>
          </LiquidCard>
        </ScrollReveal>
      </div>

      {/* AI Commentary Callout */}
      {aiCommentary && (
        <ScrollReveal delay={600}>
          <div
            className="relative overflow-hidden rounded-2xl border border-[#3B82F6]/20"
            style={{
              background:
                'linear-gradient(135deg, rgba(59,130,246,0.10) 0%, rgba(59,130,246,0.04) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            {/* Subtle glow */}
            <div
              className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
              }}
            />

            <div className="relative z-10 p-6">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/20 shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-[#3B82F6]" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#3B82F6] uppercase tracking-wider">
                    AI Insight
                  </h4>
                  {commentaryParagraphs.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-sm leading-relaxed text-white/70"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}
    </section>
  );
}
