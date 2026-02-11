# FIRE Report Generation System - Setup Guide

## Overview
The TrueWage FIRE Report system generates comprehensive, FCA-compliant PDF reports for premium subscribers. It uses OpenRouter AI (Claude Sonnet 4 for fast tasks, Claude Opus 4 for deep reasoning) to provide intelligent analysis while maintaining strict compliance with UK financial regulations.

## What's Been Built

### 1. OpenRouter Integration (`src/lib/openrouter.ts`)
- Hybrid AI approach using Claude Sonnet 4 (fast) and Claude Opus 4 (deep reasoning)
- Generates:
  - Executive Summary
  - Tax Analysis
  - Scenario Comparisons
  - FIRE Projections
  - Educational Action Plans

### 2. PDF Report Generator (`src/lib/report-generator.ts`)
- Professional 15+ page PDF reports
- FCA-compliant disclaimers throughout
- Sections include:
  - Cover Page with key metrics
  - Executive Summary
  - Your Numbers breakdown
  - Tax Analysis
  - Scenario Comparisons
  - FIRE Projections
  - Educational Action Areas
  - Full Disclaimers page

### 3. Generate Report API (`src/app/api/generate-report/route.ts`)
- GET endpoint: Check report eligibility
- POST endpoint: Generate PDF or JSON report
- Premium subscription verification
- Report generation tracking

### 4. Dashboard Integration
- Updated dashboard with report generation buttons
- PDF and JSON export options
- Premium gating

## Setup Steps

### 1. Run the Supabase Migration
Go to Supabase Dashboard > SQL Editor and run:

```sql
-- File: supabase-migration-scenarios.sql
-- This creates the scenarios table and report_generations tracking table
```

### 2. Add OpenRouter API Key
1. Go to https://openrouter.ai/keys
2. Create an API key
3. Add to `.env.local`:

```env
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
```

### 3. Verify Environment Variables
Make sure these are all set in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (for premium subscriptions)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# OpenRouter (for AI reports)
OPENROUTER_API_KEY=your_openrouter_api_key
```

## How It Works

### Report Flow:
1. User completes main calculator → Primary scenario auto-saves
2. User explores other calculators → Can save as "What-If" scenarios
3. User clicks "Generate Report" on dashboard
4. System checks:
   - Is user logged in?
   - Is user premium subscriber?
   - Does user have primary scenario data?
5. If all checks pass:
   - Fetches all user scenarios
   - Runs AI analysis (parallel where possible)
   - Generates PDF/JSON
   - Returns download

### AI Model Usage:
- **Fast Tasks (Sonnet 4):**
  - Executive Summary
  - Tax Analysis
  - Action Plan

- **Deep Tasks (Opus 4):**
  - Scenario Comparison (complex trade-off analysis)
  - FIRE Projections (long-term compounding)

### FCA Compliance:
- All reports clearly state "FOR EDUCATIONAL PURPOSES ONLY"
- Never provides financial advice
- Uses "calculations" and "analysis" language
- Multiple disclaimer sections
- Points users to qualified advisors

## Testing

### Test Report Generation:
1. Create a test premium user
2. Complete the main calculator
3. Save a couple of what-if scenarios
4. Go to Dashboard
5. Click "Download PDF"

### Expected Output:
- 15+ page PDF with:
  - Cover page showing true hourly wage
  - AI-generated executive summary
  - Full number breakdown
  - Tax analysis (if AI available)
  - Scenario comparisons
  - FIRE projections
  - Action areas
  - Disclaimers

## Cost Considerations

OpenRouter pricing (approximate):
- Claude Sonnet 4: ~$3/1M input, ~$15/1M output tokens
- Claude Opus 4: ~$15/1M input, ~$75/1M output tokens

Estimated cost per report: $0.05-0.15 depending on scenario complexity

## Troubleshooting

### "No scenario data found"
- User needs to complete the main calculator first
- Check that the `scenarios` table exists in Supabase

### AI Analysis fails
- Check OpenRouter API key is valid
- Check you have credits in OpenRouter
- Reports will still generate with basic (non-AI) content

### PDF won't download
- Check browser allows downloads
- Try JSON export as alternative
- Check console for errors
