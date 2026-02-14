'use client';

import { useAuthInit } from '@/hooks/useAuthInit';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
import MiniCalculator from '@/components/landing/MiniCalculator';
import FeatureGrid from '@/components/landing/FeatureGrid';
import SocialProof from '@/components/landing/SocialProof';
import PricingSection from '@/components/landing/PricingSection';
import Newsletter from '@/components/landing/Newsletter';
import LandingFooter from '@/components/landing/LandingFooter';
import AuthModal from '@/components/AuthModal';
import PremiumModal from '@/components/PremiumModal';
import EmailBanner from '@/components/EmailBanner';

export default function Home() {
  useAuthInit();

  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <MiniCalculator />
      <FeatureGrid />
      <SocialProof />
      <PricingSection />
      <Newsletter />
      <LandingFooter />

      {/* Modals */}
      <AuthModal />
      <PremiumModal />
      <EmailBanner />
    </main>
  );
}
