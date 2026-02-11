// UK Tax Rates 2025/26
import type { TaxConfig } from '@/types/calculator';

export const TAX_CONFIG: TaxConfig = {
  personalAllowance: 12570,
  personalAllowanceTaperThreshold: 100000,

  england: {
    bands: [
      { threshold: 12570, rate: 0 },
      { threshold: 50270, rate: 0.20 },
      { threshold: 125140, rate: 0.40 },
      { threshold: Infinity, rate: 0.45 }
    ]
  },

  scotland: {
    bands: [
      { threshold: 12570, rate: 0 },
      { threshold: 14921, rate: 0.19 },   // Starter rate
      { threshold: 26861, rate: 0.20 },   // Basic rate
      { threshold: 44605, rate: 0.21 },   // Intermediate rate
      { threshold: 78149, rate: 0.42 },   // Higher rate
      { threshold: 125140, rate: 0.45 },  // Advanced rate
      { threshold: Infinity, rate: 0.48 } // Top rate
    ]
  },

  nationalInsurance: {
    primaryThreshold: 12570,
    upperEarningsLimit: 50270,
    mainRate: 0.08,
    upperRate: 0.02
  },

  studentLoans: {
    plan1: { threshold: 25375, rate: 0.09 },
    plan2: { threshold: 27660, rate: 0.09 },
    plan4: { threshold: 31395, rate: 0.09 },
    plan5: { threshold: 25000, rate: 0.09 },
    postgrad: { threshold: 21000, rate: 0.06 }
  }
};

// Chart colors
export const COLORS = {
  accent: '#10b981',
  accentLight: 'rgba(16, 185, 129, 0.2)',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  neutral: {
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626'
  }
};
