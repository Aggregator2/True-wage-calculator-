'use client';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export default function StepProgress({ currentStep, totalSteps, labels }: StepProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="progress-bar mb-4">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Step labels - desktop */}
      <div className="hidden sm:flex items-center justify-between">
        {labels.map((label, i) => (
          <button
            key={label}
            className={`text-xs font-medium transition-colors ${
              i === currentStep
                ? 'text-emerald-400'
                : i < currentStep
                ? 'text-zinc-400'
                : 'text-zinc-600'
            }`}
            aria-label={`Step ${i + 1}: ${label}`}
            tabIndex={-1}
          >
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] mr-1.5 ${
              i === currentStep
                ? 'bg-emerald-500/20 text-emerald-400'
                : i < currentStep
                ? 'bg-zinc-700 text-zinc-400'
                : 'bg-zinc-800 text-zinc-600'
            }`}>
              {i < currentStep ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Step label - mobile */}
      <div className="sm:hidden">
        <p className="text-sm text-zinc-400">
          <span className="text-emerald-400 font-medium">Step {currentStep + 1}</span> of {totalSteps} &mdash; {labels[currentStep]}
        </p>
      </div>
    </div>
  );
}
