'use client';

import { Star } from 'lucide-react';
import AnimatedEntry from '@/components/ui/AnimatedEntry';

const testimonials = [
  {
    quote: "I had no idea my real hourly rate was so low. This completely changed how I think about overtime.",
    name: 'Sarah M.',
    role: 'Marketing Manager, London',
  },
  {
    quote: "The FIRE calculator gave me a clear target to aim for. Finally feel like I have a plan.",
    name: 'James K.',
    role: 'Software Engineer, Manchester',
  },
  {
    quote: "Showed my boss the commute cost breakdown. Got approved for 3 days WFH the next week.",
    name: 'Priya R.',
    role: 'Accountant, Birmingham',
  },
];

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
          <div className="grid grid-cols-3 gap-6 mb-16">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white font-[var(--font-heading)]">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </AnimatedEntry>

        {/* Testimonials */}
        <AnimatedEntry>
          <div className="text-center mb-10">
            <p className="text-emerald-400 text-sm font-medium mb-3">Testimonials</p>
            <h2 className="heading-lg text-2xl md:text-3xl text-white">
              What users are saying
            </h2>
          </div>
        </AnimatedEntry>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <AnimatedEntry key={t.name} delay={i * 60}>
              <div className="card p-5 h-full flex flex-col">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, si) => (
                    <Star key={si} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed flex-1 mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                </div>
              </div>
            </AnimatedEntry>
          ))}
        </div>
      </div>
    </section>
  );
}
