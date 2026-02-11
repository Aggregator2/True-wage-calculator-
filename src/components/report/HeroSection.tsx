'use client';

import CountUpNumber from './CountUpNumber';
import ScrollReveal from './ScrollReveal';
import { LiquidCard, CardContent } from './LiquidCard';

interface HeroSectionProps {
  userName: string;
  reportDate: string;
  trueHourlyWage: number;
  statedHourlyWage: number;
  yearsToFIRE: number;
  hookParagraph: string;
  annualHiddenCosts: number;
}

export default function HeroSection({
  userName,
  reportDate,
  trueHourlyWage,
  statedHourlyWage,
  yearsToFIRE,
  hookParagraph,
  annualHiddenCosts,
}: HeroSectionProps) {
  const wageDelta = statedHourlyWage - trueHourlyWage;

  return (
    <section
      className="relative w-full overflow-hidden font-['Inter',sans-serif]"
      style={{
        background: 'linear-gradient(180deg, #0A1628 0%, #1E293B 100%)',
      }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow accent at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 sm:py-28">
        {/* Header text */}
        <ScrollReveal delay={0}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight text-center leading-tight">
            The Uncomfortable Truth
            <br />
            About Your Finances
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="mt-5 text-center text-white/60 text-base sm:text-lg">
            Prepared for{' '}
            <span className="text-white/90 font-medium">{userName}</span>
            {' | '}
            <span className="text-white/90 font-medium">{reportDate}</span>
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mt-2 text-center text-white/40 text-sm sm:text-base max-w-2xl mx-auto">
            A data-backed analysis that challenges conventional financial wisdom
          </p>
        </ScrollReveal>

        {/* Primary stat cards row */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ScrollReveal delay={300}>
            <LiquidCard className="h-full" glowColor="#10B981">
              <CardContent className="pt-6 text-center">
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50 mb-3">
                  True Hourly Wage
                </p>
                <div className="text-4xl sm:text-5xl font-bold text-white">
                  <CountUpNumber
                    end={trueHourlyWage}
                    prefix="£"
                    decimals={2}
                    duration={1800}
                  />
                </div>
              </CardContent>
            </LiquidCard>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <LiquidCard className="h-full">
              <CardContent className="pt-6 text-center">
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50 mb-3">
                  Stated Hourly Wage
                </p>
                <div className="text-4xl sm:text-5xl font-bold text-white">
                  <CountUpNumber
                    end={statedHourlyWage}
                    prefix="£"
                    decimals={2}
                    duration={1800}
                  />
                </div>
              </CardContent>
            </LiquidCard>
          </ScrollReveal>
        </div>

        {/* Delta callout */}
        <ScrollReveal delay={500}>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-white/10" />
            <p className="text-sm font-semibold" style={{ color: '#DC2626' }}>
              You&apos;re losing{' '}
              <CountUpNumber
                end={wageDelta}
                prefix="£"
                decimals={2}
                duration={2000}
                className="font-bold"
              />
              /hr more than you think
            </p>
            <div className="h-px w-8 bg-white/10" />
          </div>
        </ScrollReveal>

        {/* Secondary stat cards row */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ScrollReveal delay={600}>
            <LiquidCard className="h-full" glowColor="#DC2626">
              <CardContent className="pt-6 text-center">
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50 mb-3">
                  Annual Hidden Costs
                </p>
                <div
                  className="text-4xl sm:text-5xl font-bold"
                  style={{ color: '#DC2626' }}
                >
                  <CountUpNumber
                    end={annualHiddenCosts}
                    prefix="£"
                    decimals={0}
                    duration={2000}
                  />
                </div>
              </CardContent>
            </LiquidCard>
          </ScrollReveal>

          <ScrollReveal delay={700}>
            <LiquidCard className="h-full" glowColor="#10B981">
              <CardContent className="pt-6 text-center">
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50 mb-3">
                  Years to Financial Independence
                </p>
                <div className="text-4xl sm:text-5xl font-bold text-white">
                  <CountUpNumber
                    end={yearsToFIRE}
                    decimals={1}
                    duration={2200}
                  />
                </div>
              </CardContent>
            </LiquidCard>
          </ScrollReveal>
        </div>

        {/* AI hook paragraph pull quote */}
        <ScrollReveal delay={850}>
          <blockquote className="mt-14 max-w-3xl mx-auto pl-5 border-l-[3px] border-[#10B981]">
            <p className="text-base sm:text-lg italic text-white/70 leading-relaxed">
              {hookParagraph}
            </p>
          </blockquote>
        </ScrollReveal>

        {/* Disclaimer */}
        <ScrollReveal delay={950}>
          <p className="mt-14 text-center text-[11px] sm:text-xs text-white/30 tracking-wide">
            Educational analysis only. Not financial advice. Consult a qualified
            advisor.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
