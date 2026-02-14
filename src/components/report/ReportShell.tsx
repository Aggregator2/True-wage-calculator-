'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  Menu, X, FileText, Download, Printer,
  BarChart3, DollarSign, PiggyBank, ShoppingCart,
  Lightbulb, Map, TrendingUp, Shield, BookOpen,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import ReportProgressBar, { type GenerationStage } from './ReportProgressBar';

interface ReportSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ReportShellProps {
  children: ReactNode;
  userName: string;
  generatedAt: string;
  sections: ReportSection[];
  onExportPDF: () => void;
  isExportingPDF: boolean;
  pdfProgress?: string;
  generationStage?: GenerationStage;
  isPremium?: boolean;
  isLoading?: boolean;
}

export default function ReportShell({
  children,
  userName,
  generatedAt,
  sections,
  onExportPDF,
  isExportingPDF,
  pdfProgress,
  generationStage,
  isPremium = false,
  isLoading = false,
}: ReportShellProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track scroll position for active section + progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);

      // Find active section
      let current = sections[0]?.id || '';
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            current = section.id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  const formattedDate = new Date(generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0A1628]/90 backdrop-blur-xl border-b border-white/[0.06]">
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-[2px] bg-[#10B981] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="flex items-center justify-between px-4 h-14">
          {/* Left: back + title */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <button
              className="lg:hidden p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-white leading-tight">TrueWage FIRE Report</h1>
              <p className="text-xs text-[#64748B]">{userName} &middot; {formattedDate}</p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExportPDF}
              disabled={isExportingPDF || isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] text-[#0A1628] text-sm font-semibold hover:shadow-lg hover:shadow-[#10B981]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0A1628] border-t-transparent rounded-full animate-spin" />
                  {pdfProgress || 'Exporting...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export PDF
                </>
              )}
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Generation progress bar - shown during loading */}
      {generationStage && !generationStage.isComplete && (
        <div className="fixed top-14 left-0 right-0 z-39">
          <ReportProgressBar stage={generationStage} isPremium={isPremium} />
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className={`
        fixed top-14 left-0 bottom-0 z-30
        bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/[0.06]
        transition-all duration-300
        hidden lg:flex flex-col
        ${sidebarCollapsed ? 'w-16' : 'w-56'}
      `}>
        {/* Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-3 mx-2 mt-2 rounded-lg text-[#64748B] hover:text-white hover:bg-white/[0.06] transition-colors self-end"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                ${activeSection === section.id
                  ? 'bg-[#10B981]/15 text-[#10B981] font-medium'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'
                }
              `}
              title={sidebarCollapsed ? section.label : undefined}
            >
              <span className="flex-shrink-0">{section.icon}</span>
              {!sidebarCollapsed && <span className="truncate">{section.label}</span>}
            </button>
          ))}
        </nav>

        {/* Progress */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
              <span>Progress</span>
              <span>{Math.round(scrollProgress)}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10B981] rounded-full transition-all duration-150"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          </div>
        )}
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-14 left-0 bottom-0 w-72 bg-[#0A1628] border-r border-white/[0.06] overflow-y-auto">
            <nav className="py-4 px-3 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all
                    ${activeSection === section.id
                      ? 'bg-[#10B981]/15 text-[#10B981] font-medium'
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        ref={contentRef}
        className={`
          pt-14 transition-all duration-300
          ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'}
        `}
      >
        <div className="max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
