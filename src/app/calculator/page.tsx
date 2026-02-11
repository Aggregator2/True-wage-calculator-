'use client';

import { useEffect } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { decodeInputsFromUrl } from '@/lib/calculator';
import Navbar from '@/components/landing/Navbar';
import StepWizard from '@/components/calculator/StepWizard';
import ProductExplorer from '@/components/ProductExplorer';
import OpportunityCostCalculator from '@/components/OpportunityCostCalculator';
import FireProgress from '@/components/FireProgress';
import CommuteCalculator from '@/components/CommuteCalculator';
import GeoArbitrageCalculator from '@/components/GeoArbitrageCalculator';
import PensionCalculator from '@/components/PensionCalculator';
import CarersCalculator from '@/components/CarersCalculator';
import CarCalculator from '@/components/CarCalculator';
import StudentLoanCalculator from '@/components/StudentLoanCalculator';
import WFHCalculator from '@/components/WFHCalculator';
import StressCalculator from '@/components/StressCalculator';
import ShareSection from '@/components/ShareSection';
import Methodology from '@/components/Methodology';
import LandingFooter from '@/components/landing/LandingFooter';
import AuthModal from '@/components/AuthModal';
import PremiumModal from '@/components/PremiumModal';

export default function CalculatorPage() {
  const { setUser, setInputs, setSubscriptionStatus, results } = useCalculatorStore();

  const fetchSubscriptionStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_status')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setSubscriptionStatus(data.subscription_status || 'free');
      } else {
        setSubscriptionStatus('free');
      }
    } catch {
      setSubscriptionStatus('free');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchSubscriptionStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchSubscriptionStatus(session.user.id);
      } else {
        setSubscriptionStatus(null);
      }
    });

    // Check for shared URL parameters
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

    return () => subscription.unsubscribe();
  }, [setUser, setInputs]);

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
    </main>
  );
}
