'use client';

import { useMemo } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { calculateAllDeductions, calculateTrueHours, formatCurrency, formatTimeHM } from '@/lib/calculator';
import CountUpNumber from '@/components/ui/CountUpNumber';

interface LiveSidebarProps {
  currentStep: number;
}

export default function LiveSidebar({ currentStep }: LiveSidebarProps) {
  const { inputs } = useCalculatorStore();

  const tax = useMemo(
    () => calculateAllDeductions(inputs.salary, inputs.taxRegion, inputs.studentLoan, inputs.pensionPercent),
    [inputs.salary, inputs.taxRegion, inputs.studentLoan, inputs.pensionPercent]
  );

  const time = useMemo(
    () => calculateTrueHours(inputs.contractHours, inputs.commuteMinutes, inputs.unpaidBreak, inputs.prepTime, inputs.workDays, inputs.holidayDays),
    [inputs.contractHours, inputs.commuteMinutes, inputs.unpaidBreak, inputs.prepTime, inputs.workDays, inputs.holidayDays]
  );

  const annualWorkCosts = (inputs.commuteCost * 12) + inputs.workClothes;
  const netAfterCosts = tax.netSalary - annualWorkCosts;
  const trueRate = netAfterCosts * (1 - inputs.stressTax / 100) / time.annualTotalHours;

  return (
    <div className="card p-5 border-zinc-800 sticky top-20">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Live Preview</h3>

      {/* Always show true rate */}
      <div className="mb-5 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
        <p className="text-xs text-emerald-500/60 mb-1">True Hourly Rate</p>
        <p className="text-3xl font-bold text-emerald-400 font-[var(--font-heading)]">
          <CountUpNumber value={isFinite(trueRate) ? trueRate : 0} prefix="£" decimals={2} />
        </p>
      </div>

      {/* Step-specific details */}
      {currentStep === 0 && (
        <div className="space-y-3">
          <SidebarRow label="Gross Salary" value={formatCurrency(tax.grossSalary)} />
          <SidebarRow label="Income Tax" value={`-${formatCurrency(tax.incomeTax)}`} />
          <SidebarRow label="National Insurance" value={`-${formatCurrency(tax.nationalInsurance)}`} />
          <SidebarRow label="Pension" value={`-${formatCurrency(tax.pensionContribution)}`} />
          {tax.studentLoan > 0 && (
            <SidebarRow label="Student Loan" value={`-${formatCurrency(tax.studentLoan)}`} />
          )}
          <div className="pt-3 border-t border-white/5">
            <SidebarRow label="Take-Home Pay" value={formatCurrency(tax.netSalary)} highlight />
          </div>
          <div className="pt-2">
            <SidebarRow label="Effective Tax Rate" value={`${tax.effectiveTaxRate.toFixed(1)}%`} muted />
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-3">
          <SidebarRow label="Contract Hours" value={`${formatTimeHM(time.weeklyContractHours)}/wk`} />
          <SidebarRow label="Commute" value={`+${formatTimeHM(time.weeklyCommuteHours)}/wk`} />
          <SidebarRow label="Breaks" value={`+${formatTimeHM(time.weeklyBreakHours)}/wk`} />
          <SidebarRow label="Prep Time" value={`+${formatTimeHM(time.weeklyPrepHours)}/wk`} />
          <div className="pt-3 border-t border-white/5">
            <SidebarRow label="True Weekly Hours" value={`${formatTimeHM(time.weeklyTotalHours)}/wk`} highlight />
          </div>
          <div className="pt-2">
            <SidebarRow label="Annual Hours" value={`${time.annualTotalHours.toFixed(0)}h`} muted />
            <SidebarRow label="Working Weeks" value={`${time.workingWeeks.toFixed(1)}`} muted />
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-3">
          <SidebarRow label="Monthly Commute" value={formatCurrency(inputs.commuteCost)} />
          <SidebarRow label="Annual Clothing" value={formatCurrency(inputs.workClothes)} />
          <div className="pt-3 border-t border-white/5">
            <SidebarRow label="Annual Work Costs" value={formatCurrency(annualWorkCosts)} highlight />
          </div>
          <div className="pt-2">
            <SidebarRow
              label="Impact on Rate"
              value={time.annualTotalHours > 0 ? `-${formatCurrency(annualWorkCosts / time.annualTotalHours)}/hr` : '£0.00/hr'}
              muted
            />
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-3">
          <SidebarRow label="Stress Factor" value={`${inputs.stressTax}%`} />
          <SidebarRow
            label="Stress-Adjusted Net"
            value={formatCurrency(netAfterCosts * (1 - inputs.stressTax / 100))}
          />
          <div className="pt-3 border-t border-white/5">
            <SidebarRow label="Final True Rate" value={isFinite(trueRate) ? formatCurrency(trueRate) : '£0.00'} highlight />
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarRow({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className={muted ? 'text-zinc-600' : 'text-zinc-400'}>{label}</span>
      <span className={`font-medium ${highlight ? 'text-emerald-400' : muted ? 'text-zinc-500' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}
