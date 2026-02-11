'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { getAllScenarios } from '@/lib/scenarios';
import {
  BarChart3, DollarSign, PiggyBank, ShoppingCart,
  Lightbulb, Map, TrendingUp, Shield, Zap, Star,
  BookOpen, Info,
} from 'lucide-react';

import ReportLoader from '@/components/report/ReportLoader';
import ReportShell from '@/components/report/ReportShell';
import HeroSection from '@/components/report/HeroSection';
import ScoreDashboard from '@/components/report/ScoreDashboard';
import IncomeSection from '@/components/report/IncomeSection';
import SavingsSection from '@/components/report/SavingsSection';
import SpendingSection from '@/components/report/SpendingSection';
import RecommendationsSection from '@/components/report/RecommendationsSection';
import ActionTimeline from '@/components/report/ActionTimeline';
import ProjectionSection from '@/components/report/ProjectionSection';
import AIContentSection from '@/components/report/AIContentSection';
import PaywallOverlay from '@/components/report/PaywallOverlay';
import AuthModal from '@/components/AuthModal';
import PremiumModal from '@/components/PremiumModal';

import {
  calculateFinancialHealthScore,
  calculateSavingsEfficiencyScore,
  calculateFireReadinessScore,
  extractHeroData,
  extractIncomeProps,
  extractSavingsProps,
  extractSpendingProps,
  extractRecommendations,
  extractTimeline,
  extractProjections,
  extractAISections,
  isSectionLocked,
} from '@/lib/report-data-transformer';

import type { ComprehensiveUserData, AIAnalysisResult } from '@/lib/openrouter';

interface ReportData {
  userData: ComprehensiveUserData;
  aiAnalysis: AIAnalysisResult;
  generatedAt: string;
  userName: string;
  isPremium: boolean;
}

export default function ReportPage() {
  const { user, setShowAuthModal, setShowPremiumModal } = useCalculatorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Interactive state
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [timelinePhases, setTimelinePhases] = useState<any[]>([]);
  const [projectionScenarios, setProjectionScenarios] = useState<any[]>([]);

  // PDF export
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');

  // Generate report on mount
  useEffect(() => {
    if (!user) {
      setShowAuthModal(true, 'sign_in');
      setLoading(false);
      return;
    }
    generateReport();
  }, [user]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setShowAuthModal(true, 'sign_in');
        return;
      }

      // Fetch scenario data
      const multiScenarios = await getAllScenarios(user!.id);

      const response = await fetch('/api/generate-report/interactive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          scenarioData: multiScenarios.primary ? {
            primary: multiScenarios.primary,
            comparisons: multiScenarios.comparisons,
          } : null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        if (err.upgradeRequired) {
          setShowPremiumModal(true);
          throw new Error(err.error);
        }
        throw new Error(err.error || 'Failed to generate report');
      }

      const data: ReportData = await response.json();
      setReportData(data);

      // Initialize interactive state
      setRecommendations(extractRecommendations(data.aiAnalysis));
      const timeline = extractTimeline(data.aiAnalysis);
      setTimelinePhases(timeline.phases);
      const projections = extractProjections(data.userData, data.aiAnalysis);
      setProjectionScenarios(projections.scenarios);
    } catch (err) {
      console.error('Report generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Interactive handlers
  const handleToggleRecommendation = useCallback((id: string) => {
    setRecommendations(prev => prev.map(r =>
      r.id === id ? { ...r, isApplied: !r.isApplied } : r
    ));
  }, []);

  const handleToggleAction = useCallback((phaseId: string, actionId: string) => {
    setTimelinePhases(prev => prev.map(phase =>
      phase.id === phaseId
        ? {
            ...phase,
            actions: phase.actions.map((a: any) =>
              a.id === actionId ? { ...a, isCompleted: !a.isCompleted } : a
            ),
          }
        : phase
    ));
  }, []);

  const handleToggleScenario = useCallback((index: number) => {
    setProjectionScenarios(prev => prev.map((s, i) =>
      i === index ? { ...s, isVisible: !s.isVisible } : s
    ));
  }, []);

  // PDF Export
  const handleExportPDF = async () => {
    if (!reportData) return;
    setIsExportingPDF(true);
    setPdfProgress('Preparing export...');

    try {
      // Dynamic import for code splitting
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const reportContent = document.getElementById('report-content');
      if (!reportContent) throw new Error('Report content not found');

      setPdfProgress('Rendering pages...');

      // Temporarily make content full width for PDF
      const mainEl = document.querySelector('main');
      const originalPadding = mainEl?.style.paddingLeft;
      if (mainEl) mainEl.style.paddingLeft = '0';

      const canvas = await html2canvas(reportContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#050505',
        width: 1200,
        windowWidth: 1200,
      });

      if (mainEl) mainEl.style.paddingLeft = originalPadding || '';

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      let page = 1;
      const totalPages = Math.ceil(imgHeight / pageHeight);

      // First page
      setPdfProgress(`Rendering page ${page} of ${totalPages}...`);
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        page++;
        setPdfProgress(`Rendering page ${page} of ${totalPages}...`);
        position = -(pageHeight * (page - 1));
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const date = new Date().toISOString().split('T')[0];
      pdf.save(`TrueWage-FIRE-Report-${date}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
      setPdfProgress('');
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <ReportLoader />
        <AuthModal />
      </>
    );
  }

  // Error state
  if (error || !reportData) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {error?.includes('Upgrade') ? 'Upgrade Required' : 'Report Generation Failed'}
          </h2>
          <p className="text-neutral-400 mb-6">{error || 'Something went wrong. Please try again.'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={generateReport} className="btn-primary px-6 py-3">
              Try Again
            </button>
            <a href="/dashboard" className="btn-secondary px-6 py-3">
              Back to Dashboard
            </a>
          </div>
        </div>
        <AuthModal />
        <PremiumModal />
      </main>
    );
  }

  // Extract all section data
  const { userData, aiAnalysis, isPremium, generatedAt, userName } = reportData;
  const heroData = extractHeroData(userData, aiAnalysis);
  const incomeProps = extractIncomeProps(userData, aiAnalysis);
  const savingsProps = extractSavingsProps(userData, aiAnalysis);
  const spendingProps = extractSpendingProps(userData, aiAnalysis);
  const timeline = extractTimeline(aiAnalysis);
  const projections = extractProjections(userData, aiAnalysis);
  const aiSections = extractAISections(userData, aiAnalysis, isPremium);

  const financialHealth = calculateFinancialHealthScore(userData);
  const savingsEfficiency = calculateSavingsEfficiencyScore(userData);
  const fireReadiness = calculateFireReadinessScore(userData);

  // Build section nav
  const sections = [
    { id: 'hero', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'scores', label: 'Financial Scores', icon: <Star className="w-4 h-4" /> },
    { id: 'income', label: 'Income Reality', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'savings', label: 'Savings Rate', icon: <PiggyBank className="w-4 h-4" /> },
    { id: 'spending', label: 'Spending Analysis', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'recommendations', label: 'Recommendations', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'timeline', label: 'Action Plan', icon: <Map className="w-4 h-4" /> },
    { id: 'projections', label: 'FIRE Projection', icon: <TrendingUp className="w-4 h-4" /> },
    ...aiSections.map(s => ({
      id: s.id,
      label: s.title.length > 20 ? s.title.slice(0, 20) + '...' : s.title,
      icon: s.icon === 'shield' ? <Shield className="w-4 h-4" /> :
            s.icon === 'zap' ? <Zap className="w-4 h-4" /> :
            s.icon === 'star' ? <Star className="w-4 h-4" /> :
            s.icon === 'book' ? <BookOpen className="w-4 h-4" /> :
            s.icon === 'trending' ? <TrendingUp className="w-4 h-4" /> :
            <Info className="w-4 h-4" />,
    })),
  ];

  // Wrapper for gated sections
  const GatedSection = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const locked = isSectionLocked(id, isPremium);
    return (
      <div id={id} className="relative scroll-mt-20">
        {locked && (
          <PaywallOverlay sectionTitle={sections.find(s => s.id === id)?.label || 'This Section'} />
        )}
        <div className={locked ? 'pointer-events-none select-none' : ''}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <>
      <ReportShell
        userName={userName}
        generatedAt={generatedAt}
        sections={sections}
        onExportPDF={handleExportPDF}
        isExportingPDF={isExportingPDF}
        pdfProgress={pdfProgress}
      >
        <div id="report-content" className="space-y-0">
          {/* Hero - always visible */}
          <div id="hero" className="scroll-mt-20">
            <HeroSection {...heroData} />
          </div>

          {/* Scores - always visible */}
          <div id="scores" className="scroll-mt-20 px-6 py-16">
            <ScoreDashboard
              financialHealth={financialHealth}
              savingsEfficiency={savingsEfficiency}
              fireReadiness={fireReadiness}
            />
          </div>

          {/* Income - partially visible for free */}
          <GatedSection id="income">
            <div className="px-6 py-16">
              <IncomeSection {...incomeProps} />
            </div>
          </GatedSection>

          {/* Savings - premium */}
          <GatedSection id="savings">
            <div className="px-6 py-16">
              <SavingsSection {...savingsProps} />
            </div>
          </GatedSection>

          {/* Spending - premium */}
          <GatedSection id="spending">
            <div className="px-6 py-16">
              <SpendingSection {...spendingProps} />
            </div>
          </GatedSection>

          {/* Recommendations - premium */}
          <GatedSection id="recommendations">
            <div className="px-6 py-16">
              <RecommendationsSection
                recommendations={recommendations}
                onToggleRecommendation={handleToggleRecommendation}
              />
            </div>
          </GatedSection>

          {/* Timeline - premium */}
          <GatedSection id="timeline">
            <div className="px-6 py-16">
              <ActionTimeline
                phases={timelinePhases}
                compoundEffect={timeline.compoundEffect}
                onToggleAction={handleToggleAction}
              />
            </div>
          </GatedSection>

          {/* Projections - premium */}
          <GatedSection id="projections">
            <div className="px-6 py-16">
              <ProjectionSection
                scenarios={projectionScenarios}
                currentPathFIAge={projections.currentPathFIAge}
                withChangesFIAge={projections.withChangesFIAge}
                delta={projections.delta}
                assumptions={projections.assumptions}
                onToggleScenario={handleToggleScenario}
              />
            </div>
          </GatedSection>

          {/* Dynamic AI sections */}
          {aiSections.map(section => (
            <GatedSection key={section.id} id={section.id}>
              <div className="px-6 py-16">
                <AIContentSection
                  id={section.id}
                  title={section.title}
                  icon={section.icon}
                  type={section.type}
                  paragraphs={section.paragraphs}
                  metrics={section.metrics}
                  sourceCitation={section.sourceCitation}
                  isLocked={isSectionLocked(section.id, isPremium)}
                />
              </div>
            </GatedSection>
          ))}

          {/* Footer */}
          <div className="px-6 py-12 text-center border-t border-white/[0.06]">
            <p className="text-xs text-[#64748B]">
              TrueWage UK &middot; Not regulated by the FCA &middot; Educational purposes only
            </p>
            <p className="text-xs text-[#475569] mt-1">
              Questions? Visit <a href="https://truewage.uk" className="text-[#10B981] hover:underline">truewage.uk</a>
            </p>
          </div>
        </div>
      </ReportShell>

      <AuthModal />
      <PremiumModal />
    </>
  );
}
