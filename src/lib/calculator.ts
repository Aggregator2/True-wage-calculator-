// UK True Hourly Wage Calculator - Core Logic
import { TAX_CONFIG } from './tax-config';
import type {
  TaxRegion,
  StudentLoanPlan,
  TaxBreakdown,
  TimeBreakdown,
  CalculationInputs,
  CalculationResults,
  WhatIfScenario,
  FireProgress,
  Milestone,
  OpportunityCostResult
} from '@/types/calculator';

// ============================================
// TAX CALCULATION FUNCTIONS
// ============================================

export function calculatePersonalAllowance(grossSalary: number): number {
  if (grossSalary <= TAX_CONFIG.personalAllowanceTaperThreshold) {
    return TAX_CONFIG.personalAllowance;
  }
  const reduction = Math.floor((grossSalary - TAX_CONFIG.personalAllowanceTaperThreshold) / 2);
  return Math.max(0, TAX_CONFIG.personalAllowance - reduction);
}

export function calculateIncomeTax(taxableIncome: number, region: TaxRegion): number {
  const bands = TAX_CONFIG[region].bands;
  let tax = 0;
  let remainingIncome = taxableIncome;
  let previousThreshold = 0;

  for (const band of bands) {
    if (remainingIncome <= 0) break;
    const bandWidth = band.threshold - previousThreshold;
    const taxableInBand = Math.min(remainingIncome, bandWidth);
    tax += taxableInBand * band.rate;
    remainingIncome -= taxableInBand;
    previousThreshold = band.threshold;
  }
  return tax;
}

export function calculateNI(grossSalary: number): number {
  const ni = TAX_CONFIG.nationalInsurance;
  if (grossSalary <= ni.primaryThreshold) return 0;

  let niContribution = 0;
  const mainRateEarnings = Math.min(grossSalary, ni.upperEarningsLimit) - ni.primaryThreshold;
  niContribution += Math.max(0, mainRateEarnings) * ni.mainRate;

  if (grossSalary > ni.upperEarningsLimit) {
    niContribution += (grossSalary - ni.upperEarningsLimit) * ni.upperRate;
  }
  return niContribution;
}

export function calculateStudentLoan(grossSalary: number, planType: StudentLoanPlan): number {
  if (planType === 'none') return 0;
  const plan = TAX_CONFIG.studentLoans[planType];
  if (!plan || grossSalary <= plan.threshold) return 0;
  return (grossSalary - plan.threshold) * plan.rate;
}

export function getMarginalRateEngland(income: number): number {
  if (income > 100000 && income <= 125140) return 0.60;
  if (income > 125140) return 0.45;
  if (income > 50270) return 0.40;
  if (income > 12570) return 0.20;
  return 0;
}

export function getMarginalRateScotland(income: number): number {
  if (income > 100000 && income <= 125140) return 0.675;
  if (income > 125140) return 0.48;
  if (income > 75000) return 0.45;
  if (income > 43662) return 0.42;
  if (income > 26561) return 0.21;
  if (income > 14876) return 0.20;
  if (income > 12570) return 0.19;
  return 0;
}

export function calculateAllDeductions(
  grossSalary: number,
  region: TaxRegion,
  studentLoanPlan: StudentLoanPlan,
  pensionPercent: number
): TaxBreakdown {
  const pensionContribution = grossSalary * (pensionPercent / 100);
  const taxableGross = grossSalary - pensionContribution;
  const personalAllowance = calculatePersonalAllowance(taxableGross);

  const incomeTax = calculateIncomeTax(taxableGross, region);
  const nationalInsurance = calculateNI(grossSalary);
  const studentLoan = calculateStudentLoan(grossSalary, studentLoanPlan);

  const totalDeductions = incomeTax + nationalInsurance + studentLoan + pensionContribution;
  const netSalary = grossSalary - totalDeductions;

  const marginalIncomeTax = region === 'scotland'
    ? getMarginalRateScotland(taxableGross)
    : getMarginalRateEngland(taxableGross);
  const marginalNI = grossSalary > TAX_CONFIG.nationalInsurance.upperEarningsLimit ? 0.02 : 0.08;
  const marginalStudentLoan = studentLoanPlan !== 'none' && grossSalary > TAX_CONFIG.studentLoans[studentLoanPlan]?.threshold
    ? TAX_CONFIG.studentLoans[studentLoanPlan].rate : 0;

  return {
    grossSalary,
    pensionContribution,
    personalAllowance,
    incomeTax,
    nationalInsurance,
    studentLoan,
    totalDeductions,
    netSalary,
    effectiveTaxRate: (totalDeductions / grossSalary) * 100,
    effectiveMarginalRate: (marginalIncomeTax + marginalNI + marginalStudentLoan) * 100
  };
}

// ============================================
// TIME CALCULATION
// ============================================

export function calculateTrueHours(
  contractHours: number,
  commuteMinutes: number,
  unpaidBreak: number,
  prepTime: number,
  workDays: number,
  holidayDays: number
): TimeBreakdown {
  const weeksPerYear = 52;
  const workingWeeks = weeksPerYear - (holidayDays / workDays);

  const weeklyContractHours = contractHours;
  const weeklyCommuteHours = (commuteMinutes * workDays) / 60;
  const weeklyBreakHours = (unpaidBreak * workDays) / 60;
  const weeklyPrepHours = (prepTime * workDays) / 60;
  const weeklyTotalHours = weeklyContractHours + weeklyCommuteHours + weeklyBreakHours + weeklyPrepHours;

  return {
    weeklyContractHours,
    weeklyCommuteHours,
    weeklyBreakHours,
    weeklyPrepHours,
    weeklyTotalHours,
    annualContractHours: weeklyContractHours * workingWeeks,
    annualTotalHours: weeklyTotalHours * workingWeeks,
    workingWeeks
  };
}

// ============================================
// MAIN CALCULATION
// ============================================

export function calculate(inputs: CalculationInputs): CalculationResults {
  const taxBreakdown = calculateAllDeductions(
    inputs.salary,
    inputs.taxRegion,
    inputs.studentLoan,
    inputs.pensionPercent
  );

  const timeBreakdown = calculateTrueHours(
    inputs.contractHours,
    inputs.commuteMinutes,
    inputs.unpaidBreak,
    inputs.prepTime,
    inputs.workDays,
    inputs.holidayDays
  );

  const annualWorkCosts = (inputs.commuteCost * 12) + inputs.workClothes;
  const netAfterCosts = taxBreakdown.netSalary - annualWorkCosts;
  const stressAdjustedNet = netAfterCosts * (1 - inputs.stressTax / 100);

  const assumedHourlyRate = inputs.salary / timeBreakdown.annualContractHours;
  const trueHourlyRate = stressAdjustedNet / timeBreakdown.annualTotalHours;
  const percentOfAssumed = (trueHourlyRate / assumedHourlyRate) * 100;

  return {
    trueHourlyRate,
    assumedHourlyRate,
    taxBreakdown,
    timeBreakdown,
    annualWorkCosts,
    stressTax: inputs.stressTax,
    region: inputs.taxRegion,
    salary: inputs.salary,
    percentOfAssumed
  };
}

// ============================================
// WHAT-IF SCENARIOS
// ============================================

export function calculateWhatIfScenario(
  scenario: 'wfh2' | 'wfh3' | 'raise10' | 'raise20',
  inputs: CalculationInputs,
  currentResults: CalculationResults
): WhatIfScenario {
  const modifiedInputs = { ...inputs };
  let label = '';

  switch (scenario) {
    case 'wfh2':
      modifiedInputs.commuteMinutes = inputs.commuteMinutes * 0.6;
      modifiedInputs.commuteCost = inputs.commuteCost * 0.6;
      label = 'WFH 2 days/week';
      break;
    case 'wfh3':
      modifiedInputs.commuteMinutes = inputs.commuteMinutes * 0.4;
      modifiedInputs.commuteCost = inputs.commuteCost * 0.4;
      label = 'WFH 3 days/week';
      break;
    case 'raise10':
      modifiedInputs.salary = inputs.salary * 1.10;
      label = '10% raise';
      break;
    case 'raise20':
      modifiedInputs.salary = inputs.salary * 1.20;
      label = '20% raise';
      break;
  }

  const modifiedResults = calculate(modifiedInputs);

  return {
    label,
    trueHourlyRate: modifiedResults.trueHourlyRate,
    difference: modifiedResults.trueHourlyRate - currentResults.trueHourlyRate,
    percentChange: ((modifiedResults.trueHourlyRate / currentResults.trueHourlyRate) - 1) * 100
  };
}

// ============================================
// FIRE PROGRESS
// ============================================

export function calculateFireProgress(
  currentSavings: number,
  annualExpenses: number
): FireProgress {
  const fireNumber = annualExpenses * 25;
  const percentComplete = Math.min((currentSavings / fireNumber) * 100, 100);
  const amountRemaining = Math.max(0, fireNumber - currentSavings);
  const currentPassiveIncome = currentSavings * 0.04; // 4% SWR

  // Calculate savings rate needed to reach FI in 15 years
  const yearsToFI = 15;
  const annualReturn = 0.07;
  const fvFromCurrent = currentSavings * Math.pow(1 + annualReturn, yearsToFI);
  const additionalNeeded = fireNumber - fvFromCurrent;
  const annuitySavingsNeeded = additionalNeeded > 0
    ? (additionalNeeded * annualReturn) / (Math.pow(1 + annualReturn, yearsToFI) - 1)
    : 0;
  const savingsRateNeeded = (annuitySavingsNeeded / annualExpenses) * 100;

  const milestones: Milestone[] = [
    { name: 'First £10K', target: 10000, icon: '🌱' },
    { name: '£25K', target: 25000, icon: '📈' },
    { name: '£50K', target: 50000, icon: '🎯' },
    { name: '£100K', target: 100000, icon: '💪' },
    { name: 'Coast FI', target: fireNumber * 0.5, icon: '⛵' },
    { name: 'Lean FI', target: fireNumber * 0.75, icon: '🏃' },
    { name: 'Full FI', target: fireNumber, icon: '🎉' },
  ];

  const achievedMilestones = milestones.filter(m => currentSavings >= m.target);
  const nextMilestone = milestones.find(m => currentSavings < m.target) || null;

  let zoneColor = '#ef4444';
  let zone = 'Starting Out';
  if (percentComplete >= 25) { zoneColor = '#f59e0b'; zone = 'Building'; }
  if (percentComplete >= 50) { zoneColor = '#eab308'; zone = 'Halfway'; }
  if (percentComplete >= 75) { zoneColor = '#84cc16'; zone = 'Almost There'; }
  if (percentComplete >= 100) { zoneColor = '#10b981'; zone = 'Financially Independent!'; }

  return {
    fireNumber,
    percentComplete,
    amountRemaining,
    savingsRateNeeded: Math.max(0, savingsRateNeeded),
    currentPassiveIncome,
    milestones,
    achievedMilestones,
    nextMilestone,
    zoneColor,
    zone
  };
}

// ============================================
// S&P 500 OPPORTUNITY COST
// ============================================

const SP500_REAL_RETURN = 0.07; // After inflation
const SAFE_WITHDRAWAL_RATE = 0.04;

export function calculateOpportunityCost(
  amount: number,
  currentAge: number,
  retireAge: number,
  trueHourlyRate?: number
): OpportunityCostResult {
  const yearsToGrow = retireAge - currentAge;
  if (yearsToGrow <= 0) {
    return {
      todayCost: amount,
      futureValue: amount,
      growthMultiplier: 1,
      yearsToGrow: 0,
      annualRetirementIncome: amount * SAFE_WITHDRAWAL_RATE,
      hoursOfLife: trueHourlyRate ? amount / trueHourlyRate : undefined
    };
  }

  const futureValue = amount * Math.pow(1 + SP500_REAL_RETURN, yearsToGrow);
  const growthMultiplier = futureValue / amount;
  const annualRetirementIncome = futureValue * SAFE_WITHDRAWAL_RATE;

  return {
    todayCost: amount,
    futureValue,
    growthMultiplier,
    yearsToGrow,
    annualRetirementIncome,
    hoursOfLife: trueHourlyRate ? amount / trueHourlyRate : undefined
  };
}

// ============================================
// URL ENCODING/DECODING
// ============================================

export function encodeInputsToUrl(inputs: CalculationInputs): string {
  const data = {
    s: inputs.salary,
    r: inputs.taxRegion,
    sl: inputs.studentLoan,
    p: inputs.pensionPercent,
    ch: inputs.contractHours,
    cm: inputs.commuteMinutes,
    ub: inputs.unpaidBreak,
    pt: inputs.prepTime,
    wd: inputs.workDays,
    hd: inputs.holidayDays,
    cc: inputs.commuteCost,
    wc: inputs.workClothes,
    st: inputs.stressTax
  };
  return btoa(JSON.stringify(data));
}

export function decodeInputsFromUrl(encoded: string): CalculationInputs | null {
  try {
    const data = JSON.parse(atob(encoded));
    return {
      salary: data.s || 35000,
      taxRegion: data.r || 'england',
      studentLoan: data.sl || 'none',
      pensionPercent: data.p || 5,
      contractHours: data.ch || 37.5,
      commuteMinutes: data.cm || 56,
      unpaidBreak: data.ub || 30,
      prepTime: data.pt || 30,
      workDays: data.wd || 5,
      holidayDays: data.hd || 28,
      commuteCost: data.cc || 0,
      workClothes: data.wc || 0,
      stressTax: data.st || 0
    };
  } catch {
    return null;
  }
}

// ============================================
// FORMATTING UTILITIES
// ============================================

export function formatCurrency(amount: number): string {
  return '£' + amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-GB');
}

export function formatTimeHM(hours: number): string {
  if (!hours || hours === 0) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatHours(hours: number): string {
  if (!hours || !isFinite(hours)) return '0h';
  if (hours < 1) return Math.round(hours * 60) + 'm';
  if (hours < 8) return hours.toFixed(1) + 'h';
  const days = Math.floor(hours / 8);
  const rem = hours % 8;
  return rem < 0.5 ? `${days}d` : `${days}d ${rem.toFixed(1)}h`;
}
