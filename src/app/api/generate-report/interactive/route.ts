import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateFreeAIAnalysis, generateJSON, collectComprehensiveUserData, getStage1Prompt, getStage2Prompt, getStage3Prompt, getStage4Prompt } from '@/lib/openrouter';
import type { MultiScenario } from '@/lib/scenarios';

// Allow up to 5 minutes for AI-powered report generation
export const maxDuration = 300;

let _supabaseAdmin: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return _supabaseAdmin;
}

async function verifyUser(token: string) {
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  return { user, error };
}

// Fallback profile synthesis for when AI fails
function getFallbackProfileSynthesis(userData: any) {
  return {
    uncomfortableTruth: `Your true hourly wage is £${userData.income.trueHourlyWage.toFixed(2)}, not the £${userData.income.statedHourlyWage.toFixed(2)} you think. That difference represents real money you're working for free.`,
    incomeReality: `On a gross salary of £${userData.income.grossAnnualSalary.toLocaleString()}, you take home £${userData.income.netAnnualSalary.toLocaleString()} after tax and deductions. Your effective tax rate is ${userData.income.effectiveTaxRate.toFixed(1)}%.`,
    hiddenCostsBombshell: `Your hidden work costs total £${userData.income.hiddenAnnualCost.toLocaleString()} per year. That's money bleeding from your earnings that you probably don't track.`,
    spendingPatterns: `Your current savings rate needs examination. The UK average is 8.8%. Every percentage point matters on your path to financial independence.`,
    timeTradeoffs: `You're trading your time at a rate you might not fully appreciate. Understanding the true cost of each hour is the first step to freedom.`,
    fireProgress: `Based on your current trajectory, financial independence is achievable but requires strategic optimisation.`,
    overallRating: 'Fair',
    oneLineSummary: 'Your finances have potential, but hidden costs and missed opportunities are adding years to your timeline.',
  };
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
    const { data: profile } = await getSupabaseAdmin()
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
      await getSupabaseAdmin()
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
      const { data: primaryScenario } = await getSupabaseAdmin()
        .from('scenarios')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();

      if (primaryScenario) {
        primary = primaryScenario as MultiScenario;
        const { data: compScenarios } = await getSupabaseAdmin()
          .from('scenarios')
          .select('*')
          .eq('user_id', user.id)
          .eq('scenario_type', 'comparison');
        comparisons = (compScenarios || []) as MultiScenario[];
      } else {
        // Legacy fallback
        const { data: legacyScenario } = await getSupabaseAdmin()
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
    const userName = profile?.email?.split('@')[0] || userData.profile.name;

    // Track generation in parallel (fire-and-forget)
    const trackGeneration = async () => {
      try {
        const updates: any = { last_report_generated_at: new Date().toISOString() };
        if (!isPremium) {
          updates.has_generated_preview = true;
        } else {
          updates.reports_generated_this_month = (profile?.reports_generated_this_month || 0) + 1;
        }

        await Promise.all([
          getSupabaseAdmin().from('report_generations').insert({
            user_id: user.id,
            report_type: 'interactive',
            scenarios_included: [primary!.id, ...comparisons.map(c => c.id)],
            is_preview: !isPremium,
          }),
          getSupabaseAdmin().from('user_profiles').update(updates).eq('id', user.id),
        ]);
      } catch (e) {
        console.error('Failed to track:', e);
      }
    };

    // =========================================================================
    // FREE USER PATH - Single JSON response, Stage 1 only (~2-3s)
    // =========================================================================
    if (!isPremium) {
      console.log('Starting FREE user report generation...');

      let aiAnalysis;
      try {
        aiAnalysis = await generateFreeAIAnalysis(userData);
      } catch (aiError) {
        console.error('Free AI analysis failed, using fallback:', aiError);
        aiAnalysis = {
          profileSynthesis: getFallbackProfileSynthesis(userData),
          optimizationAnalysis: { quickWins: [], strategicMoves: [], contrarianInsights: [], crossSystemOpportunities: [], topRecommendation: null },
          riskAssessment: { highPriorityRisks: [], overallRiskRating: 'Moderate' },
          roadmap: { roadmap: {}, finalComparison: null, personalizedMotivation: '' },
        };
      }

      // Track in background (don't await)
      trackGeneration();

      return NextResponse.json({
        userData,
        aiAnalysis,
        generatedAt: new Date().toISOString(),
        userName,
        isPremium: false,
      });
    }

    // =========================================================================
    // PREMIUM USER PATH - NDJSON streaming, all 4 stages progressively
    // =========================================================================
    console.log('Starting PREMIUM user streaming report generation...');

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendChunk = (data: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
        };

        try {
          // 1. Send computed data immediately (no AI needed)
          sendChunk({
            type: 'computed',
            userData,
            isPremium: true,
            generatedAt: new Date().toISOString(),
            userName,
          });

          // 2. Stage 1: Profile Synthesis (Haiku - fast, ~2-3s)
          try {
            const stage1Prompt = getStage1Prompt(userData);
            const profileSynthesis = await generateJSON(
              stage1Prompt.prompt,
              stage1Prompt.system,
              'FAST'
            );
            sendChunk({
              type: 'ai_stage',
              stage: 'profileSynthesis',
              data: profileSynthesis,
            });
          } catch (e) {
            console.error('Stage 1 failed:', e);
            sendChunk({
              type: 'ai_stage',
              stage: 'profileSynthesis',
              data: getFallbackProfileSynthesis(userData),
            });
          }

          // 3. Stage 2 & 3 in parallel (Deep model, ~10-15s each)
          const stage2Prompt = getStage2Prompt(userData);
          const stage3Prompt = getStage3Prompt(userData);

          let optimizationAnalysis: any = null;
          let riskAssessment: any = null;

          const [stage2Result, stage3Result] = await Promise.allSettled([
            generateJSON(stage2Prompt.prompt, stage2Prompt.system, 'DEEP'),
            generateJSON(stage3Prompt.prompt, stage3Prompt.system, 'DEEP'),
          ]);

          // Send stage 2 result
          if (stage2Result.status === 'fulfilled') {
            optimizationAnalysis = stage2Result.value;
            sendChunk({
              type: 'ai_stage',
              stage: 'optimizationAnalysis',
              data: optimizationAnalysis,
            });
          } else {
            console.error('Stage 2 failed:', stage2Result.reason);
            optimizationAnalysis = { quickWins: [], strategicMoves: [], contrarianInsights: [], crossSystemOpportunities: [], topRecommendation: null };
            sendChunk({
              type: 'ai_stage',
              stage: 'optimizationAnalysis',
              data: optimizationAnalysis,
              error: true,
            });
          }

          // Send stage 3 result
          if (stage3Result.status === 'fulfilled') {
            riskAssessment = stage3Result.value;
            sendChunk({
              type: 'ai_stage',
              stage: 'riskAssessment',
              data: riskAssessment,
            });
          } else {
            console.error('Stage 3 failed:', stage3Result.reason);
            riskAssessment = { highPriorityRisks: [], overallRiskRating: 'Moderate' };
            sendChunk({
              type: 'ai_stage',
              stage: 'riskAssessment',
              data: riskAssessment,
              error: true,
            });
          }

          // 4. Stage 4: Roadmap (depends on 2+3, ~10-15s)
          try {
            const stage4Prompt = getStage4Prompt(userData, optimizationAnalysis, riskAssessment);
            const roadmap = await generateJSON(
              stage4Prompt.prompt,
              stage4Prompt.system,
              'DEEP'
            );
            sendChunk({
              type: 'ai_stage',
              stage: 'roadmap',
              data: roadmap,
            });
          } catch (e) {
            console.error('Stage 4 failed:', e);
            sendChunk({
              type: 'ai_stage',
              stage: 'roadmap',
              data: { roadmap: {}, finalComparison: null, personalizedMotivation: '' },
              error: true,
            });
          }

          // 5. Complete
          sendChunk({ type: 'complete' });

          // Track in background
          trackGeneration();

        } catch (error) {
          console.error('Streaming error:', error);
          sendChunk({ type: 'error', message: 'Failed to generate report.' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Interactive report error:', error);
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
  }
}
