'use client';

import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { calculateFireProgress, formatCurrency } from '@/lib/calculator';
import type { FireProgress as FireProgressType } from '@/types/calculator';

export default function FireProgress() {
  const { results } = useCalculatorStore();
  const [currentSavings, setCurrentSavings] = useState(25000);
  const [annualExpenses, setAnnualExpenses] = useState(30000);
  const [fireProgress, setFireProgress] = useState<FireProgressType | null>(null);

  useEffect(() => {
    if (results) {
      const progress = calculateFireProgress(currentSavings, annualExpenses);
      setFireProgress(progress);
    }
  }, [results, currentSavings, annualExpenses]);

  if (!results) {
    return (
      <section id="fireProgress" className="py-16 px-6 bg-[#050505]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">FIRE Progress Tracker</h2>
            <p className="text-neutral-400">Track your journey to Financial Independence</p>
          </div>
          <div className="card p-8">
            <p className="text-neutral-500 text-center py-8">Calculate your wage first to see FIRE progress</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="fireProgress" className="py-16 px-6 bg-[#050505]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">FIRE Progress Tracker</h2>
          <p className="text-neutral-400">Track your journey to Financial Independence</p>
        </div>

        <div className="card p-8">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="fireCurrentSavings" className="block text-sm text-neutral-400 mb-2">Current Savings/Investments</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">£</span>
                <input
                  type="number"
                  id="fireCurrentSavings"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1000"
                  className="input-field w-full pl-9 pr-4 py-3.5"
                />
              </div>
            </div>
            <div>
              <label htmlFor="fireAnnualExpenses" className="block text-sm text-neutral-400 mb-2">Annual Expenses</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">£</span>
                <input
                  type="number"
                  id="fireAnnualExpenses"
                  value={annualExpenses}
                  onChange={(e) => setAnnualExpenses(parseFloat(e.target.value) || 1000)}
                  min="1000"
                  step="1000"
                  className="input-field w-full pl-9 pr-4 py-3.5"
                />
              </div>
            </div>
          </div>

          {fireProgress && (
            <div className="space-y-6 section-enter">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-neutral-400">Progress to FIRE</span>
                  <span className="text-sm font-semibold text-[#10b981]">{fireProgress.percentComplete.toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#10b981] to-[#34d399] transition-all duration-500"
                    style={{ width: `${Math.min(fireProgress.percentComplete, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-neutral-600 mt-1">
                  <span>{formatCurrency(currentSavings)}</span>
                  <span>FIRE Number: {formatCurrency(fireProgress.fireNumber)}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-5 bg-[#1a1a1a]/50 rounded-xl border border-white/5">
                  <p className="text-xs text-neutral-500 mb-1">FIRE Number</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(fireProgress.fireNumber)}</p>
                  <p className="text-xs text-neutral-600 mt-1">25x annual expenses</p>
                </div>
                <div className="p-5 bg-[#10b981]/10 rounded-xl border border-[#10b981]/20">
                  <p className="text-xs text-[#10b981]/70 mb-1">Amount Remaining</p>
                  <p className="text-2xl font-bold text-[#10b981]">{formatCurrency(fireProgress.amountRemaining)}</p>
                </div>
                <div className="p-5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <p className="text-xs text-amber-400/70 mb-1">Savings Rate Needed</p>
                  <p className="text-2xl font-bold text-amber-400">{fireProgress.savingsRateNeeded.toFixed(0)}%</p>
                  <p className="text-xs text-neutral-600 mt-1">to retire in 15 years</p>
                </div>
              </div>

              {/* Monthly Passive Income */}
              <div className="p-6 bg-gradient-to-r from-[#10b981]/5 to-transparent rounded-xl border border-[#10b981]/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400">Current Passive Income Potential</p>
                    <p className="text-xs text-neutral-600">Based on 4% safe withdrawal rate</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#10b981]">{formatCurrency(fireProgress.currentPassiveIncome)}<span className="text-sm font-normal text-neutral-500">/year</span></p>
                    <p className="text-sm text-neutral-400">{formatCurrency(fireProgress.currentPassiveIncome / 12)}/month</p>
                  </div>
                </div>
              </div>

              {/* Freedom Score */}
              <div className="p-6 bg-[#1a1a1a]/30 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#050505]">{Math.min(Math.round(fireProgress.percentComplete), 100)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white mb-1">Freedom Score</p>
                    <p className="text-sm text-neutral-400">
                      {fireProgress.percentComplete < 25 && "Just getting started - every pound saved is progress!"}
                      {fireProgress.percentComplete >= 25 && fireProgress.percentComplete < 50 && "Making solid progress - you're building momentum!"}
                      {fireProgress.percentComplete >= 50 && fireProgress.percentComplete < 75 && "Over halfway there - the finish line is in sight!"}
                      {fireProgress.percentComplete >= 75 && fireProgress.percentComplete < 100 && "Almost there - you can taste the freedom!"}
                      {fireProgress.percentComplete >= 100 && "Congratulations! You've achieved financial independence!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="text-xs text-neutral-600 p-4 bg-[#0a0a0a]/50 rounded-lg">
                <p className="mb-2"><strong className="text-neutral-400">FIRE Basics:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>FIRE Number = 25× your annual expenses (based on the 4% rule)</li>
                  <li>Once reached, you can withdraw 4% annually without depleting your wealth</li>
                  <li>Increasing your savings rate has a bigger impact than increasing income</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
