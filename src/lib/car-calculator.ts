// Car Ownership True Cost Calculator
// Calculates the real cost of owning a car in work hours

export interface CarInputs {
  purchasePrice: number;
  isFinanced: boolean;
  financeDetails?: {
    deposit: number;
    monthlyPayment: number;
    termMonths: number;
    apr: number;
  };
  annualMileage: number;
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  mpg: number; // Or miles per kWh for electric
  insuranceAnnual: number;
  taxAnnual: number; // VED
  motAnnual: number;
  servicingAnnual: number;
  parkingMonthly: number;
  congestionCharges: number; // Annual estimate
  tollsAnnual: number;
  cleaningMonthly: number;
  depreciationYears: number;
  trueHourlyRate: number;
}

export interface CarResults {
  costs: {
    purchase: { annual: number; monthly: number };
    fuel: { annual: number; monthly: number };
    insurance: { annual: number; monthly: number };
    tax: { annual: number; monthly: number };
    mot: { annual: number; monthly: number };
    servicing: { annual: number; monthly: number };
    parking: { annual: number; monthly: number };
    congestion: { annual: number; monthly: number };
    tolls: { annual: number; monthly: number };
    cleaning: { annual: number; monthly: number };
    depreciation: { annual: number; monthly: number };
  };
  totals: {
    annualCost: number;
    monthlyCost: number;
    costPerMile: number;
    workHoursToAfford: number;
    workDaysToAfford: number;
  };
  comparison: {
    publicTransport: {
      annualCost: number;
      savings: number;
      savingsPercent: number;
    };
    cycling: {
      annualCost: number;
      savings: number;
      savingsPercent: number;
    };
    carShare: {
      annualCost: number;
      savings: number;
      savingsPercent: number;
    };
  };
  insights: string[];
  fiveYearCost: number;
  tenYearCost: number;
}

// UK fuel prices (average 2024)
const FUEL_PRICES = {
  petrol: 1.45, // per litre
  diesel: 1.52,
  hybrid: 1.45, // uses petrol
  electric: 0.28, // per kWh (home charging)
};

// Conversion factors
const LITRES_PER_GALLON = 4.546;
const MILES_PER_KWH_AVERAGE = 3.5; // Average for EVs

export function calculateCarCosts(inputs: CarInputs): CarResults {
  const insights: string[] = [];

  // Calculate purchase/finance cost
  let purchaseAnnual: number;
  let totalFinanceCost = 0;

  if (inputs.isFinanced && inputs.financeDetails) {
    const { deposit, monthlyPayment, termMonths } = inputs.financeDetails;
    totalFinanceCost = deposit + (monthlyPayment * termMonths);
    purchaseAnnual = (totalFinanceCost / termMonths) * 12;

    const interestPaid = totalFinanceCost - inputs.purchasePrice;
    if (interestPaid > 1000) {
      insights.push(`💳 You'll pay £${interestPaid.toLocaleString()} in interest over the finance term.`);
    }
  } else {
    // Spread purchase cost over depreciation period
    purchaseAnnual = inputs.purchasePrice / inputs.depreciationYears;
  }

  // Calculate fuel cost
  let fuelAnnual: number;
  if (inputs.fuelType === 'electric') {
    // For EVs, mpg field represents miles per kWh
    const milesPerKwh = inputs.mpg || MILES_PER_KWH_AVERAGE;
    const kwhNeeded = inputs.annualMileage / milesPerKwh;
    fuelAnnual = kwhNeeded * FUEL_PRICES.electric;
  } else {
    const litresPerMile = LITRES_PER_GALLON / inputs.mpg;
    const litresNeeded = inputs.annualMileage * litresPerMile;
    fuelAnnual = litresNeeded * FUEL_PRICES[inputs.fuelType];
  }

  // Calculate depreciation (separate from purchase for clarity)
  const depreciationRate = inputs.fuelType === 'electric' ? 0.15 : 0.20; // EVs depreciate slightly less now
  const depreciationAnnual = inputs.purchasePrice * depreciationRate;

  // All costs
  const costs = {
    purchase: { annual: purchaseAnnual, monthly: purchaseAnnual / 12 },
    fuel: { annual: fuelAnnual, monthly: fuelAnnual / 12 },
    insurance: { annual: inputs.insuranceAnnual, monthly: inputs.insuranceAnnual / 12 },
    tax: { annual: inputs.taxAnnual, monthly: inputs.taxAnnual / 12 },
    mot: { annual: inputs.motAnnual, monthly: inputs.motAnnual / 12 },
    servicing: { annual: inputs.servicingAnnual, monthly: inputs.servicingAnnual / 12 },
    parking: { annual: inputs.parkingMonthly * 12, monthly: inputs.parkingMonthly },
    congestion: { annual: inputs.congestionCharges, monthly: inputs.congestionCharges / 12 },
    tolls: { annual: inputs.tollsAnnual, monthly: inputs.tollsAnnual / 12 },
    cleaning: { annual: inputs.cleaningMonthly * 12, monthly: inputs.cleaningMonthly },
    depreciation: { annual: depreciationAnnual, monthly: depreciationAnnual / 12 },
  };

  // Calculate totals
  const annualCost = Object.values(costs).reduce((sum, c) => sum + c.annual, 0);
  const monthlyCost = annualCost / 12;
  const costPerMile = inputs.annualMileage > 0 ? annualCost / inputs.annualMileage : 0;

  // Work hours to afford
  const workHoursToAfford = inputs.trueHourlyRate > 0 ? annualCost / inputs.trueHourlyRate : 0;
  const workDaysToAfford = workHoursToAfford / 8;

  // Comparison with alternatives
  // Public transport estimate (zone 1-6 travelcard as baseline)
  const publicTransportAnnual = 2500; // Rough average for commuting

  // Cycling estimate
  const cyclingAnnual = 500; // Bike maintenance, occasional replacements

  // Car share estimate (Zipcar style)
  const carShareHourlyRate = 8;
  const estimatedCarShareHours = (inputs.annualMileage / 30) * 1; // Rough estimate
  const carShareAnnual = Math.min(estimatedCarShareHours * carShareHourlyRate + 100, annualCost * 0.8);

  const comparison = {
    publicTransport: {
      annualCost: publicTransportAnnual,
      savings: annualCost - publicTransportAnnual,
      savingsPercent: Math.round(((annualCost - publicTransportAnnual) / annualCost) * 100),
    },
    cycling: {
      annualCost: cyclingAnnual,
      savings: annualCost - cyclingAnnual,
      savingsPercent: Math.round(((annualCost - cyclingAnnual) / annualCost) * 100),
    },
    carShare: {
      annualCost: carShareAnnual,
      savings: annualCost - carShareAnnual,
      savingsPercent: Math.round(((annualCost - carShareAnnual) / annualCost) * 100),
    },
  };

  // Long-term costs
  const fiveYearCost = annualCost * 5;
  const tenYearCost = annualCost * 10;

  // Generate insights
  if (costPerMile > 0.5) {
    insights.push(`⚠️ At £${costPerMile.toFixed(2)} per mile, your car is expensive to run. Consider if each journey is worth it.`);
  }

  if (inputs.fuelType !== 'electric' && inputs.mpg < 40) {
    insights.push(`⛽ Your ${inputs.mpg} MPG is below average. A more efficient car could save you £${Math.round(fuelAnnual * 0.3)}/year on fuel.`);
  }

  if (inputs.insuranceAnnual > 1500) {
    insights.push(`🛡️ Your insurance is high. Consider telematics, increasing excess, or shopping around at renewal.`);
  }

  if (inputs.parkingMonthly > 100) {
    insights.push(`🅿️ You're spending £${inputs.parkingMonthly}/month on parking - that's £${inputs.parkingMonthly * 12}/year!`);
  }

  if (workDaysToAfford > 30) {
    insights.push(`📅 You work ${Math.round(workDaysToAfford)} days per year just to afford your car. That's ${Math.round(workDaysToAfford / 5)} weeks!`);
  }

  if (inputs.annualMileage < 5000) {
    insights.push(`🚗 At only ${inputs.annualMileage.toLocaleString()} miles/year, car sharing might be more cost-effective than ownership.`);
  }

  if (comparison.publicTransport.savings > 3000) {
    insights.push(`🚇 Switching to public transport could save you £${comparison.publicTransport.savings.toLocaleString()}/year.`);
  }

  return {
    costs,
    totals: {
      annualCost: Math.round(annualCost),
      monthlyCost: Math.round(monthlyCost),
      costPerMile: Math.round(costPerMile * 100) / 100,
      workHoursToAfford: Math.round(workHoursToAfford),
      workDaysToAfford: Math.round(workDaysToAfford),
    },
    comparison,
    insights,
    fiveYearCost: Math.round(fiveYearCost),
    tenYearCost: Math.round(tenYearCost),
  };
}

// Common car profiles for quick selection
export const CAR_PROFILES = [
  {
    id: 'small_city',
    name: 'Small City Car',
    description: 'e.g., VW Up, Fiat 500, Toyota Aygo',
    defaults: {
      purchasePrice: 12000,
      fuelType: 'petrol' as const,
      mpg: 55,
      insuranceAnnual: 600,
      taxAnnual: 165,
      servicingAnnual: 200,
    },
  },
  {
    id: 'family_hatch',
    name: 'Family Hatchback',
    description: 'e.g., VW Golf, Ford Focus, Mazda 3',
    defaults: {
      purchasePrice: 25000,
      fuelType: 'petrol' as const,
      mpg: 45,
      insuranceAnnual: 700,
      taxAnnual: 180,
      servicingAnnual: 350,
    },
  },
  {
    id: 'suv',
    name: 'SUV / Crossover',
    description: 'e.g., Nissan Qashqai, Kia Sportage',
    defaults: {
      purchasePrice: 35000,
      fuelType: 'diesel' as const,
      mpg: 40,
      insuranceAnnual: 800,
      taxAnnual: 190,
      servicingAnnual: 450,
    },
  },
  {
    id: 'electric',
    name: 'Electric Car',
    description: 'e.g., Tesla Model 3, VW ID.3, MG4',
    defaults: {
      purchasePrice: 35000,
      fuelType: 'electric' as const,
      mpg: 4, // miles per kWh
      insuranceAnnual: 900,
      taxAnnual: 0,
      servicingAnnual: 150,
    },
  },
  {
    id: 'hybrid',
    name: 'Hybrid',
    description: 'e.g., Toyota Prius, Honda Jazz Hybrid',
    defaults: {
      purchasePrice: 28000,
      fuelType: 'hybrid' as const,
      mpg: 60,
      insuranceAnnual: 650,
      taxAnnual: 165,
      servicingAnnual: 300,
    },
  },
  {
    id: 'premium',
    name: 'Premium / Executive',
    description: 'e.g., BMW 3 Series, Audi A4, Mercedes C-Class',
    defaults: {
      purchasePrice: 45000,
      fuelType: 'diesel' as const,
      mpg: 50,
      insuranceAnnual: 1000,
      taxAnnual: 190,
      servicingAnnual: 600,
    },
  },
];
