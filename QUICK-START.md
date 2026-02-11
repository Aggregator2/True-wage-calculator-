# 🚀 Quick Start Guide - Report System

## ✅ Step 1: Canvas Package (DONE)
```bash
✓ Canvas installed successfully
```

---

## 📊 Step 2: Import to Supabase

### **Copy & Paste This Single File:**

**Go to**: [Supabase Dashboard](https://app.supabase.com) → Your Project → **SQL Editor**

**Click**: "New Query"

**Copy & Paste**: The entire contents of `supabase-migration-report-limits.sql`

**Click**: "Run" button (or press Ctrl+Enter)

**Expected**: ✅ Success message

---

## 🧪 Step 3: Verify (Optional but Recommended)

**Run this test query** in SQL Editor:

```sql
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

---

## 🎯 Step 4: Test Report Generation

### **Start your dev server:**
```bash
cd C:\Users\joeri\OneDrive\Desktop\uk-freedom-calculator
npm run dev
```

### **Test as Free User:**
1. Login (make sure user is NOT premium)
2. Complete calculator
3. Click "Generate Report"
4. **Expected**: 3-page preview PDF with blur overlays ✅
5. Try generating again
6. **Expected**: Error message "You've already generated your free preview" ✅

### **Test as Premium User:**
1. Update user in Supabase:
```sql
UPDATE user_profiles
SET subscription_status = 'premium'
WHERE email = 'your-email@example.com';
```
2. Generate report
3. **Expected**: Full 12+ page report ✅
4. Generate 4 more reports (total 5)
5. Try generating 6th report
6. **Expected**: Error "You've reached your Premium limit" ✅

---

## 📁 Files Reference

### **For Supabase Import (Choose One):**
1. ✅ **Recommended**: `supabase-migration-report-limits.sql` (single file, complete)
2. **Alternative**: Run step-by-step:
   - `supabase-step-1-add-columns.sql`
   - `supabase-step-2-create-indexes.sql`
   - `supabase-step-3-create-functions.sql`

### **For Testing:**
- `supabase-test-queries.sql` - Verification queries
- `SUPABASE-IMPORT-GUIDE.md` - Full detailed guide

---

## ❓ Troubleshooting

### **Error: "table user_profiles does not exist"**
Your user_profiles table might not exist. Create it first or check table name.

### **Error: Charts not showing**
Verify canvas is installed:
```bash
npm list canvas
# Should show: canvas@2.x.x ✅
```

### **Rate limiting not working**
Check user data:
```sql
SELECT
  email,
  subscription_status,
  reports_generated_this_month,
  has_generated_preview
FROM user_profiles
WHERE email = 'your-email@example.com';
```

---

## 🎉 You're Done!

**Your report system now has:**
- ✅ Premium visual design (red/navy/green)
- ✅ Chart.js integration (donut, bar, line charts)
- ✅ Freemium preview (3 pages with blur overlay)
- ✅ Rate limiting (1 free preview, 5 premium/month)
- ✅ Cost optimization (£0.15 per report with Haiku)

**Profitability**: £7/month - £0.75 = **£6.25 profit per premium user** 💰

---

## 📞 Next Steps

1. Test with real users
2. Monitor OpenRouter costs
3. Adjust rate limits if needed
4. Add more chart types (optional)
5. Set up monthly counter reset (see guide)

**Need more details?** → See `SUPABASE-IMPORT-GUIDE.md`
