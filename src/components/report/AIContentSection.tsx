'use client';

import type { ReactNode } from 'react';
import {
  Shield,
  AlertTriangle,
  Target,
  Heart,
  BookOpen,
  Scale,
  Calculator,
  Flag,
  Star,
  Zap,
  Info,
  CheckCircle,
  Clock,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { LiquidCard, CardContent, CardHeader } from './LiquidCard';

/* ------------------------------------------------------------------ */
/*  Icon mapping                                                       */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, LucideIcon> = {
  shield: Shield,
  alert: AlertTriangle,
  target: Target,
  heart: Heart,
  book: BookOpen,
  scale: Scale,
  calculator: Calculator,
  flag: Flag,
  star: Star,
  zap: Zap,
  info: Info,
  check: CheckCircle,
  warning: AlertTriangle,
  clock: Clock,
  trending: TrendingUp,
};

/* ------------------------------------------------------------------ */
/*  Type-based accent configuration                                    */
/* ------------------------------------------------------------------ */

interface TypeConfig {
  accent: string;
  bgTint: string;
  borderTint: string;
  badgeBg: string;
  badgeText: string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  info: {
    accent: '#3B82F6',
    bgTint: 'rgba(59,130,246,0.10)',
    borderTint: 'rgba(59,130,246,0.20)',
    badgeBg: 'bg-[#3B82F6]/15',
    badgeText: 'text-[#3B82F6]',
  },
  warning: {
    accent: '#F59E0B',
    bgTint: 'rgba(245,158,11,0.10)',
    borderTint: 'rgba(245,158,11,0.20)',
    badgeBg: 'bg-[#F59E0B]/15',
    badgeText: 'text-[#F59E0B]',
  },
  success: {
    accent: '#10B981',
    bgTint: 'rgba(16,185,129,0.10)',
    borderTint: 'rgba(16,185,129,0.20)',
    badgeBg: 'bg-[#10B981]/15',
    badgeText: 'text-[#10B981]',
  },
  danger: {
    accent: '#DC2626',
    bgTint: 'rgba(220,38,38,0.10)',
    borderTint: 'rgba(220,38,38,0.20)',
    badgeBg: 'bg-[#DC2626]/15',
    badgeText: 'text-[#DC2626]',
  },
};

/* ------------------------------------------------------------------ */
/*  Metric type colours                                                */
/* ------------------------------------------------------------------ */

const METRIC_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  positive: {
    text: 'text-[#10B981]',
    border: 'border-[#10B981]/20',
    bg: 'bg-[#10B981]/[0.06]',
  },
  negative: {
    text: 'text-[#DC2626]',
    border: 'border-[#DC2626]/20',
    bg: 'bg-[#DC2626]/[0.06]',
  },
  neutral: {
    text: 'text-white',
    border: 'border-white/[0.08]',
    bg: 'bg-white/[0.04]',
  },
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface MetricItem {
  label: string;
  value: string;
  type?: 'positive' | 'negative' | 'neutral';
}

interface AIContentSectionProps {
  id: string;
  title: string;
  icon: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  paragraphs: string[];
  metrics?: MetricItem[];
  sourceCitation?: string;
  isLocked?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Rich-text renderer                                                 */
/*  - Highlights inline currency (£X,XXX) and percentage (X%) values   */
/*  - Converts **bold** markdown to <strong>                           */
/* ------------------------------------------------------------------ */

function renderRichText(raw: string, accentColor: string): ReactNode[] {
  // Split on **bold** segments first, then process each segment for
  // currency / percentage tokens.
  // Combined pattern: (**...** | £[\d,.]+ | \d+(?:\.\d+)?%)
  const TOKEN_RE = /(\*\*[^*]+\*\*|£[\d,.]+|\d+(?:\.\d+)?%)/g;

  const parts = raw.split(TOKEN_RE);

  return parts.map((part, i) => {
    if (!part) return null;

    // Bold markdown
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <strong key={i} className="font-semibold text-white">
          {inner}
        </strong>
      );
    }

    // Currency pattern (e.g. £1,200 or £45,000.50)
    if (/^£[\d,.]+$/.test(part)) {
      return (
        <span
          key={i}
          className="font-bold text-[1.05em]"
          style={{ color: accentColor }}
        >
          {part}
        </span>
      );
    }

    // Percentage pattern (e.g. 42% or 8.5%)
    if (/^\d+(?:\.\d+)?%$/.test(part)) {
      return (
        <span
          key={i}
          className="font-bold text-[1.05em]"
          style={{ color: accentColor }}
        >
          {part}
        </span>
      );
    }

    // Plain text
    return <span key={i}>{part}</span>;
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AIContentSection({
  id,
  title,
  icon,
  type,
  paragraphs,
  metrics,
  sourceCitation,
  isLocked = false,
}: AIContentSectionProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
  const IconComponent = ICON_MAP[icon] ?? Info;

  /* ---- Locked / paywall placeholder ---- */
  if (isLocked) {
    return (
      <ScrollReveal>
        <section id={id} className="font-['Inter',sans-serif]">
          <LiquidCard glowColor={config.accent}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl border"
                  style={{
                    backgroundColor: config.bgTint,
                    borderColor: config.borderTint,
                  }}
                >
                  <IconComponent className="w-5 h-5" style={{ color: config.accent }} />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {title}
                </h2>
              </div>
            </CardHeader>

            <CardContent>
              <div className="relative overflow-hidden max-h-[72px]">
                {/* Blurred preview of first 2 paragraphs */}
                <div className="space-y-3 blur-[6px] select-none pointer-events-none">
                  {paragraphs.slice(0, 2).map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed text-white/70">
                      {p}
                    </p>
                  ))}
                </div>

                {/* Fade-out gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A1628]/60 to-[#0A1628] pointer-events-none" />
              </div>
            </CardContent>
          </LiquidCard>
        </section>
      </ScrollReveal>
    );
  }

  /* ---- Full (unlocked) content ---- */
  return (
    <ScrollReveal>
      <section id={id} className="font-['Inter',sans-serif]">
        <LiquidCard glowColor={config.accent}>
          {/* ---- Header ---- */}
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl border"
                style={{
                  backgroundColor: config.bgTint,
                  borderColor: config.borderTint,
                }}
              >
                <IconComponent className="w-5 h-5" style={{ color: config.accent }} />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {title}
              </h2>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ---- Paragraphs ---- */}
            <div className="space-y-4">
              {paragraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-sm sm:text-[15px] leading-relaxed text-white/70"
                >
                  {renderRichText(paragraph, config.accent)}
                </p>
              ))}
            </div>

            {/* ---- Metrics grid ---- */}
            {metrics && metrics.length > 0 && (
              <div
                className={`grid gap-3 ${
                  metrics.length === 1
                    ? 'grid-cols-1'
                    : metrics.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {metrics.map((metric, i) => {
                  const mColor = METRIC_COLORS[metric.type ?? 'neutral'];

                  return (
                    <div
                      key={i}
                      className={`
                        rounded-xl border px-4 py-3.5 text-center
                        ${mColor.border} ${mColor.bg}
                      `}
                    >
                      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50 mb-1.5">
                        {metric.label}
                      </p>
                      <p className={`text-xl font-bold tabular-nums ${mColor.text}`}>
                        {metric.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ---- Source citation ---- */}
            {sourceCitation && (
              <div className="flex items-start gap-2 pt-2 border-t border-white/[0.06]">
                <BookOpen className="w-3.5 h-3.5 text-white/30 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-white/35">
                  {sourceCitation}
                </p>
              </div>
            )}
          </CardContent>
        </LiquidCard>
      </section>
    </ScrollReveal>
  );
}
