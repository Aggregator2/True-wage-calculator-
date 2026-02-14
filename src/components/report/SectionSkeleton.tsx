'use client';

type SkeletonVariant = 'hero' | 'scores' | 'standard' | 'chart';

interface SectionSkeletonProps {
  variant?: SkeletonVariant;
}

function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-white/[0.04] animate-pulse ${className}`} />
  );
}

function HeroSkeleton() {
  return (
    <div className="px-6 py-16 space-y-6">
      {/* Title area */}
      <div className="text-center space-y-4">
        <SkeletonPulse className="h-4 w-48 mx-auto" />
        <SkeletonPulse className="h-10 w-80 mx-auto" />
        <SkeletonPulse className="h-5 w-64 mx-auto" />
      </div>
      {/* Stats row */}
      <div className="flex justify-center gap-8 mt-8">
        <div className="text-center space-y-2">
          <SkeletonPulse className="h-12 w-24 mx-auto" />
          <SkeletonPulse className="h-3 w-20 mx-auto" />
        </div>
        <div className="text-center space-y-2">
          <SkeletonPulse className="h-12 w-24 mx-auto" />
          <SkeletonPulse className="h-3 w-20 mx-auto" />
        </div>
        <div className="text-center space-y-2">
          <SkeletonPulse className="h-12 w-24 mx-auto" />
          <SkeletonPulse className="h-3 w-20 mx-auto" />
        </div>
      </div>
      {/* Hook paragraph */}
      <div className="max-w-2xl mx-auto space-y-2 mt-6">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-5/6" />
        <SkeletonPulse className="h-4 w-4/6" />
      </div>
    </div>
  );
}

function ScoresSkeleton() {
  return (
    <div className="px-6 py-16">
      <SkeletonPulse className="h-6 w-48 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
            <SkeletonPulse className="h-4 w-32" />
            <SkeletonPulse className="h-24 w-24 rounded-full mx-auto" />
            <SkeletonPulse className="h-3 w-24 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StandardSkeleton() {
  return (
    <div className="px-6 py-16 space-y-6">
      <SkeletonPulse className="h-7 w-56" />
      <div className="space-y-3">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-5/6" />
        <SkeletonPulse className="h-4 w-4/6" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
            <SkeletonPulse className="h-3 w-16" />
            <SkeletonPulse className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="px-6 py-16 space-y-6">
      <SkeletonPulse className="h-7 w-56" />
      <div className="space-y-3">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-4/6" />
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <SkeletonPulse className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function SectionSkeleton({ variant = 'standard' }: SectionSkeletonProps) {
  switch (variant) {
    case 'hero':
      return <HeroSkeleton />;
    case 'scores':
      return <ScoresSkeleton />;
    case 'chart':
      return <ChartSkeleton />;
    case 'standard':
    default:
      return <StandardSkeleton />;
  }
}
