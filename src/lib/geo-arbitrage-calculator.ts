// Geographic Arbitrage Calculator
// Compare cost of living across UK regions AND international destinations

export type LocationType = 'uk' | 'international';

export interface Location {
  id: string;
  name: string;
  country: string;
  type: LocationType;
  flag: string;
  // Cost indices relative to UK average (100 = UK average)
  housingIndex: number;
  transportIndex: number;
  groceriesIndex: number;
  utilitiesIndex: number;
  entertainmentIndex: number;
  healthcareIndex: number;
  // Lifestyle metrics (1-10)
  safetyRating: number;
  healthcareQuality: number;
  climateRating: number;
  englishProficiency: number;
  internetSpeed: number; // Mbps average
  workLifeBalance: number;
  // Housing
  avgRent1Bed: number; // Monthly in GBP
  avgRent2Bed: number;
  // Visa/legal
  visaEase: 'easy' | 'moderate' | 'difficult';
  digitalNomadVisa: boolean;
  retirementVisa: boolean;
  // Tax
  incomeTaxRate: number; // Effective rate %
  capitalGainsTax: number;
  // Links
  nomadListUrl?: string;
  expatInfoUrl?: string;
  jobSearchUrls: { name: string; url: string }[];
}

// Job roles with regional salary multipliers
export interface JobRole {
  id: string;
  name: string;
  category: string;
  ukAverageSalary: number;
  // Salary multipliers by location (1.0 = UK average)
  salaryMultipliers: Record<string, number>;
  remoteWorkPotential: 'high' | 'medium' | 'low';
  demandTrend: 'growing' | 'stable' | 'declining';
}

export const JOB_ROLES: JobRole[] = [
  {
    id: 'software_engineer',
    name: 'Software Engineer',
    category: 'Technology',
    ukAverageSalary: 55000,
    salaryMultipliers: {
      london: 1.3, south_east: 1.1, south_west: 0.95, east: 1.0, west_midlands: 0.9,
      east_midlands: 0.85, yorkshire: 0.85, north_west: 0.9, north_east: 0.8,
      wales: 0.8, scotland: 0.9, northern_ireland: 0.8,
      usa_sf: 2.5, usa_nyc: 2.2, usa_austin: 1.8, usa_miami: 1.6,
      portugal: 0.6, spain: 0.65, thailand: 0.4, bali: 0.35, mexico: 0.45,
      dubai: 1.4, singapore: 1.5, germany: 1.1, netherlands: 1.15,
      croatia: 0.5, greece: 0.5, colombia: 0.35, costa_rica: 0.5,
    },
    remoteWorkPotential: 'high',
    demandTrend: 'growing',
  },
  {
    id: 'data_scientist',
    name: 'Data Scientist',
    category: 'Technology',
    ukAverageSalary: 60000,
    salaryMultipliers: {
      london: 1.35, south_east: 1.15, south_west: 0.9, east: 1.0, west_midlands: 0.85,
      east_midlands: 0.8, yorkshire: 0.8, north_west: 0.85, north_east: 0.75,
      wales: 0.75, scotland: 0.85, northern_ireland: 0.75,
      usa_sf: 2.8, usa_nyc: 2.4, usa_austin: 2.0, usa_miami: 1.7,
      portugal: 0.55, spain: 0.6, thailand: 0.35, bali: 0.3, mexico: 0.4,
      dubai: 1.5, singapore: 1.6, germany: 1.15, netherlands: 1.2,
      croatia: 0.45, greece: 0.45, colombia: 0.3, costa_rica: 0.45,
    },
    remoteWorkPotential: 'high',
    demandTrend: 'growing',
  },
  {
    id: 'product_manager',
    name: 'Product Manager',
    category: 'Technology',
    ukAverageSalary: 65000,
    salaryMultipliers: {
      london: 1.4, south_east: 1.1, south_west: 0.9, east: 0.95, west_midlands: 0.85,
      east_midlands: 0.8, yorkshire: 0.8, north_west: 0.85, north_east: 0.7,
      wales: 0.7, scotland: 0.85, northern_ireland: 0.7,
      usa_sf: 2.6, usa_nyc: 2.3, usa_austin: 1.9, usa_miami: 1.5,
      portugal: 0.5, spain: 0.55, thailand: 0.35, bali: 0.3, mexico: 0.4,
      dubai: 1.4, singapore: 1.5, germany: 1.1, netherlands: 1.1,
      croatia: 0.4, greece: 0.4, colombia: 0.3, costa_rica: 0.4,
    },
    remoteWorkPotential: 'high',
    demandTrend: 'growing',
  },
  {
    id: 'ux_designer',
    name: 'UX/UI Designer',
    category: 'Design',
    ukAverageSalary: 45000,
    salaryMultipliers: {
      london: 1.3, south_east: 1.05, south_west: 0.9, east: 0.95, west_midlands: 0.85,
      east_midlands: 0.8, yorkshire: 0.8, north_west: 0.85, north_east: 0.75,
      wales: 0.75, scotland: 0.85, northern_ireland: 0.75,
      usa_sf: 2.2, usa_nyc: 2.0, usa_austin: 1.6, usa_miami: 1.4,
      portugal: 0.5, spain: 0.55, thailand: 0.35, bali: 0.3, mexico: 0.4,
      dubai: 1.2, singapore: 1.3, germany: 1.0, netherlands: 1.05,
      croatia: 0.4, greece: 0.4, colombia: 0.3, costa_rica: 0.4,
    },
    remoteWorkPotential: 'high',
    demandTrend: 'growing',
  },
  {
    id: 'marketing_manager',
    name: 'Marketing Manager',
    category: 'Marketing',
    ukAverageSalary: 50000,
    salaryMultipliers: {
      london: 1.25, south_east: 1.05, south_west: 0.9, east: 0.95, west_midlands: 0.85,
      east_midlands: 0.8, yorkshire: 0.8, north_west: 0.85, north_east: 0.75,
      wales: 0.75, scotland: 0.85, northern_ireland: 0.75,
      usa_sf: 1.8, usa_nyc: 1.7, usa_austin: 1.4, usa_miami: 1.3,
      portugal: 0.5, spain: 0.55, thailand: 0.35, bali: 0.3, mexico: 0.4,
      dubai: 1.3, singapore: 1.3, germany: 1.0, netherlands: 1.0,
      croatia: 0.4, greece: 0.4, colombia: 0.3, costa_rica: 0.4,
    },
    remoteWorkPotential: 'medium',
    demandTrend: 'stable',
  },
  {
    id: 'accountant',
    name: 'Accountant',
    category: 'Finance',
    ukAverageSalary: 42000,
    salaryMultipliers: {
      london: 1.3, south_east: 1.1, south_west: 0.95, east: 1.0, west_midlands: 0.9,
      east_midlands: 0.85, yorkshire: 0.85, north_west: 0.9, north_east: 0.8,
      wales: 0.8, scotland: 0.9, northern_ireland: 0.8,
      usa_sf: 1.6, usa_nyc: 1.5, usa_austin: 1.3, usa_miami: 1.2,
      portugal: 0.45, spain: 0.5, thailand: 0.3, bali: 0.25, mexico: 0.35,
      dubai: 1.4, singapore: 1.4, germany: 1.0, netherlands: 1.0,
      croatia: 0.35, greece: 0.35, colombia: 0.25, costa_rica: 0.35,
    },
    remoteWorkPotential: 'medium',
    demandTrend: 'stable',
  },
  {
    id: 'nurse',
    name: 'Nurse',
    category: 'Healthcare',
    ukAverageSalary: 35000,
    salaryMultipliers: {
      london: 1.15, south_east: 1.05, south_west: 1.0, east: 1.0, west_midlands: 0.95,
      east_midlands: 0.95, yorkshire: 0.95, north_west: 0.95, north_east: 0.9,
      wales: 0.9, scotland: 1.0, northern_ireland: 0.9,
      usa_sf: 2.5, usa_nyc: 2.3, usa_austin: 1.8, usa_miami: 1.6,
      portugal: 0.5, spain: 0.55, thailand: 0.25, bali: 0.2, mexico: 0.3,
      dubai: 1.5, singapore: 1.4, germany: 1.1, netherlands: 1.1,
      croatia: 0.35, greece: 0.4, colombia: 0.2, costa_rica: 0.35,
    },
    remoteWorkPotential: 'low',
    demandTrend: 'growing',
  },
  {
    id: 'teacher',
    name: 'Teacher',
    category: 'Education',
    ukAverageSalary: 32000,
    salaryMultipliers: {
      london: 1.2, south_east: 1.05, south_west: 1.0, east: 1.0, west_midlands: 0.95,
      east_midlands: 0.95, yorkshire: 0.95, north_west: 0.95, north_east: 0.9,
      wales: 0.9, scotland: 1.0, northern_ireland: 0.9,
      usa_sf: 1.8, usa_nyc: 1.7, usa_austin: 1.4, usa_miami: 1.3,
      portugal: 0.4, spain: 0.45, thailand: 0.4, bali: 0.35, mexico: 0.35,
      dubai: 1.6, singapore: 1.5, germany: 1.1, netherlands: 1.1,
      croatia: 0.35, greece: 0.35, colombia: 0.25, costa_rica: 0.4,
    },
    remoteWorkPotential: 'medium',
    demandTrend: 'stable',
  },
  {
    id: 'content_writer',
    name: 'Content Writer/Copywriter',
    category: 'Marketing',
    ukAverageSalary: 35000,
    salaryMultipliers: {
      london: 1.2, south_east: 1.0, south_west: 0.9, east: 0.9, west_midlands: 0.85,
      east_midlands: 0.8, yorkshire: 0.8, north_west: 0.85, north_east: 0.75,
      wales: 0.75, scotland: 0.85, northern_ireland: 0.75,
      usa_sf: 1.6, usa_nyc: 1.5, usa_austin: 1.3, usa_miami: 1.2,
      portugal: 0.5, spain: 0.5, thailand: 0.4, bali: 0.35, mexico: 0.4,
      dubai: 1.1, singapore: 1.2, germany: 0.9, netherlands: 0.95,
      croatia: 0.4, greece: 0.4, colombia: 0.35, costa_rica: 0.4,
    },
    remoteWorkPotential: 'high',
    demandTrend: 'stable',
  },
  {
    id: 'project_manager',
    name: 'Project Manager',
    category: 'Management',
    ukAverageSalary: 52000,
    salaryMultipliers: {
      london: 1.25, south_east: 1.1, south_west: 0.95, east: 1.0, west_midlands: 0.9,
      east_midlands: 0.85, yorkshire: 0.85, north_west: 0.9, north_east: 0.8,
      wales: 0.8, scotland: 0.9, northern_ireland: 0.8,
      usa_sf: 2.0, usa_nyc: 1.9, usa_austin: 1.6, usa_miami: 1.4,
      portugal: 0.55, spain: 0.6, thailand: 0.4, bali: 0.35, mexico: 0.45,
      dubai: 1.4, singapore: 1.4, germany: 1.1, netherlands: 1.1,
      croatia: 0.45, greece: 0.45, colombia: 0.35, costa_rica: 0.45,
    },
    remoteWorkPotential: 'high',
    demandTrend: 'stable',
  },
  {
    id: 'freelance_consultant',
    name: 'Freelance Consultant',
    category: 'Consulting',
    ukAverageSalary: 60000,
    salaryMultipliers: {
      london: 1.3, south_east: 1.1, south_west: 1.0, east: 1.0, west_midlands: 0.95,
      east_midlands: 0.9, yorkshire: 0.9, north_west: 0.95, north_east: 0.85,
      wales: 0.85, scotland: 0.95, northern_ireland: 0.85,
      usa_sf: 2.2, usa_nyc: 2.0, usa_austin: 1.7, usa_miami: 1.5,
      portugal: 0.7, spain: 0.7, thailand: 0.6, bali: 0.55, mexico: 0.6,
      dubai: 1.5, singapore: 1.5, germany: 1.2, netherlands: 1.2,
      croatia: 0.6, greece: 0.6, colombia: 0.5, costa_rica: 0.6,
    },
    remoteWorkPotential: 'high',
    demandTrend: 'growing',
  },
  {
    id: 'custom',
    name: 'Custom / Other',
    category: 'Other',
    ukAverageSalary: 40000,
    salaryMultipliers: {
      london: 1.2, south_east: 1.05, south_west: 0.95, east: 1.0, west_midlands: 0.9,
      east_midlands: 0.85, yorkshire: 0.85, north_west: 0.9, north_east: 0.8,
      wales: 0.8, scotland: 0.9, northern_ireland: 0.8,
      usa_sf: 1.5, usa_nyc: 1.4, usa_austin: 1.2, usa_miami: 1.1,
      portugal: 0.5, spain: 0.55, thailand: 0.35, bali: 0.3, mexico: 0.4,
      dubai: 1.3, singapore: 1.3, germany: 1.0, netherlands: 1.0,
      croatia: 0.4, greece: 0.4, colombia: 0.3, costa_rica: 0.4,
    },
    remoteWorkPotential: 'medium',
    demandTrend: 'stable',
  },
];

// UK Regions
export const UK_LOCATIONS: Location[] = [
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    type: 'uk',
    flag: '🇬🇧',
    housingIndex: 175,
    transportIndex: 130,
    groceriesIndex: 108,
    utilitiesIndex: 105,
    entertainmentIndex: 125,
    healthcareIndex: 100,
    safetyRating: 7,
    healthcareQuality: 8,
    climateRating: 5,
    englishProficiency: 10,
    internetSpeed: 80,
    workLifeBalance: 5,
    avgRent1Bed: 1800,
    avgRent2Bed: 2400,
    visaEase: 'easy',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 32,
    capitalGainsTax: 20,
    jobSearchUrls: [
      { name: 'LinkedIn UK', url: 'https://www.linkedin.com/jobs/search/?location=London' },
      { name: 'Indeed UK', url: 'https://uk.indeed.com/jobs?l=London' },
      { name: 'Reed', url: 'https://www.reed.co.uk/jobs/in-london' },
    ],
  },
  {
    id: 'south_east',
    name: 'South East',
    country: 'United Kingdom',
    type: 'uk',
    flag: '🇬🇧',
    housingIndex: 140,
    transportIndex: 110,
    groceriesIndex: 103,
    utilitiesIndex: 100,
    entertainmentIndex: 105,
    healthcareIndex: 100,
    safetyRating: 8,
    healthcareQuality: 8,
    climateRating: 6,
    englishProficiency: 10,
    internetSpeed: 70,
    workLifeBalance: 6,
    avgRent1Bed: 1100,
    avgRent2Bed: 1400,
    visaEase: 'easy',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 32,
    capitalGainsTax: 20,
    jobSearchUrls: [
      { name: 'LinkedIn UK', url: 'https://www.linkedin.com/jobs/search/?location=South%20East%20England' },
      { name: 'Indeed UK', url: 'https://uk.indeed.com/jobs?l=South+East' },
    ],
  },
  {
    id: 'manchester',
    name: 'Manchester',
    country: 'United Kingdom',
    type: 'uk',
    flag: '🇬🇧',
    housingIndex: 90,
    transportIndex: 95,
    groceriesIndex: 97,
    utilitiesIndex: 96,
    entertainmentIndex: 92,
    healthcareIndex: 100,
    safetyRating: 7,
    healthcareQuality: 8,
    climateRating: 4,
    englishProficiency: 10,
    internetSpeed: 75,
    workLifeBalance: 7,
    avgRent1Bed: 850,
    avgRent2Bed: 1100,
    visaEase: 'easy',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 32,
    capitalGainsTax: 20,
    jobSearchUrls: [
      { name: 'LinkedIn UK', url: 'https://www.linkedin.com/jobs/search/?location=Manchester' },
      { name: 'Indeed UK', url: 'https://uk.indeed.com/jobs?l=Manchester' },
    ],
  },
  {
    id: 'edinburgh',
    name: 'Edinburgh',
    country: 'United Kingdom',
    type: 'uk',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    housingIndex: 95,
    transportIndex: 95,
    groceriesIndex: 98,
    utilitiesIndex: 98,
    entertainmentIndex: 95,
    healthcareIndex: 100,
    safetyRating: 8,
    healthcareQuality: 9,
    climateRating: 4,
    englishProficiency: 10,
    internetSpeed: 70,
    workLifeBalance: 7,
    avgRent1Bed: 950,
    avgRent2Bed: 1250,
    visaEase: 'easy',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 32,
    capitalGainsTax: 20,
    jobSearchUrls: [
      { name: 'LinkedIn UK', url: 'https://www.linkedin.com/jobs/search/?location=Edinburgh' },
      { name: 's1jobs', url: 'https://www.s1jobs.com/jobs/edinburgh/' },
    ],
  },
  {
    id: 'bristol',
    name: 'Bristol',
    country: 'United Kingdom',
    type: 'uk',
    flag: '🇬🇧',
    housingIndex: 110,
    transportIndex: 100,
    groceriesIndex: 100,
    utilitiesIndex: 98,
    entertainmentIndex: 100,
    healthcareIndex: 100,
    safetyRating: 7,
    healthcareQuality: 8,
    climateRating: 6,
    englishProficiency: 10,
    internetSpeed: 72,
    workLifeBalance: 7,
    avgRent1Bed: 1000,
    avgRent2Bed: 1300,
    visaEase: 'easy',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 32,
    capitalGainsTax: 20,
    jobSearchUrls: [
      { name: 'LinkedIn UK', url: 'https://www.linkedin.com/jobs/search/?location=Bristol' },
      { name: 'Indeed UK', url: 'https://uk.indeed.com/jobs?l=Bristol' },
    ],
  },
];

// International Locations
export const INTERNATIONAL_LOCATIONS: Location[] = [
  // Americas
  {
    id: 'usa_sf',
    name: 'San Francisco',
    country: 'United States',
    type: 'international',
    flag: '🇺🇸',
    housingIndex: 250,
    transportIndex: 120,
    groceriesIndex: 115,
    utilitiesIndex: 95,
    entertainmentIndex: 130,
    healthcareIndex: 180,
    safetyRating: 6,
    healthcareQuality: 9,
    climateRating: 8,
    englishProficiency: 10,
    internetSpeed: 150,
    workLifeBalance: 4,
    avgRent1Bed: 2800,
    avgRent2Bed: 3800,
    visaEase: 'difficult',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 37,
    capitalGainsTax: 23,
    nomadListUrl: 'https://nomadlist.com/san-francisco',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-usa',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=San%20Francisco' },
      { name: 'Indeed', url: 'https://www.indeed.com/jobs?l=San+Francisco' },
      { name: 'AngelList', url: 'https://angel.co/location/san-francisco' },
    ],
  },
  {
    id: 'usa_nyc',
    name: 'New York City',
    country: 'United States',
    type: 'international',
    flag: '🇺🇸',
    housingIndex: 230,
    transportIndex: 110,
    groceriesIndex: 112,
    utilitiesIndex: 100,
    entertainmentIndex: 140,
    healthcareIndex: 175,
    safetyRating: 7,
    healthcareQuality: 9,
    climateRating: 6,
    englishProficiency: 10,
    internetSpeed: 120,
    workLifeBalance: 4,
    avgRent1Bed: 2600,
    avgRent2Bed: 3500,
    visaEase: 'difficult',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 40,
    capitalGainsTax: 23,
    nomadListUrl: 'https://nomadlist.com/new-york-city',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=New%20York' },
      { name: 'Indeed', url: 'https://www.indeed.com/jobs?l=New+York' },
      { name: 'BuiltInNYC', url: 'https://www.builtinnyc.com/jobs' },
    ],
  },
  {
    id: 'usa_austin',
    name: 'Austin, Texas',
    country: 'United States',
    type: 'international',
    flag: '🇺🇸',
    housingIndex: 150,
    transportIndex: 100,
    groceriesIndex: 95,
    utilitiesIndex: 90,
    entertainmentIndex: 105,
    healthcareIndex: 160,
    safetyRating: 7,
    healthcareQuality: 8,
    climateRating: 6,
    englishProficiency: 10,
    internetSpeed: 130,
    workLifeBalance: 6,
    avgRent1Bed: 1500,
    avgRent2Bed: 2000,
    visaEase: 'difficult',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 25,
    capitalGainsTax: 20,
    nomadListUrl: 'https://nomadlist.com/austin',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Austin' },
      { name: 'Indeed', url: 'https://www.indeed.com/jobs?l=Austin' },
      { name: 'BuiltInAustin', url: 'https://www.builtinaustin.com/jobs' },
    ],
  },
  {
    id: 'usa_miami',
    name: 'Miami',
    country: 'United States',
    type: 'international',
    flag: '🇺🇸',
    housingIndex: 160,
    transportIndex: 105,
    groceriesIndex: 100,
    utilitiesIndex: 95,
    entertainmentIndex: 115,
    healthcareIndex: 165,
    safetyRating: 6,
    healthcareQuality: 8,
    climateRating: 7,
    englishProficiency: 9,
    internetSpeed: 120,
    workLifeBalance: 6,
    avgRent1Bed: 1800,
    avgRent2Bed: 2400,
    visaEase: 'difficult',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 25,
    capitalGainsTax: 20,
    nomadListUrl: 'https://nomadlist.com/miami',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Miami' },
      { name: 'Indeed', url: 'https://www.indeed.com/jobs?l=Miami' },
    ],
  },
  {
    id: 'mexico',
    name: 'Mexico City',
    country: 'Mexico',
    type: 'international',
    flag: '🇲🇽',
    housingIndex: 45,
    transportIndex: 35,
    groceriesIndex: 50,
    utilitiesIndex: 40,
    entertainmentIndex: 40,
    healthcareIndex: 35,
    safetyRating: 5,
    healthcareQuality: 7,
    climateRating: 8,
    englishProficiency: 5,
    internetSpeed: 50,
    workLifeBalance: 7,
    avgRent1Bed: 500,
    avgRent2Bed: 750,
    visaEase: 'easy',
    digitalNomadVisa: true,
    retirementVisa: true,
    incomeTaxRate: 30,
    capitalGainsTax: 10,
    nomadListUrl: 'https://nomadlist.com/mexico-city',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-mexico',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Mexico%20City' },
      { name: 'Indeed Mexico', url: 'https://mx.indeed.com/jobs?l=Ciudad+de+M%C3%A9xico' },
      { name: 'Remote OK', url: 'https://remoteok.com' },
    ],
  },
  {
    id: 'colombia',
    name: 'Medellín',
    country: 'Colombia',
    type: 'international',
    flag: '🇨🇴',
    housingIndex: 35,
    transportIndex: 25,
    groceriesIndex: 40,
    utilitiesIndex: 30,
    entertainmentIndex: 30,
    healthcareIndex: 25,
    safetyRating: 6,
    healthcareQuality: 7,
    climateRating: 9,
    englishProficiency: 4,
    internetSpeed: 45,
    workLifeBalance: 8,
    avgRent1Bed: 400,
    avgRent2Bed: 600,
    visaEase: 'easy',
    digitalNomadVisa: true,
    retirementVisa: true,
    incomeTaxRate: 25,
    capitalGainsTax: 10,
    nomadListUrl: 'https://nomadlist.com/medellin',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-colombia',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Medell%C3%ADn' },
      { name: 'Remote OK', url: 'https://remoteok.com' },
      { name: 'We Work Remotely', url: 'https://weworkremotely.com' },
    ],
  },
  {
    id: 'costa_rica',
    name: 'San José',
    country: 'Costa Rica',
    type: 'international',
    flag: '🇨🇷',
    housingIndex: 55,
    transportIndex: 45,
    groceriesIndex: 60,
    utilitiesIndex: 50,
    entertainmentIndex: 50,
    healthcareIndex: 40,
    safetyRating: 7,
    healthcareQuality: 7,
    climateRating: 9,
    englishProficiency: 5,
    internetSpeed: 40,
    workLifeBalance: 9,
    avgRent1Bed: 600,
    avgRent2Bed: 850,
    visaEase: 'moderate',
    digitalNomadVisa: true,
    retirementVisa: true,
    incomeTaxRate: 25,
    capitalGainsTax: 0,
    nomadListUrl: 'https://nomadlist.com/san-jose-costa-rica',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-costa-rica',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Costa%20Rica' },
      { name: 'Remote OK', url: 'https://remoteok.com' },
    ],
  },
  // Europe
  {
    id: 'portugal',
    name: 'Lisbon',
    country: 'Portugal',
    type: 'international',
    flag: '🇵🇹',
    housingIndex: 80,
    transportIndex: 55,
    groceriesIndex: 65,
    utilitiesIndex: 70,
    entertainmentIndex: 55,
    healthcareIndex: 50,
    safetyRating: 9,
    healthcareQuality: 8,
    climateRating: 9,
    englishProficiency: 7,
    internetSpeed: 100,
    workLifeBalance: 8,
    avgRent1Bed: 950,
    avgRent2Bed: 1300,
    visaEase: 'moderate',
    digitalNomadVisa: true,
    retirementVisa: true,
    incomeTaxRate: 28,
    capitalGainsTax: 28,
    nomadListUrl: 'https://nomadlist.com/lisbon',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-portugal',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Lisbon' },
      { name: 'Landing.jobs', url: 'https://landing.jobs/jobs?location=Lisbon' },
      { name: 'ITjobs.pt', url: 'https://www.itjobs.pt' },
    ],
  },
  {
    id: 'spain',
    name: 'Barcelona',
    country: 'Spain',
    type: 'international',
    flag: '🇪🇸',
    housingIndex: 90,
    transportIndex: 60,
    groceriesIndex: 65,
    utilitiesIndex: 75,
    entertainmentIndex: 60,
    healthcareIndex: 55,
    safetyRating: 8,
    healthcareQuality: 9,
    climateRating: 9,
    englishProficiency: 6,
    internetSpeed: 95,
    workLifeBalance: 8,
    avgRent1Bed: 1000,
    avgRent2Bed: 1400,
    visaEase: 'moderate',
    digitalNomadVisa: true,
    retirementVisa: true,
    incomeTaxRate: 35,
    capitalGainsTax: 23,
    nomadListUrl: 'https://nomadlist.com/barcelona',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-spain',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Barcelona' },
      { name: 'InfoJobs', url: 'https://www.infojobs.net/ofertas-trabajo/barcelona' },
    ],
  },
  {
    id: 'germany',
    name: 'Berlin',
    country: 'Germany',
    type: 'international',
    flag: '🇩🇪',
    housingIndex: 95,
    transportIndex: 75,
    groceriesIndex: 75,
    utilitiesIndex: 90,
    entertainmentIndex: 70,
    healthcareIndex: 85,
    safetyRating: 8,
    healthcareQuality: 9,
    climateRating: 5,
    englishProficiency: 8,
    internetSpeed: 85,
    workLifeBalance: 8,
    avgRent1Bed: 1100,
    avgRent2Bed: 1500,
    visaEase: 'moderate',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 42,
    capitalGainsTax: 26,
    nomadListUrl: 'https://nomadlist.com/berlin',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-germany',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Berlin' },
      { name: 'StepStone', url: 'https://www.stepstone.de/jobs/berlin.html' },
      { name: 'Berlin Startup Jobs', url: 'https://berlinstartupjobs.com' },
    ],
  },
  {
    id: 'netherlands',
    name: 'Amsterdam',
    country: 'Netherlands',
    type: 'international',
    flag: '🇳🇱',
    housingIndex: 130,
    transportIndex: 80,
    groceriesIndex: 80,
    utilitiesIndex: 95,
    entertainmentIndex: 85,
    healthcareIndex: 90,
    safetyRating: 9,
    healthcareQuality: 9,
    climateRating: 5,
    englishProficiency: 9,
    internetSpeed: 100,
    workLifeBalance: 9,
    avgRent1Bed: 1500,
    avgRent2Bed: 2000,
    visaEase: 'moderate',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 40,
    capitalGainsTax: 30,
    nomadListUrl: 'https://nomadlist.com/amsterdam',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-netherlands',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Amsterdam' },
      { name: 'Indeed NL', url: 'https://nl.indeed.com/vacatures?l=Amsterdam' },
    ],
  },
  {
    id: 'croatia',
    name: 'Split',
    country: 'Croatia',
    type: 'international',
    flag: '🇭🇷',
    housingIndex: 55,
    transportIndex: 45,
    groceriesIndex: 55,
    utilitiesIndex: 55,
    entertainmentIndex: 45,
    healthcareIndex: 40,
    safetyRating: 9,
    healthcareQuality: 7,
    climateRating: 9,
    englishProficiency: 6,
    internetSpeed: 60,
    workLifeBalance: 8,
    avgRent1Bed: 600,
    avgRent2Bed: 850,
    visaEase: 'easy',
    digitalNomadVisa: true,
    retirementVisa: true,
    incomeTaxRate: 30,
    capitalGainsTax: 10,
    nomadListUrl: 'https://nomadlist.com/split',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-croatia',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Croatia' },
      { name: 'Remote OK', url: 'https://remoteok.com' },
    ],
  },
  {
    id: 'greece',
    name: 'Athens',
    country: 'Greece',
    type: 'international',
    flag: '🇬🇷',
    housingIndex: 50,
    transportIndex: 45,
    groceriesIndex: 55,
    utilitiesIndex: 60,
    entertainmentIndex: 45,
    healthcareIndex: 45,
    safetyRating: 8,
    healthcareQuality: 7,
    climateRating: 9,
    englishProficiency: 6,
    internetSpeed: 50,
    workLifeBalance: 7,
    avgRent1Bed: 550,
    avgRent2Bed: 750,
    visaEase: 'moderate',
    digitalNomadVisa: true,
    retirementVisa: true,
    incomeTaxRate: 35,
    capitalGainsTax: 15,
    nomadListUrl: 'https://nomadlist.com/athens',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-greece',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Athens' },
      { name: 'Kariera', url: 'https://www.kariera.gr' },
    ],
  },
  // Asia
  {
    id: 'thailand',
    name: 'Bangkok',
    country: 'Thailand',
    type: 'international',
    flag: '🇹🇭',
    housingIndex: 35,
    transportIndex: 25,
    groceriesIndex: 40,
    utilitiesIndex: 35,
    entertainmentIndex: 30,
    healthcareIndex: 25,
    safetyRating: 7,
    healthcareQuality: 8,
    climateRating: 6,
    englishProficiency: 4,
    internetSpeed: 70,
    workLifeBalance: 8,
    avgRent1Bed: 400,
    avgRent2Bed: 650,
    visaEase: 'moderate',
    digitalNomadVisa: true,
    retirementVisa: true,
    incomeTaxRate: 25,
    capitalGainsTax: 0,
    nomadListUrl: 'https://nomadlist.com/bangkok',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-thailand',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Bangkok' },
      { name: 'JobsDB', url: 'https://th.jobsdb.com' },
      { name: 'Remote OK', url: 'https://remoteok.com' },
    ],
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    type: 'international',
    flag: '🇮🇩',
    housingIndex: 30,
    transportIndex: 20,
    groceriesIndex: 35,
    utilitiesIndex: 30,
    entertainmentIndex: 25,
    healthcareIndex: 20,
    safetyRating: 8,
    healthcareQuality: 6,
    climateRating: 8,
    englishProficiency: 5,
    internetSpeed: 35,
    workLifeBalance: 9,
    avgRent1Bed: 350,
    avgRent2Bed: 550,
    visaEase: 'moderate',
    digitalNomadVisa: true,
    retirementVisa: true,
    incomeTaxRate: 30,
    capitalGainsTax: 0,
    nomadListUrl: 'https://nomadlist.com/bali',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-indonesia',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Bali' },
      { name: 'Remote OK', url: 'https://remoteok.com' },
      { name: 'We Work Remotely', url: 'https://weworkremotely.com' },
    ],
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    type: 'international',
    flag: '🇸🇬',
    housingIndex: 180,
    transportIndex: 85,
    groceriesIndex: 90,
    utilitiesIndex: 85,
    entertainmentIndex: 100,
    healthcareIndex: 120,
    safetyRating: 10,
    healthcareQuality: 10,
    climateRating: 5,
    englishProficiency: 9,
    internetSpeed: 200,
    workLifeBalance: 5,
    avgRent1Bed: 2000,
    avgRent2Bed: 3000,
    visaEase: 'moderate',
    digitalNomadVisa: false,
    retirementVisa: false,
    incomeTaxRate: 22,
    capitalGainsTax: 0,
    nomadListUrl: 'https://nomadlist.com/singapore',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-singapore',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Singapore' },
      { name: 'JobStreet', url: 'https://www.jobstreet.com.sg' },
    ],
  },
  // Middle East
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    type: 'international',
    flag: '🇦🇪',
    housingIndex: 140,
    transportIndex: 70,
    groceriesIndex: 85,
    utilitiesIndex: 75,
    entertainmentIndex: 100,
    healthcareIndex: 100,
    safetyRating: 9,
    healthcareQuality: 9,
    climateRating: 4,
    englishProficiency: 8,
    internetSpeed: 120,
    workLifeBalance: 5,
    avgRent1Bed: 1400,
    avgRent2Bed: 2200,
    visaEase: 'moderate',
    digitalNomadVisa: true,
    retirementVisa: true,
    incomeTaxRate: 0,
    capitalGainsTax: 0,
    nomadListUrl: 'https://nomadlist.com/dubai',
    expatInfoUrl: 'https://www.expatfocus.com/expatriate-uae',
    jobSearchUrls: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?location=Dubai' },
      { name: 'Bayt', url: 'https://www.bayt.com/en/uae/jobs/in/dubai/' },
      { name: 'GulfTalent', url: 'https://www.gulftalent.com/uae/jobs' },
    ],
  },
];

// Combine all locations
export const ALL_LOCATIONS: Location[] = [...UK_LOCATIONS, ...INTERNATIONAL_LOCATIONS];

export interface GeoArbitrageInputs {
  currentLocationId: string;
  targetLocationId: string;
  jobRoleId: string;
  customSalary?: number; // Override for custom job role
  isRemoteWork: boolean;
  remoteSalaryRetention: number;
  housingType: 'rent_1bed' | 'rent_2bed';
  monthlyExpenses: {
    transport: number;
    groceries: number;
    utilities: number;
    entertainment: number;
    healthcare: number;
  };
  showAllLocations: boolean;
}

export interface LocationResult {
  location: Location;
  expectedSalary: number;
  salaryDifference: number;
  monthlyCosts: {
    housing: number;
    transport: number;
    groceries: number;
    utilities: number;
    entertainment: number;
    healthcare: number;
    total: number;
  };
  annualCosts: number;
  annualSavings: number;
  effectiveGain: number;
  purchasingPowerIndex: number;
  lifestyleScore: number;
  overallScore: number;
}

export interface GeoArbitrageResults {
  currentLocation: LocationResult;
  targetLocation: LocationResult;
  allLocations: LocationResult[];
  bestForMoney: string;
  bestForLifestyle: string;
  bestOverall: string;
  netAnnualBenefit: number;
  monthlySavings: number;
}

export function calculateGeoArbitrage(inputs: GeoArbitrageInputs): GeoArbitrageResults {
  const currentLocation = ALL_LOCATIONS.find(l => l.id === inputs.currentLocationId)!;
  const jobRole = JOB_ROLES.find(j => j.id === inputs.jobRoleId)!;

  const baseSalary = inputs.customSalary || jobRole.ukAverageSalary;
  const currentMultiplier = jobRole.salaryMultipliers[inputs.currentLocationId] || 1.0;
  const currentSalary = baseSalary * currentMultiplier;

  const calculateLocationResult = (location: Location): LocationResult => {
    // Calculate salary
    let expectedSalary: number;
    if (inputs.isRemoteWork) {
      expectedSalary = currentSalary * (inputs.remoteSalaryRetention / 100);
    } else {
      const multiplier = jobRole.salaryMultipliers[location.id] || 1.0;
      expectedSalary = baseSalary * multiplier;
    }

    // Calculate costs based on indices
    const housingCost = inputs.housingType === 'rent_1bed'
      ? location.avgRent1Bed
      : location.avgRent2Bed;

    const transportCost = inputs.monthlyExpenses.transport * (location.transportIndex / 100);
    const groceriesCost = inputs.monthlyExpenses.groceries * (location.groceriesIndex / 100);
    const utilitiesCost = inputs.monthlyExpenses.utilities * (location.utilitiesIndex / 100);
    const entertainmentCost = inputs.monthlyExpenses.entertainment * (location.entertainmentIndex / 100);
    const healthcareCost = inputs.monthlyExpenses.healthcare * (location.healthcareIndex / 100);

    const totalMonthlyCosts = housingCost + transportCost + groceriesCost +
      utilitiesCost + entertainmentCost + healthcareCost;
    const annualCosts = totalMonthlyCosts * 12;

    // Lifestyle score (average of lifestyle metrics)
    const lifestyleScore = (
      location.safetyRating +
      location.healthcareQuality +
      location.climateRating +
      location.englishProficiency / 1.5 +
      location.workLifeBalance
    ) / 5;

    return {
      location,
      expectedSalary: Math.round(expectedSalary),
      salaryDifference: 0, // Will be set after
      monthlyCosts: {
        housing: Math.round(housingCost),
        transport: Math.round(transportCost),
        groceries: Math.round(groceriesCost),
        utilities: Math.round(utilitiesCost),
        entertainment: Math.round(entertainmentCost),
        healthcare: Math.round(healthcareCost),
        total: Math.round(totalMonthlyCosts),
      },
      annualCosts: Math.round(annualCosts),
      annualSavings: 0,
      effectiveGain: 0,
      purchasingPowerIndex: 100,
      lifestyleScore: Math.round(lifestyleScore * 10) / 10,
      overallScore: 0,
    };
  };

  // Calculate for all locations
  const allResults = ALL_LOCATIONS.map(calculateLocationResult);

  // Get current location result
  const currentResult = allResults.find(r => r.location.id === inputs.currentLocationId)!;

  // Calculate comparative metrics
  allResults.forEach(result => {
    result.salaryDifference = result.expectedSalary - currentResult.expectedSalary;
    result.annualSavings = currentResult.annualCosts - result.annualCosts;
    result.effectiveGain = result.salaryDifference + result.annualSavings;

    // Purchasing power = salary / costs relative to current
    const currentPP = currentResult.expectedSalary / currentResult.annualCosts;
    const resultPP = result.expectedSalary / result.annualCosts;
    result.purchasingPowerIndex = Math.round((resultPP / currentPP) * 100);

    // Overall score combines financial and lifestyle
    result.overallScore = Math.round(
      (result.purchasingPowerIndex * 0.5) + (result.lifestyleScore * 10 * 0.5)
    );
  });

  const targetResult = allResults.find(r => r.location.id === inputs.targetLocationId)!;

  // Find best locations
  const sortedByMoney = [...allResults].sort((a, b) => b.purchasingPowerIndex - a.purchasingPowerIndex);
  const sortedByLifestyle = [...allResults].sort((a, b) => b.lifestyleScore - a.lifestyleScore);
  const sortedByOverall = [...allResults].sort((a, b) => b.overallScore - a.overallScore);

  return {
    currentLocation: currentResult,
    targetLocation: targetResult,
    allLocations: allResults,
    bestForMoney: sortedByMoney[0].location.name,
    bestForLifestyle: sortedByLifestyle[0].location.name,
    bestOverall: sortedByOverall[0].location.name,
    netAnnualBenefit: targetResult.effectiveGain,
    monthlySavings: Math.round(targetResult.annualSavings / 12),
  };
}

export function getDefaultGeoArbitrageInputs(): GeoArbitrageInputs {
  return {
    currentLocationId: 'london',
    targetLocationId: 'portugal',
    jobRoleId: 'software_engineer',
    isRemoteWork: true,
    remoteSalaryRetention: 100,
    housingType: 'rent_1bed',
    monthlyExpenses: {
      transport: 150,
      groceries: 300,
      utilities: 150,
      entertainment: 200,
      healthcare: 50,
    },
    showAllLocations: false,
  };
}
