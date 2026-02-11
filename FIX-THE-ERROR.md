# ⚡ Quick Fix - "created_at does not exist" Error

## 🎯 The Solution (90% of cases)

### **STEP 1: Run the Diagnostic**

Copy this into Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'report_generations', 'saved_scenarios');
```

**Click**: Run

---

### **STEP 2: Use the Fixed Version**

**File**: `COPY-THIS-TO-SUPABASE-FIXED.sql`

1. Open this file
2. Copy ENTIRE contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click "Run"

This version:
- ✅ Creates tables if they don't exist
- ✅ Safely adds columns (won't fail if they exist)
- ✅ Works with both new and legacy schemas

---

### **STEP 3: Verify It Worked**

Run this:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name LIKE '%report%';
```

**Expected**: 3 rows showing:
- `reports_generated_this_month`
- `last_report_generated_at`
- `has_generated_preview`

---

## ✅ Done!

Now test it:

```bash
npm run dev
```

Generate a report - should work! 🎉

---

## ❌ Still Not Working?

**Try the Legacy Version:**

**File**: `COPY-THIS-TO-SUPABASE-LEGACY.sql`

This works with older database structures.

---

## 📞 Need More Help?

**Check**: `TROUBLESHOOTING.md` for detailed solutions

**Or run**: `DIAGNOSTIC-CHECK.sql` to see exactly what you have
