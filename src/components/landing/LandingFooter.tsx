import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.04] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          {/* Logo & tagline */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <span className="text-emerald-400 font-bold text-xs">TW</span>
              </div>
              <span className="font-bold text-white text-base tracking-tight">TrueWage</span>
            </Link>
            <p className="text-xs text-zinc-500">Built for UK workers.</p>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Link href="/calculator" className="text-zinc-400 hover:text-white transition-colors">Calculator</Link>
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
            <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</a>
            <a href="#features" className="text-zinc-400 hover:text-white transition-colors">Features</a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.04]">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} TrueWage. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-zinc-600">
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
