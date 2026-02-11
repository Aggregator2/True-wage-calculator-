'use client';

import { useState, useMemo } from 'react';
import { ALL_LOCATIONS, Location } from '@/lib/locations-data';
import { INDUSTRIES, getJobById, REMOTEABILITY_LABELS, DEMAND_LABELS, VISA_LABELS, Job } from '@/lib/jobs-data';
import LocationSearch from './LocationSearch';
import { useCalculatorStore } from '@/lib/store';
import { saveComparisonScenario } from '@/lib/scenarios';

interface GeoInputs {
  currentLocationId: string;
  targetLocationId: string;
  industryId: string;
  jobId: string;
  customSalary?: number;
  isRemoteWork: boolean;
  remoteSalaryRetention: number;
  housingType: 'rent_1bed' | 'rent_2bed';
  monthlyExpenses: {
    transport: number;
    groceries: number;
    utilities: number;
    entertainment: number;
    healthcare: number;
  };
}

interface LocationResult {
  location: Location;
  expectedSalary: number;
  monthlyCosts: {
    housing: number;
    transport: number;
    groceries: number;
    utilities: number;
    entertainment: number;
    healthcare: number;
    total: number;
  };
  annualCosts: number;
  lifestyleScore: number;
  purchasingPower: number;
}

function calculateLocationResult(
  location: Location,
  baseSalary: number,
  isRemote: boolean,
  remoteRetention: number,
  expenses: GeoInputs['monthlyExpenses'],
  housingType: 'rent_1bed' | 'rent_2bed',
  currentLocation: Location
): LocationResult {
  let expectedSalary: number;
  if (isRemote) {
    expectedSalary = baseSalary * (remoteRetention / 100);
  } else {
    const costRatio = location.housingIndex / 100;
    expectedSalary = baseSalary * Math.max(0.5, Math.min(2.5, costRatio));
  }

  const housing = housingType === 'rent_1bed' ? location.avgRent1Bed : location.avgRent2Bed;
  const transport = expenses.transport * (location.transportIndex / 100);
  const groceries = expenses.groceries * (location.groceriesIndex / 100);
  const utilities = expenses.utilities * (location.utilitiesIndex / 100);
  const entertainment = expenses.entertainment * (location.entertainmentIndex / 100);
  const healthcare = expenses.healthcare * (location.healthcareIndex / 100);

  const totalMonthly = housing + transport + groceries + utilities + entertainment + healthcare;
  const annualCosts = totalMonthly * 12;

  const lifestyleScore = (
    location.safetyRating +
    location.healthcareQuality +
    location.climateRating +
    (location.englishProficiency / 1.5) +
    location.workLifeBalance
  ) / 5;

  const basePurchasingPower = baseSalary / (currentLocation.avgRent1Bed * 12 +
    (expenses.transport + expenses.groceries + expenses.utilities + expenses.entertainment + expenses.healthcare) * 12);
  const locationPurchasingPower = expectedSalary / annualCosts;
  const purchasingPower = Math.round((locationPurchasingPower / basePurchasingPower) * 100);

  return {
    location,
    expectedSalary: Math.round(expectedSalary),
    monthlyCosts: {
      housing: Math.round(housing),
      transport: Math.round(transport),
      groceries: Math.round(groceries),
      utilities: Math.round(utilities),
      entertainment: Math.round(entertainment),
      healthcare: Math.round(healthcare),
      total: Math.round(totalMonthly),
    },
    annualCosts: Math.round(annualCosts),
    lifestyleScore: Math.round(lifestyleScore * 10) / 10,
    purchasingPower,
  };
}

export default function GeoArbitrageCalculator() {
  const { inputs: mainInputs } = useCalculatorStore();
  const [inputs, setInputs] = useState<GeoInputs>({
    currentLocationId: 'london',
    targetLocationId: 'lisbon',
    industryId: 'technology',
    jobId: 'software_engineer',
    customSalary: mainInputs?.salary || undefined,
    isRemoteWork: true,
    remoteSalaryRetention: 100,
    housingType: 'rent_1bed',
    monthlyExpenses: {
      transport: 150,
      groceries: 300,
      utilities: 150,
      entertainment: 200,
      healthcare: 50,
    },
  });
  const [showResults, setShowResults] = useState(false);
  const [viewMode, setViewMode] = useState<'comparison' | 'all' | 'lifestyle'>('comparison');
  const { user } = useCalculatorStore();

  const selectedIndustry = INDUSTRIES.find(i => i.id === inputs.industryId);
  const selectedJobData = getJobById(inputs.jobId);
  const selectedJob = selectedJobData?.job;

  const baseSalary = inputs.customSalary || selectedJob?.ukAverageSalary || 40000;
  const currentLocation = ALL_LOCATIONS.find(l => l.id === inputs.currentLocationId)!;
  const targetLocation = ALL_LOCATIONS.find(l => l.id === inputs.targetLocationId)!;

  // Check if remote work is viable for this job
  const canWorkRemotely = selectedJob?.remoteability !== 'on_site';
  const isFullyRemote = selectedJob?.remoteability === 'fully_remote';

  // Auto-adjust remote work based on job
  const effectiveIsRemoteWork = canWorkRemotely && inputs.isRemoteWork;

  const results = useMemo(() => {
    if (!showResults || !currentLocation || !targetLocation) return null;

    const currentResult = calculateLocationResult(
      currentLocation,
      baseSalary,
      false,
      100,
      inputs.monthlyExpenses,
      inputs.housingType,
      currentLocation
    );

    const targetResult = calculateLocationResult(
      targetLocation,
      baseSalary,
      effectiveIsRemoteWork,
      inputs.remoteSalaryRetention,
      inputs.monthlyExpenses,
      inputs.housingType,
      currentLocation
    );

    const allResults = ALL_LOCATIONS.map(loc =>
      calculateLocationResult(
        loc,
        baseSalary,
        effectiveIsRemoteWork,
        inputs.remoteSalaryRetention,
        inputs.monthlyExpenses,
        inputs.housingType,
        currentLocation
      )
    ).sort((a, b) => b.purchasingPower - a.purchasingPower);

    const netBenefit = (targetResult.expectedSalary - targetResult.annualCosts) -
      (currentResult.expectedSalary - currentResult.annualCosts);

    return {
      current: currentResult,
      target: targetResult,
      all: allResults,
      netAnnualBenefit: netBenefit,
      monthlySavings: Math.round((currentResult.monthlyCosts.total - targetResult.monthlyCosts.total)),
      bestForMoney: allResults[0].location.name,
      bestForLifestyle: [...allResults].sort((a, b) => b.lifestyleScore - a.lifestyleScore)[0].location.name,
    };
  }, [showResults, currentLocation, targetLocation, baseSalary, inputs, effectiveIsRemoteWork]);

  const updateInput = <K extends keyof GeoInputs>(key: K, value: GeoInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const updateExpense = (key: keyof GeoInputs['monthlyExpenses'], value: number) => {
    setInputs(prev => ({
      ...prev,
      monthlyExpenses: { ...prev.monthlyExpenses, [key]: value },
    }));
  };

  // When industry changes, select first job in that industry
  const handleIndustryChange = (industryId: string) => {
    const industry = INDUSTRIES.find(i => i.id === industryId);
    if (industry && industry.jobs.length > 0) {
      setInputs(prev => ({
        ...prev,
        industryId,
        jobId: industry.jobs[0].id,
        customSalary: undefined,
      }));
    }
  };

  const handleJobChange = (jobId: string) => {
    setInputs(prev => ({
      ...prev,
      jobId,
      customSalary: undefined,
    }));
  };

  return (
    <section id="geo-arbitrage" className="py-20 px-4 bg-gradient-to-b from-[#111] to-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <span className="text-purple-400 text-sm font-medium">Geographic Arbitrage</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Where Should You Live?
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Compare cost of living, salaries, and lifestyle across 80+ cities worldwide.
            Find where your money goes furthest based on your career.
          </p>
        </div>

        {/* Input Form */}
        <div className="card card-glow p-6 md:p-8 mb-8">
          {/* Industry Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              Select Your Industry
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {INDUSTRIES.map(industry => (
                <button
                  key={industry.id}
                  onClick={() => handleIndustryChange(industry.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    inputs.industryId === industry.id
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-[#1a1a1a] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-1">{industry.icon}</div>
                  <div className={`text-sm font-medium ${inputs.industryId === industry.id ? 'text-purple-300' : 'text-white'}`}>
                    {industry.name}
                  </div>
                  <div className="text-xs text-neutral-500">{industry.jobs.length} roles</div>
                </button>
              ))}
            </div>
          </div>

          {/* Job Selection */}
          {selectedIndustry && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">💼</span>
                Select Your Role
                <span className="text-sm font-normal text-neutral-500">in {selectedIndustry.name}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedIndustry.jobs.map(job => {
                  const remoteInfo = REMOTEABILITY_LABELS[job.remoteability];
                  const demandInfo = DEMAND_LABELS[job.demandTrend];
                  const isSelected = inputs.jobId === job.id;

                  return (
                    <button
                      key={job.id}
                      onClick={() => handleJobChange(job.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-[#1a1a1a] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`font-medium ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                          {job.title}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${remoteInfo.color}`}>
                          {remoteInfo.icon} {job.remoteability === 'fully_remote' ? 'Remote' : job.remoteability === 'hybrid' ? 'Hybrid' : 'On-site'}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-400 mb-2">
                        UK Avg: £{job.ukAverageSalary.toLocaleString()}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className={demandInfo.color}>{demandInfo.label}</span>
                        {job.freelanceViable && (
                          <span className="text-cyan-400">Freelance OK</span>
                        )}
                        {job.visaSponsorship === 'common' && (
                          <span className="text-green-400">Visa Sponsor</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Job Details Card */}
          {selectedJob && (
            <div className="mb-8 p-4 rounded-xl bg-[#1a1a1a] border border-white/10">
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <h4 className="text-white font-medium">{selectedJob.title}</h4>
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-400">UK Average: £{selectedJob.ukAverageSalary.toLocaleString()}/yr</span>
              </div>
              <p className="text-sm text-neutral-500 mb-4">{selectedJob.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500 block">Remote Work</span>
                  <span className={`font-medium ${REMOTEABILITY_LABELS[selectedJob.remoteability].color.split(' ')[0]}`}>
                    {REMOTEABILITY_LABELS[selectedJob.remoteability].icon} {REMOTEABILITY_LABELS[selectedJob.remoteability].label}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Job Market</span>
                  <span className={`font-medium ${DEMAND_LABELS[selectedJob.demandTrend].color}`}>
                    {DEMAND_LABELS[selectedJob.demandTrend].label}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Visa Sponsorship</span>
                  <span className={`font-medium ${VISA_LABELS[selectedJob.visaSponsorship].color}`}>
                    {VISA_LABELS[selectedJob.visaSponsorship].label}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Freelance</span>
                  <span className={`font-medium ${selectedJob.freelanceViable ? 'text-green-400' : 'text-neutral-500'}`}>
                    {selectedJob.freelanceViable ? '✓ Viable' : '✗ Not typical'}
                  </span>
                </div>
              </div>

              {/* Custom Salary Override */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <label className="block text-sm text-neutral-400 mb-2">
                  Your Actual Salary (£) <span className="text-neutral-600">optional override</span>
                </label>
                <input
                  type="number"
                  value={inputs.customSalary || ''}
                  onChange={e => updateInput('customSalary', parseFloat(e.target.value) || undefined)}
                  placeholder={selectedJob.ukAverageSalary.toString()}
                  className="input-field w-full md:w-64 px-4 py-2"
                />
              </div>
            </div>
          )}

          {/* Work Arrangement */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              Work Arrangement
            </h3>

            {!canWorkRemotely && (
              <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm">
                ⚠️ <strong>{selectedJob?.title}</strong> is typically an on-site role. Remote work options may be limited.
              </div>
            )}

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => updateInput('isRemoteWork', false)}
                className={`flex-1 px-6 py-4 rounded-xl border transition-all ${
                  !inputs.isRemoteWork
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-[#1a1a1a] border-white/10 text-neutral-400'
                }`}
              >
                <div className="text-2xl mb-1">🏢</div>
                <div className="font-medium">Local Job</div>
                <div className="text-xs text-neutral-500">Find work in target location</div>
              </button>
              <button
                onClick={() => updateInput('isRemoteWork', true)}
                disabled={!canWorkRemotely}
                className={`flex-1 px-6 py-4 rounded-xl border transition-all ${
                  !canWorkRemotely
                    ? 'opacity-50 cursor-not-allowed bg-[#1a1a1a] border-white/10 text-neutral-600'
                    : inputs.isRemoteWork
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-[#1a1a1a] border-white/10 text-neutral-400'
                }`}
              >
                <div className="text-2xl mb-1">💻</div>
                <div className="font-medium">Remote Work</div>
                <div className="text-xs text-neutral-500">
                  {canWorkRemotely ? 'Keep your current salary' : 'Not available for this role'}
                </div>
              </button>
            </div>

            {inputs.isRemoteWork && canWorkRemotely && (
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                <label className="block text-sm text-neutral-400 mb-2">
                  Salary Retention: {inputs.remoteSalaryRetention}%
                  {!isFullyRemote && (
                    <span className="text-yellow-400 ml-2">(Hybrid role - some location adjustment may apply)</span>
                  )}
                </label>
                <input
                  type="range"
                  value={inputs.remoteSalaryRetention}
                  onChange={e => updateInput('remoteSalaryRetention', parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                  min="50"
                  max="100"
                  step="5"
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>

          {/* Location Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              Choose Locations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LocationSearch
                label="Current Location"
                value={inputs.currentLocationId}
                onChange={id => updateInput('currentLocationId', id)}
                placeholder="Search your current city..."
              />
              <LocationSearch
                label="Compare With"
                value={inputs.targetLocationId}
                onChange={id => updateInput('targetLocationId', id)}
                excludeId={inputs.currentLocationId}
                placeholder="Search target city..."
              />
            </div>
          </div>

          {/* Expenses */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">💷</span>
              Monthly Expenses (GBP)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: 'transport', label: 'Transport' },
                { key: 'groceries', label: 'Groceries' },
                { key: 'utilities', label: 'Utilities' },
                { key: 'entertainment', label: 'Entertainment' },
                { key: 'healthcare', label: 'Healthcare' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-neutral-500 mb-1">{label}</label>
                  <input
                    type="number"
                    value={inputs.monthlyExpenses[key as keyof typeof inputs.monthlyExpenses]}
                    onChange={e =>
                      updateExpense(key as keyof typeof inputs.monthlyExpenses, parseFloat(e.target.value) || 0)
                    }
                    className="input-field w-full px-3 py-2"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Housing */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              Housing
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => updateInput('housingType', 'rent_1bed')}
                className={`flex-1 px-6 py-3 rounded-xl border transition-all ${
                  inputs.housingType === 'rent_1bed'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-[#1a1a1a] border-white/10 text-neutral-400'
                }`}
              >
                1 Bedroom
              </button>
              <button
                onClick={() => updateInput('housingType', 'rent_2bed')}
                className={`flex-1 px-6 py-3 rounded-xl border transition-all ${
                  inputs.housingType === 'rent_2bed'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-[#1a1a1a] border-white/10 text-neutral-400'
                }`}
              >
                2 Bedroom
              </button>
            </div>
          </div>

          {/* Calculate */}
          <div className="text-center">
            <button
              onClick={async () => {
                setShowResults(true);
                // Auto-save if user is logged in
                if (user && currentLocation && targetLocation) {
                  try {
                    await saveComparisonScenario(
                      user.id,
                      `${currentLocation.name} vs ${targetLocation.name}`,
                      'geo',
                      { inputs, results: { currentLocation: currentLocation.name, targetLocation: targetLocation.name, baseSalary } },
                      `Geographic arbitrage comparison`
                    );
                    console.log('Geo comparison auto-saved');
                  } catch (error) {
                    console.error('Failed to auto-save geo comparison:', error);
                  }
                }
              }}
              className="btn-primary px-8 py-4 text-lg"
            >
              Compare Locations
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* View Toggle */}
            <div className="flex justify-center gap-2">
              {(['comparison', 'all', 'lifestyle'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-6 py-2 rounded-xl text-sm transition-all ${
                    viewMode === mode
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                      : 'bg-[#1a1a1a] text-neutral-400 border border-white/10'
                  }`}
                >
                  {mode === 'comparison' ? 'Side-by-Side' : mode === 'all' ? 'All Cities' : 'Lifestyle'}
                </button>
              ))}
            </div>

            {viewMode === 'comparison' && (
              <>
                {/* Side-by-Side Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Location */}
                  <div className="card p-6 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-4xl">{currentLocation.flag}</span>
                      <div>
                        <p className="text-sm text-neutral-400">Current</p>
                        <h3 className="text-xl font-bold text-white">{currentLocation.name}</h3>
                        <p className="text-sm text-neutral-500">{currentLocation.country}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Expected Salary</span>
                        <span className="text-white font-medium">
                          £{results.current.expectedSalary.toLocaleString()}/yr
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Monthly Costs</span>
                        <span className="text-white font-medium">
                          £{results.current.monthlyCosts.total.toLocaleString()}
                        </span>
                      </div>
                      <hr className="border-white/10" />
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Housing</span>
                        <span className="text-neutral-400">£{results.current.monthlyCosts.housing}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Other</span>
                        <span className="text-neutral-400">
                          £{results.current.monthlyCosts.total - results.current.monthlyCosts.housing}
                        </span>
                      </div>
                      <hr className="border-white/10" />
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Lifestyle</span>
                        <span className="text-white">{results.current.lifestyleScore}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Tax Rate</span>
                        <span className="text-neutral-300">{currentLocation.incomeTaxRate}%</span>
                      </div>
                    </div>

                    {currentLocation.jobSearchUrls.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-neutral-500 mb-2">Find {selectedJob?.title} jobs:</p>
                        <div className="flex flex-wrap gap-2">
                          {currentLocation.jobSearchUrls.slice(0, 3).map(link => (
                            <a
                              key={link.name}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                            >
                              {link.name} →
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Target Location */}
                  <div className="card p-6 border-l-4 border-l-purple-500">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-4xl">{targetLocation.flag}</span>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-400">Target</p>
                        <h3 className="text-xl font-bold text-white">{targetLocation.name}</h3>
                        <p className="text-sm text-neutral-500">{targetLocation.country}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {targetLocation.digitalNomadVisa && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            DN Visa
                          </span>
                        )}
                        {targetLocation.incomeTaxRate === 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                            Tax Free
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Expected Salary</span>
                        <span className="text-white font-medium">
                          £{results.target.expectedSalary.toLocaleString()}/yr
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Monthly Costs</span>
                        <div className="text-right">
                          <span className="text-white font-medium">
                            £{results.target.monthlyCosts.total.toLocaleString()}
                          </span>
                          {results.monthlySavings !== 0 && (
                            <span className={`ml-2 text-sm ${results.monthlySavings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {results.monthlySavings > 0 ? '-' : '+'}£{Math.abs(results.monthlySavings)}
                            </span>
                          )}
                        </div>
                      </div>
                      <hr className="border-white/10" />
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Housing</span>
                        <span className="text-neutral-400">£{results.target.monthlyCosts.housing}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Other</span>
                        <span className="text-neutral-400">
                          £{results.target.monthlyCosts.total - results.target.monthlyCosts.housing}
                        </span>
                      </div>
                      <hr className="border-white/10" />
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Lifestyle</span>
                        <span className="text-white">{results.target.lifestyleScore}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Tax Rate</span>
                        <span className="text-neutral-300">{targetLocation.incomeTaxRate}%</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {targetLocation.nomadListUrl && (
                          <a href={targetLocation.nomadListUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
                            NomadList →
                          </a>
                        )}
                        {targetLocation.expatInfoUrl && (
                          <a href={targetLocation.expatInfoUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20">
                            Expat Guide →
                          </a>
                        )}
                      </div>
                      {targetLocation.jobSearchUrls.length > 0 && (
                        <>
                          <p className="text-xs text-neutral-500 mb-2">Find {selectedJob?.title} jobs:</p>
                          <div className="flex flex-wrap gap-2">
                            {targetLocation.jobSearchUrls.slice(0, 3).map(link => (
                              <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                                {link.name} →
                              </a>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="card card-glow p-6 bg-gradient-to-r from-purple-500/10 to-emerald-500/10">
                  <h3 className="text-lg font-semibold text-white mb-6 text-center">
                    {selectedJob?.title}: {currentLocation.name} → {targetLocation.name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-neutral-400 mb-1">Net Annual Benefit</p>
                      <p className={`text-2xl font-bold ${results.netAnnualBenefit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {results.netAnnualBenefit > 0 ? '+' : ''}£{results.netAnnualBenefit.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-neutral-400 mb-1">Monthly Savings</p>
                      <p className={`text-2xl font-bold ${results.monthlySavings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {results.monthlySavings > 0 ? '+' : ''}£{results.monthlySavings}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-neutral-400 mb-1">Purchasing Power</p>
                      <p className={`text-2xl font-bold ${results.target.purchasingPower >= 100 ? 'text-green-400' : 'text-orange-400'}`}>
                        {results.target.purchasingPower}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-neutral-400 mb-1">Lifestyle Score</p>
                      <p className="text-2xl font-bold text-white">{results.target.lifestyleScore}/10</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {viewMode === 'all' && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">All Cities for {selectedJob?.title}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">#</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">City</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-neutral-400">Salary</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-neutral-400">Monthly</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-neutral-400">Power</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-neutral-400">Lifestyle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.all.slice(0, 25).map((loc, idx) => (
                        <tr key={loc.location.id}
                          className={`border-b border-white/5 ${
                            loc.location.id === inputs.currentLocationId ? 'bg-blue-500/5' :
                            loc.location.id === inputs.targetLocationId ? 'bg-purple-500/5' : ''
                          }`}>
                          <td className="py-3 px-4 text-neutral-500">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span>{loc.location.flag}</span>
                              <span className="text-white">{loc.location.name}</span>
                              {loc.location.digitalNomadVisa && (
                                <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">DN</span>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 text-neutral-300">£{loc.expectedSalary.toLocaleString()}</td>
                          <td className="text-right py-3 px-4 text-neutral-300">£{loc.monthlyCosts.total}</td>
                          <td className="text-right py-3 px-4">
                            <span className={loc.purchasingPower >= 100 ? 'text-green-400' : 'text-orange-400'}>
                              {loc.purchasingPower}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-neutral-300">{loc.lifestyleScore}/10</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'lifestyle' && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Lifestyle Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[results.current, results.target].map((loc) => (
                    <div key={loc.location.id} className="p-4 rounded-xl bg-[#1a1a1a]">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{loc.location.flag}</span>
                        <div>
                          <h4 className="text-white font-medium">{loc.location.name}</h4>
                          <p className="text-sm text-neutral-500">{loc.location.country}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Safety', value: loc.location.safetyRating, icon: '🛡️' },
                          { label: 'Healthcare', value: loc.location.healthcareQuality, icon: '🏥' },
                          { label: 'Climate', value: loc.location.climateRating, icon: '☀️' },
                          { label: 'English', value: loc.location.englishProficiency, icon: '🗣️' },
                          { label: 'Work-Life', value: loc.location.workLifeBalance, icon: '⚖️' },
                        ].map(metric => (
                          <div key={metric.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-neutral-400">{metric.icon} {metric.label}</span>
                              <span className="text-white">{metric.value}/10</span>
                            </div>
                            <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400"
                                style={{ width: `${metric.value * 10}%` }} />
                            </div>
                          </div>
                        ))}
                        <hr className="border-white/10 my-4" />
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-400">🌐 Internet</span>
                          <span className="text-white">{loc.location.internetSpeed} Mbps</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-400">📋 Visa</span>
                          <span className={
                            loc.location.visaEase === 'easy' ? 'text-green-400' :
                            loc.location.visaEase === 'moderate' ? 'text-yellow-400' : 'text-red-400'
                          }>
                            {loc.location.visaEase.charAt(0).toUpperCase() + loc.location.visaEase.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-4 text-center">
                <div className="text-3xl mb-2">💰</div>
                <p className="text-sm text-neutral-400 mb-1">Best Purchasing Power</p>
                <p className="text-white font-semibold">{results.bestForMoney}</p>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl mb-2">🌴</div>
                <p className="text-sm text-neutral-400 mb-1">Best Lifestyle</p>
                <p className="text-white font-semibold">{results.bestForLifestyle}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
