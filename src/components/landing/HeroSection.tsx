'use client';

import { BackgroundPaths } from '@/components/ui/background-paths';

export default function HeroSection() {
  return (
    <BackgroundPaths
      title="Your True Wage"
      badgeText="2025/26 UK Tax Rates"
      subtitle="The UK's most comprehensive hourly wage calculator. Factor in tax, commute, stress, and hidden costs to discover what you really earn."
      primaryCta="Calculate Your True Wage"
      primaryCtaHref="/calculator"
      secondaryCta="See a Sample Report"
      secondaryCtaHref="/report"
      socialProof="Join 2,400+ UK workers who discovered their true hourly rate"
    />
  );
}
