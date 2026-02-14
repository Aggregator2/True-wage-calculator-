'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import type { GenerationStage } from '@/components/report/ReportProgressBar';
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
import { useAuthInit } from '@/hooks/useAuthInit';

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

type LoadingPhase = 'init' | 'fetching' | 'stage1' | 'stage2_3' | 'stage4' | 'complete' | 'error';

const STAGE_LABELS: Record<LoadingPhase, string> = {
  init: 'Preparing...',
  fetching: 'Loading your data...',
  stage1: 'Analyzing your finances...',
  stage2_3: 'Finding optimizations & assessing risks...',
  stage4: 'Building your roadmap...',
  complete: 'Report ready!',
  error: 'Something went wrong',
};

const STAGE_PROGRESS: Record<LoadingPhase, number> = {
  init: 5,
  fetching: 10,
  stage1: 35,
  stage2_3: 60,
  stage4: 85,
  complete: 100,
  error: 0,
};

// Wrapper for gated sections (defined outside page component to avoid remounts)
function GatedSection({
  id,
  isPremium,
  sectionLabel,
  children,
}: {
  id: string;
  isPremium: boolean;
  sectionLabel: string;
  children: React.ReactNode;
}) {
  const locked = isSectionLocked(id, isPremium);
  return (
    <div id={id} className="relative scroll-mt-20">
      {locked && (
        <PaywallOverlay sectionTitle={sectionLabel} />
      )}
      <div className={locked ? 'pointer-events-none select-none' : ''}>
        {children}
      </div>
    </div>
  );
}

export default function ReportPage() {
  const { user, setShowAuthModal, setShowPremiumModal, subscriptionStatus } = useCalculatorStore();
  useAuthInit();
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('init');
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Interactive state
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [timelinePhases, setTimelinePhases] = useState<any[]>([]);
  const [projectionScenarios, setProjectionScenarios] = useState<any[]>([]);

  // PDF export
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');

  // Prevent double-generation
  const hasStarted = useRef(false);

  // Progress bar stage
  const generationStage: GenerationStage = {
    label: STAGE_LABELS[loadingPhase],
    progress: STAGE_PROGRESS[loadingPhase],
    isComplete: loadingPhase === 'complete',
  };

  // Generate report on mount
  useEffect(() => {
    if (!user) {
      setShowAuthModal(true, 'sign_in');
      setLoading(false);
      return;
    }
    if (hasStarted.current) return;
    hasStarted.current = true;
    generateReport();
  }, [user]);

  const generateReport = async () => {
    setLoading(true);
    setLoadingPhase('fetching');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setShowAuthModal(true, 'sign_in');
        return;
      }

      // Fetch scenario data
      const multiScenarios = await getAllScenarios(user!.id);

      setLoadingPhase('stage1');

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

      const contentType = response.headers.get('content-type') || '';

      // =====================================================================
      // NDJSON STREAMING PATH (Premium users)
      // =====================================================================
      if (contentType.includes('ndjson')) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let streamedData: ReportData = {
          userData: null as any,
          aiAnalysis: {
            profileSynthesis: null,
            optimizationAnalysis: null,
            riskAssessment: null,
            roadmap: null,
          },
          generatedAt: '',
          userName: '',
          isPremium: true,
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);

              if (chunk.type === 'computed') {
                streamedData.userData = chunk.userData;
                streamedData.generatedAt = chunk.generatedAt;
                streamedData.userName = chunk.userName;
                streamedData.isPremium = chunk.isPremium;
              } else if (chunk.type === 'ai_stage') {
                if (chunk.stage === 'profileSynthesis') {
                  streamedData.aiAnalysis.profileSynthesis = chunk.data;
                  setLoadingPhase('stage2_3');
                } else if (chunk.stage === 'optimizationAnalysis') {
                  streamedData.aiAnalysis.optimizationAnalysis = chunk.data;
                } else if (chunk.stage === 'riskAssessment') {
                  streamedData.aiAnalysis.riskAssessment = chunk.data;
                  setLoadingPhase('stage4');
                } else if (chunk.stage === 'roadmap') {
                  streamedData.aiAnalysis.roadmap = chunk.data;
                }
              } else if (chunk.type === 'complete') {
                // All done
              } else if (chunk.type === 'error') {
                throw new Error(chunk.message || 'Streaming error');
              }
            } catch (e) {
              if (e instanceof Error && e.message.includes('Streaming error')) throw e;
              console.error('Failed to parse NDJSON chunk:', e);
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          try {
            const chunk = JSON.parse(buffer);
            if (chunk.type === 'ai_stage' && chunk.stage === 'roadmap') {
              streamedData.aiAnalysis.roadmap = chunk.data;
            }
          } catch (e) {
            console.error('Failed to parse final NDJSON chunk:', e);
          }
        }

        setReportData(streamedData);
        setRecommendations(extractRecommendations(streamedData.aiAnalysis));
        const timeline = extractTimeline(streamedData.aiAnalysis);
        setTimelinePhases(timeline.phases);
        const projections = extractProjections(streamedData.userData, streamedData.aiAnalysis);
        setProjectionScenarios(projections.scenarios);
      }
      // =====================================================================
      // JSON PATH (Free users - fast)
      // =====================================================================
      else {
        const data: ReportData = await response.json();
        setReportData(data);

        // Initialize interactive state
        setRecommendations(extractRecommendations(data.aiAnalysis));
        const timeline = extractTimeline(data.aiAnalysis);
        setTimelinePhases(timeline.phases);
        const projections = extractProjections(data.userData, data.aiAnalysis);
        setProjectionScenarios(projections.scenarios);
      }

      setLoadingPhase('complete');
    } catch (err) {
      console.error('Report generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setLoadingPhase('error');
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

      // Temporarily pause CSS animations only (not transforms/opacity which affect layout)
      const style = document.createElement('style');
      style.id = 'pdf-export-overrides';
      style.textContent = `
        *, *::before, *::after {
          animation-play-state: paused !important;
          transition: none !important;
        }
      `;
      document.head.appendChild(style);

      // Scroll to top so html2canvas captures from the start
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 200));

      const canvas = await html2canvas(reportContent, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#050505',
        logging: false,
        imageTimeout: 10000,
        scrollX: 0,
        scrollY: 0,
        windowWidth: reportContent.scrollWidth,
        windowHeight: reportContent.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure the cloned element is fully visible and unstyled for capture
          const clonedContent = clonedDoc.getElementById('report-content');
          if (clonedContent) {
            clonedContent.style.overflow = 'visible';
            clonedContent.style.height = 'auto';
          }
          // Remove any fixed/sticky positioned elements in the clone (header, sidebar)
          clonedDoc.querySelectorAll('[class*="fixed"], [class*="sticky"]').forEach(el => {
            (el as HTMLElement).style.position = 'static';
          });
        },
      });

      // Remove override styles
      document.getElementById('pdf-export-overrides')?.remove();

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas rendered with zero dimensions');
      }

      setPdfProgress('Building PDF...');

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
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
      setPdfProgress(`Building page ${page} of ${totalPages}...`);
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        page++;
        setPdfProgress(`Building page ${page} of ${totalPages}...`);
        position = -(pageHeight * (page - 1));
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const date = new Date().toISOString().split('T')[0];
      pdf.save(`TrueWage-FIRE-Report-${date}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      // Remove override styles on error too
      document.getElementById('pdf-export-overrides')?.remove();
      // Fallback: offer browser print dialog
      const usePrint = confirm(
        'PDF export encountered an issue. Would you like to use the browser\'s Print dialog instead?\n\nTip: Select "Save as PDF" as the destination.'
      );
      if (usePrint) {
        window.print();
      }
    } finally {
      setIsExportingPDF(false);
      setPdfProgress('');
    }
  };

  // Loading state — orb + progress bar, no fullscreen page takeover
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] animate-fadeIn">
        {/* Minimal header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#0A1628]/90 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <a href="/dashboard" className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </a>
              <div>
                <h1 className="text-sm font-semibold text-white leading-tight">TrueWage FIRE Report</h1>
                <p className="text-xs text-[#64748B]">Generating your report</p>
              </div>
            </div>
            <span className="text-xs text-[#64748B] tabular-nums font-medium">{Math.round(generationStage.progress)}%</span>
          </div>

          {/* Progress bar — flush at the bottom of the header */}
          <div className="relative h-[2px] bg-white/[0.04] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out"
              style={{
                width: `${generationStage.progress}%`,
                background: 'linear-gradient(90deg, #10B981, #34D399, #10B981)',
                boxShadow: '0 0 12px rgba(16,185,129,0.5), 0 0 4px rgba(16,185,129,0.3)',
              }}
            />
          </div>
        </header>

        {/* Centered orb + stage text */}
        <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
          <ReportLoader size={140} text={STAGE_LABELS[loadingPhase]} inline />
        </div>

        <AuthModal />

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }
        `}</style>
      </div>
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
            <button onClick={() => { hasStarted.current = false; generateReport(); }} className="btn-primary px-6 py-3">
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

  // Extract all section data — use live store status OR the API response
  const { userData, aiAnalysis, isPremium: apiIsPremium, generatedAt, userName } = reportData;
  const isPremium = (subscriptionStatus === 'premium' || subscriptionStatus === 'lifetime') || apiIsPremium;
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
          <GatedSection id="income" isPremium={isPremium} sectionLabel="Income Reality">
            <div className="px-6 py-16">
              <IncomeSection {...incomeProps} />
            </div>
          </GatedSection>

          {/* Savings - premium */}
          <GatedSection id="savings" isPremium={isPremium} sectionLabel="Savings Rate">
            <div className="px-6 py-16">
              <SavingsSection {...savingsProps} />
            </div>
          </GatedSection>

          {/* Spending - premium */}
          <GatedSection id="spending" isPremium={isPremium} sectionLabel="Spending Analysis">
            <div className="px-6 py-16">
              <SpendingSection {...spendingProps} />
            </div>
          </GatedSection>

          {/* Recommendations - premium */}
          <GatedSection id="recommendations" isPremium={isPremium} sectionLabel="Recommendations">
            <div className="px-6 py-16">
              <RecommendationsSection
                recommendations={recommendations}
                onToggleRecommendation={handleToggleRecommendation}
              />
            </div>
          </GatedSection>

          {/* Timeline - premium */}
          <GatedSection id="timeline" isPremium={isPremium} sectionLabel="Action Plan">
            <div className="px-6 py-16">
              <ActionTimeline
                phases={timelinePhases}
                compoundEffect={timeline.compoundEffect}
                onToggleAction={handleToggleAction}
              />
            </div>
          </GatedSection>

          {/* Projections - premium */}
          <GatedSection id="projections" isPremium={isPremium} sectionLabel="FIRE Projection">
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
            <GatedSection
              key={section.id}
              id={section.id}
              isPremium={isPremium}
              sectionLabel={section.title.length > 20 ? section.title.slice(0, 20) + '...' : section.title}
            >
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
