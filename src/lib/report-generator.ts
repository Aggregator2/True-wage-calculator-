import { jsPDF } from 'jspdf';
import type { MultiScenario } from './scenarios';
import type { ComprehensiveUserData, AIAnalysisResult } from './openrouter';

// ============================================================================
// HELPER: PIE CHART
// ============================================================================

function drawPieChart(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  radius: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  title?: string
) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return;

  let startAngle = -Math.PI / 2;

  if (title) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(64, 64, 64);
    doc.text(title, centerX, centerY - radius - 8, { align: 'center' });
  }

  data.forEach((segment) => {
    if (segment.value <= 0) return;

    const sliceAngle = (segment.value / total) * 2 * Math.PI;

    doc.setFillColor(...segment.color);
    doc.setDrawColor(...segment.color);
    doc.setLineWidth(0.5);

    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const angle1 = startAngle + (sliceAngle * i) / steps;
      const angle2 = startAngle + (sliceAngle * (i + 1)) / steps;

      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);

      doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');
    }

    startAngle += sliceAngle;
  });

  let legendY = centerY + radius + 10;
  const legendX = centerX - 35;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  data.forEach((segment) => {
    if (segment.value <= 0) return;

    const percentage = ((segment.value / total) * 100).toFixed(0);
    doc.setFillColor(...segment.color);
    doc.rect(legendX, legendY - 2, 4, 4, 'F');
    doc.setTextColor(64, 64, 64);
    doc.text(`${segment.label}: ${percentage}%`, legendX + 6, legendY + 1);
    legendY += 6;
  });
}

// ============================================================================
// FCA-COMPLIANT DISCLAIMERS
// ============================================================================

const DISCLAIMERS = {
  main: `IMPORTANT NOTICE: This report is for educational and informational purposes only. It does not constitute financial advice, tax advice, investment advice, or any other form of professional advice. The calculations and projections contained herein are based on the information you provided and standard assumptions, which may not reflect your actual circumstances.

Before making any financial decisions, you should consult with a qualified financial adviser, tax professional, or other appropriate expert who can consider your individual circumstances.

TrueWage is not authorised or regulated by the Financial Conduct Authority (FCA) and is not permitted to provide regulated financial advice.`,

  projections: `PROJECTION DISCLAIMER: All projections and forecasts are hypothetical illustrations based on mathematical models and historical data. Past performance is not indicative of future results. Actual outcomes may vary significantly from these projections due to market conditions, inflation, tax law changes, and other factors.`,

  tax: `TAX INFORMATION DISCLAIMER: Tax information provided is for illustrative purposes only and based on current UK tax rates and bands. Tax laws change frequently. For accurate tax advice specific to your situation, consult HMRC directly or engage a qualified tax professional.`,
};

// ============================================================================
// COLOR SCHEME - Professional Navy/Cyan
// ============================================================================

const COLORS = {
  primary: [10, 25, 41] as [number, number, number],       // Navy
  accent: [0, 217, 255] as [number, number, number],       // Cyan
  success: [0, 230, 118] as [number, number, number],      // Green
  warning: [255, 107, 53] as [number, number, number],     // Orange
  text: [0, 0, 0] as [number, number, number],             // Black
  lightGray: [245, 245, 245] as [number, number, number],  // Light background
  white: [255, 255, 255] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  darkGray: [100, 100, 100] as [number, number, number],
};

// ============================================================================
// REPORT DATA INTERFACES
// ============================================================================

// New comprehensive report data interface
export interface ComprehensiveReportData {
  userData: ComprehensiveUserData;
  aiAnalysis: AIAnalysisResult;
  generatedAt: string;
  userName?: string;
}

// Legacy report data interface (kept for backward compatibility)
export interface ReportData {
  primary: MultiScenario;
  comparisons: MultiScenario[];
  aiAnalysis: {
    executiveSummary: any;
    taxAnalysis: any;
    scenarioComparison: any | null;
    fireProjection: any;
    actionPlan: any;
  };
  generatedAt: string;
  userName?: string;
}

// ============================================================================
// PROFESSIONAL PDF GENERATION (NEW)
// ============================================================================

/**
 * Generate a controversial, data-backed FIRE report PDF
 * Reddit-post style analysis that challenges conventional wisdom
 * Uses multi-stage AI analysis and ComprehensiveUserData
 */
export async function generateProfessionalPDF(data: ComprehensiveReportData): Promise<Blob> {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let currentPage = 1;
  let yPos = 20;

  const userData = data.userData;
  const ai = data.aiAnalysis;

  // ===== HELPERS =====
  function addHeader(text: string, level: 1 | 2 | 3 = 1) {
    const sizes = { 1: 18, 2: 14, 3: 12 };
    doc.setFontSize(sizes[level]);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += (level === 1 ? 12 : level === 2 ? 10 : 8) + (lines.length - 1) * 6;
  }

  function addParagraph(text: string) {
    if (!text) return;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 5 + 5;
  }

  function addBoldParagraph(text: string) {
    if (!text) return;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 5 + 5;
  }

  function addKeyMetric(label: string, value: string, color: 'success' | 'warning' | 'accent' = 'accent') {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.darkGray);
    doc.text(label, margin, yPos);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS[color]);
    doc.text(value, margin, yPos + 6);
    yPos += 15;
  }

  function checkPageBreak(spaceNeeded: number = 20) {
    if (yPos + spaceNeeded > pageHeight - 30) {
      doc.addPage();
      currentPage++;
      yPos = 20;
      addPageFooter();
    }
  }

  function addPageFooter() {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${currentPage} | TrueWage FIRE Report | ${new Date(data.generatedAt).toLocaleDateString('en-GB')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Educational analysis only - not financial advice', pageWidth / 2, pageHeight - 6, { align: 'center' });
  }

  function addSectionBanner(title: string) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 28);
    yPos = 55;
  }

  function addCalloutBox(text: string, type: 'warning' | 'success' | 'accent' = 'accent') {
    checkPageBreak(25);
    const bgColors: Record<string, [number, number, number]> = {
      warning: [255, 245, 235],
      success: [235, 255, 245],
      accent: [235, 250, 255],
    };
    doc.setFillColor(...bgColors[type]);
    const lines = doc.splitTextToSize(text, contentWidth - 10);
    const boxHeight = Math.max(15, lines.length * 5 + 10);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS[type]);
    doc.text(lines, margin + 5, yPos + 7);
    yPos += boxHeight + 5;
  }

  // ========================================================================
  // PAGE 1: THE UNCOMFORTABLE TRUTH (COVER)
  // ========================================================================
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 85, 'F');

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('The Uncomfortable Truth', pageWidth / 2, 30, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('About Your Finances', pageWidth / 2, 42, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(200, 220, 255);
  doc.text(`Prepared for ${userData.profile.name} | ${new Date(data.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 58, { align: 'center' });
  doc.setFontSize(9);
  doc.text('A data-backed analysis that challenges conventional financial wisdom', pageWidth / 2, 70, { align: 'center' });

  yPos = 100;

  // The gut-punch opening
  if (ai.profileSynthesis?.uncomfortableTruth) {
    doc.setFillColor(255, 245, 235);
    const truthLines = doc.splitTextToSize(ai.profileSynthesis.uncomfortableTruth, contentWidth - 16);
    const truthBoxHeight = Math.max(30, truthLines.length * 5 + 16);
    doc.roundedRect(margin, yPos, contentWidth, truthBoxHeight, 5, 5, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.warning);
    doc.text(truthLines, margin + 8, yPos + 10);
    yPos += truthBoxHeight + 10;
  }

  // Key metrics 2x2
  const halfWidth = (contentWidth - 10) / 2;
  const boxH = 32;

  checkPageBreak(boxH * 2 + 15);

  // Row 1
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(margin, yPos, halfWidth, boxH, 3, 3, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.darkGray);
  doc.text('TRUE HOURLY WAGE', margin + 5, yPos + 9);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.warning);
  doc.text(`\u00A3${(userData.income.trueHourlyWage || 0).toFixed(2)}`, margin + 5, yPos + 23);

  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(margin + halfWidth + 10, yPos, halfWidth, boxH, 3, 3, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.darkGray);
  doc.text('STATED HOURLY WAGE', margin + halfWidth + 15, yPos + 9);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.success);
  doc.text(`\u00A3${(userData.income.statedHourlyWage || 0).toFixed(2)}`, margin + halfWidth + 15, yPos + 23);

  yPos += boxH + 5;

  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(margin, yPos, halfWidth, boxH, 3, 3, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.darkGray);
  doc.text('ANNUAL HIDDEN COSTS', margin + 5, yPos + 9);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.red);
  doc.text(`\u00A3${(userData.income.hiddenAnnualCost || 0).toLocaleString()}`, margin + 5, yPos + 23);

  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(margin + halfWidth + 10, yPos, halfWidth, boxH, 3, 3, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.darkGray);
  doc.text('YEARS TO FINANCIAL INDEPENDENCE', margin + halfWidth + 15, yPos + 9);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.accent);
  doc.text(`${(userData.fireJourney.projections.standardFI.yearsToReach || 0).toFixed(1)}`, margin + halfWidth + 15, yPos + 23);

  doc.setFontSize(7); doc.setTextColor(...COLORS.darkGray);
  doc.text('Educational analysis only. Not financial advice. Consult a qualified advisor.', pageWidth / 2, pageHeight - 15, { align: 'center' });
  addPageFooter();

  // ========================================================================
  // PAGE 2-3: INCOME REALITY CHECK
  // ========================================================================
  doc.addPage(); currentPage++;
  addSectionBanner('Income Reality Check');

  if (ai.profileSynthesis?.incomeReality) {
    addParagraph(ai.profileSynthesis.incomeReality);
  }

  addHeader('The Numbers', 2);
  addKeyMetric('Gross Annual Salary', `\u00A3${(userData.income.grossAnnualSalary || 0).toLocaleString()}`);
  addKeyMetric('What You Actually Keep', `\u00A3${(userData.income.netAnnualSalary || 0).toLocaleString()}`, 'warning');
  addKeyMetric('Effective Tax Rate', `${(userData.income.effectiveTaxRate || 0).toFixed(1)}%`);
  addKeyMetric('True Hourly Wage (After Everything)', `\u00A3${(userData.income.trueHourlyWage || 0).toFixed(2)}`, 'warning');

  if (userData.income.hourlyWageDifference > 0) {
    addCalloutBox(`You think you earn \u00A3${(userData.income.statedHourlyWage || 0).toFixed(2)}/hour. You actually earn \u00A3${(userData.income.trueHourlyWage || 0).toFixed(2)}/hour. That's \u00A3${(userData.income.hourlyWageDifference || 0).toFixed(2)} per hour you're working for free.`, 'warning');
  }

  if (userData.income.inTaxTrap) {
    checkPageBreak(30);
    doc.setFillColor(255, 230, 230);
    doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'F');
    yPos += 8;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.red);
    doc.text('THE \u00A3100K TAX TRAP', margin + 5, yPos);
    yPos += 7;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.text);
    doc.text(`Your marginal tax rate is effectively 60%. You're losing \u00A3${(userData.income.taxTrapCost || 0).toLocaleString()} to lost personal allowance.`, margin + 5, yPos);
    yPos += 5;
    doc.text('Between \u00A3100k-\u00A3125k, every extra pound costs you 60p in tax. Not a typo.', margin + 5, yPos);
    yPos += 18;
  }

  addPageFooter();

  // ========================================================================
  // PAGE 4-5: THE SPENDING NOBODY TALKS ABOUT
  // ========================================================================
  doc.addPage(); currentPage++;
  addSectionBanner('The Spending Nobody Talks About');

  if (ai.profileSynthesis?.hiddenCostsBombshell) {
    addParagraph(ai.profileSynthesis.hiddenCostsBombshell);
  }

  if (ai.profileSynthesis?.spendingPatterns) {
    checkPageBreak();
    addHeader('What Your Spending Says About You', 2);
    addParagraph(ai.profileSynthesis.spendingPatterns);
  }

  addKeyMetric('Savings Rate', `${(userData.spending.savingsRate || 0).toFixed(1)}%`, userData.spending.savingsRate >= 30 ? 'success' : userData.spending.savingsRate >= 15 ? 'accent' : 'warning');

  if (ai.profileSynthesis?.timeTradeoffs) {
    checkPageBreak();
    addHeader('Time You\'re Trading Away', 2);
    addParagraph(ai.profileSynthesis.timeTradeoffs);
  }

  // Cross-system hidden costs
  if (ai.optimizationAnalysis?.crossSystemOpportunities?.length > 0) {
    checkPageBreak();
    addHeader('Hidden Costs Across Your Life', 2);
    ai.optimizationAnalysis.crossSystemOpportunities.forEach((opp: any) => {
      checkPageBreak(30);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.accent);
      const insightLines = doc.splitTextToSize(opp.insight || '', contentWidth - 5);
      doc.text(insightLines, margin, yPos);
      yPos += insightLines.length * 5 + 3;

      if (opp.breakdown || opp.reasoning) {
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.text);
        const detail = doc.splitTextToSize(opp.breakdown || opp.reasoning || '', contentWidth - 5);
        doc.text(detail, margin + 3, yPos);
        yPos += detail.length * 4 + 8;
      }
    });
  }

  addPageFooter();

  // ========================================================================
  // PAGE 6-7: CONTROVERSIAL RECOMMENDATIONS
  // ========================================================================
  doc.addPage(); currentPage++;
  addSectionBanner('Controversial Recommendations');

  // Contrarian Insights (the provocative sections)
  if (ai.optimizationAnalysis?.contrarianInsights?.length > 0) {
    ai.optimizationAnalysis.contrarianInsights.forEach((insight: any) => {
      checkPageBreak(50);

      // Title
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.primary);
      const titleLines = doc.splitTextToSize(insight.title || 'Contrarian Insight', contentWidth);
      doc.text(titleLines, margin, yPos);
      yPos += titleLines.length * 6 + 5;

      // Conventional wisdom (crossed out feel)
      doc.setFillColor(255, 240, 240);
      const convText = insight.conventional || '';
      const convLines = doc.splitTextToSize(`"${convText}"`, contentWidth - 10);
      const convBoxH = convLines.length * 5 + 10;
      doc.roundedRect(margin, yPos, contentWidth, convBoxH, 2, 2, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.red);
      doc.text('CONVENTIONAL WISDOM:', margin + 5, yPos + 6);
      doc.setTextColor(...COLORS.darkGray);
      doc.text(convLines, margin + 5, yPos + 12);
      yPos += convBoxH + 5;

      // Contrarian case (highlighted)
      doc.setFillColor(235, 255, 245);
      const contrText = insight.contrarian || '';
      const contrLines = doc.splitTextToSize(contrText, contentWidth - 10);
      const contrBoxH = contrLines.length * 5 + 10;
      doc.roundedRect(margin, yPos, contentWidth, contrBoxH, 2, 2, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.success);
      doc.text('WHAT YOUR DATA SHOWS:', margin + 5, yPos + 6);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.text);
      doc.text(contrLines, margin + 5, yPos + 12);
      yPos += contrBoxH + 5;

      // Math proof
      if (insight.mathProof) {
        doc.setFillColor(...COLORS.lightGray);
        const mathLines = doc.splitTextToSize(insight.mathProof, contentWidth - 10);
        const mathBoxH = mathLines.length * 4 + 8;
        doc.roundedRect(margin, yPos, contentWidth, mathBoxH, 2, 2, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.darkGray);
        doc.text(mathLines, margin + 5, yPos + 5);
        yPos += mathBoxH + 5;
      }

      // Study reference
      if (insight.study) {
        doc.setFontSize(8); doc.setFont('helvetica', 'italic' as any); doc.setTextColor(...COLORS.darkGray);
        const studyLines = doc.splitTextToSize(`Source: ${insight.study}`, contentWidth);
        doc.text(studyLines, margin, yPos);
        yPos += studyLines.length * 4 + 10;
      }
    });
  }

  addPageFooter();

  // ========================================================================
  // PAGE 8: QUICK WINS + STRATEGIC MOVES
  // ========================================================================
  doc.addPage(); currentPage++;
  addSectionBanner('What You Should Actually Do');

  if (ai.optimizationAnalysis?.quickWins?.length > 0) {
    addHeader('Quick Wins (This Month)', 2);
    ai.optimizationAnalysis.quickWins.forEach((win: any, i: number) => {
      checkPageBreak(40);
      doc.setFillColor(235, 250, 255);
      doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
      yPos += 7;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.accent);
      doc.text(`${i + 1}. ${win.action || ''}`, margin + 3, yPos); yPos += 7;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.success);
      doc.text(`Saves \u00A3${(win.annualSavings || 0).toLocaleString()}/year`, margin + 3, yPos);
      if (win.yearsToFISaved) {
        doc.setTextColor(...COLORS.accent);
        doc.text(`${win.yearsToFISaved} years closer to FI`, margin + 80, yPos);
      }
      yPos += 6;
      if (win.conventionalWisdom) {
        doc.setTextColor(...COLORS.red); doc.setFontSize(8);
        const cwLines = doc.splitTextToSize(`Standard advice: "${win.conventionalWisdom}"`, contentWidth - 6);
        doc.text(cwLines, margin + 3, yPos);
        yPos += cwLines.length * 4 + 2;
      }
      if (win.reasoning) {
        doc.setTextColor(...COLORS.text); doc.setFontSize(9);
        const rLines = doc.splitTextToSize(win.reasoning, contentWidth - 6);
        doc.text(rLines, margin + 3, yPos);
        yPos += rLines.length * 4 + 8;
      }
    });
  }

  if (ai.optimizationAnalysis?.strategicMoves?.length > 0) {
    checkPageBreak(30);
    addHeader('Strategic Moves (The Uncomfortable Ones)', 2);
    ai.optimizationAnalysis.strategicMoves.forEach((move: any, i: number) => {
      checkPageBreak(50);
      doc.setFillColor(255, 248, 235);
      doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
      yPos += 7;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.warning);
      doc.text(`${i + 1}. ${move.action || ''}`, margin + 3, yPos); yPos += 7;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.success);
      doc.text(`\u00A3${(move.annualImpact || 0).toLocaleString()}/year | ${(move.yearsToFISaved || 0).toFixed(1)} years saved`, margin + 3, yPos);
      yPos += 6;
      if (move.contrarianCase || move.reasoning) {
        doc.setTextColor(...COLORS.text);
        const cLines = doc.splitTextToSize(move.contrarianCase || move.reasoning || '', contentWidth - 6);
        doc.text(cLines, margin + 3, yPos);
        yPos += cLines.length * 4 + 3;
      }
      if (move.whyYouWont) {
        doc.setTextColor(...COLORS.darkGray); doc.setFontSize(8); doc.setFont('helvetica', 'italic' as any);
        const wyLines = doc.splitTextToSize(`Why you'll resist: ${move.whyYouWont}`, contentWidth - 6);
        doc.text(wyLines, margin + 3, yPos);
        yPos += wyLines.length * 4 + 8;
      }
    });
  }

  addPageFooter();

  // ========================================================================
  // PAGE 9: RISK ASSESSMENT
  // ========================================================================
  doc.addPage(); currentPage++;
  addSectionBanner('The Risks You\'re Ignoring');

  if (ai.riskAssessment?.emergencyFundStatus?.reality) {
    addCalloutBox(ai.riskAssessment.emergencyFundStatus.reality, ai.riskAssessment.emergencyFundStatus.priority === 'URGENT' ? 'warning' : 'accent');
  }

  if (ai.riskAssessment?.highPriorityRisks?.length > 0) {
    ai.riskAssessment.highPriorityRisks.forEach((risk: any) => {
      checkPageBreak(40);
      doc.setFillColor(255, 240, 240);
      doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
      yPos += 7;
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.red);
      const riskLines = doc.splitTextToSize(risk.risk || '', contentWidth - 6);
      doc.text(riskLines, margin + 3, yPos);
      yPos += riskLines.length * 5 + 3;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.text);
      doc.text(`Likelihood: ${risk.likelihood || '?'} | FI Impact: ${risk.impactOnFI || '?'}`, margin + 3, yPos);
      yPos += 6;
      if (risk.whyYoureIgnoringThis) {
        doc.setTextColor(...COLORS.darkGray); doc.setFontSize(8);
        const ignLines = doc.splitTextToSize(`Why you're ignoring this: ${risk.whyYoureIgnoringThis}`, contentWidth - 6);
        doc.text(ignLines, margin + 3, yPos);
        yPos += ignLines.length * 4 + 3;
      }
      if (risk.mitigation?.immediate) {
        doc.setTextColor(...COLORS.success); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('Do this week:', margin + 3, yPos); yPos += 5;
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.text);
        const mitLines = doc.splitTextToSize(risk.mitigation.immediate, contentWidth - 6);
        doc.text(mitLines, margin + 3, yPos);
        yPos += mitLines.length * 4 + 8;
      }
    });
  }

  addPageFooter();

  // ========================================================================
  // PAGE 10-11: THE ROADMAP
  // ========================================================================
  doc.addPage(); currentPage++;
  addSectionBanner('Your Controversial Action Plan');

  if (ai.roadmap?.personalizedMotivation) {
    addParagraph(ai.roadmap.personalizedMotivation);
  }

  // THE BIG COMPARISON
  if (ai.roadmap?.finalComparison) {
    const fc = ai.roadmap.finalComparison;
    checkPageBreak(60);
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(margin, yPos, contentWidth, 55, 5, 5, 'F');
    yPos += 10;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.white);
    doc.text('THE COST OF DOING NOTHING', pageWidth / 2, yPos, { align: 'center' }); yPos += 10;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Do nothing: FIRE at age ${fc.doNothing?.fireAge || '?'}`, margin + 10, yPos); yPos += 6;
    doc.setTextColor(...COLORS.accent);
    doc.text(`Quick wins only: FIRE at age ${fc.quickWinsOnly?.fireAge || '?'}`, margin + 10, yPos); yPos += 6;
    doc.text(`Top 3 changes: FIRE at age ${fc.topThreeChanges?.fireAge || '?'}`, margin + 10, yPos); yPos += 6;
    doc.setTextColor(...COLORS.success);
    doc.setFont('helvetica', 'bold');
    doc.text(`Full plan: FIRE at age ${fc.fullPlan?.fireAge || '?'}`, margin + 10, yPos); yPos += 10;
    if (fc.closingLine) {
      doc.setFontSize(9); doc.setFont('helvetica', 'italic' as any); doc.setTextColor(200, 220, 255);
      const closeLines = doc.splitTextToSize(fc.closingLine, contentWidth - 20);
      closeLines.forEach((line: string) => {
        doc.text(line, pageWidth / 2, yPos, { align: 'center' }); yPos += 5;
      });
    }
    yPos += 15;
  } else if (ai.roadmap?.fiTimeline) {
    checkPageBreak();
    addHeader('Timeline Comparison', 2);
    addKeyMetric('Current Path', `${ai.roadmap.fiTimeline.currentTrajectory || 'N/A'}`, 'warning');
    addKeyMetric('With Quick Wins', `${ai.roadmap.fiTimeline.withQuickWins || 'N/A'}`, 'accent');
    addKeyMetric('With Full Plan', `${ai.roadmap.fiTimeline.withFullRoadmap || 'N/A'}`, 'success');
    if (ai.roadmap.fiTimeline.whatYearsSavedMeans) {
      addCalloutBox(ai.roadmap.fiTimeline.whatYearsSavedMeans, 'success');
    }
    yPos += 5;
  }

  // Critical Path
  if (ai.roadmap?.criticalPath?.length > 0) {
    checkPageBreak(30);
    addHeader('The 5 Things That Actually Matter', 2);
    ai.roadmap.criticalPath.forEach((action: string, i: number) => {
      checkPageBreak(12);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.accent);
      doc.text(`${i + 1}.`, margin, yPos);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.text);
      const lines = doc.splitTextToSize(action, contentWidth - 10);
      doc.text(lines, margin + 8, yPos);
      yPos += lines.length * 5 + 5;
    });
    yPos += 5;
  }

  // Roadmap phases
  const phases: Array<[string, string]> = [
    ['month1to3', 'Months 1-3'], ['month4to6', 'Months 4-6'],
    ['month7to12', 'Months 7-12'], ['year2to5', 'Years 2-5'],
  ];
  phases.forEach(([key, label]) => {
    const phaseData = ai.roadmap?.roadmap?.[key];
    if (!phaseData) return;
    checkPageBreak(25);
    addHeader(`${label}: ${phaseData.focus || ''}`, 2);
    if (phaseData.actions?.length > 0) {
      phaseData.actions.forEach((action: any, i: number) => {
        checkPageBreak(20);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.text);
        doc.text(`${i + 1}. ${action.action || ''}`, margin, yPos); yPos += 5;
        doc.setFont('helvetica', 'normal');
        if (action.why) {
          doc.setTextColor(...COLORS.darkGray); doc.setFontSize(8);
          const whyLines = doc.splitTextToSize(action.why, contentWidth - 8);
          doc.text(whyLines, margin + 5, yPos); yPos += whyLines.length * 4 + 2;
        }
        doc.setTextColor(...COLORS.success); doc.setFontSize(9);
        doc.text(action.expectedSavings ? `\u00A3${action.expectedSavings.toLocaleString()}/yr` : '', margin + 5, yPos);
        yPos += 6;
      });
    }
  });

  addPageFooter();

  // ========================================================================
  // PAGE 12: WHAT THIS ALL MEANS (CLOSING)
  // ========================================================================
  doc.addPage(); currentPage++;
  addSectionBanner('What This All Means');

  addParagraph(ai.roadmap?.personalizedMotivation || 'The math doesn\'t care about conventional wisdom. It only cares about what you actually do.');

  // Top recommendation
  if (ai.optimizationAnalysis?.topRecommendation) {
    const top = ai.optimizationAnalysis.topRecommendation;
    checkPageBreak(50);
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(margin, yPos, contentWidth, 45, 5, 5, 'F');
    yPos += 10;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.primary);
    doc.text('YOUR #1 MOVE', pageWidth / 2, yPos, { align: 'center' }); yPos += 8;
    doc.setFontSize(12);
    const topLines = doc.splitTextToSize(top.action || '', contentWidth - 20);
    topLines.forEach((line: string) => { doc.text(line, pageWidth / 2, yPos, { align: 'center' }); yPos += 6; });
    yPos += 3;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    if (top.currentPath && top.newPath) {
      doc.text(`${top.currentPath} \u2192 ${top.newPath}`, pageWidth / 2, yPos, { align: 'center' });
    }
    yPos += 20;
  }

  // Closing line
  if (ai.roadmap?.finalComparison?.closingLine) {
    checkPageBreak(20);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.primary);
    const closingLines = doc.splitTextToSize(ai.roadmap.finalComparison.closingLine, contentWidth);
    closingLines.forEach((line: string) => { doc.text(line, pageWidth / 2, yPos, { align: 'center' }); yPos += 6; });
    yPos += 10;
  }

  addParagraph('"None of this is \'standard advice.\' All of it is backed by your specific numbers."');

  addPageFooter();

  // ========================================================================
  // APPENDIX + STUDIES REFERENCED
  // ========================================================================
  doc.addPage(); currentPage++;
  addSectionBanner('Sources & Methodology');

  addHeader('Studies Referenced', 2);
  const studies = [
    'Harvard Business Review: Workers with 50+ hour weeks spend 23% more on convenience',
    'Journal of Consumer Psychology: Financial stress increases impulse spending by 79%',
    'Money and Mental Health Policy Institute: Stress reduces financial capability by 20-30%',
    'UK ONS: Stressed workers take 6.9 sick days vs 2.3 for non-stressed',
    'Iceland 4-day week trials (2015-2019): Same or better productivity with fewer hours',
    'UK 4-day week pilot (2022): 92% of companies kept it, revenue increased 1.4%',
    'Numbeo: Cost of living comparison data',
  ];
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.text);
  studies.forEach((s) => { doc.text(`\u2022 ${s}`, margin + 3, yPos); yPos += 5; });

  yPos += 8;
  addHeader('Calculators Used', 2);
  const calcs = ['True Hourly Wage', 'Commute Comparison', 'Geographic Arbitrage', 'Pension Impact', 'Car Ownership', 'Student Loans', 'WFH vs Office', 'Work Intensity'];
  doc.setFontSize(8);
  calcs.forEach((c) => { doc.setTextColor(...COLORS.success); doc.text(`\u2713 ${c}`, margin + 3, yPos); yPos += 5; });

  yPos += 8;
  addHeader('Assumptions', 2);
  doc.setFontSize(8); doc.setTextColor(...COLORS.text);
  ['Investment returns: 7% real (after inflation)', 'Inflation: 2.5% annually', 'Safe withdrawal rate: 4%', `Tax rates: ${new Date().getFullYear()}/${new Date().getFullYear() + 1} UK rates`].forEach((a) => {
    doc.text(`\u2022 ${a}`, margin + 3, yPos); yPos += 5;
  });

  addPageFooter();

  // ========================================================================
  // FINAL: DISCLAIMERS
  // ========================================================================
  doc.addPage(); currentPage++;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setTextColor(...COLORS.white); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('Important Notices', pageWidth / 2, 40, { align: 'center' });
  yPos = 60;
  [{ title: 'General Disclaimer', text: DISCLAIMERS.main }, { title: 'Projection Disclaimer', text: DISCLAIMERS.projections }, { title: 'Tax Information', text: DISCLAIMERS.tax }].forEach((section) => {
    doc.setTextColor(...COLORS.accent); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(section.title, margin, yPos); yPos += 6;
    doc.setTextColor(180, 180, 180); doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(section.text, contentWidth);
    doc.text(lines, margin, yPos); yPos += lines.length * 4 + 15;
  });
  doc.setTextColor(...COLORS.accent); doc.setFontSize(10);
  doc.text('Questions? Visit truewage.uk', pageWidth / 2, pageHeight - 40, { align: 'center' });
  doc.setTextColor(...COLORS.darkGray); doc.setFontSize(8);
  doc.text('TrueWage UK | Not regulated by the FCA | Educational purposes only', pageWidth / 2, pageHeight - 20, { align: 'center' });

  return doc.output('blob');
}

// ============================================================================
// LEGACY PDF GENERATION (kept for backward compatibility)
// ============================================================================

/**
 * Generate a FIRE report PDF (legacy - uses old 5-prompt AI analysis)
 */
export async function generateReportPDF(data: ReportData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  const LEGACY_COLORS = {
    primary: [16, 185, 129] as [number, number, number],
    dark: [5, 5, 5] as [number, number, number],
    text: [64, 64, 64] as [number, number, number],
    lightGray: [245, 245, 245] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    amber: [251, 191, 36] as [number, number, number],
    red: [239, 68, 68] as [number, number, number],
  };

  const addPage = () => {
    doc.addPage();
    currentY = margin;
    addFooter();
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 30) {
      addPage();
    }
  };

  const addFooter = () => {
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(...LEGACY_COLORS.text);
    doc.text(
      `Generated by TrueWage.uk | ${new Date().toLocaleDateString('en-GB')} | Page ${doc.getNumberOfPages()}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
    doc.text(
      'This document is for educational purposes only - not financial advice',
      pageWidth / 2,
      footerY + 4,
      { align: 'center' }
    );
  };

  // ========== COVER PAGE ==========
  doc.setFillColor(...LEGACY_COLORS.dark);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFillColor(...LEGACY_COLORS.primary);
  doc.circle(pageWidth / 2, 50, 15, 'F');
  doc.setTextColor(...LEGACY_COLORS.dark);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('\u00A3', pageWidth / 2, 55, { align: 'center' });

  doc.setTextColor(...LEGACY_COLORS.white);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('Your FIRE Report', pageWidth / 2, 90, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...LEGACY_COLORS.primary);
  doc.text('True Hourly Wage & Financial Independence Analysis', pageWidth / 2, 100, { align: 'center' });

  const boxY = 130;
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(margin + 20, boxY, contentWidth - 40, 60, 5, 5, 'F');

  const trueHourlyRate = data.primary.data.results?.trueHourlyRate || 0;
  const realityPct = data.primary.data.results?.percentOfAssumed || 0;
  const hiddenCosts = data.primary.data.results?.hiddenCosts || 0;

  doc.setTextColor(...LEGACY_COLORS.white);
  doc.setFontSize(11);
  doc.text('YOUR TRUE HOURLY WAGE', pageWidth / 2, boxY + 15, { align: 'center' });

  doc.setTextColor(...LEGACY_COLORS.primary);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text(`\u00A3${trueHourlyRate.toFixed(2)}`, pageWidth / 2, boxY + 35, { align: 'center' });

  doc.setTextColor(...LEGACY_COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${realityPct.toFixed(0)}% of your assumed rate | \u00A3${hiddenCosts.toLocaleString()} in hidden costs`, pageWidth / 2, boxY + 50, { align: 'center' });

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date(data.generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })}`, pageWidth / 2, 210, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const disclaimerLines = doc.splitTextToSize(
    'This report is for educational purposes only and does not constitute financial advice. Consult a qualified professional before making financial decisions.',
    contentWidth - 20
  );
  doc.text(disclaimerLines, pageWidth / 2, pageHeight - 30, { align: 'center' });

  // ========== EXECUTIVE SUMMARY ==========
  addPage();

  doc.setFillColor(...LEGACY_COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(...LEGACY_COLORS.dark);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, 28);
  currentY = 55;

  if (data.aiAnalysis.executiveSummary?.financialGrade) {
    const grade = data.aiAnalysis.executiveSummary.financialGrade;
    const gradeColor = grade.startsWith('A') ? LEGACY_COLORS.primary :
                       grade.startsWith('B') ? [34, 197, 94] as [number, number, number] :
                       grade.startsWith('C') ? LEGACY_COLORS.amber :
                       grade.startsWith('D') ? [249, 115, 22] as [number, number, number] :
                       LEGACY_COLORS.red;

    doc.setFillColor(...gradeColor);
    doc.roundedRect(pageWidth - margin - 30, currentY - 15, 30, 25, 3, 3, 'F');
    doc.setTextColor(...LEGACY_COLORS.white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(grade.charAt(0), pageWidth - margin - 15, currentY + 2, { align: 'center' });
  }

  if (data.aiAnalysis.executiveSummary?.headline) {
    doc.setTextColor(...LEGACY_COLORS.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const headlineLines = doc.splitTextToSize(data.aiAnalysis.executiveSummary.headline, contentWidth - 40);
    doc.text(headlineLines, margin, currentY);
    currentY += headlineLines.length * 7 + 10;
  }

  if (data.aiAnalysis.executiveSummary?.keyFindings) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LEGACY_COLORS.dark);
    doc.text('Key Findings', margin, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...LEGACY_COLORS.text);

    data.aiAnalysis.executiveSummary.keyFindings.forEach((finding: string) => {
      checkPageBreak(15);
      doc.setFillColor(...LEGACY_COLORS.primary);
      doc.circle(margin + 3, currentY - 1, 1.5, 'F');
      const lines = doc.splitTextToSize(finding, contentWidth - 15);
      doc.text(lines, margin + 10, currentY);
      currentY += lines.length * 5 + 5;
    });
    currentY += 5;
  }

  // Pie charts
  const costBreakdown = data.aiAnalysis.executiveSummary?.costBreakdown;
  const timeBreakdown = data.aiAnalysis.executiveSummary?.timeBreakdown;

  if (costBreakdown || timeBreakdown) {
    checkPageBreak(80);
    currentY += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LEGACY_COLORS.dark);
    doc.text('Where Your Money & Time Goes', margin, currentY);
    currentY += 15;

    const chartY = currentY + 30;

    if (costBreakdown) {
      const costData = [
        { label: 'Commute', value: costBreakdown.commute || 0, color: [239, 68, 68] as [number, number, number] },
        { label: 'Taxes', value: costBreakdown.taxes || 0, color: [249, 115, 22] as [number, number, number] },
        { label: 'Pension', value: costBreakdown.pension || 0, color: [16, 185, 129] as [number, number, number] },
        { label: 'Work Expenses', value: costBreakdown.workExpenses || 0, color: [59, 130, 246] as [number, number, number] },
        { label: 'Student Loans', value: costBreakdown.studentLoans || 0, color: [168, 85, 247] as [number, number, number] },
        { label: 'Car Costs', value: costBreakdown.carCosts || 0, color: [236, 72, 153] as [number, number, number] },
        { label: 'Other', value: costBreakdown.other || 0, color: [156, 163, 175] as [number, number, number] },
      ].filter(d => d.value > 0);

      if (costData.length > 0) {
        drawPieChart(doc, margin + 45, chartY, 25, costData, 'Cost Breakdown');
      }
    }

    if (timeBreakdown) {
      const timeData = [
        { label: 'Work', value: timeBreakdown.contractedWork || 0, color: [59, 130, 246] as [number, number, number] },
        { label: 'Overtime', value: timeBreakdown.unpaidOvertime || 0, color: [239, 68, 68] as [number, number, number] },
        { label: 'Commute', value: timeBreakdown.commuting || 0, color: [249, 115, 22] as [number, number, number] },
        { label: 'Prep', value: timeBreakdown.workPrep || 0, color: [168, 85, 247] as [number, number, number] },
      ].filter(d => d.value > 0);

      if (timeData.length > 0) {
        drawPieChart(doc, pageWidth - margin - 45, chartY, 25, timeData, 'Time Breakdown (hrs/week)');
      }
    }

    currentY = chartY + 55;
  }

  // Immediate Opportunity
  if (data.aiAnalysis.executiveSummary?.immediateOpportunity) {
    checkPageBreak(30);
    doc.setFillColor(16, 185, 129, 20);
    doc.roundedRect(margin, currentY, contentWidth, 25, 3, 3, 'F');

    doc.setTextColor(...LEGACY_COLORS.primary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BIGGEST OPPORTUNITY', margin + 5, currentY + 8);

    doc.setTextColor(...LEGACY_COLORS.text);
    doc.setFont('helvetica', 'normal');
    const oppLines = doc.splitTextToSize(data.aiAnalysis.executiveSummary.immediateOpportunity, contentWidth - 15);
    doc.text(oppLines, margin + 5, currentY + 16);
    currentY += 35;
  }

  // Risk Flag
  if (data.aiAnalysis.executiveSummary?.riskFlag) {
    checkPageBreak(25);
    doc.setFillColor(251, 191, 36, 30);
    doc.roundedRect(margin, currentY, contentWidth, 20, 3, 3, 'F');

    doc.setTextColor(...LEGACY_COLORS.amber);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTENTION', margin + 5, currentY + 8);

    doc.setTextColor(...LEGACY_COLORS.text);
    doc.setFont('helvetica', 'normal');
    const riskLines = doc.splitTextToSize(data.aiAnalysis.executiveSummary.riskFlag, contentWidth - 15);
    doc.text(riskLines, margin + 5, currentY + 15);
    currentY += 30;
  }

  // ========== YOUR NUMBERS PAGE ==========
  addPage();

  doc.setFillColor(...LEGACY_COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(...LEGACY_COLORS.dark);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Numbers', margin, 28);
  currentY = 55;

  const primaryData = data.primary.data;
  const inputs = primaryData.inputs || {};
  const results = primaryData.results || {};

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...LEGACY_COLORS.dark);
  doc.text('Your Inputs', margin, currentY);
  currentY += 8;

  const inputRows = [
    ['Annual Salary', `\u00A3${(inputs.salary || 0).toLocaleString()}`],
    ['Weekly Hours', `${inputs.weeklyHours || 0}`],
    ['Annual Leave', `${inputs.holidayDays || 0} days`],
    ['Commute Time', `${inputs.commuteMinutes || 0} mins/day`],
    ['Monthly Commute Cost', `\u00A3${inputs.commuteCost || 0}`],
    ['Work Expenses', `\u00A3${inputs.workExpenses || 0}/month`],
    ['Pension Contribution', `${inputs.pensionContribution || 0}%`],
    ['Region', inputs.region || 'England'],
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  inputRows.forEach(([label, value]) => {
    checkPageBreak(8);
    doc.setTextColor(...LEGACY_COLORS.text);
    doc.text(label, margin, currentY);
    doc.setTextColor(...LEGACY_COLORS.dark);
    doc.text(value, pageWidth - margin, currentY, { align: 'right' });
    currentY += 6;
  });

  currentY += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...LEGACY_COLORS.dark);
  doc.text('Calculated Results', margin, currentY);
  currentY += 8;

  const resultRows: [string, string, [number, number, number]][] = [
    ['True Hourly Wage', `\u00A3${(results.trueHourlyRate || 0).toFixed(2)}`, LEGACY_COLORS.primary],
    ['Assumed Hourly Rate', `\u00A3${(results.assumedHourlyRate || 0).toFixed(2)}`, LEGACY_COLORS.text],
    ['Reality Percentage', `${(results.percentOfAssumed || 0).toFixed(0)}%`, LEGACY_COLORS.text],
    ['Total Hidden Costs', `-\u00A3${(results.hiddenCosts || 0).toLocaleString()}/year`, LEGACY_COLORS.amber],
    ['True Working Hours', `${(results.totalWeeklyHours || 0).toFixed(1)} hrs/week`, LEGACY_COLORS.text],
    ['Annual Take-Home', `\u00A3${(results.annualNetIncome || 0).toLocaleString()}`, LEGACY_COLORS.primary],
  ];

  doc.setFontSize(10);
  resultRows.forEach(([label, value, color]) => {
    checkPageBreak(8);
    doc.setTextColor(...LEGACY_COLORS.text);
    doc.text(label, margin, currentY);
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - margin, currentY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    currentY += 7;
  });

  // ========== REMAINING LEGACY PAGES ==========
  // Tax Analysis, Scenario Comparison, FIRE Projection, Action Plan, Disclaimers
  // (Condensed versions for brevity, same logic as before)

  if (data.aiAnalysis.taxAnalysis) {
    addPage();
    doc.setFillColor(...LEGACY_COLORS.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(...LEGACY_COLORS.dark);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Tax Analysis', margin, 28);
    currentY = 55;

    doc.setFillColor(251, 191, 36, 20);
    doc.roundedRect(margin, currentY, contentWidth, 15, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...LEGACY_COLORS.text);
    const taxDisclaimer = doc.splitTextToSize(DISCLAIMERS.tax, contentWidth - 10);
    doc.text(taxDisclaimer, margin + 5, currentY + 5);
    currentY += 25;

    const taxData = data.aiAnalysis.taxAnalysis;

    if (taxData.totalTaxBurden) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...LEGACY_COLORS.dark);
      doc.text('Total Tax Burden', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...LEGACY_COLORS.text);
      doc.text(String(taxData.totalTaxBurden), margin, currentY + 7);
      currentY += 20;
    }

    if (taxData.breakdown) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...LEGACY_COLORS.dark);
      doc.text('Breakdown', margin, currentY);
      currentY += 8;

      Object.entries(taxData.breakdown).forEach(([key, value]: [string, any]) => {
        if (value && value.amount !== undefined) {
          checkPageBreak(10);
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...LEGACY_COLORS.text);
          doc.text(label, margin, currentY);
          doc.text(`\u00A3${value.amount.toLocaleString()}`, pageWidth - margin, currentY, { align: 'right' });
          if (value.notes) {
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(value.notes, margin, currentY + 4);
            currentY += 8;
          }
          currentY += 6;
        }
      });
    }
  }

  // FIRE Projection
  if (data.aiAnalysis.fireProjection) {
    addPage();
    doc.setFillColor(...LEGACY_COLORS.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(...LEGACY_COLORS.dark);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FIRE Projection', margin, 28);
    currentY = 55;

    const fire = data.aiAnalysis.fireProjection;

    const boxWidth = (contentWidth - 10) / 2;

    doc.setFillColor(...LEGACY_COLORS.lightGray);
    doc.roundedRect(margin, currentY, boxWidth, 35, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...LEGACY_COLORS.text);
    doc.text('YOUR FIRE NUMBER', margin + 5, currentY + 10);
    doc.setTextColor(...LEGACY_COLORS.primary);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`\u00A3${(fire.fireNumber || 0).toLocaleString()}`, margin + 5, currentY + 26);

    doc.setFillColor(...LEGACY_COLORS.lightGray);
    doc.roundedRect(margin + boxWidth + 10, currentY, boxWidth, 35, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...LEGACY_COLORS.text);
    doc.text('TARGET FIRE DATE', margin + boxWidth + 15, currentY + 10);
    doc.setTextColor(...LEGACY_COLORS.primary);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const fireDate = fire.fireDate || `${fire.yearsToFire || '?'} years`;
    doc.text(fireDate, margin + boxWidth + 15, currentY + 26);

    currentY += 45;

    if (fire.accelerators?.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...LEGACY_COLORS.dark);
      doc.text('FIRE Accelerators', margin, currentY);
      currentY += 10;

      fire.accelerators.forEach((acc: any) => {
        checkPageBreak(20);
        doc.setFillColor(16, 185, 129, 15);
        doc.roundedRect(margin, currentY, contentWidth, 18, 3, 3, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...LEGACY_COLORS.dark);
        doc.text(acc.change || '', margin + 5, currentY + 8);

        doc.setTextColor(...LEGACY_COLORS.primary);
        doc.setFontSize(10);
        doc.text(`-${acc.yearsShaved} years`, pageWidth - margin - 5, currentY + 8, { align: 'right' });

        currentY += 22;
      });
    }
  }

  // Action Plan
  if (data.aiAnalysis.actionPlan) {
    addPage();
    doc.setFillColor(...LEGACY_COLORS.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(...LEGACY_COLORS.dark);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Action Plan', margin, 28);
    currentY = 55;

    const actions = data.aiAnalysis.actionPlan;

    if (actions.totalPotentialGain) {
      doc.setFillColor(...LEGACY_COLORS.primary);
      doc.roundedRect(margin, currentY, contentWidth, 25, 3, 3, 'F');
      doc.setTextColor(...LEGACY_COLORS.white);
      doc.setFontSize(10);
      doc.text('TOTAL POTENTIAL ANNUAL GAIN', margin + 10, currentY + 9);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`\u00A3${actions.totalPotentialGain.toLocaleString()}`, margin + 10, currentY + 20);
      currentY += 35;
    }

    if (actions.quickWins?.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...LEGACY_COLORS.dark);
      doc.text('Quick Wins (This Week)', margin, currentY);
      currentY += 10;

      actions.quickWins.forEach((action: any) => {
        checkPageBreak(25);
        doc.setFillColor(16, 185, 129, 10);
        doc.roundedRect(margin, currentY, contentWidth, 22, 3, 3, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...LEGACY_COLORS.dark);
        doc.text(action.action || '', margin + 5, currentY + 7);

        doc.setTextColor(...LEGACY_COLORS.primary);
        doc.setFontSize(12);
        doc.text(`+\u00A3${(action.annualImpact || 0).toLocaleString()}`, pageWidth - margin - 5, currentY + 9, { align: 'right' });
        doc.setFontSize(7);
        doc.text('/year', pageWidth - margin - 5, currentY + 15, { align: 'right' });

        currentY += 26;
      });
    }
  }

  // Final disclaimer page
  addPage();
  doc.setFillColor(...LEGACY_COLORS.dark);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(...LEGACY_COLORS.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Notices', pageWidth / 2, 40, { align: 'center' });

  currentY = 60;

  const disclaimerSectionsLegacy = [
    { title: 'General Disclaimer', text: DISCLAIMERS.main },
    { title: 'Projection Disclaimer', text: DISCLAIMERS.projections },
    { title: 'Tax Information', text: DISCLAIMERS.tax },
  ];

  disclaimerSectionsLegacy.forEach((section) => {
    doc.setTextColor(...LEGACY_COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(section.title, margin, currentY);
    currentY += 6;

    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(section.text, contentWidth);
    doc.text(lines, margin, currentY);
    currentY += lines.length * 4 + 15;
  });

  doc.setTextColor(...LEGACY_COLORS.primary);
  doc.setFontSize(10);
  doc.text('Questions? Visit truewage.uk', pageWidth / 2, pageHeight - 40, { align: 'center' });

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('TrueWage UK | Not regulated by the FCA | Educational purposes only', pageWidth / 2, pageHeight - 20, { align: 'center' });

  return doc.output('blob');
}

// ============================================================================
// JSON EXPORT (kept for backward compatibility)
// ============================================================================

export function exportScenariosJSON(data: ReportData): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    primary: {
      name: data.primary.name,
      calculatorType: data.primary.calculator_type,
      inputs: data.primary.data.inputs,
      results: data.primary.data.results,
    },
    comparisons: data.comparisons.map((s) => ({
      name: s.name,
      calculatorType: s.calculator_type,
      description: s.description,
      inputs: s.data.inputs,
      results: s.data.results,
    })),
    disclaimer: DISCLAIMERS.main,
  };

  return JSON.stringify(exportData, null, 2);
}
