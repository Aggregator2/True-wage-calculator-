'use client';

import { Lightbulb, ArrowRight, Check, ChevronRight } from 'lucide-react';
import CountUpNumber from './CountUpNumber';
import ScrollReveal from './ScrollReveal';
import { LiquidCard, CardContent, CardHeader } from './LiquidCard';

interface Recommendation {
  id: string;
  number: number;
  title: string;
  impactAmount: number;
  fireAcceleration: number;
  beforeValue: string;
  afterValue: string;
  conventionalWisdom: string;
  contrarianCase: string;
  sourceCitation: string;
  isApplied: boolean;
}

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  onToggleRecommendation: (id: string) => void;
}

function RecommendationCard({
  recommendation,
  index,
  onToggle,
}: {
  recommendation: Recommendation;
  index: number;
  onToggle: (id: string) => void;
}) {
  const { isApplied } = recommendation;

  return (
    <ScrollReveal delay={index * 100} direction="up">
      <LiquidCard
        hover
        glowColor={isApplied ? '#10B981' : undefined}
        className="relative transition-all duration-300"
      >
        <CardHeader className="relative">
          {/* Number badge */}
          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: '#0A1628', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {recommendation.number}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white leading-snug font-['Inter',sans-serif]">
                {recommendation.title}
              </h3>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Impact metrics */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mt-2 mb-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold" style={{ color: '#10B981' }}>
                <CountUpNumber
                  end={recommendation.impactAmount}
                  prefix="£"
                  duration={1400}
                  separator=","
                />
              </span>
              <span className="text-sm font-medium text-white/50">/year</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold" style={{ color: '#10B981' }}>
                <CountUpNumber
                  end={recommendation.fireAcceleration}
                  decimals={1}
                  duration={1400}
                />
              </span>
              <span className="text-sm font-medium text-white/50">years closer to FI</span>
            </div>
          </div>

          {/* Before / After comparison grid */}
          <div
            className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-0 rounded-xl overflow-hidden mb-5"
            style={{
              border: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(255,255,255,0.02)',
            }}
          >
            {/* Before column */}
            <div className="px-4 py-4">
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40 mb-2">
                Before
              </p>
              <p className="text-sm font-medium text-white/70 leading-relaxed">
                {recommendation.beforeValue}
              </p>
            </div>

            {/* Arrow divider */}
            <div className="flex items-center justify-center px-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <ArrowRight className="w-4 h-4 text-white/30" />
            </div>

            {/* After column */}
            <div className="px-4 py-4">
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40 mb-2">
                After
              </p>
              <p className="text-sm font-medium text-white leading-relaxed">
                {recommendation.afterValue}
              </p>
            </div>
          </div>

          {/* Conventional wisdom vs contrarian case */}
          <div className="space-y-3 mb-5">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40 mb-1">
                Conventional Wisdom
              </p>
              <p className="text-sm text-white/50 leading-relaxed">
                {recommendation.conventionalWisdom}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40 mb-1">
                The Contrarian Case
              </p>
              <p className="text-sm text-white/70 leading-relaxed">
                {recommendation.contrarianCase}
              </p>
            </div>
          </div>

          {/* Source citation */}
          <p className="text-[11px] text-white/30 mb-5 leading-relaxed">
            {recommendation.sourceCitation}
          </p>

          {/* Interactive toggle button */}
          <button
            onClick={() => onToggle(recommendation.id)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300"
            style={{
              border: isApplied
                ? '1px solid rgba(16,185,129,0.4)'
                : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: isApplied
                ? 'rgba(16,185,129,0.08)'
                : 'rgba(255,255,255,0.02)',
              boxShadow: isApplied
                ? '0 0 20px rgba(16,185,129,0.12), 0 0 40px rgba(16,185,129,0.05)'
                : 'none',
              ...(isApplied
                ? { animation: 'recommendationPulse 2s ease-in-out infinite' }
                : {}),
            }}
          >
            <span
              className="text-sm font-medium transition-colors duration-300"
              style={{ color: isApplied ? '#10B981' : 'rgba(255,255,255,0.6)' }}
            >
              Apply this change
            </span>

            {/* Toggle switch */}
            <div
              className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0"
              style={{
                backgroundColor: isApplied
                  ? 'rgba(16,185,129,0.3)'
                  : 'rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  left: isApplied ? '22px' : '2px',
                  backgroundColor: isApplied ? '#10B981' : 'rgba(255,255,255,0.3)',
                  boxShadow: isApplied
                    ? '0 0 8px rgba(16,185,129,0.5)'
                    : 'none',
                }}
              >
                {isApplied && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            </div>
          </button>
        </CardContent>
      </LiquidCard>
    </ScrollReveal>
  );
}

export default function RecommendationsSection({
  recommendations,
  onToggleRecommendation,
}: RecommendationsSectionProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const totalImpactAmount = recommendations.reduce(
    (sum, rec) => sum + rec.impactAmount,
    0
  );
  const totalFireAcceleration = recommendations.reduce(
    (sum, rec) => sum + rec.fireAcceleration,
    0
  );

  return (
    <section className="w-full font-['Inter',sans-serif]">
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes recommendationPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.12), 0 0 40px rgba(16,185,129,0.05); }
          50% { box-shadow: 0 0 24px rgba(16,185,129,0.2), 0 0 48px rgba(16,185,129,0.08); }
        }
      `}</style>

      {/* Section header */}
      <ScrollReveal delay={0}>
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}
          >
            <Lightbulb className="w-5 h-5" style={{ color: '#10B981' }} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Controversial Recommendations
          </h2>
        </div>
      </ScrollReveal>

      {/* Recommendation cards */}
      <div className="space-y-5">
        {recommendations.map((recommendation, index) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            index={index}
            onToggle={onToggleRecommendation}
          />
        ))}
      </div>

      {/* Total impact summary card */}
      <ScrollReveal delay={recommendations.length * 100 + 100}>
        <div className="mt-8">
          <LiquidCard glowColor="#10B981">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <ChevronRight className="w-5 h-5" style={{ color: '#10B981' }} />
                <h3 className="text-lg font-bold text-white font-['Inter',sans-serif]">
                  Total Potential Impact
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40 mb-2">
                    Combined Annual Savings
                  </p>
                  <div className="text-3xl sm:text-4xl font-bold" style={{ color: '#10B981' }}>
                    <CountUpNumber
                      end={totalImpactAmount}
                      prefix="£"
                      duration={1800}
                      separator=","
                    />
                    <span className="text-base font-medium text-white/50 ml-1">/year</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/40 mb-2">
                    FIRE Acceleration
                  </p>
                  <div className="text-3xl sm:text-4xl font-bold" style={{ color: '#10B981' }}>
                    <CountUpNumber
                      end={totalFireAcceleration}
                      decimals={1}
                      duration={1800}
                    />
                    <span className="text-base font-medium text-white/50 ml-1">years closer</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-white/30">
                Impact shown if all {recommendations.length} recommendations are applied together.
              </p>
            </CardContent>
          </LiquidCard>
        </div>
      </ScrollReveal>
    </section>
  );
}
