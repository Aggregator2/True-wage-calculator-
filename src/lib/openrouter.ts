import OpenAI from 'openai';

// OpenRouter client configuration - lazy initialization
// Works with OpenAI SDK but routes to OpenRouter
let _openrouter: OpenAI | null = null;
function getOpenRouter(): OpenAI {
  if (!_openrouter) {
    _openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'https://truewage.uk',
        'X-Title': 'TrueWage UK FIRE Calculator',
      },
    });
  }
  return _openrouter;
}

// Model constants - Cost-optimized approach
// Using Haiku for 90% cost reduction while maintaining quality
export const MODELS = {
  FAST: 'anthropic/claude-haiku-4-5', // Fast tasks: summaries, quick analysis (~$0.25/1M tokens)
  DEEP: 'anthropic/claude-sonnet-4',  // Deep reasoning: complex synthesis (only when needed)
  PREMIUM: 'anthropic/claude-opus-4', // Premium analysis (rarely used)
} as const;

// Cost per report estimate (with Haiku):
// - Input: ~50k tokens = $0.05
// - Output: ~20k tokens = $0.10
// - Total: ~$0.15 per report (vs $2.25 with Opus)

export type ModelType = keyof typeof MODELS;

/**
 * Generate text using OpenRouter
 */
export async function generateText(
  prompt: string,
  systemPrompt: string,
  model: ModelType = 'FAST'
): Promise<string> {
  try {
    const response = await getOpenRouter().chat.completions.create({
      model: MODELS[model],
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw new Error('Failed to generate text');
  }
}

/**
 * Generate structured JSON response
 */
export async function generateJSON<T>(
  prompt: string,
  systemPrompt: string,
  model: ModelType = 'FAST'
): Promise<T> {
  const jsonSystemPrompt = `${systemPrompt}

IMPORTANT: You must respond with valid JSON only. No markdown, no code blocks, just raw JSON.`;

  const response = await generateText(prompt, jsonSystemPrompt, model);

  // Clean response if it has markdown
  let cleanedResponse = response.trim();
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.slice(7);
  }
  if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.slice(3);
  }
  if (cleanedResponse.endsWith('```')) {
    cleanedResponse = cleanedResponse.slice(0, -3);
  }

  return JSON.parse(cleanedResponse.trim()) as T;
}

// ============================================================================
// COMPREHENSIVE USER DATA INTERFACE
// ============================================================================

export interface ComprehensiveUserData {
  // ===== CORE FINANCIAL DATA =====
  profile: {
    userId: string;
    name: string;
    email: string;
    age: number;
    location: string;
    industry: string;
    jobTitle: string;
  };

  // ===== TRUE WAGE CALCULATOR DATA =====
  income: {
    grossAnnualSalary: number;
    netAnnualSalary: number;
    monthlyTakeHome: number;
    incomeTax: number;
    nationalInsurance: number;
    studentLoanRepayments: {
      plan1?: number;
      plan2?: number;
      plan4?: number;
      plan5?: number;
      postgrad?: number;
      total: number;
    };
    pensionContributions: {
      employee: number;
      employer: number;
      total: number;
    };
    effectiveTaxRate: number;
    marginalTaxRate: number;
    contractedHoursPerWeek: number;
    actualHoursPerWeek: number;
    unpaidOvertimeHours: number;
    statedHourlyWage: number;
    trueHourlyWage: number;
    hourlyWageDifference: number;
    hiddenAnnualCost: number;
    inTaxTrap: boolean;
    taxTrapCost?: number;
  };

  // ===== SPENDING & SAVINGS =====
  spending: {
    monthlyEssentials: number;
    monthlyDiscretionary: number;
    monthlyTotal: number;
    annualTotal: number;
    housing: number;
    food: number;
    transport: number;
    utilities: number;
    insurance: number;
    debt: number;
    entertainment: number;
    other: number;
    monthlySavings: number;
    savingsRate: number;
    annualSavings: number;
  };

  // ===== COMMUTE CALCULATOR DATA =====
  commute: {
    hasCommute: boolean;
    currentMethod: {
      name: string;
      oneWayTimeMinutes: number;
      oneWayDistanceMiles: number;
      costPerTrip: number;
      daysPerWeek: number;
      annualCost: number;
      annualHours: number;
      annualMiles: number;
      annualCO2kg: number;
      timeValueAtTrueWage: number;
      totalAnnualBurden: number;
    };
    alternatives: Array<{
      method: string;
      annualCost: number;
      annualHours: number;
      potentialSavings: number;
      timeValueDifference: number;
      healthBenefit?: string;
      co2Reduction?: number;
    }>;
    bestAlternative: {
      method: string;
      totalAnnualSavings: number;
      paybackPeriodDays?: number;
    };
  };

  // ===== GEOGRAPHIC ARBITRAGE DATA =====
  geoArbitrage: {
    hasAnalyzed: boolean;
    currentLocation: {
      city: string;
      country: string;
      costOfLivingIndex: number;
      monthlyRent1Bed: number;
      monthlyLivingCost: number;
    };
    targetLocations: Array<{
      city: string;
      country: string;
      region: string;
      costOfLivingIndex: number;
      purchasingPowerMultiplier: number;
      monthlyRent1Bed: number;
      monthlyLivingCost: number;
      monthlySavings: number;
      annualSavings: number;
      visaType: string;
      visaCost: number;
      requiredMonthlyIncome: number;
      taxRate: number;
      taxSavings?: number;
      remoteWorkFriendly: boolean;
      healthcareCost: number;
      languageBarrier: 'none' | 'low' | 'medium' | 'high';
      yearsToFISaved: number;
      totalLifetimeSavings: number;
    }>;
    topRecommendation?: {
      city: string;
      reasoning: string;
      annualBenefit: number;
    };
  };

  // ===== PENSION CALCULATOR DATA =====
  pension: {
    hasWorkplacePension: boolean;
    scheme?: {
      name: string;
      type: 'Defined Contribution' | 'Defined Benefit' | 'SIPP';
      employeePercent: number;
      employeeAnnual: number;
      employerPercent: number;
      employerAnnual: number;
      taxReliefAnnual: number;
      niSavingsAnnual?: number;
      totalAnnualBenefit: number;
      currentPotValue: number;
      projectedPotAt65: {
        pessimistic: number;
        moderate: number;
        optimistic: number;
      };
      projectedAnnualIncomeAt65: {
        pessimistic: number;
        moderate: number;
        optimistic: number;
      };
      fees: {
        annualPercent: number;
        annualPoundCost: number;
        lifetimeCost: number;
      };
      lifetimeValueVsNoMatch: number;
      equivalentSalaryIncrease: number;
    };
    sippsComparison?: {
      bestProvider: string;
      feesDifference: number;
      recommendSwitch: boolean;
    };
  };

  // ===== CAR OWNERSHIP DATA =====
  car: {
    ownsCar: boolean;
    ownership?: {
      method: 'Bought Outright' | 'Finance/PCP' | 'Lease' | 'None';
      vehicleType?: string;
      purchasePrice?: number;
      currentValue?: number;
      annualFuel: number;
      annualInsurance: number;
      annualTax: number;
      annualMOT: number;
      annualServicing: number;
      annualParking: number;
      annualDepreciation: number;
      annualFinancePayments?: number;
      totalAnnualCost: number;
      annualMileage: number;
      costPerMile: number;
      financeRemaining?: number;
      interestRate?: number;
      monthlyPayment?: number;
      workHoursToAfford: number;
      workDaysToAfford: number;
    };
    alternatives?: {
      publicTransport: { annualCost: number; savings: number; feasible: boolean };
      carClub: { annualCost: number; savings: number; breakEvenMileage: number };
      cycling: { annualCost: number; savings: number; healthBenefit: string };
    };
    recommendation?: {
      action: string;
      annualSavings: number;
      fiYearsSaved: number;
    };
  };

  // ===== STUDENT LOANS DATA =====
  studentLoans: {
    hasLoans: boolean;
    loans?: {
      plan1?: { currentBalance: number; monthlyRepayment: number; projectedPayoffYear: number; totalInterestPaid: number; willBeWrittenOff: boolean };
      plan2?: { currentBalance: number; monthlyRepayment: number; projectedPayoffYear: number; totalInterestPaid: number; willBeWrittenOff: boolean };
      postgrad?: { currentBalance: number; monthlyRepayment: number; projectedPayoffYear: number; totalInterestPaid: number; willBeWrittenOff: boolean };
      totalMonthlyRepayment: number;
      totalAnnualRepayment: number;
      combinedMarginalRate: number;
      recommendOverpayment: boolean;
      overpaymentReasoning?: string;
    };
  };

  // ===== WFH VS OFFICE DATA =====
  workLocation: {
    pattern: string;
    daysWFH: number;
    daysOffice: number;
    costs: {
      commuteCostOffice: number;
      lunchCostOffice: number;
      coffeeCostOffice: number;
      clothingCostOffice: number;
      socialCostOffice: number;
      totalOfficeCost: number;
      heatingElectricCostWFH: number;
      lunchCostWFH: number;
      coffeeShopCostWFH: number;
      equipmentCostWFH: number;
      totalWFHCost: number;
      netAnnualSavings: number;
      timeSavedHours: number;
      timeSavedValue: number;
      exerciseLost?: number;
      hmrcTaxRelief: number;
    };
    optimalSplit?: {
      daysWFH: number;
      daysOffice: number;
      reasoning: string;
      additionalSavings: number;
    };
  };

  // ===== WORK INTENSITY / STRESS DATA =====
  workStress: {
    hasAnalyzed: boolean;
    scores?: {
      deadlinePressure: number;
      meetingLoad: number;
      multitasking: number;
      autonomy: number;
      micromanagement: number;
      compositeIntensityScore: number;
      sleepQuality: number;
      anxietyLevel: number;
      workLifeBalance: number;
      physicalSymptoms: number;
      mentalFatigue: number;
      compositeStressScore: number;
      burnoutRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    };
    hiddenCosts?: {
      unpaidOvertimeValue: number;
      healthCosts: number;
      copingSpending: number;
      productivityLoss: number;
      totalAnnualCost: number;
    };
    adjustedWage?: {
      stressAdjustedHourlyWage: number;
      effectiveSalary: number;
      comparison: {
        currentRole: string;
        similarSalaryLowStressRoles: string[];
        recommendedSwitch: boolean;
      };
    };
  };

  // ===== FIRE PROGRESS & PROJECTIONS =====
  fireJourney: {
    currentAge: number;
    currentNetWorth: number;
    currentSavings: number;
    currentInvestments: number;
    targetAnnualSpending: number;
    targetFINumber: number;
    targetFIAge: number;
    currentProgressPercent: number;
    savingsRatePercent: number;
    monthsOfExpensesCovered: number;
    passiveIncomeMonthly: number;
    projections: {
      coastFI: { reached: boolean; yearsToReach?: number; coastFINumber: number };
      leanFI: { yearsToReach: number; targetNumber: number };
      standardFI: { yearsToReach: number; targetNumber: number };
      fatFI: { yearsToReach: number; targetNumber: number };
    };
    milestones: {
      first10k: boolean;
      first50k: boolean;
      first100k: boolean;
      halfwayToFI: boolean;
      coastFI: boolean;
    };
    scenarios: {
      optimistic: { assumedReturn: number; yearsToFI: number };
      realistic: { assumedReturn: number; yearsToFI: number };
      pessimistic: { assumedReturn: number; yearsToFI: number };
    };
  };

  // ===== CARER'S ALLOWANCE (if applicable) =====
  carersAllowance?: {
    eligible: boolean;
    weeklyAmount?: number;
    annualAmount?: number;
    niCreditsValue?: number;
    impactOnOtherBenefits?: {
      universalCredit?: number;
      esa?: number;
      netBenefit: number;
    };
    recommendation?: string;
  };
}

// ============================================================================
// DATA EXTRACTION HELPERS
// ============================================================================

function extractIncomeData(primaryScenario: any): ComprehensiveUserData['income'] {
  const inputs = primaryScenario?.data?.inputs || {};
  const results = primaryScenario?.data?.results || {};
  const taxBreakdown = results.taxBreakdown || {};
  const timeBreakdown = results.timeBreakdown || {};

  const grossSalary = inputs.salary || 0;
  const netSalary = taxBreakdown.netSalary || results.annualNetIncome || 0;
  const pensionPercent = inputs.pensionPercent || inputs.pensionContribution || 0;
  const pensionAmount = grossSalary * (pensionPercent / 100);
  const contractHours = inputs.contractHours || inputs.weeklyHours || 37.5;
  const totalHours = timeBreakdown.weeklyTotalHours || results.totalWeeklyHours || contractHours;

  return {
    grossAnnualSalary: grossSalary,
    netAnnualSalary: netSalary,
    monthlyTakeHome: netSalary / 12,
    incomeTax: taxBreakdown.incomeTax || 0,
    nationalInsurance: taxBreakdown.nationalInsurance || 0,
    studentLoanRepayments: {
      total: taxBreakdown.studentLoan || 0,
    },
    pensionContributions: {
      employee: pensionAmount,
      employer: 0,
      total: pensionAmount,
    },
    effectiveTaxRate: taxBreakdown.effectiveTaxRate || 0,
    marginalTaxRate: taxBreakdown.effectiveMarginalRate || 0,
    contractedHoursPerWeek: contractHours,
    actualHoursPerWeek: totalHours,
    unpaidOvertimeHours: totalHours - contractHours,
    statedHourlyWage: results.assumedHourlyRate || 0,
    trueHourlyWage: results.trueHourlyRate || 0,
    hourlyWageDifference: (results.assumedHourlyRate || 0) - (results.trueHourlyRate || 0),
    hiddenAnnualCost: results.hiddenCosts || results.annualWorkCosts || 0,
    inTaxTrap: grossSalary >= 100000 && grossSalary <= 125140,
    taxTrapCost: grossSalary >= 100000 && grossSalary <= 125140
      ? Math.min(grossSalary - 100000, 25140) * 0.6
      : undefined,
  };
}

function extractSpendingData(primaryScenario: any): ComprehensiveUserData['spending'] {
  const inputs = primaryScenario?.data?.inputs || {};
  const results = primaryScenario?.data?.results || {};

  const monthlyCommute = inputs.commuteCost || 0;
  const monthlyWorkExpenses = inputs.workExpenses || 0;
  const monthlyWorkClothes = inputs.workClothes || 0;
  const netSalary = results.taxBreakdown?.netSalary || results.annualNetIncome || 0;
  const monthlyNet = netSalary / 12;
  const monthlyTotal = monthlyCommute + monthlyWorkExpenses + monthlyWorkClothes;
  const monthlySavings = Math.max(0, monthlyNet - monthlyTotal);
  const savingsRate = monthlyNet > 0 ? (monthlySavings / monthlyNet) * 100 : 0;

  return {
    monthlyEssentials: monthlyTotal,
    monthlyDiscretionary: 0,
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
    housing: 0,
    food: 0,
    transport: monthlyCommute * 12,
    utilities: 0,
    insurance: 0,
    debt: 0,
    entertainment: 0,
    other: (monthlyWorkExpenses + monthlyWorkClothes) * 12,
    monthlySavings,
    savingsRate,
    annualSavings: monthlySavings * 12,
  };
}

function extractCommuteData(commuteScenario: any): ComprehensiveUserData['commute'] {
  if (!commuteScenario) {
    return {
      hasCommute: false,
      currentMethod: {
        name: 'Unknown', oneWayTimeMinutes: 0, oneWayDistanceMiles: 0,
        costPerTrip: 0, daysPerWeek: 0, annualCost: 0, annualHours: 0,
        annualMiles: 0, annualCO2kg: 0, timeValueAtTrueWage: 0, totalAnnualBurden: 0,
      },
      alternatives: [],
      bestAlternative: { method: 'N/A', totalAnnualSavings: 0 },
    };
  }

  const inputs = commuteScenario.data?.inputs || {};
  const results = commuteScenario.data?.results || {};

  return {
    hasCommute: true,
    currentMethod: {
      name: inputs.currentMethod || results.currentMethod || 'Unknown',
      oneWayTimeMinutes: inputs.oneWayTime || inputs.commuteMinutes || 0,
      oneWayDistanceMiles: inputs.oneWayDistance || 0,
      costPerTrip: inputs.costPerTrip || 0,
      daysPerWeek: inputs.daysPerWeek || 5,
      annualCost: results.annualCost || results.currentAnnualCost || 0,
      annualHours: results.annualHours || results.currentAnnualHours || 0,
      annualMiles: results.annualMiles || 0,
      annualCO2kg: results.annualCO2 || results.annualCO2kg || 0,
      timeValueAtTrueWage: results.timeValue || results.timeValueAtTrueWage || 0,
      totalAnnualBurden: results.totalBurden || results.totalAnnualBurden || 0,
    },
    alternatives: results.alternatives || [],
    bestAlternative: results.bestAlternative || { method: 'N/A', totalAnnualSavings: 0 },
  };
}

function extractGeoData(geoScenario: any): ComprehensiveUserData['geoArbitrage'] {
  if (!geoScenario) {
    return {
      hasAnalyzed: false,
      currentLocation: { city: 'UK', country: 'UK', costOfLivingIndex: 100, monthlyRent1Bed: 0, monthlyLivingCost: 0 },
      targetLocations: [],
    };
  }

  const inputs = geoScenario.data?.inputs || {};
  const results = geoScenario.data?.results || {};

  return {
    hasAnalyzed: true,
    currentLocation: {
      city: inputs.currentCity || results.currentCity || 'UK',
      country: 'UK',
      costOfLivingIndex: 100,
      monthlyRent1Bed: inputs.currentRent || 0,
      monthlyLivingCost: inputs.currentLivingCost || 0,
    },
    targetLocations: results.targetLocations || results.locations || [],
    topRecommendation: results.topRecommendation || results.bestLocation || undefined,
  };
}

function extractPensionData(pensionScenario: any): ComprehensiveUserData['pension'] {
  if (!pensionScenario) {
    return { hasWorkplacePension: false };
  }

  const inputs = pensionScenario.data?.inputs || {};
  const results = pensionScenario.data?.results || {};

  return {
    hasWorkplacePension: true,
    scheme: {
      name: inputs.schemeName || 'Workplace Pension',
      type: inputs.schemeType || 'Defined Contribution',
      employeePercent: inputs.employeePercent || 0,
      employeeAnnual: results.employeeAnnual || 0,
      employerPercent: inputs.employerPercent || 0,
      employerAnnual: results.employerAnnual || 0,
      taxReliefAnnual: results.taxRelief || results.taxReliefAnnual || 0,
      niSavingsAnnual: results.niSavings || 0,
      totalAnnualBenefit: results.totalBenefit || results.totalAnnualBenefit || 0,
      currentPotValue: inputs.currentPot || inputs.currentPotValue || 0,
      projectedPotAt65: results.projectedPot || { pessimistic: 0, moderate: 0, optimistic: 0 },
      projectedAnnualIncomeAt65: results.projectedIncome || { pessimistic: 0, moderate: 0, optimistic: 0 },
      fees: results.fees || { annualPercent: 0, annualPoundCost: 0, lifetimeCost: 0 },
      lifetimeValueVsNoMatch: results.lifetimeValue || 0,
      equivalentSalaryIncrease: results.equivalentSalaryIncrease || 0,
    },
    sippsComparison: results.sippsComparison || undefined,
  };
}

function extractCarData(carScenario: any): ComprehensiveUserData['car'] {
  if (!carScenario) {
    return { ownsCar: false };
  }

  const inputs = carScenario.data?.inputs || {};
  const results = carScenario.data?.results || {};

  return {
    ownsCar: true,
    ownership: {
      method: inputs.ownershipMethod || 'Bought Outright',
      vehicleType: inputs.vehicleType || undefined,
      purchasePrice: inputs.purchasePrice || 0,
      currentValue: inputs.currentValue || 0,
      annualFuel: results.annualFuel || inputs.annualFuel || 0,
      annualInsurance: results.annualInsurance || inputs.annualInsurance || 0,
      annualTax: results.annualTax || inputs.annualTax || 0,
      annualMOT: results.annualMOT || inputs.annualMOT || 0,
      annualServicing: results.annualServicing || inputs.annualServicing || 0,
      annualParking: results.annualParking || inputs.annualParking || 0,
      annualDepreciation: results.annualDepreciation || 0,
      annualFinancePayments: results.annualFinancePayments || 0,
      totalAnnualCost: results.totalAnnualCost || 0,
      annualMileage: inputs.annualMileage || 0,
      costPerMile: results.costPerMile || 0,
      financeRemaining: inputs.financeRemaining || 0,
      interestRate: inputs.interestRate || 0,
      monthlyPayment: inputs.monthlyPayment || 0,
      workHoursToAfford: results.workHoursToAfford || 0,
      workDaysToAfford: results.workDaysToAfford || 0,
    },
    alternatives: results.alternatives || undefined,
    recommendation: results.recommendation || undefined,
  };
}

function extractStudentLoanData(studentLoanScenario: any): ComprehensiveUserData['studentLoans'] {
  if (!studentLoanScenario) {
    return { hasLoans: false };
  }

  const inputs = studentLoanScenario.data?.inputs || {};
  const results = studentLoanScenario.data?.results || {};

  return {
    hasLoans: true,
    loans: {
      plan1: results.plan1 || undefined,
      plan2: results.plan2 || undefined,
      postgrad: results.postgrad || undefined,
      totalMonthlyRepayment: results.totalMonthlyRepayment || 0,
      totalAnnualRepayment: results.totalAnnualRepayment || 0,
      combinedMarginalRate: results.combinedMarginalRate || 0,
      recommendOverpayment: results.recommendOverpayment || false,
      overpaymentReasoning: results.overpaymentReasoning || undefined,
    },
  };
}

function extractWFHData(wfhScenario: any): ComprehensiveUserData['workLocation'] {
  if (!wfhScenario) {
    return {
      pattern: '5 days office',
      daysWFH: 0,
      daysOffice: 5,
      costs: {
        commuteCostOffice: 0, lunchCostOffice: 0, coffeeCostOffice: 0,
        clothingCostOffice: 0, socialCostOffice: 0, totalOfficeCost: 0,
        heatingElectricCostWFH: 0, lunchCostWFH: 0, coffeeShopCostWFH: 0,
        equipmentCostWFH: 0, totalWFHCost: 0, netAnnualSavings: 0,
        timeSavedHours: 0, timeSavedValue: 0, hmrcTaxRelief: 0,
      },
    };
  }

  const inputs = wfhScenario.data?.inputs || {};
  const results = wfhScenario.data?.results || {};

  return {
    pattern: inputs.pattern || results.pattern || 'Hybrid',
    daysWFH: inputs.daysWFH || results.daysWFH || 0,
    daysOffice: inputs.daysOffice || results.daysOffice || 5,
    costs: {
      commuteCostOffice: results.commuteCostOffice || 0,
      lunchCostOffice: results.lunchCostOffice || 0,
      coffeeCostOffice: results.coffeeCostOffice || 0,
      clothingCostOffice: results.clothingCostOffice || 0,
      socialCostOffice: results.socialCostOffice || 0,
      totalOfficeCost: results.totalOfficeCost || 0,
      heatingElectricCostWFH: results.heatingElectricCostWFH || 0,
      lunchCostWFH: results.lunchCostWFH || 0,
      coffeeShopCostWFH: results.coffeeShopCostWFH || 0,
      equipmentCostWFH: results.equipmentCostWFH || 0,
      totalWFHCost: results.totalWFHCost || 0,
      netAnnualSavings: results.netAnnualSavings || 0,
      timeSavedHours: results.timeSavedHours || 0,
      timeSavedValue: results.timeSavedValue || 0,
      exerciseLost: results.exerciseLost || undefined,
      hmrcTaxRelief: results.hmrcTaxRelief || 0,
    },
    optimalSplit: results.optimalSplit || undefined,
  };
}

function extractIntensityData(intensityScenario: any): ComprehensiveUserData['workStress'] {
  if (!intensityScenario) {
    return { hasAnalyzed: false };
  }

  const inputs = intensityScenario.data?.inputs || {};
  const results = intensityScenario.data?.results || {};

  return {
    hasAnalyzed: true,
    scores: {
      deadlinePressure: inputs.deadlinePressure || results.deadlinePressure || 5,
      meetingLoad: inputs.meetingLoad || results.meetingLoad || 5,
      multitasking: inputs.multitasking || results.multitasking || 5,
      autonomy: inputs.autonomy || results.autonomy || 5,
      micromanagement: inputs.micromanagement || results.micromanagement || 5,
      compositeIntensityScore: results.compositeIntensityScore || results.intensityScore || 5,
      sleepQuality: inputs.sleepQuality || results.sleepQuality || 5,
      anxietyLevel: inputs.anxietyLevel || results.anxietyLevel || 5,
      workLifeBalance: inputs.workLifeBalance || results.workLifeBalance || 5,
      physicalSymptoms: inputs.physicalSymptoms || results.physicalSymptoms || 5,
      mentalFatigue: inputs.mentalFatigue || results.mentalFatigue || 5,
      compositeStressScore: results.compositeStressScore || results.stressScore || 5,
      burnoutRisk: results.burnoutRisk || 'Medium',
    },
    hiddenCosts: results.hiddenCosts ? {
      unpaidOvertimeValue: results.hiddenCosts.unpaidOvertimeValue || 0,
      healthCosts: results.hiddenCosts.healthCosts || 0,
      copingSpending: results.hiddenCosts.copingSpending || 0,
      productivityLoss: results.hiddenCosts.productivityLoss || 0,
      totalAnnualCost: results.hiddenCosts.totalAnnualCost || 0,
    } : undefined,
    adjustedWage: results.adjustedWage || undefined,
  };
}

function extractFIREData(primaryScenario: any): ComprehensiveUserData['fireJourney'] {
  const inputs = primaryScenario?.data?.inputs || {};
  const results = primaryScenario?.data?.results || {};
  const fireResults = results.fireProgress || {};

  const age = inputs.currentAge || inputs.age || 30;
  const netSalary = results.taxBreakdown?.netSalary || results.annualNetIncome || 0;
  const annualSpending = netSalary * 0.7; // Estimate 70% spending
  const fireNumber = fireResults.fireNumber || annualSpending * 25;
  const currentSavings = inputs.currentSavings || inputs.netWorth || 0;
  const progressPercent = fireNumber > 0 ? (currentSavings / fireNumber) * 100 : 0;
  const savingsRate = netSalary > 0 ? ((netSalary - annualSpending) / netSalary) * 100 : 0;

  return {
    currentAge: age,
    currentNetWorth: currentSavings,
    currentSavings: currentSavings,
    currentInvestments: inputs.currentInvestments || 0,
    targetAnnualSpending: annualSpending,
    targetFINumber: fireNumber,
    targetFIAge: inputs.targetFIAge || 55,
    currentProgressPercent: Math.min(progressPercent, 100),
    savingsRatePercent: savingsRate,
    monthsOfExpensesCovered: annualSpending > 0 ? (currentSavings / (annualSpending / 12)) : 0,
    passiveIncomeMonthly: (currentSavings * 0.04) / 12,
    projections: {
      coastFI: { reached: progressPercent >= 50, yearsToReach: progressPercent >= 50 ? 0 : 10, coastFINumber: fireNumber * 0.5 },
      leanFI: { yearsToReach: fireResults.leanFIYears || 15, targetNumber: fireNumber * 0.6 },
      standardFI: { yearsToReach: fireResults.yearsToFI || fireResults.standardFIYears || 20, targetNumber: fireNumber },
      fatFI: { yearsToReach: fireResults.fatFIYears || 25, targetNumber: fireNumber * 1.5 },
    },
    milestones: {
      first10k: currentSavings >= 10000,
      first50k: currentSavings >= 50000,
      first100k: currentSavings >= 100000,
      halfwayToFI: progressPercent >= 50,
      coastFI: progressPercent >= 50,
    },
    scenarios: {
      optimistic: { assumedReturn: 10, yearsToFI: fireResults.optimisticYears || 15 },
      realistic: { assumedReturn: 7, yearsToFI: fireResults.yearsToFI || 20 },
      pessimistic: { assumedReturn: 4, yearsToFI: fireResults.pessimisticYears || 30 },
    },
  };
}

function extractCarersData(carersScenario: any): ComprehensiveUserData['carersAllowance'] | undefined {
  if (!carersScenario) return undefined;

  const results = carersScenario.data?.results || {};

  return {
    eligible: results.eligible || false,
    weeklyAmount: results.weeklyAmount || 0,
    annualAmount: results.annualAmount || 0,
    niCreditsValue: results.niCreditsValue || 0,
    impactOnOtherBenefits: results.impactOnOtherBenefits || undefined,
    recommendation: results.recommendation || undefined,
  };
}

// ============================================================================
// DATA COLLECTION FUNCTION
// ============================================================================

/**
 * Collect comprehensive user data from all calculator scenarios
 */
export function collectComprehensiveUserData(
  primaryScenario: any,
  comparisonScenarios: any[],
  userProfile?: any
): ComprehensiveUserData {
  // Group comparison scenarios by calculator type
  const scenariosByType: Record<string, any> = {};
  comparisonScenarios.forEach((s: any) => {
    const type = s.calculator_type || 'unknown';
    if (!scenariosByType[type]) {
      scenariosByType[type] = s;
    }
  });

  const primaryInputs = primaryScenario?.data?.inputs || {};

  return {
    profile: {
      userId: primaryScenario?.user_id || '',
      name: userProfile?.email?.split('@')[0] || 'User',
      email: userProfile?.email || '',
      age: primaryInputs.currentAge || primaryInputs.age || 30,
      location: primaryInputs.location || primaryInputs.region || 'UK',
      industry: primaryInputs.industry || 'Unknown',
      jobTitle: primaryInputs.jobTitle || 'Unknown',
    },
    income: extractIncomeData(primaryScenario),
    spending: extractSpendingData(primaryScenario),
    commute: extractCommuteData(scenariosByType['commute']),
    geoArbitrage: extractGeoData(scenariosByType['geo']),
    pension: extractPensionData(scenariosByType['pension']),
    car: extractCarData(scenariosByType['car']),
    studentLoans: extractStudentLoanData(scenariosByType['student-loans']),
    workLocation: extractWFHData(scenariosByType['wfh']),
    workStress: extractIntensityData(scenariosByType['intensity']),
    fireJourney: extractFIREData(primaryScenario),
    carersAllowance: extractCarersData(scenariosByType['carers']),
  };
}

// ============================================================================
// MULTI-STAGE AI ANALYSIS PROMPTS
// ============================================================================

/**
 * STAGE 1: THE UNCOMFORTABLE TRUTH
 * Model: Claude Sonnet 4 (fast - raw data synthesis with attitude)
 * Purpose: Hit them with the reality of their numbers. No sugarcoating.
 */
function getStage1Prompt(userData: ComprehensiveUserData) {
  return {
    system: `You are a contrarian UK financial analyst who writes like a viral Reddit post. You're tired of watching people follow conventional wisdom that's destroying their finances.

YOUR VOICE:
- Direct, punchy, slightly uncomfortable
- Use their EXACT numbers to shock them
- Short sentences. Line breaks. Let the numbers breathe.
- "You think you earn X. You actually earn Y. Here's why."
- Reference real studies and data to back up every claim
- Convert everything to hours of life and years to FIRE

STUDIES TO REFERENCE (use where relevant):
- Harvard Business Review: Workers with 50+ hour weeks spend 23% more on convenience services
- Journal of Consumer Psychology: People under financial stress spend 79% more on impulse purchases
- Money and Mental Health Policy Institute: Financial capability drops 20-30% under stress
- UK ONS: Stressed workers take 6.9 sick days vs 2.3 for non-stressed
- Iceland 4-day week trials: Same/better productivity with fewer hours
- UK 2022 4-day week pilot: 92% of companies kept it, revenue up 1.4%

Generate a brutally honest financial profile. For each section, write 2-3 SHORT paragraphs with specific numbers, not long walls of text. Use line breaks between key numbers.

Output as JSON:
{
  "uncomfortableTruth": "The opening gut-punch. 2-3 sentences with their most shocking number. E.g. 'You think you earn X per hour. After we factor in everything, you actually earn Y. That means you're working Z hours for free every week.'",
  "incomeReality": "3-4 short paragraphs about their TRUE income situation. Include the gap between stated and true hourly wage. If they're in the 100k tax trap, call it out hard. Reference what they're ACTUALLY keeping per hour worked.",
  "hiddenCostsBombshell": "The costs they're not seeing. Commute + stress spending + convenience spending + work expenses. Add them up. Convert to hours of life. 'Your commute isn't costing you X. It's costing you X + Y + Z = TOTAL. That's N hours of your life per year.'",
  "spendingPatterns": "Their savings rate vs UK average. What their spending says about their stress levels (reference Journal of Consumer Psychology). Red flags in their data.",
  "timeTradeoffs": "How much of their life they're trading. Convert to weeks per year, then years over a career. 'You're spending X hours/year commuting. That's Y full weeks. Over your career, that's Z years of your life sitting in traffic/on a train.'",
  "fireProgress": "Where they are on the FIRE journey. Be honest about trajectory. Compare to UK averages. 'At your current rate, you'll reach FI at age X. The average UK worker retires at 66. You're on track to beat that by Y years - or not.'",
  "overallRating": "Strong/Good/Fair/Concerning",
  "oneLineSummary": "One punchy line that captures their whole situation. E.g. 'You're earning well but bleeding money through hidden costs that are adding 8 years to your FIRE timeline.'"
}

CRITICAL: This is educational analysis only, not financial advice. But make the analysis HIT HARD. Every number should make them think.`,
    prompt: `Analyze this UK professional's complete financial data. Find the uncomfortable truths they're not seeing.

${JSON.stringify(userData, null, 2)}

Write like you're explaining to a friend why their financial strategy is wrong - with the receipts to prove it.`,
  };
}

/**
 * STAGE 2: CONTROVERSIAL RECOMMENDATIONS
 * Model: Claude Opus 4 (deep reasoning - finds the non-obvious plays)
 * Purpose: Challenge conventional wisdom with THEIR specific data
 */
function getStage2Prompt(userData: ComprehensiveUserData) {
  return {
    system: `You are a contrarian FIRE analyst who finds opportunities that conventional financial advice MISSES. You write like a viral Reddit post - direct, data-heavy, slightly provocative.

YOUR JOB: Find the controversial-but-mathematically-correct moves for THIS specific person.

EXAMPLES OF YOUR VOICE:
- "Standard advice says max your pension. But for YOU, that's locking away money you can't touch for 13 years. Here's what happens if you drop to employer match only..."
- "Everyone says your commute costs X/day. But they're not counting the stress spending, the convenience food, the Amazon purchases at 11pm because you're too tired to cook. Real cost: 3x what you think."
- "You're earning 102k. Congratulations, you're in the stupidest tax bracket in the UK. Your marginal rate is 60%. Not a typo."

STUDIES YOU MUST REFERENCE (weave naturally into reasoning):
- Harvard Business Review: 50+ hour workers spend 23% more on convenience
- Journal of Consumer Psychology: Stress increases impulse spending by 79%
- Money and Mental Health Policy Institute: Financial capability drops 20-30% under stress
- UK ONS: Stressed workers = 6.9 sick days vs 2.3
- Iceland/Belgium/UK 4-day week trials: 92% kept it, same/better productivity
- Numbeo cost of living data for geographic arbitrage
- UK pension access age rising to 57, state pension at 67

FOR EACH RECOMMENDATION:
1. State what conventional wisdom says
2. Show why it's WRONG for this specific person (with their numbers)
3. Reference a study that backs your contrarian view
4. Calculate the compound effect over 10-30 years
5. Convert to years saved on FIRE timeline
6. Be direct: "But you won't do this because..."

Return JSON:
{
  "quickWins": [
    {
      "action": "Specific contrarian action",
      "annualSavings": number,
      "effortLevel": "Low/Medium/High",
      "conventionalWisdom": "What everyone else would tell them to do",
      "whyTheyreWrong": "Why that advice is wrong FOR THIS PERSON specifically, with their numbers",
      "study": "Which study backs this up",
      "compoundEffect": "What this is worth over 10/20/30 years at 7%",
      "yearsToFISaved": number,
      "reasoning": "The full contrarian argument with specific numbers from their data",
      "implementationSteps": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "strategicMoves": [
    {
      "action": "Major life change - the uncomfortable recommendation",
      "annualImpact": number,
      "yearsToFISaved": number,
      "conventionalWisdom": "What safe advice says",
      "contrarianCase": "Why the math says otherwise, with specific calculations using their data",
      "study": "Supporting research",
      "risks": ["Honest risk 1", "Honest risk 2"],
      "reasoning": "Full breakdown: 'If you did X instead of Y, here's what happens to your numbers...'",
      "prerequisites": ["What needs to happen first"],
      "whyYouWont": "The psychological reason they'll resist this (be honest but not mean)"
    }
  ],
  "contrarianInsights": [
    {
      "title": "Provocative title e.g. 'Why Your Good Pension Might Be Trapping You'",
      "conventional": "The advice everyone gives",
      "contrarian": "What the data actually shows for this person",
      "mathProof": "The specific calculation that proves the contrarian case, using their numbers",
      "study": "Supporting study or data",
      "reasoning": "Full 3-4 sentence argument"
    }
  ],
  "crossSystemOpportunities": [
    {
      "insight": "Non-obvious connection. E.g. 'Your commute is costing you 3x what you think when you add stress spending'",
      "calculators": ["commute", "wfh", "intensity"],
      "totalHiddenCost": number,
      "potentialImpact": "Total savings if addressed",
      "breakdown": "Show the math: direct cost + indirect cost + opportunity cost",
      "reasoning": "Why nobody calculates this but they should"
    }
  ],
  "topRecommendation": {
    "action": "THE one thing that would change everything for this person",
    "reasoning": "Why this single move beats everything else combined, with compound math",
    "currentPath": "Where they end up doing nothing: FIRE at age X",
    "newPath": "Where they end up with this change: FIRE at age Y",
    "yearsSaved": number,
    "difficulty": "Honest: how hard is this really?",
    "whyItMatters": "Connect to their life - what do those saved years mean?"
  }
}

CRITICAL RULES:
- Every number must come from THEIR data, not made up
- Every recommendation must have a study or data source backing it
- Calculate compound effects at 7% real return
- Always convert to years-to-FI impact
- Be provocative but ACCURATE - the math must check out
- This is educational analysis, not financial advice`,
    prompt: `Find the controversial-but-mathematically-correct opportunities in this person's financial data.

Challenge every piece of conventional wisdom. Show hidden costs they're not seeing. Connect dots between calculators that nobody else would connect.

${JSON.stringify(userData, null, 2)}

Write like you're making a case on Reddit that will get 10,000 upvotes because the math is undeniable even though the advice is uncomfortable.`,
  };
}

/**
 * STAGE 3: THE RISKS NOBODY TALKS ABOUT
 * Model: Claude Opus 4 (scenario planning with attitude)
 * Purpose: Show them the risks they're ignoring - backed by data
 */
function getStage3Prompt(userData: ComprehensiveUserData) {
  return {
    system: `You are a risk analyst who doesn't give comfortable answers. You find the risks people are actively ignoring and force them to look at the numbers.

YOUR VOICE:
- "You have no emergency fund. Let me show you what happens when - not if - something goes wrong."
- "Your burnout risk is High. Studies show this leads to X. Here's what that costs you."
- "You're 100% dependent on one income source in an industry that's being disrupted by AI."

STUDIES TO REFERENCE:
- UK ONS: Average redundancy package = 6 months salary. Median job search: 4 months.
- Resolution Foundation: 60% of UK renters have less than 1 month savings
- Mental Health Foundation: Burnout costs UK economy £28bn/year
- FCA: Average UK investor loses 2-4% to poor timing in market crashes
- Money and Mental Health: 1 in 4 people with mental health issues have problem debt

FOR EACH RISK:
1. Name it directly (not "potential income disruption" - say "you could lose your job")
2. Use their specific numbers to show the impact
3. Reference a study showing how common this is
4. Calculate exactly how many months they could survive
5. Show the FIRE timeline delay
6. Give specific, actionable mitigation - not "be careful"

Return JSON:
{
  "highPriorityRisks": [
    {
      "risk": "Direct, specific risk statement using their data",
      "likelihood": "High/Medium/Low",
      "impactOnFI": "Specific delay: '+X years to FIRE' or 'Derails plan entirely'",
      "whyYoureIgnoringThis": "The psychological reason they haven't addressed this",
      "study": "Supporting data/research",
      "earlyWarningSignals": ["Specific signal 1", "Signal 2"],
      "mitigation": {
        "immediate": "Do this THIS WEEK",
        "longTerm": "Build this over 6 months",
        "cost": "What it costs vs what it saves"
      }
    }
  ],
  "mediumPriorityRisks": [],
  "scenarioAnalysis": {
    "jobLoss": {
      "runwayMonths": number,
      "survivalBudget": "What they'd need to cut to per month",
      "actions": ["Immediate action 1", "Action 2"],
      "recoveryPlan": "Realistic timeline and steps",
      "study": "UK average job search duration and success rates"
    },
    "marketCrash": {
      "portfolioImpact": "Specific: 'A 40% crash would reduce your pot from X to Y'",
      "fiDelayYears": number,
      "historicalContext": "Reference 2008/2020 crashes and recovery times",
      "mitigation": "Specific allocation advice for their situation"
    },
    "healthCrisis": {
      "financialBuffer": "Specific: 'You could cover X months of expenses'",
      "burnoutRisk": "Based on their stress data",
      "insuranceGaps": ["Specific gap 1"],
      "annualCostOfStress": "Calculate using their stress score and study data",
      "recommendations": "Specific actions"
    },
    "careerPivot": {
      "affordability": "Honest: 'You could/couldn't afford a career change right now'",
      "safePayCutAmount": number,
      "minAcceptableSalary": number,
      "reasoning": "Based on their expenses and savings"
    }
  },
  "overallRiskRating": "Low/Medium/High/Critical",
  "emergencyFundStatus": {
    "currentMonths": number,
    "recommended": number,
    "gap": number,
    "gapInPounds": number,
    "priority": "Low/Medium/High/URGENT",
    "reality": "Honest assessment: 'You're one redundancy away from financial crisis' or 'You're well protected'"
  }
}

CRITICAL: Be honest, not alarmist. Use their numbers. Reference real studies. This is educational analysis, not advice.`,
    prompt: `Conduct a risk assessment that doesn't pull punches. Use their actual data to show what happens in realistic scenarios.

${JSON.stringify(userData, null, 2)}

Don't give them comfortable platitudes. Show them the math of what happens when things go wrong.`,
  };
}

/**
 * STAGE 4: THE CONTROVERSIAL ACTION PLAN
 * Model: Claude Opus 4 (strategic planning - uses Stage 2+3 results)
 * Purpose: A roadmap that makes them uncomfortable but can't argue with the math
 */
function getStage4Prompt(userData: ComprehensiveUserData, stage2Results: any, stage3Results: any) {
  return {
    system: `You are creating a FIRE roadmap that reads like a viral Reddit post. Not a boring action plan - a provocative, data-backed strategy that challenges everything they think they know.

YOUR VOICE:
- "None of this is 'standard advice.' All of it is backed by your specific numbers."
- "You're 13 years from freedom or 26 years. The difference is whether you believe the conventional wisdom or the math."
- Show the COMPOUNDING timeline: Current path vs Quick Wins vs Full Plan

THE REPORT SHOULD END WITH:
A comparison showing:
- Current path: FIRE at age X
- If you fixed [biggest issue]: FIRE at age Y
- If you did [top 3 changes]: FIRE at age Z
- If you did EVERYTHING: FIRE at age W
- "You're X years from freedom or Y years. The difference is [key insight]."

Return JSON:
{
  "roadmap": {
    "month1to3": {
      "focus": "Provocative theme, e.g. 'Stop Bleeding Money'",
      "actions": [
        {
          "action": "Specific contrarian action",
          "why": "Why this matters NOW - with compound math",
          "expectedSavings": number,
          "effort": "Honest time estimate",
          "conventionalAlternative": "What most people would do instead (and why it's wrong)",
          "dependencies": [],
          "resources": []
        }
      ],
      "metrics": {
        "targetSavingsRate": number,
        "targetNetWorth": number,
        "progressToFI": "X%"
      }
    },
    "month4to6": {
      "focus": "Theme e.g. 'The Uncomfortable Conversations'",
      "actions": [],
      "metrics": {}
    },
    "month7to12": {
      "focus": "Theme e.g. 'The Big Structural Changes'",
      "actions": [],
      "metrics": {}
    },
    "year2to5": {
      "focus": "Theme e.g. 'Compounding Takes Over'",
      "actions": [],
      "metrics": {}
    }
  },
  "milestones": [
    {
      "date": "Specific date",
      "milestone": "What they'll achieve - make it emotional",
      "netWorthTarget": number,
      "celebration": "How to mark it (be specific and fun)",
      "whatThisMeans": "What this milestone means for their freedom"
    }
  ],
  "fiTimeline": {
    "currentTrajectory": "FIRE at age X (Y years from now)",
    "withQuickWins": "FIRE at age X (Y years from now)",
    "withFullRoadmap": "FIRE at age X (Y years from now)",
    "yearsSaved": number,
    "whatYearsSavedMeans": "What you could do with X extra years of freedom"
  },
  "criticalPath": [
    "The 3-5 actions that matter most, in order, with why"
  ],
  "personalizedMotivation": "2-3 paragraphs connecting their specific numbers to WHY this matters. Not generic motivation. Use their age, their salary, their FIRE date. Make it personal. End with: 'The math doesn't care about conventional wisdom. It only cares about what you actually do.'",
  "finalComparison": {
    "doNothing": { "fireAge": number, "yearsFromNow": number },
    "quickWinsOnly": { "fireAge": number, "yearsFromNow": number },
    "topThreeChanges": { "fireAge": number, "yearsFromNow": number, "changes": ["change1", "change2", "change3"] },
    "fullPlan": { "fireAge": number, "yearsFromNow": number },
    "closingLine": "One punchy closing line about the gap between current path and optimal path"
  }
}

CRITICAL: Every number must trace back to their data. This is educational analysis, not financial advice. But make it compelling enough that they can't ignore it.`,
    prompt: `Create a controversial but mathematically bulletproof FIRE roadmap.

USER DATA:
${JSON.stringify(userData, null, 2)}

OPTIMIZATION OPPORTUNITIES FOUND:
${JSON.stringify(stage2Results, null, 2)}

RISKS IDENTIFIED:
${JSON.stringify(stage3Results, null, 2)}

End with a timeline comparison that makes the cost of inaction painfully clear. The closing line should be something they can't stop thinking about.`,
  };
}

// ============================================================================
// MULTI-STAGE AI ANALYSIS IMPLEMENTATION
// ============================================================================

export interface AIAnalysisResult {
  profileSynthesis: any;
  optimizationAnalysis: any;
  riskAssessment: any;
  roadmap: any;
}

/**
 * Generate comprehensive AI analysis using multi-stage pipeline
 */
export async function generateAIAnalysis(userData: ComprehensiveUserData): Promise<AIAnalysisResult> {
  console.log('🤖 Stage 1: Financial Profile Synthesis (Sonnet - fast)...');
  const stage1Prompt = getStage1Prompt(userData);
  const profileSynthesis = await generateJSON(
    stage1Prompt.prompt,
    stage1Prompt.system,
    'FAST'
  );
  console.log('✅ Profile synthesis complete');

  // Run Stage 2 and Stage 3 in parallel (both use DEEP model)
  console.log('🧠 Stage 2: Deep Optimization Analysis (Opus - deep reasoning)...');
  console.log('⚠️ Stage 3: Risk Assessment (Opus - scenario planning)...');

  const stage2Prompt = getStage2Prompt(userData);
  const stage3Prompt = getStage3Prompt(userData);

  const [optimizationAnalysis, riskAssessment] = await Promise.all([
    generateJSON(stage2Prompt.prompt, stage2Prompt.system, 'DEEP'),
    generateJSON(stage3Prompt.prompt, stage3Prompt.system, 'DEEP'),
  ]);

  console.log('✅ Optimization analysis complete');
  console.log('✅ Risk assessment complete');

  // Stage 4 depends on results from Stage 2 and Stage 3
  console.log('🗺️ Stage 4: Personalized Roadmap (Opus - strategic planning)...');
  const stage4Prompt = getStage4Prompt(userData, optimizationAnalysis, riskAssessment);
  const roadmap = await generateJSON(
    stage4Prompt.prompt,
    stage4Prompt.system,
    'DEEP'
  );
  console.log('✅ Roadmap complete');

  return {
    profileSynthesis,
    optimizationAnalysis,
    riskAssessment,
    roadmap,
  };
}

// ============================================================================
// LEGACY SUPPORT - Keep old generateReportData for backward compatibility
// ============================================================================

// Helper to format all calculator data for AI analysis (legacy)
function formatAllCalculatorData(data: any): string {
  const primary = data.primary?.data || {};
  const comparisons = data.comparisons || [];

  let output = `
=== PRIMARY SCENARIO (Main Calculator) ===
Inputs: ${JSON.stringify(primary.inputs || {}, null, 2)}
Results: ${JSON.stringify(primary.results || {}, null, 2)}
`;

  const byType: Record<string, any[]> = {};
  comparisons.forEach((c: any) => {
    const type = c.calculator_type || 'unknown';
    if (!byType[type]) byType[type] = [];
    byType[type].push(c);
  });

  Object.entries(byType).forEach(([type, scenarios]) => {
    output += `\n=== ${type.toUpperCase()} CALCULATOR DATA ===\n`;
    scenarios.forEach((s: any, i: number) => {
      output += `[${s.name || `Scenario ${i + 1}`}]\n`;
      output += `Inputs: ${JSON.stringify(s.data?.inputs || {}, null, 2)}\n`;
      output += `Results: ${JSON.stringify(s.data?.results || {}, null, 2)}\n`;
    });
  });

  return output;
}

export const REPORT_PROMPTS = {
  executiveSummary: (data: any) => ({
    system: `You are a brutally honest UK financial analyst. Your job is to synthesize ALL available calculator data and deliver sharp, statistically-backed insights.

PERSONALITY:
- Be DIRECT and OPINIONATED
- Use SPECIFIC NUMBERS
- Make STATISTICAL COMPARISONS
- CONNECT THE DOTS between calculators
- BE MEMORABLE

CRITICAL: Analysis and calculations only - not financial advice. Include disclaimers.

Format your response as JSON:
{
  "headline": "Punchy one-liner with specific numbers (max 15 words)",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3", "Finding 4"],
  "financialGrade": "A-F grade with one-sentence justification",
  "immediateOpportunity": "Single biggest opportunity with specific impact",
  "riskFlag": "Concerning pattern with numbers, or null",
  "costBreakdown": {
    "commute": number,
    "taxes": number,
    "pension": number,
    "workExpenses": number,
    "studentLoans": number,
    "carCosts": number,
    "other": number
  },
  "timeBreakdown": {
    "contractedWork": number,
    "unpaidOvertime": number,
    "commuting": number,
    "workPrep": number
  }
}`,
    prompt: `Analyze this UK professional's COMPLETE financial picture from ALL calculators:

${formatAllCalculatorData(data)}

BE SPECIFIC WITH NUMBERS. Every finding should have a specific amount or percentage.`
  }),

  taxAnalysis: (data: any) => ({
    system: `You are a UK tax analyst providing DETAILED statistical breakdowns. Be specific with numbers and percentages.

CRITICAL: Calculations only - not tax advice. Always remind users to consult HMRC.

Format response as JSON:
{
  "totalTaxBurden": "string",
  "effectiveTaxRate": number,
  "marginalRate": number,
  "breakdown": {
    "incomeTax": { "amount": number, "percentage": number, "notes": "string" },
    "nationalInsurance": { "amount": number, "percentage": number, "notes": "string" },
    "studentLoan": { "amount": number, "percentage": number, "notes": "string" },
    "pensionRelief": { "amount": number, "notes": "string" }
  },
  "taxEfficiencyScore": number,
  "taxEfficiencyExplanation": "string",
  "hourlyTaxImpact": "string",
  "potentialOptimizations": [
    { "action": "string", "annualSaving": number, "explanation": "string" }
  ],
  "comparisonToUKAverage": "string",
  "disclaimer": "string"
}`,
    prompt: `Calculate comprehensive tax breakdown using ALL available data:

${formatAllCalculatorData(data)}

Use ${new Date().getFullYear()}/${new Date().getFullYear() + 1} UK tax bands.`
  }),

  scenarioComparison: (data: any) => ({
    system: `You are a senior financial analyst performing STATISTICAL comparative analysis.

CRITICAL: Analysis only - not advice. Include disclaimers.

Format as JSON:
{
  "overallVerdict": "string",
  "scenarioRankings": [],
  "tradeoffMatrix": [],
  "compoundingAnalysis": {
    "fiveYear": { "bestCase": number, "worstCase": number, "difference": number },
    "tenYear": { "bestCase": number, "worstCase": number, "difference": number },
    "twentyYear": { "bestCase": number, "worstCase": number, "difference": number }
  },
  "hiddenConsiderations": [],
  "controversialTake": "string",
  "disclaimer": "string"
}`,
    prompt: `Perform STATISTICAL comparative analysis of ALL scenarios:

${formatAllCalculatorData(data)}`
  }),

  fireProjection: (data: any) => ({
    system: `You are a FIRE analyst who uses ALL available calculator data to build comprehensive projections.

UK-SPECIFIC FACTORS:
- ISA: £20k/year tax-free
- SIPP/Pension: Access at 55 (rising to 57)
- State Pension: ~£10,600/year from 66/67

CRITICAL: Projections only - not predictions or advice.

Format as JSON:
{
  "fireNumber": number,
  "conservativeFireNumber": number,
  "yearsToFire": number,
  "fireDate": "string",
  "fireAge": number,
  "currentSavingsRate": number,
  "requiredSavingsRate": number,
  "projectionTable": [],
  "accelerators": [],
  "sensitivityAnalysis": {
    "optimistic7pct": { "yearsToFire": number, "fireDate": "string" },
    "expected5pct": { "yearsToFire": number, "fireDate": "string" },
    "conservative3pct": { "yearsToFire": number, "fireDate": "string" }
  },
  "criticalMilestones": [],
  "probabilityOfSuccess": number,
  "biggestRisk": "string",
  "assumptions": [],
  "disclaimer": "string"
}`,
    prompt: `Build FIRE projection using ALL calculator data:

${formatAllCalculatorData(data)}

Be SPECIFIC with dates and numbers.`
  }),

  actionPlan: (data: any) => ({
    system: `You are creating a QUANTIFIED action plan with specific amounts for each action.

Format as JSON:
{
  "quickWins": [],
  "mediumTermActions": [],
  "strategicMoves": [],
  "totalPotentialGain": number,
  "priorityRanking": [],
  "resourceLinks": [],
  "disclaimer": "string"
}`,
    prompt: `Create QUANTIFIED action plan using ALL calculator data:

${formatAllCalculatorData(data)}

Show your math. Every amount should be traceable to their data.`
  }),
};

/**
 * Legacy: Generate report data using the old 5-prompt system
 */
export async function generateReportData(data: any): Promise<{
  executiveSummary: any;
  taxAnalysis: any;
  scenarioComparison: any | null;
  fireProjection: any;
  actionPlan: any;
}> {
  const hasComparisons = data.comparisons && data.comparisons.length > 0;

  const [executiveSummary, taxAnalysis, actionPlan] = await Promise.all([
    generateJSON(
      REPORT_PROMPTS.executiveSummary(data).prompt,
      REPORT_PROMPTS.executiveSummary(data).system,
      'FAST'
    ),
    generateJSON(
      REPORT_PROMPTS.taxAnalysis(data).prompt,
      REPORT_PROMPTS.taxAnalysis(data).system,
      'FAST'
    ),
    generateJSON(
      REPORT_PROMPTS.actionPlan(data).prompt,
      REPORT_PROMPTS.actionPlan(data).system,
      'FAST'
    ),
  ]);

  const [scenarioComparison, fireProjection] = await Promise.all([
    hasComparisons
      ? generateJSON(
          REPORT_PROMPTS.scenarioComparison(data).prompt,
          REPORT_PROMPTS.scenarioComparison(data).system,
          'DEEP'
        )
      : Promise.resolve(null),
    generateJSON(
      REPORT_PROMPTS.fireProjection(data).prompt,
      REPORT_PROMPTS.fireProjection(data).system,
      'DEEP'
    ),
  ]);

  return {
    executiveSummary,
    taxAnalysis,
    scenarioComparison,
    fireProjection,
    actionPlan,
  };
}
