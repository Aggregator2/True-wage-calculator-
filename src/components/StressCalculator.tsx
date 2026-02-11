'use client';

import { useState, useMemo } from 'react';
import { calculateStressValue, STRESS_PROFILES, StressInputs } from '@/lib/stress-calculator';
import { useCalculatorStore } from '@/lib/store';
import SaveToReportButton from './SaveToReportButton';

export default function StressCalculator() {
  const { inputs: mainInputs } = useCalculatorStore();

  const [inputs, setInputs] = useState<StressInputs>({
    workHours: {
      contractedHours: 37.5,
      actualHours: 45,
      unpaidOvertime: 7.5,
    },
    intensity: {
      deadlinePressure: 6,
      meetingLoad: 5,
      multitasking: 6,
      autonomy: 5,
      micromanagement: 4,
    },
    stress: {
      sleepQuality: 6,
      anxietyLevel: 5,
      workLifeBalance: 5,
      physicalSymptoms: 4,
      mentalFatigue: 6,
    },
    compensation: {
      salary: mainInputs?.salary || 45000,
      bonus: 0,
      benefits: 2000,
    },
    health: {
      therapyCost: 0,
      medicationCost: 0,
      gymMembership: 400,
      comfortSpending: 100,
      sickDaysUsed: 5,
    },
    career: {
      yearsInRole: 2,
      burnoutRisk: 'medium',
      lookingToLeave: false,
    },
  });

  const results = useMemo(() => calculateStressValue(inputs), [inputs]);

  const updateIntensity = (key: keyof StressInputs['intensity'], value: number) => {
    setInputs(prev => ({
      ...prev,
      intensity: { ...prev.intensity, [key]: value },
    }));
  };

  const updateStress = (key: keyof StressInputs['stress'], value: number) => {
    setInputs(prev => ({
      ...prev,
      stress: { ...prev.stress, [key]: value },
    }));
  };

  const selectProfile = (profileId: string) => {
    const profile = STRESS_PROFILES.find(p => p.id === profileId);
    if (profile) {
      setInputs(prev => ({
        ...prev,
        intensity: { ...prev.intensity, ...profile.defaults.intensity },
        workHours: { ...prev.workHours, unpaidOvertime: profile.defaults.workHours.unpaidOvertime },
      }));
    }
  };

  const formatCurrency = (value: number) => `£${value.toLocaleString()}`;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-neutral-400';
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 border-red-500/30';
      default: return 'bg-neutral-500/20 border-neutral-500/30';
    }
  };

  return (
    <section id="stress" className="py-20 px-4 bg-gradient-to-b from-[#111] to-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
            <span className="text-red-400 text-sm font-medium">Stress Value</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What's Your Stress Really Costing You?
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto mb-4">
            Quantify the hidden costs of job stress: unpaid overtime, health expenses,
            coping mechanisms, and career impact. Is your pay worth the stress?
          </p>
          <SaveToReportButton
            calculatorType="intensity"
            inputs={inputs}
            results={results}
            getDescription={() => `Stress-adjusted wage analysis`}
          />
        </div>

        {/* Job Profile Quick Select */}
        <div className="card card-glow p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Profile</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {STRESS_PROFILES.map(profile => (
              <button
                key={profile.id}
                onClick={() => selectProfile(profile.id)}
                className="p-3 rounded-xl bg-[#1a1a1a] border border-white/10 hover:border-white/20 text-center transition-all"
              >
                <div className="text-2xl mb-1">{profile.icon}</div>
                <div className="text-xs text-neutral-400">{profile.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            {/* Work Hours */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Work Hours</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Contracted</label>
                  <input
                    type="number"
                    value={inputs.workHours.contractedHours}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      workHours: { ...prev.workHours, contractedHours: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Actual</label>
                  <input
                    type="number"
                    value={inputs.workHours.actualHours}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      workHours: { ...prev.workHours, actualHours: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Unpaid OT</label>
                  <input
                    type="number"
                    value={inputs.workHours.unpaidOvertime}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      workHours: { ...prev.workHours, unpaidOvertime: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Work Intensity */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Work Intensity</h3>
              <div className="space-y-4">
                {[
                  { key: 'deadlinePressure', label: 'Deadline Pressure', emoji: '⏰' },
                  { key: 'meetingLoad', label: 'Meeting Overload', emoji: '📅' },
                  { key: 'multitasking', label: 'Constant Multitasking', emoji: '🔀' },
                  { key: 'autonomy', label: 'Autonomy (10=high)', emoji: '🎯', inverted: true },
                  { key: 'micromanagement', label: 'Micromanagement', emoji: '👀' },
                ].map(item => (
                  <div key={item.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-400">{item.emoji} {item.label}</span>
                      <span className={item.inverted
                        ? inputs.intensity[item.key as keyof StressInputs['intensity']] > 5 ? 'text-green-400' : 'text-orange-400'
                        : inputs.intensity[item.key as keyof StressInputs['intensity']] > 5 ? 'text-orange-400' : 'text-green-400'
                      }>
                        {inputs.intensity[item.key as keyof StressInputs['intensity']]}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      value={inputs.intensity[item.key as keyof StressInputs['intensity']]}
                      onChange={e => updateIntensity(item.key as keyof StressInputs['intensity'], parseInt(e.target.value))}
                      className="w-full accent-red-500"
                      min="1"
                      max="10"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Stress Symptoms */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Stress Symptoms</h3>
              <div className="space-y-4">
                {[
                  { key: 'sleepQuality', label: 'Sleep Quality (10=good)', emoji: '😴', inverted: true },
                  { key: 'anxietyLevel', label: 'Work Anxiety', emoji: '😰' },
                  { key: 'workLifeBalance', label: 'Work-Life Balance (10=good)', emoji: '⚖️', inverted: true },
                  { key: 'physicalSymptoms', label: 'Physical Symptoms', emoji: '🤕' },
                  { key: 'mentalFatigue', label: 'Mental Exhaustion', emoji: '🧠' },
                ].map(item => (
                  <div key={item.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-400">{item.emoji} {item.label}</span>
                      <span className={item.inverted
                        ? inputs.stress[item.key as keyof StressInputs['stress']] > 5 ? 'text-green-400' : 'text-orange-400'
                        : inputs.stress[item.key as keyof StressInputs['stress']] > 5 ? 'text-orange-400' : 'text-green-400'
                      }>
                        {inputs.stress[item.key as keyof StressInputs['stress']]}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      value={inputs.stress[item.key as keyof StressInputs['stress']]}
                      onChange={e => updateStress(item.key as keyof StressInputs['stress'], parseInt(e.target.value))}
                      className="w-full accent-red-500"
                      min="1"
                      max="10"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Compensation & Coping Costs */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Compensation & Coping</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Salary (£/yr)</label>
                  <input
                    type="number"
                    value={inputs.compensation.salary}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      compensation: { ...prev.compensation, salary: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Bonus (£/yr)</label>
                  <input
                    type="number"
                    value={inputs.compensation.bonus}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      compensation: { ...prev.compensation, bonus: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Therapy (£/yr)</label>
                  <input
                    type="number"
                    value={inputs.health.therapyCost}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      health: { ...prev.health, therapyCost: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">"Treats" (£/mo)</label>
                  <input
                    type="number"
                    value={inputs.health.comfortSpending}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      health: { ...prev.health, comfortSpending: parseFloat(e.target.value) || 0 },
                    }))}
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.career.lookingToLeave}
                    onChange={e => setInputs(prev => ({
                      ...prev,
                      career: { ...prev.career, lookingToLeave: e.target.checked },
                    }))}
                    className="w-5 h-5 rounded border-white/20 bg-[#1a1a1a] accent-red-500"
                  />
                  <span className="text-neutral-300">I'm actively looking to leave this job</span>
                </label>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Burnout Risk */}
            <div className={`card p-6 border ${getRiskBg(results.scores.burnoutRisk)}`}>
              <div className="flex items-center gap-4">
                <div className="text-5xl">
                  {results.scores.burnoutRisk === 'critical' ? '🔥' :
                    results.scores.burnoutRisk === 'high' ? '⚠️' :
                      results.scores.burnoutRisk === 'medium' ? '😐' : '✅'}
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${getRiskColor(results.scores.burnoutRisk)}`}>
                    {results.scores.burnoutRisk.charAt(0).toUpperCase() + results.scores.burnoutRisk.slice(1)} Burnout Risk
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Work Intensity: {results.scores.workIntensity}/100 | Stress: {results.scores.stressLevel}/100
                  </p>
                </div>
              </div>
            </div>

            {/* Score Gauges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{results.scores.workIntensity}</div>
                <div className="text-xs text-neutral-500">Work Intensity</div>
                <div className="mt-2 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${results.scores.workIntensity}%` }}
                  />
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{results.scores.stressLevel}</div>
                <div className="text-xs text-neutral-500">Stress Level</div>
                <div className="mt-2 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${results.scores.stressLevel}%` }}
                  />
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{results.scores.overallWellbeing}</div>
                <div className="text-xs text-neutral-500">Wellbeing</div>
                <div className="mt-2 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${results.scores.overallWellbeing}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Hidden Costs */}
            <div className="card card-glow p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Hidden Costs of Your Stress</h3>
              <div className="space-y-3">
                {[
                  { label: 'Unpaid Overtime Value', value: results.costs.unpaidOvertimeValue, color: 'red' },
                  { label: 'Health & Coping Costs', value: results.costs.healthCosts + results.costs.comfortSpending, color: 'orange' },
                  { label: 'Productivity Loss (est.)', value: results.costs.productivityLoss, color: 'yellow' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">{item.label}</span>
                    <span className={`text-sm font-medium text-${item.color}-400`}>
                      -{formatCurrency(item.value)}/yr
                    </span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-white font-medium">Total Hidden Costs</span>
                  <span className="text-lg font-bold text-red-400">
                    -{formatCurrency(results.costs.totalHiddenCosts)}/yr
                  </span>
                </div>
              </div>
            </div>

            {/* Adjusted Pay */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Real Compensation</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Gross Pay + Benefits</span>
                  <span className="text-white">{formatCurrency(results.adjustedCompensation.grossPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Minus Hidden Costs</span>
                  <span className="text-red-400">-{formatCurrency(results.costs.totalHiddenCosts)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-medium">Effective Value</span>
                  <span className="text-lg font-bold text-green-400">
                    {formatCurrency(results.adjustedCompensation.minusHiddenCosts)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-[#1a1a1a] rounded-xl">
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-400">
                      £{results.adjustedCompensation.effectiveHourlyRate.toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-500">Effective £/hr</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-cyan-400">
                      £{results.adjustedCompensation.stressAdjustedRate.toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-500">Stress-Adjusted £/hr</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Equivalents */}
            <div className="card p-6 border-purple-500/30 bg-purple-500/5">
              <h3 className="text-lg font-semibold text-white mb-4">Stress Equivalents</h3>
              <div className="space-y-4">
                {results.comparison.stressFreePremium > 0 && (
                  <div>
                    <div className="text-sm text-neutral-400">Fair compensation for this stress level:</div>
                    <div className="text-xl font-bold text-purple-400">
                      {formatCurrency(inputs.compensation.salary + results.comparison.stressFreePremium)}/yr
                    </div>
                    <div className="text-xs text-purple-300">
                      (+{formatCurrency(results.comparison.stressFreePremium)} stress premium)
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-neutral-400">A less stressful job at this salary equals:</div>
                  <div className="text-xl font-bold text-green-400">
                    {formatCurrency(results.comparison.equivalentLowerSalary)}/yr
                  </div>
                  <div className="text-xs text-green-300">in a low-stress environment</div>
                </div>
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

            {/* Recommendations */}
            {results.recommendations.length > 0 && (
              <div className="card p-6 border-yellow-500/30 bg-yellow-500/5">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Recommendations</h3>
                <ul className="space-y-2">
                  {results.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-neutral-300 flex items-start gap-2">
                      <span className="text-yellow-500">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
