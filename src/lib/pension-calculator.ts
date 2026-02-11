// Pension Matching Impact Calculator
// Shows the true value of employer pension contributions

export interface PensionInputs {
  grossSalary: number;
  employeeContributionPercent: number;
  employerMatchPercent: number;
  employerMatchCap: number; // Max % employer will match
  currentAge: number;
  retirementAge: number;
  currentPensionPot: number;
  expectedReturn: number; // Annual return %
  salaryGrowthRate: number; // Annual salary growth %
  includeStatePension: boolean;
  salaryExchange: boolean; // Salary sacrifice scheme
}

export interface PensionProjection {
  year: number;
  age: number;
  salary: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  potValueStart: number;
  investmentGrowth: number;
  potValueEnd: number;
  taxSaved: number;
  niSaved: number;
}

export interface PensionResults {
  projections: PensionProjection[];
  summary: {
    totalEmployeeContributions: number;
    totalEmployerContributions: number;
    totalTaxSaved: number;
    totalNiSaved: number;
    projectedPotAtRetirement: number;
    monthlyPensionIncome: number; // Estimated using 4% rule
    employerMatchValue: number; // Total value of employer match over career
    effectiveReturn: number; // Return including employer match
    statePensionAnnual: number;
    totalAnnualRetirementIncome: number;
  };
  scenarios: {
    noMatch: number; // Pot without employer match
    withMatch: number; // Pot with employer match
    difference: number; // Extra money from employer match
    matchAsPercentOfPot: number;
  };
  insights: string[];
}

// UK Tax bands 2024/25
const TAX_BANDS = {
  personalAllowance: 12570,
  basicRateLimit: 50270,
  higherRateLimit: 125140,
  basicRate: 0.20,
  higherRate: 0.40,
  additionalRate: 0.45,
};

// National Insurance rates 2024/25
const NI_RATES = {
  primaryThreshold: 12570,
  upperEarningsLimit: 50270,
  mainRate: 0.08,
  higherRate: 0.02,
};

// State pension 2024/25
const STATE_PENSION = {
  fullWeeklyAmount: 221.20,
  fullAnnualAmount: 221.20 * 52,
  qualifyingYears: 35,
  stateRetirementAge: 67,
};

function calculateTaxOnAmount(amount: number): number {
  if (amount <= TAX_BANDS.personalAllowance) return 0;

  let tax = 0;
  const taxable = amount - TAX_BANDS.personalAllowance;

  if (taxable <= TAX_BANDS.basicRateLimit - TAX_BANDS.personalAllowance) {
    tax = taxable * TAX_BANDS.basicRate;
  } else if (amount <= TAX_BANDS.higherRateLimit) {
    const basicPortion = TAX_BANDS.basicRateLimit - TAX_BANDS.personalAllowance;
    const higherPortion = taxable - basicPortion;
    tax = (basicPortion * TAX_BANDS.basicRate) + (higherPortion * TAX_BANDS.higherRate);
  } else {
    const basicPortion = TAX_BANDS.basicRateLimit - TAX_BANDS.personalAllowance;
    const higherPortion = TAX_BANDS.higherRateLimit - TAX_BANDS.basicRateLimit;
    const additionalPortion = amount - TAX_BANDS.higherRateLimit;
    tax = (basicPortion * TAX_BANDS.basicRate) +
      (higherPortion * TAX_BANDS.higherRate) +
      (additionalPortion * TAX_BANDS.additionalRate);
  }

  return tax;
}

function calculateNIOnAmount(amount: number): number {
  if (amount <= NI_RATES.primaryThreshold) return 0;

  let ni = 0;
  if (amount <= NI_RATES.upperEarningsLimit) {
    ni = (amount - NI_RATES.primaryThreshold) * NI_RATES.mainRate;
  } else {
    ni = (NI_RATES.upperEarningsLimit - NI_RATES.primaryThreshold) * NI_RATES.mainRate +
      (amount - NI_RATES.upperEarningsLimit) * NI_RATES.higherRate;
  }

  return ni;
}

function getMarginalTaxRate(salary: number): number {
  if (salary <= TAX_BANDS.personalAllowance) return 0;
  if (salary <= TAX_BANDS.basicRateLimit) return TAX_BANDS.basicRate;
  if (salary <= TAX_BANDS.higherRateLimit) return TAX_BANDS.higherRate;
  return TAX_BANDS.additionalRate;
}

function getMarginalNIRate(salary: number): number {
  if (salary <= NI_RATES.primaryThreshold) return 0;
  if (salary <= NI_RATES.upperEarningsLimit) return NI_RATES.mainRate;
  return NI_RATES.higherRate;
}

export function calculatePension(inputs: PensionInputs): PensionResults {
  const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
  const projections: PensionProjection[] = [];

  let currentPot = inputs.currentPensionPot;
  let currentSalary = inputs.grossSalary;
  let totalEmployeeContributions = 0;
  let totalEmployerContributions = 0;
  let totalTaxSaved = 0;
  let totalNiSaved = 0;

  // Also track pot without employer match for comparison
  let potWithoutMatch = inputs.currentPensionPot;

  for (let year = 0; year < yearsToRetirement; year++) {
    const age = inputs.currentAge + year;

    // Calculate contributions
    const employeeContributionPercent = Math.min(inputs.employeeContributionPercent, 100);
    const effectiveEmployerMatch = Math.min(inputs.employeeContributionPercent, inputs.employerMatchCap);
    const employerContributionPercent = Math.min(inputs.employerMatchPercent, effectiveEmployerMatch);

    const employeeContribution = currentSalary * (employeeContributionPercent / 100);
    const employerContribution = currentSalary * (employerContributionPercent / 100);
    const totalContribution = employeeContribution + employerContribution;

    // Calculate tax/NI savings
    let taxSaved = 0;
    let niSaved = 0;

    if (inputs.salaryExchange) {
      // Salary sacrifice: save both tax and NI on full contribution
      const marginalTaxRate = getMarginalTaxRate(currentSalary);
      const marginalNIRate = getMarginalNIRate(currentSalary);
      taxSaved = employeeContribution * marginalTaxRate;
      niSaved = employeeContribution * marginalNIRate;
    } else {
      // Relief at source: only tax relief, paid net
      const marginalTaxRate = getMarginalTaxRate(currentSalary);
      taxSaved = employeeContribution * marginalTaxRate;
    }

    // Calculate pot growth
    const potValueStart = currentPot;
    const investmentGrowth = (potValueStart + totalContribution / 2) * (inputs.expectedReturn / 100);
    const potValueEnd = potValueStart + totalContribution + investmentGrowth;

    // Track pot without employer match
    const employeeOnlyGrowth = (potWithoutMatch + employeeContribution / 2) * (inputs.expectedReturn / 100);
    potWithoutMatch = potWithoutMatch + employeeContribution + employeeOnlyGrowth;

    projections.push({
      year: year + 1,
      age,
      salary: Math.round(currentSalary),
      employeeContribution: Math.round(employeeContribution),
      employerContribution: Math.round(employerContribution),
      totalContribution: Math.round(totalContribution),
      potValueStart: Math.round(potValueStart),
      investmentGrowth: Math.round(investmentGrowth),
      potValueEnd: Math.round(potValueEnd),
      taxSaved: Math.round(taxSaved),
      niSaved: Math.round(niSaved),
    });

    // Update running totals
    totalEmployeeContributions += employeeContribution;
    totalEmployerContributions += employerContribution;
    totalTaxSaved += taxSaved;
    totalNiSaved += niSaved;
    currentPot = potValueEnd;

    // Apply salary growth for next year
    currentSalary *= (1 + inputs.salaryGrowthRate / 100);
  }

  // Calculate retirement income (4% safe withdrawal rate)
  const monthlyPensionIncome = (currentPot * 0.04) / 12;

  // State pension (simplified - assumes full entitlement)
  const statePensionAnnual = inputs.includeStatePension && inputs.retirementAge >= STATE_PENSION.stateRetirementAge
    ? STATE_PENSION.fullAnnualAmount
    : 0;

  const totalAnnualRetirementIncome = (currentPot * 0.04) + statePensionAnnual;

  // Calculate effective return (what you get back for what you put in)
  const totalPutIn = totalEmployeeContributions - totalTaxSaved - totalNiSaved;
  const totalValue = currentPot;
  const effectiveReturnMultiple = totalValue / totalPutIn;

  // Generate insights
  const insights: string[] = [];

  if (inputs.employeeContributionPercent < inputs.employerMatchCap) {
    const missedMatch = inputs.employerMatchCap - inputs.employeeContributionPercent;
    insights.push(`💡 You're missing out on ${missedMatch}% free employer match! Consider increasing your contribution.`);
  }

  if (!inputs.salaryExchange) {
    const potentialNISavings = totalEmployeeContributions * 0.08;
    insights.push(`💰 Switching to salary sacrifice could save ~£${Math.round(potentialNISavings).toLocaleString()} in NI over your career.`);
  }

  if (inputs.expectedReturn < 5) {
    insights.push(`📈 Your expected return of ${inputs.expectedReturn}% is conservative. Historically, diversified portfolios average 7-8%.`);
  }

  const employerMatchPercent = (totalEmployerContributions / currentPot) * 100;
  if (employerMatchPercent > 20) {
    insights.push(`🎁 Your employer contributions make up ${Math.round(employerMatchPercent)}% of your projected pot!`);
  }

  if (inputs.currentAge > 40 && inputs.employeeContributionPercent < 15) {
    insights.push(`⏰ Starting pension savings after 40? Consider contributing 15%+ to catch up.`);
  }

  return {
    projections,
    summary: {
      totalEmployeeContributions: Math.round(totalEmployeeContributions),
      totalEmployerContributions: Math.round(totalEmployerContributions),
      totalTaxSaved: Math.round(totalTaxSaved),
      totalNiSaved: Math.round(totalNiSaved),
      projectedPotAtRetirement: Math.round(currentPot),
      monthlyPensionIncome: Math.round(monthlyPensionIncome),
      employerMatchValue: Math.round(currentPot - potWithoutMatch),
      effectiveReturn: Math.round(effectiveReturnMultiple * 100) / 100,
      statePensionAnnual: Math.round(statePensionAnnual),
      totalAnnualRetirementIncome: Math.round(totalAnnualRetirementIncome),
    },
    scenarios: {
      noMatch: Math.round(potWithoutMatch),
      withMatch: Math.round(currentPot),
      difference: Math.round(currentPot - potWithoutMatch),
      matchAsPercentOfPot: Math.round(((currentPot - potWithoutMatch) / currentPot) * 100),
    },
    insights,
  };
}

// Common UK pension schemes
export const PENSION_SCHEMES = [
  {
    id: 'auto_enrolment_min',
    name: 'Auto-Enrolment (Minimum)',
    employeePercent: 5,
    employerPercent: 3,
    employerCap: 3,
    description: 'Legal minimum: 5% employee, 3% employer',
  },
  {
    id: 'matched_5',
    name: 'Matched 5%',
    employeePercent: 5,
    employerPercent: 5,
    employerCap: 5,
    description: 'Common scheme: employer matches up to 5%',
  },
  {
    id: 'matched_6',
    name: 'Matched 6%',
    employeePercent: 6,
    employerPercent: 6,
    employerCap: 6,
    description: 'Good scheme: employer matches up to 6%',
  },
  {
    id: 'double_match_5',
    name: 'Double Match (up to 5%)',
    employeePercent: 5,
    employerPercent: 10,
    employerCap: 5,
    description: 'Excellent: employer contributes 2x your amount up to 5%',
  },
  {
    id: 'generous_10',
    name: 'Generous 10%',
    employeePercent: 5,
    employerPercent: 10,
    employerCap: 10,
    description: 'Very generous: 10% employer regardless of your contribution',
  },
  {
    id: 'public_sector',
    name: 'Public Sector (NHS/Civil Service)',
    employeePercent: 7,
    employerPercent: 14,
    employerCap: 14,
    description: 'Defined benefit style: ~14% employer contribution',
  },
  {
    id: 'custom',
    name: 'Custom',
    employeePercent: 0,
    employerPercent: 0,
    employerCap: 0,
    description: 'Enter your own contribution rates',
  },
];

// SIPP vs Workplace Pension comparison data
export interface PensionType {
  id: string;
  name: string;
  icon: string;
  description: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  typicalFees: string;
  investmentControl: 'full' | 'limited' | 'none';
  employerContributions: boolean;
}

export const PENSION_TYPES: PensionType[] = [
  {
    id: 'workplace',
    name: 'Workplace Pension',
    icon: '🏢',
    description: 'Pension arranged by your employer, often with matching contributions',
    pros: [
      'Free employer contributions (often matching)',
      'Automatic payroll deductions',
      'Salary sacrifice saves NI (if offered)',
      'No effort to set up',
      'Employer handles admin',
    ],
    cons: [
      'Limited investment choices (often 10-20 funds)',
      'May have higher fees (0.5-1%+ typical)',
      'Less control over your money',
      'Can\'t always choose provider',
      'Default funds often too conservative',
    ],
    bestFor: 'Everyone employed - always take the employer match first!',
    typicalFees: '0.5% - 1.0% annually',
    investmentControl: 'limited',
    employerContributions: true,
  },
  {
    id: 'sipp',
    name: 'SIPP (Self-Invested Personal Pension)',
    icon: '📊',
    description: 'Self-directed pension with full control over investments',
    pros: [
      'Full investment freedom (stocks, ETFs, funds, bonds)',
      'Lower fees possible (0.1-0.4% with cheap platforms)',
      'Choose your own platform (Vanguard, Fidelity, AJ Bell, etc.)',
      'Can consolidate old pensions',
      'Tax relief at source (20%) + claim higher rate if applicable',
      'Access to global index funds',
    ],
    cons: [
      'No employer contributions',
      'Requires self-discipline to contribute',
      'More complex - you manage investments',
      'Need to claim higher/additional rate tax relief manually',
      'Risk of poor investment choices if inexperienced',
    ],
    bestFor: 'Self-employed, freelancers, or as a top-up after maxing employer match',
    typicalFees: '0.15% - 0.45% annually (platform + fund fees)',
    investmentControl: 'full',
    employerContributions: false,
  },
  {
    id: 'stakeholder',
    name: 'Stakeholder Pension',
    icon: '📋',
    description: 'Simple, low-cost personal pension with capped charges',
    pros: [
      'Charges capped at 1.5% (reducing to 1% after 10 years)',
      'Low minimum contributions (often £20/month)',
      'Simple and easy to understand',
      'Portable between jobs',
      'Government-regulated standards',
    ],
    cons: [
      'No employer contributions',
      'Limited investment options',
      'Returns may be lower than SIPP',
      'Still higher fees than cheap SIPPs',
    ],
    bestFor: 'Those wanting simplicity without employer pension access',
    typicalFees: '1.0% - 1.5% annually (capped)',
    investmentControl: 'limited',
    employerContributions: false,
  },
  {
    id: 'personal',
    name: 'Personal Pension',
    icon: '👤',
    description: 'Traditional personal pension from insurance companies',
    pros: [
      'Wide availability',
      'Some offer guarantees or smoothing',
      'May include life insurance',
      'Established providers',
    ],
    cons: [
      'Often high fees (1%+)',
      'Exit charges may apply',
      'Limited investment choice',
      'Legacy products can be poor value',
      'No employer contributions',
    ],
    bestFor: 'Those who want guarantees or already have one from years ago',
    typicalFees: '0.75% - 1.5%+ annually',
    investmentControl: 'limited',
    employerContributions: false,
  },
];

// Popular SIPP providers for comparison
export interface SIPPProvider {
  name: string;
  platformFee: string;
  dealingFees: string;
  minInvestment: string;
  bestFor: string;
  link: string;
}

export const SIPP_PROVIDERS: SIPPProvider[] = [
  {
    name: 'Vanguard',
    platformFee: '0.15% (capped at £375/yr)',
    dealingFees: 'Free for Vanguard funds',
    minInvestment: '£500 lump sum or £100/month',
    bestFor: 'Low-cost index fund investing',
    link: 'https://www.vanguardinvestor.co.uk',
  },
  {
    name: 'Fidelity',
    platformFee: '0.35% (capped at £45/yr for funds)',
    dealingFees: 'Free for funds, £10 for shares',
    minInvestment: '£25/month',
    bestFor: 'Mix of funds and shares',
    link: 'https://www.fidelity.co.uk',
  },
  {
    name: 'AJ Bell',
    platformFee: '0.25% (capped at £120/yr for shares)',
    dealingFees: '£1.50 for funds, £5 for shares',
    minInvestment: '£500 lump sum or £25/month',
    bestFor: 'Active traders and share investors',
    link: 'https://www.ajbell.co.uk',
  },
  {
    name: 'Hargreaves Lansdown',
    platformFee: '0.45% (tiered, max £200/yr for shares)',
    dealingFees: '£11.95 per trade',
    minInvestment: '£100 lump sum or £25/month',
    bestFor: 'Research tools and fund choice',
    link: 'https://www.hl.co.uk',
  },
  {
    name: 'Interactive Investor',
    platformFee: '£12.99/month flat fee',
    dealingFees: '1 free trade/month, then £5.99',
    minInvestment: 'None',
    bestFor: 'Larger pots (flat fee beats % above ~£50k)',
    link: 'https://www.ii.co.uk',
  },
  {
    name: 'InvestEngine',
    platformFee: '0% for DIY, 0.25% for managed',
    dealingFees: 'Free',
    minInvestment: '£100',
    bestFor: 'ETF-only portfolios, lowest cost',
    link: 'https://www.investengine.com',
  },
];

// Calculate fee impact over time
export function calculateFeeImpact(
  startingPot: number,
  annualContribution: number,
  years: number,
  returnRate: number,
  feeRate: number
): number {
  let pot = startingPot;
  const netReturn = returnRate - feeRate;

  for (let i = 0; i < years; i++) {
    pot = pot * (1 + netReturn / 100) + annualContribution;
  }

  return Math.round(pot);
}

export function compareFees(
  startingPot: number,
  annualContribution: number,
  years: number,
  returnRate: number
): { lowFee: number; highFee: number; difference: number; percentLost: number } {
  const lowFee = calculateFeeImpact(startingPot, annualContribution, years, returnRate, 0.2);
  const highFee = calculateFeeImpact(startingPot, annualContribution, years, returnRate, 1.0);
  const difference = lowFee - highFee;
  const percentLost = Math.round((difference / lowFee) * 100);

  return { lowFee, highFee, difference, percentLost };
}
