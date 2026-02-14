'use client';

import { useAuthInit } from '@/hooks/useAuthInit';
import Navbar from '@/components/landing/Navbar';
import LandingFooter from '@/components/landing/LandingFooter';
import TrueWageDocs from '@/components/docs/TrueWageDocs';
import AuthModal from '@/components/AuthModal';
import PremiumModal from '@/components/PremiumModal';
import EmailBanner from '@/components/EmailBanner';

export default function DocsPage() {
  useAuthInit();

  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <TrueWageDocs />
      <LandingFooter />

      {/* Modals */}
      <AuthModal />
      <PremiumModal />
      <EmailBanner />
    </main>
  );
}
