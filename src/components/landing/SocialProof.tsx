'use client';

import AnimatedEntry from '@/components/ui/AnimatedEntry';

const stats = [
  { value: '13', label: 'UK-specific calculators' },
  { value: '2025/26', label: 'Tax year rates' },
  { value: 'AI', label: 'Powered insights' },
];

export default function SocialProof() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Stats strip */}
        <AnimatedEntry>
          <div className="grid grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white font-[var(--font-heading)]">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </AnimatedEntry>
      </div>
    </section>
  );
}
