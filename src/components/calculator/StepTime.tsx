'use client';

import { useCalculatorStore } from '@/lib/store';

export default function StepTime() {
  const { inputs, setInputs } = useCalculatorStore();

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-lg text-xl text-white mb-1">Your Time</h2>
        <p className="text-sm text-zinc-500">Hours committed to work, including the hidden ones.</p>
      </div>

      {/* Contract Hours & Work Days */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="calc-hours" className="block text-sm text-zinc-400 mb-2">Weekly Contract Hours</label>
          <input
            type="number"
            id="calc-hours"
            value={inputs.contractHours}
            onChange={(e) => setInputs({ contractHours: parseFloat(e.target.value) || 0 })}
            min="1"
            max="80"
            step="0.5"
            className="input-field w-full px-4 py-3.5"
          />
        </div>
        <div>
          <label htmlFor="calc-days" className="block text-sm text-zinc-400 mb-2">Days Per Week</label>
          <input
            type="number"
            id="calc-days"
            value={inputs.workDays}
            onChange={(e) => setInputs({ workDays: parseInt(e.target.value, 10) || 0 })}
            min="1"
            max="7"
            className="input-field w-full px-4 py-3.5"
          />
        </div>
      </div>

      {/* Commute */}
      <div>
        <label htmlFor="calc-commute" className="block text-sm text-zinc-400 mb-2">
          Daily Commute <span className="text-zinc-600">(round trip, minutes)</span>
        </label>
        <div className="relative">
          <input
            type="number"
            id="calc-commute"
            value={inputs.commuteMinutes}
            onChange={(e) => setInputs({ commuteMinutes: parseInt(e.target.value, 10) || 0 })}
            min="0"
            max="300"
            step="5"
            className="input-field w-full pl-4 pr-20 py-3.5"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">
            {formatMinutes(inputs.commuteMinutes)}
          </span>
        </div>
        <p className="text-xs text-zinc-600 mt-1.5">UK average: 56 minutes round trip</p>
      </div>

      {/* Break & Prep */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="calc-break" className="block text-sm text-zinc-400 mb-2">
            Unpaid Lunch Break
          </label>
          <div className="relative">
            <input
              type="number"
              id="calc-break"
              value={inputs.unpaidBreak}
              onChange={(e) => setInputs({ unpaidBreak: parseInt(e.target.value, 10) || 0 })}
              min="0"
              max="120"
              step="5"
              className="input-field w-full pl-4 pr-16 py-3.5"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
              {formatMinutes(inputs.unpaidBreak)}
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="calc-prep" className="block text-sm text-zinc-400 mb-2">
            Daily Prep Time
          </label>
          <div className="relative">
            <input
              type="number"
              id="calc-prep"
              value={inputs.prepTime}
              onChange={(e) => setInputs({ prepTime: parseInt(e.target.value, 10) || 0 })}
              min="0"
              max="120"
              step="5"
              className="input-field w-full pl-4 pr-16 py-3.5"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
              {formatMinutes(inputs.prepTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Holiday */}
      <div>
        <label htmlFor="calc-holiday" className="block text-sm text-zinc-400 mb-2">
          Annual Leave <span className="text-zinc-600">(inc. bank holidays)</span>
        </label>
        <div className="relative">
          <input
            type="number"
            id="calc-holiday"
            value={inputs.holidayDays}
            onChange={(e) => setInputs({ holidayDays: parseInt(e.target.value, 10) || 0 })}
            min="0"
            max="60"
            className="input-field w-full pl-4 pr-14 py-3.5"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">days</span>
        </div>
      </div>
    </div>
  );
}
