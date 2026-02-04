/**
 * UK True Hourly Wage Calculator
 * Tax rates: 2025/26
 *
 * Features:
 * - Full UK tax calculations (Income Tax, NI, Student Loans)
 * - Time cost analysis (commute, breaks, prep)
 * - Social media sharing cards (1200x630px)
 * - PDF report generation (1 free, then premium)
 * - S&P 500 opportunity cost calculator
 * - FIRE progress visualization
 * - What-If scenario comparisons
 */

// ============================================
// PDF DOWNLOAD TRACKING
// ============================================

const PDF_STORAGE_KEY = 'truewage_pdf_downloads';
const FREE_PDF_LIMIT = 1;

function getPdfDownloadCount() {
    return parseInt(localStorage.getItem(PDF_STORAGE_KEY) || '0', 10);
}

function incrementPdfDownload() {
    const count = getPdfDownloadCount() + 1;
    localStorage.setItem(PDF_STORAGE_KEY, count.toString());
    return count;
}

function canDownloadFreePdf() {
    return getPdfDownloadCount() < FREE_PDF_LIMIT;
}

// ============================================
// EMAIL SIGNUP STORAGE
// ============================================

const EMAIL_STORAGE_KEY = 'truewage_email_signups';

function storeEmailSignup(email) {
    const signups = JSON.parse(localStorage.getItem(EMAIL_STORAGE_KEY) || '[]');
    signups.push({ email, timestamp: new Date().toISOString() });
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(signups));
}

// ============================================
// UK TAX RATES 2025/26
// ============================================

const TAX_CONFIG = {
    personalAllowance: 12570,
    personalAllowanceTaperThreshold: 100000,

    england: {
        bands: [
            { threshold: 12570, rate: 0 },
            { threshold: 50270, rate: 0.20 },
            { threshold: 125140, rate: 0.40 },
            { threshold: Infinity, rate: 0.45 }
        ]
    },

    scotland: {
        bands: [
            { threshold: 12570, rate: 0 },
            { threshold: 14921, rate: 0.19 },   // Starter rate
            { threshold: 26861, rate: 0.20 },   // Basic rate
            { threshold: 44605, rate: 0.21 },   // Intermediate rate
            { threshold: 78149, rate: 0.42 },   // Higher rate
            { threshold: 125140, rate: 0.45 },  // Advanced rate
            { threshold: Infinity, rate: 0.48 } // Top rate
        ]
    },

    nationalInsurance: {
        primaryThreshold: 12570,
        upperEarningsLimit: 50270,
        mainRate: 0.08,
        upperRate: 0.02
    },

    studentLoans: {
        plan1: { threshold: 25375, rate: 0.09 },
        plan2: { threshold: 27660, rate: 0.09 },
        plan4: { threshold: 31395, rate: 0.09 },
        plan5: { threshold: 25000, rate: 0.09 },
        postgrad: { threshold: 21000, rate: 0.06 }
    }
};

// Chart colors
const COLORS = {
    accent: '#10b981',
    accentLight: 'rgba(16, 185, 129, 0.2)',
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    neutral: {
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626'
    }
};

// ============================================
// UK PRODUCT DATABASE
// ============================================

const UK_PRODUCTS = [
    // Food & Drink
    { name: 'Pret Coffee', price: 3.50, emoji: '☕', category: 'food' },
    { name: 'Meal Deal', price: 3.99, emoji: '🥪', category: 'food' },
    { name: 'Greggs Sausage Roll', price: 1.35, emoji: '🥐', category: 'food' },
    { name: 'Nando\'s for Two', price: 45, emoji: '🍗', category: 'food' },
    { name: 'Domino\'s Pizza', price: 18.99, emoji: '🍕', category: 'food' },
    { name: 'Weekly Food Shop', price: 85, emoji: '🛒', category: 'food' },
    { name: 'Deliveroo Order', price: 25, emoji: '🛵', category: 'food' },
    { name: 'Pint at the Pub', price: 6.50, emoji: '🍺', category: 'food' },
    { name: 'Costa Latte', price: 4.15, emoji: '☕', category: 'food' },
    { name: 'Freddo', price: 0.35, emoji: '🐸', category: 'food' },
    { name: 'Bottle of Wine (Tesco)', price: 7, emoji: '🍷', category: 'food' },
    { name: 'Sunday Roast', price: 18, emoji: '🍖', category: 'food' },

    // Tech
    { name: 'iPhone 15 Pro', price: 1199, emoji: '📱', category: 'tech' },
    { name: 'MacBook Air M3', price: 1099, emoji: '💻', category: 'tech' },
    { name: 'AirPods Pro', price: 229, emoji: '🎧', category: 'tech' },
    { name: 'PS5', price: 479, emoji: '🎮', category: 'tech' },
    { name: 'Nintendo Switch OLED', price: 309, emoji: '🕹️', category: 'tech' },
    { name: 'iPad 10th Gen', price: 499, emoji: '📱', category: 'tech' },
    { name: 'Apple Watch SE', price: 219, emoji: '⌚', category: 'tech' },
    { name: 'Samsung Galaxy S24', price: 799, emoji: '📱', category: 'tech' },
    { name: 'Kindle Paperwhite', price: 149, emoji: '📚', category: 'tech' },
    { name: 'JBL Bluetooth Speaker', price: 89, emoji: '🔊', category: 'tech' },

    // Subscriptions (Monthly)
    { name: 'Netflix (Standard)', price: 10.99, emoji: '📺', category: 'subscriptions', period: 'month' },
    { name: 'Spotify Premium', price: 11.99, emoji: '🎵', category: 'subscriptions', period: 'month' },
    { name: 'Disney+', price: 7.99, emoji: '🏰', category: 'subscriptions', period: 'month' },
    { name: 'Amazon Prime', price: 8.99, emoji: '📦', category: 'subscriptions', period: 'month' },
    { name: 'YouTube Premium', price: 12.99, emoji: '▶️', category: 'subscriptions', period: 'month' },
    { name: 'Apple Music', price: 10.99, emoji: '🍎', category: 'subscriptions', period: 'month' },
    { name: 'Sky Sports', price: 34, emoji: '⚽', category: 'subscriptions', period: 'month' },
    { name: 'PureGym', price: 24.99, emoji: '💪', category: 'subscriptions', period: 'month' },
    { name: 'David Lloyd', price: 120, emoji: '🏊', category: 'subscriptions', period: 'month' },
    { name: 'NOW TV Entertainment', price: 9.99, emoji: '📺', category: 'subscriptions', period: 'month' },
    { name: 'Xbox Game Pass', price: 12.99, emoji: '🎮', category: 'subscriptions', period: 'month' },
    { name: 'PlayStation Plus', price: 10.99, emoji: '🎮', category: 'subscriptions', period: 'month' },
    { name: 'iCloud 200GB', price: 2.99, emoji: '☁️', category: 'subscriptions', period: 'month' },
    { name: 'Audible', price: 7.99, emoji: '🎧', category: 'subscriptions', period: 'month' },

    // Subscriptions (Annual)
    { name: 'Amazon Prime (Year)', price: 95, emoji: '📦', category: 'subscriptions', period: 'year' },
    { name: 'Costco Membership', price: 33.60, emoji: '🏪', category: 'subscriptions', period: 'year' },
    { name: 'AA Breakdown Cover', price: 149, emoji: '🚗', category: 'subscriptions', period: 'year' },
    { name: 'RAC Breakdown', price: 99, emoji: '🚙', category: 'subscriptions', period: 'year' },

    // Transport
    { name: 'London Zone 1-2 Travelcard (Month)', price: 164.20, emoji: '🚇', category: 'transport' },
    { name: 'London Zone 1-6 Travelcard (Month)', price: 282.60, emoji: '🚇', category: 'transport' },
    { name: 'Single Bus Fare (London)', price: 1.75, emoji: '🚌', category: 'transport' },
    { name: 'Tank of Petrol', price: 85, emoji: '⛽', category: 'transport' },
    { name: 'MOT Test', price: 54.85, emoji: '🔧', category: 'transport' },
    { name: 'Car Service (Basic)', price: 150, emoji: '🚗', category: 'transport' },
    { name: 'New Tyres (x4)', price: 400, emoji: '🛞', category: 'transport' },
    { name: 'Car Insurance (Year, Avg)', price: 924, emoji: '📋', category: 'transport' },
    { name: 'Road Tax (Avg)', price: 180, emoji: '📜', category: 'transport' },
    { name: 'Train to Manchester (Peak)', price: 95, emoji: '🚆', category: 'transport' },
    { name: 'Uber (5 mile)', price: 15, emoji: '🚕', category: 'transport' },
    { name: 'Santander Bike (Day)', price: 3, emoji: '🚲', category: 'transport' },

    // Home
    { name: 'Average Monthly Rent (UK)', price: 1279, emoji: '🏠', category: 'home' },
    { name: 'London Monthly Rent (1 bed)', price: 1850, emoji: '🏙️', category: 'home' },
    { name: 'Council Tax Band D (Month)', price: 175, emoji: '🏛️', category: 'home' },
    { name: 'Energy Bill (Month, Avg)', price: 135, emoji: '⚡', category: 'home' },
    { name: 'Broadband (Avg)', price: 35, emoji: '📡', category: 'home' },
    { name: 'TV Licence', price: 169.50, emoji: '📺', category: 'home', period: 'year' },
    { name: 'Contents Insurance (Year)', price: 120, emoji: '🛋️', category: 'home' },
    { name: 'Dyson V15', price: 699, emoji: '🧹', category: 'home' },
    { name: 'IKEA Billy Bookcase', price: 55, emoji: '📚', category: 'home' },
    { name: 'Washing Machine', price: 350, emoji: '🧺', category: 'home' },
    { name: 'New Sofa', price: 800, emoji: '🛋️', category: 'home' },
    { name: 'King Size Bed', price: 600, emoji: '🛏️', category: 'home' },

    // Lifestyle
    { name: 'Haircut (Barber)', price: 18, emoji: '💇', category: 'lifestyle' },
    { name: 'Haircut (Salon)', price: 55, emoji: '💇‍♀️', category: 'lifestyle' },
    { name: 'Cinema Ticket', price: 14, emoji: '🎬', category: 'lifestyle' },
    { name: 'Concert Ticket (Avg)', price: 75, emoji: '🎤', category: 'lifestyle' },
    { name: 'Premier League Ticket', price: 55, emoji: '⚽', category: 'lifestyle' },
    { name: 'Gym Trainers (Nike)', price: 120, emoji: '👟', category: 'lifestyle' },
    { name: 'Zara Jeans', price: 35.99, emoji: '👖', category: 'lifestyle' },
    { name: 'North Face Jacket', price: 200, emoji: '🧥', category: 'lifestyle' },
    { name: 'Weekend in Paris (Budget)', price: 350, emoji: '✈️', category: 'lifestyle' },
    { name: 'UK Holiday (Week)', price: 800, emoji: '🏖️', category: 'lifestyle' },
    { name: 'Christmas Gifts (Avg)', price: 250, emoji: '🎄', category: 'lifestyle' },
    { name: 'Wedding Guest Outfit', price: 180, emoji: '👗', category: 'lifestyle' },
    { name: 'Night Out (London)', price: 100, emoji: '🍸', category: 'lifestyle' },
    { name: 'Tattoo (Small)', price: 80, emoji: '💉', category: 'lifestyle' },
    { name: 'Books (Month)', price: 25, emoji: '📖', category: 'lifestyle' },
];

// ============================================
// TAX CALCULATION FUNCTIONS
// ============================================

function calculatePersonalAllowance(grossSalary) {
    if (grossSalary <= TAX_CONFIG.personalAllowanceTaperThreshold) {
        return TAX_CONFIG.personalAllowance;
    }
    const reduction = Math.floor((grossSalary - TAX_CONFIG.personalAllowanceTaperThreshold) / 2);
    return Math.max(0, TAX_CONFIG.personalAllowance - reduction);
}

function calculateIncomeTax(taxableIncome, region) {
    const bands = TAX_CONFIG[region].bands;
    let tax = 0;
    let remainingIncome = taxableIncome;
    let previousThreshold = 0;

    for (const band of bands) {
        if (remainingIncome <= 0) break;
        const bandWidth = band.threshold - previousThreshold;
        const taxableInBand = Math.min(remainingIncome, bandWidth);
        tax += taxableInBand * band.rate;
        remainingIncome -= taxableInBand;
        previousThreshold = band.threshold;
    }
    return tax;
}

function calculateNI(grossSalary) {
    const ni = TAX_CONFIG.nationalInsurance;
    if (grossSalary <= ni.primaryThreshold) return 0;

    let niContribution = 0;
    const mainRateEarnings = Math.min(grossSalary, ni.upperEarningsLimit) - ni.primaryThreshold;
    niContribution += Math.max(0, mainRateEarnings) * ni.mainRate;

    if (grossSalary > ni.upperEarningsLimit) {
        niContribution += (grossSalary - ni.upperEarningsLimit) * ni.upperRate;
    }
    return niContribution;
}

function calculateStudentLoan(grossSalary, planType) {
    if (planType === 'none') return 0;
    const plan = TAX_CONFIG.studentLoans[planType];
    if (!plan || grossSalary <= plan.threshold) return 0;
    return (grossSalary - plan.threshold) * plan.rate;
}

function calculateAllDeductions(grossSalary, region, studentLoanPlan, pensionPercent) {
    const pensionContribution = grossSalary * (pensionPercent / 100);
    const taxableGross = grossSalary - pensionContribution;
    const personalAllowance = calculatePersonalAllowance(taxableGross);

    const incomeTax = calculateIncomeTax(taxableGross, region);
    const nationalInsurance = calculateNI(grossSalary);
    const studentLoan = calculateStudentLoan(grossSalary, studentLoanPlan);

    const totalDeductions = incomeTax + nationalInsurance + studentLoan + pensionContribution;
    const netSalary = grossSalary - totalDeductions;

    const marginalIncomeTax = region === 'scotland'
        ? getMarginalRateScotland(taxableGross)
        : getMarginalRateEngland(taxableGross);
    const marginalNI = grossSalary > TAX_CONFIG.nationalInsurance.upperEarningsLimit ? 0.02 : 0.08;
    const marginalStudentLoan = studentLoanPlan !== 'none' && grossSalary > TAX_CONFIG.studentLoans[studentLoanPlan]?.threshold
        ? TAX_CONFIG.studentLoans[studentLoanPlan].rate : 0;

    return {
        grossSalary,
        pensionContribution,
        personalAllowance,
        incomeTax,
        nationalInsurance,
        studentLoan,
        totalDeductions,
        netSalary,
        effectiveTaxRate: (totalDeductions / grossSalary) * 100,
        effectiveMarginalRate: (marginalIncomeTax + marginalNI + marginalStudentLoan) * 100
    };
}

function getMarginalRateEngland(income) {
    if (income > 100000 && income <= 125140) return 0.60;
    if (income > 125140) return 0.45;
    if (income > 50270) return 0.40;
    if (income > 12570) return 0.20;
    return 0;
}

function getMarginalRateScotland(income) {
    if (income > 100000 && income <= 125140) return 0.675;
    if (income > 125140) return 0.48;
    if (income > 75000) return 0.45;
    if (income > 43662) return 0.42;
    if (income > 26561) return 0.21;
    if (income > 14876) return 0.20;
    if (income > 12570) return 0.19;
    return 0;
}

// ============================================
// TIME CALCULATION
// ============================================

function calculateTrueHours(contractHours, commuteMinutes, unpaidBreak, prepTime, workDays, holidayDays) {
    const weeksPerYear = 52;
    const workingWeeks = weeksPerYear - (holidayDays / workDays);

    const weeklyContractHours = contractHours;
    const weeklyCommuteHours = (commuteMinutes * workDays) / 60;
    const weeklyBreakHours = (unpaidBreak * workDays) / 60;
    const weeklyPrepHours = (prepTime * workDays) / 60;
    const weeklyTotalHours = weeklyContractHours + weeklyCommuteHours + weeklyBreakHours + weeklyPrepHours;

    return {
        weeklyContractHours,
        weeklyCommuteHours,
        weeklyBreakHours,
        weeklyPrepHours,
        weeklyTotalHours,
        annualContractHours: weeklyContractHours * workingWeeks,
        annualTotalHours: weeklyTotalHours * workingWeeks,
        workingWeeks
    };
}

// ============================================
// MAIN CALCULATION
// ============================================

let lastCalculation = null;
let taxChart = null;
let timeChart = null;
let marginalRateChart = null;

function calculate() {
    const salary = getSalaryValue();
    const taxRegion = document.getElementById('taxRegion').value;
    const studentLoan = document.getElementById('studentLoan').value;
    const pensionPercent = parseFloat(document.getElementById('pensionPercent').value) || 0;

    const contractHours = parseFloat(document.getElementById('contractHours').value) || 37.5;
    const commuteMinutes = parseFloat(document.getElementById('commuteMinutes').value) || 0;
    const unpaidBreak = parseFloat(document.getElementById('unpaidBreak').value) || 0;
    const prepTime = parseFloat(document.getElementById('prepTime').value) || 0;
    const workDays = parseFloat(document.getElementById('workDays').value) || 5;
    const holidayDays = parseFloat(document.getElementById('holidayDays').value) || 28;

    const commuteCost = parseFloat(document.getElementById('commuteCost').value) || 0;
    const workClothes = parseFloat(document.getElementById('workClothes').value) || 0;
    const stressTax = parseFloat(document.getElementById('stressTax').value) || 0;

    const taxBreakdown = calculateAllDeductions(salary, taxRegion, studentLoan, pensionPercent);
    const timeBreakdown = calculateTrueHours(contractHours, commuteMinutes, unpaidBreak, prepTime, workDays, holidayDays);

    const annualWorkCosts = (commuteCost * 12) + workClothes;
    const netAfterCosts = taxBreakdown.netSalary - annualWorkCosts;
    const stressAdjustedNet = netAfterCosts * (1 - stressTax / 100);

    const assumedHourlyRate = salary / timeBreakdown.annualContractHours;
    const trueHourlyRate = stressAdjustedNet / timeBreakdown.annualTotalHours;
    const percentOfAssumed = (trueHourlyRate / assumedHourlyRate) * 100;

    lastCalculation = {
        trueHourlyRate,
        assumedHourlyRate,
        taxBreakdown,
        timeBreakdown,
        annualWorkCosts,
        stressTax,
        region: taxRegion,
        salary
    };

    displayResults(taxBreakdown, timeBreakdown, assumedHourlyRate, trueHourlyRate, percentOfAssumed);
    updateCharts(taxBreakdown, timeBreakdown);
    updateTaxTrapWarning(salary, taxRegion);
    updateShareUrl();
    calculatePurchase();
    renderProducts();

    // Show results and share sections
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('shareSection').style.display = 'block';

    // Update FIRE progress with calculated net income
    renderFireProgress();

    // Render What-If scenarios
    renderWhatIfScenarios();

    // Initialize S&P calculator
    calculateOpportunityCost();

    // Update PDF button state
    updatePdfButton();

    // Smooth scroll to results
    setTimeout(() => {
        document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function displayResults(tax, time, assumed, trueRate, percent) {
    animateValue('assumedRate', assumed, formatCurrency);
    animateValue('trueRate', trueRate, formatCurrency);

    const percentEl = document.getElementById('percentOfAssumed');
    percentEl.textContent = percent.toFixed(0) + '%';
    percentEl.className = percent < 50 ? 'text-2xl font-semibold text-red-400'
        : percent < 70 ? 'text-2xl font-semibold text-amber-400'
        : 'text-2xl font-semibold text-neutral-300';

    document.getElementById('taxBreakdown').innerHTML = `
        <div class="flex justify-between py-2">
            <span class="text-neutral-400">Gross Salary</span>
            <span class="text-white font-medium">£${formatNumber(Math.round(tax.grossSalary))}</span>
        </div>
        <div class="flex justify-between py-2 border-t border-white/5">
            <span class="text-neutral-500">Income Tax</span>
            <span class="text-red-400">-£${formatNumber(Math.round(tax.incomeTax))}</span>
        </div>
        <div class="flex justify-between py-2">
            <span class="text-neutral-500">National Insurance</span>
            <span class="text-orange-400">-£${formatNumber(Math.round(tax.nationalInsurance))}</span>
        </div>
        ${tax.studentLoan > 0 ? `<div class="flex justify-between py-2">
            <span class="text-neutral-500">Student Loan</span>
            <span class="text-amber-400">-£${formatNumber(Math.round(tax.studentLoan))}</span>
        </div>` : ''}
        ${tax.pensionContribution > 0 ? `<div class="flex justify-between py-2">
            <span class="text-neutral-500">Pension</span>
            <span class="text-blue-400">-£${formatNumber(Math.round(tax.pensionContribution))}</span>
        </div>` : ''}
        ${lastCalculation.annualWorkCosts > 0 ? `<div class="flex justify-between py-2">
            <span class="text-neutral-500">Work Costs</span>
            <span class="text-purple-400">-£${formatNumber(Math.round(lastCalculation.annualWorkCosts))}</span>
        </div>` : ''}
        <div class="flex justify-between py-3 border-t border-white/10 mt-2">
            <span class="text-neutral-300 font-medium">Take-Home</span>
            <span class="text-accent font-bold">£${formatNumber(Math.round(tax.netSalary - lastCalculation.annualWorkCosts))}</span>
        </div>
        <div class="flex justify-between text-xs text-neutral-500 mt-2">
            <span>Effective: ${tax.effectiveTaxRate.toFixed(1)}%</span>
            <span>Marginal: ${tax.effectiveMarginalRate.toFixed(1)}%</span>
        </div>
    `;

    document.getElementById('timeBreakdown').innerHTML = `
        <div class="flex justify-between py-2">
            <span class="text-neutral-400">Contract Hours</span>
            <span class="text-white font-medium">${formatTimeHM(time.weeklyContractHours)}</span>
        </div>
        <div class="flex justify-between py-2 border-t border-white/5">
            <span class="text-neutral-500">Commute</span>
            <span class="text-orange-400">+${formatTimeHM(time.weeklyCommuteHours)}</span>
        </div>
        <div class="flex justify-between py-2">
            <span class="text-neutral-500">Unpaid Breaks</span>
            <span class="text-amber-400">+${formatTimeHM(time.weeklyBreakHours)}</span>
        </div>
        <div class="flex justify-between py-2">
            <span class="text-neutral-500">Prep Time</span>
            <span class="text-purple-400">+${formatTimeHM(time.weeklyPrepHours)}</span>
        </div>
        <div class="flex justify-between py-3 border-t border-white/10 mt-2">
            <span class="text-neutral-300 font-medium">True Weekly Hours</span>
            <span class="text-accent font-bold">${formatTimeHM(time.weeklyTotalHours)}</span>
        </div>
        <div class="flex justify-between text-xs text-neutral-500 mt-2">
            <span>Annual: ${formatNumber(Math.round(time.annualContractHours))}h contract</span>
            <span>${formatNumber(Math.round(time.annualTotalHours))}h true</span>
        </div>
    `;
}

function animateValue(elementId, endValue, formatter) {
    const el = document.getElementById(elementId);
    const duration = 600;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = endValue * easeProgress;
        el.textContent = formatter(currentValue);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function updateCharts(tax, time) {
    Chart.defaults.color = COLORS.neutral[500];
    Chart.defaults.borderColor = COLORS.neutral[800];

    const taxCtx = document.getElementById('taxChart').getContext('2d');
    if (taxChart) taxChart.destroy();

    const taxData = [];
    const taxLabels = [];
    const taxColors = [];

    const items = [
        { value: tax.netSalary - lastCalculation.annualWorkCosts, label: 'Take-Home', color: COLORS.accent },
        { value: tax.incomeTax, label: 'Income Tax', color: COLORS.red },
        { value: tax.nationalInsurance, label: 'NI', color: COLORS.orange },
        { value: tax.studentLoan, label: 'Student Loan', color: COLORS.amber },
        { value: tax.pensionContribution, label: 'Pension', color: COLORS.blue },
        { value: lastCalculation.annualWorkCosts, label: 'Work Costs', color: COLORS.purple }
    ];

    items.forEach(item => {
        if (item.value > 0) {
            taxData.push(item.value);
            taxLabels.push(item.label);
            taxColors.push(item.color);
        }
    });

    taxChart = new Chart(taxCtx, {
        type: 'doughnut',
        data: { labels: taxLabels, datasets: [{ data: taxData, backgroundColor: taxColors, borderWidth: 0 }] },
        options: { responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } } } }
    });

    const timeCtx = document.getElementById('timeChart').getContext('2d');
    if (timeChart) timeChart.destroy();

    timeChart = new Chart(timeCtx, {
        type: 'doughnut',
        data: {
            labels: ['Contract', 'Commute', 'Breaks', 'Prep'],
            datasets: [{
                data: [time.weeklyContractHours, time.weeklyCommuteHours, time.weeklyBreakHours, time.weeklyPrepHours],
                backgroundColor: [COLORS.accent, COLORS.orange, COLORS.amber, COLORS.purple],
                borderWidth: 0
            }]
        },
        options: { responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } } } }
    });
}

// ============================================
// £100K TAX TRAP
// ============================================

function updateTaxTrapWarning(salary, region) {
    const taxTrapWarning = document.getElementById('taxTrapWarning');
    const marginalRateSection = document.getElementById('marginalRateSection');
    const inTaxTrap = salary > 100000 && salary <= 125140;

    if (inTaxTrap) {
        taxTrapWarning.classList.remove('hidden');
        const marginalRate = region === 'scotland' ? '67.5%' : '60%';
        const personalAllowance = calculatePersonalAllowance(salary);
        const lostPA = TAX_CONFIG.personalAllowance - personalAllowance;
        const extraTaxFromPALoss = lostPA * 0.40;
        const netPer1000 = region === 'scotland' ? 325 : 400;

        document.getElementById('trapMarginalRate').textContent = marginalRate;
        document.getElementById('trapPA').textContent = formatCurrency(personalAllowance);
        document.getElementById('trapExtraTax').textContent = formatCurrency(extraTaxFromPALoss);
        document.getElementById('trapNetPer1000').textContent = formatCurrency(netPer1000);
    } else {
        taxTrapWarning.classList.add('hidden');
    }

    if (salary > 50000) {
        marginalRateSection.classList.remove('hidden');
        renderMarginalRateChart(salary, region);
    } else {
        marginalRateSection.classList.add('hidden');
    }
}

function renderMarginalRateChart(currentSalary, region) {
    const ctx = document.getElementById('marginalRateChart').getContext('2d');
    if (marginalRateChart) marginalRateChart.destroy();

    const incomes = [];
    const marginalRates = [];

    for (let income = 20000; income <= 160000; income += 2500) {
        incomes.push(income);
        let marginal = region === 'scotland'
            ? getMarginalRateScotland(income) + (income > 50270 ? 0.02 : 0.08)
            : getMarginalRateEngland(income) + (income > 50270 ? 0.02 : 0.08);
        marginalRates.push(marginal * 100);
    }

    const pointColors = incomes.map(inc => Math.abs(inc - currentSalary) < 2500 ? COLORS.accent : 'transparent');
    const pointRadii = incomes.map(inc => Math.abs(inc - currentSalary) < 2500 ? 6 : 0);

    marginalRateChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: incomes.map(i => '£' + (i / 1000) + 'k'),
            datasets: [{
                data: marginalRates,
                borderColor: COLORS.accent,
                backgroundColor: COLORS.accentLight,
                fill: true,
                tension: 0.2,
                pointBackgroundColor: pointColors,
                pointRadius: pointRadii,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#111', borderColor: '#333', borderWidth: 1, padding: 12 }
            },
            scales: {
                y: { beginAtZero: true, max: 80, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { callback: v => v + '%' } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } }
            }
        }
    });
}

// ============================================
// PRODUCT EXPLORER
// ============================================

let currentCategory = 'all';
let searchQuery = '';
let productsShown = 12;

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const showMoreBtn = document.getElementById('showMoreBtn');

    let filtered = UK_PRODUCTS.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const toShow = filtered.slice(0, productsShown);
    showMoreBtn.classList.toggle('hidden', toShow.length >= filtered.length);

    grid.innerHTML = toShow.map(p => {
        const hours = lastCalculation ? p.price / lastCalculation.trueHourlyRate : 0;
        const periodLabel = p.period ? `/${p.period}` : '';
        return `
            <button type="button" class="product-item p-4 text-left" onclick="selectProduct(${p.price})">
                <div class="text-2xl mb-2">${p.emoji}</div>
                <div class="text-sm text-white font-medium mb-1 truncate">${p.name}</div>
                <div class="text-xs text-neutral-500 mb-2">£${p.price.toFixed(2)}${periodLabel}</div>
                <div class="text-sm font-semibold text-accent">${formatHours(hours)}</div>
            </button>
        `;
    }).join('');
}

function setCategory(category) {
    currentCategory = category;
    productsShown = 12;

    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });

    renderProducts();
}

function filterProducts() {
    searchQuery = document.getElementById('productSearch').value;
    productsShown = 12;
    renderProducts();
}

function showMoreProducts() {
    productsShown += 12;
    renderProducts();
}

function selectProduct(price) {
    document.getElementById('purchaseAmount').value = price;
    calculatePurchase();
}

// ============================================
// PURCHASE CONVERTER
// ============================================

function calculatePurchase() {
    if (!lastCalculation) return;
    const amount = parseFloat(document.getElementById('purchaseAmount').value) || 0;
    const hours = amount / lastCalculation.trueHourlyRate;
    document.getElementById('purchaseHours').textContent = formatHours(hours);
}

function formatHours(hours) {
    if (!hours || !isFinite(hours)) return '0h';
    if (hours < 1) return Math.round(hours * 60) + 'm';
    if (hours < 8) return hours.toFixed(1) + 'h';
    const days = Math.floor(hours / 8);
    const rem = hours % 8;
    return rem < 0.5 ? `${days}d` : `${days}d ${rem.toFixed(1)}h`;
}

// ============================================
// URL SHARING
// ============================================

function updateShareUrl() {
    // Use the compact Base64 encoded format for cleaner URLs
    const shareUrl = generateCompactShareUrl();
    document.getElementById('shareUrl').value = shareUrl;

    // Also update browser URL without reload
    if (window.history && window.history.replaceState) {
        window.history.replaceState({}, '', shareUrl);
    }
}

function copyShareUrl() {
    const input = document.getElementById('shareUrl');
    input.select();
    navigator.clipboard.writeText(input.value);

    const btn = document.getElementById('copyBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = COLORS.accent;
    btn.style.color = '#050505';
    btn.style.borderColor = COLORS.accent;

    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
    }, 2000);
}

function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('s')) return;

    // Format salary with commas
    const salaryValue = parseInt(params.get('s')) || 35000;
    document.getElementById('salary').value = formatNumber(salaryValue);

    document.getElementById('taxRegion').value = params.get('r') || 'england';
    document.getElementById('studentLoan').value = params.get('sl') || 'none';
    document.getElementById('pensionPercent').value = params.get('p') || '5';
    document.getElementById('contractHours').value = params.get('ch') || '37.5';
    document.getElementById('commuteMinutes').value = params.get('cm') || '56';
    document.getElementById('unpaidBreak').value = params.get('ub') || '30';
    document.getElementById('prepTime').value = params.get('pt') || '30';
    document.getElementById('workDays').value = params.get('wd') || '5';
    document.getElementById('holidayDays').value = params.get('hd') || '28';
    document.getElementById('commuteCost').value = params.get('cc') || '0';
    document.getElementById('workClothes').value = params.get('wc') || '0';
    document.getElementById('stressTax').value = params.get('st') || '0';
    document.getElementById('stressTaxValue').textContent = (params.get('st') || '0') + '%';

    // Update time displays
    updateTimeDisplay('commuteMinutes', 'commuteDisplay');
    updateTimeDisplay('unpaidBreak', 'breakDisplay');
    updateTimeDisplay('prepTime', 'prepDisplay');

    calculate();
}

// ============================================
// UTILITY
// ============================================

function formatCurrency(amount) {
    return '£' + amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSalaryInput(input) {
    // Remove non-numeric characters except for the cursor position
    let cursorPos = input.selectionStart;
    let oldLength = input.value.length;

    // Get raw number
    let rawValue = input.value.replace(/[^0-9]/g, '');
    let numValue = parseInt(rawValue, 10) || 0;

    // Format with commas
    let formatted = numValue.toLocaleString('en-GB');

    // Update the input
    input.value = formatted;

    // Adjust cursor position
    let newLength = formatted.length;
    let diff = newLength - oldLength;
    input.setSelectionRange(cursorPos + diff, cursorPos + diff);
}

function getSalaryValue() {
    const salaryInput = document.getElementById('salary');
    return parseFloat(salaryInput.value.replace(/,/g, '')) || 0;
}

function updateTimeDisplay(inputId, displayId) {
    const minutes = parseInt(document.getElementById(inputId).value) || 0;
    const displayEl = document.getElementById(displayId);

    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        displayEl.textContent = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } else {
        displayEl.textContent = `${minutes}m`;
    }
}

function formatNumber(num) {
    return num.toLocaleString('en-GB');
}

function formatTimeHM(hours) {
    if (!hours || hours === 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
}

// ============================================
// SHAREABLE URL - BASE64 ENCODING
// ============================================

function generateCompactShareUrl() {
    const data = {
        s: getSalaryValue(),
        r: document.getElementById('taxRegion').value,
        sl: document.getElementById('studentLoan').value,
        p: document.getElementById('pensionPercent').value,
        ch: document.getElementById('contractHours').value,
        cm: document.getElementById('commuteMinutes').value,
        ub: document.getElementById('unpaidBreak').value,
        pt: document.getElementById('prepTime').value,
        wd: document.getElementById('workDays').value,
        hd: document.getElementById('holidayDays').value,
        cc: document.getElementById('commuteCost').value,
        wc: document.getElementById('workClothes').value,
        st: document.getElementById('stressTax').value
    };
    const encoded = btoa(JSON.stringify(data));
    return `${window.location.origin}${window.location.pathname}?calc=${encoded}`;
}

function loadFromCompactUrl() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('calc');
    if (!encoded) return false;

    try {
        const data = JSON.parse(atob(encoded));
        document.getElementById('salary').value = formatNumber(parseInt(data.s) || 35000);
        document.getElementById('taxRegion').value = data.r || 'england';
        document.getElementById('studentLoan').value = data.sl || 'none';
        document.getElementById('pensionPercent').value = data.p || '5';
        document.getElementById('contractHours').value = data.ch || '37.5';
        document.getElementById('commuteMinutes').value = data.cm || '56';
        document.getElementById('unpaidBreak').value = data.ub || '30';
        document.getElementById('prepTime').value = data.pt || '30';
        document.getElementById('workDays').value = data.wd || '5';
        document.getElementById('holidayDays').value = data.hd || '28';
        document.getElementById('commuteCost').value = data.cc || '0';
        document.getElementById('workClothes').value = data.wc || '0';
        document.getElementById('stressTax').value = data.st || '0';
        document.getElementById('stressTaxValue').textContent = (data.st || '0') + '%';
        return true;
    } catch (e) {
        return false;
    }
}

// ============================================
// SOCIAL MEDIA RESULT CARDS (1200x630px)
// ============================================

async function generateSocialCard() {
    if (!lastCalculation) {
        alert('Please calculate your wage first');
        return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#050505');
    gradient.addColorStop(0.5, '#0a0a0a');
    gradient.addColorStop(1, '#050505');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Accent glow effect
    const glowGradient = ctx.createRadialGradient(600, 300, 0, 600, 300, 400);
    glowGradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 630);
        ctx.stroke();
    }
    for (let y = 0; y < 630; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1200, y);
        ctx.stroke();
    }

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('My True Hourly Wage', 600, 80);

    // Main stat card background
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 2;
    roundRect(ctx, 350, 120, 500, 180, 20);
    ctx.fill();
    ctx.stroke();

    // True rate
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 72px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(formatCurrency(lastCalculation.trueHourlyRate), 600, 220);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('per hour (after tax & real time)', 600, 270);

    // Comparison stats
    const stats = [
        { label: 'Assumed Rate', value: formatCurrency(lastCalculation.assumedHourlyRate), color: '#a3a3a3' },
        { label: 'Reality Check', value: ((lastCalculation.trueHourlyRate / lastCalculation.assumedHourlyRate) * 100).toFixed(0) + '%', color: getPercentColor((lastCalculation.trueHourlyRate / lastCalculation.assumedHourlyRate) * 100) },
        { label: 'Hidden Hours', value: formatTimeHM(lastCalculation.timeBreakdown.weeklyTotalHours - lastCalculation.timeBreakdown.weeklyContractHours) + '/week', color: '#f97316' }
    ];

    let xPos = 200;
    stats.forEach(stat => {
        ctx.fillStyle = 'rgba(26, 26, 26, 0.8)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        roundRect(ctx, xPos - 120, 340, 240, 120, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#525252';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(stat.label.toUpperCase(), xPos, 380);

        ctx.fillStyle = stat.color;
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.fillText(stat.value, xPos, 430);

        xPos += 400;
    });

    // Tax info bar
    ctx.fillStyle = 'rgba(17, 17, 17, 0.9)';
    roundRect(ctx, 100, 500, 1000, 60, 12);
    ctx.fill();

    ctx.fillStyle = '#737373';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    const taxInfo = `£${formatNumber(Math.round(lastCalculation.salary))} salary · ${lastCalculation.region === 'scotland' ? 'Scotland' : 'England/Wales/NI'} · ${lastCalculation.taxBreakdown.effectiveTaxRate.toFixed(1)}% effective tax`;
    ctx.fillText(taxInfo, 600, 538);

    // Branding
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TrueWage', 60, 600);

    ctx.fillStyle = '#525252';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('truewage.co.uk', 150, 600);

    return canvas;
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function getPercentColor(percent) {
    if (percent < 50) return '#ef4444';
    if (percent < 70) return '#f59e0b';
    return '#10b981';
}

async function downloadSocialCard() {
    const canvas = await generateSocialCard();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'my-true-hourly-wage.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

async function shareToTwitter() {
    if (!lastCalculation) return;
    const percent = ((lastCalculation.trueHourlyRate / lastCalculation.assumedHourlyRate) * 100).toFixed(0);
    const text = `My true hourly wage is ${formatCurrency(lastCalculation.trueHourlyRate)}/hour - only ${percent}% of what I assumed! 😱\n\nCalculate yours:`;
    const url = generateCompactShareUrl();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

async function shareToLinkedIn() {
    const url = generateCompactShareUrl();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
}

// ============================================
// PDF REPORT GENERATION
// ============================================

async function generatePdfReport() {
    if (!lastCalculation) {
        alert('Please calculate your wage first');
        return;
    }

    const canDownload = canDownloadFreePdf();

    if (!canDownload) {
        showPremiumModal();
        return;
    }

    // Load jsPDF dynamically if not already loaded
    if (typeof jspdf === 'undefined') {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(5, 5, 5);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TrueWage Report', 20, 25);
    doc.setTextColor(115, 115, 115);
    doc.setFontSize(10);
    doc.text('Generated: ' + new Date().toLocaleDateString('en-GB'), 150, 25);

    // Main result
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Your True Hourly Wage', 20, 55);

    doc.setFontSize(36);
    doc.setTextColor(16, 185, 129);
    doc.text(formatCurrency(lastCalculation.trueHourlyRate), 20, 75);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('per hour after tax and real time', 20, 85);

    // Comparison
    const percent = ((lastCalculation.trueHourlyRate / lastCalculation.assumedHourlyRate) * 100).toFixed(1);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Assumed Rate: ${formatCurrency(lastCalculation.assumedHourlyRate)}/hour`, 20, 100);
    doc.text(`Reality Check: ${percent}% of what you thought`, 20, 108);

    // Tax Breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tax Breakdown (Annual)', 20, 125);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let y = 135;
    const tax = lastCalculation.taxBreakdown;

    const taxItems = [
        ['Gross Salary', `£${formatNumber(Math.round(tax.grossSalary))}`],
        ['Income Tax', `-£${formatNumber(Math.round(tax.incomeTax))}`],
        ['National Insurance', `-£${formatNumber(Math.round(tax.nationalInsurance))}`],
    ];

    if (tax.studentLoan > 0) taxItems.push(['Student Loan', `-£${formatNumber(Math.round(tax.studentLoan))}`]);
    if (tax.pensionContribution > 0) taxItems.push(['Pension', `-£${formatNumber(Math.round(tax.pensionContribution))}`]);
    if (lastCalculation.annualWorkCosts > 0) taxItems.push(['Work Costs', `-£${formatNumber(Math.round(lastCalculation.annualWorkCosts))}`]);
    taxItems.push(['Take-Home', `£${formatNumber(Math.round(tax.netSalary - lastCalculation.annualWorkCosts))}`]);

    taxItems.forEach(([label, value]) => {
        doc.text(label, 25, y);
        doc.text(value, 90, y, { align: 'right' });
        y += 8;
    });

    doc.text(`Effective Tax Rate: ${tax.effectiveTaxRate.toFixed(1)}%`, 25, y + 5);
    doc.text(`Marginal Rate: ${tax.effectiveMarginalRate.toFixed(1)}%`, 25, y + 13);

    // Time Breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Time Breakdown (Weekly)', 120, 125);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y = 135;
    const time = lastCalculation.timeBreakdown;

    const timeItems = [
        ['Contract Hours', formatTimeHM(time.weeklyContractHours)],
        ['Commute', `+${formatTimeHM(time.weeklyCommuteHours)}`],
        ['Unpaid Breaks', `+${formatTimeHM(time.weeklyBreakHours)}`],
        ['Prep Time', `+${formatTimeHM(time.weeklyPrepHours)}`],
        ['Total Weekly', formatTimeHM(time.weeklyTotalHours)],
    ];

    timeItems.forEach(([label, value]) => {
        doc.text(label, 125, y);
        doc.text(value, 185, y, { align: 'right' });
        y += 8;
    });

    doc.text(`Annual Contract: ${formatNumber(Math.round(time.annualContractHours))}h`, 125, y + 5);
    doc.text(`Annual True: ${formatNumber(Math.round(time.annualTotalHours))}h`, 125, y + 13);

    // Insights
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Insights', 20, 210);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const hiddenHours = time.weeklyTotalHours - time.weeklyContractHours;
    const annualHiddenHours = (hiddenHours * time.workingWeeks).toFixed(0);
    const hourlyDiff = lastCalculation.assumedHourlyRate - lastCalculation.trueHourlyRate;

    const insights = [
        `• You spend ${formatTimeHM(hiddenHours)} extra per week on work-related activities (${annualHiddenHours}h/year)`,
        `• Your true rate is £${hourlyDiff.toFixed(2)}/hour less than assumed`,
        `• Every £100 purchase costs you ${(100 / lastCalculation.trueHourlyRate).toFixed(1)} hours of your life`,
    ];

    if (lastCalculation.salary > 100000 && lastCalculation.salary <= 125140) {
        insights.push(`• WARNING: You're in the £100K tax trap with a ${lastCalculation.region === 'scotland' ? '67.5%' : '60%'} marginal rate`);
    }

    y = 220;
    insights.forEach(insight => {
        doc.text(insight, 20, y);
        y += 8;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by TrueWage | truewage.co.uk | For illustrative purposes only', 105, 285, { align: 'center' });

    // Save
    doc.save('truewage-report.pdf');

    // Increment counter
    incrementPdfDownload();
    updatePdfButton();
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function showPremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function updatePdfButton() {
    const btn = document.getElementById('downloadPdfBtn');
    const badge = document.getElementById('pdfFreeBadge');
    if (!btn) return;

    if (canDownloadFreePdf()) {
        btn.textContent = 'Download PDF Report';
        if (badge) badge.classList.remove('hidden');
    } else {
        btn.innerHTML = 'Download PDF Report <span class="text-xs opacity-70">(Premium)</span>';
        if (badge) badge.classList.add('hidden');
    }
}

// ============================================
// S&P 500 OPPORTUNITY COST CALCULATOR
// ============================================

const SP500_NOMINAL_RETURN = 0.1026; // 10.26% historical average
const SP500_REAL_RETURN = 0.07; // 7% inflation-adjusted
const SAFE_WITHDRAWAL_RATE = 0.04; // 4% rule

function calculateOpportunityCost() {
    const amount = parseFloat(document.getElementById('spAmount')?.value) || 100;
    const currentAge = parseInt(document.getElementById('spCurrentAge')?.value) || 30;
    const retireAge = parseInt(document.getElementById('spRetireAge')?.value) || 65;
    const years = retireAge - currentAge;

    if (years <= 0) {
        document.getElementById('spResults').innerHTML = '<p class="text-neutral-500">Retirement age must be greater than current age</p>';
        return;
    }

    // Future value calculations
    const futureNominal = amount * Math.pow(1 + SP500_NOMINAL_RETURN, years);
    const futureReal = amount * Math.pow(1 + SP500_REAL_RETURN, years);

    // Monthly retirement income using 4% rule
    const monthlyIncomeNominal = (futureNominal * SAFE_WITHDRAWAL_RATE) / 12;
    const monthlyIncomeReal = (futureReal * SAFE_WITHDRAWAL_RATE) / 12;

    // Hours of work equivalent
    const hoursOfWork = lastCalculation ? (amount / lastCalculation.trueHourlyRate).toFixed(1) : '?';

    document.getElementById('spResults').innerHTML = `
        <div class="grid md:grid-cols-2 gap-4 mt-6">
            <div class="p-5 rounded-xl bg-accent/5 border border-accent/20">
                <p class="text-xs text-accent/70 uppercase tracking-wider mb-2">Optimistic (Nominal)</p>
                <p class="text-2xl font-bold text-accent mb-1">£${Math.round(futureNominal).toLocaleString()}</p>
                <p class="text-sm text-neutral-400">at age ${retireAge}</p>
                <div class="mt-3 pt-3 border-t border-accent/10">
                    <p class="text-xs text-neutral-500">Monthly income forever:</p>
                    <p class="text-lg font-semibold text-accent">£${monthlyIncomeNominal.toFixed(2)}/mo</p>
                </div>
            </div>
            <div class="p-5 rounded-xl bg-dark-700 border border-white/5">
                <p class="text-xs text-neutral-500 uppercase tracking-wider mb-2">Realistic (Inflation-Adjusted)</p>
                <p class="text-2xl font-bold text-white mb-1">£${Math.round(futureReal).toLocaleString()}</p>
                <p class="text-sm text-neutral-400">in today's money</p>
                <div class="mt-3 pt-3 border-t border-white/5">
                    <p class="text-xs text-neutral-500">Monthly income forever:</p>
                    <p class="text-lg font-semibold text-white">£${monthlyIncomeReal.toFixed(2)}/mo</p>
                </div>
            </div>
        </div>
        <div class="mt-4 p-4 rounded-lg bg-dark-600/50">
            <p class="text-sm text-neutral-400">
                <span class="text-white font-medium">True Cost:</span> This £${amount} purchase =
                <span class="text-accent font-semibold">${hoursOfWork} hours</span> of your life now,
                or <span class="text-orange-400 font-semibold">£${monthlyIncomeReal.toFixed(2)}/mo</span> in retirement income forever.
            </p>
        </div>
    `;
}

// ============================================
// FIRE PROGRESS VISUALIZATION
// ============================================

function calculateFireProgress() {
    if (!lastCalculation) return null;

    const annualExpenses = parseFloat(document.getElementById('fireAnnualExpenses')?.value) || 30000;
    const currentSavings = parseFloat(document.getElementById('fireCurrentSavings')?.value) || 0;

    // FI Number = 25x annual expenses (4% rule)
    const fiNumber = annualExpenses * 25;
    const progress = (currentSavings / fiNumber) * 100;

    // Milestones
    const milestones = [
        { name: 'First £10K', target: 10000, icon: '🌱' },
        { name: '£25K', target: 25000, icon: '📈' },
        { name: '£50K', target: 50000, icon: '🎯' },
        { name: '£100K', target: 100000, icon: '💪' },
        { name: 'Coast FI', target: fiNumber * 0.5, icon: '⛵' },
        { name: 'Lean FI', target: fiNumber * 0.75, icon: '🏃' },
        { name: 'Full FI', target: fiNumber, icon: '🎉' },
    ];

    const achievedMilestones = milestones.filter(m => currentSavings >= m.target);
    const nextMilestone = milestones.find(m => currentSavings < m.target);

    // Zone colors
    let zoneColor = '#ef4444'; // Red
    let zone = 'Starting Out';
    if (progress >= 25) { zoneColor = '#f59e0b'; zone = 'Building'; }
    if (progress >= 50) { zoneColor = '#eab308'; zone = 'Halfway'; }
    if (progress >= 75) { zoneColor = '#84cc16'; zone = 'Almost There'; }
    if (progress >= 100) { zoneColor = '#10b981'; zone = 'Financially Independent!'; }

    return {
        fiNumber,
        progress: Math.min(progress, 100),
        currentSavings,
        milestones,
        achievedMilestones,
        nextMilestone,
        zoneColor,
        zone
    };
}

function renderFireProgress() {
    const container = document.getElementById('fireProgressContainer');
    if (!container) return;

    const data = calculateFireProgress();
    if (!data) {
        container.innerHTML = '<p class="text-neutral-500">Calculate your wage first to see FIRE progress</p>';
        return;
    }

    container.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-end mb-2">
                <div>
                    <p class="text-xs text-neutral-500 uppercase tracking-wider">Your FI Number</p>
                    <p class="text-2xl font-bold text-white">£${Math.round(data.fiNumber).toLocaleString()}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-neutral-500">${data.zone}</p>
                    <p class="text-lg font-bold" style="color: ${data.zoneColor}">${data.progress.toFixed(1)}%</p>
                </div>
            </div>

            <!-- Progress bar -->
            <div class="h-4 bg-dark-600 rounded-full overflow-hidden relative">
                <div class="h-full rounded-full transition-all duration-500"
                     style="width: ${data.progress}%; background: linear-gradient(90deg, ${data.zoneColor}, #10b981)"></div>
                <!-- Milestone markers -->
                ${data.milestones.map(m => {
                    const pos = Math.min((m.target / data.fiNumber) * 100, 100);
                    return `<div class="absolute top-0 h-full w-0.5 bg-white/20" style="left: ${pos}%"></div>`;
                }).join('')}
            </div>
        </div>

        <!-- Milestones -->
        <div class="grid grid-cols-4 md:grid-cols-7 gap-2">
            ${data.milestones.map(m => {
                const achieved = data.currentSavings >= m.target;
                return `
                    <div class="text-center p-2 rounded-lg ${achieved ? 'bg-accent/10 border border-accent/30' : 'bg-dark-600/50 border border-white/5'}">
                        <span class="text-lg">${m.icon}</span>
                        <p class="text-xs ${achieved ? 'text-accent' : 'text-neutral-500'} mt-1">${m.name}</p>
                    </div>
                `;
            }).join('')}
        </div>

        ${data.nextMilestone ? `
            <p class="text-sm text-neutral-400 mt-4">
                Next: <span class="text-white font-medium">${data.nextMilestone.name}</span> -
                £${Math.round(data.nextMilestone.target - data.currentSavings).toLocaleString()} to go
            </p>
        ` : '<p class="text-accent mt-4 font-medium">🎉 Congratulations! You\'ve reached Financial Independence!</p>'}
    `;
}

// ============================================
// WHAT-IF SCENARIOS
// ============================================

function calculateWhatIfScenario(scenario) {
    if (!lastCalculation) return null;

    const base = { ...lastCalculation };
    let modified = {};

    switch (scenario) {
        case 'wfh2':
            // WFH 2 days = 60% commute
            modified.commuteMinutes = parseFloat(document.getElementById('commuteMinutes').value) * 0.6;
            modified.commuteCost = parseFloat(document.getElementById('commuteCost').value) * 0.6;
            modified.label = 'WFH 2 days/week';
            break;
        case 'wfh3':
            // WFH 3 days = 40% commute
            modified.commuteMinutes = parseFloat(document.getElementById('commuteMinutes').value) * 0.4;
            modified.commuteCost = parseFloat(document.getElementById('commuteCost').value) * 0.4;
            modified.label = 'WFH 3 days/week';
            break;
        case 'raise10':
            modified.salary = lastCalculation.salary * 1.10;
            modified.label = '10% raise';
            break;
        case 'raise20':
            modified.salary = lastCalculation.salary * 1.20;
            modified.label = '20% raise';
            break;
    }

    // Recalculate with modified values
    const salary = modified.salary || lastCalculation.salary;
    const commuteMinutes = modified.commuteMinutes ?? parseFloat(document.getElementById('commuteMinutes').value);
    const commuteCost = modified.commuteCost ?? parseFloat(document.getElementById('commuteCost').value);

    const taxBreakdown = calculateAllDeductions(
        salary,
        document.getElementById('taxRegion').value,
        document.getElementById('studentLoan').value,
        parseFloat(document.getElementById('pensionPercent').value)
    );

    const timeBreakdown = calculateTrueHours(
        parseFloat(document.getElementById('contractHours').value),
        commuteMinutes,
        parseFloat(document.getElementById('unpaidBreak').value),
        parseFloat(document.getElementById('prepTime').value),
        parseFloat(document.getElementById('workDays').value),
        parseFloat(document.getElementById('holidayDays').value)
    );

    const annualWorkCosts = (commuteCost * 12) + parseFloat(document.getElementById('workClothes').value);
    const netAfterCosts = taxBreakdown.netSalary - annualWorkCosts;
    const stressTax = parseFloat(document.getElementById('stressTax').value);
    const stressAdjustedNet = netAfterCosts * (1 - stressTax / 100);
    const trueHourlyRate = stressAdjustedNet / timeBreakdown.annualTotalHours;

    return {
        label: modified.label,
        trueHourlyRate,
        difference: trueHourlyRate - lastCalculation.trueHourlyRate,
        percentChange: ((trueHourlyRate / lastCalculation.trueHourlyRate) - 1) * 100
    };
}

function renderWhatIfScenarios() {
    const container = document.getElementById('whatIfContainer');
    if (!container || !lastCalculation) return;

    const scenarios = ['wfh2', 'wfh3', 'raise10', 'raise20'].map(s => calculateWhatIfScenario(s));

    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${scenarios.map(s => `
                <div class="p-4 rounded-xl bg-dark-700 border ${s.difference > 0 ? 'border-accent/20' : 'border-white/5'}">
                    <p class="text-xs text-neutral-500 mb-2">${s.label}</p>
                    <p class="text-xl font-bold ${s.difference > 0 ? 'text-accent' : 'text-white'}">${formatCurrency(s.trueHourlyRate)}</p>
                    <p class="text-xs mt-1 ${s.difference > 0 ? 'text-accent' : 'text-red-400'}">
                        ${s.difference > 0 ? '+' : ''}${formatCurrency(s.difference)} (${s.percentChange > 0 ? '+' : ''}${s.percentChange.toFixed(1)}%)
                    </p>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// EMAIL SIGNUP HANDLING
// ============================================

async function handleEmailSignup(event) {
    event.preventDefault();

    const email = document.getElementById('emailInput').value;
    const consent = document.getElementById('gdprConsent').checked;
    const submitBtn = document.getElementById('emailSubmitBtn');

    if (!email || !consent) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';

    try {
        // Store locally (replace with actual API call for production)
        storeEmailSignup(email);

        // Show success
        const form = document.getElementById('emailForm');
        form.innerHTML = '<p class="text-accent font-medium">✓ Thanks for subscribing!</p>';

    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subscribe';
        alert('Failed to subscribe. Please try again.');
    }
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Try compact URL first, then legacy format
    if (!loadFromCompactUrl()) {
        loadFromUrl();
    }

    // Initialize time displays
    updateTimeDisplay('commuteMinutes', 'commuteDisplay');
    updateTimeDisplay('unpaidBreak', 'breakDisplay');
    updateTimeDisplay('prepTime', 'prepDisplay');

    // Stress tax slider
    const stressTaxSlider = document.getElementById('stressTax');
    stressTaxSlider?.addEventListener('input', () => {
        document.getElementById('stressTaxValue').textContent = stressTaxSlider.value + '%';
    });

    // Auto-recalculate on input change
    let debounceTimer;
    document.querySelectorAll('#calculator input, #calculator select').forEach(input => {
        input.addEventListener('change', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (lastCalculation) calculate();
            }, 300);
        });
    });

    // S&P calculator inputs
    document.querySelectorAll('#sp500Calculator input').forEach(input => {
        input.addEventListener('input', () => {
            calculateOpportunityCost();
        });
    });

    // FIRE calculator inputs
    document.querySelectorAll('#fireProgress input').forEach(input => {
        input.addEventListener('input', () => {
            renderFireProgress();
        });
    });

    // Render initial products (with placeholder values)
    renderProducts();

    // Update PDF button state
    updatePdfButton();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    const headerOffset = 20;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
