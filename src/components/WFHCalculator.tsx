'use client';

import { useState, useMemo } from 'react';
import { calculateWFHCosts, COMMUTE_PRESETS, WFHInputs } from '@/lib/wfh-calculator';
import { useCalculatorStore } from '@/lib/store';
import SaveToReportButton from './SaveToReportButton';

export default function WFHCalculator() {
  const { inputs: mainInputs, results: mainResults } = useCalculatorStore();

  const [inputs, setInputs] = useState<WFHInputs>({
    daysPerWeek: {
      wfh: 2,
      office: 3,
    },
    commute: {
      method: 'train',
      dailyCost: 12,
      commuteMinutes: 45,
    },
    office: {
      lunchCost: 8,
      coffeeCost: 3,
      workClothingAnnual: 300,
      socialEvents: 50,
    },
    wfh: {
      electricityIncrease: 20,
      heatingIncrease: 30,
      internetUpgrade: 10,
      lunchCostAtHome: 3,
      coffeeAtHome: 0.50,
      homeSetupAnnual: 100,
    },
    salary: {
      gross: mainInputs?.salary || 45000,
      trueHourlyRate: mainResults?.trueHourlyRate || 15,
    },
    hmrcRelief: false,
  });

  const results = useMemo(() => calculateWFHCosts(inputs), [inputs]);

  const updateDays = (type: 'wfh' | 'office', value: number) => {
    const other = type === 'wfh' ? 'office' : 'wfh';
    const otherValue = Math.max(0, 5 - value);
    setInputs(prev => ({
      ...prev,
      daysPerWeek: {
        [type]: value,
        [other]: otherValue,
      } as { wfh: number; office: number },
    }));
  };

  const selectCommutePreset = (presetKey: keyof typeof COMMUTE_PRESETS) => {
    const preset = COMMUTE_PRESETS[presetKey];
    setInputs(prev => ({
      ...prev,
      commute: {
        method: preset.method,
        dailyCost: preset.dailyCost,
        commuteMinutes: preset.minutes,
      },
    }));
  };

  const formatCurrency = (value: number) => `£${value.toLocaleString()}`;

  return (
    <section id="wfh" className="py-20 px-4 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <span className="text-indigo-400 text-sm font-medium">WFH vs Office</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Working From Home vs Office Costs
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto mb-4">
            Compare the real costs of hybrid, remote, and office work.
            Include commute time value, home office costs, and HMRC tax relief.
          </p>
          <SaveToReportButton
            calculatorType="wfh"
            inputs={inputs}
            results={results}
            getDescription={() => `${inputs.daysPerWeek.wfh} WFH days, ${inputs.daysPerWeek.office} office days`}
          />
        </div>

        {/* Work Split Selector */}
        <div className="card card-glow p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Your Work Pattern</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-indigo-400">🏠 WFH: {inputs.daysPerWeek.wfh} days</span>
                <span className="text-orange-400">🏢 Office: {inputs.daysPerWeek.office} days</span>
              </div>
              <input
                type="range"
                value={inputs.daysPerWeek.wfh}
                onChange={e => updateDays('wfh', parseInt(e.target.value))}
                className="w-full accent-indigo-500"
                min="0"
                max="5"
                step="1"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Full Office</span>
                <span>Hybrid</span>
                <span>Full Remote</span>
              </div>
            </div>
          </div>

          {/* Visual days */}
          <div className="flex gap-2 justify-center">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                  i < inputs.daysPerWeek.wfh
                    ? 'bg-indigo-500/20 border border-indigo-500/50'
                    : 'bg-orange-500/20 border border-orange-500/50'
                }`}
              >
                {i < inputs.daysPerWeek.wfh ? '🏠' : '🏢'}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            {/* Commute */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Commute Details</h3>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { key: 'london_zone123', label: 'Zone 1-3', icon: '🚇' },
                  { key: 'train_suburban', label: 'Train', icon: '🚆' },
                  { key: 'car_short', label: 'Car', icon: '🚗' },
                  { key: 'cycle', label: 'Cycle', icon: '🚲' },
                ].map(preset => (
                  <button
                    key={preset.key}
                    onClick={() => selectCommutePreset(preset.key as keyof typeof COMMUTE_PRESETS)}
                    className="p-2 rounded-xl bg-[#1a1a1a] border border-white/10 hover:border-white/20 text-center transition-all"
                  >
                    <div className="text-xl">{preset.icon}</div>
                    <div className="text-xs text-neutral-400">{preset.label}</div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Daily Cost (£)</label>
                  <input
                    type="number"
                    value={inputs.commute.dailyCost}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      commute: { ...prev.commute, dailyCost: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                    step="0.50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">One-way (mins)</label>
                  <input
                    type="number"
                    value={inputs.commute.commuteMinutes}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      commute: { ...prev.commute, commuteMinutes: parseInt(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Office Costs */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">🏢 Office Day Costs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Lunch (£/day)</label>
                  <input
                    type="number"
                    value={inputs.office.lunchCost}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      office: { ...prev.office, lunchCost: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                    step="0.50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Coffee (£/day)</label>
                  <input
                    type="number"
                    value={inputs.office.coffeeCost}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      office: { ...prev.office, coffeeCost: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                    step="0.50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Work Clothes (£/yr)</label>
                  <input
                    type="number"
                    value={inputs.office.workClothingAnnual}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      office: { ...prev.office, workClothingAnnual: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Social (£/mo)</label>
                  <input
                    type="number"
                    value={inputs.office.socialEvents}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      office: { ...prev.office, socialEvents: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* WFH Costs */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">🏠 WFH Day Costs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Electricity ↑ (£/mo)</label>
                  <input
                    type="number"
                    value={inputs.wfh.electricityIncrease}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      wfh: { ...prev.wfh, electricityIncrease: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Heating ↑ (£/mo)</label>
                  <input
                    type="number"
                    value={inputs.wfh.heatingIncrease}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      wfh: { ...prev.wfh, heatingIncrease: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Internet ↑ (£/mo)</label>
                  <input
                    type="number"
                    value={inputs.wfh.internetUpgrade}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      wfh: { ...prev.wfh, internetUpgrade: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Home Setup (£/yr)</label>
                  <input
                    type="number"
                    value={inputs.wfh.homeSetupAnnual}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      wfh: { ...prev.wfh, homeSetupAnnual: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Lunch at Home (£/day)</label>
                  <input
                    type="number"
                    value={inputs.wfh.lunchCostAtHome}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      wfh: { ...prev.wfh, lunchCostAtHome: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                    step="0.50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Coffee at Home (£/day)</label>
                  <input
                    type="number"
                    value={inputs.wfh.coffeeAtHome}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      wfh: { ...prev.wfh, coffeeAtHome: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                    step="0.10"
                  />
                </div>
              </div>
            </div>

            {/* HMRC Relief */}
            <div className="card p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.hmrcRelief}
                  onChange={e => setInputs(prev => ({ ...prev, hmrcRelief: e.target.checked }))}
                  className="w-5 h-5 rounded border-white/20 bg-[#1a1a1a] accent-indigo-500"
                />
                <div>
                  <span className="text-white">Claiming HMRC WFH Tax Relief</span>
                  <span className="text-xs text-neutral-500 block">£6/week (£312/year) tax-free allowance</span>
                </div>
              </label>
              {!inputs.hmrcRelief && inputs.daysPerWeek.wfh > 0 && (
                <p className="mt-3 text-xs text-yellow-400">
                  You could save ~£{results.hmrc.taxSaved}/year in tax! Apply at gov.uk
                </p>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-indigo-400">
                  {formatCurrency(results.hybrid.totalAnnual)}
                </div>
                <div className="text-sm text-neutral-400">Your Current Annual Cost</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-green-400">
                  {formatCurrency(results.comparison.annualSavings)}
                </div>
                <div className="text-sm text-neutral-400">Full WFH Would Save</div>
              </div>
            </div>

            {/* Cost Comparison Visual */}
            <div className="card card-glow p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Full Office vs Full WFH</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-orange-400">🏢 Full Office</span>
                    <span className="text-white">{formatCurrency(results.costs.office.total.annual)}/yr</span>
                  </div>
                  <div className="h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-lg w-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-indigo-400">🏠 Full WFH</span>
                    <span className="text-white">{formatCurrency(results.costs.wfh.total.annual)}/yr</span>
                  </div>
                  <div className="h-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-lg transition-all"
                      style={{ width: `${(results.costs.wfh.total.annual / results.costs.office.total.annual) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-lg font-bold text-green-400">
                  Save {results.comparison.savingsPercent}% with full WFH
                </div>
                <div className="text-sm text-neutral-400">
                  {formatCurrency(results.comparison.monthlySavings)}/month or {formatCurrency(results.comparison.weeklySavings)}/week
                </div>
              </div>
            </div>

            {/* Time Value */}
            <div className="card p-6 border-purple-500/30 bg-purple-500/5">
              <h3 className="text-lg font-semibold text-white mb-4">Time is Money</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-[#1a1a1a]">
                  <div className="text-2xl font-bold text-purple-400">{results.time.commuteHoursPerWeek}h</div>
                  <div className="text-xs text-neutral-500">Commute per week</div>
                </div>
                <div className="p-3 rounded-lg bg-[#1a1a1a]">
                  <div className="text-2xl font-bold text-purple-400">{results.time.commuteHoursPerYear}h</div>
                  <div className="text-xs text-neutral-500">Commute per year</div>
                </div>
              </div>
              <p className="text-sm text-neutral-300">
                At your true hourly wage of {formatCurrency(inputs.salary.trueHourlyRate)}/hr,
                your commute time is worth <span className="text-purple-400 font-semibold">{formatCurrency(results.time.commuteValuePerYear)}/year</span>.
              </p>
              {results.time.effectiveHourlyBonus > 0 && (
                <p className="text-sm text-purple-300 mt-2">
                  Full WFH would be like a {formatCurrency(results.time.effectiveHourlyBonus)}/hr raise when you factor in time saved.
                </p>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Hybrid Cost Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Commute', value: results.costs.office.commute.annual, color: 'orange' },
                  { label: 'Office Lunch', value: results.costs.office.lunch.annual, color: 'orange' },
                  { label: 'Office Coffee', value: results.costs.office.coffee.annual, color: 'orange' },
                  { label: 'Work Clothes', value: results.costs.office.clothing.annual * (inputs.daysPerWeek.office / 5), color: 'orange' },
                  { label: 'WFH Utilities', value: (results.costs.wfh.electricity.annual + results.costs.wfh.heating.annual) * (inputs.daysPerWeek.wfh / 5), color: 'indigo' },
                  { label: 'Home Lunch', value: results.costs.wfh.lunch.annual, color: 'indigo' },
                ].filter(item => item.value > 0).map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">{item.label}</span>
                    <span className={`text-sm font-medium text-${item.color}-400`}>
                      {formatCurrency(Math.round(item.value))}/yr
                    </span>
                  </div>
                ))}
              </div>
            </div>

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
          </div>
        </div>
      </div>
    </section>
  );
}
