'use client';

import { useState, useMemo } from 'react';
import { calculateStudentLoans, LOAN_PLANS, COMMON_COMBINATIONS, StudentLoanInputs, LoanPlan } from '@/lib/student-loan-calculator';
import { useCalculatorStore } from '@/lib/store';
import SaveToReportButton from './SaveToReportButton';

export default function StudentLoanCalculator() {
  const { inputs: mainInputs } = useCalculatorStore();

  const [inputs, setInputs] = useState<StudentLoanInputs>({
    grossSalary: mainInputs?.salary || 35000,
    loans: [
      { plan: 'plan1', balance: 0, enabled: false },
      { plan: 'plan2', balance: 45000, enabled: true },
      { plan: 'plan4', balance: 0, enabled: false },
      { plan: 'plan5', balance: 0, enabled: false },
      { plan: 'postgrad', balance: 0, enabled: false },
    ],
    salaryGrowthRate: 2.5,
    includeInflation: true,
  });

  const [showProjections, setShowProjections] = useState(false);

  const results = useMemo(() => calculateStudentLoans(inputs), [inputs]);

  const updateLoan = (plan: LoanPlan, updates: Partial<{ balance: number; enabled: boolean }>) => {
    setInputs(prev => ({
      ...prev,
      loans: prev.loans.map(l =>
        l.plan === plan ? { ...l, ...updates } : l
      ),
    }));
  };

  const selectCombination = (combinationId: string) => {
    const combo = COMMON_COMBINATIONS.find(c => c.id === combinationId);
    if (combo) {
      setInputs(prev => ({
        ...prev,
        loans: prev.loans.map(l => ({
          ...l,
          enabled: combo.loans.includes(l.plan),
          balance: combo.loans.includes(l.plan) ? (l.balance || 40000) : 0,
        })),
      }));
    }
  };

  const formatCurrency = (value: number) => `£${value.toLocaleString()}`;
  const enabledLoans = inputs.loans.filter(l => l.enabled);

  return (
    <section id="student-loans" className="py-20 px-4 bg-gradient-to-b from-[#111] to-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <span className="text-blue-400 text-sm font-medium">Student Loans</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Multiple Student Loan Calculator
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto mb-4">
            Have Plan 1, Plan 2, and a Postgraduate loan? See how they all stack up,
            when they'll be repaid (or written off), and the true impact on your take-home pay.
          </p>
          <SaveToReportButton
            calculatorType="student-loans"
            inputs={inputs}
            results={results}
            getDescription={() => `£${inputs.grossSalary.toLocaleString()} salary, ${enabledLoans.length} loan(s)`}
          />
        </div>

        {/* Quick Select */}
        <div className="card card-glow p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Select Your Situation</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {COMMON_COMBINATIONS.map(combo => (
              <button
                key={combo.id}
                onClick={() => selectCombination(combo.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  combo.loans.every(p => inputs.loans.find(l => l.plan === p)?.enabled) &&
                  inputs.loans.filter(l => l.enabled).length === combo.loans.length
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-[#1a1a1a] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-sm font-medium text-white">{combo.name}</div>
                <div className="text-xs text-neutral-500 mt-1">{combo.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            {/* Salary */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Income</h3>
              <div className="mb-4">
                <label className="block text-sm text-neutral-400 mb-2">Gross Annual Salary (£)</label>
                <input
                  type="number"
                  value={inputs.grossSalary}
                  onChange={e => setInputs(prev => ({ ...prev, grossSalary: parseFloat(e.target.value) || 0 }))}
                  className="input-field w-full px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Expected Salary Growth: {inputs.salaryGrowthRate}%/year
                </label>
                <input
                  type="range"
                  value={inputs.salaryGrowthRate}
                  onChange={e => setInputs(prev => ({ ...prev, salaryGrowthRate: parseFloat(e.target.value) }))}
                  className="w-full accent-blue-500"
                  min="0"
                  max="8"
                  step="0.5"
                />
              </div>
            </div>

            {/* Loan Details */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Loans</h3>
              <div className="space-y-4">
                {inputs.loans.map(loan => {
                  const planDetails = LOAN_PLANS[loan.plan];
                  return (
                    <div
                      key={loan.plan}
                      className={`p-4 rounded-xl border transition-all ${
                        loan.enabled
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-[#1a1a1a] border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={loan.enabled}
                            onChange={e => updateLoan(loan.plan, { enabled: e.target.checked })}
                            className="w-5 h-5 rounded border-white/20 bg-[#1a1a1a] accent-blue-500"
                          />
                          <div>
                            <div className="text-white font-medium">{planDetails.name}</div>
                            <div className="text-xs text-neutral-500">{planDetails.description}</div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-neutral-500">
                          <div>Threshold: {formatCurrency(planDetails.threshold)}</div>
                          <div>Rate: {(planDetails.rate * 100)}%</div>
                        </div>
                      </div>

                      {loan.enabled && (
                        <div className="mt-3">
                          <label className="block text-xs text-neutral-500 mb-1">Current Balance (£)</label>
                          <input
                            type="number"
                            value={loan.balance}
                            onChange={e => updateLoan(loan.plan, { balance: parseFloat(e.target.value) || 0 })}
                            className="input-field w-full px-3 py-2 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thresholds Reference */}
            <div className="card p-6">
              <h3 className="text-sm font-medium text-neutral-400 mb-3">2024/25 Thresholds</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(LOAN_PLANS).map(([key, plan]) => (
                  <div key={key} className="flex justify-between p-2 bg-[#1a1a1a] rounded-lg">
                    <span className="text-neutral-400">{plan.name}</span>
                    <span className="text-white">{formatCurrency(plan.threshold)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {formatCurrency(results.summary.monthlyRepayment)}
                </div>
                <div className="text-sm text-neutral-400">Monthly Repayment</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {results.summary.yearsToRepay === 'never' ? '30+' : results.summary.yearsToRepay}
                </div>
                <div className="text-sm text-neutral-400">Years to Repay</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-green-400">
                  {formatCurrency(results.summary.totalRepaid)}
                </div>
                <div className="text-sm text-neutral-400">Total You'll Repay</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {formatCurrency(results.summary.totalWrittenOff)}
                </div>
                <div className="text-sm text-neutral-400">Written Off</div>
              </div>
            </div>

            {/* Effective Tax Rate */}
            <div className="card card-glow p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Impact on Your Pay</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-400">Student Loan "Tax"</span>
                    <span className="text-blue-400 font-semibold">{results.summary.effectiveTaxRate}%</span>
                  </div>
                  <div className="h-4 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, results.summary.effectiveTaxRate * 5)}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-neutral-400">
                On top of Income Tax and NI, your student loans add an extra {results.summary.effectiveTaxRate}%
                effective tax rate on earnings above the threshold{enabledLoans.length > 1 ? 's' : ''}.
              </p>

              {enabledLoans.length > 1 && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-300">
                    ⚠️ With multiple loans, you pay {enabledLoans.length * 9}% (9% per loan) on income above
                    each threshold. This stacks!
                  </p>
                </div>
              )}
            </div>

            {/* By Plan Breakdown */}
            {enabledLoans.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Breakdown by Plan</h3>
                <div className="space-y-4">
                  {enabledLoans.map(loan => {
                    const planDetails = LOAN_PLANS[loan.plan];
                    const planResults = results.byPlan[loan.plan];
                    if (!planResults) return null;

                    return (
                      <div key={loan.plan} className="p-4 rounded-xl bg-[#1a1a1a]">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-white font-medium">{planDetails.name}</div>
                            <div className="text-xs text-neutral-500">Balance: {formatCurrency(loan.balance)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-blue-400 font-semibold">
                              {formatCurrency(planResults.monthlyRepayment)}/mo
                            </div>
                            <div className="text-xs text-neutral-500">
                              {planResults.yearsToRepay === 'never' ? 'Written off' : `${planResults.yearsToRepay} years`}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 bg-[#0d0d0d] rounded-lg">
                            <div className="text-neutral-500">Repay</div>
                            <div className="text-green-400">{formatCurrency(planResults.totalRepaid)}</div>
                          </div>
                          <div className="p-2 bg-[#0d0d0d] rounded-lg">
                            <div className="text-neutral-500">Interest</div>
                            <div className="text-red-400">{formatCurrency(planResults.interestPaid)}</div>
                          </div>
                          <div className="p-2 bg-[#0d0d0d] rounded-lg">
                            <div className="text-neutral-500">Written Off</div>
                            <div className="text-orange-400">{formatCurrency(planResults.writtenOff)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interest Warning */}
            {results.summary.totalInterestPaid > 10000 && (
              <div className="card p-6 border-red-500/30 bg-red-500/5">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Interest Warning</h3>
                <p className="text-sm text-neutral-300 mb-2">
                  You're projected to pay {formatCurrency(results.summary.totalInterestPaid)} in interest alone.
                </p>
                <p className="text-xs text-neutral-500">
                  For most Plan 2 borrowers, this is normal - the loan is designed so most people
                  won't fully repay. Focus on other financial goals rather than overpaying.
                </p>
              </div>
            )}

            {/* Insights */}
            {results.insights.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Insights</h3>
                <div className="space-y-2">
                  {results.insights.map((insight, idx) => (
                    <p key={idx} className="text-sm text-neutral-300">{insight}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Should You Overpay? */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Should You Overpay?</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  <span className="text-neutral-300">
                    <strong className="text-white">Plan 2 with £40k+ balance:</strong> You'll likely never repay in full.
                    Overpaying just gives SLC money you'd never have paid anyway.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-neutral-300">
                    <strong className="text-white">Plan 1 with low balance:</strong> If you'll definitely repay before
                    write-off, overpaying saves interest.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500">?</span>
                  <span className="text-neutral-300">
                    <strong className="text-white">High earner (£50k+):</strong> Calculate whether you'll repay in full.
                    If yes, overpaying may make sense.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Year-by-Year Projections */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowProjections(!showProjections)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            {showProjections ? '▲ Hide' : '▼ Show'} Year-by-Year Projections
          </button>
        </div>

        {showProjections && (
          <div className="mt-6 card p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-neutral-400 border-b border-white/10">
                  <th className="text-left py-3 px-2">Year</th>
                  <th className="text-right py-3 px-2">Salary</th>
                  <th className="text-right py-3 px-2">Repayment</th>
                  {enabledLoans.map(loan => (
                    <th key={loan.plan} className="text-right py-3 px-2">{LOAN_PLANS[loan.plan].name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.projections.filter((_, i) => i % 5 === 0 || i === results.projections.length - 1).map(proj => (
                  <tr key={proj.year} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-2 text-white">{proj.year}</td>
                    <td className="py-3 px-2 text-right text-neutral-300">{formatCurrency(proj.salary)}</td>
                    <td className="py-3 px-2 text-right text-blue-400">{formatCurrency(proj.totalRepayment)}</td>
                    {enabledLoans.map(loan => (
                      <td key={loan.plan} className="py-3 px-2 text-right text-neutral-300">
                        {formatCurrency(Math.round(proj.balances[loan.plan]))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
