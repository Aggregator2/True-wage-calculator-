'use client';

export default function Hero() {
  const scrollToCalculator = () => {
    const calculator = document.getElementById('calculator');
    if (calculator) {
      calculator.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToMethodology = () => {
    const methodology = document.getElementById('methodology');
    if (methodology) {
      methodology.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Glow orbs */}
      <div className="glow-orb" style={{ width: '400px', height: '400px', background: '#10b981', top: '-10%', left: '30%' }}></div>
      <div className="glow-orb" style={{ width: '300px', height: '300px', background: '#059669', bottom: '10%', right: '10%', animationDelay: '2s' }}></div>
      <div className="glow-orb" style={{ width: '200px', height: '200px', background: '#34d399', top: '50%', left: '5%', animationDelay: '4s' }}></div>

      {/* Grid lines overlay */}
      <div className="grid-lines"></div>

      {/* Floating particles */}
      <div className="particle" style={{ top: '20%', left: '15%', animationDelay: '0s' }}></div>
      <div className="particle" style={{ top: '60%', left: '85%', animationDelay: '2s' }}></div>
      <div className="particle" style={{ top: '40%', left: '70%', animationDelay: '4s' }}></div>
      <div className="particle" style={{ top: '80%', left: '25%', animationDelay: '6s' }}></div>
      <div className="particle" style={{ top: '30%', left: '90%', animationDelay: '8s' }}></div>
      <div className="particle" style={{ top: '15%', left: '50%', animationDelay: '1s' }}></div>
      <div className="particle" style={{ top: '70%', left: '40%', animationDelay: '3s' }}></div>

      {/* Hero Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="tag mb-6 mx-auto w-fit">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          Unlock Your True Earnings
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          What Do You <span className="gradient-text">Really</span> Earn?
        </h1>

        <p className="text-neutral-400 text-lg max-w-2xl mx-auto mb-10">
          Your payslip shows one number. Reality is different. Factor in UK taxes, commute time, and hidden costs to discover your true hourly wage.
        </p>

        <div className="flex items-center justify-center gap-4 relative z-50">
          <button
            type="button"
            onClick={scrollToCalculator}
            className="btn-primary px-6 py-3 inline-flex items-center gap-2 relative z-50 cursor-pointer"
          >
            Calculate Now
            <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={scrollToMethodology}
            className="btn-secondary px-6 py-3 relative z-50 cursor-pointer"
          >
            Learn More
          </button>
        </div>

        {/* Scan lines effect */}
        <div className="scan-lines">
          {[0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 0.3, 0.5, 0.7].map((delay, i) => (
            <div key={i} className="scan-line" style={{ animationDelay: `${delay}s` }}></div>
          ))}
        </div>

        {/* Floating labels */}
        <div className="floating-label hidden md:block" style={{ top: '25%', left: '8%' }}>
          <span className="text-[#10b981]">•</span> Income Tax
        </div>
        <div className="floating-label hidden md:block" style={{ top: '45%', right: '5%' }}>
          <span className="text-[#10b981]">•</span> National Insurance
        </div>
        <div className="floating-label hidden md:block" style={{ bottom: '30%', left: '5%' }}>
          <span className="text-[#10b981]">•</span> Commute Time
        </div>
      </div>
    </>
  );
}
