'use client';

import React, { useState, useEffect, useRef } from 'react';
import CountUpNumber from './CountUpNumber';
import ScrollReveal from './ScrollReveal';
import { LiquidCard, CardContent } from './LiquidCard';

interface ScoreDashboardProps {
  financialHealth: number;
  savingsEfficiency: number;
  fireReadiness: number;
}

interface GaugeConfig {
  label: string;
  value: number;
  gradientId: string;
}

function getScoreColor(value: number): string {
  if (value >= 80) return '#10B981';
  if (value >= 40) return '#F59E0B';
  return '#DC2626';
}

function getStrengthLabel(value: number): string {
  if (value >= 80) return 'Strong';
  if (value >= 40) return 'Moderate';
  return 'Weak';
}

function getStrengthBadgeClasses(value: number): string {
  if (value >= 80) return 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/25';
  if (value >= 40) return 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25';
  return 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/25';
}

function HalfCircleGauge({ value, label, gradientId, animationTriggered }: {
  value: number;
  label: string;
  gradientId: string;
  animationTriggered: boolean;
}) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const color = getScoreColor(clampedValue);

  // Arc geometry for half-circle
  // Center at (100, 100), radius 80, arc from 180deg to 0deg (left to right across the top)
  const radius = 80;
  const cx = 100;
  const cy = 100;

  // Half-circle arc length
  const halfCircumference = Math.PI * radius; // ~251.33
  const targetOffset = halfCircumference * (1 - clampedValue / 100);

  // SVG arc path: from left (20, 100) sweeping to right (180, 100) through the top
  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  return (
    <LiquidCard
      className="h-full"
      glowColor={color}
      hover
    >
      <CardContent className="flex flex-col items-center pt-6 pb-5">
        {/* Label */}
        <span className="font-inter text-sm font-medium text-[#64748B] tracking-wide uppercase mb-4">
          {label}
        </span>

        {/* SVG Gauge */}
        <div className="relative w-full max-w-[200px] mx-auto">
          <svg viewBox="0 0 200 120" className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id={`${gradientId}-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                <stop offset="50%" stopColor={color} stopOpacity="1" />
                <stop offset="100%" stopColor={color} stopOpacity="0.8" />
              </linearGradient>

              {/* Glow filter for the foreground arc */}
              <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background arc */}
            <path
              d={arcPath}
              fill="none"
              stroke="#1E293B"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Animated foreground arc */}
            <path
              d={arcPath}
              fill="none"
              stroke={`url(#${gradientId}-gradient)`}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={halfCircumference}
              strokeDashoffset={animationTriggered ? targetOffset : halfCircumference}
              filter={`url(#${gradientId}-glow)`}
              style={{
                transition: animationTriggered
                  ? 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)'
                  : 'none',
              }}
            />
          </svg>

          {/* Centered score number */}
          <div className="absolute inset-0 flex items-end justify-center" style={{ bottom: '8px' }}>
            <div className="flex items-baseline pb-1">
              <CountUpNumber
                end={animationTriggered ? clampedValue : 0}
                duration={1400}
                className="font-inter text-4xl font-bold text-white tabular-nums"
              />
              <span className="font-inter text-lg font-medium text-[#64748B] ml-0.5">
                /100
              </span>
            </div>
          </div>
        </div>

        {/* Strength badge */}
        <div className="mt-3">
          <span
            className={`
              inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
              border font-inter tracking-wide
              ${getStrengthBadgeClasses(clampedValue)}
            `}
          >
            {getStrengthLabel(clampedValue)}
          </span>
        </div>
      </CardContent>
    </LiquidCard>
  );
}

export default function ScoreDashboard({
  financialHealth,
  savingsEfficiency,
  fireReadiness,
}: ScoreDashboardProps) {
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimationTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const gauges: GaugeConfig[] = [
    { label: 'Financial Health', value: financialHealth, gradientId: 'financial-health' },
    { label: 'Savings Efficiency', value: savingsEfficiency, gradientId: 'savings-efficiency' },
    { label: 'FIRE Readiness', value: fireReadiness, gradientId: 'fire-readiness' },
  ];

  return (
    <div ref={containerRef} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {gauges.map((gauge, index) => (
          <ScrollReveal key={gauge.gradientId} delay={index * 120} direction="up">
            <HalfCircleGauge
              value={gauge.value}
              label={gauge.label}
              gradientId={gauge.gradientId}
              animationTriggered={animationTriggered}
            />
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
