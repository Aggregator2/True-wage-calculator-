'use client';

import { useCalculatorStore } from '@/lib/store';

export default function StepCosts() {
  const { inputs, setInputs } = useCalculatorStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-lg text-xl text-white mb-1">Your Costs</h2>
        <p className="text-sm text-zinc-500">Work-related expenses that reduce your true earnings.</p>
      </div>

      {/* Monthly commute cost */}
      <div>
        <label htmlFor="calc-commute-cost" className="block text-sm text-zinc-400 mb-2">
          Monthly Commute Cost
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">£</span>
          <input
            type="number"
            id="calc-commute-cost"
            value={inputs.commuteCost}
            onChange={(e) => setInputs({ commuteCost: parseFloat(e.target.value) || 0 })}
            min="0"
            step="10"
            className="input-field w-full pl-9 pr-4 py-3.5"
            placeholder="0"
          />
        </div>
        <p className="text-xs text-zinc-600 mt-1.5">Train pass, fuel, parking, etc.</p>
      </div>

      {/* Work clothing */}
      <div>
        <label htmlFor="calc-clothing" className="block text-sm text-zinc-400 mb-2">
          Annual Work Clothing / Equipment
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">£</span>
          <input
            type="number"
            id="calc-clothing"
            value={inputs.workClothes}
            onChange={(e) => setInputs({ workClothes: parseFloat(e.target.value) || 0 })}
            min="0"
            step="50"
            className="input-field w-full pl-9 pr-4 py-3.5"
            placeholder="0"
          />
        </div>
        <p className="text-xs text-zinc-600 mt-1.5">Uniforms, suits, tools, or equipment you buy for work.</p>
      </div>

      {/* Info card */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-400 leading-relaxed">
          <span className="text-zinc-300 font-medium">Tip:</span> Include any expense you wouldn&apos;t have if you didn&apos;t work — parking, lunches bought at work, professional subscriptions, childcare specifically for work hours.
        </p>
      </div>
    </div>
  );
}
