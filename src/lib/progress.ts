import { supabase } from './supabase';
import type { ProgressSnapshot } from './supabase';

export async function recordProgressSnapshot(
  freedomScore: number,
  netWorth: number,
  trueHourlyWage: number,
  monthsToFI: number,
  savingsRate: number
): Promise<ProgressSnapshot> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('progress_snapshots')
    .insert({
      user_id: user.id,
      freedom_score: freedomScore,
      net_worth: netWorth,
      true_hourly_wage: trueHourlyWage,
      months_to_fi: monthsToFI,
      savings_rate: savingsRate,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProgressHistory(months: number = 12): Promise<ProgressSnapshot[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data, error } = await supabase
    .from('progress_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getLatestSnapshot(): Promise<ProgressSnapshot | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('progress_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
}
