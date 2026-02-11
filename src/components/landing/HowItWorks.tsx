'use client';

import { ClipboardList, BarChart3, FileText } from 'lucide-react';
import AnimatedEntry from '@/components/ui/AnimatedEntry';

const steps = [
  {
    icon: ClipboardList,
    title: 'Enter your details',
    description: 'Salary, hours, commute, and work costs — guided step by step.',
  },
  {
    icon: BarChart3,
    title: 'See your true wage',
    description: 'Your real hourly rate after all hidden costs and time commitments.',
  },
  {
    icon: FileText,
    title: 'Get your AI report',
    description: 'Personalised insights with your path to financial independence.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto">
        <AnimatedEntry>
          <div className="text-center mb-14">
            <p className="text-emerald-400 text-sm font-medium mb-3">How It Works</p>
            <h2 className="heading-lg text-3xl md:text-4xl text-white">
              Three steps to clarity
            </h2>
          </div>
        </AnimatedEntry>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

          {steps.map((step, i) => (
            <AnimatedEntry key={step.title} delay={i * 80}>
              <div className="relative text-center">
                {/* Step number circle */}
                <div className="mx-auto mb-5 w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative z-10">
                  <step.icon className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                </div>
                <div className="mx-auto mb-4 w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-400">
                  {i + 1}
                </div>
                <h3 className="heading-lg text-lg text-white mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-[260px] mx-auto">{step.description}</p>
              </div>
            </AnimatedEntry>
          ))}
        </div>
      </div>
    </section>
  );
}
