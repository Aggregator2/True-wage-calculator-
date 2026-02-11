'use client';

import { useState } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { calculate } from '@/lib/calculator';
import { savePrimaryScenario } from '@/lib/scenarios';
import type { TaxRegion, StudentLoanPlan } from '@/types/calculator';

export default function CalculatorForm() {
  const { inputs, setInputs, setResults, user } = useCalculatorStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatSalary = (value: number): string => {
    return value.toLocaleString('en-GB');
  };

  const parseSalary = (value: string): number => {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
  };

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const handleCalculate = async () => {
    const results = calculate(inputs);
    setResults(results);

    // Auto-save as primary scenario if user is logged in
    if (user) {
      setSaving(true);
      try {
        await savePrimaryScenario(user.id, inputs, results);
        console.log('Primary scenario auto-saved');
      } catch (error) {
        console.error('Failed to auto-save scenario:', error);
      } finally {
        setSaving(false);
      }
    }

    // Scroll to results
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="calculator" className="py-16 px-6 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto">
        <div className="card card-glow p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Income Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-white">Income & Tax</h2>
                  <p className="text-xs text-neutral-500">Your earnings and deductions</p>
                </div>
              </div>

              {/* Salary */}
              <div>
                <label htmlFor="salary" className="block text-sm text-neutral-400 mb-2">Annual Gross Salary</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">£</span>
                  <input
                    type="text"
                    id="salary"
                    value={formatSalary(inputs.salary)}
                    onChange={(e) => setInputs({ salary: parseSalary(e.target.value) })}
                    className="input-field w-full pl-9 pr-4 py-3.5"
                    inputMode="numeric"
                  />
                </div>
              </div>

              {/* Tax Region */}
              <div>
                <label htmlFor="taxRegion" className="block text-sm text-neutral-400 mb-2">Tax Region</label>
                <select
                  id="taxRegion"
                  value={inputs.taxRegion}
                  onChange={(e) => setInputs({ taxRegion: e.target.value as TaxRegion })}
                  className="input-field w-full px-4 py-3.5"
                >
                  <option value="england">England, Wales & Northern Ireland</option>
                  <option value="scotland">Scotland</option>
                </select>
              </div>

              {/* Student Loan */}
              <div>
                <label htmlFor="studentLoan" className="block text-sm text-neutral-400 mb-2">Student Loan</label>
                <select
                  id="studentLoan"
                  value={inputs.studentLoan}
                  onChange={(e) => setInputs({ studentLoan: e.target.value as StudentLoanPlan })}
                  className="input-field w-full px-4 py-3.5"
                >
                  <option value="none">No Student Loan</option>
                  <option value="plan1">Plan 1 (pre-2012)</option>
                  <option value="plan2">Plan 2 (post-2012)</option>
                  <option value="plan4">Plan 4 (Scotland)</option>
                  <option value="plan5">Plan 5 (post-2023)</option>
                  <option value="postgrad">Postgraduate Loan</option>
                </select>
              </div>

              {/* Pension */}
              <div>
                <label htmlFor="pensionPercent" className="block text-sm text-neutral-400 mb-2">
                  Pension Contribution <span className="text-neutral-600">(salary sacrifice)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="pensionPercent"
                    value={inputs.pensionPercent}
                    onChange={(e) => setInputs({ pensionPercent: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    step="0.5"
                    className="input-field w-full pl-4 pr-10 py-3.5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">%</span>
                </div>
              </div>
            </div>

            {/* Time Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-white">Your Time</h2>
                  <p className="text-xs text-neutral-500">Hours that count towards work</p>
                </div>
              </div>

              {/* Contract Hours & Work Days */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contractHours" className="block text-sm text-neutral-400 mb-2">Weekly Hours</label>
                  <input
                    type="number"
                    id="contractHours"
                    value={inputs.contractHours}
                    onChange={(e) => setInputs({ contractHours: parseFloat(e.target.value) || 0 })}
                    min="1"
                    max="80"
                    step="0.5"
                    className="input-field w-full px-4 py-3.5"
                  />
                </div>
                <div>
                  <label htmlFor="workDays" className="block text-sm text-neutral-400 mb-2">Days/Week</label>
                  <input
                    type="number"
                    id="workDays"
                    value={inputs.workDays}
                    onChange={(e) => setInputs({ workDays: parseInt(e.target.value, 10) || 0 })}
                    min="1"
                    max="7"
                    step="1"
                    className="input-field w-full px-4 py-3.5"
                  />
                </div>
              </div>

              {/* Commute */}
              <div>
                <label htmlFor="commuteMinutes" className="block text-sm text-neutral-400 mb-2">
                  Daily Commute <span className="text-neutral-600">(round trip)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="commuteMinutes"
                    value={inputs.commuteMinutes}
                    onChange={(e) => setInputs({ commuteMinutes: parseInt(e.target.value, 10) || 0 })}
                    min="0"
                    max="300"
                    step="5"
                    className="input-field w-full pl-4 pr-20 py-3.5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">
                    {formatMinutes(inputs.commuteMinutes)}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mt-1">UK average: 56 minutes</p>
              </div>

              {/* Break & Prep Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="unpaidBreak" className="block text-sm text-neutral-400 mb-2">Lunch Break</label>
                  <div className="relative">
                    <input
                      type="number"
                      id="unpaidBreak"
                      value={inputs.unpaidBreak}
                      onChange={(e) => setInputs({ unpaidBreak: parseInt(e.target.value, 10) || 0 })}
                      min="0"
                      max="120"
                      step="5"
                      className="input-field w-full pl-4 pr-20 py-3.5"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">
                      {formatMinutes(inputs.unpaidBreak)}
                    </span>
                  </div>
                </div>
                <div>
                  <label htmlFor="prepTime" className="block text-sm text-neutral-400 mb-2">Prep Time</label>
                  <div className="relative">
                    <input
                      type="number"
                      id="prepTime"
                      value={inputs.prepTime}
                      onChange={(e) => setInputs({ prepTime: parseInt(e.target.value, 10) || 0 })}
                      min="0"
                      max="120"
                      step="5"
                      className="input-field w-full pl-4 pr-20 py-3.5"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">
                      {formatMinutes(inputs.prepTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Holiday Days */}
              <div>
                <label htmlFor="holidayDays" className="block text-sm text-neutral-400 mb-2">
                  Annual Leave <span className="text-neutral-600">(inc. bank holidays)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="holidayDays"
                    value={inputs.holidayDays}
                    onChange={(e) => setInputs({ holidayDays: parseInt(e.target.value, 10) || 0 })}
                    min="0"
                    max="60"
                    step="1"
                    className="input-field w-full pl-4 pr-14 py-3.5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <details className="mt-8 pt-6 border-t border-white/5" open={showAdvanced} onToggle={(e) => setShowAdvanced(e.currentTarget.open)}>
            <summary className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">Advanced Options</span>
              <svg className="w-4 h-4 text-neutral-500 chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </summary>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div>
                <label htmlFor="commuteCost" className="block text-sm text-neutral-400 mb-2">Monthly Commute Cost</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">£</span>
                  <input
                    type="number"
                    id="commuteCost"
                    value={inputs.commuteCost}
                    onChange={(e) => setInputs({ commuteCost: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="10"
                    className="input-field w-full pl-9 pr-4 py-3.5"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="workClothes" className="block text-sm text-neutral-400 mb-2">Annual Work Clothing</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">£</span>
                  <input
                    type="number"
                    id="workClothes"
                    value={inputs.workClothes}
                    onChange={(e) => setInputs({ workClothes: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="50"
                    className="input-field w-full pl-9 pr-4 py-3.5"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="stressTax" className="block text-sm text-neutral-400 mb-2">
                  Stress Factor: <span className="text-[#10b981]">{inputs.stressTax}%</span>
                </label>
                <input
                  type="range"
                  id="stressTax"
                  value={inputs.stressTax}
                  onChange={(e) => setInputs({ stressTax: parseInt(e.target.value, 10) || 0 })}
                  min="0"
                  max="20"
                  step="1"
                  className="mt-4"
                />
                <div className="flex justify-between text-xs text-neutral-600 mt-2">
                  <span>Love my job</span>
                  <span>Hate it</span>
                </div>
              </div>
            </div>
          </details>

          <button
            onClick={handleCalculate}
            type="button"
            disabled={saving}
            className="btn-primary w-full mt-8 py-4 text-base font-semibold disabled:opacity-80"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              'Calculate True Hourly Wage'
            )}
          </button>
          {user && (
            <p className="text-xs text-neutral-500 text-center mt-2">
              Your data will be auto-saved to your dashboard
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
