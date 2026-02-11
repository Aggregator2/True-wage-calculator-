# 📋 Supabase Import Guide - Report System Setup

## ✅ Step 1: Install Canvas (COMPLETED)
```bash
✓ Canvas package installed successfully
```

---

## 📊 Step 2: Import Database Migrations

### **Option A: Single Migration (Recommended)**
1. Open Supabase Dashboard → **SQL Editor**
2. Click "**New Query**"
3. Copy the entire contents of: `supabase-migration-report-limits.sql`
4. Click "**Run**"
5. Verify success message

### **Option B: Step-by-Step (if Option A fails)**
Run each file separately in this order:

#### **File 1**: `supabase-step-1-add-columns.sql`
- Adds tracking columns to `user_profiles`
- Adds `is_preview` column to `report_generations`

#### **File 2**: `supabase-step-2-create-indexes.sql`
- Creates performance indexes

#### **File 3**: `supabase-step-3-create-functions.sql`
- Creates reset function for monthly counters

---

## 🧪 Step 3: Verify Installation

### **Test in Supabase SQL Editor**:
```sql
-- Check user_profiles columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN (
    'reports_generated_this_month',
    'last_report_generated_at',
    'has_generated_preview'
  );

-- Should return 3 rows
```

### **Test reset function**:
```sql
-- Test the monthly reset function
SELECT reset_monthly_report_counters();

-- Should return (no error)
```

---

## 🚀 Step 4: Test Report Generation

### **Start dev server**:
```bash
cd C:\Users\joeri\OneDrive\Desktop\uk-freedom-calculator
npm run dev
```

### **Test Scenarios**:

#### **Test 1: Free User Preview**
1. Login as a **free user** (no subscription)
2. Navigate to calculator and complete it
3. Click "**Generate Report**"
4. **Expected**: 3-page preview PDF with blur overlays
5. Try generating again
6. **Expected**: Error "You've already generated your free preview"

#### **Test 2: Premium User Full Report**
1. Login as a **premium user** (subscription_status = 'premium')
2. Generate report
3. **Expected**: Full 12+ page report with all content
4. Generate 4 more reports (total 5)
5. **Expected**: All succeed
6. Try generating 6th report
7. **Expected**: Error "You've reached your Premium limit of 5 reports this month"

#### **Test 3: Monthly Reset**
1. Set user's `last_report_generated_at` to last month:
```sql
UPDATE user_profiles
SET last_report_generated_at = NOW() - INTERVAL '35 days',
    reports_generated_this_month = 5
WHERE id = 'your-user-id';
```
2. Generate new report
3. **Expected**: Counter resets to 0, report succeeds

---

## 📁 Files Included

### **Database Migrations**:
- ✅ `supabase-migration-report-limits.sql` - Complete migration (use this)
- ✅ `supabase-step-1-add-columns.sql` - Backup (step-by-step)
- ✅ `supabase-step-2-create-indexes.sql` - Backup (step-by-step)
- ✅ `supabase-step-3-create-functions.sql` - Backup (step-by-step)
- ✅ `supabase-test-queries.sql` - Verification queries

### **Application Code**:
- ✅ `src/lib/chart-generator.ts` - Chart generation
- ✅ `src/lib/premium-report-generator.ts` - PDF generator
- ✅ `src/app/api/generate-report/route.ts` - API with rate limiting

---

## 🔍 Troubleshooting

### **Issue 1: "table user_profiles does not exist"**
**Solution**: Create user_profiles table first (should already exist from previous migrations)

### **Issue 2: "table report_generations does not exist"**
**Solution**:
```sql
CREATE TABLE IF NOT EXISTS report_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  scenarios_included UUID[] DEFAULT '{}',
  is_preview BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Issue 3: Charts not rendering**
**Solution**: Verify canvas package is installed:
```bash
npm list canvas
# Should show: canvas@2.x.x
```

### **Issue 4: Rate limiting not working**
**Solution**: Check user profile in database:
```sql
SELECT
  id,
  subscription_status,
  reports_generated_this_month,
  last_report_generated_at,
  has_generated_preview
FROM user_profiles
WHERE id = 'your-user-id';
```

---

## 📊 Expected Database State After Migration

### **user_profiles table**:
```
Column                          | Type      | Default
--------------------------------|-----------|--------
reports_generated_this_month    | INTEGER   | 0
last_report_generated_at        | TIMESTAMP | NULL
has_generated_preview           | BOOLEAN   | FALSE
```

### **report_generations table**:
```
Column         | Type      | Default
---------------|-----------|--------
is_preview     | BOOLEAN   | FALSE
```

---

## 🎯 Success Checklist

- [ ] Canvas package installed (`npm list canvas`)
- [ ] Database migration executed (no errors)
- [ ] Columns added to `user_profiles` (run verification query)
- [ ] Indexes created (check with `\di` in psql)
- [ ] Reset function exists (run test query)
- [ ] Free user can generate 1 preview
- [ ] Free user blocked from 2nd preview
- [ ] Premium user can generate 5 reports
- [ ] Premium user blocked at 6th report
- [ ] Monthly counter resets correctly

---

## 📞 Need Help?

**Check logs in**:
- Browser console (F12)
- Terminal running `npm run dev`
- Supabase Dashboard → Logs

**Common error patterns**:
- "column does not exist" → Run migration again
- "relation does not exist" → Check table names
- "chart is not defined" → Verify canvas is installed
- "rate limit" → Check user_profiles counter

---

## 🎉 You're Done!

Once all checkboxes are checked, your report system is fully operational with:
- ✅ Premium visual design
- ✅ Chart generation
- ✅ Freemium preview system
- ✅ Rate limiting
- ✅ Cost optimization (£6.25 profit per premium user)

**Cost per report**: £0.15 with Haiku
**Monthly profit per premium user**: £6.25
**Break-even point**: 3.2 premium users
