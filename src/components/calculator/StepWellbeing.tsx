'use client';

import { useCalculatorStore } from '@/lib/store';

const stressLabels = [
  { min: 0, max: 0, label: 'Love my job', emoji: '' },
  { min: 1, max: 3, label: 'Mostly fine', emoji: '' },
  { min: 4, max: 6, label: 'It takes a toll', emoji: '' },
  { min: 7, max: 10, label: 'Stressed', emoji: '' },
  { min: 11, max: 15, label: 'Burning out', emoji: '' },
  { min: 16, max: 20, label: 'Need to leave', emoji: '' },
];

function getStressLabel(val: number): string {
  const match = stressLabels.find((s) => val >= s.min && val <= s.max);
  return match ? match.label : '';
}

export default function StepWellbeing() {
  const { inputs, setInputs } = useCalculatorStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-lg text-xl text-white mb-1">Your Wellbeing</h2>
        <p className="text-sm text-zinc-500">
          Optional — quantify the hidden cost of workplace stress.
        </p>
      </div>

      {/* Stress slider */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Stress Factor
        </label>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-400">{getStressLabel(inputs.stressTax)}</span>
            <span className="text-lg font-bold text-emerald-400 font-[var(--font-heading)]">
              {inputs.stressTax}%
            </span>
          </div>
          <input
            type="range"
            value={inputs.stressTax}
            onChange={(e) => setInputs({ stressTax: parseInt(e.target.value, 10) || 0 })}
            min="0"
            max="20"
            step="1"
            className="w-full"
            aria-label="Stress factor percentage"
          />
          <div className="flex justify-between text-xs text-zinc-600 mt-2">
            <span>0% — No stress</span>
            <span>20% — Severe</span>
          </div>
        </div>
        <p className="text-xs text-zinc-600 mt-2">
          This reduces your net earnings by the selected percentage, reflecting the personal cost of stress.
        </p>
      </div>

      {/* Info */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-400 leading-relaxed">
          <span className="text-zinc-300 font-medium">Why stress matters:</span> High workplace stress leads to higher healthcare costs, reduced productivity in personal life, and can impact decisions about career changes. This factor helps you see the full picture.
        </p>
      </div>

      {/* Skip hint */}
      <p className="text-xs text-zinc-600 text-center">
        Not sure? Leave at 0% — you can always adjust later.
      </p>
    </div>
  );
}
