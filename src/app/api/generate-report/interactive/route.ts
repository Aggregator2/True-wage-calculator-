import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAIAnalysis, collectComprehensiveUserData } from '@/lib/openrouter';
import type { MultiScenario } from '@/lib/scenarios';

// Allow up to 5 minutes for AI-powered report generation
export const maxDuration = 300;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyUser(token: string) {
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  return { user, error };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { user, error: authError } = await verifyUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_status, email, reports_generated_this_month, last_report_generated_at, has_generated_preview')
      .eq('id', user.id)
      .single();

    const isPremium = profile?.subscription_status === 'premium' || profile?.subscription_status === 'lifetime';

    // Rate limiting
    const now = new Date();
    const lastGenerated = profile?.last_report_generated_at ? new Date(profile.last_report_generated_at) : null;
    const isNewMonth = !lastGenerated ||
      now.getMonth() !== lastGenerated.getMonth() ||
      now.getFullYear() !== lastGenerated.getFullYear();

    if (isNewMonth && profile) {
      await supabaseAdmin
        .from('user_profiles')
        .update({ reports_generated_this_month: 0 })
        .eq('id', user.id);
      if (profile) profile.reports_generated_this_month = 0;
    }

    if (!isPremium) {
      if (profile?.has_generated_preview) {
        return NextResponse.json({
          error: 'You\'ve already generated your free preview. Upgrade to Premium for unlimited reports.',
          upgradeUrl: '/pricing',
          upgradeRequired: true,
        }, { status: 403 });
      }
    } else {
      const reportsThisMonth = profile?.reports_generated_this_month || 0;
      if (reportsThisMonth >= 5) {
        return NextResponse.json({
          error: 'You\'ve reached your Premium limit of 5 reports this month.',
          reportsUsed: reportsThisMonth,
        }, { status: 429 });
      }
    }

    // Parse body
    const body = await request.json();
    const { scenarioData, legacyScenarios } = body;

    // Resolve primary scenario
    let primary: MultiScenario | null = null;
    let comparisons: MultiScenario[] = [];

    if (scenarioData?.primary) {
      primary = scenarioData.primary;
      comparisons = scenarioData.comparisons || [];
    } else if (legacyScenarios?.length > 0) {
      const legacy = legacyScenarios[0];
      primary = {
        id: legacy.id,
        user_id: legacy.user_id,
        scenario_type: 'primary',
        is_primary: true,
        name: legacy.name || 'My Current Situation',
        calculator_type: 'main',
        data: {
          inputs: legacy.calculation_data,
          results: legacy.calculation_results,
          timestamp: legacy.created_at,
        },
        created_at: legacy.created_at,
        updated_at: legacy.updated_at,
      };
    } else {
      // Fetch from DB
      const { data: primaryScenario } = await supabaseAdmin
        .from('scenarios')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();

      if (primaryScenario) {
        primary = primaryScenario as MultiScenario;
        const { data: compScenarios } = await supabaseAdmin
          .from('scenarios')
          .select('*')
          .eq('user_id', user.id)
          .eq('scenario_type', 'comparison');
        comparisons = (compScenarios || []) as MultiScenario[];
      } else {
        // Legacy fallback
        const { data: legacyScenario } = await supabaseAdmin
          .from('saved_scenarios')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!legacyScenario) {
          return NextResponse.json({ error: 'No scenario data found.' }, { status: 400 });
        }

        primary = {
          id: legacyScenario.id,
          user_id: legacyScenario.user_id,
          scenario_type: 'primary',
          is_primary: true,
          name: 'My Current Situation',
          calculator_type: 'main',
          data: {
            inputs: legacyScenario.calculation_data,
            results: legacyScenario.calculation_results,
            timestamp: legacyScenario.created_at,
          },
          created_at: legacyScenario.created_at,
          updated_at: legacyScenario.updated_at,
        };
      }
    }

    if (!primary) {
      return NextResponse.json({ error: 'No scenario data found.' }, { status: 400 });
    }

    // Collect comprehensive data
    const userData = collectComprehensiveUserData(primary, comparisons, profile);

    // Run AI analysis (the full multi-stage pipeline)
    console.log('🤖 Starting AI analysis for interactive report...');
    let aiAnalysis;
    try {
      aiAnalysis = await generateAIAnalysis(userData);
    } catch (aiError) {
      console.error('AI analysis failed, using fallback:', aiError);
      // Provide basic fallback structure
      aiAnalysis = {
        profileSynthesis: {
          uncomfortableTruth: `Your true hourly wage is £${userData.income.trueHourlyWage.toFixed(2)}, not the £${userData.income.statedHourlyWage.toFixed(2)} you think. That difference represents real money you're working for free.`,
          incomeReality: `On a gross salary of £${userData.income.grossAnnualSalary.toLocaleString()}, you take home £${userData.income.netAnnualSalary.toLocaleString()} after tax and deductions. Your effective tax rate is ${userData.income.effectiveTaxRate.toFixed(1)}%.`,
          hiddenCostsBombshell: `Your hidden work costs total £${userData.income.hiddenAnnualCost.toLocaleString()} per year. That's money bleeding from your earnings that you probably don't track.`,
          spendingPatterns: `Your current savings rate needs examination. The UK average is 8.8%. Every percentage point matters on your path to financial independence.`,
          timeTradeoffs: `You're trading your time at a rate you might not fully appreciate. Understanding the true cost of each hour is the first step to freedom.`,
          fireProgress: `Based on your current trajectory, financial independence is achievable but requires strategic optimisation.`,
          overallRating: 'Fair',
          oneLineSummary: 'Your finances have potential, but hidden costs and missed opportunities are adding years to your timeline.',
        },
        optimizationAnalysis: { quickWins: [], strategicMoves: [], contrarianInsights: [], crossSystemOpportunities: [], topRecommendation: null },
        riskAssessment: { highPriorityRisks: [], overallRiskRating: 'Moderate' },
        roadmap: { roadmap: {}, finalComparison: null, personalizedMotivation: '' },
      };
    }

    // Track generation
    try {
      await supabaseAdmin.from('report_generations').insert({
        user_id: user.id,
        report_type: 'interactive',
        scenarios_included: [primary.id, ...comparisons.map(c => c.id)],
        is_preview: !isPremium,
      });

      const updates: any = { last_report_generated_at: new Date().toISOString() };
      if (!isPremium) {
        updates.has_generated_preview = true;
      } else {
        updates.reports_generated_this_month = (profile?.reports_generated_this_month || 0) + 1;
      }
      await supabaseAdmin.from('user_profiles').update(updates).eq('id', user.id);
    } catch (e) {
      console.error('Failed to track:', e);
    }

    // Return JSON for interactive report
    return NextResponse.json({
      userData,
      aiAnalysis,
      generatedAt: new Date().toISOString(),
      userName: profile?.email?.split('@')[0] || userData.profile.name,
      isPremium,
    });
  } catch (error) {
    console.error('Interactive report error:', error);
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
  }
}
