'use client';

import { useState, useMemo } from 'react';
import {
  CommuteInputs,
  CommuteMethodInput,
  CommuteResults,
  COMMUTE_METHODS,
  calculateCommuteCosts,
  getDefaultCommuteInputs,
} from '@/lib/commute-calculator';
import { useCalculatorStore } from '@/lib/store';
import { saveComparisonScenario } from '@/lib/scenarios';

export default function CommuteCalculator() {
  const { results: mainResults, user } = useCalculatorStore();
  const [inputs, setInputs] = useState<CommuteInputs>(() => {
    const defaults = getDefaultCommuteInputs();
    // Use hourly wage from main calculator if available
    if (mainResults?.trueHourlyRate) {
      defaults.hourlyWage = Math.round(mainResults.trueHourlyRate * 100) / 100;
    }
    return defaults;
  });
  const [showResults, setShowResults] = useState(false);

  const results: CommuteResults | null = useMemo(() => {
    if (!showResults) return null;
    return calculateCommuteCosts(inputs);
  }, [inputs, showResults]);

  const updateInput = <K extends keyof CommuteInputs>(key: K, value: CommuteInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const updateMethod = (index: number, updates: Partial<CommuteMethodInput>) => {
    setInputs(prev => ({
      ...prev,
      methods: prev.methods.map((m, i) => (i === index ? { ...m, ...updates } : m)),
    }));
  };

  const handleCalculate = async () => {
    setShowResults(true);

    // Auto-save to scenarios if user is logged in
    if (user) {
      const calcResults = calculateCommuteCosts(inputs);
      try {
        await saveComparisonScenario(
          user.id,
          `Commute Comparison - ${new Date().toLocaleDateString('en-GB')}`,
          'commute',
          { inputs, results: calcResults },
          `Compared ${inputs.methods.filter(m => m.enabled).length} commute methods`
        );
        console.log('Commute comparison auto-saved');
      } catch (error) {
        console.error('Failed to auto-save commute comparison:', error);
      }
    }
  };

  const enabledMethodsCount = inputs.methods.filter(m => m.enabled).length;

  return (
    <section id="commute-calculator" className="py-20 px-4 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <span className="text-blue-400 text-sm font-medium">Commute Comparison</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Compare Your Commute Options
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Calculate the true cost of different commuting methods including time, money,
            environmental impact, and health benefits.
          </p>
        </div>

        {/* Input Form */}
        <div className="card card-glow p-6 md:p-8 mb-8">
          {/* Journey Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📍</span>
              Journey Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Distance (one-way miles)
                </label>
                <input
                  type="number"
                  value={inputs.distanceMiles}
                  onChange={e => updateInput('distanceMiles', parseFloat(e.target.value) || 0)}
                  className="input-field w-full px-4 py-3"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Days in Office / Week
                </label>
                <input
                  type="number"
                  value={inputs.daysInOfficePerWeek}
                  onChange={e => updateInput('daysInOfficePerWeek', parseInt(e.target.value) || 0)}
                  className="input-field w-full px-4 py-3"
                  min="1"
                  max="7"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Weeks Worked / Year
                </label>
                <input
                  type="number"
                  value={inputs.weeksWorkedPerYear}
                  onChange={e => updateInput('weeksWorkedPerYear', parseInt(e.target.value) || 0)}
                  className="input-field w-full px-4 py-3"
                  min="1"
                  max="52"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  Your Hourly Wage (£)
                </label>
                <input
                  type="number"
                  value={inputs.hourlyWage}
                  onChange={e => updateInput('hourlyWage', parseFloat(e.target.value) || 0)}
                  className="input-field w-full px-4 py-3"
                  min="0"
                  step="0.01"
                />
                {mainResults?.trueHourlyRate && (
                  <p className="text-xs text-emerald-400 mt-1">
                    From main calculator: £{mainResults.trueHourlyRate.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Commute Methods */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              Commute Methods to Compare
              <span className="text-sm font-normal text-neutral-500">
                ({enabledMethodsCount} selected)
              </span>
            </h3>

            <div className="space-y-4">
              {inputs.methods.map((method, index) => {
                const config = COMMUTE_METHODS.find(m => m.id === method.method);
                if (!config) return null;

                return (
                  <div
                    key={method.method}
                    className={`p-4 rounded-xl border transition-all ${
                      method.enabled
                        ? 'bg-[#1a1a1a] border-emerald-500/30'
                        : 'bg-[#0f0f0f] border-white/5 opacity-60'
                    }`}
                  >
                    {/* Method Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={method.enabled}
                          onChange={e => updateMethod(index, { enabled: e.target.checked })}
                          className="w-5 h-5 rounded border-white/20 bg-[#1a1a1a] text-emerald-500 focus:ring-emerald-500/50"
                        />
                        <span className="text-2xl">{config.icon}</span>
                        <span className="text-white font-medium">{config.name}</span>
                      </label>
                      {config.co2PerKm === 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          Zero Emissions
                        </span>
                      )}
                      {config.caloriesPerKm > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          Active Travel
                        </span>
                      )}
                    </div>

                    {/* Method Inputs */}
                    {method.enabled && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-8">
                        {/* All methods have commute time */}
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">
                            Commute Time (mins, one-way)
                          </label>
                          <input
                            type="number"
                            value={method.commuteTimeMinutes}
                            onChange={e =>
                              updateMethod(index, {
                                commuteTimeMinutes: parseInt(e.target.value) || 0,
                              })
                            }
                            className="input-field w-full px-3 py-2 text-sm"
                            min="0"
                          />
                        </div>

                        {/* Train/Bus specific */}
                        {(method.method === 'train_tube' || method.method === 'bus') && (
                          <>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Monthly Pass (£)
                              </label>
                              <input
                                type="number"
                                value={method.monthlyPass || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    monthlyPass: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Or Single Fare (£)
                              </label>
                              <input
                                type="number"
                                value={method.singleFare || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    singleFare: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="0"
                              />
                            </div>
                          </>
                        )}

                        {/* Driving specific */}
                        {method.method === 'driving' && (
                          <>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Fuel Cost (£/litre)
                              </label>
                              <input
                                type="number"
                                value={method.fuelCostPerLitre || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    fuelCostPerLitre: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                step="0.01"
                                placeholder="1.45"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                MPG
                              </label>
                              <input
                                type="number"
                                value={method.mpg || ''}
                                onChange={e =>
                                  updateMethod(index, { mpg: parseFloat(e.target.value) || undefined })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="40"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Parking (£/day)
                              </label>
                              <input
                                type="number"
                                value={method.parkingDaily || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    parkingDaily: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Congestion (£/day)
                              </label>
                              <input
                                type="number"
                                value={method.congestionCharge || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    congestionCharge: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="0"
                              />
                            </div>
                          </>
                        )}

                        {/* Cycling specific */}
                        {method.method === 'cycling' && (
                          <>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Bike Cost (£)
                              </label>
                              <input
                                type="number"
                                value={method.initialCost || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    initialCost: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Maintenance (£/year)
                              </label>
                              <input
                                type="number"
                                value={method.maintenanceYearly || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    maintenanceYearly: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="100"
                              />
                            </div>
                          </>
                        )}

                        {/* E-bike specific */}
                        {method.method === 'ebike' && (
                          <>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                E-Bike Cost (£)
                              </label>
                              <input
                                type="number"
                                value={method.initialCost || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    initialCost: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="1500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Maintenance (£/year)
                              </label>
                              <input
                                type="number"
                                value={method.maintenanceYearly || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    maintenanceYearly: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="150"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Charging (£/month)
                              </label>
                              <input
                                type="number"
                                value={method.chargingCostMonthly || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    chargingCostMonthly: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="5"
                              />
                            </div>
                          </>
                        )}

                        {/* Hybrid specific */}
                        {method.method === 'hybrid' && (
                          <>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Monthly Cost (£)
                              </label>
                              <input
                                type="number"
                                value={method.customMonthlyCost || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    customMonthlyCost: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="150"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Or Daily Cost (£)
                              </label>
                              <input
                                type="number"
                                value={method.customDailyCost || ''}
                                onChange={e =>
                                  updateMethod(index, {
                                    customDailyCost: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="input-field w-full px-3 py-2 text-sm"
                                min="0"
                                placeholder="0"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calculate Button */}
          <div className="text-center">
            <button
              onClick={handleCalculate}
              disabled={enabledMethodsCount < 2}
              className="btn-primary px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Compare {enabledMethodsCount} Methods
            </button>
            {enabledMethodsCount < 2 && (
              <p className="text-amber-400 text-sm mt-2">
                Select at least 2 methods to compare
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        {results && results.methods.length >= 2 && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4 text-center">
                <div className="text-3xl mb-2">💰</div>
                <p className="text-sm text-neutral-400 mb-1">Cheapest</p>
                <p className="text-white font-semibold">{results.cheapestMethod}</p>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl mb-2">⚡</div>
                <p className="text-sm text-neutral-400 mb-1">Fastest</p>
                <p className="text-white font-semibold">{results.fastestMethod}</p>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl mb-2">🌱</div>
                <p className="text-sm text-neutral-400 mb-1">Greenest</p>
                <p className="text-white font-semibold">{results.greenestMethod}</p>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl mb-2">💪</div>
                <p className="text-sm text-neutral-400 mb-1">Healthiest</p>
                <p className="text-white font-semibold">{results.healthiestMethod}</p>
              </div>
            </div>

            {/* Potential Savings */}
            {results.potentialAnnualSavings > 0 && (
              <div className="card card-glow p-6 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Potential Savings by Switching
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Annual Cost Savings</p>
                    <p className="text-3xl font-bold text-emerald-400">
                      £{results.potentialAnnualSavings.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Time Savings</p>
                    <p className="text-3xl font-bold text-blue-400">
                      {results.potentialTimeSavingsHours} hours/year
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">CO₂ Reduction</p>
                    <p className="text-3xl font-bold text-green-400">
                      {results.potentialCO2SavingsKg} kg/year
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Comparison Table */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Detailed Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                        Method
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-neutral-400">
                        Direct Cost
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-neutral-400">
                        Time Cost
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-neutral-400">
                        Total Cost
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-neutral-400">
                        Hours/Year
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-neutral-400">
                        CO₂ (kg)
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-neutral-400">
                        Calories
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.methods
                      .sort((a, b) => a.annualTotalCost - b.annualTotalCost)
                      .map((method, index) => (
                        <tr
                          key={method.method}
                          className={`border-b border-white/5 ${
                            index === 0 ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{method.icon}</span>
                              <span className="text-white font-medium">{method.name}</span>
                              {index === 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                  Best Value
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 text-neutral-300">
                            £{method.annualDirectCost.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4 text-neutral-300">
                            £{method.annualTimeCost.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4 text-white font-semibold">
                            £{method.annualTotalCost.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-4 text-neutral-300">
                            {method.annualCommuteHours}
                          </td>
                          <td className="text-right py-3 px-4">
                            <span
                              className={
                                method.annualCO2Kg === 0
                                  ? 'text-green-400'
                                  : method.annualCO2Kg < 500
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }
                            >
                              {method.annualCO2Kg}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className={method.annualCaloriesBurned > 0 ? 'text-orange-400' : 'text-neutral-500'}>
                              {method.annualCaloriesBurned.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Daily breakdown note */}
              <div className="mt-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <p className="text-sm text-neutral-400">
                  <span className="text-blue-400 font-medium">Time cost</span> is calculated
                  by valuing your commute time at your hourly wage of £{inputs.hourlyWage.toFixed(2)}.
                  This represents the opportunity cost of time spent commuting instead of working
                  or doing something you value.
                </p>
              </div>
            </div>

            {/* Best Overall Recommendation */}
            <div className="card card-glow p-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Best Overall: {results.bestOverallMethod}
              </h3>
              <p className="text-neutral-400">
                Considering both direct costs and time value, this is your most economical option.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
