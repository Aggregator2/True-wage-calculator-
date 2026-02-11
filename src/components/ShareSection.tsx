'use client';

import { useState, useEffect } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { encodeInputsToUrl, formatCurrency, calculateWhatIfScenario } from '@/lib/calculator';
import type { WhatIfScenario } from '@/types/calculator';

export default function ShareSection() {
  const { results, inputs, pdfDownloadsUsed, incrementPdfDownloads, setShowPremiumModal, user } = useCalculatorStore();
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [whatIfScenarios, setWhatIfScenarios] = useState<WhatIfScenario[]>([]);

  const FREE_PDF_LIMIT = 1;
  const canDownloadFreePdf = user || pdfDownloadsUsed < FREE_PDF_LIMIT;

  useEffect(() => {
    if (results && typeof window !== 'undefined') {
      const encoded = encodeInputsToUrl(inputs);
      setShareUrl(`${window.location.origin}?s=${encoded}`);

      // Calculate What-If scenarios
      const scenarios = (['wfh2', 'wfh3', 'raise10', 'raise20'] as const).map((scenario) =>
        calculateWhatIfScenario(scenario, inputs, results)
      );
      setWhatIfScenarios(scenarios);
    }
  }, [results, inputs]);

  if (!results) return null;

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareToTwitter = () => {
    const text = `Just discovered my true hourly wage is ${formatCurrency(results.trueHourlyRate)} (only ${results.percentOfAssumed.toFixed(0)}% of what I thought!) - calculate yours:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const downloadSocialCard = async () => {
    // Create a canvas for the social card
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#050505');
    gradient.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Green accent glow
    ctx.beginPath();
    const glow = ctx.createRadialGradient(300, 100, 0, 300, 100, 400);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glow;
    ctx.arc(300, 100, 400, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('My True Hourly Wage', 80, 120);

    // Main rate
    ctx.font = 'bold 120px Inter, sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText(formatCurrency(results.trueHourlyRate), 80, 280);

    // Subtitle
    ctx.font = '32px Inter, sans-serif';
    ctx.fillStyle = '#737373';
    ctx.fillText(`Only ${results.percentOfAssumed.toFixed(0)}% of assumed rate (${formatCurrency(results.assumedHourlyRate)})`, 80, 340);

    // Stats
    ctx.font = '24px Inter, sans-serif';
    ctx.fillStyle = '#a3a3a3';
    ctx.fillText(`Effective Tax Rate: ${results.taxBreakdown.effectiveTaxRate.toFixed(1)}%`, 80, 420);
    ctx.fillText(`Weekly True Hours: ${results.timeBreakdown.weeklyTotalHours.toFixed(1)}h`, 80, 460);

    // Footer
    ctx.font = '20px Inter, sans-serif';
    ctx.fillStyle = '#525252';
    ctx.fillText('Calculate yours at TrueWage.uk', 80, 580);

    // Download
    const link = document.createElement('a');
    link.download = 'truewage-result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const generatePdfReport = async () => {
    if (!canDownloadFreePdf) {
      setShowPremiumModal(true);
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Header
      doc.setFillColor(5, 5, 5);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(24);
      doc.text('TrueWage Report', 20, 28);

      // Main result
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('Your True Hourly Wage', 20, 55);
      doc.setFontSize(32);
      doc.setTextColor(16, 185, 129);
      doc.text(formatCurrency(results.trueHourlyRate), 20, 75);

      // Comparison
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(12);
      doc.text(`Assumed Rate: ${formatCurrency(results.assumedHourlyRate)} | Reality: ${results.percentOfAssumed.toFixed(0)}%`, 20, 90);

      // Tax breakdown
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('Tax Breakdown', 20, 110);
      doc.setFontSize(10);
      const taxY = 120;
      doc.text(`Gross Salary: ${formatCurrency(results.taxBreakdown.grossSalary)}`, 20, taxY);
      doc.text(`Income Tax: -${formatCurrency(results.taxBreakdown.incomeTax)}`, 20, taxY + 8);
      doc.text(`National Insurance: -${formatCurrency(results.taxBreakdown.nationalInsurance)}`, 20, taxY + 16);
      doc.text(`Pension: -${formatCurrency(results.taxBreakdown.pensionContribution)}`, 20, taxY + 24);
      if (results.taxBreakdown.studentLoan > 0) {
        doc.text(`Student Loan: -${formatCurrency(results.taxBreakdown.studentLoan)}`, 20, taxY + 32);
      }
      doc.setFontSize(12);
      doc.text(`Net Salary: ${formatCurrency(results.taxBreakdown.netSalary)}`, 20, taxY + 45);

      // Time breakdown
      doc.setFontSize(14);
      doc.text('Time Breakdown', 20, 180);
      doc.setFontSize(10);
      doc.text(`Contract Hours: ${results.timeBreakdown.weeklyContractHours}h/week`, 20, 190);
      doc.text(`+ Commute: ${results.timeBreakdown.weeklyCommuteHours.toFixed(1)}h/week`, 20, 198);
      doc.text(`+ Breaks: ${results.timeBreakdown.weeklyBreakHours.toFixed(1)}h/week`, 20, 206);
      doc.text(`+ Prep: ${results.timeBreakdown.weeklyPrepHours.toFixed(1)}h/week`, 20, 214);
      doc.setFontSize(12);
      doc.text(`True Weekly Hours: ${results.timeBreakdown.weeklyTotalHours.toFixed(1)}h`, 20, 227);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generated by TrueWage - UK True Hourly Wage Calculator', 20, 280);
      doc.text(new Date().toLocaleDateString('en-GB'), 20, 286);

      // Save
      doc.save('truewage-report.pdf');

      // Track download if not logged in
      if (!user) {
        incrementPdfDownloads();
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  return (
    <section className="py-16 px-6 bg-[#050505]" id="shareSection">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Share URL */}
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            Share Your Results
          </h3>
          <p className="text-sm text-neutral-500 mb-4">Copy this link to share your exact scenario (no personal data stored on servers)</p>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="input-field flex-1 px-4 py-3 text-sm text-neutral-400"
            />
            <button
              onClick={copyShareUrl}
              className="btn-secondary px-6 py-3 font-medium"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Social Share Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={shareToTwitter}
              className="btn-secondary px-4 py-2.5 inline-flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X
            </button>
            <button
              onClick={shareToLinkedIn}
              className="btn-secondary px-4 py-2.5 inline-flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Share on LinkedIn
            </button>
            <button
              onClick={downloadSocialCard}
              className="btn-secondary px-4 py-2.5 inline-flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Download Image Card
            </button>
          </div>
        </div>

        {/* PDF Download */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Download PDF Report
              </h3>
              <p className="text-sm text-neutral-500 mb-4">Get a detailed breakdown with insights and action items</p>
            </div>
            <button
              onClick={generatePdfReport}
              className="btn-primary px-5 py-3 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>Download PDF</span>
              {canDownloadFreePdf && !user && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">(Free)</span>
              )}
            </button>
          </div>
        </div>

        {/* What-If Scenarios */}
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            What If...?
          </h3>
          <p className="text-sm text-neutral-500 mb-4">See how changes would affect your true hourly wage</p>
          <div className="grid md:grid-cols-2 gap-3">
            {whatIfScenarios.map((scenario, index) => (
              <div key={index} className="p-4 bg-[#1a1a1a]/50 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-neutral-400">{scenario.label}</span>
                  <span className={`text-sm font-semibold ${scenario.difference >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
                    {scenario.difference >= 0 ? '+' : ''}{formatCurrency(scenario.difference)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-white">{formatCurrency(scenario.trueHourlyRate)}</span>
                  <span className={`text-xs ${scenario.percentChange >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
                    {scenario.percentChange >= 0 ? '+' : ''}{scenario.percentChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
