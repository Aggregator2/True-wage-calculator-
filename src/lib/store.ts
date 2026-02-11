import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalculationInputs, CalculationResults } from '@/types/calculator';
import type { User } from '@supabase/supabase-js';

export type SubscriptionStatus = 'free' | 'premium' | 'lifetime' | null;

interface CalculatorState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // Subscription
  subscriptionStatus: SubscriptionStatus;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;

  // Inputs
  inputs: CalculationInputs;
  setInputs: (inputs: Partial<CalculationInputs>) => void;
  resetInputs: () => void;

  // Results
  results: CalculationResults | null;
  setResults: (results: CalculationResults | null) => void;

  // UI State
  showAuthModal: boolean;
  authModalView: 'sign_in' | 'sign_up';
  setShowAuthModal: (show: boolean, view?: 'sign_in' | 'sign_up') => void;

  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;

  // PDF Downloads (for non-logged-in users)
  pdfDownloadsUsed: number;
  incrementPdfDownloads: () => void;
}

const defaultInputs: CalculationInputs = {
  salary: 35000,
  taxRegion: 'england',
  studentLoan: 'none',
  pensionPercent: 5,
  contractHours: 37.5,
  commuteMinutes: 56,
  unpaidBreak: 30,
  prepTime: 30,
  workDays: 5,
  holidayDays: 28,
  commuteCost: 0,
  workClothes: 0,
  stressTax: 0,
};

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => {
        if (!user) {
          set({ user: null, subscriptionStatus: null });
        } else {
          set({ user });
        }
      },

      // Subscription
      subscriptionStatus: null,
      setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),

      // Inputs
      inputs: defaultInputs,
      setInputs: (newInputs) =>
        set((state) => ({
          inputs: { ...state.inputs, ...newInputs },
        })),
      resetInputs: () => set({ inputs: defaultInputs }),

      // Results
      results: null,
      setResults: (results) => set({ results }),

      // UI State
      showAuthModal: false,
      authModalView: 'sign_in',
      setShowAuthModal: (show, view = 'sign_in') =>
        set({ showAuthModal: show, authModalView: view }),

      showPremiumModal: false,
      setShowPremiumModal: (show) => set({ showPremiumModal: show }),

      // PDF Downloads
      pdfDownloadsUsed: 0,
      incrementPdfDownloads: () =>
        set((state) => ({ pdfDownloadsUsed: state.pdfDownloadsUsed + 1 })),
    }),
    {
      name: 'truewage-calculator',
      partialize: (state) => ({
        inputs: state.inputs,
        pdfDownloadsUsed: state.pdfDownloadsUsed,
      }),
    }
  )
);

// Derived selector — use this in components
export const useIsPremium = () =>
  useCalculatorStore((s) => s.subscriptionStatus === 'premium' || s.subscriptionStatus === 'lifetime');
