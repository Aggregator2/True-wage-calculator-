'use client';

import { useEffect } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
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

export default function Home() {
  const { setUser, setSubscriptionStatus } = useCalculatorStore();

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

    return () => subscription.unsubscribe();
  }, [setUser]);

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
    </main>
  );
}
