'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCalculatorStore } from '@/lib/store';
import { useAuthInit } from '@/hooks/useAuthInit';
import { decodeInputsFromUrl } from '@/lib/calculator';
import Navbar from '@/components/landing/Navbar';
import StepWizard from '@/components/calculator/StepWizard';
const ProductExplorer = dynamic(() => import('@/components/ProductExplorer'), { ssr: false });
const OpportunityCostCalculator = dynamic(() => import('@/components/OpportunityCostCalculator'), { ssr: false });
const FireProgress = dynamic(() => import('@/components/FireProgress'), { ssr: false });
const CommuteCalculator = dynamic(() => import('@/components/CommuteCalculator'), { ssr: false });
const GeoArbitrageCalculator = dynamic(() => import('@/components/GeoArbitrageCalculator'), { ssr: false });
const PensionCalculator = dynamic(() => import('@/components/PensionCalculator'), { ssr: false });
const CarersCalculator = dynamic(() => import('@/components/CarersCalculator'), { ssr: false });
const CarCalculator = dynamic(() => import('@/components/CarCalculator'), { ssr: false });
const StudentLoanCalculator = dynamic(() => import('@/components/StudentLoanCalculator'), { ssr: false });
const WFHCalculator = dynamic(() => import('@/components/WFHCalculator'), { ssr: false });
const StressCalculator = dynamic(() => import('@/components/StressCalculator'), { ssr: false });
import ShareSection from '@/components/ShareSection';
import Methodology from '@/components/Methodology';
import LandingFooter from '@/components/landing/LandingFooter';
import AuthModal from '@/components/AuthModal';
import PremiumModal from '@/components/PremiumModal';
import EmailBanner from '@/components/EmailBanner';

export default function CalculatorPage() {
  const { setInputs, results } = useCalculatorStore();

  useAuthInit();

  // Check for shared URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('s');
      if (encoded) {
        const decodedInputs = decodeInputsFromUrl(encoded);
        if (decodedInputs) {
          setInputs(decodedInputs);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [setInputs]);

  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />

      {/* Step-by-step Calculator Wizard */}
      <StepWizard />

      {/* Additional calculators — shown after the user has results */}
      {results && (
        <>
          {/* Share Section */}
          <ShareSection />

          {/* Explore how your spending translates to hours of your life */}
          <div className="border-t border-white/[0.04]">
            <ProductExplorer />
          </div>

          {/* S&P 500 Opportunity Cost */}
          <div className="border-t border-white/[0.04]">
            <OpportunityCostCalculator />
          </div>

          {/* FIRE Progress Tracker */}
          <div className="border-t border-white/[0.04]">
            <FireProgress />
          </div>

          {/* Commute Comparison Calculator */}
          <div className="border-t border-white/[0.04]">
            <CommuteCalculator />
          </div>

          {/* Geographic Arbitrage Calculator */}
          <div className="border-t border-white/[0.04]">
            <GeoArbitrageCalculator />
          </div>

          {/* Work From Home Calculator */}
          <div className="border-t border-white/[0.04]">
            <WFHCalculator />
          </div>

          {/* Pension Matching Calculator */}
          <div className="border-t border-white/[0.04]">
            <PensionCalculator />
          </div>

          {/* Student Loan Calculator */}
          <div className="border-t border-white/[0.04]">
            <StudentLoanCalculator />
          </div>

          {/* Car Ownership Calculator */}
          <div className="border-t border-white/[0.04]">
            <CarCalculator />
          </div>

          {/* Carer's Allowance Calculator */}
          <div className="border-t border-white/[0.04]">
            <CarersCalculator />
          </div>

          {/* Work Intensity / Stress Calculator */}
          <div className="border-t border-white/[0.04]">
            <StressCalculator />
          </div>

          {/* Methodology */}
          <div className="border-t border-white/[0.04]">
            <Methodology />
          </div>
        </>
      )}

      <LandingFooter />
      <AuthModal />
      <PremiumModal />
      <EmailBanner />
    </main>
  );
}
