# PDF Redesign + Cost Optimization + Freemium Preview Plan

## Overview
Three major changes:
1. **Redesign PDF** - Transform text-heavy report into premium annual-report style with charts
2. **Switch AI to Haiku** - Replace Opus with Haiku for cost sustainability
3. **Freemium preview system** - Free users get a 3-page teaser, premium gets full report

---

## Part 1: Switch AI Models (Cost Optimization)

### File: `src/lib/openrouter.ts`
- Change `DEEP: 'anthropic/claude-opus-4'` → `DEEP: 'anthropic/claude-haiku-4-5-20251001'`
- This alone reduces cost from ~$2.25/report to ~$0.15/report
- Haiku 4.5 is still very capable for financial analysis text generation
- Keep `FAST: 'anthropic/claude-sonnet-4'` for Stage 1 (it's already fast + cheap)

---

## Part 2: Redesign PDF (`src/lib/report-generator.ts`)

### Approach
- Keep jsPDF (already installed) - draw all charts natively using jsPDF primitives
- No Chart.js-to-image pipeline needed (avoids canvas/server-side rendering complexity)
- Build reusable drawing helpers: donut chart, bar chart, line chart, cards, big numbers
- All drawn directly with jsPDF `rect`, `circle`, `triangle`, `line`, `text` calls (same approach as the existing `drawPieChart`)

### New Design System (constants at top of file)
```
COLORS: primary #DC2626, secondary #1E293B, accent #10B981, warning #F59E0B
        greys: #F8FAFC, #E2E8F0, #64748B, white #FFFFFF
MARGINS: 20mm all sides, content width 170mm
TYPOGRAPHY: Helvetica Bold 24-32pt headings, 10-12pt body, 48-72pt big numbers
```

### Reusable Drawing Helpers to Build
1. `drawDonutChart(doc, cx, cy, radius, data[], centerText)` - Donut with center label
2. `drawBarChart(doc, x, y, w, h, data[], labels[], colors[])` - Vertical/horizontal bars
3. `drawLineChart(doc, x, y, w, h, datasets[], xLabels[])` - Multi-line with fill
4. `drawHorizontalBars(doc, x, y, w, data[])` - Horizontal bar chart for time costs
5. `addCard(doc, x, y, w, h, options)` - Card with border, optional shadow, background
6. `addBigNumber(doc, number, label, x, y, color)` - Giant stat display (48-72pt)
7. `addSectionDivider(doc, title, pageNum)` - Full-width colored bar with title
8. `addProgressBar(doc, x, y, w, value, max, color)` - Rounded progress bar
9. `addBlurOverlay(doc, x, y, w, h, message)` - Grey overlay for preview mode

### Page-by-Page Layout

**PAGE 1 - HERO/COVER**
- Full red/navy background shape (top half)
- "Your Financial Reality" white on red, 32pt
- "Prepared for [Name] | [Date]" subtitle
- 2 big number cards: True Hourly Wage + Years to FIRE
- Controversial quote callout at bottom

**PAGE 2 - FINANCIAL SNAPSHOT (Left)**
- Donut chart: Income breakdown (gross → tax → NI → student loan → pension → take-home)
  - Center text: take-home amount
  - Colors: Red for deductions, Green for take-home
- Bar chart: Savings rate (You vs UK Average 8.8%)
- 3x2 stat card grid (gross salary, net salary, effective tax rate, true wage, hidden costs, years to FI)

**PAGE 3 - FINANCIAL SNAPSHOT (Right)**
- Line chart: FIRE projection over 30 years
  - 3 lines: Current path, With quick wins, With full plan
  - Filled areas under lines
- Tax breakdown table in card format
- Key metrics cards

**PAGE 4 - SPENDING ANALYSIS**
- Horizontal bar chart: spending categories (housing, food, transport, etc.)
- "Time cost" bars: hours worked per expense category (at true hourly wage)
- Callout boxes with controversial insights from AI

**PAGE 5-6 - CONTROVERSIAL RECOMMENDATIONS**
- Each recommendation in a card with:
  - Title + icon (Unicode symbols)
  - Annual savings in LARGE text (48pt)
  - Years saved metric
  - Conventional wisdom (red box) vs Data shows (green box)
  - Math proof in grey box

**PAGE 7-8 - ACTION PLAN TIMELINE**
- Visual timeline: Months 1-3, 4-6, 7-12, Years 2-5
- Each action as a card with impact metrics
- Progress bar showing compound effect
- Critical path items highlighted

**PAGE 9 - RISKS**
- Risk cards with red borders
- Likelihood + Impact indicators
- Emergency fund status bar
- Warning callouts

**PAGE 10 - THE ONE NUMBER**
- Full-page spread with giant FIRE age number (72pt)
- "If you do everything" vs "If you do nothing" comparison
- Final closing line from AI

**PAGE 11 - SOURCES & METHODOLOGY** (existing content, new layout)

**PAGE 12 - DISCLAIMERS** (existing content, new layout)

---

## Part 3: Freemium Preview System

### API Route Changes (`src/app/api/generate-report/route.ts`)
- Pass `isPremium` flag to `generateProfessionalPDF()`
- Free users: generate 3-page preview (no AI calls needed for the teaser)
- Premium users: full 12-page report with AI analysis
- Free users still get ONE free preview (existing `report_generations` count logic stays)

### Preview PDF (3 pages)
**Page 1 (Full - The Hook):** Complete hero page with real numbers (no blur)
**Page 2 (Partial - The Tease):** Show donut chart + savings rate, blur the rest
**Page 3 (Upgrade CTA):** "Unlock Your Full Report" with benefits list + pricing

### Key Decision: AI for free preview?
- **NO** - Free preview uses only raw `ComprehensiveUserData` numbers (no AI calls)
- This means free reports cost $0 to generate
- Only premium reports trigger the 4-stage AI pipeline
- The hook page (page 1) uses real calculator data, not AI text

### Dashboard Button Changes (`src/app/dashboard/page.tsx`)
- Show "Generate Free Preview" for free users (who haven't used their free report)
- Show "Upgrade to Generate Reports" for free users who have used their preview
- Show "Generate Full Report" for premium users
- Add progress indicator text during generation ("Analyzing your finances...")

---

## Implementation Order

1. **Switch AI model** in openrouter.ts (1 line change)
2. **Build drawing helpers** in report-generator.ts (new functions)
3. **Redesign `generateProfessionalPDF`** page by page using new helpers
4. **Add blur overlay + preview mode** to PDF generator
5. **Update API route** to pass isPremium and skip AI for free previews
6. **Update dashboard button** UI for free/premium states

---

## Files Modified
- `src/lib/openrouter.ts` - Model change (DEEP → Haiku)
- `src/lib/report-generator.ts` - Complete rewrite of `generateProfessionalPDF`, new helpers, preview mode
- `src/app/api/generate-report/route.ts` - Preview vs full logic, skip AI for free
- `src/app/dashboard/page.tsx` - Button states, progress text

## No New Files Needed
Everything fits within existing file structure.
