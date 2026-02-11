'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCalculatorStore, useIsPremium } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { getSavedScenarios, deleteScenario, getAllScenarios, deleteMultiScenario, calculatorTypeLabels, type MultiScenario } from '@/lib/scenarios';
import { getProgressHistory } from '@/lib/progress';
import { formatCurrency } from '@/lib/calculator';
import type { SavedScenario, ProgressSnapshot } from '@/lib/supabase';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import AuthModal from '@/components/AuthModal';
import PremiumModal from '@/components/PremiumModal';
import FireProgress from '@/components/FireProgress';
import CommuteCalculator from '@/components/CommuteCalculator';
import GeoArbitrageCalculator from '@/components/GeoArbitrageCalculator';
import WFHCalculator from '@/components/WFHCalculator';
import PensionCalculator from '@/components/PensionCalculator';
import StudentLoanCalculator from '@/components/StudentLoanCalculator';
import CarCalculator from '@/components/CarCalculator';
import CarersCalculator from '@/components/CarersCalculator';
import StressCalculator from '@/components/StressCalculator';
import ProductExplorer from '@/components/ProductExplorer';
import OpportunityCostCalculator from '@/components/OpportunityCostCalculator';
import {
  Plus, FileText, Download, Trash2, BarChart3, TrendingUp, Bookmark, Calendar,
  Car, GraduationCap, HeartHandshake, Briefcase, Globe, Home, Gauge, ShoppingCart,
  PiggyBank, LineChart, Brain, ArrowRight, Lock, User, CreditCard, Bell
} from 'lucide-react';

export default function Dashboard() {
  const { user, setUser, setShowAuthModal, setShowPremiumModal, setSubscriptionStatus, subscriptionStatus } = useCalculatorStore();
  const isPremium = useIsPremium();
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [primaryScenario, setPrimaryScenario] = useState<MultiScenario | null>(null);
  const [comparisonScenarios, setComparisonScenarios] = useState<MultiScenario[]>([]);
  const [progressHistory, setProgressHistory] = useState<ProgressSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('overview');

  // Auth init
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchSubscriptionStatus(session.user.id);
      } else {
        setShowAuthModal(true, 'sign_in');
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
  }, []);

  const fetchSubscriptionStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_status')
        .eq('id', userId)
        .single();
      if (!error && data) setSubscriptionStatus(data.subscription_status || 'free');
      else setSubscriptionStatus('free');
    } catch { setSubscriptionStatus('free'); }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [scenariosData, progressData, multiScenarios] = await Promise.all([
        getSavedScenarios(),
        getProgressHistory(12),
        getAllScenarios(user.id)
      ]);
      setScenarios(scenariosData);
      setProgressHistory(progressData);
      setPrimaryScenario(multiScenarios.primary);
      setComparisonScenarios(multiScenarios.comparisons);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;
    setDeletingId(id);
    try {
      await deleteScenario(id);
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete scenario:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteMultiScenario = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this scenario?')) return;
    setDeletingId(id);
    try {
      await deleteMultiScenario(id, user.id);
      setComparisonScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete scenario:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateReport = async (format: 'pdf' | 'json' = 'pdf') => {
    if (!user) return;
    if (!primaryScenario && scenarios.length === 0) {
      alert('Please complete the main calculator first to generate a report.');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setShowAuthModal(true, 'sign_in'); return; }
      setGeneratingReport(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          format,
          scenarioData: primaryScenario ? { primary: primaryScenario, comparisons: comparisonScenarios } : null,
          legacyScenarios: scenarios,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'pdf'
        ? `truewage-fire-report-${new Date().toISOString().split('T')[0]}.pdf`
        : `truewage-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Report generation error:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        alert('Report generation timed out. Please try again.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to generate report.');
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="card p-8 text-center max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <h1 className="heading-lg text-2xl text-white mb-2">Sign In Required</h1>
          <p className="text-zinc-400 text-sm mb-6">Sign in to access your dashboard and saved scenarios.</p>
          <button onClick={() => setShowAuthModal(true, 'sign_in')} className="btn-primary px-6 py-3 w-full text-sm font-semibold">
            Sign In
          </button>
        </div>
        <AuthModal />
      </main>
    );
  }

  const totalScenarios = scenarios.length + comparisonScenarios.length;

  // Tool cards for the Tools view
  const toolCards = [
    {
      id: 'product-explorer',
      icon: ShoppingCart,
      title: 'Product Explorer',
      description: 'See how your spending translates to hours of your life. Enter any purchase to find out its true cost in work hours.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      id: 'opportunity-cost',
      icon: LineChart,
      title: 'S&P 500 Opportunity Cost',
      description: 'Calculate the long-term opportunity cost of purchases if that money were invested in the stock market instead.',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      id: 'fire-tracker',
      icon: TrendingUp,
      title: 'FIRE Progress Tracker',
      description: 'Track your Financial Independence / Retire Early progress. Set your FIRE number and see how close you are.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'commute',
      icon: Car,
      title: 'Commute Calculator',
      description: 'Compare the true cost of different commute methods — driving, public transport, cycling, or working from home.',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      id: 'geo-arbitrage',
      icon: Globe,
      title: 'Geographic Arbitrage',
      description: 'Compare your purchasing power across different UK cities and regions. See how location affects your true wage.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      id: 'wfh',
      icon: Home,
      title: 'WFH Savings',
      description: 'Calculate how much you save (or spend more) working from home vs. the office, including hidden costs and benefits.',
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      id: 'pension',
      icon: PiggyBank,
      title: 'Pension Matching',
      description: 'Understand the true value of your employer pension match. See how much free money you\'re leaving on the table.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      id: 'student-loan',
      icon: GraduationCap,
      title: 'Student Loan Impact',
      description: 'See how your student loan repayments affect your true hourly wage across Plan 1, Plan 2, Plan 4, and postgrad loans.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      id: 'car',
      icon: Car,
      title: 'Car Ownership',
      description: 'Calculate the true cost of car ownership in work hours — insurance, fuel, maintenance, depreciation, and more.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
    {
      id: 'carers',
      icon: HeartHandshake,
      title: "Carer's Allowance",
      description: "Check your eligibility for Carer's Allowance and calculate how it affects your true hourly wage and overall income.",
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
    },
    {
      id: 'stress',
      icon: Brain,
      title: 'Stress & Burnout',
      description: 'Quantify the hidden cost of work stress. Factor in health impacts, recovery time, and quality-of-life effects.',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  ];

  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  // View-specific content rendering
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <p className="stat-label">True Hourly Rate</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-[var(--font-heading)]">
            {primaryScenario ? formatCurrency(primaryScenario.data.results?.trueHourlyRate || 0) : '—'}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {primaryScenario
              ? `${(primaryScenario.data.results?.percentOfAssumed || 0).toFixed(0)}% of apparent rate`
              : 'Calculate to see'}
          </p>
        </div>
        <div className="card p-5 border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="w-4 h-4 text-zinc-400" />
            <p className="stat-label">Saved Scenarios</p>
          </div>
          <p className="text-2xl font-bold text-white font-[var(--font-heading)]">
            {totalScenarios}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {isPremium ? 'Unlimited' : `${totalScenarios}/3 free slots`}
          </p>
        </div>
        <div className="card p-5 border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <p className="stat-label">Progress Snapshots</p>
          </div>
          <p className="text-2xl font-bold text-white font-[var(--font-heading)]">
            {progressHistory.length}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {user.created_at ? `Member since ${new Date(user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : ''}
          </p>
        </div>
      </div>

      {/* Generate Report Card */}
      <div className="card p-5 border-emerald-500/20 bg-emerald-500/[0.03]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Generate Your FIRE Report</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {primaryScenario
                  ? `Interactive dashboard with AI analysis${comparisonScenarios.length > 0 ? ` + ${comparisonScenarios.length} comparison${comparisonScenarios.length > 1 ? 's' : ''}` : ''}`
                  : 'Complete the calculator first'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/report"
              className={`btn-primary px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 ${!primaryScenario ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <BarChart3 className="w-4 h-4" />
              View Report
            </a>
            <button
              onClick={() => handleGenerateReport('pdf')}
              disabled={!primaryScenario || generatingReport}
              className="btn-secondary px-4 py-2.5 text-sm inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              {generatingReport ? (
                <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Primary Scenario */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Your Current Situation</h2>
        {primaryScenario ? (
          <div className="card p-5 border-emerald-500/15">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/15 text-emerald-400 uppercase tracking-wider">
                    Baseline
                  </span>
                  <span className="text-xs text-zinc-600">
                    Updated {new Date(primaryScenario.updated_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">True Hourly</p>
                    <p className="text-lg font-bold text-emerald-400 font-[var(--font-heading)]">
                      {formatCurrency(primaryScenario.data.results?.trueHourlyRate || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Salary</p>
                    <p className="text-lg font-semibold text-white">
                      {formatCurrency(primaryScenario.data.inputs?.salary || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Reality</p>
                    <p className="text-lg font-semibold text-white">
                      {(primaryScenario.data.results?.percentOfAssumed || 0).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Tax Rate</p>
                    <p className="text-lg font-semibold text-amber-400">
                      {(primaryScenario.data.results?.taxBreakdown?.effectiveTaxRate || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/calculator"
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 flex-shrink-0 ml-4"
              >
                Update
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="card p-8 border-dashed border-zinc-700 text-center">
            <p className="text-zinc-500 mb-4 text-sm">No calculations yet</p>
            <Link href="/calculator" className="btn-primary px-6 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Run Calculator
            </Link>
          </div>
        )}
      </div>

      {/* Quick Access Tools */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Quick Tools</h2>
          <button onClick={() => setActiveView('tools')} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            View all →
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {toolCards.slice(0, 3).map((tool) => (
            <button
              key={tool.id}
              onClick={() => { setActiveView('tools'); setExpandedTool(tool.id); }}
              className="card card-interactive p-4 border-zinc-800 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${tool.bg} flex items-center justify-center flex-shrink-0`}>
                  <tool.icon className={`w-4 h-4 ${tool.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors truncate">{tool.title}</h3>
                  <p className="text-xs text-zinc-600 truncate">{tool.description.substring(0, 60)}…</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Scenarios + Progress sidebar */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Recent Scenarios</h2>
            <button onClick={() => setActiveView('scenarios')} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              View all →
            </button>
          </div>

          {comparisonScenarios.length === 0 && scenarios.length === 0 ? (
            <div className="card p-8 text-center border-zinc-800">
              <p className="text-zinc-500 text-sm mb-3">No saved scenarios yet</p>
              <Link href="/calculator" className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
                Start exploring calculators →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {comparisonScenarios.slice(0, 3).map((scenario) => (
                <div key={scenario.id} className="card card-interactive p-4 border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-white text-sm truncate">{scenario.name}</h3>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-500 flex-shrink-0">
                          {calculatorTypeLabels[scenario.calculator_type]}
                        </span>
                      </div>
                      {scenario.description && (
                        <p className="text-xs text-zinc-600 truncate">{scenario.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMultiScenario(scenario.id)}
                      disabled={deletingId === scenario.id}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 ml-2 flex-shrink-0"
                      aria-label="Delete scenario"
                    >
                      {deletingId === scenario.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {scenarios.slice(0, 3).map((scenario) => (
                <div key={scenario.id} className="card card-interactive p-4 border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm truncate mb-1">{scenario.name}</h3>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-emerald-400 font-medium">
                          {formatCurrency(scenario.calculation_results?.trueHourlyRate || 0)}/hr
                        </span>
                        <span className="text-zinc-600">
                          {new Date(scenario.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteScenario(scenario.id)}
                      disabled={deletingId === scenario.id}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 ml-2 flex-shrink-0"
                      aria-label="Delete scenario"
                    >
                      {deletingId === scenario.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress sidebar */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Progress</h2>
          {progressHistory.length === 0 ? (
            <div className="card p-5 text-center border-zinc-800">
              <p className="text-zinc-500 text-xs">No progress history yet.</p>
              <p className="text-zinc-600 text-xs mt-1">Tracked automatically when you calculate.</p>
            </div>
          ) : (
            <div className="card p-4 border-zinc-800">
              <div className="space-y-3">
                {progressHistory.slice(0, 5).map((snapshot, index) => (
                  <div key={snapshot.id} className={`pb-3 ${index < 4 ? 'border-b border-white/[0.04]' : ''}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-zinc-600">
                        {new Date(snapshot.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-sm font-semibold text-emerald-400">
                        {formatCurrency(snapshot.true_hourly_wage)}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-zinc-600">
                        Score: <span className="text-zinc-400">{snapshot.freedom_score.toFixed(0)}%</span>
                      </span>
                      {snapshot.savings_rate != null && (
                        <span className="text-zinc-600">
                          Savings: <span className="text-zinc-400">{snapshot.savings_rate.toFixed(0)}%</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderScenarios = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-lg text-xl text-white mb-1">My Scenarios</h2>
          <p className="text-sm text-zinc-500">
            {isPremium ? 'Unlimited scenarios' : `${totalScenarios}/3 free slots`}
            {!isPremium && (
              <> · <button onClick={() => setShowPremiumModal(true)} className="text-emerald-400 hover:underline">Upgrade for unlimited</button></>
            )}
          </p>
        </div>
        <Link href="/calculator" className="btn-primary px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Scenario
        </Link>
      </div>

      {/* Primary Scenario */}
      {primaryScenario && (
        <div className="card p-5 border-emerald-500/15">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/15 text-emerald-400 uppercase tracking-wider">
              Primary / Baseline
            </span>
            <span className="text-xs text-zinc-600">
              Updated {new Date(primaryScenario.updated_at).toLocaleDateString('en-GB')}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">True Hourly</p>
              <p className="text-lg font-bold text-emerald-400 font-[var(--font-heading)]">
                {formatCurrency(primaryScenario.data.results?.trueHourlyRate || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Salary</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(primaryScenario.data.inputs?.salary || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Reality</p>
              <p className="text-lg font-semibold text-white">
                {(primaryScenario.data.results?.percentOfAssumed || 0).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Tax Rate</p>
              <p className="text-lg font-semibold text-amber-400">
                {(primaryScenario.data.results?.taxBreakdown?.effectiveTaxRate || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All comparison scenarios */}
      {comparisonScenarios.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Comparisons</h3>
          {comparisonScenarios.map((scenario) => (
            <div key={scenario.id} className="card card-interactive p-4 border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium text-white text-sm truncate">{scenario.name}</h3>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-500 flex-shrink-0">
                      {calculatorTypeLabels[scenario.calculator_type]}
                    </span>
                  </div>
                  {scenario.description && (
                    <p className="text-xs text-zinc-600 truncate">{scenario.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteMultiScenario(scenario.id)}
                  disabled={deletingId === scenario.id}
                  className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 ml-2 flex-shrink-0"
                  aria-label="Delete scenario"
                >
                  {deletingId === scenario.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legacy scenarios */}
      {scenarios.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Saved Calculations</h3>
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="card card-interactive p-4 border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white text-sm truncate mb-1">{scenario.name}</h3>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-emerald-400 font-medium">
                      {formatCurrency(scenario.calculation_results?.trueHourlyRate || 0)}/hr
                    </span>
                    <span className="text-zinc-600">
                      {new Date(scenario.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteScenario(scenario.id)}
                  disabled={deletingId === scenario.id}
                  className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 ml-2 flex-shrink-0"
                  aria-label="Delete scenario"
                >
                  {deletingId === scenario.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalScenarios === 0 && (
        <div className="card p-12 text-center border-dashed border-zinc-700">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-6 h-6 text-zinc-600" />
          </div>
          <h3 className="text-white font-medium mb-2">No scenarios yet</h3>
          <p className="text-zinc-500 text-sm mb-5 max-w-sm mx-auto">
            Create your first scenario by running the calculator. You can save and compare multiple what-if scenarios.
          </p>
          <Link href="/calculator" className="btn-primary px-6 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create First Scenario
          </Link>
        </div>
      )}
    </div>
  );

  const renderFireTracker = () => (
    <div className="space-y-6">
      <div>
        <h2 className="heading-lg text-xl text-white mb-1">FIRE Tracker</h2>
        <p className="text-sm text-zinc-500">Track your Financial Independence / Retire Early progress over time.</p>
      </div>

      {/* Inline FIRE Progress component */}
      <div className="card p-0 border-zinc-800 overflow-hidden">
        <FireProgress />
      </div>

      {/* Progress History */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Progress History</h3>
        {progressHistory.length === 0 ? (
          <div className="card p-8 text-center border-zinc-800">
            <p className="text-zinc-500 text-sm">No progress snapshots yet.</p>
            <p className="text-zinc-600 text-xs mt-2">Your progress is automatically tracked each time you run the calculator.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {progressHistory.map((snapshot) => (
              <div key={snapshot.id} className="card p-4 border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-zinc-500">
                    {new Date(snapshot.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatCurrency(snapshot.true_hourly_wage)}/hr
                  </span>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-zinc-500">
                    Freedom Score: <span className="text-white font-medium">{snapshot.freedom_score.toFixed(0)}%</span>
                  </span>
                  {snapshot.savings_rate != null && (
                    <span className="text-zinc-500">
                      Savings Rate: <span className="text-white font-medium">{snapshot.savings_rate.toFixed(0)}%</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTools = () => (
    <div className="space-y-6">
      <div>
        <h2 className="heading-lg text-xl text-white mb-1">Financial Tools</h2>
        <p className="text-sm text-zinc-500">
          11 specialized calculators to understand every aspect of your financial picture. Each tool uses your true hourly wage for personalized insights.
        </p>
      </div>

      {/* Tool cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {toolCards.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setExpandedTool(expandedTool === tool.id ? null : tool.id)}
            className={`card p-5 border-zinc-800 text-left group transition-all duration-200 ${
              expandedTool === tool.id ? 'ring-1 ring-emerald-500/30 border-emerald-500/20' : 'card-interactive'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center flex-shrink-0`}>
                <tool.icon className={`w-5 h-5 ${tool.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{tool.title}</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{tool.description}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>{expandedTool === tool.id ? 'Click to close' : 'Click to open'}</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>

      {/* Expanded tool calculator */}
      {expandedTool && (
        <div className="card p-0 border-zinc-800 overflow-hidden">
          <div className="border-b border-white/[0.04] px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              {toolCards.find(t => t.id === expandedTool)?.title}
            </h3>
            <button
              onClick={() => setExpandedTool(null)}
              className="text-zinc-500 hover:text-white transition-colors text-xs"
            >
              Close ×
            </button>
          </div>
          <div>
            {expandedTool === 'product-explorer' && <ProductExplorer />}
            {expandedTool === 'opportunity-cost' && <OpportunityCostCalculator />}
            {expandedTool === 'fire-tracker' && <FireProgress />}
            {expandedTool === 'commute' && <CommuteCalculator />}
            {expandedTool === 'geo-arbitrage' && <GeoArbitrageCalculator />}
            {expandedTool === 'wfh' && <WFHCalculator />}
            {expandedTool === 'pension' && <PensionCalculator />}
            {expandedTool === 'student-loan' && <StudentLoanCalculator />}
            {expandedTool === 'car' && <CarCalculator />}
            {expandedTool === 'carers' && <CarersCalculator />}
            {expandedTool === 'stress' && <StressCalculator />}
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="heading-lg text-xl text-white mb-1">Settings</h2>
        <p className="text-sm text-zinc-500">Manage your account, subscription, and preferences.</p>
      </div>

      {/* Account section */}
      <div className="card p-5 border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-white">Account</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-zinc-400">Email</span>
            <span className="text-sm text-white">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-white/[0.04]">
            <span className="text-sm text-zinc-400">Member since</span>
            <span className="text-sm text-white">
              {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Subscription section */}
      <div className="card p-5 border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-white">Subscription</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-zinc-400">Current plan</span>
            <span className={`text-sm font-medium ${isPremium ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {subscriptionStatus === 'lifetime' ? 'Lifetime Premium' : isPremium ? 'Premium' : 'Free'}
            </span>
          </div>
          {!isPremium && (
            <div className="pt-3 border-t border-white/[0.04]">
              <p className="text-xs text-zinc-500 mb-3">
                Upgrade to Premium for unlimited scenarios, AI-powered reports, and all calculator tools.
              </p>
              <button
                onClick={() => setShowPremiumModal(true)}
                className="btn-primary px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                Upgrade to Premium
              </button>
            </div>
          )}
          {isPremium && subscriptionStatus !== 'lifetime' && (
            <div className="pt-3 border-t border-white/[0.04]">
              <p className="text-xs text-zinc-500">
                You have an active premium subscription. Manage your billing through the Stripe customer portal.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="card p-5 border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-white">Data & Usage</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-zinc-400">Saved scenarios</span>
            <span className="text-sm text-white">{totalScenarios}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-white/[0.04]">
            <span className="text-sm text-zinc-400">Progress snapshots</span>
            <span className="text-sm text-white">{progressHistory.length}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-white/[0.04]">
            <span className="text-sm text-zinc-400">Reports generated</span>
            <span className="text-sm text-zinc-500">—</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Map views to their titles
  const viewTitles: Record<string, string> = {
    overview: 'Dashboard',
    scenarios: 'My Scenarios',
    fire: 'FIRE Tracker',
    tools: 'Financial Tools',
    settings: 'Settings',
  };

  return (
    <main className="min-h-screen bg-[#050505]">
      {/* Sidebar */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          {activeView === 'overview' ? (
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="heading-lg text-2xl md:text-3xl text-white mb-1">
                  Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}
                </h1>
                <p className="text-sm text-zinc-500">
                  {primaryScenario
                    ? `Last updated ${new Date(primaryScenario.updated_at).toLocaleDateString('en-GB')}`
                    : 'Start by calculating your true hourly wage'}
                </p>
              </div>
              <Link href="/calculator" className="btn-primary px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Scenario
              </Link>
            </div>
          ) : (
            <div className="mb-8">
              <button
                onClick={() => setActiveView('overview')}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3 inline-flex items-center gap-1"
              >
                ← Back to Dashboard
              </button>
            </div>
          )}

          {loading ? (
            /* Skeleton loading */
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card p-5 border-zinc-800">
                    <div className="skeleton h-4 w-24 mb-3" />
                    <div className="skeleton h-8 w-32 mb-2" />
                    <div className="skeleton h-3 w-20" />
                  </div>
                ))}
              </div>
              <div className="skeleton h-32 w-full rounded-2xl" />
              <div className="skeleton h-48 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              {activeView === 'overview' && renderOverview()}
              {activeView === 'scenarios' && renderScenarios()}
              {activeView === 'fire' && renderFireTracker()}
              {activeView === 'tools' && renderTools()}
              {activeView === 'settings' && renderSettings()}
            </>
          )}
        </div>
      </div>

      <AuthModal />
      <PremiumModal />
    </main>
  );
}
