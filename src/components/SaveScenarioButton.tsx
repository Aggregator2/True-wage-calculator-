'use client';

import { useState } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { saveScenario, saveComparisonScenario, countUserScenarios, type CalculatorType } from '@/lib/scenarios';

interface SaveScenarioButtonProps {
  // For specific calculators (commute, geo, pension, etc.)
  calculatorType?: CalculatorType;
  customData?: {
    inputs: any;
    results: any;
  };
}

export default function SaveScenarioButton({ calculatorType, customData }: SaveScenarioButtonProps) {
  const { user, inputs, results, setShowAuthModal, setShowPremiumModal } = useCalculatorStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [description, setDescription] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const FREE_SCENARIO_LIMIT = 3;

  // Use custom data if provided, otherwise use main calculator data
  const dataToSave = customData || (results ? { inputs, results } : null);
  const effectiveCalculatorType = calculatorType || 'main';

  if (!dataToSave) return null;

  const handleSave = async () => {
    if (!user) {
      setShowAuthModal(true, 'sign_in');
      return;
    }

    if (!showNameInput) {
      // Check scenario limit for free users before showing input
      const count = await countUserScenarios(user.id);
      // TODO: Check premium status - for now allow up to limit
      if (count >= FREE_SCENARIO_LIMIT) {
        setShowPremiumModal(true);
        return;
      }
      setShowNameInput(true);
      return;
    }

    if (!scenarioName.trim()) {
      setError('Please enter a name for this scenario');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (calculatorType && customData) {
        // Save to new multi-calculator scenarios table
        const result = await saveComparisonScenario(
          user.id,
          scenarioName.trim(),
          effectiveCalculatorType,
          customData,
          description.trim() || undefined
        );
        if (!result.success) throw new Error(result.error);
      } else {
        // Legacy: Save to saved_scenarios table (main calculator)
        await saveScenario(scenarioName.trim(), inputs, results!);
      }

      setSaveSuccess(true);
      setShowNameInput(false);
      setScenarioName('');
      setDescription('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scenario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowNameInput(false);
    setScenarioName('');
    setDescription('');
    setError(null);
  };

  if (saveSuccess) {
    return (
      <div className="card p-6 border-[#10b981]/30 bg-[#10b981]/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#10b981]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[#10b981]">Scenario Saved!</h3>
            <p className="text-sm text-neutral-400">View it in your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Save This Scenario</h3>
            <p className="text-sm text-neutral-400">
              {user ? 'Save for comparison in your report' : 'Sign in to save and track scenarios'}
            </p>
          </div>
        </div>

        {showNameInput ? (
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g., Cycle to work, Move to Lisbon..."
              className="input-field px-4 py-2.5 text-sm w-full md:w-72"
              autoFocus
            />
            {calculatorType && (
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes..."
                className="input-field px-4 py-2.5 text-sm w-full md:w-72"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary px-5 py-2.5 text-sm flex-1 sm:flex-none"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSave}
            className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            {user ? 'Save Scenario' : 'Sign In to Save'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-3">{error}</p>
      )}
    </div>
  );
}
