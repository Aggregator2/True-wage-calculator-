# 🔧 Troubleshooting Guide - SQL Import Issues

## ❌ Error: "column created_at does not exist"

This means your `report_generations` table either doesn't exist or has a different structure.

---

## 🔍 STEP 1: Check What You Have

Run this in Supabase SQL Editor first:

**File**: `DIAGNOSTIC-CHECK.sql`

Or copy this query:

```sql
-- Check what tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'report_generations', 'saved_scenarios')
ORDER BY table_name;
```

---

## 📊 STEP 2: Choose the Right Migration

Based on the results above:

### **Scenario A: You have `report_generations` table**
✅ **Use**: `COPY-THIS-TO-SUPABASE-FIXED.sql`

This will:
- Create the table if missing
- Add missing columns
- Create indexes and functions

---

### **Scenario B: You only have `saved_scenarios` (legacy)**
✅ **Use**: `COPY-THIS-TO-SUPABASE-LEGACY.sql`

This will:
- Work with your existing legacy structure
- Create new `report_generations` table
- Add all tracking columns
- Set up indexes and functions

---

### **Scenario C: You don't have `user_profiles` table**
⚠️ **You need to create it first**

Run this first:

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  subscription_status TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe ON user_profiles(stripe_customer_id);
```

Then use `COPY-THIS-TO-SUPABASE-FIXED.sql`

---

## 🎯 Quick Fix - Run This

**If you're not sure, just run this:**

1. **First, run**: `DIAGNOSTIC-CHECK.sql` (see what you have)
2. **Then, run**: `COPY-THIS-TO-SUPABASE-FIXED.sql` (works in most cases)
3. **Verify**: Run verification query (below)

---

## ✅ Verification Query

After running the migration, verify it worked:

```sql
-- Check user_profiles columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN (
    'reports_generated_this_month',
    'last_report_generated_at',
    'has_generated_preview'
  );
```

**Expected**: Should return 3 rows ✅

```sql
-- Check report_generations table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'report_generations'
  AND column_name = 'is_preview';
```

**Expected**: Should return 1 row ✅

---

## 🔍 Common Errors & Solutions

### **Error 1: "relation user_profiles does not exist"**

**Solution**: Create user_profiles table first (see Scenario C above)

---

### **Error 2: "permission denied for table"**

**Solution**: Make sure you're using the Supabase service role or have admin privileges

**Check your role**:
```sql
SELECT current_user, current_database();
```

---

### **Error 3: "column already exists"**

**Solution**: This is fine! The migration uses `ADD COLUMN IF NOT EXISTS` so it's safe to run multiple times.

Just continue with the rest of the migration.

---

### **Error 4: "syntax error at or near"**

**Solution**:
1. Make sure you copied the ENTIRE file
2. Don't run it line by line
3. Paste the whole thing and click "Run" once

---

### **Error 5: "foreign key constraint"**

**Solution**: The user doesn't exist in `auth.users`

This is fine - the table will be created, but you need actual users to test with.

---

## 📋 Step-by-Step Safe Migration

If you want to be extra careful, run each part separately:

### **Step 1: Add columns to user_profiles**
```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS reports_generated_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_report_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_generated_preview BOOLEAN DEFAULT FALSE;
```

### **Step 2: Create/update report_generations table**
```sql
CREATE TABLE IF NOT EXISTS report_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  scenarios_included UUID[] DEFAULT '{}',
  is_preview BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE report_generations
ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT FALSE;
```

### **Step 3: Create indexes**
```sql
CREATE INDEX IF NOT EXISTS idx_user_profiles_report_tracking
ON user_profiles(id, reports_generated_this_month, last_report_generated_at);

CREATE INDEX IF NOT EXISTS idx_report_generations_user_preview
ON report_generations(user_id, is_preview, created_at);
```

### **Step 4: Create function**
```sql
CREATE OR REPLACE FUNCTION reset_monthly_report_counters()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET reports_generated_this_month = 0
  WHERE last_report_generated_at IS NOT NULL
    AND (
      EXTRACT(MONTH FROM last_report_generated_at) != EXTRACT(MONTH FROM CURRENT_DATE)
      OR EXTRACT(YEAR FROM last_report_generated_at) != EXTRACT(YEAR FROM CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 Which File Should I Use?

### **Use `COPY-THIS-TO-SUPABASE-FIXED.sql` if:**
- ✅ You have `user_profiles` table
- ✅ You want the safest option
- ✅ You're not sure (this works in most cases)

### **Use `COPY-THIS-TO-SUPABASE-LEGACY.sql` if:**
- ✅ You're using `saved_scenarios` (old system)
- ✅ You don't have `report_generations` table
- ✅ The fixed version didn't work

### **Run `DIAGNOSTIC-CHECK.sql` first if:**
- ✅ You want to see what tables you have
- ✅ You're getting errors
- ✅ You want to understand your database structure

---

## 🧪 After Migration - Test It

Once migration succeeds, test in your app:

```bash
cd C:\Users\joeri\OneDrive\Desktop\uk-freedom-calculator
npm run dev
```

1. Login as a user
2. Complete calculator
3. Generate report
4. Should work! ✅

---

## 📞 Still Having Issues?

**Check logs:**
- Supabase Dashboard → Logs
- Browser console (F12)
- Terminal running `npm run dev`

**Verify tables exist:**
```sql
SELECT * FROM user_profiles LIMIT 1;
SELECT * FROM report_generations LIMIT 1;
```

**Check your schema:**
```sql
\dt  -- List all tables (if using psql)
```

---

## ✅ Success Checklist

After running the migration:

- [ ] No errors in Supabase SQL Editor
- [ ] Verification query returns 3 rows
- [ ] `user_profiles` has new columns
- [ ] `report_generations` table exists
- [ ] `reset_monthly_report_counters()` function exists
- [ ] App starts with `npm run dev`
- [ ] Can generate reports without errors

---

## 🎉 Working? Great!

Once everything works:
1. ✅ Test free user (1 preview)
2. ✅ Test premium user (5 reports)
3. ✅ Verify rate limiting
4. ✅ Check OpenRouter costs

**See**: `QUICK-START.md` for full testing guide
