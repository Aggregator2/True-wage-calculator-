'use client';

import { useEffect, useState } from 'react';

export function ReportGenerationLoading() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Analyzing your data...');

  useEffect(() => {
    const stages = [
      { text: 'Analyzing your financial data...', duration: 1000 },
      { text: 'Calculating true hourly wage...', duration: 800 },
      { text: 'Computing FIRE timeline...', duration: 1200 },
      { text: 'Generating visual charts...', duration: 1000 },
      { text: 'Creating your report...', duration: 1500 },
    ];

    let currentStage = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setStage(stages[currentStage].text);
        currentProgress += 20;
        setProgress(Math.min(currentProgress, 95)); // Never hit 100% until done

        currentStage++;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute top-0 left-0 w-20 h-20 flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Generating Your Report
        </h2>

        {/* Stage */}
        <p className="text-center text-gray-600 mb-6">{stage}</p>

        {/* Progress bar */}
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
          </div>
        </div>

        {/* Progress percentage */}
        <div className="text-center text-sm text-gray-500 mb-4">{progress}%</div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 text-center">
            ✨ Creating a personalized report with your real numbers
          </p>
        </div>

        {/* Tips */}
        <div className="mt-6 space-y-2">
          <p className="text-xs text-gray-500 text-center">
            💡 Tip: Your report includes charts based on YOUR actual financial data
          </p>
          <p className="text-xs text-gray-500 text-center">
            📈 We're calculating your exact path to financial independence
          </p>
        </div>
      </div>
    </div>
  );
}
