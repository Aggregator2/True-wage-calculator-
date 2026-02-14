'use client';

import { useEffect, useState } from 'react';

export interface GenerationStage {
  label: string;
  progress: number; // 0-100
  isComplete: boolean;
}

interface ReportProgressBarProps {
  stage: GenerationStage;
  isPremium: boolean;
}

export default function ReportProgressBar({ stage, isPremium }: ReportProgressBarProps) {
  const [visible, setVisible] = useState(true);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress smoothly
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(stage.progress);
    }, 50);
    return () => clearTimeout(timer);
  }, [stage.progress]);

  // Fade out when complete
  useEffect(() => {
    if (stage.isComplete) {
      const timer = setTimeout(() => setVisible(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [stage.isComplete]);

  if (!visible) return null;

  return (
    <div
      className={`w-full transition-all duration-500 ${
        stage.isComplete ? 'opacity-0 translate-y-[-4px]' : 'opacity-100'
      }`}
    >
      {/* Progress bar track */}
      <div className="relative h-1 bg-white/[0.06] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#10B981] transition-all duration-700 ease-out"
          style={{ width: `${animatedProgress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Stage label */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#0A1628]/60">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-xs text-[#94A3B8]">{stage.label}</span>
        </div>
        <span className="text-xs text-[#64748B] tabular-nums">
          {Math.round(animatedProgress)}%
        </span>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
