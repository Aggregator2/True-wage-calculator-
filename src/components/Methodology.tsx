'use client';

export default function Methodology() {
  return (
    <section id="methodology" className="py-16 px-6 bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto">
        <div className="card p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-6">How This Is Calculated</h2>

          <div className="space-y-6 text-sm text-neutral-400">
            <div>
              <h3 className="font-semibold text-white mb-2">Tax Calculations</h3>
              <p>Uses 2025/26 UK tax rates including Income Tax bands (with Scottish rates), National Insurance (8% up to £50,270, 2% above), and all five Student Loan plan thresholds.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Time Calculations</h3>
              <p>Your &quot;true&quot; working hours = contract hours + commute + unpaid breaks + prep time. Annual hours calculated as 52 weeks minus your leave entitlement.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Work-Related Costs</h3>
              <p>Commute costs and work clothing are deducted from take-home pay before calculating your effective hourly rate.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">The £100K Trap</h3>
              <p>Between £100,000 and £125,140, you lose £1 of Personal Allowance for every £2 earned, creating an effective 60% marginal rate (67.5% in Scotland).</p>
            </div>

            <p className="text-xs text-neutral-600 pt-4 border-t border-white/5">
              For illustrative purposes only. Consult a qualified accountant for personal tax advice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
