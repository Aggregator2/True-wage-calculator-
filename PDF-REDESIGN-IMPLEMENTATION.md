# PDF Report Redesign Implementation Guide

## 🎨 What's Been Implemented

### 1. **Premium Visual Design System**
- **Color Palette**: Red (#DC2626), Navy (#1E293B), Green (#10B981)
- **Typography**: Helvetica with clear hierarchy (24-72pt for key numbers)
- **Layout**: Card-based design with shadows and rounded corners
- **Visual Elements**: Big number displays, progress indicators, section banners

### 2. **Chart Integration (Chart.js)**
✅ **New file**: `src/lib/chart-generator.ts`

**Available Charts**:
- `generateDonutChart()` - Income breakdown with center text
- `generateBarChart()` - Comparison charts (savings rate, etc.)
- `generateLineChart()` - FIRE projection over time
- `generateTimeCostChart()` - Time cost visualization with color intensity
- `generateComparisonChart()` - Simple 2-value comparisons

**How it works**:
1. Charts render on canvas (server-side using `canvas` package)
2. Convert to base64 PNG images
3. Embed in PDF at specified coordinates

### 3. **Freemium Preview System**
✅ **New file**: `src/lib/premium-report-generator.ts`

**Preview Report (Free Users)**:
- Page 1: Full hero page with key metrics (THE HOOK)
- Page 2: Partial financial snapshot + blur overlay
- Page 3: Upgrade CTA with pricing and benefits

**Blur Overlay Function**:
```typescript
addBlurOverlay(doc, x, y, width, height, message)
```
- Semi-transparent grey overlay
- Lock icon (🔒)
- "Upgrade Now" button
- Custom message

### 4. **Rate Limiting & Cost Management**
✅ **Updated**: `src/app/api/generate-report/route.ts`
✅ **New migration**: `supabase-migration-report-limits.sql`

**Limits**:
- **Free**: 1 preview report (ever)
- **Premium**: 5 full reports per month

**Database Tracking**:
```sql
user_profiles:
  - reports_generated_this_month: INTEGER
  - last_report_generated_at: TIMESTAMP
  - has_generated_preview: BOOLEAN

report_generations:
  - is_preview: BOOLEAN
```

**Auto-reset**: Monthly counter resets on 1st of each month

### 5. **Cost Optimization (Claude Haiku)**
✅ **Updated**: `src/lib/openrouter.ts`

**Model Strategy**:
- **FAST** (Haiku): ~$0.25 per 1M tokens → **$0.15 per report** ✅
- **DEEP** (Sonnet): Only for complex analysis
- **PREMIUM** (Opus): Rarely used

**Cost Comparison**:
| Model | Cost per Report | Monthly (5 reports) | Profit Margin |
|-------|----------------|---------------------|---------------|
| Opus | $2.25 | $11.25 | **-$4.25** 🔴 |
| Haiku | $0.15 | $0.75 | **+$6.25** 🟢 |

**Sustainability**: ✅ £7/month revenue - £0.75 cost = **£6.25 profit**

---

## 📋 Implementation Checklist

### ✅ Completed
- [x] Installed jsPDF v2.5.2
- [x] Created chart generation utilities
- [x] Built premium PDF generator with visual design
- [x] Implemented freemium preview system
- [x] Added rate limiting and cost management
- [x] Updated database schema for tracking
- [x] Switched to Claude Haiku for cost optimization

### 🔄 Next Steps (Required)

#### 1. **Run Database Migration**
```bash
# Connect to Supabase and run:
psql -f supabase-migration-report-limits.sql
```

Or via Supabase Dashboard → SQL Editor:
```sql
-- Copy contents of supabase-migration-report-limits.sql
```

#### 2. **Install Canvas Package (Server-side rendering)**
```bash
npm install canvas
```

**Why needed**: Chart.js requires a canvas to render on Node.js server
- Client-side: Uses HTML canvas
- Server-side: Needs `canvas` package

#### 3. **Update Environment Variables**
Add to `.env.local`:
```env
OPENROUTER_API_KEY=your_key_here
NEXT_PUBLIC_URL=https://truewage.uk
```

#### 4. **Test Report Generation**

**Test Preview (Free User)**:
```bash
# Ensure user has NOT generated preview yet
# Generate report → Should show 3-page preview with blur overlays
```

**Test Full Report (Premium User)**:
```bash
# User with premium subscription
# Generate report → Should show full report with all pages
```

**Test Rate Limiting**:
```bash
# Premium user: Generate 5 reports → 6th should fail with 429
# Free user: Generate 1 preview → 2nd should fail with 403
```

---

## 🎯 Key Features by Page

### **Page 1: Hero (Full for Everyone)**
```typescript
✓ Large red banner with title
✓ 2x2 grid of key metrics:
  - True Hourly Wage (£28.80)
  - Years to FIRE (20 yrs)
  - Annual Hidden Costs (£8,400)
  - Effective Tax Rate (38.5%)
✓ Controversial quote callout box
```

### **Page 2: Financial Snapshot**
```typescript
Preview:
  ✓ Donut chart (income breakdown)
  ✓ Basic metrics (3 items)
  ✓ BLUR OVERLAY for rest

Full:
  ✓ Donut chart (income breakdown)
  ✓ Bar chart (savings rate comparison)
  ✓ Full metrics breakdown
  ✓ Tax trap warnings
  ✓ Hidden costs analysis
```

### **Page 3: Upgrade CTA (Preview Only)**
```typescript
✓ Large heading: "Unlock Your Full Report"
✓ 8 benefits with checkmarks
✓ Pricing box: £7/month
✓ CTA: "Visit truewage.uk/upgrade"
```

### **Pages 4-12: Full Report (Premium Only)**
```typescript
✓ Controversial recommendations
✓ Quick wins with annual savings
✓ Strategic moves (uncomfortable ones)
✓ Risk assessment
✓ FIRE projection timeline
✓ Action plan (12 months)
✓ Sources & methodology
✓ Disclaimers
```

---

## 🔧 API Response Handling

### **Success Response**
```json
{
  "status": 200,
  "headers": {
    "Content-Type": "application/pdf",
    "Content-Disposition": "attachment; filename='truewage-report-2026-02-08.pdf'"
  },
  "body": <PDF Blob>
}
```

### **Rate Limit Exceeded (Premium)**
```json
{
  "status": 429,
  "error": "You've reached your Premium limit of 5 reports this month. Limit resets on the 1st.",
  "reportsUsed": 5,
  "limit": 5
}
```

### **Preview Already Used (Free)**
```json
{
  "status": 403,
  "error": "You've already generated your free preview. Upgrade to Premium for unlimited reports.",
  "upgradeUrl": "/pricing",
  "upgradeRequired": true
}
```

---

## 📊 Chart Examples

### **Income Breakdown (Donut)**
```typescript
const chartImage = await generateDonutChart(
  [
    { label: 'Take Home', value: 28719, color: '#10B981' },
    { label: 'Income Tax', value: 8732, color: '#DC2626' },
    { label: 'National Insurance', value: 4284, color: '#F59E0B' },
    { label: 'Pension', value: 2400, color: '#64748B' },
  ],
  '£28,719' // Center text
);

doc.addImage(chartImage, 'PNG', 20, 50, 80, 80);
```

### **Savings Rate Comparison (Bar)**
```typescript
const chartImage = await generateComparisonChart(
  'You',
  97.9,
  'UK Average',
  8.8,
  '#DC2626', // Red for user
  '#64748B'  // Grey for average
);

doc.addImage(chartImage, 'PNG', 20, 50, 80, 50);
```

---

## 💰 Cost Breakdown

### **Per Report Cost (Haiku)**
```
Input tokens:  50,000 @ $0.25/1M  = $0.0125
Output tokens: 20,000 @ $5.00/1M  = $0.1000
Chart.js:      Included (no cost)
PDF generation: Included (no cost)
------------------------
Total: ~$0.15 per report
```

### **Monthly Cost (Premium User)**
```
5 reports × $0.15 = $0.75
Revenue: £7.00
Profit: £6.25 per user 🎉
```

### **Break-even Point**
```
Server costs: ~£20/month
Break-even: 3.2 premium users
100 users = £625 profit/month
```

---

## 🚨 Known Issues & Fixes

### **Issue 1: Chart.js fails on server**
**Cause**: No canvas in Node.js environment
**Fix**: Install `canvas` package
```bash
npm install canvas
```

### **Issue 2: Fonts not loading**
**Cause**: jsPDF default fonts only
**Fix**: Use built-in Helvetica (already implemented)

### **Issue 3: Image quality low**
**Cause**: Low DPI for charts
**Fix**: Use 400x400 canvas for charts (already set)

### **Issue 4: PDF file too large**
**Cause**: High-res images
**Fix**: Compress charts to PNG with 80% quality (can add if needed)

---

## 🎨 Design System Reference

### **Colors**
```typescript
primary: '#DC2626'    // Red - warnings, key numbers
secondary: '#1E293B'  // Navy - headers
accent: '#10B981'     // Green - positive metrics
warning: '#F59E0B'    // Orange - caution
darkGray: '#64748B'   // Grey - secondary text
```

### **Typography Scale**
```typescript
Hero title: 32pt bold
Section headers: 24pt bold
Key numbers: 72pt bold (hero), 24pt (cards)
Body text: 10-12pt normal
Labels: 8-10pt normal
```

### **Spacing**
```typescript
Page margin: 20mm
Card padding: 5mm
Section spacing: 10-15mm
Line height: 5-6mm
```

---

## 📝 Testing Checklist

- [ ] Free user can generate 1 preview
- [ ] Free user blocked from 2nd preview
- [ ] Preview shows blur overlays correctly
- [ ] Preview has upgrade CTA on page 3
- [ ] Premium user can generate 5 reports
- [ ] Premium user blocked at 6th report
- [ ] Charts render correctly (donut, bar, line)
- [ ] PDF downloads with correct filename
- [ ] Monthly counter resets on 1st
- [ ] Cost per report is under £0.20

---

## 🚀 Deployment Steps

1. **Run database migration**
   ```bash
   # Via Supabase Dashboard
   ```

2. **Install canvas package**
   ```bash
   npm install canvas
   ```

3. **Deploy to Vercel/hosting**
   ```bash
   npm run build
   # Deploy
   ```

4. **Test in production**
   - Free user flow
   - Premium user flow
   - Rate limiting

5. **Monitor costs**
   - Check OpenRouter usage
   - Verify Haiku model is being used
   - Track monthly costs

---

## 📚 File Reference

### **New Files Created**
- `src/lib/chart-generator.ts` - Chart generation utilities
- `src/lib/premium-report-generator.ts` - Visual PDF generator
- `supabase-migration-report-limits.sql` - Database schema updates
- `PDF-REDESIGN-IMPLEMENTATION.md` - This guide

### **Modified Files**
- `src/app/api/generate-report/route.ts` - Rate limiting + new PDF
- `src/lib/openrouter.ts` - Switched to Haiku
- `package.json` - Updated jsPDF version

### **Required Packages**
- `jspdf@2.5.2` ✅ Installed
- `chart.js@4.5.1` ✅ Already installed
- `canvas` ⚠️ **Need to install**

---

## 🎯 Next Features (Future)

### **V2 Enhancements**
- [ ] Add more chart types (scatter, radar)
- [ ] Animated charts (GIF export)
- [ ] Multiple color themes
- [ ] PDF customization options
- [ ] Email delivery integration
- [ ] Report scheduling

### **Advanced Features**
- [ ] Interactive PDF (fillable forms)
- [ ] Comparison overlays (2 scenarios)
- [ ] Export to PowerPoint
- [ ] Mobile-optimized PDFs
- [ ] Print-friendly layouts

---

## 💡 Tips & Best Practices

1. **Chart Performance**: Pre-generate charts, cache if possible
2. **Error Handling**: Always have fallback text if charts fail
3. **Cost Monitoring**: Log OpenRouter usage per user
4. **Rate Limiting**: Be strict on free tier, generous on premium
5. **User Experience**: Show preview before requiring upgrade
6. **A/B Testing**: Test different upgrade CTAs
7. **Feedback Loop**: Track which reports convert to premium

---

## 📞 Support & Issues

**If charts don't render**:
```bash
npm install canvas
# Restart dev server
```

**If rate limiting doesn't work**:
```sql
-- Check user profile
SELECT * FROM user_profiles WHERE id = 'user_id';

-- Reset counter manually
UPDATE user_profiles
SET reports_generated_this_month = 0
WHERE id = 'user_id';
```

**If costs are too high**:
```typescript
// Verify model is Haiku
console.log('Using model:', MODELS.FAST);
// Should output: 'anthropic/claude-haiku-4-5'
```

---

## 🎉 Success Metrics

**Target KPIs**:
- Preview → Premium conversion: >15%
- Cost per report: <£0.20
- Report generation time: <30 seconds
- User satisfaction: >4.5/5
- Monthly profit per premium user: >£6

**Current Status**: ✅ Implementation Complete, Ready for Testing

---

**Questions?** Check the code comments in:
- `src/lib/premium-report-generator.ts`
- `src/lib/chart-generator.ts`
- `src/app/api/generate-report/route.ts`
