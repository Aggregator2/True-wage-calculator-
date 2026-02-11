'use client';

import { useState } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { saveComparisonScenario, type CalculatorType } from '@/lib/scenarios';

interface SaveToReportButtonProps {
  calculatorType: CalculatorType;
  inputs: any;
  results: any;
  getDescription?: () => string;
  className?: string;
}

export default function SaveToReportButton({
  calculatorType,
  inputs,
  results,
  getDescription,
  className = '',
}: SaveToReportButtonProps) {
  const { user } = useCalculatorStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const name = getScenarioName(calculatorType, inputs, results);
      const description = getDescription?.() || getDefaultDescription(calculatorType);

      await saveComparisonScenario(
        user.id,
        name,
        calculatorType,
        { inputs, results },
        description
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save scenario:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving || saved}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
        saved
          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
          : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:border-emerald-500/30'
      } disabled:opacity-60 ${className}`}
    >
      {saving ? (
        <>
          <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
          Saving...
        </>
      ) : saved ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved to Report
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save to Report
        </>
      )}
    </button>
  );
}

function getScenarioName(type: CalculatorType, inputs: any, results: any): string {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  switch (type) {
    case 'pension':
      return `Pension ${inputs.employeeContributionPercent}% + ${inputs.employerMatchPercent}%`;
    case 'car':
      return `Car £${(inputs.purchasePrice || 0).toLocaleString()}`;
    case 'student-loans':
      const enabledLoans = inputs.loans?.filter((l: any) => l.enabled).map((l: any) => l.plan.toUpperCase()).join('+');
      return `Student Loans (${enabledLoans || 'None'})`;
    case 'wfh':
      return `WFH ${inputs.wfhDays || 0} days/week`;
    case 'carers':
      return `Carer's Allowance Analysis`;
    case 'intensity':
      return `Work Intensity ${inputs.stressLevel || 'Medium'}`;
    case 'fire':
      return `FIRE Progress ${date}`;
    default:
      return `${type.charAt(0).toUpperCase() + type.slice(1)} - ${date}`;
  }
}

function getDefaultDescription(type: CalculatorType): string {
  switch (type) {
    case 'pension':
      return 'Pension contribution and projection analysis';
    case 'car':
      return 'True cost of car ownership';
    case 'student-loans':
      return 'Student loan repayment projection';
    case 'wfh':
      return 'Work from home vs office comparison';
    case 'carers':
      return "Carer's Allowance eligibility and impact";
    case 'intensity':
      return 'Work stress and intensity adjustment';
    default:
      return 'Calculator scenario';
  }
}
