/**
 * UK True Hourly Wage Calculator
 * Tax rates: 2025/26
 */

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
    const params = new URLSearchParams({
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
    });
    document.getElementById('shareUrl').value = `${window.location.origin}${window.location.pathname}?${params}`;
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
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadFromUrl();

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

    // Render initial products (with placeholder values)
    renderProducts();

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
