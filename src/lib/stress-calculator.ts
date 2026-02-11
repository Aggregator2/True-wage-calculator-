// Work Intensity / Stress Value Calculator
// Quantify the hidden costs of job stress and work intensity

export interface StressInputs {
  workHours: {
    contractedHours: number;
    actualHours: number;
    unpaidOvertime: number;
  };
  intensity: {
    deadlinePressure: number; // 1-10
    meetingLoad: number; // 1-10
    multitasking: number; // 1-10
    autonomy: number; // 1-10 (inverted - high is good)
    micromanagement: number; // 1-10
  };
  stress: {
    sleepQuality: number; // 1-10 (10 = good)
    anxietyLevel: number; // 1-10
    workLifeBalance: number; // 1-10 (10 = good)
    physicalSymptoms: number; // 1-10
    mentalFatigue: number; // 1-10
  };
  compensation: {
    salary: number;
    bonus: number;
    benefits: number; // Annual value
  };
  health: {
    therapyCost: number; // Annual
    medicationCost: number; // Annual
    gymMembership: number; // Annual
    comfortSpending: number; // Monthly "treat yourself" spending to cope
    sickDaysUsed: number;
  };
  career: {
    yearsInRole: number;
    burnoutRisk: 'low' | 'medium' | 'high' | 'critical';
    lookingToLeave: boolean;
  };
}

export interface StressResults {
  scores: {
    workIntensity: number; // 0-100
    stressLevel: number; // 0-100
    overallWellbeing: number; // 0-100
    burnoutRisk: 'low' | 'medium' | 'high' | 'critical';
  };
  costs: {
    unpaidOvertimeValue: number;
    healthCosts: number;
    comfortSpending: number;
    productivityLoss: number; // Estimated
    careerImpact: number; // Estimated cost of burnout
    totalHiddenCosts: number;
  };
  adjustedCompensation: {
    grossPay: number;
    minusHiddenCosts: number;
    effectiveHourlyRate: number;
    stressAdjustedRate: number; // Further adjusted for stress
  };
  comparison: {
    stressFreePremium: number; // How much more you'd need to be compensated
    equivalentLowerSalary: number; // What lower salary with less stress equals
    breakEvenStressReduction: number; // % stress reduction to match current value
  };
  insights: string[];
  recommendations: string[];
}

export function calculateStressValue(inputs: StressInputs): StressResults {
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Calculate work intensity score (0-100)
  const intensityFactors = [
    inputs.intensity.deadlinePressure,
    inputs.intensity.meetingLoad,
    inputs.intensity.multitasking,
    10 - inputs.intensity.autonomy, // Invert autonomy
    inputs.intensity.micromanagement,
  ];
  const workIntensity = Math.round((intensityFactors.reduce((a, b) => a + b, 0) / 50) * 100);

  // Calculate stress level (0-100)
  const stressFactors = [
    10 - inputs.stress.sleepQuality, // Invert sleep quality
    inputs.stress.anxietyLevel,
    10 - inputs.stress.workLifeBalance, // Invert work-life balance
    inputs.stress.physicalSymptoms,
    inputs.stress.mentalFatigue,
  ];
  const stressLevel = Math.round((stressFactors.reduce((a, b) => a + b, 0) / 50) * 100);

  // Calculate overall wellbeing (inverse of stress)
  const overallWellbeing = 100 - stressLevel;

  // Determine burnout risk
  let burnoutRisk: StressResults['scores']['burnoutRisk'];
  const combinedScore = (workIntensity + stressLevel) / 2;
  if (combinedScore < 30) burnoutRisk = 'low';
  else if (combinedScore < 50) burnoutRisk = 'medium';
  else if (combinedScore < 70) burnoutRisk = 'high';
  else burnoutRisk = 'critical';

  // Calculate costs
  const hourlyRate = inputs.compensation.salary / (inputs.workHours.contractedHours * 52);
  const unpaidOvertimeValue = inputs.workHours.unpaidOvertime * hourlyRate * 52;

  const healthCosts = inputs.health.therapyCost + inputs.health.medicationCost + inputs.health.gymMembership;
  const comfortSpending = inputs.health.comfortSpending * 12;

  // Productivity loss estimate (based on stress research)
  // High stress can reduce productivity by 20-40%
  const productivityLossPercent = stressLevel > 70 ? 0.3 : stressLevel > 50 ? 0.2 : stressLevel > 30 ? 0.1 : 0.05;
  const productivityLoss = inputs.compensation.salary * productivityLossPercent;

  // Career impact (burnout can cost 6-12 months salary in recovery/job search)
  const careerImpactMultiplier = burnoutRisk === 'critical' ? 0.5 : burnoutRisk === 'high' ? 0.25 : burnoutRisk === 'medium' ? 0.1 : 0;
  const careerImpact = inputs.compensation.salary * careerImpactMultiplier;

  const totalHiddenCosts = unpaidOvertimeValue + healthCosts + comfortSpending + productivityLoss;

  // Adjusted compensation
  const grossPay = inputs.compensation.salary + inputs.compensation.bonus + inputs.compensation.benefits;
  const minusHiddenCosts = grossPay - totalHiddenCosts;
  const actualHoursPerYear = inputs.workHours.actualHours * 52;
  const effectiveHourlyRate = actualHoursPerYear > 0 ? minusHiddenCosts / actualHoursPerYear : 0;

  // Stress-adjusted rate (penalize high stress jobs)
  const stressPenalty = 1 - (stressLevel / 200); // Max 50% penalty for maximum stress
  const stressAdjustedRate = effectiveHourlyRate * stressPenalty;

  // Comparison calculations
  // "Stress-free premium" - research suggests ~20-40% premium needed for high-stress jobs
  const stressFreePremium = stressLevel > 50 ? inputs.compensation.salary * (stressLevel / 100) * 0.4 : 0;

  // Equivalent lower salary with less stress
  const stressMultiplier = 1 + (stressLevel / 100);
  const equivalentLowerSalary = Math.round(inputs.compensation.salary / stressMultiplier);

  // Break-even stress reduction
  const breakEvenStressReduction = Math.min(100, Math.round((totalHiddenCosts / grossPay) * 100));

  // Generate insights
  if (inputs.workHours.unpaidOvertime > 5) {
    insights.push(`⏰ You work ${inputs.workHours.unpaidOvertime} hours of unpaid overtime weekly, worth £${Math.round(unpaidOvertimeValue).toLocaleString()}/year.`);
  }

  if (stressLevel > 60) {
    insights.push(`🔴 Your stress level (${stressLevel}/100) is in the danger zone. This significantly impacts your health and productivity.`);
  }

  if (workIntensity > 70 && inputs.intensity.autonomy < 4) {
    insights.push(`😤 High intensity + low autonomy is the most harmful combination for workplace stress.`);
  }

  if (comfortSpending > 200 * 12) {
    insights.push(`💸 You're spending £${comfortSpending.toLocaleString()}/year on "treats" to cope with work stress.`);
  }

  if (inputs.health.sickDaysUsed > 10) {
    insights.push(`🤒 ${inputs.health.sickDaysUsed} sick days suggests work stress may be affecting your physical health.`);
  }

  if (inputs.career.lookingToLeave) {
    insights.push(`🚪 You're already looking to leave - the stress has likely exceeded what any pay can compensate.`);
  }

  // Generate recommendations
  if (burnoutRisk === 'critical' || burnoutRisk === 'high') {
    recommendations.push('Consider speaking to a doctor or therapist about your stress levels.');
    recommendations.push('Start documenting your hours and workload for future reference.');
  }

  if (inputs.workHours.unpaidOvertime > 10) {
    recommendations.push('Track your actual hours for a month - you may be significantly underpaid.');
    recommendations.push('Consider whether this role is sustainable long-term.');
  }

  if (inputs.intensity.micromanagement > 7) {
    recommendations.push('High micromanagement is often a sign of poor management - this rarely improves.');
  }

  if (inputs.stress.sleepQuality < 5) {
    recommendations.push('Poor sleep compounds all other stress factors. Prioritize sleep hygiene.');
  }

  if (stressFreePremium > 10000) {
    recommendations.push(`You'd need ~£${Math.round(stressFreePremium).toLocaleString()} more annually to fairly compensate for this stress level.`);
  }

  if (equivalentLowerSalary < inputs.compensation.salary * 0.75) {
    recommendations.push('A less stressful job at 75% of your salary might give you equivalent wellbeing.');
  }

  return {
    scores: {
      workIntensity,
      stressLevel,
      overallWellbeing,
      burnoutRisk,
    },
    costs: {
      unpaidOvertimeValue: Math.round(unpaidOvertimeValue),
      healthCosts: Math.round(healthCosts),
      comfortSpending: Math.round(comfortSpending),
      productivityLoss: Math.round(productivityLoss),
      careerImpact: Math.round(careerImpact),
      totalHiddenCosts: Math.round(totalHiddenCosts),
    },
    adjustedCompensation: {
      grossPay: Math.round(grossPay),
      minusHiddenCosts: Math.round(minusHiddenCosts),
      effectiveHourlyRate: Math.round(effectiveHourlyRate * 100) / 100,
      stressAdjustedRate: Math.round(stressAdjustedRate * 100) / 100,
    },
    comparison: {
      stressFreePremium: Math.round(stressFreePremium),
      equivalentLowerSalary,
      breakEvenStressReduction,
    },
    insights,
    recommendations,
  };
}

// Common job stress profiles
export const STRESS_PROFILES = [
  {
    id: 'startup',
    name: 'Startup',
    icon: '🚀',
    defaults: {
      intensity: { deadlinePressure: 8, meetingLoad: 6, multitasking: 8, autonomy: 7, micromanagement: 3 },
      workHours: { unpaidOvertime: 15 },
    },
  },
  {
    id: 'corporate',
    name: 'Big Corp',
    icon: '🏢',
    defaults: {
      intensity: { deadlinePressure: 5, meetingLoad: 8, multitasking: 6, autonomy: 4, micromanagement: 6 },
      workHours: { unpaidOvertime: 5 },
    },
  },
  {
    id: 'agency',
    name: 'Agency',
    icon: '🎨',
    defaults: {
      intensity: { deadlinePressure: 9, meetingLoad: 7, multitasking: 9, autonomy: 5, micromanagement: 5 },
      workHours: { unpaidOvertime: 10 },
    },
  },
  {
    id: 'nhs',
    name: 'NHS/Public',
    icon: '🏥',
    defaults: {
      intensity: { deadlinePressure: 7, meetingLoad: 5, multitasking: 8, autonomy: 3, micromanagement: 4 },
      workHours: { unpaidOvertime: 8 },
    },
  },
  {
    id: 'remote_chill',
    name: 'Chill Remote',
    icon: '🏠',
    defaults: {
      intensity: { deadlinePressure: 4, meetingLoad: 4, multitasking: 4, autonomy: 8, micromanagement: 2 },
      workHours: { unpaidOvertime: 2 },
    },
  },
  {
    id: 'finance',
    name: 'Finance/Law',
    icon: '💼',
    defaults: {
      intensity: { deadlinePressure: 9, meetingLoad: 7, multitasking: 7, autonomy: 5, micromanagement: 6 },
      workHours: { unpaidOvertime: 20 },
    },
  },
];
