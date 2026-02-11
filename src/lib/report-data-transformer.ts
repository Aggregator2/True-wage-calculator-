// ============================================================================
// REPORT DATA TRANSFORMER
// Converts ComprehensiveUserData + AIAnalysisResult into interactive report props
// ============================================================================

import type { ComprehensiveUserData, AIAnalysisResult } from './openrouter';

// ===== HELPER =====
function safeNum(val: any, fallback = 0): number {
  const n = Number(val);
  return isFinite(n) ? n : fallback;
}

function formatCurrency(val: number): string {
  return `£${val.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ===== SCORE CALCULATIONS =====

export function calculateFinancialHealthScore(data: ComprehensiveUserData): number {
  let score = 50; // baseline

  // Savings rate contribution (0-30 points)
  const savingsRate = safeNum(data.spending?.savingsRate, 0);
  if (savingsRate >= 50) score += 30;
  else if (savingsRate >= 30) score += 25;
  else if (savingsRate >= 20) score += 20;
  else if (savingsRate >= 10) score += 10;
  else score += savingsRate * 0.5;

  // Pension contribution (0-10 points)
  if (data.pension?.hasWorkplacePension && data.pension.scheme) {
    const totalPension = safeNum(data.pension.scheme.employeePercent, 0) + safeNum(data.pension.scheme.employerPercent, 0);
    score += Math.min(totalPension, 10);
  }

  // Emergency fund / net worth (0-10 points)
  const netWorth = safeNum(data.fireJourney?.currentNetWorth, 0);
  const monthlySpend = safeNum(data.spending?.monthlyTotal, 1000);
  const monthsCovered = monthlySpend > 0 ? netWorth / monthlySpend : 0;
  if (monthsCovered >= 6) score += 10;
  else if (monthsCovered >= 3) score += 7;
  else if (monthsCovered >= 1) score += 3;

  // Stress penalty (-10 points)
  if (data.workStress?.scores?.burnoutRisk === 'High' || data.workStress?.scores?.burnoutRisk === 'Critical') {
    score -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateSavingsEfficiencyScore(data: ComprehensiveUserData): number {
  const savingsRate = safeNum(data.spending?.savingsRate, 0);
  // Scale: 0% = 0 score, 50%+ = 100 score
  let score = Math.min(100, savingsRate * 2);

  // Bonus for pension match utilization
  if (data.pension?.hasWorkplacePension && data.pension.scheme) {
    if (safeNum(data.pension.scheme.employeePercent, 0) >= safeNum(data.pension.scheme.employerPercent, 0)) {
      score = Math.min(100, score + 10);
    }
  }

  // Penalty for hidden costs
  const hiddenCosts = safeNum(data.income?.hiddenAnnualCost, 0);
  const gross = safeNum(data.income?.grossAnnualSalary, 35000);
  const hiddenRatio = gross > 0 ? hiddenCosts / gross : 0;
  if (hiddenRatio > 0.1) score = Math.max(0, score - 15);
  else if (hiddenRatio > 0.05) score = Math.max(0, score - 8);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateFireReadinessScore(data: ComprehensiveUserData): number {
  let score = 0;

  // Progress toward FI number (0-40 points)
  const progress = safeNum(data.fireJourney?.currentProgressPercent, 0);
  score += Math.min(40, progress * 0.4);

  // Years to FI (0-30 points) - fewer years = higher score
  const yearsToFI = safeNum(data.fireJourney?.projections?.standardFI?.yearsToReach, 30);
  if (yearsToFI <= 5) score += 30;
  else if (yearsToFI <= 10) score += 25;
  else if (yearsToFI <= 15) score += 20;
  else if (yearsToFI <= 20) score += 15;
  else if (yearsToFI <= 25) score += 10;
  else score += 5;

  // Savings rate contribution (0-20 points)
  const savingsRate = safeNum(data.spending?.savingsRate, 0);
  score += Math.min(20, savingsRate * 0.4);

  // Milestones bonus (0-10 points)
  const milestones = data.fireJourney?.milestones;
  if (milestones) {
    if (milestones.coastFI) score += 4;
    if (milestones.halfwayToFI) score += 3;
    if (milestones.first100k) score += 2;
    if (milestones.first50k) score += 1;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ===== HERO DATA =====

export function extractHeroData(data: ComprehensiveUserData, ai: AIAnalysisResult) {
  return {
    userName: data.profile?.name || 'User',
    reportDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    trueHourlyWage: safeNum(data.income?.trueHourlyWage, 0),
    statedHourlyWage: safeNum(data.income?.statedHourlyWage, 0),
    yearsToFIRE: safeNum(data.fireJourney?.projections?.standardFI?.yearsToReach, 25),
    hookParagraph: ai?.profileSynthesis?.uncomfortableTruth || ai?.profileSynthesis?.oneLineSummary ||
      `Your financial data reveals some uncomfortable truths about your real earning power.`,
    annualHiddenCosts: safeNum(data.income?.hiddenAnnualCost, 0),
  };
}

// ===== INCOME DATA =====

export function extractIncomeProps(data: ComprehensiveUserData, ai: AIAnalysisResult) {
  return {
    grossSalary: safeNum(data.income?.grossAnnualSalary, 0),
    incomeTax: safeNum(data.income?.incomeTax, 0),
    nationalInsurance: safeNum(data.income?.nationalInsurance, 0),
    pensionContribution: safeNum(data.income?.pensionContributions?.employee, 0),
    studentLoanRepayment: safeNum(data.income?.studentLoanRepayments?.total, 0),
    takeHomePay: safeNum(data.income?.netAnnualSalary, 0),
    effectiveTaxRate: safeNum(data.income?.effectiveTaxRate, 0),
    trueHourlyWage: safeNum(data.income?.trueHourlyWage, 0),
    statedHourlyWage: safeNum(data.income?.statedHourlyWage, 0),
    unpaidOvertimeHours: safeNum(data.income?.unpaidOvertimeHours, 0),
    annualFreeLabourHours: safeNum(data.income?.unpaidOvertimeHours, 0) * 52,
    aiCommentary: ai?.profileSynthesis?.incomeReality || '',
  };
}

// ===== SAVINGS DATA =====

export function extractSavingsProps(data: ComprehensiveUserData, ai: AIAnalysisResult) {
  return {
    savingsRatePercent: safeNum(data.spending?.savingsRate, 0),
    ukAverageSavingsRate: 8.8,
    monthlySavings: safeNum(data.spending?.monthlySavings, 0),
    annualSavings: safeNum(data.spending?.annualSavings, 0),
    hiddenCosts: safeNum(data.income?.hiddenAnnualCost, 0),
    freeLabourHours: safeNum(data.income?.unpaidOvertimeHours, 0) * 52,
    fireTargetYears: safeNum(data.fireJourney?.projections?.standardFI?.yearsToReach, 25),
    aiCommentary: ai?.profileSynthesis?.spendingPatterns || '',
  };
}

// ===== SPENDING DATA =====

export function extractSpendingProps(data: ComprehensiveUserData, ai: AIAnalysisResult) {
  const trueWage = safeNum(data.income?.trueHourlyWage, 15);
  const EXPENSE_COLORS = ['#DC2626', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F97316'];

  const expenses: { name: string; amount: number; hoursOfLife: number; color: string }[] = [];
  const spending = data.spending;

  if (spending) {
    const categories = [
      { name: 'Housing', amount: safeNum(spending.housing, 0) * 12 },
      { name: 'Food', amount: safeNum(spending.food, 0) * 12 },
      { name: 'Transport', amount: safeNum(spending.transport, 0) * 12 },
      { name: 'Utilities', amount: safeNum(spending.utilities, 0) * 12 },
      { name: 'Insurance', amount: safeNum(spending.insurance, 0) * 12 },
      { name: 'Debt', amount: safeNum(spending.debt, 0) * 12 },
      { name: 'Entertainment', amount: safeNum(spending.entertainment, 0) * 12 },
      { name: 'Other', amount: safeNum(spending.other, 0) * 12 },
    ];

    categories.forEach((cat, i) => {
      if (cat.amount > 0) {
        expenses.push({
          name: cat.name,
          amount: cat.amount,
          hoursOfLife: trueWage > 0 ? Math.round(cat.amount / trueWage) : 0,
          color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
        });
      }
    });
  }

  // Add commute costs if available
  if (data.commute?.hasCommute && data.commute.currentMethod) {
    const commuteCost = safeNum(data.commute.currentMethod.annualCost, 0);
    if (commuteCost > 0) {
      expenses.push({
        name: 'Commute',
        amount: commuteCost,
        hoursOfLife: trueWage > 0 ? Math.round(commuteCost / trueWage) : 0,
        color: '#F59E0B',
      });
    }
  }

  // Lifestyle creep from stress/hidden costs
  const lifestyleCreep: { name: string; annualCost: number }[] = [];
  if (data.workStress?.hiddenCosts) {
    const hc = data.workStress.hiddenCosts;
    if (safeNum(hc.copingSpending, 0) > 0) lifestyleCreep.push({ name: 'Stress Spending', annualCost: hc.copingSpending });
    if (safeNum(hc.healthCosts, 0) > 0) lifestyleCreep.push({ name: 'Health Costs', annualCost: hc.healthCosts });
    if (safeNum(hc.productivityLoss, 0) > 0) lifestyleCreep.push({ name: 'Lost Productivity', annualCost: hc.productivityLoss });
  }

  const totalCreep = lifestyleCreep.reduce((sum, item) => sum + safeNum(item.annualCost, 0), 0);

  return {
    expenses,
    lifestyleCreep,
    totalLifestyleCreepCost: totalCreep,
    equivalentHours: trueWage > 0 ? Math.round(totalCreep / trueWage) : 0,
    fireDelay: totalCreep > 0 ? Math.round((totalCreep / safeNum(data.spending?.annualSavings, 10000)) * 10) / 10 : 0,
    trueHourlyWage: trueWage,
    aiWarning: ai?.profileSynthesis?.hiddenCostsBombshell || '',
    sourceCitation: 'Journal of Consumer Psychology: Financial stress increases impulse spending by 79%',
  };
}

// ===== RECOMMENDATIONS =====

export function extractRecommendations(ai: AIAnalysisResult) {
  const recs: any[] = [];
  let counter = 1;

  // Quick wins
  const quickWins = ai?.optimizationAnalysis?.quickWins || [];
  quickWins.forEach((qw: any) => {
    recs.push({
      id: `rec-${counter}`,
      number: counter,
      title: qw.action || qw.title || `Recommendation ${counter}`,
      impactAmount: safeNum(qw.annualSavings || qw.annualImpact, 0),
      fireAcceleration: safeNum(qw.yearsToFISaved, 0),
      beforeValue: qw.conventionalWisdom || 'Current approach',
      afterValue: qw.whyTheyreWrong || qw.contrarianCase || qw.reasoning || 'Optimised approach',
      conventionalWisdom: qw.conventionalWisdom || '',
      contrarianCase: qw.reasoning || qw.whyTheyreWrong || '',
      sourceCitation: qw.study || qw.source || '',
      isApplied: false,
    });
    counter++;
  });

  // Strategic moves
  const strategic = ai?.optimizationAnalysis?.strategicMoves || [];
  strategic.forEach((sm: any) => {
    recs.push({
      id: `rec-${counter}`,
      number: counter,
      title: sm.action || sm.title || `Strategic Move ${counter}`,
      impactAmount: safeNum(sm.annualImpact || sm.annualSavings, 0),
      fireAcceleration: safeNum(sm.yearsToFISaved, 0),
      beforeValue: sm.conventionalWisdom || 'Standard approach',
      afterValue: sm.contrarianCase || sm.reasoning || 'Optimised approach',
      conventionalWisdom: sm.conventionalWisdom || '',
      contrarianCase: sm.contrarianCase || sm.reasoning || '',
      sourceCitation: sm.study || sm.source || '',
      isApplied: false,
    });
    counter++;
  });

  return recs;
}

// ===== TIMELINE =====

export function extractTimeline(ai: AIAnalysisResult) {
  const roadmap = ai?.roadmap?.roadmap;
  if (!roadmap) return { phases: [], compoundEffect: { totalAnnualImpact: 0, description: '' } };

  const PHASE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];
  const PHASE_LABELS = [
    { key: 'month1to3', label: 'Months 1-3', title: 'Quick Wins' },
    { key: 'month4to6', label: 'Months 4-6', title: 'Strategic Moves' },
    { key: 'month7to12', label: 'Months 7-12', title: 'Build Momentum' },
    { key: 'year2to5', label: 'Years 2-5', title: 'Compound Growth' },
  ];

  const phases = PHASE_LABELS.map((phase, idx) => {
    const phaseData = roadmap[phase.key];
    if (!phaseData) return null;

    const actions = Array.isArray(phaseData)
      ? phaseData.map((item: any, i: number) => ({
          id: `${phase.key}-${i}`,
          task: typeof item === 'string' ? item : (item.action || item.task || item.title || ''),
          impact: typeof item === 'string' ? '' : (item.impact || item.reasoning || ''),
          annualSavings: typeof item === 'string' ? undefined : safeNum(item.annualSavings || item.annualImpact, 0) || undefined,
          isCompleted: false,
        }))
      : [];

    return {
      id: phase.key,
      timeRange: phase.label,
      title: phase.title,
      color: PHASE_COLORS[idx],
      actions,
    };
  }).filter(Boolean) as any[];

  const finalComparison = ai?.roadmap?.finalComparison;
  const totalImpact = phases.reduce((sum, phase) =>
    sum + phase.actions.reduce((a: number, act: any) => a + safeNum(act.annualSavings, 0), 0), 0
  );

  return {
    phases,
    compoundEffect: {
      totalAnnualImpact: totalImpact || safeNum(finalComparison?.fullPlan?.annualSavings, 0),
      description: ai?.roadmap?.personalizedMotivation || 'Following this complete plan will significantly accelerate your path to financial independence.',
    },
  };
}

// ===== PROJECTIONS =====

export function extractProjections(data: ComprehensiveUserData, ai: AIAnalysisResult) {
  const currentAge = safeNum(data.profile?.age, 30);
  const fiNumber = safeNum(data.fireJourney?.targetFINumber, 500000);
  const currentSavings = safeNum(data.fireJourney?.currentNetWorth, 0);
  const annualSavings = safeNum(data.spending?.annualSavings, 10000);

  // Generate projection data points
  const generateProjection = (annualContribution: number, returnRate: number): { year: number; value: number }[] => {
    const points: { year: number; value: number }[] = [];
    let balance = currentSavings;
    for (let year = 0; year <= 35; year++) {
      points.push({ year: currentAge + year, value: Math.round(balance) });
      balance = balance * (1 + returnRate) + annualContribution;
      if (balance > fiNumber * 2) break;
    }
    return points;
  };

  const finalComparison = ai?.roadmap?.finalComparison;
  const quickWinsSavings = ai?.optimizationAnalysis?.quickWins?.reduce(
    (sum: number, qw: any) => sum + safeNum(qw.annualSavings || qw.annualImpact, 0), 0
  ) || 0;

  const scenarios = [
    {
      label: 'Current Path',
      color: '#DC2626',
      data: generateProjection(annualSavings, 0.07),
      isVisible: true,
    },
    {
      label: 'With Quick Wins',
      color: '#F59E0B',
      data: generateProjection(annualSavings + quickWinsSavings, 0.07),
      isVisible: true,
    },
    {
      label: 'Full Plan',
      color: '#10B981',
      data: generateProjection(annualSavings + quickWinsSavings * 2, 0.07),
      isVisible: true,
    },
  ];

  const currentPathYears = safeNum(data.fireJourney?.projections?.standardFI?.yearsToReach, 25);
  const withChangesYears = safeNum(finalComparison?.fullPlan?.fireAge, currentAge + currentPathYears - 5) - currentAge;

  return {
    scenarios,
    currentPathFIAge: currentAge + currentPathYears,
    withChangesFIAge: Math.max(currentAge + 5, currentAge + withChangesYears),
    delta: Math.max(0, currentPathYears - withChangesYears),
    assumptions: 'Assumes 7% real returns after inflation, 2.5% annual inflation, 4% safe withdrawal rate, current UK tax rates.',
  };
}

// ===== ADDITIONAL AI SECTIONS =====

export function extractAISections(data: ComprehensiveUserData, ai: AIAnalysisResult, isPremium: boolean) {
  const sections: any[] = [];

  // Risk assessment
  if (ai?.riskAssessment) {
    const risks = ai.riskAssessment;
    const riskParagraphs: string[] = [];
    if (Array.isArray(risks.highPriorityRisks)) {
      risks.highPriorityRisks.forEach((risk: any) => {
        const riskText = typeof risk === 'string' ? risk : risk.risk || risk.description || '';
        const mitigation = typeof risk === 'string' ? '' : (risk.mitigation || risk.doThisWeek || '');
        if (riskText) riskParagraphs.push(riskText + (mitigation ? ` **Action:** ${mitigation}` : ''));
      });
    }

    if (riskParagraphs.length > 0) {
      sections.push({
        id: 'risks',
        title: 'The Risks You\'re Ignoring',
        icon: 'shield',
        type: 'danger',
        paragraphs: riskParagraphs,
        metrics: risks.overallRiskRating ? [{ label: 'Risk Rating', value: risks.overallRiskRating, type: 'negative' as const }] : undefined,
        isPremium: true,
      });
    }
  }

  // Contrarian insights
  if (ai?.optimizationAnalysis?.contrarianInsights) {
    const insights = ai.optimizationAnalysis.contrarianInsights;
    if (Array.isArray(insights) && insights.length > 0) {
      sections.push({
        id: 'contrarian-insights',
        title: 'What Nobody Else Will Tell You',
        icon: 'zap',
        type: 'warning',
        paragraphs: insights.map((ins: any) =>
          `**${ins.title || 'Insight'}:** ${ins.contrarian || ins.reasoning || ''}`
        ),
        isPremium: true,
      });
    }
  }

  // Cross-system opportunities
  if (ai?.optimizationAnalysis?.crossSystemOpportunities) {
    const opportunities = ai.optimizationAnalysis.crossSystemOpportunities;
    if (Array.isArray(opportunities) && opportunities.length > 0) {
      sections.push({
        id: 'cross-system',
        title: 'Hidden Connections In Your Data',
        icon: 'trending',
        type: 'info',
        paragraphs: opportunities.map((opp: any) =>
          `${opp.insight || ''} ${opp.breakdown || ''}`
        ),
        metrics: opportunities.map((opp: any) => ({
          label: 'Potential Impact',
          value: formatCurrency(safeNum(opp.totalHiddenCost, 0)),
          type: 'negative' as const,
        })),
        isPremium: true,
      });
    }
  }

  // Top recommendation summary
  if (ai?.optimizationAnalysis?.topRecommendation) {
    const top = ai.optimizationAnalysis.topRecommendation;
    sections.push({
      id: 'top-recommendation',
      title: 'Your #1 Move',
      icon: 'star',
      type: 'success',
      paragraphs: [
        `**${top.action || 'Take action now'}**`,
        top.reasoning || '',
        top.whyItMatters || '',
        `Current path: ${top.currentPath || 'Unknown'}. New path: ${top.newPath || 'Better'}. Years saved: ${safeNum(top.yearsSaved, 0)}.`,
      ].filter(Boolean),
      isPremium: true,
    });
  }

  // Sources & Methodology
  sections.push({
    id: 'sources',
    title: 'Sources & Methodology',
    icon: 'book',
    type: 'info',
    paragraphs: [
      'This analysis references peer-reviewed studies and publicly available UK financial data including Harvard Business Review, Journal of Consumer Psychology, Money and Mental Health Policy Institute, UK ONS employment data, Iceland and UK 4-day week trial results, and Numbeo cost of living indices.',
      'Projections assume 7% real returns (after inflation), 2.5% annual inflation, 4% safe withdrawal rate, and current 2025/26 UK tax rates and bands.',
      'All calculations are based on the financial data you provided through the calculator tools on this platform.',
    ],
    isPremium: false,
  });

  // Disclaimers
  sections.push({
    id: 'disclaimers',
    title: 'Important Notices',
    icon: 'info',
    type: 'info',
    paragraphs: [
      '**General Disclaimer:** This report is for educational and informational purposes only. It does not constitute financial advice, tax advice, investment advice, or any other form of professional advice. Before making any financial decisions, consult with a qualified financial adviser.',
      '**Projection Disclaimer:** All projections and forecasts are hypothetical illustrations based on mathematical models and historical data. Past performance is not indicative of future results.',
      '**Tax Information:** Tax information is based on current UK tax rates and bands. Tax laws change frequently. Consult HMRC or a qualified tax professional for advice specific to your situation.',
      'TrueWage is not authorised or regulated by the Financial Conduct Authority (FCA) and is not permitted to provide regulated financial advice.',
    ],
    isPremium: false,
  });

  return sections;
}

// ===== SECTION GATING =====
// Free users see: Hero, Scores, Income (partial), Sources, Disclaimers
// Premium users see: Everything

export const FREE_SECTIONS = ['hero', 'scores', 'income', 'sources', 'disclaimers'];

export function isSectionLocked(sectionId: string, isPremium: boolean): boolean {
  if (isPremium) return false;
  return !FREE_SECTIONS.includes(sectionId);
}
