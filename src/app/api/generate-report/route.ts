import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateReportData, generateAIAnalysis, collectComprehensiveUserData } from '@/lib/openrouter';
import { generateReportPDF, generateProfessionalPDF, exportScenariosJSON } from '@/lib/report-generator';
import { generatePremiumPDF } from '@/lib/premium-report-generator';
import { generateFastReport } from '@/lib/fast-report-generator';
import type { MultiScenario } from '@/lib/scenarios';

// Allow up to 5 minutes for AI-powered report generation
export const maxDuration = 300;

// Create Supabase admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to verify user from JWT token
async function verifyUser(token: string) {
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  return { user, error };
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Verify the user's session
    const { user, error: authError } = await verifyUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Check if user has premium subscription and report limits
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_status, email, reports_generated_this_month, last_report_generated_at, has_generated_preview')
      .eq('id', user.id)
      .single();

    const isPremium = profile?.subscription_status === 'premium' || profile?.subscription_status === 'lifetime';

    // =====================================================================
    // RATE LIMITING & COST MANAGEMENT
    // =====================================================================

    // Check if we need to reset monthly counter
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
      profile.reports_generated_this_month = 0;
    }

    // Rate limits
    const LIMITS = {
      free_preview: 1, // One preview ever
      premium_monthly: 5, // 5 reports per month for premium
    };

    // Free users: only get ONE preview ever
    if (!isPremium) {
      if (profile?.has_generated_preview) {
        return NextResponse.json(
          {
            error: 'You\'ve already generated your free preview. Upgrade to Premium for unlimited reports.',
            upgradeUrl: '/pricing',
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }
    } else {
      // Premium users: check monthly limit
      const reportsThisMonth = profile?.reports_generated_this_month || 0;
      if (reportsThisMonth >= LIMITS.premium_monthly) {
        return NextResponse.json(
          {
            error: `You've reached your Premium limit of ${LIMITS.premium_monthly} reports this month. Limit resets on the 1st.`,
            reportsUsed: reportsThisMonth,
            limit: LIMITS.premium_monthly,
          },
          { status: 429 }
        );
      }
    }

    // Parse request body
    const body = await request.json();
    const { format = 'pdf', scenarioData, legacyScenarios, reportType = 'comprehensive' } = body;

    // If scenario data was passed from the frontend, use it directly
    if (scenarioData?.primary) {
      console.log('Using scenario data from request body');
      return await generateReport(
        user.id,
        scenarioData.primary as MultiScenario,
        (scenarioData.comparisons || []) as MultiScenario[],
        format,
        reportType,
        profile
      );
    }

    // If legacy scenarios were passed, convert and use them
    if (legacyScenarios && legacyScenarios.length > 0) {
      console.log('Using legacy scenarios from request body');
      const legacy = legacyScenarios[0];
      const convertedPrimary: MultiScenario = {
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
      return await generateReport(user.id, convertedPrimary, [], format, reportType, profile);
    }

    // Fallback: Fetch user's scenarios from database
    const { data: primaryScenario, error: primaryError } = await supabaseAdmin
      .from('scenarios')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single();

    if (primaryError || !primaryScenario) {
      // Fallback: try to get from saved_scenarios (legacy)
      const { data: legacyScenario } = await supabaseAdmin
        .from('saved_scenarios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!legacyScenario) {
        return NextResponse.json(
          { error: 'No scenario data found. Please complete the calculator first.' },
          { status: 400 }
        );
      }

      // Convert legacy scenario to MultiScenario format
      const convertedPrimary: MultiScenario = {
        id: legacyScenario.id,
        user_id: legacyScenario.user_id,
        scenario_type: 'primary',
        is_primary: true,
        name: legacyScenario.name || 'My Current Situation',
        calculator_type: 'main',
        data: {
          inputs: legacyScenario.calculation_data,
          results: legacyScenario.calculation_results,
          timestamp: legacyScenario.created_at,
        },
        created_at: legacyScenario.created_at,
        updated_at: legacyScenario.updated_at,
      };

      return await generateReport(user.id, convertedPrimary, [], format, reportType, profile);
    }

    // Fetch comparison scenarios
    const { data: comparisonScenarios } = await supabaseAdmin
      .from('scenarios')
      .select('*')
      .eq('user_id', user.id)
      .eq('scenario_type', 'comparison')
      .order('created_at', { ascending: false });

    return await generateReport(
      user.id,
      primaryScenario as MultiScenario,
      (comparisonScenarios || []) as MultiScenario[],
      format,
      reportType,
      profile
    );
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report. Please try again.' },
      { status: 500 }
    );
  }
}

async function generateReport(
  userId: string,
  primary: MultiScenario,
  comparisons: MultiScenario[],
  format: 'pdf' | 'json',
  reportType: 'comprehensive' | 'legacy',
  userProfile?: any
) {
  const generatedAt = new Date().toISOString();

  // Determine if this should be a preview or full report
  const isPremium = userProfile?.subscription_status === 'premium' || userProfile?.subscription_status === 'lifetime';
  const reportVariant = isPremium ? 'full' : 'preview';
  const isPreview = !isPremium;

  // ================================================================
  // COMPREHENSIVE REPORT (NEW - Multi-stage AI analysis)
  // ================================================================
  if (reportType === 'comprehensive') {
    try {
      console.log('📊 Collecting comprehensive user data...');
      const userData = collectComprehensiveUserData(primary, comparisons, userProfile);

      // Track report generation
      try {
        await supabaseAdmin.from('report_generations').insert({
          user_id: userId,
          report_type: 'comprehensive',
          scenarios_included: [primary.id, ...comparisons.map((c) => c.id)],
          is_preview: isPreview,
        });

        // Update user profile
        const updates: any = {
          last_report_generated_at: new Date().toISOString(),
        };

        if (isPreview) {
          updates.has_generated_preview = true;
        } else {
          // Increment monthly counter for premium users
          updates.reports_generated_this_month = (userProfile?.reports_generated_this_month || 0) + 1;
        }

        await supabaseAdmin
          .from('user_profiles')
          .update(updates)
          .eq('id', userId);
      } catch (trackError) {
        console.error('Failed to track report generation:', trackError);
      }

      if (format === 'json') {
        const jsonData = JSON.stringify({
          exportedAt: generatedAt,
          userData,
          disclaimer: 'This report is for educational purposes only and does not constitute financial advice.',
        }, null, 2);

        return new NextResponse(jsonData, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="fire-report-${new Date().toISOString().split('T')[0]}.json"`,
          },
        });
      }

      console.log(`📄 Generating ${reportVariant} PDF (FAST - no AI delay)...`);

      // Use FAST report generator with pre-designed templates
      const pdfBlob = await generateFastReport({
        userData,
        generatedAt,
        userName: userProfile?.email?.split('@')[0] || userData.profile.name,
        reportType: reportVariant,
      });

      const pdfBuffer = await pdfBlob.arrayBuffer();
      const filename = isPreview
        ? `truewage-preview-${new Date().toISOString().split('T')[0]}.pdf`
        : `truewage-fire-report-${new Date().toISOString().split('T')[0]}.pdf`;

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (comprehensiveError) {
      console.error('Comprehensive report failed, falling back to legacy:', comprehensiveError);
      // Fall through to legacy report generation
    }
  }

  // ================================================================
  // LEGACY REPORT (fallback or explicit request)
  // ================================================================
  let aiAnalysis;
  try {
    aiAnalysis = await generateReportData({
      primary,
      comparisons,
    });
  } catch (aiError) {
    console.error('AI analysis error:', aiError);
    // Continue without AI analysis - generate basic report
    aiAnalysis = {
      executiveSummary: {
        headline: `Your true hourly wage is \u00A3${(primary.data.results?.trueHourlyRate || 0).toFixed(2)}`,
        keyFindings: [
          `Reality percentage: ${(primary.data.results?.percentOfAssumed || 0).toFixed(0)}% of assumed rate`,
          `Hidden costs total: \u00A3${(primary.data.results?.hiddenCosts || 0).toLocaleString()} per year`,
        ],
        immediateOpportunity: 'Review your work-related costs to identify potential savings',
        riskFlag: null,
      },
      taxAnalysis: null,
      scenarioComparison: null,
      fireProjection: null,
      actionPlan: null,
    };
  }

  // Track report generation
  try {
    await supabaseAdmin.from('report_generations').insert({
      user_id: userId,
      report_type: format,
      scenarios_included: [primary.id, ...comparisons.map((c) => c.id)],
    });
  } catch (trackError) {
    console.error('Failed to track report generation:', trackError);
    // Non-fatal, continue
  }

  const reportData = {
    primary,
    comparisons,
    aiAnalysis,
    generatedAt,
  };

  if (format === 'json') {
    const jsonData = exportScenariosJSON(reportData);
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="truewage-report-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  }

  // Generate PDF (legacy)
  const pdfBlob = await generateReportPDF(reportData);
  const pdfBuffer = await pdfBlob.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="truewage-fire-report-${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  });
}

// GET endpoint to check report eligibility
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ eligible: false, reason: 'Not authenticated' });
    }

    const token = authHeader.slice(7);
    const { user, error: authError } = await verifyUser(token);

    if (authError || !user) {
      return NextResponse.json({ eligible: false, reason: 'Invalid session' });
    }

    // Check premium status (stored in user_profiles)
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    const isPremium = profile?.subscription_status === 'premium' || profile?.subscription_status === 'lifetime';

    // Check how many reports user has generated (for free tier limit)
    const { count: reportCount } = await supabaseAdmin
      .from('report_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const FREE_REPORT_LIMIT = 1;
    const hasUsedFreeReport = (reportCount || 0) >= FREE_REPORT_LIMIT;

    if (!isPremium && hasUsedFreeReport) {
      return NextResponse.json({
        eligible: false,
        reason: 'You have used your free report. Upgrade to premium for unlimited reports.',
        upgradeRequired: true,
        reportsUsed: reportCount || 0,
      });
    }

    // Check if user has scenario data - try new scenarios table first
    const { data: primaryScenario, error: primaryError } = await supabaseAdmin
      .from('scenarios')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle();

    console.log('Primary scenario check:', { primaryScenario, primaryError, userId: user.id });

    // Also check for ANY scenario (not just primary)
    const { data: anyScenario, error: anyError } = await supabaseAdmin
      .from('scenarios')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    console.log('Any scenario check:', { anyScenario, anyError });

    if (!primaryScenario && !anyScenario) {
      // Check legacy saved_scenarios table
      const { data: legacyScenario, error: legacyError } = await supabaseAdmin
        .from('saved_scenarios')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      console.log('Legacy scenario check:', { legacyScenario, legacyError });

      if (!legacyScenario) {
        return NextResponse.json({
          eligible: false,
          reason: 'No scenario data found. Complete the calculator first.',
          needsCalculation: true,
        });
      }
    }

    // Count comparison scenarios
    const { count: comparisonCount } = await supabaseAdmin
      .from('scenarios')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('scenario_type', 'comparison');

    return NextResponse.json({
      eligible: true,
      hasComparisons: (comparisonCount || 0) > 0,
      comparisonCount: comparisonCount || 0,
    });
  } catch (error) {
    console.error('Eligibility check error:', error);
    return NextResponse.json({ eligible: false, reason: 'Error checking eligibility' });
  }
}
