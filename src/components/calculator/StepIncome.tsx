'use client';

import { useCalculatorStore } from '@/lib/store';
import type { TaxRegion, StudentLoanPlan } from '@/types/calculator';

export default function StepIncome() {
  const { inputs, setInputs } = useCalculatorStore();

  const formatSalary = (val: number) => val.toLocaleString('en-GB');
  const parseSalary = (val: string) => parseInt(val.replace(/,/g, ''), 10) || 0;

  const studentLoanOptions: { value: StudentLoanPlan; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'plan1', label: 'Plan 1' },
    { value: 'plan2', label: 'Plan 2' },
    { value: 'plan4', label: 'Plan 4' },
    { value: 'plan5', label: 'Plan 5' },
    { value: 'postgrad', label: 'Postgrad' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-lg text-xl text-white mb-1">Your Income</h2>
        <p className="text-sm text-zinc-500">Tell us about your earnings and deductions.</p>
      </div>

      {/* Salary */}
      <div>
        <label htmlFor="calc-salary" className="block text-sm text-zinc-400 mb-2">
          Annual Gross Salary
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">£</span>
          <input
            type="text"
            id="calc-salary"
            value={formatSalary(inputs.salary)}
            onChange={(e) => setInputs({ salary: parseSalary(e.target.value) })}
            className="input-field w-full pl-9 pr-4 py-3.5 text-lg"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Tax Region */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Tax Region</label>
        <div className="toggle-group">
          <button
            onClick={() => setInputs({ taxRegion: 'england' as TaxRegion })}
            className={`toggle-option ${inputs.taxRegion === 'england' ? 'active' : ''}`}
          >
            England / Wales / NI
          </button>
          <button
            onClick={() => setInputs({ taxRegion: 'scotland' as TaxRegion })}
            className={`toggle-option ${inputs.taxRegion === 'scotland' ? 'active' : ''}`}
          >
            Scotland
          </button>
        </div>
      </div>

      {/* Pension */}
      <div>
        <label htmlFor="calc-pension" className="block text-sm text-zinc-400 mb-2">
          Pension Contribution <span className="text-zinc-600">(salary sacrifice)</span>
        </label>
        <div className="relative">
          <input
            type="number"
            id="calc-pension"
            value={inputs.pensionPercent}
            onChange={(e) => setInputs({ pensionPercent: parseFloat(e.target.value) || 0 })}
            min="0"
            max="100"
            step="0.5"
            className="input-field w-full pl-4 pr-10 py-3.5"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
        </div>
      </div>

      {/* Student Loan */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Student Loan Plan</label>
        <div className="pill-group">
          {studentLoanOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setInputs({ studentLoan: opt.value })}
              className={`pill-option ${inputs.studentLoan === opt.value ? 'active' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
