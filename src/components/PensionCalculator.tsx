'use client';

import { useState, useMemo } from 'react';
import { calculatePension, PENSION_SCHEMES, PENSION_TYPES, SIPP_PROVIDERS, compareFees, PensionInputs } from '@/lib/pension-calculator';
import { useCalculatorStore } from '@/lib/store';
import SaveToReportButton from './SaveToReportButton';

export default function PensionCalculator() {
  const { inputs: mainInputs } = useCalculatorStore();
  const [inputs, setInputs] = useState<PensionInputs>({
    grossSalary: mainInputs?.salary || 45000,
    employeeContributionPercent: 5,
    employerMatchPercent: 5,
    employerMatchCap: 5,
    currentAge: 30,
    retirementAge: 67,
    currentPensionPot: 20000,
    expectedReturn: 7,
    salaryGrowthRate: 2.5,
    includeStatePension: true,
    salaryExchange: false,
  });
  const [selectedScheme, setSelectedScheme] = useState('matched_5');
  const [showProjections, setShowProjections] = useState(false);
  const [showPensionTypes, setShowPensionTypes] = useState(false);
  const [selectedPensionType, setSelectedPensionType] = useState<string | null>(null);

  const results = useMemo(() => calculatePension(inputs), [inputs]);

  const updateInput = <K extends keyof PensionInputs>(key: K, value: PensionInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleSchemeSelect = (schemeId: string) => {
    setSelectedScheme(schemeId);
    const scheme = PENSION_SCHEMES.find(s => s.id === schemeId);
    if (scheme && schemeId !== 'custom') {
      setInputs(prev => ({
        ...prev,
        employeeContributionPercent: scheme.employeePercent,
        employerMatchPercent: scheme.employerPercent,
        employerMatchCap: scheme.employerCap,
      }));
    }
  };

  const formatCurrency = (value: number) => `£${value.toLocaleString()}`;
  const formatLargeCurrency = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
    return `£${value.toLocaleString()}`;
  };

  return (
    <section id="pension" className="py-20 px-4 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <span className="text-emerald-400 text-sm font-medium">Pension Matching</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Don't Leave Free Money on the Table
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto mb-4">
            See how employer pension matching can dramatically boost your retirement pot.
            Most people don't realise how much they're missing out on.
          </p>
          <SaveToReportButton
            calculatorType="pension"
            inputs={inputs}
            results={results}
            getDescription={() => `${inputs.employeeContributionPercent}% employee + ${inputs.employerMatchPercent}% employer match`}
          />
        </div>

        {/* Input Form */}
        <div className="card card-glow p-6 md:p-8 mb-8">
          {/* Salary & Age */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Annual Salary (£)</label>
              <input
                type="number"
                value={inputs.grossSalary}
                onChange={e => updateInput('grossSalary', parseFloat(e.target.value) || 0)}
                className="input-field w-full px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Current Age</label>
              <input
                type="number"
                value={inputs.currentAge}
                onChange={e => updateInput('currentAge', parseInt(e.target.value) || 25)}
                min={18}
                max={66}
                className="input-field w-full px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Retirement Age</label>
              <input
                type="number"
                value={inputs.retirementAge}
                onChange={e => updateInput('retirementAge', parseInt(e.target.value) || 67)}
                min={inputs.currentAge + 1}
                max={75}
                className="input-field w-full px-4 py-3"
              />
            </div>
          </div>

          {/* Pension Scheme Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🏦</span>
              Your Pension Scheme
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {PENSION_SCHEMES.filter(s => s.id !== 'custom').map(scheme => (
                <button
                  key={scheme.id}
                  onClick={() => handleSchemeSelect(scheme.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedScheme === scheme.id
                      ? 'bg-emerald-500/20 border-emerald-500/50'
                      : 'bg-[#1a1a1a] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`text-sm font-medium ${selectedScheme === scheme.id ? 'text-emerald-300' : 'text-white'}`}>
                    {scheme.name}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {scheme.employeePercent}% you / {scheme.employerPercent}% employer
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => handleSchemeSelect('custom')}
              className={`w-full p-3 rounded-xl border text-left transition-all ${
                selectedScheme === 'custom'
                  ? 'bg-emerald-500/20 border-emerald-500/50'
                  : 'bg-[#1a1a1a] border-white/10 hover:border-white/20'
              }`}
            >
              <div className={`text-sm font-medium ${selectedScheme === 'custom' ? 'text-emerald-300' : 'text-white'}`}>
                ⚙️ Custom Rates
              </div>
              <div className="text-xs text-neutral-500 mt-1">Enter your own contribution percentages</div>
            </button>
          </div>

          {/* Contribution Rates */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Your Contribution: {inputs.employeeContributionPercent}%
              </label>
              <input
                type="range"
                value={inputs.employeeContributionPercent}
                onChange={e => {
                  updateInput('employeeContributionPercent', parseInt(e.target.value));
                  setSelectedScheme('custom');
                }}
                className="w-full accent-emerald-500"
                min="0"
                max="40"
                step="1"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>0%</span>
                <span className="text-emerald-400">{formatCurrency(inputs.grossSalary * inputs.employeeContributionPercent / 100)}/yr</span>
                <span>40%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Employer Matches: {inputs.employerMatchPercent}%
              </label>
              <input
                type="range"
                value={inputs.employerMatchPercent}
                onChange={e => {
                  updateInput('employerMatchPercent', parseInt(e.target.value));
                  setSelectedScheme('custom');
                }}
                className="w-full accent-emerald-500"
                min="0"
                max="20"
                step="1"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Match Cap: {inputs.employerMatchCap}%
              </label>
              <input
                type="range"
                value={inputs.employerMatchCap}
                onChange={e => {
                  updateInput('employerMatchCap', parseInt(e.target.value));
                  setSelectedScheme('custom');
                }}
                className="w-full accent-emerald-500"
                min="0"
                max="20"
                step="1"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Current Pension Pot (£)</label>
              <input
                type="number"
                value={inputs.currentPensionPot}
                onChange={e => updateInput('currentPensionPot', parseFloat(e.target.value) || 0)}
                className="input-field w-full px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Expected Annual Return (%)</label>
              <input
                type="number"
                value={inputs.expectedReturn}
                onChange={e => updateInput('expectedReturn', parseFloat(e.target.value) || 5)}
                min={0}
                max={15}
                step={0.5}
                className="input-field w-full px-4 py-3"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-6 mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={inputs.salaryExchange}
                onChange={e => updateInput('salaryExchange', e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-[#1a1a1a] accent-emerald-500"
              />
              <div>
                <span className="text-white">Salary Sacrifice</span>
                <span className="text-xs text-neutral-500 block">Save NI as well as tax</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={inputs.includeStatePension}
                onChange={e => updateInput('includeStatePension', e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-[#1a1a1a] accent-emerald-500"
              />
              <div>
                <span className="text-white">Include State Pension</span>
                <span className="text-xs text-neutral-500 block">£{Math.round(11503).toLocaleString()}/yr at 67</span>
              </div>
            </label>
          </div>

          {/* Salary Growth */}
          <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10">
            <label className="block text-sm text-neutral-400 mb-2">
              Expected Salary Growth: {inputs.salaryGrowthRate}% per year
            </label>
            <input
              type="range"
              value={inputs.salaryGrowthRate}
              onChange={e => updateInput('salaryGrowthRate', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
              min="0"
              max="8"
              step="0.5"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>0% (no growth)</span>
              <span>8% (rapid career growth)</span>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-1">
              {formatLargeCurrency(results.summary.projectedPotAtRetirement)}
            </div>
            <div className="text-sm text-neutral-400">Projected Pot at {inputs.retirementAge}</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {formatCurrency(results.summary.monthlyPensionIncome)}
            </div>
            <div className="text-sm text-neutral-400">Monthly Pension Income</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-1">
              {formatLargeCurrency(results.scenarios.difference)}
            </div>
            <div className="text-sm text-neutral-400">Free Money from Employer</div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-1">
              {results.summary.effectiveReturn}x
            </div>
            <div className="text-sm text-neutral-400">Return on Your Contributions</div>
          </div>
        </div>

        {/* Employer Match Comparison */}
        <div className="card card-glow p-6 md:p-8 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">The Power of Employer Matching</h3>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Visual Bar Chart */}
            <div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-400">Without Employer Match</span>
                    <span className="text-white">{formatLargeCurrency(results.scenarios.noMatch)}</span>
                  </div>
                  <div className="h-8 bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neutral-600 to-neutral-500 rounded-lg transition-all duration-500"
                      style={{ width: `${Math.min(100, (results.scenarios.noMatch / results.scenarios.withMatch) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-400">With Employer Match</span>
                    <span className="text-emerald-400 font-semibold">{formatLargeCurrency(results.scenarios.withMatch)}</span>
                  </div>
                  <div className="h-8 bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-lg w-full" />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-2xl font-bold text-emerald-400 mb-1">
                  +{formatLargeCurrency(results.scenarios.difference)}
                </div>
                <div className="text-sm text-emerald-300">
                  Extra retirement savings from employer match ({results.scenarios.matchAsPercentOfPot}% of total pot)
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10">
                <div className="text-sm text-neutral-400 mb-1">Your Total Contributions</div>
                <div className="text-xl font-bold text-white">
                  {formatLargeCurrency(results.summary.totalEmployeeContributions)}
                </div>
                <div className="text-xs text-neutral-500">
                  over {inputs.retirementAge - inputs.currentAge} years
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10">
                <div className="text-sm text-neutral-400 mb-1">Employer's Total Contributions</div>
                <div className="text-xl font-bold text-emerald-400">
                  {formatLargeCurrency(results.summary.totalEmployerContributions)}
                </div>
                <div className="text-xs text-emerald-500">
                  Free money you'd miss without matching!
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10">
                <div className="text-sm text-neutral-400 mb-1">Tax Relief Saved</div>
                <div className="text-xl font-bold text-purple-400">
                  {formatLargeCurrency(results.summary.totalTaxSaved)}
                </div>
                {inputs.salaryExchange && results.summary.totalNiSaved > 0 && (
                  <div className="text-xs text-purple-500">
                    + {formatCurrency(results.summary.totalNiSaved)} NI saved via salary sacrifice
                  </div>
                )}
              </div>

              {inputs.includeStatePension && inputs.retirementAge >= 67 && (
                <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10">
                  <div className="text-sm text-neutral-400 mb-1">Total Annual Retirement Income</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {formatCurrency(results.summary.totalAnnualRetirementIncome)}
                  </div>
                  <div className="text-xs text-yellow-500">
                    Includes £{Math.round(results.summary.statePensionAnnual).toLocaleString()} state pension
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insights */}
        {results.insights.length > 0 && (
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Insights & Tips</h3>
            <div className="space-y-3">
              {results.insights.map((insight, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#1a1a1a] text-sm text-neutral-300">
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Year-by-Year Projections Toggle */}
        <div className="text-center">
          <button
            onClick={() => setShowProjections(!showProjections)}
            className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
          >
            {showProjections ? '▲ Hide' : '▼ Show'} Year-by-Year Projections
          </button>
        </div>

        {/* Projections Table */}
        {showProjections && (
          <div className="mt-6 card p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-neutral-400 border-b border-white/10">
                  <th className="text-left py-3 px-2">Age</th>
                  <th className="text-right py-3 px-2">Salary</th>
                  <th className="text-right py-3 px-2">You Pay</th>
                  <th className="text-right py-3 px-2">Employer Pays</th>
                  <th className="text-right py-3 px-2">Growth</th>
                  <th className="text-right py-3 px-2">Pot Value</th>
                </tr>
              </thead>
              <tbody>
                {results.projections.filter((_, i) => i % 5 === 0 || i === results.projections.length - 1).map(proj => (
                  <tr key={proj.year} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-2 text-white">{proj.age}</td>
                    <td className="py-3 px-2 text-right text-neutral-300">{formatCurrency(proj.salary)}</td>
                    <td className="py-3 px-2 text-right text-neutral-300">{formatCurrency(proj.employeeContribution)}</td>
                    <td className="py-3 px-2 text-right text-emerald-400">{formatCurrency(proj.employerContribution)}</td>
                    <td className="py-3 px-2 text-right text-purple-400">{formatCurrency(proj.investmentGrowth)}</td>
                    <td className="py-3 px-2 text-right text-white font-medium">{formatLargeCurrency(proj.potValueEnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SIPP vs Workplace Pension Section */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <button
              onClick={() => setShowPensionTypes(!showPensionTypes)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all"
            >
              <span className="text-xl">📊</span>
              <span>{showPensionTypes ? 'Hide' : 'Explore'} SIPP vs Workplace Pension</span>
              <span className="text-sm">{showPensionTypes ? '▲' : '▼'}</span>
            </button>
          </div>

          {showPensionTypes && (
            <div className="space-y-8">
              {/* Pension Type Cards */}
              <div className="card card-glow p-6 md:p-8">
                <h3 className="text-xl font-semibold text-white mb-2">Which Pension Type is Right for You?</h3>
                <p className="text-neutral-400 text-sm mb-6">
                  The golden rule: <span className="text-emerald-400 font-medium">Always max your employer match first</span>,
                  then consider a SIPP for additional contributions with lower fees and more control.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {PENSION_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedPensionType(selectedPensionType === type.id ? null : type.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedPensionType === type.id
                          ? 'bg-cyan-500/20 border-cyan-500/50'
                          : 'bg-[#1a1a1a] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <div className={`font-medium ${selectedPensionType === type.id ? 'text-cyan-300' : 'text-white'}`}>
                            {type.name}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">{type.description}</div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {type.employerContributions && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                Employer Match
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              type.investmentControl === 'full'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-neutral-500/20 text-neutral-400'
                            }`}>
                              {type.investmentControl === 'full' ? 'Full Control' : 'Limited Choice'}
                            </span>
                            <span className="text-xs text-neutral-500">
                              Fees: {type.typicalFees}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected Pension Type Details */}
                {selectedPensionType && (
                  <div className="p-6 rounded-xl bg-[#0d0d0d] border border-white/10">
                    {(() => {
                      const type = PENSION_TYPES.find(t => t.id === selectedPensionType);
                      if (!type) return null;
                      return (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">{type.icon}</span>
                            <div>
                              <h4 className="text-lg font-semibold text-white">{type.name}</h4>
                              <p className="text-sm text-cyan-400">{type.bestFor}</p>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-sm font-medium text-emerald-400 mb-2">Pros</h5>
                              <ul className="space-y-1">
                                {type.pros.map((pro, idx) => (
                                  <li key={idx} className="text-sm text-neutral-300 flex items-start gap-2">
                                    <span className="text-emerald-500 mt-0.5">+</span>
                                    {pro}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-red-400 mb-2">Cons</h5>
                              <ul className="space-y-1">
                                {type.cons.map((con, idx) => (
                                  <li key={idx} className="text-sm text-neutral-300 flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">-</span>
                                    {con}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Fee Impact Calculator */}
              <div className="card p-6 md:p-8">
                <h3 className="text-xl font-semibold text-white mb-2">The Hidden Cost of Fees</h3>
                <p className="text-neutral-400 text-sm mb-6">
                  A 0.8% difference in fees might seem small, but over {inputs.retirementAge - inputs.currentAge} years it adds up dramatically.
                </p>

                {(() => {
                  const annualContribution = inputs.grossSalary * (inputs.employeeContributionPercent / 100);
                  const feeComparison = compareFees(
                    inputs.currentPensionPot,
                    annualContribution,
                    inputs.retirementAge - inputs.currentAge,
                    inputs.expectedReturn
                  );
                  return (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-neutral-400">Low-cost SIPP (0.2% fees)</span>
                            <span className="text-emerald-400 font-semibold">{formatLargeCurrency(feeComparison.lowFee)}</span>
                          </div>
                          <div className="h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-lg w-full" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-neutral-400">Typical workplace (1.0% fees)</span>
                            <span className="text-orange-400">{formatLargeCurrency(feeComparison.highFee)}</span>
                          </div>
                          <div className="h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-lg transition-all"
                              style={{ width: `${(feeComparison.highFee / feeComparison.lowFee) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="text-2xl font-bold text-red-400 mb-1">
                          -{formatLargeCurrency(feeComparison.difference)}
                        </div>
                        <div className="text-sm text-red-300 mb-2">
                          Lost to higher fees ({feeComparison.percentLost}% of your pot!)
                        </div>
                        <div className="text-xs text-neutral-400">
                          That's {formatCurrency(Math.round(feeComparison.difference / ((inputs.retirementAge - inputs.currentAge) * 12)))} per month
                          you could have had in retirement.
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* SIPP Providers */}
              <div className="card p-6 md:p-8">
                <h3 className="text-xl font-semibold text-white mb-2">Popular SIPP Providers</h3>
                <p className="text-neutral-400 text-sm mb-6">
                  If you've maxed your employer match and want to contribute more with lower fees:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-neutral-400 border-b border-white/10">
                        <th className="text-left py-3 px-3">Provider</th>
                        <th className="text-left py-3 px-3">Platform Fee</th>
                        <th className="text-left py-3 px-3">Dealing</th>
                        <th className="text-left py-3 px-3">Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIPP_PROVIDERS.map(provider => (
                        <tr key={provider.name} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-3">
                            <span className="text-white font-medium">{provider.name}</span>
                          </td>
                          <td className="py-3 px-3 text-emerald-400">{provider.platformFee}</td>
                          <td className="py-3 px-3 text-neutral-400">{provider.dealingFees}</td>
                          <td className="py-3 px-3 text-neutral-300">{provider.bestFor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <h4 className="text-sm font-medium text-purple-300 mb-2">The Optimal Strategy</h4>
                  <ol className="text-sm text-neutral-300 space-y-1 list-decimal list-inside">
                    <li><span className="text-emerald-400">First:</span> Contribute enough to your workplace pension to get the full employer match</li>
                    <li><span className="text-cyan-400">Then:</span> Open a low-cost SIPP for any additional contributions</li>
                    <li><span className="text-purple-400">Consider:</span> Transferring old workplace pensions to your SIPP to consolidate and reduce fees</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
