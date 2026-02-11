'use client';

import { Clock, TrendingUp, MapPin, Flame, Brain, Briefcase, GraduationCap, Home } from 'lucide-react';
import Link from 'next/link';
import AnimatedEntry from '@/components/ui/AnimatedEntry';

const features = [
  {
    icon: Clock,
    title: 'True Hourly Wage',
    description: 'Your real rate after tax, commute, breaks, and hidden time costs.',
  },
  {
    icon: Flame,
    title: 'FIRE Progress',
    description: 'Track your path to financial independence with milestone tracking.',
  },
  {
    icon: TrendingUp,
    title: 'Opportunity Cost',
    description: 'What your spending really costs when invested in the S&P 500.',
  },
  {
    icon: MapPin,
    title: 'Geo-Arbitrage',
    description: 'Compare your earning power across 70+ UK and global locations.',
  },
  {
    icon: Brain,
    title: 'Stress & Burnout',
    description: 'Quantify the hidden cost of workplace stress on your true earnings.',
  },
  {
    icon: Home,
    title: 'WFH Savings',
    description: 'Calculate exactly how much working from home saves you.',
  },
  {
    icon: Briefcase,
    title: 'Commute Impact',
    description: 'The full cost of your commute — time, money, and CO2.',
  },
  {
    icon: GraduationCap,
    title: 'Student Loan',
    description: 'Project repayments, write-off dates, and voluntary payment benefits.',
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="py-20 px-6 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto">
        <AnimatedEntry>
          <div className="text-center mb-14">
            <p className="text-emerald-400 text-sm font-medium mb-3">Features</p>
            <h2 className="heading-lg text-3xl md:text-4xl text-white mb-3">
              Beyond a salary calculator
            </h2>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto">
              13 UK-specific calculators built with 2025/26 tax rates. Every hidden cost accounted for.
            </p>
          </div>
        </AnimatedEntry>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <AnimatedEntry key={feature.title} delay={i * 50}>
              <Link href="/calculator" className="group block">
                <div className="card card-interactive p-5 h-full">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 transition-colors group-hover:bg-emerald-500/15">
                    <feature.icon className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{feature.description}</p>
                  <p className="mt-3 text-xs text-emerald-400/70 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore &rarr;
                  </p>
                </div>
              </Link>
            </AnimatedEntry>
          ))}
        </div>
      </div>
    </section>
  );
}
