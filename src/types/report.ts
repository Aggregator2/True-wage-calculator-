// ============================================================================
// INTERACTIVE REPORT TYPE DEFINITIONS
// ============================================================================

import type { ComprehensiveUserData, AIAnalysisResult } from '@/lib/openrouter';

// The complete data payload for the interactive report
export interface InteractiveReportData {
  userData: ComprehensiveUserData;
  aiAnalysis: AIAnalysisResult;
  generatedAt: string;
  userName: string;
  isPremium: boolean;
}

// Section navigation
export interface ReportSection {
  id: string;
  label: string;
  icon: string; // lucide icon name
  isPremium: boolean; // whether this section requires premium
}

// Score gauge data
export interface ScoreGauge {
  label: string;
  score: number; // 0-100
  description: string;
}

// Hero section data
export interface HeroData {
  userName: string;
  reportDate: string;
  trueHourlyWage: number;
  statedHourlyWage: number;
  yearsToFIRE: number;
  hookParagraph: string;
  annualHiddenCosts: number;
}

// Income section data
export interface IncomeData {
  grossSalary: number;
  incomeTax: number;
  nationalInsurance: number;
  pensionContribution: number;
  takeHomePay: number;
  effectiveTaxRate: number;
  trueHourlyWage: number;
  statedHourlyWage: number;
  unpaidOvertimeHours: number;
  annualFreeLabourHours: number;
  studentLoanRepayment: number;
  aiCommentary: string;
}

// Donut chart segment
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

// Savings rate data
export interface SavingsData {
  savingsRatePercent: number;
  ukAverageSavingsRate: number;
  monthlySavings: number;
  annualSavings: number;
  hiddenCosts: number;
  freeLabourHours: number;
  fireTargetYears: number;
  aiCommentary: string;
}

// Expense category for spending analysis
export interface ExpenseCategory {
  name: string;
  amount: number;
  hoursOfLife: number; // amount / true hourly wage
  color: string;
}

// Lifestyle creep item
export interface LifestyleCreepItem {
  name: string;
  annualCost: number;
}

// Spending analysis data
export interface SpendingData {
  expenses: ExpenseCategory[];
  lifestyleCreep: LifestyleCreepItem[];
  totalLifestyleCreepCost: number;
  equivalentHours: number;
  fireDelay: number; // years
  aiWarning: string;
  sourceCitation: string;
}

// Recommendation with interactive toggle
export interface Recommendation {
  id: string;
  number: number;
  title: string;
  impactAmount: number;
  fireAcceleration: number; // years saved
  beforeValue: string;
  afterValue: string;
  conventionalWisdom: string;
  contrarianCase: string;
  sourceCitation: string;
  isApplied: boolean;
}

// Action timeline phase
export interface TimelinePhase {
  id: string;
  timeRange: string;
  color: string;
  actions: TimelineAction[];
}

export interface TimelineAction {
  id: string;
  task: string;
  impact: string;
  annualSavings?: number;
  isCompleted: boolean;
}

// FIRE projection scenario
export interface ProjectionScenario {
  label: string;
  color: string;
  data: { year: number; value: number }[];
  isVisible: boolean;
}

// Projection data
export interface ProjectionData {
  scenarios: ProjectionScenario[];
  currentPathFIAge: number;
  withChangesFIAge: number;
  delta: number;
  assumptions: string;
}

// Flexible AI content section
export interface AISection {
  id: string;
  title: string;
  icon: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  paragraphs: string[];
  metrics?: { label: string; value: string; type?: 'positive' | 'negative' | 'neutral' }[];
  sourceCitation?: string;
  isPremium: boolean;
}

// PDF export state
export interface PDFExportState {
  isExporting: boolean;
  currentPage: number;
  totalPages: number;
  status: string;
}
