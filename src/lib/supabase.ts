import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { CalculationInputs, CalculationResults } from '@/types/calculator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a mock client for build time when env vars aren't available
const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a minimal mock for SSR/build when env vars aren't set
    console.warn('Supabase credentials not configured. Authentication features will be disabled.');
    const mockError = { message: 'Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.' };
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: mockError }),
        signInWithOAuth: async () => ({ data: { provider: null, url: null }, error: mockError }),
        signUp: async () => ({ data: { user: null, session: null }, error: mockError }),
      },
      from: () => ({
        select: () => ({
          data: [],
          error: null,
          order: () => ({ data: [], error: null }),
          eq: () => ({ data: [], error: null }),
          single: () => ({ data: null, error: null }),
        }),
        insert: () => ({ data: null, error: mockError, select: () => ({ single: () => ({ data: null, error: mockError }) }) }),
        update: () => ({ data: null, error: mockError }),
        delete: () => ({ data: null, error: mockError, eq: () => ({ data: null, error: mockError }) }),
      }),
    } as unknown as SupabaseClient;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

// Database Types
export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  subscription_status: 'free' | 'premium' | 'lifetime';
  subscription_expires_at?: string;
  pdf_downloads_remaining: number;
}

export interface SavedScenario {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  calculation_data: CalculationInputs;
  calculation_results: CalculationResults;
  is_favorite?: boolean;
}

export interface ProgressSnapshot {
  id: string;
  user_id: string;
  recorded_at: string;
  freedom_score: number;
  net_worth?: number;
  true_hourly_wage: number;
  months_to_fi?: number;
  savings_rate?: number;
}

export interface EmailSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  gdpr_consent: boolean;
  source: string;
}
