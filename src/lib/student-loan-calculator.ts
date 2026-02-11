// Multiple Student Loan Calculator
// Handles Plan 1, 2, 4, 5, and Postgraduate loans simultaneously

export type LoanPlan = 'plan1' | 'plan2' | 'plan4' | 'plan5' | 'postgrad';

export interface StudentLoan {
  plan: LoanPlan;
  balance: number;
  enabled: boolean;
}

export interface StudentLoanInputs {
  grossSalary: number;
  loans: StudentLoan[];
  salaryGrowthRate: number;
  includeInflation: boolean;
}

export interface LoanPlanDetails {
  name: string;
  description: string;
  threshold: number;
  rate: number; // Repayment rate as decimal
  interestRate: number; // Current interest rate
  writeOffYears: number;
  writeOffAge?: number;
}

export interface YearlyProjection {
  year: number;
  salary: number;
  totalRepayment: number;
  repayments: Record<LoanPlan, number>;
  balances: Record<LoanPlan, number>;
  interestAdded: Record<LoanPlan, number>;
}

export interface StudentLoanResults {
  projections: YearlyProjection[];
  summary: {
    totalRepaid: number;
    totalInterestPaid: number;
    totalWrittenOff: number;
    yearsToRepay: number | 'never';
    monthlyRepayment: number;
    effectiveTaxRate: number; // Student loan as % of gross
  };
  byPlan: Record<LoanPlan, {
    totalRepaid: number;
    interestPaid: number;
    writtenOff: number;
    yearsToRepay: number | 'never';
    monthlyRepayment: number;
  }>;
  insights: string[];
  voluntaryPaymentBenefit: {
    monthlyExtra: number;
    interestSaved: number;
    yearsSaved: number;
  };
}

// 2024/25 thresholds and rates
export const LOAN_PLANS: Record<LoanPlan, LoanPlanDetails> = {
  plan1: {
    name: 'Plan 1',
    description: 'Started before Sept 2012 (England/Wales) or Scotland/NI',
    threshold: 24990,
    rate: 0.09,
    interestRate: 0.0625, // 6.25% (RPI as of 2024)
    writeOffYears: 25,
    writeOffAge: 65,
  },
  plan2: {
    name: 'Plan 2',
    description: 'Started Sept 2012 or later (England/Wales)',
    threshold: 27295,
    rate: 0.09,
    interestRate: 0.078, // RPI + 3% (max rate)
    writeOffYears: 30,
  },
  plan4: {
    name: 'Plan 4',
    description: 'Scotland only (from Sept 1998)',
    threshold: 31395,
    rate: 0.09,
    interestRate: 0.0625,
    writeOffYears: 30,
    writeOffAge: 65,
  },
  plan5: {
    name: 'Plan 5',
    description: 'Started Aug 2023 or later (England)',
    threshold: 25000,
    rate: 0.09,
    interestRate: 0.078, // RPI + 3% (while studying, lower after)
    writeOffYears: 40,
  },
  postgrad: {
    name: 'Postgraduate Loan',
    description: 'Master\'s or Doctoral loan',
    threshold: 21000,
    rate: 0.06, // 6% rate
    interestRate: 0.078,
    writeOffYears: 30,
  },
};

export function calculateStudentLoans(inputs: StudentLoanInputs): StudentLoanResults {
  const enabledLoans = inputs.loans.filter(l => l.enabled && l.balance > 0);
  const projections: YearlyProjection[] = [];
  const insights: string[] = [];

  // Initialize balances
  const balances: Record<LoanPlan, number> = {
    plan1: 0, plan2: 0, plan4: 0, plan5: 0, postgrad: 0,
  };
  enabledLoans.forEach(loan => {
    balances[loan.plan] = loan.balance;
  });

  // Track totals per plan
  const totalRepaidByPlan: Record<LoanPlan, number> = {
    plan1: 0, plan2: 0, plan4: 0, plan5: 0, postgrad: 0,
  };
  const interestByPlan: Record<LoanPlan, number> = {
    plan1: 0, plan2: 0, plan4: 0, plan5: 0, postgrad: 0,
  };
  const yearsToRepayByPlan: Record<LoanPlan, number | 'never'> = {
    plan1: 'never', plan2: 'never', plan4: 'never', plan5: 'never', postgrad: 'never',
  };

  let currentSalary = inputs.grossSalary;
  let totalRepaid = 0;
  let totalInterest = 0;
  let yearsToRepay: number | 'never' = 'never';

  // Simulate 40 years (maximum write-off period)
  for (let year = 1; year <= 40; year++) {
    const yearRepayments: Record<LoanPlan, number> = {
      plan1: 0, plan2: 0, plan4: 0, plan5: 0, postgrad: 0,
    };
    const yearInterest: Record<LoanPlan, number> = {
      plan1: 0, plan2: 0, plan4: 0, plan5: 0, postgrad: 0,
    };

    let yearTotalRepayment = 0;

    // Process each enabled loan
    for (const loan of enabledLoans) {
      const plan = LOAN_PLANS[loan.plan];

      // Check if loan is written off
      if (year > plan.writeOffYears) {
        continue;
      }

      // Check if balance is already 0
      if (balances[loan.plan] <= 0) {
        continue;
      }

      // Calculate annual interest (added at start of year for simplicity)
      const interest = balances[loan.plan] * plan.interestRate;
      balances[loan.plan] += interest;
      yearInterest[loan.plan] = interest;
      interestByPlan[loan.plan] += interest;
      totalInterest += interest;

      // Calculate repayment
      let repayment = 0;
      if (currentSalary > plan.threshold) {
        repayment = (currentSalary - plan.threshold) * plan.rate;
      }

      // Don't overpay
      repayment = Math.min(repayment, balances[loan.plan]);

      // Apply repayment
      balances[loan.plan] -= repayment;
      yearRepayments[loan.plan] = repayment;
      totalRepaidByPlan[loan.plan] += repayment;
      yearTotalRepayment += repayment;
      totalRepaid += repayment;

      // Check if paid off
      if (balances[loan.plan] <= 0 && yearsToRepayByPlan[loan.plan] === 'never') {
        yearsToRepayByPlan[loan.plan] = year;
      }
    }

    // Check if all loans are paid off
    const allPaidOff = enabledLoans.every(l => balances[l.plan] <= 0);
    if (allPaidOff && yearsToRepay === 'never') {
      yearsToRepay = year;
    }

    projections.push({
      year,
      salary: Math.round(currentSalary),
      totalRepayment: Math.round(yearTotalRepayment),
      repayments: { ...yearRepayments },
      balances: { ...balances },
      interestAdded: { ...yearInterest },
    });

    // Apply salary growth
    currentSalary *= (1 + inputs.salaryGrowthRate / 100);

    // Stop if all loans paid off
    if (allPaidOff) {
      break;
    }
  }

  // Calculate written off amounts
  const totalWrittenOff = enabledLoans.reduce((sum, loan) => {
    return sum + Math.max(0, balances[loan.plan]);
  }, 0);

  // Calculate monthly repayment (based on current salary)
  let monthlyRepayment = 0;
  for (const loan of enabledLoans) {
    const plan = LOAN_PLANS[loan.plan];
    if (inputs.grossSalary > plan.threshold && balances[loan.plan] > 0) {
      monthlyRepayment += ((inputs.grossSalary - plan.threshold) * plan.rate) / 12;
    }
  }

  // Effective tax rate
  const effectiveTaxRate = (monthlyRepayment * 12 / inputs.grossSalary) * 100;

  // By plan summary
  const byPlan: StudentLoanResults['byPlan'] = {} as StudentLoanResults['byPlan'];
  for (const loan of enabledLoans) {
    const plan = LOAN_PLANS[loan.plan];
    const monthlyForPlan = inputs.grossSalary > plan.threshold
      ? ((inputs.grossSalary - plan.threshold) * plan.rate) / 12
      : 0;

    byPlan[loan.plan] = {
      totalRepaid: Math.round(totalRepaidByPlan[loan.plan]),
      interestPaid: Math.round(interestByPlan[loan.plan]),
      writtenOff: Math.round(Math.max(0, balances[loan.plan])),
      yearsToRepay: yearsToRepayByPlan[loan.plan],
      monthlyRepayment: Math.round(monthlyForPlan),
    };
  }

  // Calculate voluntary payment benefit
  const monthlyExtra = 100;
  const potentialInterestSaved = totalInterest * 0.15; // Rough estimate
  const yearsSaved = yearsToRepay !== 'never' ? Math.min(5, Math.round(yearsToRepay * 0.1)) : 3;

  // Generate insights
  if (enabledLoans.length > 1) {
    insights.push(`📚 You have ${enabledLoans.length} student loans running simultaneously. Repayments are taken for each loan that's above its threshold.`);
  }

  if (effectiveTaxRate > 5) {
    insights.push(`💸 Student loan repayments add ${effectiveTaxRate.toFixed(1)}% to your effective tax rate.`);
  }

  const plan2Loan = enabledLoans.find(l => l.plan === 'plan2');
  if (plan2Loan && plan2Loan.balance > 50000) {
    insights.push(`⚠️ With a Plan 2 balance over £50k, you'll likely never fully repay before write-off. Focus on other financial goals.`);
  }

  const plan1Loan = enabledLoans.find(l => l.plan === 'plan1');
  if (plan1Loan && plan1Loan.balance < 10000) {
    insights.push(`✅ Your Plan 1 balance is relatively low. You may fully repay it within ${yearsToRepayByPlan.plan1 !== 'never' ? yearsToRepayByPlan.plan1 : '10'} years.`);
  }

  if (totalWrittenOff > 0) {
    insights.push(`🎓 £${Math.round(totalWrittenOff).toLocaleString()} is projected to be written off. This is normal for most graduates.`);
  }

  const hasPostgrad = enabledLoans.find(l => l.plan === 'postgrad');
  if (hasPostgrad) {
    insights.push(`📖 Postgraduate loan has a lower threshold (£21k) and 6% rate. It's taken after undergraduate loan repayments.`);
  }

  return {
    projections,
    summary: {
      totalRepaid: Math.round(totalRepaid),
      totalInterestPaid: Math.round(totalInterest),
      totalWrittenOff: Math.round(totalWrittenOff),
      yearsToRepay,
      monthlyRepayment: Math.round(monthlyRepayment),
      effectiveTaxRate: Math.round(effectiveTaxRate * 10) / 10,
    },
    byPlan,
    insights,
    voluntaryPaymentBenefit: {
      monthlyExtra,
      interestSaved: Math.round(potentialInterestSaved),
      yearsSaved,
    },
  };
}

// Helper to get which loans are typically held together
export const COMMON_COMBINATIONS = [
  {
    id: 'plan2_only',
    name: 'Undergraduate (Post-2012)',
    loans: ['plan2'] as LoanPlan[],
    description: 'Most common for English/Welsh graduates since 2012',
  },
  {
    id: 'plan2_postgrad',
    name: 'Undergrad + Postgrad',
    loans: ['plan2', 'postgrad'] as LoanPlan[],
    description: 'Bachelor\'s plus Master\'s/PhD',
  },
  {
    id: 'plan1_only',
    name: 'Undergraduate (Pre-2012)',
    loans: ['plan1'] as LoanPlan[],
    description: 'Started before September 2012',
  },
  {
    id: 'plan4_only',
    name: 'Scotland',
    loans: ['plan4'] as LoanPlan[],
    description: 'Scottish students (SAAS funded)',
  },
  {
    id: 'plan5_only',
    name: 'New System (2023+)',
    loans: ['plan5'] as LoanPlan[],
    description: 'Started August 2023 or later',
  },
];
