// Commute Comparison Calculator
// Compares different commuting methods based on cost, time, and environmental impact

export type CommuteMethod =
  | 'train_tube'
  | 'bus'
  | 'cycling'
  | 'driving'
  | 'ebike'
  | 'walking'
  | 'hybrid';

export interface CommuteMethodConfig {
  id: CommuteMethod;
  name: string;
  icon: string;
  hasFixedCosts: boolean;
  hasVariableCosts: boolean;
  hasTimeCost: boolean;
  co2PerKm: number; // grams of CO2 per km
  caloriesPerKm: number; // calories burned per km (for active transport)
}

export const COMMUTE_METHODS: CommuteMethodConfig[] = [
  {
    id: 'train_tube',
    name: 'Train / Tube',
    icon: '🚇',
    hasFixedCosts: true,
    hasVariableCosts: false,
    hasTimeCost: true,
    co2PerKm: 41, // UK rail average
    caloriesPerKm: 0,
  },
  {
    id: 'bus',
    name: 'Bus',
    icon: '🚌',
    hasFixedCosts: true,
    hasVariableCosts: false,
    hasTimeCost: true,
    co2PerKm: 89, // UK bus average
    caloriesPerKm: 0,
  },
  {
    id: 'cycling',
    name: 'Cycling',
    icon: '🚴',
    hasFixedCosts: true,
    hasVariableCosts: false,
    hasTimeCost: true,
    co2PerKm: 0,
    caloriesPerKm: 30, // moderate cycling
  },
  {
    id: 'driving',
    name: 'Driving',
    icon: '🚗',
    hasFixedCosts: true,
    hasVariableCosts: true,
    hasTimeCost: true,
    co2PerKm: 170, // average UK car
    caloriesPerKm: 0,
  },
  {
    id: 'ebike',
    name: 'E-Bike',
    icon: '⚡',
    hasFixedCosts: true,
    hasVariableCosts: true,
    hasTimeCost: true,
    co2PerKm: 6, // electricity for charging
    caloriesPerKm: 15, // assisted cycling
  },
  {
    id: 'walking',
    name: 'Walking',
    icon: '🚶',
    hasFixedCosts: false,
    hasVariableCosts: false,
    hasTimeCost: true,
    co2PerKm: 0,
    caloriesPerKm: 60, // moderate walking
  },
  {
    id: 'hybrid',
    name: 'Hybrid (Mix)',
    icon: '🔄',
    hasFixedCosts: true,
    hasVariableCosts: true,
    hasTimeCost: true,
    co2PerKm: 50, // estimated average
    caloriesPerKm: 10,
  },
];

export interface CommuteMethodInput {
  method: CommuteMethod;
  enabled: boolean;
  // Time
  commuteTimeMinutes: number; // one-way commute time
  // Costs
  monthlyPass?: number; // for train/bus
  singleFare?: number; // if not using pass
  // Driving specific
  fuelCostPerLitre?: number;
  mpg?: number; // miles per gallon
  parkingDaily?: number;
  congestionCharge?: number; // daily
  // Bike specific
  initialCost?: number; // bike purchase
  maintenanceYearly?: number;
  chargingCostMonthly?: number; // for e-bike
  // Custom/hybrid
  customMonthlyCost?: number;
  customDailyCost?: number;
}

export interface CommuteInputs {
  // Journey details
  distanceMiles: number; // one-way distance
  daysInOfficePerWeek: number;
  weeksWorkedPerYear: number;

  // User's hourly wage (for time cost calculation)
  hourlyWage: number;

  // Methods to compare
  methods: CommuteMethodInput[];
}

export interface CommuteMethodResult {
  method: CommuteMethod;
  name: string;
  icon: string;

  // Annual costs
  annualDirectCost: number;
  annualTimeCost: number; // time valued at hourly wage
  annualTotalCost: number;

  // Time
  dailyCommuteMinutes: number; // round trip
  annualCommuteHours: number;

  // Environmental
  annualCO2Kg: number;
  annualCaloriesBurned: number;

  // Per-day breakdown
  dailyDirectCost: number;
  dailyTimeCost: number;
  dailyTotalCost: number;
}

export interface CommuteResults {
  methods: CommuteMethodResult[];

  // Comparison insights
  cheapestMethod: string;
  fastestMethod: string;
  greenestMethod: string;
  healthiestMethod: string;
  bestOverallMethod: string;

  // Savings potential
  potentialAnnualSavings: number;
  potentialTimeSavingsHours: number;
  potentialCO2SavingsKg: number;

  // Current vs best comparison
  currentMethodName?: string;
  switchSavingsAnnual?: number;
}

const MILES_TO_KM = 1.60934;

export function calculateCommuteCosts(inputs: CommuteInputs): CommuteResults {
  const annualCommuteDays = inputs.daysInOfficePerWeek * inputs.weeksWorkedPerYear;
  const distanceKm = inputs.distanceMiles * MILES_TO_KM;
  const dailyDistanceKm = distanceKm * 2; // round trip
  const annualDistanceKm = dailyDistanceKm * annualCommuteDays;

  const methodResults: CommuteMethodResult[] = [];

  for (const methodInput of inputs.methods) {
    if (!methodInput.enabled) continue;

    const config = COMMUTE_METHODS.find(m => m.id === methodInput.method);
    if (!config) continue;

    let annualDirectCost = 0;

    // Calculate direct costs based on method type
    switch (methodInput.method) {
      case 'train_tube':
      case 'bus':
        if (methodInput.monthlyPass) {
          // Assume 12 months of passes
          annualDirectCost = methodInput.monthlyPass * 12;
        } else if (methodInput.singleFare) {
          // Daily fare * 2 (return) * commute days
          annualDirectCost = methodInput.singleFare * 2 * annualCommuteDays;
        }
        break;

      case 'driving':
        // Fuel cost
        if (methodInput.fuelCostPerLitre && methodInput.mpg) {
          const litresPerMile = 4.54609 / methodInput.mpg; // UK gallons to litres
          const annualMiles = inputs.distanceMiles * 2 * annualCommuteDays;
          const annualLitres = annualMiles * litresPerMile;
          annualDirectCost += annualLitres * methodInput.fuelCostPerLitre;
        }
        // Parking
        if (methodInput.parkingDaily) {
          annualDirectCost += methodInput.parkingDaily * annualCommuteDays;
        }
        // Congestion charge
        if (methodInput.congestionCharge) {
          annualDirectCost += methodInput.congestionCharge * annualCommuteDays;
        }
        break;

      case 'cycling':
        // Initial cost amortized over 5 years + maintenance
        if (methodInput.initialCost) {
          annualDirectCost += methodInput.initialCost / 5;
        }
        if (methodInput.maintenanceYearly) {
          annualDirectCost += methodInput.maintenanceYearly;
        }
        break;

      case 'ebike':
        // Initial cost amortized over 5 years + maintenance + charging
        if (methodInput.initialCost) {
          annualDirectCost += methodInput.initialCost / 5;
        }
        if (methodInput.maintenanceYearly) {
          annualDirectCost += methodInput.maintenanceYearly;
        }
        if (methodInput.chargingCostMonthly) {
          annualDirectCost += methodInput.chargingCostMonthly * 12;
        }
        break;

      case 'walking':
        // Essentially free (maybe shoe wear?)
        annualDirectCost = 50; // Nominal shoe replacement cost
        break;

      case 'hybrid':
        if (methodInput.customMonthlyCost) {
          annualDirectCost = methodInput.customMonthlyCost * 12;
        } else if (methodInput.customDailyCost) {
          annualDirectCost = methodInput.customDailyCost * annualCommuteDays;
        }
        break;
    }

    // Calculate time cost
    const dailyCommuteMinutes = methodInput.commuteTimeMinutes * 2; // round trip
    const annualCommuteHours = (dailyCommuteMinutes * annualCommuteDays) / 60;
    const annualTimeCost = annualCommuteHours * inputs.hourlyWage;

    // Environmental impact
    const annualCO2Kg = (annualDistanceKm * config.co2PerKm) / 1000;
    const annualCaloriesBurned = annualDistanceKm * config.caloriesPerKm;

    // Daily breakdown
    const dailyDirectCost = annualDirectCost / annualCommuteDays;
    const dailyTimeCost = (dailyCommuteMinutes / 60) * inputs.hourlyWage;

    methodResults.push({
      method: methodInput.method,
      name: config.name,
      icon: config.icon,
      annualDirectCost: Math.round(annualDirectCost),
      annualTimeCost: Math.round(annualTimeCost),
      annualTotalCost: Math.round(annualDirectCost + annualTimeCost),
      dailyCommuteMinutes,
      annualCommuteHours: Math.round(annualCommuteHours),
      annualCO2Kg: Math.round(annualCO2Kg),
      annualCaloriesBurned: Math.round(annualCaloriesBurned),
      dailyDirectCost: Math.round(dailyDirectCost * 100) / 100,
      dailyTimeCost: Math.round(dailyTimeCost * 100) / 100,
      dailyTotalCost: Math.round((dailyDirectCost + dailyTimeCost) * 100) / 100,
    });
  }

  // Sort by total cost for comparison
  const sortedByTotalCost = [...methodResults].sort((a, b) => a.annualTotalCost - b.annualTotalCost);
  const sortedByDirectCost = [...methodResults].sort((a, b) => a.annualDirectCost - b.annualDirectCost);
  const sortedByTime = [...methodResults].sort((a, b) => a.annualCommuteHours - b.annualCommuteHours);
  const sortedByCO2 = [...methodResults].sort((a, b) => a.annualCO2Kg - b.annualCO2Kg);
  const sortedByCalories = [...methodResults].sort((a, b) => b.annualCaloriesBurned - a.annualCaloriesBurned);

  // Find best methods
  const cheapestMethod = sortedByDirectCost[0]?.name || 'N/A';
  const fastestMethod = sortedByTime[0]?.name || 'N/A';
  const greenestMethod = sortedByCO2[0]?.name || 'N/A';
  const healthiestMethod = sortedByCalories[0]?.name || 'N/A';
  const bestOverallMethod = sortedByTotalCost[0]?.name || 'N/A';

  // Calculate potential savings (comparing most expensive to cheapest)
  const mostExpensive = sortedByTotalCost[sortedByTotalCost.length - 1];
  const cheapest = sortedByTotalCost[0];

  const potentialAnnualSavings = mostExpensive && cheapest
    ? mostExpensive.annualTotalCost - cheapest.annualTotalCost
    : 0;

  const slowest = sortedByTime[sortedByTime.length - 1];
  const fastest = sortedByTime[0];
  const potentialTimeSavingsHours = slowest && fastest
    ? slowest.annualCommuteHours - fastest.annualCommuteHours
    : 0;

  const highestCO2 = sortedByCO2[sortedByCO2.length - 1];
  const lowestCO2 = sortedByCO2[0];
  const potentialCO2SavingsKg = highestCO2 && lowestCO2
    ? highestCO2.annualCO2Kg - lowestCO2.annualCO2Kg
    : 0;

  return {
    methods: methodResults,
    cheapestMethod,
    fastestMethod,
    greenestMethod,
    healthiestMethod,
    bestOverallMethod,
    potentialAnnualSavings: Math.round(potentialAnnualSavings),
    potentialTimeSavingsHours: Math.round(potentialTimeSavingsHours),
    potentialCO2SavingsKg: Math.round(potentialCO2SavingsKg),
  };
}

// Default inputs for the calculator
export function getDefaultCommuteInputs(): CommuteInputs {
  return {
    distanceMiles: 10,
    daysInOfficePerWeek: 3,
    weeksWorkedPerYear: 47,
    hourlyWage: 20,
    methods: [
      {
        method: 'train_tube',
        enabled: true,
        commuteTimeMinutes: 45,
        monthlyPass: 180,
      },
      {
        method: 'bus',
        enabled: true,
        commuteTimeMinutes: 60,
        monthlyPass: 80,
      },
      {
        method: 'cycling',
        enabled: true,
        commuteTimeMinutes: 40,
        initialCost: 500,
        maintenanceYearly: 100,
      },
      {
        method: 'driving',
        enabled: true,
        commuteTimeMinutes: 35,
        fuelCostPerLitre: 1.45,
        mpg: 40,
        parkingDaily: 10,
        congestionCharge: 0,
      },
      {
        method: 'ebike',
        enabled: false,
        commuteTimeMinutes: 35,
        initialCost: 1500,
        maintenanceYearly: 150,
        chargingCostMonthly: 5,
      },
      {
        method: 'walking',
        enabled: false,
        commuteTimeMinutes: 120,
      },
      {
        method: 'hybrid',
        enabled: false,
        commuteTimeMinutes: 50,
        customMonthlyCost: 150,
      },
    ],
  };
}
