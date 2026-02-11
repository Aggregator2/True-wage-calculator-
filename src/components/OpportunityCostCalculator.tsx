'use client';

import { useState } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { calculateOpportunityCost, formatCurrency, formatHours } from '@/lib/calculator';
import { saveComparisonScenario } from '@/lib/scenarios';
import type { OpportunityCostResult } from '@/types/calculator';

export default function OpportunityCostCalculator() {
  const { results, user } = useCalculatorStore();
  const [amount, setAmount] = useState(100);
  const [currentAge, setCurrentAge] = useState(30);
  const [retireAge, setRetireAge] = useState(65);
  const [result, setResult] = useState<OpportunityCostResult | null>(null);

  const handleCalculate = async () => {
    const trueHourlyRate = results?.trueHourlyRate;
    const calculatedResult = calculateOpportunityCost(amount, currentAge, retireAge, trueHourlyRate);
    setResult(calculatedResult);

    // Auto-save if user is logged in
    if (user && calculatedResult) {
      try {
        await saveComparisonScenario(
          user.id,
          `£${amount} opportunity cost`,
          'opportunity',
          { inputs: { amount, currentAge, retireAge, trueHourlyRate }, results: calculatedResult },
          `Retirement age ${retireAge}`
        );
        console.log('Opportunity cost auto-saved');
      } catch (error) {
        console.error('Failed to auto-save opportunity cost:', error);
      }
    }
  };

  return (
    <section id="sp500Calculator" className="py-16 px-6 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="tag mb-4 mx-auto w-fit">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
            </svg>
            Opportunity Cost Calculator
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">What&apos;s That Purchase Really Costing You?</h2>
          <p className="text-neutral-400 max-w-xl mx-auto">See how today&apos;s spending affects your future wealth based on S&P 500 historical returns</p>
        </div>

        <div className="card p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="spAmount" className="block text-sm text-neutral-400 mb-2">Purchase Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">£</span>
                <input
                  type="number"
                  id="spAmount"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  min="1"
                  step="10"
                  className="input-field w-full pl-9 pr-4 py-3.5"
                />
              </div>
            </div>
            <div>
              <label htmlFor="spCurrentAge" className="block text-sm text-neutral-400 mb-2">Your Current Age</label>
              <input
                type="number"
                id="spCurrentAge"
                value={currentAge}
                onChange={(e) => setCurrentAge(parseInt(e.target.value, 10) || 18)}
                min="18"
                max="80"
                className="input-field w-full px-4 py-3.5"
              />
            </div>
            <div>
              <label htmlFor="spRetireAge" className="block text-sm text-neutral-400 mb-2">Retirement Age</label>
              <input
                type="number"
                id="spRetireAge"
                value={retireAge}
                onChange={(e) => setRetireAge(parseInt(e.target.value, 10) || 65)}
                min="40"
                max="90"
                className="input-field w-full px-4 py-3.5"
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            type="button"
            className="btn-primary w-full py-4 text-base font-semibold mb-4"
          >
            Calculate Retirement Impact
          </button>

          {result ? (
            <div className="space-y-6 section-enter">
              {/* Main Result */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-6 bg-[#1a1a1a]/50 rounded-xl border border-white/5">
                  <p className="text-sm text-neutral-500 mb-1">Today&apos;s Cost</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(result.todayCost)}</p>
                </div>
                <div className="p-6 bg-[#10b981]/10 rounded-xl border border-[#10b981]/20">
                  <p className="text-sm text-[#10b981]/70 mb-1">Future Value at Retirement</p>
                  <p className="text-3xl font-bold text-[#10b981]">{formatCurrency(result.futureValue)}</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#1a1a1a]/30 rounded-lg">
                  <p className="text-xs text-neutral-500 mb-1">Growth Multiplier</p>
                  <p className="text-lg font-semibold text-white">{result.growthMultiplier.toFixed(1)}x</p>
                </div>
                <div className="p-4 bg-[#1a1a1a]/30 rounded-lg">
                  <p className="text-xs text-neutral-500 mb-1">Years to Grow</p>
                  <p className="text-lg font-semibold text-white">{result.yearsToGrow} years</p>
                </div>
                <div className="p-4 bg-[#1a1a1a]/30 rounded-lg">
                  <p className="text-xs text-neutral-500 mb-1">Annual Retirement Income (4% rule)</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(result.annualRetirementIncome)}</p>
                </div>
              </div>

              {/* Hours of Life */}
              {result.hoursOfLife && (
                <div className="p-6 bg-amber-500/5 rounded-xl border border-amber-500/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-amber-400/70">This purchase costs you</p>
                      <p className="text-2xl font-bold text-amber-400">{formatHours(result.hoursOfLife)} of your life</p>
                      <p className="text-xs text-neutral-500 mt-1">Based on your true hourly wage</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="text-xs text-neutral-600 p-4 bg-[#0a0a0a]/50 rounded-lg">
                <p className="mb-2"><strong className="text-neutral-400">How this works:</strong></p>
                <p>We calculate the future value using the S&P 500&apos;s historical average return of ~10% per year (7% after inflation). The 4% rule suggests you can safely withdraw 4% of your portfolio annually in retirement without running out of money.</p>
              </div>
            </div>
          ) : (
            <p className="text-neutral-500 text-center py-8">Enter an amount and click calculate to see the impact</p>
          )}
        </div>
      </div>
    </section>
  );
}
