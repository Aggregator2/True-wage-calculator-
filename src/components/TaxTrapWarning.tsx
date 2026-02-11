'use client';

import { formatCurrency } from '@/lib/calculator';
import type { TaxBreakdown, TaxRegion } from '@/types/calculator';

interface TaxTrapWarningProps {
  salary: number;
  taxBreakdown: TaxBreakdown;
  region: TaxRegion;
}

export default function TaxTrapWarning({ salary, taxBreakdown, region }: TaxTrapWarningProps) {
  // Only show if salary is in the £100k-£125,140 trap range
  if (salary < 100000 || salary > 125140) return null;

  const marginalRate = region === 'scotland' ? 67.5 : 60;
  const extraTax = (Math.min(salary, 125140) - 100000) * 0.2; // Extra tax from lost PA
  const netPer1000 = 1000 * (1 - marginalRate / 100);

  return (
    <div className="card warning-card p-6 result-appear" style={{ animationDelay: '0.6s' }}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-400 mb-2">£100K Tax Trap Detected</h3>
          <p className="text-amber-200/70 text-sm mb-4">
            Income in the £100k-£125,140 range loses £1 of Personal Allowance per £2 earned.
            Effective marginal rate: <strong className="text-amber-400">{marginalRate}%</strong>
          </p>
          <div className="grid grid-cols-3 gap-4 p-4 bg-[#0a0a0a]/50 rounded-lg">
            <div>
              <p className="text-xs text-amber-400/60 mb-1">Personal Allowance</p>
              <p className="font-medium text-amber-300">{formatCurrency(taxBreakdown.personalAllowance)}</p>
            </div>
            <div>
              <p className="text-xs text-amber-400/60 mb-1">Extra Tax</p>
              <p className="font-medium text-amber-300">{formatCurrency(extraTax)}</p>
            </div>
            <div>
              <p className="text-xs text-amber-400/60 mb-1">Net per £1,000</p>
              <p className="font-medium text-amber-300">{formatCurrency(netPer1000)}</p>
            </div>
          </div>
          <p className="text-xs text-amber-300/50 mt-4">
            Consider salary sacrifice to pension to get below £100k and recover your full Personal Allowance.
          </p>
        </div>
      </div>
    </div>
  );
}
