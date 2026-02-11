import { supabase } from './supabase';
import type { CalculationInputs, CalculationResults } from '@/types/calculator';
import type { SavedScenario } from './supabase';

// ============================================================================
// EXISTING SAVED_SCENARIOS FUNCTIONS (kept for backward compatibility)
// ============================================================================

export async function saveScenario(
  name: string,
  inputs: CalculationInputs,
  results: CalculationResults
): Promise<SavedScenario> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Must be logged in to save scenarios');
  }

  const { data, error } = await supabase
    .from('saved_scenarios')
    .insert({
      user_id: user.id,
      name,
      calculation_data: inputs,
      calculation_results: results,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSavedScenarios(): Promise<SavedScenario[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_scenarios')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteScenario(scenarioId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_scenarios')
    .delete()
    .eq('id', scenarioId);

  if (error) throw error;
}

export async function updateScenario(
  scenarioId: string,
  updates: { name?: string; calculation_data?: CalculationInputs; calculation_results?: CalculationResults }
): Promise<SavedScenario> {
  const { data, error } = await supabase
    .from('saved_scenarios')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', scenarioId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleFavorite(scenarioId: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase
    .from('saved_scenarios')
    .update({ is_favorite: isFavorite })
    .eq('id', scenarioId);

  if (error) throw error;
}

// ============================================================================
// NEW MULTI-CALCULATOR SCENARIO SYSTEM
// ============================================================================

export type CalculatorType =
  | 'main'
  | 'commute'
  | 'geo'
  | 'pension'
  | 'car'
  | 'student-loans'
  | 'wfh'
  | 'intensity'
  | 'carers'
  | 'fire'
  | 'opportunity';

export type ScenarioType = 'primary' | 'comparison';

export interface MultiScenario {
  id: string;
  user_id: string;
  scenario_type: ScenarioType;
  is_primary: boolean;
  name: string;
  description?: string;
  calculator_type: CalculatorType;
  data: {
    inputs: any;
    results: any;
    timestamp: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Auto-save primary scenario when user completes main calculator
 * This represents their "current reality"
 */
export async function savePrimaryScenario(
  userId: string,
  inputs: CalculationInputs,
  results: CalculationResults
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, check if primary exists (use maybeSingle to handle 0 rows)
    const { data: existing, error: selectError } = await supabase
      .from('scenarios')
      .select('id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle();

    // If there's a real error (not just "no rows"), throw it
    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    const scenarioData = {
      user_id: userId,
      scenario_type: 'primary' as ScenarioType,
      is_primary: true,
      name: 'My Current Situation',
      calculator_type: 'main' as CalculatorType,
      data: {
        inputs,
        results,
        timestamp: new Date().toISOString(),
      },
    };

    if (existing) {
      // Update existing primary
      const { error } = await supabase
        .from('scenarios')
        .update({
          data: scenarioData.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new primary
      const { error } = await supabase
        .from('scenarios')
        .insert(scenarioData);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving primary scenario:', error);
    return { success: false, error: 'Failed to save scenario' };
  }
}

/**
 * Save a comparison scenario (user explicitly saves a what-if)
 */
export async function saveComparisonScenario(
  userId: string,
  name: string,
  calculatorType: CalculatorType,
  data: { inputs: any; results: any },
  description?: string
): Promise<{ success: boolean; scenarioId?: string; error?: string }> {
  try {
    const { data: result, error } = await supabase
      .from('scenarios')
      .insert({
        user_id: userId,
        scenario_type: 'comparison',
        is_primary: false,
        name,
        description,
        calculator_type: calculatorType,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (error) throw error;

    return { success: true, scenarioId: result.id };
  } catch (error) {
    console.error('Error saving comparison scenario:', error);
    return { success: false, error: 'Failed to save scenario' };
  }
}

/**
 * Get user's primary scenario
 */
export async function getPrimaryScenario(userId: string): Promise<MultiScenario | null> {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching primary scenario:', error);
      return null;
    }
    return data as MultiScenario | null;
  } catch (err) {
    console.error('Exception fetching primary scenario:', err);
    return null;
  }
}

/**
 * Get all user's comparison scenarios
 */
export async function getComparisonScenarios(userId: string): Promise<MultiScenario[]> {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('user_id', userId)
      .eq('scenario_type', 'comparison')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comparison scenarios:', error);
      return [];
    }
    return (data || []) as MultiScenario[];
  } catch (err) {
    console.error('Exception fetching comparison scenarios:', err);
    return [];
  }
}

/**
 * Get all scenarios for a user
 */
export async function getAllScenarios(userId: string): Promise<{
  primary: MultiScenario | null;
  comparisons: MultiScenario[];
}> {
  const [primary, comparisons] = await Promise.all([
    getPrimaryScenario(userId),
    getComparisonScenarios(userId),
  ]);

  return { primary, comparisons };
}

/**
 * Delete a comparison scenario
 */
export async function deleteMultiScenario(scenarioId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('scenarios')
    .delete()
    .eq('id', scenarioId)
    .eq('user_id', userId)
    .eq('is_primary', false); // Safety: can't delete primary

  return !error;
}

/**
 * Update a comparison scenario
 */
export async function updateMultiScenario(
  scenarioId: string,
  userId: string,
  updates: { name?: string; description?: string }
): Promise<boolean> {
  const { error } = await supabase
    .from('scenarios')
    .update(updates)
    .eq('id', scenarioId)
    .eq('user_id', userId);

  return !error;
}

/**
 * Count user's scenarios (for free tier limits)
 */
export async function countUserScenarios(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('scenarios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('scenario_type', 'comparison');

  if (error) return 0;
  return count || 0;
}

/**
 * Calculator type labels for display
 */
export const calculatorTypeLabels: Record<CalculatorType, string> = {
  main: 'True Hourly Wage',
  commute: 'Commute Comparison',
  geo: 'Geographic Arbitrage',
  pension: 'Pension',
  car: 'Car Ownership',
  'student-loans': 'Student Loans',
  wfh: 'WFH vs Office',
  intensity: 'Work Intensity',
  carers: "Carer's Allowance",
  fire: 'FIRE Progress',
  opportunity: 'Opportunity Cost',
};

/**
 * Get scenarios for report generation
 */
export async function getScenariosForReport(userId: string): Promise<{
  primary: MultiScenario | null;
  comparisons: MultiScenario[];
  hasEnoughData: boolean;
}> {
  const { primary, comparisons } = await getAllScenarios(userId);

  return {
    primary,
    comparisons,
    hasEnoughData: primary !== null,
  };
}
