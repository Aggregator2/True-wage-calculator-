'use client';

import { useState, useMemo } from 'react';
import { calculateCarersAllowance, CARING_ROLES, ALLOWABLE_DEDUCTIONS, CarersInputs } from '@/lib/carers-calculator';
import SaveToReportButton from './SaveToReportButton';

export default function CarersCalculator() {
  const [inputs, setInputs] = useState<CarersInputs>({
    hoursCaringPerWeek: 35,
    currentEmploymentStatus: 'employed',
    grossWeeklyEarnings: 100,
    otherBenefits: {
      statePension: false,
      contributoryESA: false,
      incapacityBenefit: false,
      widowsBenefit: false,
      severeDisablementAllowance: false,
    },
    caredPersonReceives: {
      pip: true,
      dla: false,
      attendanceAllowance: false,
      armedForcesBenefit: false,
    },
    ageOver16: true,
    ageUnderStatePension: true,
    inFullTimeEducation: false,
    livesInUK: true,
  });

  const results = useMemo(() => calculateCarersAllowance(inputs), [inputs]);

  const updateInput = <K extends keyof CarersInputs>(key: K, value: CarersInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const updateOtherBenefit = (key: keyof CarersInputs['otherBenefits'], value: boolean) => {
    setInputs(prev => ({
      ...prev,
      otherBenefits: { ...prev.otherBenefits, [key]: value },
    }));
  };

  const updateCaredPersonBenefit = (key: keyof CarersInputs['caredPersonReceives'], value: boolean) => {
    setInputs(prev => ({
      ...prev,
      caredPersonReceives: { ...prev.caredPersonReceives, [key]: value },
    }));
  };

  return (
    <section id="carers" className="py-20 px-4 bg-gradient-to-b from-[#111] to-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
            <span className="text-pink-400 text-sm font-medium">Carer's Allowance</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Value Your Caring Work
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto mb-4">
            If you spend 35+ hours a week caring for someone with a disability, you may be entitled
            to Carer's Allowance. Check your eligibility and see how it impacts your true hourly wage.
          </p>
          <SaveToReportButton
            calculatorType="carers"
            inputs={inputs}
            results={results}
            getDescription={() => `${inputs.hoursCaringPerWeek} hours/week caring`}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="card card-glow p-6 md:p-8">
            <h3 className="text-lg font-semibold text-white mb-6">Your Caring Situation</h3>

            {/* Hours Caring */}
            <div className="mb-6">
              <label className="block text-sm text-neutral-400 mb-2">
                Hours caring per week: <span className="text-pink-400 font-semibold">{inputs.hoursCaringPerWeek}</span>
              </label>
              <input
                type="range"
                value={inputs.hoursCaringPerWeek}
                onChange={e => updateInput('hoursCaringPerWeek', parseInt(e.target.value))}
                className="w-full accent-pink-500"
                min="0"
                max="100"
                step="1"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>0 hrs</span>
                <span className={inputs.hoursCaringPerWeek >= 35 ? 'text-green-400' : 'text-orange-400'}>
                  35 hrs (minimum)
                </span>
                <span>100 hrs</span>
              </div>
            </div>

            {/* Employment Status */}
            <div className="mb-6">
              <label className="block text-sm text-neutral-400 mb-2">Employment Status</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'employed', label: 'Employed', icon: '💼' },
                  { value: 'self_employed', label: 'Self-employed', icon: '🏠' },
                  { value: 'unemployed', label: 'Not working', icon: '🔍' },
                  { value: 'student', label: 'Student', icon: '📚' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateInput('currentEmploymentStatus', opt.value as CarersInputs['currentEmploymentStatus'])}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      inputs.currentEmploymentStatus === opt.value
                        ? 'bg-pink-500/20 border-pink-500/50'
                        : 'bg-[#1a1a1a] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-lg mr-2">{opt.icon}</span>
                    <span className={`text-sm ${inputs.currentEmploymentStatus === opt.value ? 'text-pink-300' : 'text-white'}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Earnings */}
            {inputs.currentEmploymentStatus !== 'unemployed' && (
              <div className="mb-6">
                <label className="block text-sm text-neutral-400 mb-2">
                  Gross Weekly Earnings (£)
                  <span className="text-neutral-500 ml-2">Limit: £151/week</span>
                </label>
                <input
                  type="number"
                  value={inputs.grossWeeklyEarnings}
                  onChange={e => updateInput('grossWeeklyEarnings', parseFloat(e.target.value) || 0)}
                  className="input-field w-full px-4 py-3"
                />
                <div className="mt-2 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      inputs.grossWeeklyEarnings <= 151 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, (inputs.grossWeeklyEarnings / 151) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {inputs.grossWeeklyEarnings <= 151
                    ? `£${(151 - inputs.grossWeeklyEarnings).toFixed(0)} under the earnings limit`
                    : `£${(inputs.grossWeeklyEarnings - 151).toFixed(0)} over the limit - not eligible`}
                </p>
              </div>
            )}

            {/* Person You Care For */}
            <div className="mb-6">
              <label className="block text-sm text-neutral-400 mb-2">
                The person you care for receives:
              </label>
              <div className="space-y-2">
                {[
                  { key: 'pip', label: 'PIP (Daily Living component)' },
                  { key: 'dla', label: 'DLA (middle/higher care rate)' },
                  { key: 'attendanceAllowance', label: 'Attendance Allowance' },
                  { key: 'armedForcesBenefit', label: 'Armed Forces Independence Payment' },
                ].map(benefit => (
                  <label key={benefit.key} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={inputs.caredPersonReceives[benefit.key as keyof CarersInputs['caredPersonReceives']]}
                      onChange={e => updateCaredPersonBenefit(benefit.key as keyof CarersInputs['caredPersonReceives'], e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-[#1a1a1a] accent-pink-500"
                    />
                    <span className="text-sm text-neutral-300">{benefit.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Your Other Benefits */}
            <div className="mb-6">
              <label className="block text-sm text-neutral-400 mb-2">
                Do you receive any of these? (may affect payment)
              </label>
              <div className="space-y-2">
                {[
                  { key: 'statePension', label: 'State Pension' },
                  { key: 'contributoryESA', label: 'Contributory ESA' },
                  { key: 'incapacityBenefit', label: 'Incapacity Benefit' },
                  { key: 'widowsBenefit', label: "Widow's Benefit" },
                  { key: 'severeDisablementAllowance', label: 'Severe Disablement Allowance' },
                ].map(benefit => (
                  <label key={benefit.key} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={inputs.otherBenefits[benefit.key as keyof CarersInputs['otherBenefits']]}
                      onChange={e => updateOtherBenefit(benefit.key as keyof CarersInputs['otherBenefits'], e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-[#1a1a1a] accent-pink-500"
                    />
                    <span className="text-sm text-neutral-300">{benefit.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Other Criteria */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={inputs.inFullTimeEducation}
                  onChange={e => updateInput('inFullTimeEducation', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-[#1a1a1a] accent-pink-500"
                />
                <span className="text-sm text-neutral-300">I'm in full-time education (21+ hrs/week)</span>
              </label>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Eligibility Status */}
            <div className={`card p-6 ${results.eligible ? 'border-green-500/30 bg-green-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{results.eligible ? '✅' : '⚠️'}</span>
                <div>
                  <h3 className={`text-xl font-bold ${results.eligible ? 'text-green-400' : 'text-orange-400'}`}>
                    {results.eligible ? 'You May Be Eligible!' : 'Not Currently Eligible'}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    {results.eligible
                      ? 'Based on your answers, you could claim Carer\'s Allowance'
                      : 'Check the reasons below to see what\'s needed'}
                  </p>
                </div>
              </div>

              {results.eligible && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 rounded-xl bg-[#1a1a1a]">
                    <div className="text-2xl font-bold text-pink-400">£{results.weeklyAllowance.toFixed(2)}</div>
                    <div className="text-xs text-neutral-500">Per week</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1a1a1a]">
                    <div className="text-2xl font-bold text-pink-400">£{results.annualAllowance.toLocaleString()}</div>
                    <div className="text-xs text-neutral-500">Per year</div>
                  </div>
                </div>
              )}
            </div>

            {/* Eligibility Reasons */}
            <div className="card p-6">
              <h4 className="text-sm font-medium text-neutral-400 mb-3">Eligibility Checklist</h4>
              <ul className="space-y-2">
                {results.eligibilityReasons.map((reason, idx) => {
                  const isPositive = reason.includes('met') || reason.includes('within') || reason.includes('receives a qualifying');
                  return (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className={isPositive ? 'text-green-500' : 'text-orange-500'}>
                        {isPositive ? '✓' : '✗'}
                      </span>
                      <span className="text-neutral-300">{reason}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Effective Hourly Rate */}
            <div className="card p-6">
              <h4 className="text-sm font-medium text-neutral-400 mb-3">Value of Your Caring Work</h4>
              <div className="flex items-end gap-4">
                <div>
                  <div className="text-3xl font-bold text-pink-400">
                    £{results.effectiveHourlyRate.toFixed(2)}
                  </div>
                  <div className="text-xs text-neutral-500">Per caring hour</div>
                </div>
                <div className="text-sm text-neutral-400">
                  {results.effectiveHourlyRate < 5 && (
                    <span className="text-orange-400">Below minimum wage</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                Carer's Allowance values your {inputs.hoursCaringPerWeek} hours of caring work at this rate.
                The true economic value of unpaid care in the UK is estimated at £162 billion per year.
              </p>
            </div>

            {/* NI Credits */}
            {results.niCredits && (
              <div className="card p-6 border-purple-500/30 bg-purple-500/5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h4 className="text-white font-medium">State Pension Protected</h4>
                    <p className="text-sm text-neutral-400">
                      You'll receive National Insurance credits, protecting your State Pension entitlement.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Overlapping Benefits Warning */}
            {results.overlappingBenefits.length > 0 && (
              <div className="card p-6 border-yellow-500/30 bg-yellow-500/5">
                <h4 className="text-yellow-400 font-medium mb-2">⚠️ Overlapping Benefits</h4>
                <ul className="space-y-2">
                  {results.overlappingBenefits.map((benefit, idx) => (
                    <li key={idx} className="text-sm text-neutral-300">{benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Insights */}
            {results.insights.length > 0 && (
              <div className="card p-6">
                <h4 className="text-sm font-medium text-neutral-400 mb-3">Tips & Insights</h4>
                <div className="space-y-2">
                  {results.insights.map((insight, idx) => (
                    <p key={idx} className="text-sm text-neutral-300">{insight}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Benefits Section */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">Other Support for Carers</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {results.additionalBenefits.map((benefit, idx) => (
              <div key={idx} className="card p-5">
                <h4 className="text-white font-medium mb-1">{benefit.name}</h4>
                <p className="text-sm text-neutral-400 mb-2">{benefit.description}</p>
                <span className="text-xs text-pink-400">{benefit.potentialValue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Caring Roles Info */}
        <div className="mt-12 card p-6 md:p-8">
          <h3 className="text-lg font-semibold text-white mb-4">What Counts as Caring?</h3>
          <p className="text-sm text-neutral-400 mb-6">
            All of these activities count towards your 35 hours per week:
          </p>
          <div className="grid md:grid-cols-5 gap-4">
            {CARING_ROLES.map(role => (
              <div key={role.id} className="p-4 rounded-xl bg-[#1a1a1a]">
                <h4 className="text-white font-medium text-sm mb-1">{role.name}</h4>
                <p className="text-xs text-neutral-500 mb-2">{role.description}</p>
                <span className="text-xs text-pink-400">{role.typicalHours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deductions Info */}
        <div className="mt-6 card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Reducing Your Earnings for Eligibility</h3>
          <p className="text-sm text-neutral-400 mb-4">
            These deductions can be subtracted from your gross earnings to help you qualify:
          </p>
          <div className="grid md:grid-cols-5 gap-3">
            {ALLOWABLE_DEDUCTIONS.map((deduction, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#1a1a1a] text-center">
                <h4 className="text-white font-medium text-sm">{deduction.name}</h4>
                <p className="text-xs text-neutral-500 mt-1">{deduction.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
