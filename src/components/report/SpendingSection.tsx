'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import CountUpNumber from './CountUpNumber';
import ScrollReveal from './ScrollReveal';
import { LiquidCard, CardContent, CardHeader } from './LiquidCard';

interface ExpenseItem {
  name: string;
  amount: number;
  hoursOfLife: number;
  color: string;
}

interface LifestyleCreepItem {
  name: string;
  annualCost: number;
}

interface SpendingSectionProps {
  expenses: ExpenseItem[];
  lifestyleCreep: LifestyleCreepItem[];
  totalLifestyleCreepCost: number;
  equivalentHours: number;
  fireDelay: number;
  trueHourlyWage: number;
  aiWarning: string;
  sourceCitation: string;
}

function HoursOfLifeBar({
  expense,
  maxHours,
  index,
  animationTriggered,
}: {
  expense: ExpenseItem;
  maxHours: number;
  index: number;
  animationTriggered: boolean;
}) {
  const widthPercent = maxHours > 0 ? (expense.hoursOfLife / maxHours) * 100 : 0;
  const barColor = expense.color || '#DC2626';
  const delay = index * 100;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: barColor }}
          />
          <span className="font-inter text-sm font-medium text-white/90 truncate">
            {expense.name}
          </span>
        </div>
        <span className="font-inter text-xs text-[#64748B] flex-shrink-0 ml-3">
          {'\u00A3'}{expense.amount.toLocaleString()}/year
        </span>
      </div>

      <div className="relative h-8 rounded-lg bg-white/[0.04] overflow-hidden">
        {/* Animated bar */}
        <div
          className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-3"
          style={{
            width: animationTriggered ? `${Math.max(widthPercent, 8)}%` : '0%',
            backgroundColor: `${barColor}20`,
            borderRight: `3px solid ${barColor}`,
            transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          }}
        >
          <span
            className="font-inter text-xs font-semibold whitespace-nowrap"
            style={{
              color: barColor,
              opacity: animationTriggered ? 1 : 0,
              transition: `opacity 0.3s ease ${delay + 600}ms`,
            }}
          >
            {expense.hoursOfLife.toLocaleString()} hrs
          </span>
        </div>

        {/* Glow effect */}
        <div
          className="absolute inset-y-0 left-0 rounded-lg pointer-events-none"
          style={{
            width: animationTriggered ? `${Math.max(widthPercent, 8)}%` : '0%',
            background: `linear-gradient(90deg, transparent 60%, ${barColor}15 100%)`,
            transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

function LifestyleCreepBar({
  item,
  maxCost,
  index,
  animationTriggered,
}: {
  item: LifestyleCreepItem;
  maxCost: number;
  index: number;
  animationTriggered: boolean;
}) {
  const widthPercent = maxCost > 0 ? (item.annualCost / maxCost) * 100 : 0;
  const delay = index * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-inter text-sm text-white/80">{item.name}</span>
        <span className="font-inter text-sm font-semibold text-[#DC2626]">
          {'\u00A3'}{item.annualCost.toLocaleString()}/yr
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: animationTriggered ? `${Math.max(widthPercent, 4)}%` : '0%',
            background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)',
            transition: `width 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

export default function SpendingSection({
  expenses,
  lifestyleCreep,
  totalLifestyleCreepCost,
  equivalentHours,
  fireDelay,
  trueHourlyWage,
  aiWarning,
  sourceCitation,
}: SpendingSectionProps) {
  const [barsTriggered, setBarsTriggered] = useState(false);
  const [creepTriggered, setCreepTriggered] = useState(false);
  const barsRef = useRef<HTMLDivElement>(null);
  const creepRef = useRef<HTMLDivElement>(null);

  // Intersection observer for expense bars
  useEffect(() => {
    const node = barsRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBarsTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Intersection observer for lifestyle creep bars
  useEffect(() => {
    const node = creepRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCreepTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const maxHours = expenses.length > 0
    ? Math.max(...expenses.map((e) => e.hoursOfLife))
    : 0;

  const maxCreepCost = lifestyleCreep.length > 0
    ? Math.max(...lifestyleCreep.map((c) => c.annualCost))
    : 0;

  const hasExpenses = expenses.length > 0;
  const hasCreep = lifestyleCreep.length > 0;

  // If nothing to show at all, render nothing
  if (!hasExpenses && !hasCreep && !aiWarning) return null;

  return (
    <section className="w-full space-y-8">
      {/* Section Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20">
            <ShoppingCart className="w-5 h-5 text-[#DC2626]" />
          </div>
          <div>
            <h2 className="font-inter text-2xl font-bold text-white tracking-tight">
              The Spending Nobody Talks About
            </h2>
            <p className="font-inter text-sm text-[#64748B] mt-0.5">
              Every pound spent is time you traded from your life
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Hours of Life Bars */}
      {hasExpenses && (
        <ScrollReveal delay={100}>
          <LiquidCard glowColor="#DC2626">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-[#DC2626]" />
                <h3 className="font-inter text-lg font-semibold text-white">
                  Hours of Your Life Per Expense
                </h3>
              </div>
              <p className="font-inter text-xs text-[#64748B]">
                Based on your true hourly wage of{' '}
                <span className="text-white/70 font-medium">
                  {'\u00A3'}{trueHourlyWage.toFixed(2)}/hr
                </span>
              </p>
            </CardHeader>
            <CardContent>
              <div ref={barsRef} className="space-y-4">
                {expenses.map((expense, index) => (
                  <HoursOfLifeBar
                    key={expense.name}
                    expense={expense}
                    maxHours={maxHours}
                    index={index}
                    animationTriggered={barsTriggered}
                  />
                ))}
              </div>
            </CardContent>
          </LiquidCard>
        </ScrollReveal>
      )}

      {/* Lifestyle Creep Calculator */}
      {hasCreep && (
        <ScrollReveal delay={200}>
          <LiquidCard className="border-[#DC2626]/30" glowColor="#DC2626">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-[#DC2626]" />
                <h3 className="font-inter text-lg font-semibold text-white">
                  Lifestyle Creep Calculator
                </h3>
              </div>
              <p className="font-inter text-xs text-[#64748B]">
                Small upgrades that silently drain your freedom fund
              </p>
            </CardHeader>
            <CardContent>
              <div ref={creepRef} className="space-y-3 mb-6">
                {lifestyleCreep.map((item, index) => (
                  <LifestyleCreepBar
                    key={item.name}
                    item={item}
                    maxCost={maxCreepCost}
                    index={index}
                    animationTriggered={creepTriggered}
                  />
                ))}
              </div>

              {/* Total Impact Summary */}
              <div className="rounded-xl bg-[#DC2626]/[0.06] border border-[#DC2626]/20 p-4 space-y-3">
                <h4 className="font-inter text-xs font-semibold uppercase tracking-wider text-[#DC2626]/80">
                  Total Impact
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Total annual waste */}
                  <div className="text-center sm:text-left">
                    <p className="font-inter text-xs text-[#64748B] mb-0.5">
                      Total annual waste
                    </p>
                    <p className="font-inter text-xl font-bold text-[#DC2626]">
                      <CountUpNumber
                        end={totalLifestyleCreepCost}
                        prefix={'\u00A3'}
                        className="font-inter text-xl font-bold text-[#DC2626]"
                      />
                    </p>
                  </div>

                  {/* Equivalent hours */}
                  <div className="text-center sm:text-left">
                    <p className="font-inter text-xs text-[#64748B] mb-0.5">
                      Equivalent hours
                    </p>
                    <p className="font-inter text-xl font-bold text-[#F59E0B]">
                      <CountUpNumber
                        end={equivalentHours}
                        suffix=" hrs"
                        className="font-inter text-xl font-bold text-[#F59E0B]"
                      />
                    </p>
                  </div>

                  {/* FIRE delay */}
                  <div className="text-center sm:text-left">
                    <p className="font-inter text-xs text-[#64748B] mb-0.5">
                      FIRE delay
                    </p>
                    <p className="font-inter text-xl font-bold text-white">
                      <CountUpNumber
                        end={fireDelay}
                        suffix=" years"
                        decimals={1}
                        className="font-inter text-xl font-bold text-white"
                      />
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </LiquidCard>
        </ScrollReveal>
      )}

      {/* AI Warning Box */}
      {aiWarning && (
        <ScrollReveal delay={300}>
          <div className="rounded-xl bg-[#DC2626]/[0.06] border border-[#DC2626]/20 p-5">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#DC2626]/15">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="font-inter text-sm text-white/90 leading-relaxed">
                  {aiWarning}
                </p>
                {sourceCitation && (
                  <p className="font-inter text-xs text-[#64748B] mt-2 leading-relaxed">
                    {sourceCitation}
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}
    </section>
  );
}
