'use client';

import { useState, useMemo } from 'react';
import { calculateCarCosts, CAR_PROFILES, CarInputs } from '@/lib/car-calculator';
import { useCalculatorStore } from '@/lib/store';
import SaveToReportButton from './SaveToReportButton';

export default function CarCalculator() {
  const { results: mainResults } = useCalculatorStore();
  const trueHourlyRate = mainResults?.trueHourlyRate || 15;

  const [inputs, setInputs] = useState<CarInputs>({
    purchasePrice: 25000,
    isFinanced: false,
    financeDetails: {
      deposit: 2500,
      monthlyPayment: 350,
      termMonths: 48,
      apr: 8.9,
    },
    annualMileage: 8000,
    fuelType: 'petrol',
    mpg: 45,
    insuranceAnnual: 700,
    taxAnnual: 180,
    motAnnual: 50,
    servicingAnnual: 350,
    parkingMonthly: 50,
    congestionCharges: 0,
    tollsAnnual: 0,
    cleaningMonthly: 15,
    depreciationYears: 5,
    trueHourlyRate,
  });

  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const results = useMemo(() => calculateCarCosts(inputs), [inputs]);

  const updateInput = <K extends keyof CarInputs>(key: K, value: CarInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
    setSelectedProfile(null);
  };

  const updateFinanceDetail = <K extends keyof NonNullable<CarInputs['financeDetails']>>(
    key: K,
    value: NonNullable<CarInputs['financeDetails']>[K]
  ) => {
    setInputs(prev => ({
      ...prev,
      financeDetails: { ...prev.financeDetails!, [key]: value },
    }));
  };

  const selectProfile = (profileId: string) => {
    const profile = CAR_PROFILES.find(p => p.id === profileId);
    if (profile) {
      setSelectedProfile(profileId);
      setInputs(prev => ({
        ...prev,
        ...profile.defaults,
      }));
    }
  };

  const formatCurrency = (value: number) => `£${value.toLocaleString()}`;

  // Get top 3 costs for breakdown
  const costItems = Object.entries(results.costs)
    .map(([key, value]) => ({ name: key, ...value }))
    .sort((a, b) => b.annual - a.annual);

  return (
    <section id="car" className="py-20 px-4 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
            <span className="text-orange-400 text-sm font-medium">True Car Cost</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What Does Your Car Really Cost?
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto mb-4">
            Most people underestimate car ownership costs by 50%+. See the true cost
            in pounds and work hours, and compare with alternatives.
          </p>
          <SaveToReportButton
            calculatorType="car"
            inputs={inputs}
            results={results}
            getDescription={() => `£${inputs.purchasePrice.toLocaleString()} car, ${inputs.annualMileage.toLocaleString()} miles/year`}
          />
        </div>

        {/* Car Profile Selection */}
        <div className="card card-glow p-6 md:p-8 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Select Your Car Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {CAR_PROFILES.map(profile => (
              <button
                key={profile.id}
                onClick={() => selectProfile(profile.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedProfile === profile.id
                    ? 'bg-orange-500/20 border-orange-500/50'
                    : 'bg-[#1a1a1a] border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`text-sm font-medium ${selectedProfile === profile.id ? 'text-orange-300' : 'text-white'}`}>
                  {profile.name}
                </div>
                <div className="text-xs text-neutral-500 mt-1">{profile.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            {/* Purchase Details */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Purchase Details</h3>

              <div className="mb-4">
                <label className="block text-sm text-neutral-400 mb-2">Purchase Price (£)</label>
                <input
                  type="number"
                  value={inputs.purchasePrice}
                  onChange={e => updateInput('purchasePrice', parseFloat(e.target.value) || 0)}
                  className="input-field w-full px-4 py-3"
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.isFinanced}
                    onChange={e => updateInput('isFinanced', e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-[#1a1a1a] accent-orange-500"
                  />
                  <span className="text-white">On Finance / PCP / HP</span>
                </label>
              </div>

              {inputs.isFinanced && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#1a1a1a]">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Deposit (£)</label>
                    <input
                      type="number"
                      value={inputs.financeDetails?.deposit}
                      onChange={e => updateFinanceDetail('deposit', parseFloat(e.target.value) || 0)}
                      className="input-field w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Monthly Payment (£)</label>
                    <input
                      type="number"
                      value={inputs.financeDetails?.monthlyPayment}
                      onChange={e => updateFinanceDetail('monthlyPayment', parseFloat(e.target.value) || 0)}
                      className="input-field w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Term (months)</label>
                    <input
                      type="number"
                      value={inputs.financeDetails?.termMonths}
                      onChange={e => updateFinanceDetail('termMonths', parseInt(e.target.value) || 48)}
                      className="input-field w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">APR (%)</label>
                    <input
                      type="number"
                      value={inputs.financeDetails?.apr}
                      onChange={e => updateFinanceDetail('apr', parseFloat(e.target.value) || 0)}
                      className="input-field w-full px-3 py-2 text-sm"
                      step="0.1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Running Costs */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Running Costs</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Annual Mileage</label>
                  <input
                    type="number"
                    value={inputs.annualMileage}
                    onChange={e => updateInput('annualMileage', parseFloat(e.target.value) || 0)}
                    className="input-field w-full px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Fuel Type</label>
                  <select
                    value={inputs.fuelType}
                    onChange={e => updateInput('fuelType', e.target.value as CarInputs['fuelType'])}
                    className="input-field w-full px-4 py-3"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-neutral-400 mb-2">
                  {inputs.fuelType === 'electric' ? 'Miles per kWh' : 'MPG (Miles per Gallon)'}
                </label>
                <input
                  type="number"
                  value={inputs.mpg}
                  onChange={e => updateInput('mpg', parseFloat(e.target.value) || 30)}
                  className="input-field w-full px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Insurance (£/yr)</label>
                  <input
                    type="number"
                    value={inputs.insuranceAnnual}
                    onChange={e => updateInput('insuranceAnnual', parseFloat(e.target.value) || 0)}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Road Tax (£/yr)</label>
                  <input
                    type="number"
                    value={inputs.taxAnnual}
                    onChange={e => updateInput('taxAnnual', parseFloat(e.target.value) || 0)}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">MOT (£/yr)</label>
                  <input
                    type="number"
                    value={inputs.motAnnual}
                    onChange={e => updateInput('motAnnual', parseFloat(e.target.value) || 0)}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Servicing (£/yr)</label>
                  <input
                    type="number"
                    value={inputs.servicingAnnual}
                    onChange={e => updateInput('servicingAnnual', parseFloat(e.target.value) || 0)}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Parking (£/mo)</label>
                  <input
                    type="number"
                    value={inputs.parkingMonthly}
                    onChange={e => updateInput('parkingMonthly', parseFloat(e.target.value) || 0)}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Cleaning (£/mo)</label>
                  <input
                    type="number"
                    value={inputs.cleaningMonthly}
                    onChange={e => updateInput('cleaningMonthly', parseFloat(e.target.value) || 0)}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Congestion (£/yr)</label>
                  <input
                    type="number"
                    value={inputs.congestionCharges}
                    onChange={e => updateInput('congestionCharges', parseFloat(e.target.value) || 0)}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Tolls (£/yr)</label>
                  <input
                    type="number"
                    value={inputs.tollsAnnual}
                    onChange={e => updateInput('tollsAnnual', parseFloat(e.target.value) || 0)}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {formatCurrency(results.totals.annualCost)}
                </div>
                <div className="text-sm text-neutral-400">Per Year</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {formatCurrency(results.totals.monthlyCost)}
                </div>
                <div className="text-sm text-neutral-400">Per Month</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-purple-400">
                  £{results.totals.costPerMile.toFixed(2)}
                </div>
                <div className="text-sm text-neutral-400">Per Mile</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-cyan-400">
                  {results.totals.workDaysToAfford}
                </div>
                <div className="text-sm text-neutral-400">Work Days/Year</div>
              </div>
            </div>

            {/* Work Hours Visualization */}
            <div className="card card-glow p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Time Spent Working for Your Car</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="h-8 bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-lg transition-all"
                      style={{ width: `${Math.min(100, (results.totals.workDaysToAfford / 250) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>0 days</span>
                    <span>250 work days (1 year)</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-neutral-400">
                You spend <span className="text-orange-400 font-semibold">{results.totals.workHoursToAfford} hours</span> ({Math.round(results.totals.workDaysToAfford / 5)} weeks)
                working each year just to afford your car.
              </p>
            </div>

            {/* Cost Breakdown */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                {costItems.slice(0, 6).map(item => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-400 capitalize">{item.name.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-white">{formatCurrency(Math.round(item.annual))}/yr</span>
                      </div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500/60 rounded-full"
                          style={{ width: `${(item.annual / results.totals.annualCost) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternatives Comparison */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Alternatives Comparison</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#1a1a1a]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚇</span>
                      <span className="text-white">Public Transport</span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">
                        Save {formatCurrency(results.comparison.publicTransport.savings)}/yr
                      </div>
                      <div className="text-xs text-neutral-500">
                        {results.comparison.publicTransport.savingsPercent}% cheaper
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1a1a1a]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚲</span>
                      <span className="text-white">Cycling</span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">
                        Save {formatCurrency(results.comparison.cycling.savings)}/yr
                      </div>
                      <div className="text-xs text-neutral-500">
                        {results.comparison.cycling.savingsPercent}% cheaper
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1a1a1a]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚙</span>
                      <span className="text-white">Car Share (Zipcar)</span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">
                        Save {formatCurrency(results.comparison.carShare.savings)}/yr
                      </div>
                      <div className="text-xs text-neutral-500">
                        {results.comparison.carShare.savingsPercent}% cheaper
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Long-term Cost */}
            <div className="card p-6 border-red-500/30 bg-red-500/5">
              <h3 className="text-lg font-semibold text-white mb-2">Long-term Impact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-red-400">{formatCurrency(results.fiveYearCost)}</div>
                  <div className="text-xs text-neutral-500">5-year cost</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{formatCurrency(results.tenYearCost)}</div>
                  <div className="text-xs text-neutral-500">10-year cost</div>
                </div>
              </div>
              <p className="text-sm text-neutral-400 mt-3">
                Invested in the S&P 500 at 10% annual return, {formatCurrency(results.fiveYearCost)} over 5 years
                could grow to {formatCurrency(Math.round(results.fiveYearCost * 1.61))} in 5 more years.
              </p>
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
