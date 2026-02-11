'use client';

import { useCalculatorStore } from '@/lib/store';
import { formatCurrency, formatTimeHM } from '@/lib/calculator';
import TaxTrapWarning from './TaxTrapWarning';
import SaveScenarioButton from './SaveScenarioButton';

export default function Results() {
  const { results, inputs } = useCalculatorStore();

  if (!results) return null;

  const { trueHourlyRate, assumedHourlyRate, taxBreakdown, timeBreakdown, percentOfAssumed } = results;

  return (
    <section id="results" className="py-16 px-6 bg-[#050505] section-enter">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Main Results */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card card-hover p-6 result-appear" style={{ animationDelay: '0.1s' }}>
            <p className="stat-label mb-2">Assumed Rate</p>
            <p className="text-2xl font-semibold text-neutral-400">{formatCurrency(assumedHourlyRate)}</p>
            <p className="text-xs text-neutral-600 mt-1">Gross ÷ Contract Hours</p>
          </div>
          <div className="card card-glow stat-card-glow card-hover p-6 border-[#10b981]/20 result-appear" style={{ animationDelay: '0.2s' }}>
            <p className="stat-label mb-2 text-[#10b981]/70">True Hourly Rate</p>
            <p className="text-4xl font-bold text-[#10b981]">{formatCurrency(trueHourlyRate)}</p>
            <p className="text-xs text-[#10b981]/50 mt-1">After tax & real time</p>
          </div>
          <div className="card card-hover p-6 result-appear" style={{ animationDelay: '0.3s' }}>
            <p className="stat-label mb-2">Reality Check</p>
            <p className="text-2xl font-semibold text-white">{percentOfAssumed.toFixed(0)}%</p>
            <p className="text-xs text-neutral-600 mt-1">of what you thought</p>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tax Breakdown */}
          <div className="card card-hover p-6 result-appear" style={{ animationDelay: '0.4s' }}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#10b981] rounded-full"></span>
              Tax Breakdown
            </h3>
            <div className="space-y-3">
              <BreakdownRow label="Gross Salary" value={formatCurrency(taxBreakdown.grossSalary)} />
              <BreakdownRow label="Pension Contribution" value={`-${formatCurrency(taxBreakdown.pensionContribution)}`} />
              <BreakdownRow label="Income Tax" value={`-${formatCurrency(taxBreakdown.incomeTax)}`} highlight />
              <BreakdownRow label="National Insurance" value={`-${formatCurrency(taxBreakdown.nationalInsurance)}`} />
              {taxBreakdown.studentLoan > 0 && (
                <BreakdownRow label="Student Loan" value={`-${formatCurrency(taxBreakdown.studentLoan)}`} />
              )}
              <div className="border-t border-white/10 pt-3 mt-3">
                <BreakdownRow label="Net Salary" value={formatCurrency(taxBreakdown.netSalary)} bold />
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Effective Tax Rate</span>
                  <span className="text-amber-400">{taxBreakdown.effectiveTaxRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-neutral-500">Marginal Rate</span>
                  <span className="text-amber-400">{taxBreakdown.effectiveMarginalRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Breakdown */}
          <div className="card card-hover p-6 result-appear" style={{ animationDelay: '0.5s' }}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#10b981] rounded-full"></span>
              Time Breakdown
            </h3>
            <div className="space-y-3">
              <BreakdownRow label="Contract Hours" value={`${formatTimeHM(timeBreakdown.weeklyContractHours)}/week`} />
              <BreakdownRow label="Commute Time" value={`+${formatTimeHM(timeBreakdown.weeklyCommuteHours)}/week`} />
              <BreakdownRow label="Unpaid Breaks" value={`+${formatTimeHM(timeBreakdown.weeklyBreakHours)}/week`} />
              <BreakdownRow label="Prep Time" value={`+${formatTimeHM(timeBreakdown.weeklyPrepHours)}/week`} />
              <div className="border-t border-white/10 pt-3 mt-3">
                <BreakdownRow label="True Weekly Hours" value={`${formatTimeHM(timeBreakdown.weeklyTotalHours)}/week`} bold highlight />
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Working Weeks/Year</span>
                  <span className="text-white">{timeBreakdown.workingWeeks.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-neutral-500">Annual True Hours</span>
                  <span className="text-white">{timeBreakdown.annualTotalHours.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Trap Warning */}
        <TaxTrapWarning salary={inputs.salary} taxBreakdown={taxBreakdown} region={inputs.taxRegion} />

        {/* Save Scenario Button */}
        <SaveScenarioButton />
      </div>
    </section>
  );
}

interface BreakdownRowProps {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}

function BreakdownRow({ label, value, bold = false, highlight = false }: BreakdownRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'text-white font-medium' : 'text-neutral-400'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold' : ''} ${highlight ? 'text-[#10b981]' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}
