// WFH vs Office Cost Breakdown Calculator
// Compare the true costs of working from home vs going to an office

export interface WFHInputs {
  daysPerWeek: {
    wfh: number;
    office: number;
  };
  commute: {
    method: 'train' | 'tube' | 'bus' | 'car' | 'cycle' | 'walk';
    dailyCost: number;
    commuteMinutes: number; // One way
  };
  office: {
    lunchCost: number; // Average daily spend
    coffeeCost: number;
    workClothingAnnual: number;
    socialEvents: number; // Monthly
  };
  wfh: {
    electricityIncrease: number; // Monthly increase
    heatingIncrease: number; // Monthly (varies by season)
    internetUpgrade: number; // Monthly
    lunchCostAtHome: number; // Daily
    coffeeAtHome: number; // Daily
    homeSetupAnnual: number; // Desk, chair, monitor amortized
  };
  salary: {
    gross: number;
    trueHourlyRate: number;
  };
  hmrcRelief: boolean; // Claiming £6/week tax relief
}

export interface WFHResults {
  costs: {
    office: {
      commute: { daily: number; weekly: number; annual: number };
      lunch: { daily: number; weekly: number; annual: number };
      coffee: { daily: number; weekly: number; annual: number };
      clothing: { annual: number };
      social: { monthly: number; annual: number };
      total: { weekly: number; annual: number };
    };
    wfh: {
      electricity: { monthly: number; annual: number };
      heating: { monthly: number; annual: number };
      internet: { monthly: number; annual: number };
      lunch: { daily: number; weekly: number; annual: number };
      coffee: { daily: number; weekly: number; annual: number };
      setup: { annual: number };
      total: { weekly: number; annual: number };
    };
  };
  hybrid: {
    officeCosts: number; // Annual
    wfhCosts: number; // Annual
    totalAnnual: number;
  };
  comparison: {
    annualSavings: number; // WFH savings vs full office
    monthlySavings: number;
    weeklySavings: number;
    savingsPercent: number;
  };
  time: {
    commuteHoursPerWeek: number;
    commuteHoursPerYear: number;
    commuteValuePerYear: number; // At true hourly wage
    effectiveHourlyBonus: number; // Time saved as effective pay
  };
  hmrc: {
    weeklyRelief: number;
    annualRelief: number;
    taxSaved: number; // Assuming 20% basic rate
  };
  breakeven: {
    wfhDaysNeeded: number; // Days WFH to break even on setup costs
  };
  insights: string[];
}

const WEEKS_PER_YEAR = 47; // Accounting for holidays

export function calculateWFHCosts(inputs: WFHInputs): WFHResults {
  const insights: string[] = [];
  const officeDays = inputs.daysPerWeek.office;
  const wfhDays = inputs.daysPerWeek.wfh;
  const totalDays = officeDays + wfhDays;

  // Office costs
  const officeCommute = {
    daily: inputs.commute.dailyCost,
    weekly: inputs.commute.dailyCost * officeDays,
    annual: inputs.commute.dailyCost * officeDays * WEEKS_PER_YEAR,
  };

  const officeLunch = {
    daily: inputs.office.lunchCost,
    weekly: inputs.office.lunchCost * officeDays,
    annual: inputs.office.lunchCost * officeDays * WEEKS_PER_YEAR,
  };

  const officeCoffee = {
    daily: inputs.office.coffeeCost,
    weekly: inputs.office.coffeeCost * officeDays,
    annual: inputs.office.coffeeCost * officeDays * WEEKS_PER_YEAR,
  };

  const officeSocial = {
    monthly: inputs.office.socialEvents,
    annual: inputs.office.socialEvents * 12,
  };

  const officeTotalWeekly = officeCommute.weekly + officeLunch.weekly + officeCoffee.weekly + (officeSocial.annual / WEEKS_PER_YEAR);
  const officeTotalAnnual = officeCommute.annual + officeLunch.annual + officeCoffee.annual + inputs.office.workClothingAnnual + officeSocial.annual;

  // WFH costs
  const wfhElectricity = {
    monthly: inputs.wfh.electricityIncrease,
    annual: inputs.wfh.electricityIncrease * 12,
  };

  const wfhHeating = {
    monthly: inputs.wfh.heatingIncrease,
    annual: inputs.wfh.heatingIncrease * 12,
  };

  const wfhInternet = {
    monthly: inputs.wfh.internetUpgrade,
    annual: inputs.wfh.internetUpgrade * 12,
  };

  const wfhLunch = {
    daily: inputs.wfh.lunchCostAtHome,
    weekly: inputs.wfh.lunchCostAtHome * wfhDays,
    annual: inputs.wfh.lunchCostAtHome * wfhDays * WEEKS_PER_YEAR,
  };

  const wfhCoffee = {
    daily: inputs.wfh.coffeeAtHome,
    weekly: inputs.wfh.coffeeAtHome * wfhDays,
    annual: inputs.wfh.coffeeAtHome * wfhDays * WEEKS_PER_YEAR,
  };

  const wfhTotalWeekly = (wfhElectricity.annual + wfhHeating.annual + wfhInternet.annual) / WEEKS_PER_YEAR +
    wfhLunch.weekly + wfhCoffee.weekly + (inputs.wfh.homeSetupAnnual / WEEKS_PER_YEAR);
  const wfhTotalAnnual = wfhElectricity.annual + wfhHeating.annual + wfhInternet.annual +
    wfhLunch.annual + wfhCoffee.annual + inputs.wfh.homeSetupAnnual;

  // Hybrid costs (actual current situation)
  const hybridOfficeCosts = (officeCommute.daily + officeLunch.daily + officeCoffee.daily) * officeDays * WEEKS_PER_YEAR +
    (inputs.office.workClothingAnnual * (officeDays / 5)) + officeSocial.annual;
  const hybridWfhCosts = wfhElectricity.annual * (wfhDays / 5) + wfhHeating.annual * (wfhDays / 5) +
    wfhInternet.annual + wfhLunch.annual + wfhCoffee.annual + inputs.wfh.homeSetupAnnual;
  const hybridTotal = hybridOfficeCosts + hybridWfhCosts;

  // Comparison (full WFH vs full office)
  const fullOfficeAnnual = inputs.commute.dailyCost * 5 * WEEKS_PER_YEAR +
    inputs.office.lunchCost * 5 * WEEKS_PER_YEAR +
    inputs.office.coffeeCost * 5 * WEEKS_PER_YEAR +
    inputs.office.workClothingAnnual + officeSocial.annual;

  const fullWfhAnnual = wfhElectricity.annual + wfhHeating.annual + wfhInternet.annual +
    inputs.wfh.lunchCostAtHome * 5 * WEEKS_PER_YEAR +
    inputs.wfh.coffeeAtHome * 5 * WEEKS_PER_YEAR +
    inputs.wfh.homeSetupAnnual;

  const annualSavings = fullOfficeAnnual - fullWfhAnnual;
  const savingsPercent = Math.round((annualSavings / fullOfficeAnnual) * 100);

  // Time value
  const commuteHoursPerWeek = (inputs.commute.commuteMinutes * 2 * officeDays) / 60;
  const commuteHoursPerYear = commuteHoursPerWeek * WEEKS_PER_YEAR;
  const commuteValuePerYear = commuteHoursPerYear * inputs.salary.trueHourlyRate;

  // Full WFH time saved
  const fullCommuteHoursYear = (inputs.commute.commuteMinutes * 2 * 5 / 60) * WEEKS_PER_YEAR;
  const effectiveHourlyBonus = inputs.salary.gross > 0
    ? (annualSavings + (fullCommuteHoursYear * inputs.salary.trueHourlyRate)) / (52 * 40)
    : 0;

  // HMRC relief (£6/week for WFH)
  const hmrcWeeklyRelief = inputs.hmrcRelief ? 6 : 0;
  const hmrcAnnualRelief = hmrcWeeklyRelief * 52;
  const hmrcTaxSaved = hmrcAnnualRelief * 0.20; // Basic rate assumption

  // Breakeven calculation
  const setupCost = inputs.wfh.homeSetupAnnual;
  const dailySavings = (inputs.commute.dailyCost + inputs.office.lunchCost + inputs.office.coffeeCost) -
    (inputs.wfh.lunchCostAtHome + inputs.wfh.coffeeAtHome);
  const wfhDaysNeeded = dailySavings > 0 ? Math.ceil(setupCost / dailySavings) : 999;

  // Generate insights
  if (annualSavings > 2000) {
    insights.push(`💰 Working fully remote could save you £${Math.round(annualSavings).toLocaleString()}/year in direct costs.`);
  }

  if (commuteHoursPerYear > 200) {
    insights.push(`⏰ You currently spend ${Math.round(commuteHoursPerYear)} hours per year commuting (${Math.round(commuteHoursPerYear / 8)} full work days!).`);
  }

  if (commuteValuePerYear > 3000) {
    insights.push(`💎 At your true hourly wage, your commute time is worth £${Math.round(commuteValuePerYear).toLocaleString()}/year.`);
  }

  if (!inputs.hmrcRelief && wfhDays > 0) {
    insights.push(`📋 You could claim £${Math.round(hmrcTaxSaved)}/year HMRC WFH tax relief. Search "HMRC working from home" to apply.`);
  }

  if (inputs.wfh.heatingIncrease > 50) {
    insights.push(`🔥 High heating costs when WFH? Consider a heated blanket or space heater for your desk area - much cheaper than whole-house heating.`);
  }

  if (inputs.office.lunchCost > 10) {
    insights.push(`🥪 At £${inputs.office.lunchCost}/day for lunch, meal prepping could save you £${Math.round((inputs.office.lunchCost - 3) * officeDays * WEEKS_PER_YEAR)}/year.`);
  }

  return {
    costs: {
      office: {
        commute: officeCommute,
        lunch: officeLunch,
        coffee: officeCoffee,
        clothing: { annual: inputs.office.workClothingAnnual },
        social: officeSocial,
        total: { weekly: Math.round(officeTotalWeekly), annual: Math.round(officeTotalAnnual) },
      },
      wfh: {
        electricity: wfhElectricity,
        heating: wfhHeating,
        internet: wfhInternet,
        lunch: wfhLunch,
        coffee: wfhCoffee,
        setup: { annual: inputs.wfh.homeSetupAnnual },
        total: { weekly: Math.round(wfhTotalWeekly), annual: Math.round(wfhTotalAnnual) },
      },
    },
    hybrid: {
      officeCosts: Math.round(hybridOfficeCosts),
      wfhCosts: Math.round(hybridWfhCosts),
      totalAnnual: Math.round(hybridTotal),
    },
    comparison: {
      annualSavings: Math.round(annualSavings),
      monthlySavings: Math.round(annualSavings / 12),
      weeklySavings: Math.round(annualSavings / 52),
      savingsPercent,
    },
    time: {
      commuteHoursPerWeek: Math.round(commuteHoursPerWeek * 10) / 10,
      commuteHoursPerYear: Math.round(commuteHoursPerYear),
      commuteValuePerYear: Math.round(commuteValuePerYear),
      effectiveHourlyBonus: Math.round(effectiveHourlyBonus * 100) / 100,
    },
    hmrc: {
      weeklyRelief: hmrcWeeklyRelief,
      annualRelief: hmrcAnnualRelief,
      taxSaved: Math.round(hmrcTaxSaved),
    },
    breakeven: {
      wfhDaysNeeded,
    },
    insights,
  };
}

// Preset commute costs
export const COMMUTE_PRESETS = {
  london_zone123: { method: 'tube' as const, dailyCost: 8.50, minutes: 35 },
  london_zone16: { method: 'tube' as const, dailyCost: 14.90, minutes: 50 },
  train_suburban: { method: 'train' as const, dailyCost: 12, minutes: 45 },
  bus_city: { method: 'bus' as const, dailyCost: 4.50, minutes: 30 },
  car_short: { method: 'car' as const, dailyCost: 8, minutes: 20 },
  car_long: { method: 'car' as const, dailyCost: 18, minutes: 45 },
  cycle: { method: 'cycle' as const, dailyCost: 0.50, minutes: 25 },
  walk: { method: 'walk' as const, dailyCost: 0, minutes: 20 },
};
