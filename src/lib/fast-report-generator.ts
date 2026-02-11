/**
 * FAST Premium Report Generator
 * Pre-designed templates + real user data = instant compelling reports
 * Inspired by: JPMorgan annual reports, financial dashboards
 */

import { jsPDF } from 'jspdf';
import type { ComprehensiveUserData, AIAnalysisResult } from './openrouter';

// ============================================================================
// COLOR PALETTE (Premium - inspired by financial annual reports)
// ============================================================================

const COLORS = {
  navy: '#1E3A5F',      // Deep navy (JPMorgan style)
  gold: '#B8860B',      // Gold accent
  red: '#DC2626',       // Alert red
  green: '#10B981',     // Success green
  lightGray: '#F8FAFC',
  darkGray: '#64748B',
  white: '#FFFFFF',
  orange: '#F59E0B',
} as const;

// ============================================================================
// REPORT DATA INTERFACE
// ============================================================================

export interface FastReportData {
  userData: ComprehensiveUserData;
  aiAnalysis?: AIAnalysisResult; // Optional - we'll use real data instead
  generatedAt: string;
  userName?: string;
  reportType: 'preview' | 'full';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

/**
 * Draw a simple donut chart manually (no Chart.js delay)
 */
function drawDonutChart(
  doc: jsPDF,
  x: number,
  y: number,
  radius: number,
  data: { label: string; value: number; color: string }[]
) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return;

  let startAngle = -Math.PI / 2;
  const innerRadius = radius * 0.6;

  data.forEach((segment) => {
    if (segment.value <= 0) return;

    const sliceAngle = (segment.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const rgb = hexToRgb(segment.color);

    doc.setFillColor(...rgb);

    // Draw outer arc
    doc.circle(x, y, radius, 'F');

    // Draw slice (simplified - just show segments)
    const midAngle = startAngle + sliceAngle / 2;
    const labelX = x + (radius + 15) * Math.cos(midAngle);
    const labelY = y + (radius + 15) * Math.sin(midAngle);

    // Small color indicator
    doc.setFillColor(...rgb);
    doc.circle(labelX - 8, labelY - 1, 2, 'F');

    // Label
    const percentage = ((segment.value / total) * 100).toFixed(0);
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text(`${segment.label} ${percentage}%`, labelX - 5, labelY);

    startAngle = endAngle;
  });

  // White inner circle (donut hole)
  doc.setFillColor(255, 255, 255);
  doc.circle(x, y, innerRadius, 'F');

  // Center text
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(COLORS.navy));
  doc.text(`£${(total / 1000).toFixed(1)}k`, x, y + 2, { align: 'center' });
}

/**
 * Draw a simple bar chart
 */
function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: { label: string; value: number; color: string }[]
) {
  const maxValue = Math.max(...data.map(d => d.value));
  const barHeight = 12;
  const spacing = 4;

  data.forEach((item, i) => {
    const barY = y + i * (barHeight + spacing);
    const barWidth = (item.value / maxValue) * width;
    const rgb = hexToRgb(item.color);

    // Bar
    doc.setFillColor(...rgb);
    doc.roundedRect(x, barY, barWidth, barHeight, 2, 2, 'F');

    // Label
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(item.label, x, barY - 2);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.value.toFixed(1)}%`, x + barWidth + 5, barY + 8);
  });
}

/**
 * Add upgrade CTA with direct link
 */
function addUpgradeCTA(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const y = 50;

  // Title
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(COLORS.navy));
  doc.text('See The Full Picture', pageWidth / 2, y, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Unlock comprehensive analysis with real numbers', pageWidth / 2, y + 10, {
    align: 'center',
  });

  // Benefits
  const benefits = [
    '✓ Complete tax optimization strategies (save £2k-8k/year)',
    '✓ Personalized FIRE roadmap with exact timeline',
    '✓ Geographic arbitrage calculator (UK vs EU)',
    '✓ Hidden cost analysis (commute, stress, time)',
    '✓ 4-day week impact calculator',
    '✓ Pension vs ISA optimization',
    '✓ Real-time scenario comparisons',
    '✓ Monthly updates with new strategies',
  ];

  let benefitY = y + 30;
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);

  benefits.forEach((benefit) => {
    doc.text(benefit, 30, benefitY);
    benefitY += 8;
  });

  // Pricing box
  benefitY += 10;
  const boxY = benefitY;
  doc.setFillColor(...hexToRgb(COLORS.navy));
  doc.roundedRect(40, boxY, pageWidth - 80, 45, 5, 5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('£7/month', pageWidth / 2, boxY + 18, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Cancel anytime • First report in 2 minutes', pageWidth / 2, boxY + 30, {
    align: 'center',
  });

  // Direct link
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(COLORS.gold));
  const linkY = boxY + 60;
  doc.text('👉 truewage.uk/pricing', pageWidth / 2, linkY, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('(Copy this link to upgrade now)', pageWidth / 2, linkY + 6, { align: 'center' });
}

// ============================================================================
// MAIN GENERATION FUNCTION (FAST - NO AI DELAY)
// ============================================================================

export async function generateFastReport(data: FastReportData): Promise<Blob> {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const userData = data.userData;
  const isPreview = data.reportType === 'preview';

  // ========================================================================
  // PAGE 1: HERO - THE HOOK (Show real shocking numbers)
  // ========================================================================

  // Navy header
  doc.setFillColor(...hexToRgb(COLORS.navy));
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Financial Reality', pageWidth / 2, 35, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Prepared for ${userData.profile.name || 'You'} | ${new Date().toLocaleDateString('en-GB')}`,
    pageWidth / 2,
    50,
    { align: 'center' }
  );

  // Gold accent line
  doc.setFillColor(...hexToRgb(COLORS.gold));
  doc.rect(pageWidth / 2 - 30, 58, 60, 2, 'F');

  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('Data-backed analysis • No fluff', pageWidth / 2, 72, { align: 'center' });

  // Key metrics grid (2x2)
  const boxWidth = (contentWidth - 15) / 2;
  const boxHeight = 38;
  let yPos = 105;

  // Metric 1: True Hourly Wage (SHOCKING)
  doc.setFillColor(...hexToRgb(COLORS.lightGray));
  doc.roundedRect(margin, yPos, boxWidth, boxHeight, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('YOUR TRUE HOURLY WAGE', margin + 5, yPos + 10);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(COLORS.red));
  doc.text(`£${userData.income.trueHourlyWage.toFixed(2)}`, margin + 5, yPos + 28);

  // Metric 2: Years to FIRE
  doc.setFillColor(...hexToRgb(COLORS.lightGray));
  doc.roundedRect(margin + boxWidth + 15, yPos, boxWidth, boxHeight, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('YEARS TO FIRE', margin + boxWidth + 20, yPos + 10);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(COLORS.green));
  doc.text(
    `${userData.fireJourney.projections.standardFI.yearsToReach.toFixed(1)}`,
    margin + boxWidth + 20,
    yPos + 28
  );

  yPos += boxHeight + 8;

  // Metric 3: Hidden Costs
  doc.setFillColor(...hexToRgb(COLORS.lightGray));
  doc.roundedRect(margin, yPos, boxWidth, boxHeight, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('HIDDEN ANNUAL COSTS', margin + 5, yPos + 10);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(COLORS.orange));
  doc.text(`£${userData.income.hiddenAnnualCost.toLocaleString()}`, margin + 5, yPos + 28);

  // Metric 4: Savings Rate
  doc.setFillColor(...hexToRgb(COLORS.lightGray));
  doc.roundedRect(margin + boxWidth + 15, yPos, boxWidth, boxHeight, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('CURRENT SAVINGS RATE', margin + boxWidth + 20, yPos + 10);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const savingsColor =
    userData.spending.savingsRate > 30 ? COLORS.green : userData.spending.savingsRate > 15 ? COLORS.orange : COLORS.red;
  doc.setTextColor(...hexToRgb(savingsColor));
  doc.text(`${userData.spending.savingsRate.toFixed(1)}%`, margin + boxWidth + 20, yPos + 28);

  yPos += boxHeight + 10;

  // The Gap Analysis (COMPELLING)
  const trueWage = userData.income.trueHourlyWage;
  const statedWage = userData.income.statedHourlyWage;
  const gap = statedWage - trueWage;
  const gapPercent = ((gap / statedWage) * 100).toFixed(0);

  doc.setFillColor(255, 245, 235);
  doc.roundedRect(margin, yPos, contentWidth, 35, 5, 5, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(COLORS.red));
  doc.text(`You think you earn £${statedWage.toFixed(2)}/hour`, margin + 8, yPos + 12);
  doc.text(`You actually earn £${trueWage.toFixed(2)}/hour`, margin + 8, yPos + 22);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`That's ${gapPercent}% of your time working for free (£${gap.toFixed(2)}/hour lost)`, margin + 8, yPos + 30);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 1 | Educational analysis only - not financial advice', pageWidth / 2, pageHeight - 10, {
    align: 'center',
  });

  // ========================================================================
  // PAGE 2: INCOME BREAKDOWN WITH REAL CHARTS
  // ========================================================================

  doc.addPage();
  yPos = 20;

  // Navy header
  doc.setFillColor(...hexToRgb(COLORS.navy));
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Where Your Money Actually Goes', margin, 25);

  yPos = 50;

  // Income breakdown donut chart (REAL DATA)
  const incomeData = [
    { label: 'Take Home', value: userData.income.netAnnualSalary, color: COLORS.green },
    { label: 'Income Tax', value: userData.income.incomeTax, color: COLORS.red },
    { label: 'NI', value: userData.income.nationalInsurance, color: COLORS.orange },
    { label: 'Pension', value: userData.income.pensionContributions.total, color: COLORS.darkGray },
  ];

  drawDonutChart(doc, margin + 40, yPos + 30, 30, incomeData);

  // Key insights (RIGHT SIDE)
  const insightX = margin + 100;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(COLORS.navy));
  doc.text('The Reality:', insightX, yPos + 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const insights = [
    `Gross salary: £${userData.income.grossAnnualSalary.toLocaleString()}`,
    `You keep: £${userData.income.netAnnualSalary.toLocaleString()} (${((userData.income.netAnnualSalary / userData.income.grossAnnualSalary) * 100).toFixed(0)}%)`,
    `Tax + NI: £${(userData.income.incomeTax + userData.income.nationalInsurance).toLocaleString()}`,
    `Effective rate: ${userData.income.effectiveTaxRate.toFixed(1)}%`,
  ];

  let insightY = yPos + 20;
  insights.forEach((insight) => {
    doc.text(insight, insightX, insightY);
    insightY += 7;
  });

  yPos += 75;

  // Savings rate comparison (BAR CHART)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(COLORS.navy));
  doc.text('How You Compare:', margin, yPos);

  yPos += 10;

  const savingsComparison = [
    { label: 'Your Savings Rate', value: userData.spending.savingsRate, color: COLORS.green },
    { label: 'UK Average', value: 8.8, color: COLORS.darkGray },
  ];

  drawBarChart(doc, margin, yPos, contentWidth - 40, 40, savingsComparison);

  yPos += 60;

  if (isPreview) {
    // PREVIEW: Show blur overlay
    doc.setFillColor(100, 100, 100);
    doc.setGState(new (doc as any).GState({ opacity: 0.9 }));
    doc.roundedRect(margin, yPos, contentWidth, 60, 3, 3, 'F');
    doc.setGState(new (doc as any).GState({ opacity: 1.0 }));

    doc.setFontSize(40);
    doc.setTextColor(255, 255, 255);
    doc.text('🔒', pageWidth / 2, yPos + 25, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Unlock Full Analysis', pageWidth / 2, yPos + 40, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('See hidden costs, tax optimization & FIRE timeline', pageWidth / 2, yPos + 50, {
      align: 'center',
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 2 | Educational analysis only - not financial advice', pageWidth / 2, pageHeight - 10, {
    align: 'center',
  });

  // ========================================================================
  // PAGE 3: UPGRADE CTA (Preview) or Continue (Full)
  // ========================================================================

  if (isPreview) {
    doc.addPage();
    addUpgradeCTA(doc, pageWidth, pageHeight);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Page 3 | Upgrade to unlock full report', pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });
  } else {
    // Full report continues with more pages...
    // (Add more comprehensive analysis here)
  }

  return doc.output('blob');
}
