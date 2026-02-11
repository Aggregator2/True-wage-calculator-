'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { calculateAllDeductions, calculateTrueHours } from '@/lib/calculator';
import CountUpNumber from '@/components/ui/CountUpNumber';
import AnimatedEntry from '@/components/ui/AnimatedEntry';

export default function MiniCalculator() {
  const [salary, setSalary] = useState(35000);
  const [hours, setHours] = useState(37.5);
  const [commute, setCommute] = useState(56);
  const [calculated, setCalculated] = useState(false);

  const getResults = useCallback(() => {
    const tax = calculateAllDeductions(salary, 'england', 'none', 5);
    const time = calculateTrueHours(hours, commute, 30, 30, 5, 28);
    const apparent = salary / time.annualContractHours;
    const trueRate = tax.netSalary / time.annualTotalHours;
    return { apparent, trueRate, percentDiff: ((trueRate / apparent) - 1) * 100 };
  }, [salary, hours, commute]);

  const handleCalculate = () => {
    setCalculated(true);
  };

  const results = calculated ? getResults() : null;

  const formatSalary = (val: number) => val.toLocaleString('en-GB');
  const parseSalary = (val: string) => parseInt(val.replace(/,/g, ''), 10) || 0;

  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <AnimatedEntry>
          <div className="text-center mb-10">
            <p className="text-emerald-400 text-sm font-medium mb-3">Quick Calculator</p>
            <h2 className="heading-lg text-3xl md:text-4xl text-white mb-3">
              See the difference in 30 seconds
            </h2>
            <p className="text-zinc-400 text-sm">Enter three numbers. The result might surprise you.</p>
          </div>
        </AnimatedEntry>

        <AnimatedEntry delay={60}>
          <div className="card p-6 md:p-8 border-zinc-800">
            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              <div>
                <label htmlFor="mini-salary" className="block text-sm text-zinc-400 mb-2">Annual Salary</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">£</span>
                  <input
                    id="mini-salary"
                    type="text"
                    value={formatSalary(salary)}
                    onChange={(e) => { setSalary(parseSalary(e.target.value)); setCalculated(false); }}
                    className="input-field w-full pl-8 pr-4 py-3 text-base"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="mini-hours" className="block text-sm text-zinc-400 mb-2">Weekly Hours</label>
                <input
                  id="mini-hours"
                  type="number"
                  value={hours}
                  onChange={(e) => { setHours(parseFloat(e.target.value) || 0); setCalculated(false); }}
                  min="1"
                  max="80"
                  step="0.5"
                  className="input-field w-full px-4 py-3 text-base"
                />
              </div>
              <div>
                <label htmlFor="mini-commute" className="block text-sm text-zinc-400 mb-2">Daily Commute (mins)</label>
                <input
                  id="mini-commute"
                  type="number"
                  value={commute}
                  onChange={(e) => { setCommute(parseInt(e.target.value) || 0); setCalculated(false); }}
                  min="0"
                  max="300"
                  step="5"
                  className="input-field w-full px-4 py-3 text-base"
                />
              </div>
            </div>

            {!calculated ? (
              <button
                onClick={handleCalculate}
                className="btn-primary w-full py-3.5 text-base font-semibold"
              >
                Show My True Rate
              </button>
            ) : results ? (
              <div className="space-y-5">
                {/* Results */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/60 rounded-xl p-4 text-center">
                    <p className="stat-label mb-1">Apparent Rate</p>
                    <p className="text-2xl font-bold text-zinc-300">
                      <CountUpNumber value={results.apparent} prefix="£" decimals={2} />
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">per hour</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                    <p className="stat-label mb-1 text-emerald-500/70">True Rate</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      <CountUpNumber value={results.trueRate} prefix="£" decimals={2} />
                    </p>
                    <p className="text-xs text-emerald-500/60 mt-1">per hour</p>
                  </div>
                </div>

                {/* Delta */}
                <div className="text-center">
                  <p className="text-sm text-zinc-400">
                    That&apos;s <span className="text-amber-400 font-semibold">{Math.abs(results.percentDiff).toFixed(0)}% less</span> than you thought.
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href="/calculator"
                  className="btn-primary w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2"
                >
                  See All 13 Factors
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ) : null}
          </div>
        </AnimatedEntry>
      </div>
    </section>
  );
}
