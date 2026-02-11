'use client';

import { useMemo } from 'react';
import { Map, Check, Circle, TrendingUp } from 'lucide-react';
import CountUpNumber from './CountUpNumber';
import ScrollReveal from './ScrollReveal';
import { LiquidCard, CardContent, CardHeader } from './LiquidCard';

interface Action {
  id: string;
  task: string;
  impact: string;
  annualSavings?: number;
  isCompleted: boolean;
}

interface Phase {
  id: string;
  timeRange: string;
  title: string;
  color: string;
  actions: Action[];
}

interface CompoundEffect {
  totalAnnualImpact: number;
  description: string;
}

interface ActionTimelineSectionProps {
  phases: Phase[];
  compoundEffect: CompoundEffect;
  onToggleAction: (phaseId: string, actionId: string) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Determines the status of each phase based on action completion.
 * A phase is "completed" if all actions are done, "active" if it's the
 * first phase with incomplete actions, and "future" otherwise.
 */
function getPhaseStatuses(phases: Phase[]): ('completed' | 'active' | 'future')[] {
  const statuses: ('completed' | 'active' | 'future')[] = [];
  let foundActive = false;

  for (const phase of phases) {
    const allDone = phase.actions.length > 0 && phase.actions.every((a) => a.isCompleted);
    if (allDone) {
      statuses.push('completed');
    } else if (!foundActive) {
      statuses.push('active');
      foundActive = true;
    } else {
      statuses.push('future');
    }
  }

  return statuses;
}

/** Visual horizontal timeline bar with phase nodes */
function TimelineBar({
  phases,
  statuses,
}: {
  phases: Phase[];
  statuses: ('completed' | 'active' | 'future')[];
}) {
  if (phases.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-2 -mb-2 scrollbar-thin scrollbar-thumb-white/10">
      <div
        className="relative flex items-start justify-between min-w-[480px] px-4 pt-4 pb-2"
        role="list"
        aria-label="Timeline phases"
      >
        {/* Connecting line */}
        <div className="absolute top-[30px] left-8 right-8 h-[2px] bg-white/[0.08]" />

        {/* Phase nodes */}
        {phases.map((phase, i) => {
          const status = statuses[i];

          return (
            <div
              key={phase.id}
              className="relative flex flex-col items-center gap-2 z-10"
              style={{ flex: '1 1 0%' }}
              role="listitem"
              aria-label={`${phase.title} - ${phase.timeRange} - ${status}`}
            >
              {/* Node circle */}
              <div
                className={`
                  relative w-7 h-7 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${
                    status === 'completed'
                      ? 'bg-[#10B981] border-2 border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : status === 'active'
                        ? 'bg-[#10B981]/20 border-2 border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                        : 'bg-[#0A1628] border-2 border-white/20'
                  }
                `}
              >
                {status === 'completed' && (
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                )}
                {status === 'active' && (
                  <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                )}
              </div>

              {/* Label */}
              <div className="text-center max-w-[100px]">
                <p
                  className={`text-[11px] font-semibold leading-tight ${
                    status === 'active'
                      ? 'text-[#10B981]'
                      : status === 'completed'
                        ? 'text-white/70'
                        : 'text-white/30'
                  }`}
                >
                  {phase.timeRange}
                </p>
                <p
                  className={`text-[10px] leading-tight mt-0.5 ${
                    status === 'active'
                      ? 'text-white/60'
                      : status === 'completed'
                        ? 'text-white/40'
                        : 'text-white/20'
                  }`}
                >
                  {phase.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Interactive checkbox for action items */
function ActionCheckbox({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex-shrink-0 w-5 h-5 rounded-full
        transition-all duration-200 mt-0.5
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1628]
        ${
          checked
            ? 'bg-[#10B981] border-2 border-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.3)]'
            : 'bg-transparent border-2 border-white/20 hover:border-white/40'
        }
      `}
      aria-label={checked ? 'Mark as incomplete' : 'Mark as complete'}
      aria-checked={checked}
      role="checkbox"
    >
      {checked && (
        <Check className="absolute inset-0 m-auto w-3 h-3 text-white" strokeWidth={3} />
      )}
    </button>
  );
}

/** Single phase card with action items */
function PhaseCard({
  phase,
  phaseIndex,
  status,
  onToggleAction,
}: {
  phase: Phase;
  phaseIndex: number;
  status: 'completed' | 'active' | 'future';
  onToggleAction: (phaseId: string, actionId: string) => void;
}) {
  const completedCount = phase.actions.filter((a) => a.isCompleted).length;
  const totalCount = phase.actions.length;

  return (
    <ScrollReveal delay={100 + phaseIndex * 100}>
      <LiquidCard hover>
        {/* Colored left border overlay */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ backgroundColor: phase.color }}
        />

        <CardHeader className="pl-8">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {phase.title}
              </h3>
              <p className="text-xs text-white/40 mt-0.5">{phase.timeRange}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`
                  text-xs font-medium px-2.5 py-1 rounded-full
                  ${
                    status === 'completed'
                      ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20'
                      : status === 'active'
                        ? 'bg-white/[0.06] text-white/60 border border-white/[0.08]'
                        : 'bg-white/[0.03] text-white/30 border border-white/[0.05]'
                  }
                `}
              >
                {completedCount}/{totalCount} done
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pl-8">
          <div className="space-y-3">
            {phase.actions.map((action) => (
              <div
                key={action.id}
                className={`
                  flex items-start gap-3 p-3 rounded-xl
                  transition-all duration-200
                  ${
                    action.isCompleted
                      ? 'bg-[#10B981]/[0.04] border border-[#10B981]/10'
                      : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]'
                  }
                `}
              >
                <ActionCheckbox
                  checked={action.isCompleted}
                  onClick={() => onToggleAction(phase.id, action.id)}
                />

                <div className="flex-1 min-w-0">
                  <p
                    className={`
                      text-sm leading-relaxed transition-all duration-200
                      ${
                        action.isCompleted
                          ? 'line-through text-white/30'
                          : 'text-white/80'
                      }
                    `}
                  >
                    {action.task}
                  </p>
                  <p
                    className={`
                      text-xs mt-1 transition-all duration-200
                      ${action.isCompleted ? 'text-white/20' : 'text-white/40'}
                    `}
                  >
                    {action.impact}
                  </p>
                </div>

                {action.annualSavings != null && action.annualSavings > 0 && (
                  <span
                    className={`
                      flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-lg tabular-nums
                      transition-all duration-200
                      ${
                        action.isCompleted
                          ? 'bg-[#10B981]/10 text-[#10B981]/50'
                          : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/15'
                      }
                    `}
                  >
                    {formatCurrency(action.annualSavings)}/yr
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </LiquidCard>
    </ScrollReveal>
  );
}

export default function ActionTimelineSection({
  phases,
  compoundEffect,
  onToggleAction,
}: ActionTimelineSectionProps) {
  const phaseStatuses = useMemo(() => getPhaseStatuses(phases), [phases]);

  // Don't render if there are no phases
  if (!phases || phases.length === 0) return null;

  return (
    <section className="space-y-8">
      {/* Section Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20">
            <Map className="w-5 h-5 text-[#10B981]" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Your Controversial Action Plan
          </h2>
        </div>
        <p className="text-white/50 text-sm ml-[52px]">
          A phased roadmap to accelerate your path to financial independence
        </p>
      </ScrollReveal>

      {/* Visual Timeline Bar */}
      <ScrollReveal delay={50}>
        <LiquidCard>
          <CardContent className="pt-4 pb-4">
            <TimelineBar phases={phases} statuses={phaseStatuses} />
          </CardContent>
        </LiquidCard>
      </ScrollReveal>

      {/* Phase Cards */}
      <div className="space-y-5">
        {phases.map((phase, i) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            phaseIndex={i}
            status={phaseStatuses[i]}
            onToggleAction={onToggleAction}
          />
        ))}
      </div>

      {/* Compound Effect Summary */}
      <ScrollReveal delay={100 + phases.length * 100}>
        <LiquidCard glowColor="#10B981">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
                <TrendingUp className="w-6 h-6 text-[#10B981]" />
              </div>

              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                  Total Annual Impact
                </p>
                <p className="text-4xl font-bold text-[#10B981] tabular-nums">
                  <CountUpNumber
                    end={compoundEffect.totalAnnualImpact}
                    prefix="£"
                    decimals={0}
                    className="text-4xl font-bold text-[#10B981]"
                  />
                </p>
              </div>

              <p className="text-sm text-white/50 leading-relaxed max-w-lg">
                {compoundEffect.description}
              </p>
            </div>
          </CardContent>
        </LiquidCard>
      </ScrollReveal>
    </section>
  );
}
