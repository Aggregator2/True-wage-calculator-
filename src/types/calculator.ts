// Calculator Types for UK True Hourly Wage Calculator

export interface TaxConfig {
  personalAllowance: number;
  personalAllowanceTaperThreshold: number;
  england: TaxBands;
  scotland: TaxBands;
  nationalInsurance: NIConfig;
  studentLoans: StudentLoanConfig;
}

export interface TaxBands {
  bands: TaxBand[];
}

export interface TaxBand {
  threshold: number;
  rate: number;
}

export interface NIConfig {
  primaryThreshold: number;
  upperEarningsLimit: number;
  mainRate: number;
  upperRate: number;
}

export interface StudentLoanConfig {
  plan1: LoanPlan;
  plan2: LoanPlan;
  plan4: LoanPlan;
  plan5: LoanPlan;
  postgrad: LoanPlan;
}

export interface LoanPlan {
  threshold: number;
  rate: number;
}

export type TaxRegion = 'england' | 'scotland';
export type StudentLoanPlan = 'none' | 'plan1' | 'plan2' | 'plan4' | 'plan5' | 'postgrad';

export interface CalculationInputs {
  salary: number;
  taxRegion: TaxRegion;
  studentLoan: StudentLoanPlan;
  pensionPercent: number;
  contractHours: number;
  commuteMinutes: number;
  unpaidBreak: number;
  prepTime: number;
  workDays: number;
  holidayDays: number;
  commuteCost: number;
  workClothes: number;
  stressTax: number;
}

export interface TaxBreakdown {
  grossSalary: number;
  pensionContribution: number;
  personalAllowance: number;
  incomeTax: number;
  nationalInsurance: number;
  studentLoan: number;
  totalDeductions: number;
  netSalary: number;
  effectiveTaxRate: number;
  effectiveMarginalRate: number;
}

export interface TimeBreakdown {
  weeklyContractHours: number;
  weeklyCommuteHours: number;
  weeklyBreakHours: number;
  weeklyPrepHours: number;
  weeklyTotalHours: number;
  annualContractHours: number;
  annualTotalHours: number;
  workingWeeks: number;
}

export interface CalculationResults {
  trueHourlyRate: number;
  assumedHourlyRate: number;
  taxBreakdown: TaxBreakdown;
  timeBreakdown: TimeBreakdown;
  annualWorkCosts: number;
  stressTax: number;
  region: TaxRegion;
  salary: number;
  percentOfAssumed: number;
}

export interface Product {
  name: string;
  price: number;
  emoji: string;
  category: ProductCategory;
  period?: 'month' | 'year';
}

export type ProductCategory = 'food' | 'tech' | 'subscriptions' | 'transport' | 'home' | 'lifestyle';

export interface WhatIfScenario {
  label: string;
  trueHourlyRate: number;
  difference: number;
  percentChange: number;
}

export interface FireProgress {
  fireNumber: number;
  percentComplete: number;
  amountRemaining: number;
  savingsRateNeeded: number;
  currentPassiveIncome: number;
  milestones: Milestone[];
  achievedMilestones: Milestone[];
  nextMilestone: Milestone | null;
  zoneColor: string;
  zone: string;
}

export interface OpportunityCostResult {
  todayCost: number;
  futureValue: number;
  growthMultiplier: number;
  yearsToGrow: number;
  annualRetirementIncome: number;
  hoursOfLife?: number;
}

export interface Milestone {
  name: string;
  target: number;
  icon: string;
}

