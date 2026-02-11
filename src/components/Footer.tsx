'use client';

export default function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#10b981]/20 flex items-center justify-center">
            <span className="text-[#10b981] font-bold text-xs">£</span>
          </div>
          <span className="text-sm text-neutral-400">TrueWage</span>
        </div>
        <p className="text-sm text-neutral-600">
          Built for r/UKPersonalFinance · All calculations run locally · No data stored
        </p>
      </div>
    </footer>
  );
}
