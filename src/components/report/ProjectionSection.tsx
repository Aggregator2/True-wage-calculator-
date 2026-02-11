'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';
import CountUpNumber from './CountUpNumber';
import ScrollReveal from './ScrollReveal';
import { LiquidCard, CardContent } from './LiquidCard';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ScenarioData {
  label: string;
  color: string;
  data: Array<{ year: number; value: number }>;
  isVisible: boolean;
}

interface ProjectionSectionProps {
  scenarios: ScenarioData[];
  currentPathFIAge: number;
  withChangesFIAge: number;
  delta: number;
  assumptions: string;
  onToggleScenario: (index: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatGBP(value: number): string {
  if (value >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `£${(value / 1_000).toFixed(0)}k`;
  }
  return `£${value.toFixed(0)}`;
}

function formatGBPFull(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function niceAxisMax(rawMax: number): number {
  if (rawMax <= 0) return 100_000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const factor = rawMax / magnitude;
  let nice: number;
  if (factor <= 1) nice = 1;
  else if (factor <= 2) nice = 2;
  else if (factor <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

/* ------------------------------------------------------------------ */
/*  SVG Multi-line Chart                                               */
/* ------------------------------------------------------------------ */

const CHART_PADDING = { top: 24, right: 24, bottom: 44, left: 64 };

function ProjectionChart({
  scenarios,
}: {
  scenarios: ScenarioData[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isInView, setIsInView] = useState(false);
  const hasAnimated = useRef(false);

  // Overall chart dimensions (viewBox-based)
  const viewBoxWidth = 800;
  const viewBoxHeight = 400;
  const plotW = viewBoxWidth - CHART_PADDING.left - CHART_PADDING.right;
  const plotH = viewBoxHeight - CHART_PADDING.top - CHART_PADDING.bottom;

  // Derive axis bounds from all scenario data
  const allYears: number[] = [];
  const allValues: number[] = [];
  scenarios.forEach((s) => {
    s.data.forEach((d) => {
      allYears.push(d.year);
      allValues.push(d.value);
    });
  });

  const minYear = allYears.length > 0 ? Math.min(...allYears) : 2024;
  const maxYear = allYears.length > 0 ? Math.max(...allYears) : 2060;
  const rawMaxVal = allValues.length > 0 ? Math.max(...allValues) : 500_000;
  const maxVal = niceAxisMax(rawMaxVal * 1.1);

  const xScale = useCallback(
    (year: number) =>
      CHART_PADDING.left + ((year - minYear) / Math.max(maxYear - minYear, 1)) * plotW,
    [minYear, maxYear, plotW],
  );

  const yScale = useCallback(
    (val: number) =>
      CHART_PADDING.top + plotH - (val / maxVal) * plotH,
    [maxVal, plotH],
  );

  // Intersection observer for draw-in animation
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Convert mouse position to SVG coordinates
  const getSVGPoint = useCallback(
    (clientX: number): number | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const ratioX = viewBoxWidth / rect.width;
      const svgX = (clientX - rect.left) * ratioX;
      return svgX;
    },
    [viewBoxWidth],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svgX = getSVGPoint(e.clientX);
      if (svgX === null) return;
      // Clamp to plot area
      if (svgX < CHART_PADDING.left || svgX > CHART_PADDING.left + plotW) {
        setHoverX(null);
        return;
      }
      setHoverX(svgX);
    },
    [getSVGPoint, plotW],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverX(null);
  }, []);

  // Given an svgX, find the corresponding year and interpolated values
  const getTooltipData = useCallback(
    (svgX: number) => {
      const yearRange = maxYear - minYear || 1;
      const hoveredYear =
        minYear + ((svgX - CHART_PADDING.left) / plotW) * yearRange;
      const roundedYear = Math.round(hoveredYear);
      const clampedYear = Math.max(minYear, Math.min(maxYear, roundedYear));

      const entries: Array<{ label: string; color: string; value: number }> = [];
      scenarios.forEach((s) => {
        if (!s.isVisible) return;
        // Find closest data point
        let closest = s.data[0];
        let minDist = Infinity;
        for (const d of s.data) {
          const dist = Math.abs(d.year - clampedYear);
          if (dist < minDist) {
            minDist = dist;
            closest = d;
          }
        }
        if (closest) {
          entries.push({ label: s.label, color: s.color, value: closest.value });
        }
      });

      return { year: clampedYear, entries };
    },
    [scenarios, minYear, maxYear, plotW],
  );

  // Build polyline points string per scenario
  const buildPoints = (data: Array<{ year: number; value: number }>) =>
    data.map((d) => `${xScale(d.year)},${yScale(d.value)}`).join(' ');

  // Build a closed polygon for the fill-area (line + baseline)
  const buildFillPath = (data: Array<{ year: number; value: number }>) => {
    if (data.length === 0) return '';
    const baseline = yScale(0);
    const linePoints = data.map((d) => `${xScale(d.year)},${yScale(d.value)}`);
    return `M ${xScale(data[0].year)},${baseline} L ${linePoints.join(' L ')} L ${xScale(data[data.length - 1].year)},${baseline} Z`;
  };

  // Y-axis ticks
  const yTickCount = 5;
  const yTicks: number[] = [];
  for (let i = 0; i <= yTickCount; i++) {
    yTicks.push((maxVal / yTickCount) * i);
  }

  // X-axis ticks (every ~5 years)
  const yearSpan = maxYear - minYear;
  const xStep = yearSpan <= 10 ? 2 : yearSpan <= 25 ? 5 : 10;
  const xTicks: number[] = [];
  for (
    let y = Math.ceil(minYear / xStep) * xStep;
    y <= maxYear;
    y += xStep
  ) {
    xTicks.push(y);
  }
  // Ensure first and last year included
  if (xTicks.length === 0 || xTicks[0] !== minYear) xTicks.unshift(minYear);
  if (xTicks[xTicks.length - 1] !== maxYear) xTicks.push(maxYear);

  // Tooltip data
  const tooltip = hoverX !== null ? getTooltipData(hoverX) : null;

  // Compute polyline lengths for stroke animation
  const computePathLength = (data: Array<{ year: number; value: number }>) => {
    let length = 0;
    for (let i = 1; i < data.length; i++) {
      const dx = xScale(data[i].year) - xScale(data[i - 1].year);
      const dy = yScale(data[i].value) - yScale(data[i - 1].value);
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  };

  return (
    <div ref={containerRef} className="w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto select-none"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label="FIRE projection multi-line chart"
      >
        <defs>
          {scenarios.map((s, i) => (
            <linearGradient
              key={`fill-grad-${i}`}
              id={`projection-fill-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={`y-grid-${i}`}
            x1={CHART_PADDING.left}
            y1={yScale(tick)}
            x2={CHART_PADDING.left + plotW}
            y2={yScale(tick)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
        {xTicks.map((tick, i) => (
          <line
            key={`x-grid-${i}`}
            x1={xScale(tick)}
            y1={CHART_PADDING.top}
            x2={xScale(tick)}
            y2={CHART_PADDING.top + plotH}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={`y-label-${i}`}
            x={CHART_PADDING.left - 10}
            y={yScale(tick) + 4}
            textAnchor="end"
            className="fill-white/40"
            style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}
          >
            {formatGBP(tick)}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((tick, i) => (
          <text
            key={`x-label-${i}`}
            x={xScale(tick)}
            y={CHART_PADDING.top + plotH + 28}
            textAnchor="middle"
            className="fill-white/40"
            style={{ fontSize: '11px', fontFamily: 'Inter, sans-serif' }}
          >
            {tick}
          </text>
        ))}

        {/* Plot area border */}
        <rect
          x={CHART_PADDING.left}
          y={CHART_PADDING.top}
          width={plotW}
          height={plotH}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          rx="2"
        />

        {/* Fill areas (rendered behind lines) */}
        {scenarios.map((s, i) => {
          if (!s.isVisible || s.data.length === 0) return null;
          return (
            <path
              key={`fill-${i}`}
              d={buildFillPath(s.data)}
              fill={`url(#projection-fill-${i})`}
              style={{
                opacity: isInView ? 1 : 0,
                transition: 'opacity 0.8s ease 0.4s',
              }}
            />
          );
        })}

        {/* Scenario lines */}
        {scenarios.map((s, i) => {
          if (!s.isVisible || s.data.length === 0) return null;
          const pathLength = computePathLength(s.data);
          return (
            <polyline
              key={`line-${i}`}
              points={buildPoints(s.data)}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={pathLength}
              strokeDashoffset={isInView ? 0 : pathLength}
              style={{
                transition: `stroke-dashoffset 1.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.15}s`,
              }}
            />
          );
        })}

        {/* Hover vertical line */}
        {hoverX !== null && (
          <line
            x1={hoverX}
            y1={CHART_PADDING.top}
            x2={hoverX}
            y2={CHART_PADDING.top + plotH}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
            strokeDasharray="4 3"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Hover dots */}
        {tooltip &&
          tooltip.entries.map((entry, i) => {
            const scenario = scenarios.find(
              (s) => s.label === entry.label && s.isVisible,
            );
            if (!scenario) return null;
            // Find closest point to render the dot
            let closestPt = scenario.data[0];
            let minDist = Infinity;
            for (const d of scenario.data) {
              const dist = Math.abs(d.year - tooltip.year);
              if (dist < minDist) {
                minDist = dist;
                closestPt = d;
              }
            }
            return (
              <circle
                key={`dot-${i}`}
                cx={xScale(closestPt.year)}
                cy={yScale(closestPt.value)}
                r="5"
                fill={entry.color}
                stroke="#0A1628"
                strokeWidth="2"
                style={{ pointerEvents: 'none' }}
              />
            );
          })}

        {/* Tooltip foreign object */}
        {tooltip && hoverX !== null && (
          <foreignObject
            x={Math.min(hoverX + 12, viewBoxWidth - 190)}
            y={CHART_PADDING.top + 8}
            width="180"
            height={40 + tooltip.entries.length * 28}
            style={{ pointerEvents: 'none', overflow: 'visible' }}
          >
            <div
              className="rounded-lg border border-white/10 px-3 py-2 shadow-xl"
              style={{
                background: 'rgba(10,22,40,0.95)',
                backdropFilter: 'blur(12px)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <p className="text-[11px] font-semibold text-white/70 mb-1">
                {tooltip.year}
              </p>
              {tooltip.entries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-0.5"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-[10px] text-white/50 truncate flex-1">
                    {entry.label}
                  </span>
                  <span className="text-[11px] font-semibold text-white tabular-nums">
                    {formatGBPFull(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scenario Toggle Row                                                */
/* ------------------------------------------------------------------ */

function ScenarioToggles({
  scenarios,
  onToggle,
}: {
  scenarios: ScenarioData[];
  onToggle: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {scenarios.map((s, i) => {
        const active = s.isVisible;
        return (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium
              transition-all duration-200 border
              ${
                active
                  ? 'text-white border-transparent'
                  : 'text-white/40 border-white/10 bg-transparent hover:border-white/20 hover:text-white/60'
              }
            `}
            style={
              active
                ? {
                    backgroundColor: `${s.color}20`,
                    borderColor: `${s.color}40`,
                  }
                : undefined
            }
            aria-pressed={active}
            aria-label={`Toggle ${s.label} scenario`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 transition-opacity"
              style={{
                backgroundColor: s.color,
                opacity: active ? 1 : 0.3,
              }}
            />
            <span>{s.label}</span>
            {active ? (
              <Eye className="w-3.5 h-3.5 ml-0.5 opacity-60" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 ml-0.5 opacity-40" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Section                                                       */
/* ------------------------------------------------------------------ */

export default function ProjectionSection({
  scenarios,
  currentPathFIAge,
  withChangesFIAge,
  delta,
  assumptions,
  onToggleScenario,
}: ProjectionSectionProps) {
  return (
    <section className="space-y-8 font-['Inter',sans-serif]">
      {/* Section Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20">
            <TrendingUp className="w-5 h-5 text-[#10B981]" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            FIRE Projection
          </h2>
        </div>
        <p className="text-white/50 text-sm ml-[52px]">
          Your projected portfolio growth across different scenarios
        </p>
      </ScrollReveal>

      {/* Chart Card */}
      <ScrollReveal delay={100}>
        <LiquidCard glowColor="#10B981">
          <CardContent className="pt-6">
            <div className="w-full max-w-[800px] mx-auto">
              <ProjectionChart scenarios={scenarios} />
            </div>

            {/* Scenario Toggles */}
            <div className="mt-5">
              <ScenarioToggles
                scenarios={scenarios}
                onToggle={onToggleScenario}
              />
            </div>
          </CardContent>
        </LiquidCard>
      </ScrollReveal>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ScrollReveal delay={200}>
          <LiquidCard className="h-full" glowColor="#DC2626">
            <CardContent className="pt-6 text-center">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50 mb-3">
                Current Path
              </p>
              <div
                className="rounded-xl px-4 py-5 mb-3"
                style={{ backgroundColor: 'rgba(220,38,38,0.10)' }}
              >
                <p className="text-sm text-white/50 mb-1">FIRE at age</p>
                <div className="text-5xl font-bold" style={{ color: '#DC2626' }}>
                  <CountUpNumber
                    end={currentPathFIAge}
                    duration={1800}
                    className="text-5xl font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </LiquidCard>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <LiquidCard className="h-full" glowColor="#10B981">
            <CardContent className="pt-6 text-center">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50 mb-3">
                With Changes
              </p>
              <div
                className="rounded-xl px-4 py-5 mb-3"
                style={{ backgroundColor: 'rgba(16,185,129,0.10)' }}
              >
                <p className="text-sm text-white/50 mb-1">FIRE at age</p>
                <div className="text-5xl font-bold" style={{ color: '#10B981' }}>
                  <CountUpNumber
                    end={withChangesFIAge}
                    duration={1800}
                    className="text-5xl font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </LiquidCard>
        </ScrollReveal>
      </div>

      {/* Delta Highlight */}
      <ScrollReveal delay={400}>
        <LiquidCard glowColor="#F59E0B">
          <CardContent className="pt-6 pb-6">
            <div className="text-center">
              <div
                className="inline-flex items-center gap-3 rounded-xl px-6 py-4 mb-3"
                style={{ backgroundColor: 'rgba(245,158,11,0.10)' }}
              >
                <span
                  className="text-4xl sm:text-5xl font-bold tabular-nums"
                  style={{ color: '#F59E0B' }}
                >
                  <CountUpNumber
                    end={delta}
                    duration={2000}
                    className="text-4xl sm:text-5xl font-bold"
                  />
                </span>
                <span className="text-lg sm:text-xl font-semibold text-white/70">
                  years earlier
                </span>
              </div>
              <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                By implementing the recommended changes, you could reach financial
                independence{' '}
                <span className="text-[#F59E0B] font-semibold">{delta} years sooner</span>
                . That is{' '}
                <span className="text-white/70 font-medium">
                  {delta} extra years of freedom
                </span>{' '}
                to spend however you choose.
              </p>
            </div>
          </CardContent>
        </LiquidCard>
      </ScrollReveal>

      {/* Assumptions */}
      {assumptions && (
        <ScrollReveal delay={500}>
          <p className="text-xs text-white/30 leading-relaxed max-w-2xl mx-auto text-center">
            {assumptions}
          </p>
        </ScrollReveal>
      )}
    </section>
  );
}
