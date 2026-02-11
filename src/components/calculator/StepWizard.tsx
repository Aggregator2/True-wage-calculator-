'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { calculate } from '@/lib/calculator';
import { savePrimaryScenario } from '@/lib/scenarios';
import StepProgress from './StepProgress';
import StepIncome from './StepIncome';
import StepTime from './StepTime';
import StepCosts from './StepCosts';
import StepWellbeing from './StepWellbeing';
import ResultsDashboard from './ResultsDashboard';
import LiveSidebar from './LiveSidebar';

const stepLabels = ['Income', 'Time', 'Costs', 'Wellbeing', 'Results'];

export default function StepWizard() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { inputs, setResults, user } = useCalculatorStore();

  const totalSteps = 5; // 4 input steps + 1 results
  const isResults = step === 4;

  const goNext = useCallback(async () => {
    if (step === 3) {
      // Calculate and save before showing results
      const results = calculate(inputs);
      setResults(results);

      if (user) {
        setSaving(true);
        try {
          await savePrimaryScenario(user.id, inputs, results);
        } catch (err) {
          console.error('Failed to save:', err);
        } finally {
          setSaving(false);
        }
      }
    }

    setDirection('forward');
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [step, inputs, setResults, user]);

  const goBack = useCallback(() => {
    setDirection('back');
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setDirection('back');
    setStep(0);
  }, []);

  // Scroll to top of container on step change
  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const renderStep = () => {
    switch (step) {
      case 0: return <StepIncome />;
      case 1: return <StepTime />;
      case 2: return <StepCosts />;
      case 3: return <StepWellbeing />;
      case 4: return <ResultsDashboard onReset={reset} />;
      default: return null;
    }
  };

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto px-6 py-8">
      {/* Progress */}
      <StepProgress currentStep={step} totalSteps={totalSteps} labels={stepLabels} />

      {/* Main layout: step content + sidebar */}
      <div className={`grid gap-8 ${isResults ? '' : 'lg:grid-cols-[1fr,320px]'}`}>
        {/* Step content */}
        <div className="card p-6 md:p-8 border-zinc-800 min-h-[400px]">
          <div
            key={step}
            style={{
              animation: `${direction === 'forward' ? 'slideInRight' : 'slideInLeft'} 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          >
            {renderStep()}
          </div>

          {/* Navigation buttons (not on results) */}
          {!isResults && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.04]">
              <button
                onClick={goBack}
                disabled={step === 0}
                className="btn-ghost px-5 py-2.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="flex items-center gap-3">
                {step < 3 && (
                  <button
                    onClick={goNext}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={goNext}
                  disabled={saving}
                  className="btn-primary px-6 py-2.5 text-sm font-semibold flex items-center gap-1.5"
                >
                  {step === 3 ? (
                    saving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      'See My Results'
                    )
                  ) : (
                    <>
                      Continue
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live sidebar (not on results) */}
        {!isResults && (
          <div className="hidden lg:block">
            <LiveSidebar currentStep={step} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
