// Carer's Allowance Calculator
// Calculates eligibility and impact on true hourly wage for unpaid carers

export interface CarersInputs {
  hoursCaringPerWeek: number;
  currentEmploymentStatus: 'employed' | 'self_employed' | 'unemployed' | 'student';
  grossWeeklyEarnings: number; // From employment (if any)
  otherBenefits: {
    statePension: boolean;
    contributoryESA: boolean;
    incapacityBenefit: boolean;
    widowsBenefit: boolean;
    severeDisablementAllowance: boolean;
  };
  caredPersonReceives: {
    pip: boolean; // Personal Independence Payment (daily living)
    dla: boolean; // Disability Living Allowance (middle/higher care)
    attendanceAllowance: boolean;
    armedForcesBenefit: boolean;
  };
  ageOver16: boolean;
  ageUnderStatePension: boolean;
  inFullTimeEducation: boolean; // 21+ hours supervised study
  livesInUK: boolean;
}

export interface CarersResults {
  eligible: boolean;
  eligibilityReasons: string[];
  weeklyAllowance: number;
  annualAllowance: number;
  effectiveHourlyRate: number; // Allowance divided by caring hours
  niCredits: boolean;
  overlappingBenefits: string[];
  additionalBenefits: {
    name: string;
    description: string;
    potentialValue: string;
  }[];
  trueHourlyWageImpact: {
    withoutAllowance: number;
    withAllowance: number;
    difference: number;
  };
  insights: string[];
}

// 2024/25 rates
const CARERS_ALLOWANCE = {
  weeklyRate: 81.90,
  earningsLimit: 151, // Net earnings limit per week (after deductions)
  minimumCaringHours: 35,
};

// Other benefit rates that may overlap
const OVERLAPPING_BENEFITS = {
  statePension: { name: 'State Pension', weeklyMax: 221.20 },
  contributoryESA: { name: 'Contributory ESA', weeklyMax: 90.50 },
  incapacityBenefit: { name: 'Incapacity Benefit', weeklyMax: 114.70 },
  widowsBenefit: { name: "Widow's Benefit", weeklyMax: 148.40 },
  severeDisablementAllowance: { name: 'Severe Disablement Allowance', weeklyMax: 92.60 },
};

export function calculateCarersAllowance(inputs: CarersInputs): CarersResults {
  const eligibilityReasons: string[] = [];
  const overlappingBenefits: string[] = [];
  const insights: string[] = [];

  // Check basic eligibility criteria
  let eligible = true;

  // Must be 16+ (we assume yes for simplicity)
  if (!inputs.ageOver16) {
    eligible = false;
    eligibilityReasons.push('You must be 16 or over to claim Carer\'s Allowance');
  }

  // Must be under State Pension age (or reached it before April 2022)
  if (!inputs.ageUnderStatePension) {
    eligibilityReasons.push('You may not be eligible if you\'ve reached State Pension age - check GOV.UK for specific rules');
  }

  // Must care for at least 35 hours per week
  if (inputs.hoursCaringPerWeek < CARERS_ALLOWANCE.minimumCaringHours) {
    eligible = false;
    eligibilityReasons.push(`You need to care for at least ${CARERS_ALLOWANCE.minimumCaringHours} hours per week (you entered ${inputs.hoursCaringPerWeek})`);
  } else {
    eligibilityReasons.push(`You care for ${inputs.hoursCaringPerWeek} hours per week (minimum 35 hours met)`);
  }

  // Not in full-time education (21+ hours supervised study)
  if (inputs.inFullTimeEducation) {
    eligible = false;
    eligibilityReasons.push('You cannot claim if you\'re in full-time education (21+ hours supervised study per week)');
  }

  // Must live in UK
  if (!inputs.livesInUK) {
    eligible = false;
    eligibilityReasons.push('You must live in England, Scotland, or Wales (different rules for NI)');
  }

  // Earnings limit check
  if (inputs.grossWeeklyEarnings > CARERS_ALLOWANCE.earningsLimit) {
    eligible = false;
    eligibilityReasons.push(`Your weekly earnings (£${inputs.grossWeeklyEarnings}) exceed the limit of £${CARERS_ALLOWANCE.earningsLimit}`);
    insights.push(`💡 Could you reduce your hours slightly? Earning just under £${CARERS_ALLOWANCE.earningsLimit}/week would make you eligible for £${CARERS_ALLOWANCE.weeklyRate}/week Carer's Allowance.`);
  } else if (inputs.grossWeeklyEarnings > 0) {
    eligibilityReasons.push(`Your weekly earnings (£${inputs.grossWeeklyEarnings}) are within the £${CARERS_ALLOWANCE.earningsLimit} limit`);
  }

  // Person cared for must receive qualifying benefit
  const caredPersonQualifies = inputs.caredPersonReceives.pip ||
    inputs.caredPersonReceives.dla ||
    inputs.caredPersonReceives.attendanceAllowance ||
    inputs.caredPersonReceives.armedForcesBenefit;

  if (!caredPersonQualifies) {
    eligible = false;
    eligibilityReasons.push('The person you care for must receive a qualifying disability benefit (PIP daily living, DLA middle/higher care, Attendance Allowance, or Armed Forces Independence Payment)');
  } else {
    eligibilityReasons.push('The person you care for receives a qualifying disability benefit');
  }

  // Check for overlapping benefits
  if (inputs.otherBenefits.statePension) {
    overlappingBenefits.push('State Pension - You may get an "underlying entitlement" that could increase other means-tested benefits');
  }
  if (inputs.otherBenefits.contributoryESA) {
    overlappingBenefits.push('Contributory ESA - Cannot be paid together with Carer\'s Allowance (higher amount paid)');
  }
  if (inputs.otherBenefits.incapacityBenefit) {
    overlappingBenefits.push('Incapacity Benefit - Cannot be paid together (higher amount paid)');
  }
  if (inputs.otherBenefits.widowsBenefit) {
    overlappingBenefits.push('Widow\'s Benefit - Cannot be paid together (higher amount paid)');
  }
  if (inputs.otherBenefits.severeDisablementAllowance) {
    overlappingBenefits.push('Severe Disablement Allowance - Cannot be paid together (higher amount paid)');
  }

  // Calculate allowance
  const weeklyAllowance = eligible ? CARERS_ALLOWANCE.weeklyRate : 0;
  const annualAllowance = weeklyAllowance * 52;

  // Calculate effective hourly rate for caring work
  const effectiveHourlyRate = inputs.hoursCaringPerWeek > 0
    ? weeklyAllowance / inputs.hoursCaringPerWeek
    : 0;

  // NI credits
  const niCredits = eligible || (inputs.hoursCaringPerWeek >= 20);

  // Additional benefits to consider
  const additionalBenefits: CarersResults['additionalBenefits'] = [];

  additionalBenefits.push({
    name: 'Carer\'s Credit',
    description: 'Free National Insurance credits if you care for 20+ hours/week but don\'t qualify for Carer\'s Allowance',
    potentialValue: 'Protects State Pension entitlement',
  });

  additionalBenefits.push({
    name: 'Council Tax Reduction',
    description: 'Many councils offer reductions or exemptions for carers',
    potentialValue: 'Up to 100% off Council Tax',
  });

  additionalBenefits.push({
    name: 'Carer Premium',
    description: 'Extra amount added to Universal Credit, Housing Benefit, or Pension Credit if you receive Carer\'s Allowance',
    potentialValue: '£45.60/week on Universal Credit',
  });

  additionalBenefits.push({
    name: 'NHS Flu Jab',
    description: 'Free flu vaccination for unpaid carers',
    potentialValue: 'Free (normally ~£15)',
  });

  additionalBenefits.push({
    name: 'Carer\'s Assessment',
    description: 'Right to a free assessment from your local council for support services',
    potentialValue: 'Respite care, equipment, adaptations',
  });

  if (inputs.currentEmploymentStatus === 'employed') {
    additionalBenefits.push({
      name: 'Flexible Working Rights',
      description: 'Carers have enhanced right to request flexible working arrangements',
      potentialValue: 'Work-life balance',
    });
  }

  // Calculate true hourly wage impact
  const weeklyWorkHours = inputs.currentEmploymentStatus !== 'unemployed' ? 40 : 0; // Assumed
  const totalWeeklyHours = weeklyWorkHours + inputs.hoursCaringPerWeek;
  const totalWeeklyIncome = inputs.grossWeeklyEarnings;

  const trueHourlyWithout = totalWeeklyHours > 0 ? totalWeeklyIncome / totalWeeklyHours : 0;
  const trueHourlyWith = totalWeeklyHours > 0 ? (totalWeeklyIncome + weeklyAllowance) / totalWeeklyHours : 0;

  // Generate insights
  if (eligible) {
    insights.push(`You could receive £${annualAllowance.toLocaleString()} per year in Carer's Allowance.`);
  }

  if (effectiveHourlyRate > 0 && effectiveHourlyRate < 5) {
    insights.push(`⚠️ At £${effectiveHourlyRate.toFixed(2)}/hour, Carer's Allowance is significantly below minimum wage. Consider this when planning your finances.`);
  }

  if (niCredits) {
    insights.push(`Your caring work protects your State Pension through National Insurance credits.`);
  }

  if (inputs.hoursCaringPerWeek >= 50) {
    insights.push(`💪 You're caring for ${inputs.hoursCaringPerWeek} hours/week - that's more than a full-time job. Make sure you're getting all the support available to you.`);
  }

  if (!eligible && inputs.hoursCaringPerWeek >= 20) {
    insights.push(`Even though you don't qualify for Carer's Allowance, you may be eligible for Carer's Credit to protect your State Pension.`);
  }

  const earningsGap = CARERS_ALLOWANCE.earningsLimit - inputs.grossWeeklyEarnings;
  if (earningsGap > 0 && earningsGap < 50 && inputs.grossWeeklyEarnings > 0) {
    insights.push(`📊 You have £${earningsGap.toFixed(0)}/week headroom before hitting the earnings limit.`);
  }

  return {
    eligible,
    eligibilityReasons,
    weeklyAllowance,
    annualAllowance,
    effectiveHourlyRate: Math.round(effectiveHourlyRate * 100) / 100,
    niCredits,
    overlappingBenefits,
    additionalBenefits,
    trueHourlyWageImpact: {
      withoutAllowance: Math.round(trueHourlyWithout * 100) / 100,
      withAllowance: Math.round(trueHourlyWith * 100) / 100,
      difference: Math.round((trueHourlyWith - trueHourlyWithout) * 100) / 100,
    },
    insights,
  };
}

// Helpful information about caring roles
export const CARING_ROLES = [
  {
    id: 'personal_care',
    name: 'Personal Care',
    description: 'Washing, dressing, toileting, medication',
    typicalHours: '15-30 hours/week',
  },
  {
    id: 'practical_support',
    name: 'Practical Support',
    description: 'Cooking, cleaning, shopping, finances',
    typicalHours: '10-20 hours/week',
  },
  {
    id: 'emotional_support',
    name: 'Emotional Support',
    description: 'Companionship, mental health support, supervision',
    typicalHours: '10-40 hours/week',
  },
  {
    id: 'medical_tasks',
    name: 'Medical Tasks',
    description: 'Appointments, treatments, physiotherapy',
    typicalHours: '5-15 hours/week',
  },
  {
    id: 'night_care',
    name: 'Night Care',
    description: 'Overnight supervision, getting up at night',
    typicalHours: '8-12 hours/night',
  },
];

// Common deductions that can reduce earnings for eligibility
export const ALLOWABLE_DEDUCTIONS = [
  { name: 'Income Tax', description: 'Tax deducted from your pay' },
  { name: 'National Insurance', description: 'NI contributions deducted from pay' },
  { name: 'Pension contributions', description: 'Half of your pension contributions' },
  { name: 'Childcare costs', description: '50% of childcare costs while you work' },
  { name: 'Equipment costs', description: 'Essential equipment for self-employment' },
];
