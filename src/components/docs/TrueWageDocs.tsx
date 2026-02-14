'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const SECTIONS = [
  { id: 'manifesto', label: 'The Philosophy' },
  { id: 'why', label: 'Why This Exists' },
  { id: 'examples', label: 'Real Examples' },
  { id: 'calculators', label: 'The Calculators' },
  { id: 'methodology', label: "How It's Calculated" },
  { id: 'controversial', label: 'Controversial Takes' },
  { id: 'data', label: 'The Data' },
  { id: 'faq', label: 'Methodology FAQ' },
];

const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const handler = () => {
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive(ids[i]);
          return;
        }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, [ids]);
  return active;
}

const AnimatedNumber = ({
  target,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1800,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) => {
  const [value, setValue] = useState(0);
  const [ref, visible] = useInView(0.5);
  const started = useRef(false);
  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);
  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}
      {decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()}
      {suffix}
    </span>
  );
};

const FadeIn = ({
  children,
  delay = 0,
  y = 36,
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  style?: React.CSSProperties;
}) => {
  const [ref, visible] = useInView(0.08);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity 0.9s ${EASING} ${delay}s, transform 0.9s ${EASING} ${delay}s`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const ExpandableCard = ({
  title,
  preview,
  children,
  isControversial,
  icon,
}: {
  title: string;
  preview: string;
  children: React.ReactNode;
  isControversial?: boolean;
  icon: string;
}) => {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (bodyRef.current) setHeight(bodyRef.current.scrollHeight);
  }, [open, children]);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        background: isControversial
          ? `linear-gradient(135deg, rgba(220,38,38,${open ? 0.1 : 0.05}) 0%, rgba(15,23,42,0.95) 60%)`
          : 'rgba(30,41,59,0.5)',
        border: isControversial
          ? '1px solid rgba(220,38,38,0.2)'
          : '1px solid rgba(148,163,184,0.08)',
        borderRadius: 14,
        padding: '22px 26px',
        cursor: 'pointer',
        transition: `all 0.5s ${EASING}`,
        marginBottom: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isControversial && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            background: 'rgba(220,38,38,0.12)',
            color: '#ef4444',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.8,
            padding: '3px 10px',
            borderRadius: 4,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          CONTROVERSIAL
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: '#f1f5f9',
            margin: 0,
            fontFamily: "'Instrument Sans', 'DM Sans', sans-serif",
          }}
        >
          {title}
        </h3>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 18,
            color: '#475569',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: `transform 0.5s ${EASING}`,
            display: 'inline-block',
          }}
        >
          &#9662;
        </span>
      </div>
      <p
        style={{
          fontSize: 14,
          color: '#94a3b8',
          margin: 0,
          lineHeight: 1.65,
          fontFamily: "'DM Sans', sans-serif",
          paddingRight: 60,
        }}
      >
        {preview}
      </p>
      <div
        ref={bodyRef}
        style={{
          maxHeight: open ? height + 40 : 0,
          opacity: open ? 1 : 0,
          overflow: 'hidden',
          transition: `max-height 0.6s ${EASING}, opacity 0.5s ${EASING} ${open ? '0.1s' : '0s'}`,
          marginTop: open ? 18 : 0,
        }}
      >
        <div
          style={{
            borderTop: '1px solid rgba(148,163,184,0.08)',
            paddingTop: 18,
            color: '#cbd5e1',
            fontSize: 14.5,
            lineHeight: 1.8,
            fontFamily: "'DM Sans', sans-serif",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const FormulaBlock = ({
  label,
  formula,
  explanation,
}: {
  label: string;
  formula: string;
  explanation: string;
}) => (
  <div
    style={{
      background: 'rgba(10,15,26,0.7)',
      border: '1px solid rgba(220,38,38,0.15)',
      borderRadius: 10,
      padding: '18px 20px',
      marginBottom: 14,
      fontFamily: "'JetBrains Mono', monospace",
    }}
  >
    <div
      style={{
        fontSize: 10,
        color: '#ef4444',
        fontWeight: 700,
        letterSpacing: 2,
        marginBottom: 10,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 14,
        color: '#f8fafc',
        padding: '10px 14px',
        background: 'rgba(30,41,59,0.5)',
        borderRadius: 6,
        marginBottom: 12,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      {formula}
    </div>
    <div
      style={{
        fontSize: 13,
        color: '#94a3b8',
        lineHeight: 1.7,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {explanation}
    </div>
  </div>
);

const ScenarioCard = ({
  title,
  salary,
  trueRate,
  details,
  verdict,
  color,
}: {
  title: string;
  salary: number;
  trueRate: string;
  details: string[];
  verdict: string;
  color: string;
}) => (
  <div
    style={{
      background: 'rgba(30,41,59,0.4)',
      border: `1px solid ${color}22`,
      borderRadius: 14,
      padding: '24px 22px',
      flex: 1,
      minWidth: 260,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: color,
        opacity: 0.6,
      }}
    />
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        letterSpacing: 1.5,
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: 12,
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 6,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      Salary: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>&pound;{salary.toLocaleString()}</span>
    </div>
    {details.map((d, i) => (
      <div key={i} style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
        {d}
      </div>
    ))}
    <div
      style={{
        marginTop: 16,
        paddingTop: 14,
        borderTop: '1px solid rgba(148,163,184,0.08)',
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: '#64748b',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        TRUE RATE
      </span>
      <span
        style={{
          fontSize: 30,
          fontWeight: 800,
          color,
          fontFamily: "'Instrument Sans', 'Space Grotesk', sans-serif",
        }}
      >
        &pound;{trueRate}
      </span>
      <span style={{ fontSize: 13, color: '#475569' }}>/hr</span>
    </div>
    <div
      style={{
        marginTop: 10,
        fontSize: 13,
        color: '#94a3b8',
        lineHeight: 1.6,
        fontStyle: 'italic',
      }}
    >
      {verdict}
    </div>
  </div>
);

const InteractiveComparison = () => {
  const [salary, setSalary] = useState(35000);
  const [commuteMins, setCommuteMins] = useState(60);
  const [lunchMins, setLunchMins] = useState(60);
  const contractHours = 37.5;
  const weeksWorked = 46.8;
  const grossHourly = salary / (contractHours * weeksWorked);
  let totalTax = 0;
  const bands = [
    { l: 12570, r: 0 },
    { l: 50270, r: 0.2 },
    { l: 125140, r: 0.4 },
    { l: Infinity, r: 0.45 },
  ];
  let prev = 0;
  for (const b of bands) {
    const t = Math.min(salary, b.l) - prev;
    if (t > 0) totalTax += t * b.r;
    prev = b.l;
  }
  const ni =
    Math.max(0, (Math.min(salary, 50270) - 12570) * 0.08) +
    Math.max(0, (salary - 50270) * 0.02);
  const takeHome = salary - totalTax - ni;
  const commuteHW = (commuteMins / 60) * 5;
  const lunchHW = (lunchMins / 60) * 5;
  const realHW = contractHours + commuteHW + lunchHW;
  const realHY = realHW * weeksWorked;
  const trueHourly = takeHome / realHY;
  const pctDrop = ((1 - trueHourly / grossHourly) * 100).toFixed(0);

  const Slider = ({
    label,
    value,
    onChange,
    min,
    max,
    step,
    format,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    format: (v: number) => string;
  }) => (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <label
          style={{
            fontSize: 12,
            color: '#94a3b8',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontSize: 14,
            color: '#f1f5f9',
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: '#ef4444',
          height: 4,
          borderRadius: 2,
          cursor: 'pointer',
        }}
      />
    </div>
  );

  return (
    <div
      style={{
        background:
          'linear-gradient(160deg, rgba(10,15,26,0.95) 0%, rgba(30,41,59,0.6) 100%)',
        border: '1px solid rgba(220,38,38,0.15)',
        borderRadius: 18,
        padding: '32px 30px',
        margin: '32px 0',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#ef4444',
          letterSpacing: 2,
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#ef4444',
            animation: 'docsPulse 2s infinite',
          }}
        />
        LIVE CALCULATOR
      </div>
      <div
        className="docs-slider-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginBottom: 32,
        }}
      >
        <Slider
          label="Annual Salary"
          value={salary}
          onChange={setSalary}
          min={18000}
          max={150000}
          step={1000}
          format={(v) => `\u00A3${v.toLocaleString()}`}
        />
        <Slider
          label="Daily Commute (round trip)"
          value={commuteMins}
          onChange={setCommuteMins}
          min={0}
          max={180}
          step={10}
          format={(v) => `${v} mins`}
        />
        <Slider
          label="Daily Lunch Break"
          value={lunchMins}
          onChange={setLunchMins}
          min={0}
          max={90}
          step={15}
          format={(v) => `${v} mins`}
        />
      </div>
      <div
        className="docs-comparison-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 80px 1fr',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            background: 'rgba(148,163,184,0.06)',
            borderRadius: 14,
            padding: '22px 18px',
            textAlign: 'center',
            transition: `all 0.4s ${EASING}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: '#64748b',
              letterSpacing: 1.5,
              marginBottom: 10,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            WHAT YOUR PAYSLIP SAYS
          </div>
          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: '#64748b',
              fontFamily: "'Instrument Sans', 'Space Grotesk', sans-serif",
              transition: `all 0.3s ${EASING}`,
            }}
          >
            &pound;{grossHourly.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>/hour (gross)</div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
            <path
              d="M2 10H26M26 10L20 4M26 10L20 16"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              background: 'rgba(220,38,38,0.12)',
              color: '#ef4444',
              fontSize: 13,
              fontWeight: 800,
              padding: '5px 12px',
              borderRadius: 20,
              fontFamily: "'JetBrains Mono', monospace",
              transition: `all 0.3s ${EASING}`,
            }}
          >
            &minus;{pctDrop}%
          </div>
        </div>
        <div
          style={{
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 14,
            padding: '22px 18px',
            textAlign: 'center',
            transition: `all 0.4s ${EASING}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: '#ef4444',
              letterSpacing: 1.5,
              marginBottom: 10,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            YOUR TRUE WAGE
          </div>
          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: '#ef4444',
              fontFamily: "'Instrument Sans', 'Space Grotesk', sans-serif",
              transition: `all 0.3s ${EASING}`,
            }}
          >
            &pound;{trueHourly.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>/hour (real)</div>
        </div>
      </div>
      <div
        style={{
          marginTop: 22,
          padding: '14px 18px',
          background: 'rgba(220,38,38,0.04)',
          borderRadius: 10,
          fontSize: 13.5,
          color: '#94a3b8',
          lineHeight: 1.75,
          fontFamily: "'DM Sans', sans-serif",
          borderLeft: '3px solid rgba(220,38,38,0.4)',
          transition: `all 0.4s ${EASING}`,
        }}
      >
        Your job takes{' '}
        <strong style={{ color: '#f1f5f9' }}>{realHW.toFixed(1)} hours/week</strong> of your
        life &mdash; not the {contractHours} on your contract. That&apos;s{' '}
        <strong style={{ color: '#f1f5f9' }}>
          {(realHY - contractHours * weeksWorked).toFixed(0)} hidden hours/year
        </strong>
        . At your true rate, a &pound;30,000 car costs{' '}
        <strong style={{ color: '#ef4444' }}>{(30000 / trueHourly).toFixed(0)} hours</strong>{' '}
        of your life ({(30000 / trueHourly / realHW).toFixed(0)} full working weeks).
      </div>
    </div>
  );
};

const TimelineEvent = ({
  year,
  title,
  description,
  isNegative,
  delay = 0,
}: {
  year: string;
  title: string;
  description: string;
  isNegative: boolean;
  delay?: number;
}) => {
  const [ref, visible] = useInView(0.3);
  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        gap: 18,
        marginBottom: 22,
        position: 'relative',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-20px)',
        transition: `all 0.6s ${EASING} ${delay}s`,
      }}
    >
      <div
        style={{
          minWidth: 52,
          height: 52,
          borderRadius: '50%',
          background: isNegative ? 'rgba(220,38,38,0.1)' : 'rgba(34,197,94,0.1)',
          border: `2px solid ${isNegative ? 'rgba(220,38,38,0.4)' : 'rgba(34,197,94,0.4)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
          color: isNegative ? '#ef4444' : '#22c55e',
          fontFamily: "'JetBrains Mono', monospace",
          flexShrink: 0,
        }}
      >
        {year}
      </div>
      <div style={{ paddingTop: 4 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#f1f5f9',
            marginBottom: 3,
            fontFamily: "'Instrument Sans', sans-serif",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#94a3b8',
            lineHeight: 1.6,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};

const sectionTitle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 800,
  marginBottom: 28,
  fontFamily: "'Instrument Sans', sans-serif",
  letterSpacing: '-0.01em',
};
const bodyText: React.CSSProperties = {
  fontSize: 16,
  color: '#cbd5e1',
  lineHeight: 1.85,
  marginBottom: 24,
};
const calcCard: React.CSSProperties = {
  background: 'rgba(30,41,59,0.4)',
  border: '1px solid rgba(148,163,184,0.08)',
  borderRadius: 14,
  padding: '22px 22px 18px',
  height: '100%',
  transition: `all 0.4s ${EASING}`,
};
const calcIcon: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: 'rgba(220,38,38,0.06)',
  border: '1px solid rgba(220,38,38,0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  flexShrink: 0,
};
const calcTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#f1f5f9',
  margin: 0,
  fontFamily: "'Instrument Sans', 'DM Sans', sans-serif",
};
const calcBody: React.CSSProperties = {
  fontSize: 13.5,
  color: '#94a3b8',
  lineHeight: 1.75,
  marginBottom: 14,
  fontFamily: "'DM Sans', sans-serif",
};
const calcTags: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
};
const calcTag: React.CSSProperties = {
  background: 'rgba(220,38,38,0.06)',
  border: '1px solid rgba(220,38,38,0.12)',
  color: '#ef4444',
  fontSize: 10,
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: 4,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: 0.3,
};

export default function TrueWageDocs() {
  const sectionIds = SECTIONS.map((s) => s.id);
  const activeSection = useScrollSpy(sectionIds);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080c16',
        color: '#f1f5f9',
        fontFamily: "'DM Sans', sans-serif",
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        .docs-root * { box-sizing: border-box; }
        .docs-root ::-webkit-scrollbar { width: 5px; }
        .docs-root ::-webkit-scrollbar-track { background: #080c16; }
        .docs-root ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
        .docs-root ::-webkit-scrollbar-thumb:hover { background: #334155; }
        .docs-root ::selection { background: rgba(220,38,38,0.25); color: #fff; }
        .docs-root input[type="range"] { -webkit-appearance: none; appearance: none; background: rgba(148,163,184,0.1); border-radius: 2px; outline: none; touch-action: pan-y; }
        .docs-root input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #ef4444; cursor: pointer; border: 2px solid #080c16; box-shadow: 0 0 10px rgba(220,38,38,0.4); transition: transform 0.2s ease; }
        .docs-root input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); }
        @media (max-width: 640px) {
          .docs-slider-grid { grid-template-columns: 1fr !important; }
          .docs-comparison-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes docsPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      <div className="docs-root">
        {/* HERO */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '140px 24px 100px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -300,
              right: -200,
              width: 700,
              height: 700,
              background:
                'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -200,
              left: -100,
              width: 500,
              height: 500,
              background:
                'radial-gradient(circle, rgba(220,38,38,0.03) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              maxWidth: 780,
              margin: '0 auto',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <FadeIn>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 24,
                  background: 'rgba(220,38,38,0.08)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  padding: '6px 18px',
                  borderRadius: 24,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2.5,
                  color: '#ef4444',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#ef4444',
                  }}
                />
                DOCUMENTATION
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1
                style={{
                  fontSize: 'clamp(38px, 6vw, 62px)',
                  fontWeight: 800,
                  lineHeight: 1.06,
                  fontFamily: "'Instrument Sans', sans-serif",
                  marginBottom: 28,
                  letterSpacing: '-0.02em',
                }}
              >
                Your salary is a{' '}
                <span
                  style={{
                    background:
                      'linear-gradient(135deg, #ef4444 20%, #f97316 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  lie.
                </span>
                <br />
                <span
                  style={{
                    color: '#94a3b8',
                    fontSize: '0.65em',
                    fontWeight: 600,
                  }}
                >
                  Here&apos;s the maths that proves it.
                </span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p
                style={{
                  fontSize: 17.5,
                  color: '#94a3b8',
                  lineHeight: 1.75,
                  maxWidth: 600,
                  marginBottom: 48,
                }}
              >
                TrueWage exists because every financial decision you make is based on a
                number that&apos;s fundamentally wrong. This page explains exactly how we
                calculate your real hourly rate, why we include things other calculators
                ignore, and why the methodology will make conventional financial advice
                uncomfortable.
              </p>
            </FadeIn>
            <FadeIn delay={0.35}>
              <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                {[
                  {
                    val: 42,
                    suf: '%',
                    label: 'avg. drop from gross to true rate',
                    highlight: true,
                  },
                  { val: 780, suf: '', label: 'hidden hours/year uncounted' },
                  {
                    val: 35,
                    pre: '\u00A3',
                    suf: 'bn',
                    label: 'UK unpaid overtime annually (TUC)',
                  },
                ].map((s, i) => (
                  <div key={i}>
                    <div
                      style={{
                        fontSize: 44,
                        fontWeight: 800,
                        color: s.highlight ? '#ef4444' : '#f1f5f9',
                        fontFamily: "'Instrument Sans', sans-serif",
                        letterSpacing: '-0.02em',
                      }}
                    >
                      <AnimatedNumber
                        target={s.val}
                        prefix={s.pre || ''}
                        suffix={s.suf}
                      />
                    </div>
                    <div
                      style={{ fontSize: 13, color: '#475569', maxWidth: 160 }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>

        {/* STICKY NAV */}
        <div
          style={{
            position: 'sticky',
            top: 64,
            zIndex: 40,
            background: 'rgba(8,12,22,0.82)',
            backdropFilter: 'blur(20px) saturate(1.5)',
            borderBottom: '1px solid rgba(148,163,184,0.06)',
            padding: '10px 24px',
          }}
        >
          <div
            style={{
              maxWidth: 780,
              margin: '0 auto',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  const el = document.getElementById(s.id);
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 120;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                style={{
                  background:
                    activeSection === s.id
                      ? 'rgba(220,38,38,0.12)'
                      : 'transparent',
                  border:
                    activeSection === s.id
                      ? '1px solid rgba(220,38,38,0.25)'
                      : '1px solid transparent',
                  color: activeSection === s.id ? '#ef4444' : '#475569',
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: `all 0.35s ${EASING}`,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div
          style={{
            maxWidth: 780,
            margin: '0 auto',
            padding: '64px 24px 140px',
          }}
        >
          {/* PHILOSOPHY */}
          <section id="manifesto" style={{ marginBottom: 96 }}>
            <FadeIn>
              <h2 style={sectionTitle}>The Philosophy</h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div style={bodyText}>
                ONS data shows the average UK full-time worker does 36.4 contracted hours
                per week. But the same data shows the average commute is 56 minutes per
                day &mdash; nearly 5 hours a week that nobody counts when calculating their
                hourly rate.
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div style={bodyText}>
                Then there&apos;s unpaid lunch breaks, getting ready for work, checking
                emails at home. The TUC estimates UK employees put in &pound;35 billion
                worth of unpaid overtime annually. None of that makes it into
                anyone&apos;s &quot;hourly rate&quot; calculation.
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div style={bodyText}>
                And everyone calculates on gross salary when the average worker loses
                25&ndash;30% to income tax, National Insurance, and student loans before
                seeing a penny. Someone on &pound;35k thinking they earn &pound;18/hour is
                lying to themselves. Factor in actual take-home and total hours committed
                to work &mdash; it&apos;s closer to &pound;11&ndash;12. Every financial
                decision based on the wrong number leads to the wrong outcome.
              </div>
            </FadeIn>
            <FadeIn delay={0.25}>
              <div
                style={{
                  background: 'rgba(220,38,38,0.05)',
                  borderRadius: 14,
                  padding: '24px 28px',
                  border: '1px solid rgba(220,38,38,0.12)',
                  fontSize: 15.5,
                  color: '#e2e8f0',
                  lineHeight: 1.8,
                  fontWeight: 500,
                }}
              >
                TrueWage isn&apos;t a salary calculator with extra steps. It&apos;s a
                framework for understanding the real economics of your working life &mdash;
                built on the principle that everyone deserves to know the actual number,
                even when that number is uncomfortable.
              </div>
            </FadeIn>
          </section>

          {/* WHY THIS EXISTS */}
          <section id="why" style={{ marginBottom: 96 }}>
            <FadeIn>
              <h2 style={sectionTitle}>Why This Exists</h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '4px 1fr',
                }}
              >
                <div
                  style={{
                    background:
                      'linear-gradient(180deg, #ef4444 0%, rgba(220,38,38,0.1) 100%)',
                    borderRadius: 2,
                  }}
                />
                <div style={{ paddingLeft: 28 }}>
                  <div style={bodyText}>
                    The standard financial advice everyone receives is: &quot;look at your
                    salary, work out your take-home, budget from there.&quot; But that
                    calculation ignores the most important variable &mdash; how much of
                    your life does this job actually consume?
                  </div>
                  <div style={bodyText}>
                    Every existing salary calculator stops at gross-to-net. Nobody was
                    showing the full picture: the real hourly rate accounting for every
                    hour a job takes from someone&apos;s life, then translating that into
                    what purchases really cost in working hours, what the FIRE timeline
                    looks like, and whether career decisions make mathematical sense.
                  </div>
                  <div style={bodyText}>
                    The gap became obvious when comparing two real scenarios: a &pound;45k
                    office job with a 90-minute commute versus a &pound;40k remote role. On
                    paper, the office job pays more. In reality, the remote role pays{' '}
                    <em>significantly</em> more per hour of life committed. That insight
                    changes everything &mdash; from job decisions to purchasing behaviour to
                    retirement planning. TrueWage was built to make that insight available
                    to everyone, for free.
                  </div>
                </div>
              </div>
            </FadeIn>
          </section>

          {/* REAL EXAMPLES */}
          <section id="examples" style={{ marginBottom: 96 }}>
            <FadeIn>
              <h2 style={sectionTitle}>Real Examples</h2>
            </FadeIn>
            <FadeIn delay={0.05}>
              <p
                style={{
                  fontSize: 15,
                  color: '#64748b',
                  marginBottom: 36,
                  lineHeight: 1.7,
                }}
              >
                These scenarios show why the &quot;headline salary&quot; is misleading
                &mdash; and why this tool exists.
              </p>
            </FadeIn>
            {/* Scenario 1 */}
            <FadeIn delay={0.1}>
              <div
                style={{
                  marginBottom: 40,
                  background: 'rgba(15,23,42,0.5)',
                  border: '1px solid rgba(148,163,184,0.08)',
                  borderRadius: 18,
                  padding: '28px 24px',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ef4444',
                    letterSpacing: 2,
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 20,
                  }}
                >
                  SCENARIO 1: THE &pound;5K PAY CUT THAT&apos;S ACTUALLY A RAISE
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <ScenarioCard
                    title="OFFICE JOB"
                    salary={45000}
                    trueRate="11.47"
                    color="#64748b"
                    details={[
                      '90 min commute (round trip)',
                      '60 min forced lunch break',
                      '30 min getting ready',
                      '\u00A3150/month train pass',
                      '\u00A340/month work lunches',
                    ]}
                    verdict="51.5 hours/week consumed. The '\u00A345k' masks the reality."
                  />
                  <ScenarioCard
                    title="REMOTE JOB"
                    salary={40000}
                    trueRate="15.82"
                    color="#22c55e"
                    details={[
                      'Zero commute',
                      '15 min lunch at home',
                      'No dress code overhead',
                      '\u00A30 transport costs',
                      '\u00A31 home lunch',
                    ]}
                    verdict="\u00A35k 'less' but 38% higher true wage."
                  />
                </div>
              </div>
            </FadeIn>
            {/* Scenario 2: Car */}
            <FadeIn delay={0.15}>
              <div
                style={{
                  marginBottom: 40,
                  background: 'rgba(15,23,42,0.5)',
                  border: '1px solid rgba(148,163,184,0.08)',
                  borderRadius: 18,
                  padding: '28px 24px',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ef4444',
                    letterSpacing: 2,
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 16,
                  }}
                >
                  SCENARIO 2: THE REAL COST OF A CAR
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: '#cbd5e1',
                    lineHeight: 1.8,
                    marginBottom: 20,
                  }}
                >
                  The average new car in the UK costs around &pound;28,000. Most people
                  calculate affordability against their gross salary. Here&apos;s what it
                  looks like at different rates:
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16,
                  }}
                >
                  {[
                    {
                      label: 'Gross rate (\u00A318/hr)',
                      hours: '1,556',
                      weeks: '31',
                      color: '#64748b',
                      note: 'The fantasy',
                    },
                    {
                      label: 'Net rate (\u00A314/hr)',
                      hours: '2,000',
                      weeks: '40',
                      color: '#fbbf24',
                      note: 'Getting warmer',
                    },
                    {
                      label: 'True rate (\u00A311.50/hr)',
                      hours: '2,435',
                      weeks: '47',
                      color: '#ef4444',
                      note: 'The reality',
                    },
                  ].map((c) => (
                    <div
                      key={c.label}
                      style={{
                        background: 'rgba(30,41,59,0.4)',
                        borderRadius: 12,
                        padding: '18px 16px',
                        textAlign: 'center',
                        border: `1px solid ${c.color}18`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: '#64748b',
                          marginBottom: 10,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {c.label}
                      </div>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 800,
                          color: c.color,
                          fontFamily: "'Instrument Sans', sans-serif",
                        }}
                      >
                        {c.hours}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        hours of your life
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
                        ({c.weeks} working weeks)
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 11,
                          color: c.color,
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {c.note}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 18,
                    fontSize: 14,
                    color: '#94a3b8',
                    lineHeight: 1.7,
                    borderLeft: '3px solid rgba(220,38,38,0.3)',
                    paddingLeft: 16,
                  }}
                >
                  That &pound;28k car costs almost an entire year of real working hours.
                  And that&apos;s before insurance, fuel, maintenance, depreciation, and
                  road tax &mdash; all paid in post-tax pounds, adding more true working
                  hours on top.
                </div>
              </div>
            </FadeIn>
            {/* Scenario 3: Stress */}
            <FadeIn delay={0.2}>
              <div
                style={{
                  background: 'rgba(15,23,42,0.5)',
                  border: '1px solid rgba(148,163,184,0.08)',
                  borderRadius: 18,
                  padding: '28px 24px',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ef4444',
                    letterSpacing: 2,
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 16,
                  }}
                >
                  SCENARIO 3: THE STRESS MULTIPLIER
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: '#cbd5e1',
                    lineHeight: 1.8,
                    marginBottom: 20,
                  }}
                >
                  &quot;Stress can&apos;t be calculated&quot; is what people say when they
                  don&apos;t want to face the number. But stress has measurable financial
                  downstream effects:
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14,
                    marginBottom: 20,
                  }}
                >
                  {[
                    {
                      icon: '\uD83C\uDF55',
                      label: 'Stress takeaways',
                      avg: '\u00A3200/month',
                      note: '"Too tired to cook" 3x per week',
                    },
                    {
                      icon: '\uD83D\uDECD\uFE0F',
                      label: 'Retail therapy',
                      avg: '\u00A3150/month',
                      note: '"I deserve this" purchases',
                    },
                    {
                      icon: '\u2708\uFE0F',
                      label: 'Escape holidays',
                      avg: '\u00A3300/month',
                      note: "Luxury trips to 'recharge'",
                    },
                    {
                      icon: '\uD83C\uDF77',
                      label: 'Decompression',
                      avg: '\u00A3100/month',
                      note: 'Post-work drinks, wine, treats',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        background: 'rgba(30,41,59,0.4)',
                        borderRadius: 10,
                        padding: '16px 18px',
                        border: '1px solid rgba(148,163,184,0.06)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{item.icon}</span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#f1f5f9',
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: '#ef4444',
                          fontFamily: "'Instrument Sans', sans-serif",
                        }}
                      >
                        {item.avg}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#64748b',
                          marginTop: 4,
                        }}
                      >
                        {item.note}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    background: 'rgba(220,38,38,0.05)',
                    borderRadius: 10,
                    padding: '18px 22px',
                    border: '1px solid rgba(220,38,38,0.12)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      color: '#e2e8f0',
                      lineHeight: 1.8,
                    }}
                  >
                    That&apos;s roughly <strong>&pound;750/month</strong> &mdash;{' '}
                    <strong>&pound;9,000/year</strong> &mdash; in spending that exists
                    primarily because of job-related stress. At a true hourly rate of
                    &pound;11.50, that&apos;s{' '}
                    <strong style={{ color: '#ef4444' }}>782 hours of work</strong> spent
                    recovering from work. The Stress &amp; Burnout calculator quantifies
                    this by asking about specific spending patterns and showing the compound
                    opportunity cost when invested instead. Stress isn&apos;t immeasurable
                    &mdash; its financial effects are precisely measurable.
                  </div>
                </div>
              </div>
            </FadeIn>
          </section>

          {/* THE CALCULATOR SUITE */}
          <section id="calculators" style={{ marginBottom: 96 }}>
            <FadeIn>
              <h2 style={sectionTitle}>The Calculator Suite</h2>
            </FadeIn>
            <FadeIn delay={0.05}>
              <p
                style={{
                  fontSize: 15,
                  color: '#64748b',
                  marginBottom: 16,
                  lineHeight: 1.7,
                }}
              >
                TrueWage isn&apos;t one calculator &mdash; it&apos;s an interconnected
                suite of 13 UK-specific financial tools, each attacking a different blind
                spot in how people understand their money. All use 2025/26 HMRC rates, all
                are free at the core level.
              </p>
            </FadeIn>
            <FadeIn delay={0.08}>
              <p
                style={{
                  fontSize: 15,
                  color: '#64748b',
                  marginBottom: 40,
                  lineHeight: 1.7,
                }}
              >
                The True Hourly Wage calculator is the foundation &mdash; but every tool
                below feeds into the same question: what is the{' '}
                <em style={{ color: '#94a3b8' }}>real</em> cost of your working life?
              </p>
            </FadeIn>
            {/* Core Calculator */}
            <FadeIn delay={0.1}>
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(15,23,42,0.95) 70%)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 18,
                  padding: '28px 26px',
                  marginBottom: 24,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 16,
                    background: 'rgba(220,38,38,0.15)',
                    color: '#ef4444',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.8,
                    padding: '3px 10px',
                    borderRadius: 4,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  CORE
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(220,38,38,0.1)',
                      border: '1px solid rgba(220,38,38,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                    }}
                  >
                    &#x1F4B7;
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: 19,
                        fontWeight: 800,
                        color: '#f1f5f9',
                        margin: 0,
                        fontFamily: "'Instrument Sans', sans-serif",
                      }}
                    >
                      True Hourly Wage Calculator
                    </h3>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#ef4444',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                      }}
                    >
                      THE FOUNDATION
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 14.5,
                    color: '#cbd5e1',
                    lineHeight: 1.8,
                  }}
                >
                  The calculator that started everything. Enter your gross salary and it
                  strips away income tax (all bands including the &pound;100k trap),
                  National Insurance, student loan repayments (all 5 UK plans), commute
                  costs, lunch break time, and prep time &mdash; then divides by the{' '}
                  <em>real</em> hours your job consumes. The result: your actual hourly
                  rate. For most people, it&apos;s 30&ndash;50% lower than they think. A
                  5-step guided flow that builds from salary to take-home to true hours to
                  true rate to purchase converter.
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                    marginTop: 18,
                  }}
                >
                  {[
                    { label: 'Tax Bands', val: '6', note: 'inc. Scottish' },
                    { label: 'Student Loans', val: '5', note: 'all UK plans' },
                    { label: 'Hidden Costs', val: '7+', note: 'tracked' },
                    { label: 'Avg. Drop', val: '42%', note: 'gross \u2192 true' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        background: 'rgba(10,15,26,0.5)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        textAlign: 'center',
                        border: '1px solid rgba(148,163,184,0.06)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: '#ef4444',
                          fontFamily: "'Instrument Sans', sans-serif",
                        }}
                      >
                        {s.val}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: '#64748b',
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: 0.5,
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            {/* Calculator Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              {[
                {
                  icon: '\uD83D\uDE97',
                  title: 'Commute Comparison',
                  body: 'Compares 7 commute methods head-to-head: Train, Tube, Bus, Driving, Cycling, E-bike, and Walking. Calculates the true cost of each \u2014 not just the ticket price, but the time value at your real hourly rate.',
                  tags: ['7 methods', 'time value', 'annual breakdown', 'hybrid mode'],
                  delay: 0.12,
                },
                {
                  icon: '\uD83C\uDF0D',
                  title: 'Geographic Arbitrage',
                  body: 'What if you kept your UK salary but lived somewhere cheaper? Compare 80+ cities across 6 continents with real cost-of-living data. Select from 14 industries and 100+ job roles.',
                  tags: ['80+ cities', '14 industries', 'visa info', 'lifestyle scores'],
                  delay: 0.14,
                },
                {
                  icon: '\uD83D\uDD25',
                  title: 'FIRE Progress Tracker',
                  body: 'Uses the UK-adjusted 2.5% safe withdrawal rate (not the American 4% fantasy) to calculate your real FIRE number, then projects when you\u2019ll hit it based on actual savings rate.',
                  tags: ['2.5% SWR', 'ISA bridge', 'compound projection', 'milestone tracking'],
                  delay: 0.16,
                },
                {
                  icon: '\uD83D\uDCCA',
                  title: 'Pension Matching Impact',
                  body: 'Models 6 preset UK pension schemes plus custom configurations with year-by-year projections. Side-by-side comparison of Workplace Pension vs SIPP vs Stakeholder vs Personal.',
                  tags: ['6 schemes', 'fee impact', 'SIPP comparison', 'year-by-year'],
                  delay: 0.18,
                },
                {
                  icon: '\uD83D\uDE99',
                  title: 'Car True Cost',
                  body: 'Pick from 6 car profiles and see the total cost of ownership. Tracks finance/PCP interest, fuel, insurance, road tax, MOT, servicing, parking, and depreciation.',
                  tags: ['6 profiles', 'cost per mile', 'PCP tracking', 'alternatives'],
                  delay: 0.2,
                },
                {
                  icon: '\uD83C\uDFE0',
                  title: 'WFH vs Office',
                  body: 'Select your work pattern (0\u20135 WFH days) and watch the numbers shift in real time. Models office costs against WFH costs. Tracks the HMRC \u00A36/week tax relief.',
                  tags: ['pattern selector', 'cost comparison', 'HMRC relief', 'commute presets'],
                  delay: 0.22,
                },
                {
                  icon: '\u26A1',
                  title: 'Stress & Burnout',
                  body: 'Scores work intensity across deadline pressure, meetings, multitasking, autonomy, and micromanagement. Outputs a burnout risk level and stress-adjusted hourly rate.',
                  tags: ['6 job presets', 'burnout risk', 'hidden costs', 'adjusted rate'],
                  delay: 0.24,
                },
                {
                  icon: '\uD83C\uDF93',
                  title: 'Student Loan Calculator',
                  body: 'Handles all five UK loan plans simultaneously. Models year-by-year balance projections, write-off dates, and the effective "tax rate" student loans create.',
                  tags: ['all 5 plans', 'simultaneous repay', 'write-off dates', 'overpay analysis'],
                  delay: 0.26,
                },
                {
                  icon: '\uD83E\uDD1D',
                  title: "Carer's Allowance",
                  body: 'Full eligibility checker with detailed explanations. Validates benefit status, checks overlapping benefits, and calculates the effective hourly rate of caring work.',
                  tags: ['eligibility check', 'benefit overlaps', 'NI credits', 'additional benefits'],
                  delay: 0.28,
                },
                {
                  icon: '\uD83D\uDCC8',
                  title: 'Opportunity Cost (S&P 500)',
                  body: 'Takes your annual work-related costs and projects what that money would be worth if invested in the S&P 500 over 5, 10, 20, and 30 years.',
                  tags: ['S&P 500 returns', 'compound growth', 'multi-horizon', 'work costs'],
                  delay: 0.3,
                },
                {
                  icon: '\uD83D\uDED2',
                  title: 'Purchase Converter',
                  body: 'Enter any purchase price and see how many hours of your life it costs at your true hourly rate. Inspired by "Your Money or Your Life."',
                  tags: ['any purchase', 'life-hours', 'daily \u2192 annual', 'true rate based'],
                  delay: 0.32,
                },
              ].map((calc) => (
                <FadeIn key={calc.title} delay={calc.delay}>
                  <div style={calcCard}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div style={calcIcon}>{calc.icon}</div>
                      <h3 style={calcTitleStyle}>{calc.title}</h3>
                    </div>
                    <div style={calcBody}>{calc.body}</div>
                    <div style={calcTags}>
                      {calc.tags.map((t) => (
                        <span key={t} style={calcTag}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
            {/* How they connect */}
            <FadeIn delay={0.35}>
              <div
                style={{
                  marginTop: 32,
                  background: 'rgba(220,38,38,0.04)',
                  border: '1px solid rgba(220,38,38,0.12)',
                  borderRadius: 14,
                  padding: '24px 28px',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ef4444',
                    letterSpacing: 2,
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 14,
                  }}
                >
                  HOW THEY CONNECT
                </div>
                <div
                  style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 1.85 }}
                >
                  These aren&apos;t isolated tools &mdash; they&apos;re an interconnected
                  system. The True Hourly Wage calculator feeds your real rate into the
                  Purchase Converter, the Opportunity Cost projections, and the FIRE
                  tracker. The Commute Comparison and WFH calculator show how changing your
                  work setup shifts your true rate. The Geo-Arbitrage calculator shows what
                  happens when you move that same salary to a cheaper city. The Stress
                  calculator reveals hidden costs that drag your effective rate even lower.
                  Each calculator you run sharpens the picture of your real financial
                  position &mdash; and the AI-generated report pulls all of them together
                  into a single comprehensive analysis of your working life.
                </div>
              </div>
            </FadeIn>
            {/* Premium tease */}
            <FadeIn delay={0.38}>
              <div
                style={{
                  marginTop: 18,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 14,
                }}
              >
                {[
                  {
                    tier: 'FREE',
                    color: '#64748b',
                    items: [
                      'Core True Wage calculator',
                      'All 13 calculators (1 scenario each)',
                      'Purchase converter',
                      'Basic results dashboard',
                    ],
                  },
                  {
                    tier: 'PREMIUM',
                    color: '#ef4444',
                    items: [
                      'Unlimited scenarios per calculator',
                      'AI-generated comprehensive report',
                      'PDF export of all results',
                      'Historical tracking over time',
                    ],
                  },
                  {
                    tier: 'COMING SOON',
                    color: '#fbbf24',
                    items: [
                      'Chrome extension \u2014 see true cost while shopping',
                      'Real-time product cost overlay on Amazon',
                      'Scenario sync across devices',
                      'Browser-integrated decision support',
                    ],
                  },
                ].map((t) => (
                  <div
                    key={t.tier}
                    style={{
                      background: 'rgba(30,41,59,0.4)',
                      borderRadius: 12,
                      padding: '18px 16px',
                      border: `1px solid ${t.color}18`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: t.color,
                        letterSpacing: 2,
                        fontFamily: "'JetBrains Mono', monospace",
                        marginBottom: 12,
                      }}
                    >
                      {t.tier}
                    </div>
                    {t.items.map((item) => (
                      <div
                        key={item}
                        style={{
                          fontSize: 13,
                          color: '#94a3b8',
                          lineHeight: 1.9,
                          display: 'flex',
                          gap: 8,
                        }}
                      >
                        <span style={{ color: t.color, flexShrink: 0 }}>
                          &#8250;
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </FadeIn>
          </section>

          {/* METHODOLOGY */}
          <section id="methodology" style={{ marginBottom: 96 }}>
            <FadeIn>
              <h2 style={sectionTitle}>How It&apos;s Calculated</h2>
            </FadeIn>
            <FadeIn delay={0.05}>
              <p
                style={{
                  fontSize: 15,
                  color: '#64748b',
                  marginBottom: 36,
                  lineHeight: 1.7,
                }}
              >
                Every formula uses 2025/26 HMRC rates. Click any card to expand the
                full methodology.
              </p>
            </FadeIn>
            <FadeIn delay={0.08}>
              <ExpandableCard
                icon="&#x1F4B0;"
                title="Step 1: Real Take-Home Pay"
                preview="Your gross salary is fiction. We strip it down to what actually hits your account."
              >
                <FormulaBlock
                  label="INCOME TAX (ENGLAND & WALES)"
                  formula="tax = (income &minus; 12,570) &times; 20% + (income &minus; 50,270) &times; 20% + (income &minus; 125,140) &times; 5%"
                  explanation="All 2025/26 bands including the \u00A3100k\u2013\u00A3125,140 Personal Allowance trap where effective marginal rate hits 60%. Scottish rates applied automatically when selected."
                />
                <FormulaBlock
                  label="NATIONAL INSURANCE"
                  formula="NI = (min(income, 50,270) &minus; 12,570) &times; 8% + max(0, income &minus; 50,270) &times; 2%"
                  explanation="Class 1 employee rates. The drop from 8% to 2% above \u00A350,270 is one of the few cliff-edges that benefits higher earners."
                />
                <FormulaBlock
                  label="STUDENT LOAN"
                  formula="Plan 2: (income &minus; 27,295) &times; 9% | Plan 5: (income &minus; 25,000) &times; 9%"
                  explanation="All five plans supported. Student loan repayment reduces liquid cash available for wealth-building."
                />
                <div
                  style={{
                    background: 'rgba(220,38,38,0.05)',
                    padding: 16,
                    borderRadius: 8,
                    borderLeft: '3px solid rgba(220,38,38,0.4)',
                    fontSize: 13.5,
                    color: '#94a3b8',
                    lineHeight: 1.7,
                  }}
                >
                  <strong style={{ color: '#ef4444' }}>
                    The &pound;100k Trap:
                  </strong>{' '}
                  Earn between &pound;100,000 and &pound;125,140 and you lose &pound;1 of
                  Personal Allowance for every &pound;2 earned. Effective marginal rate:
                  60%. The calculator visualises this cliff-edge.
                </div>
              </ExpandableCard>
            </FadeIn>
            <FadeIn delay={0.12}>
              <ExpandableCard
                icon="&#x23F1;"
                title="Step 2: Real Working Hours"
                preview="Your contract says 37.5 hours. Your life says otherwise."
                isControversial
              >
                <FormulaBlock
                  label="TRUE WEEKLY HOURS"
                  formula="realHours = contractHours + (commute &times; 5) + (lunchBreak &times; 5) + prepTime"
                  explanation="We count ALL time your job takes from your life, not just the time you're 'working.'"
                />
                {[
                  {
                    label: 'COMMUTE TIME',
                    why: "Pure overhead. Only exists because the job requires physical presence. ONS average: 56 mins/day. If the job didn't exist, neither would the commute.",
                    counter:
                      '"I listen to podcasts" \u2014 you could do that at home too, without the packed train.',
                  },
                  {
                    label: 'UNPAID LUNCH BREAKS',
                    why: "An office lunch break isn't 'your time.' You're geographically trapped in an area you didn't choose. Can't see family, run real errands, or eat when you're hungry. The break serves the employer's schedule.",
                    counter:
                      '"Everyone eats lunch" \u2014 at home, it\'s 15 minutes. At an office, it\'s 60 forced minutes. That 45-minute delta is 195 hours/year.',
                  },
                  {
                    label: 'GETTING READY / PREP TIME',
                    why: "The corporate grooming ritual serves the employer. Ironing, dress code, makeup \u2014 time spent performing 'employability.' Working remotely, output is identical without any of it.",
                    counter:
                      '"I\'d shower anyway" \u2014 you wouldn\'t iron a shirt or spend 30 minutes on appearance at 6am.',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: 'rgba(30,41,59,0.4)',
                      borderRadius: 10,
                      padding: '16px 20px',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#ef4444',
                        letterSpacing: 2,
                        marginBottom: 8,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: '#cbd5e1',
                        lineHeight: 1.75,
                        marginBottom: 10,
                      }}
                    >
                      {item.why}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#64748b',
                        fontStyle: 'italic',
                        borderLeft: '2px solid rgba(148,163,184,0.15)',
                        paddingLeft: 12,
                      }}
                    >
                      {item.counter}
                    </div>
                  </div>
                ))}
                <FormulaBlock
                  label="ANNUAL WORKING WEEKS"
                  formula="weeksWorked = 52 &minus; annualLeave (inc. bank holidays) &asymp; 46.4&ndash;47.2"
                  explanation="UK statutory minimum is 28 days (5.6 weeks). Many forget bank holidays are included in that figure for 5-day workers."
                />
              </ExpandableCard>
            </FadeIn>
            <FadeIn delay={0.15}>
              <ExpandableCard
                icon="&#x1F3AF;"
                title="Step 3: True Hourly Rate"
                preview="The single number that should inform every financial decision."
              >
                <FormulaBlock
                  label="THE CORE FORMULA"
                  formula="trueHourlyRate = (salary &minus; tax &minus; NI &minus; studentLoan &minus; commuteCosts &minus; workCosts) &divide; (realWeeklyHours &times; weeksWorked)"
                  explanation="Numerator: what actually hits your account. Denominator: the real hours your job consumes."
                />
                <div
                  style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8 }}
                >
                  Monetary work costs are also deducted: commuting expenses, work clothing,
                  professional subscriptions &mdash; anything that exists solely because of
                  the job. The result is the purest measure of what one hour of life is
                  worth when sold to an employer.
                </div>
              </ExpandableCard>
            </FadeIn>
            <FadeIn delay={0.18}>
              <ExpandableCard
                icon="&#x1F6D2;"
                title="Step 4: Purchase Converter"
                preview="Every purchase has a cost in hours of your life. Not the fake number \u2014 the real one."
              >
                <FormulaBlock
                  label="LIFE-HOURS COST"
                  formula="hoursOfLife = purchasePrice &divide; trueHourlyRate"
                  explanation="A \u00A3100 purchase at a \u00A312/hour true rate costs 8.3 hours of life \u2014 not 5.5 like the gross rate suggests."
                />
                <div
                  style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8 }}
                >
                  Inspired by Vicki Robin&apos;s &quot;Your Money or Your Life&quot;
                  &mdash; every pound spent is life energy exchanged. But most people
                  calculate this against their fantasy gross rate. The difference
                  permanently changes purchasing behaviour.
                </div>
              </ExpandableCard>
            </FadeIn>
            <FadeIn delay={0.2}>
              <ExpandableCard
                icon="&#x1F525;"
                title="Step 5: FIRE Projection"
                preview="When can you actually stop working? Not when your pension says."
              >
                <FormulaBlock
                  label="FIRE NUMBER"
                  formula="fireTarget = annualSpending &divide; safeWithdrawalRate (2.5% UK-adjusted)"
                  explanation="2.5% SWR instead of 4%. The 4% rule was calculated for US markets. UK investors face lower historical returns."
                />
                <div
                  style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8 }}
                >
                  The FIRE projection integrates true hourly rate, actual savings capacity
                  after real costs, and compound growth using historical S&amp;P 500
                  returns (10.4% nominal). It also models the ISA bridge strategy &mdash;
                  funding early retirement from ISAs until pension access at 57+.
                </div>
              </ExpandableCard>
            </FadeIn>
            <FadeIn delay={0.22}>
              <InteractiveComparison />
            </FadeIn>
          </section>

          {/* CONTROVERSIAL TAKES */}
          <section id="controversial" style={{ marginBottom: 96 }}>
            <FadeIn>
              <h2 style={sectionTitle}>Controversial Takes</h2>
            </FadeIn>
            <FadeIn delay={0.05}>
              <p
                style={{
                  fontSize: 15,
                  color: '#64748b',
                  marginBottom: 36,
                  lineHeight: 1.7,
                }}
              >
                These are the positions baked into how TrueWage works.
                Battle-tested across hundreds of debates.
              </p>
            </FadeIn>
            <FadeIn delay={0.08}>
              <ExpandableCard
                icon="&#x1F512;"
                isControversial
                title="Pensions Are Government-Controlled IOUs"
                preview="Deferred compensation under rules that change every few years. That's not 'wealth building' \u2014 it's a promise from politicians."
              >
                <div
                  style={{
                    fontSize: 14,
                    color: '#cbd5e1',
                    lineHeight: 1.8,
                    marginBottom: 16,
                  }}
                >
                  TrueWage doesn&apos;t include pension contributions in the true wage by
                  default because they aren&apos;t liquid compensation. They can&apos;t be
                  spent, invested freely, or accessed for decades. They&apos;re deferred
                  promises from a system modified repeatedly.
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#ef4444',
                      marginBottom: 16,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: 1.5,
                    }}
                  >
                    HOW THE RULES HAVE CHANGED
                  </div>
                  {[
                    {
                      y: '2006',
                      t: 'A-Day reforms',
                      d: 'Lifetime Allowance introduced at \u00A31.5M.',
                      n: false,
                    },
                    {
                      y: '2010',
                      t: 'LTA reduced',
                      d: 'Cut from \u00A31.8M to \u00A31.5M. First major goalpost shift.',
                      n: true,
                    },
                    {
                      y: '2012',
                      t: 'Auto-enrolment',
                      d: 'Government mandates pension participation. Opt-out, not opt-in.',
                      n: false,
                    },
                    {
                      y: '2014',
                      t: 'LTA slashed again',
                      d: '\u00A31.5M \u2192 \u00A31.25M. Then \u00A31M in 2016.',
                      n: true,
                    },
                    {
                      y: '2023',
                      t: "LTA 'abolished'",
                      d: 'Headline says abolished. Reality: tax-free lump sum capped at \u00A3268,275.',
                      n: true,
                    },
                    {
                      y: '2028',
                      t: 'Min access age rises',
                      d: '55 \u2192 57 confirmed. 58 already discussed.',
                      n: true,
                    },
                  ].map((e, i) => (
                    <TimelineEvent
                      key={i}
                      year={e.y}
                      title={e.t}
                      description={e.d}
                      isNegative={e.n}
                      delay={i * 0.05}
                    />
                  ))}
                </div>
                <div
                  style={{
                    background: 'rgba(220,38,38,0.04)',
                    padding: 16,
                    borderRadius: 10,
                    borderLeft: '3px solid rgba(220,38,38,0.3)',
                    fontSize: 13.5,
                    color: '#94a3b8',
                    lineHeight: 1.75,
                  }}
                >
                  <strong style={{ color: '#f1f5f9' }}>The position:</strong>{' '}
                  This isn&apos;t &quot;never use pensions.&quot; Defined benefit schemes
                  (NHS, teachers, civil service) are excellent. But for defined contribution
                  pensions, ISAs offer the same tax-free growth with zero government
                  interference and access at any age.
                </div>
              </ExpandableCard>
            </FadeIn>
            <FadeIn delay={0.12}>
              <ExpandableCard
                icon="&#x1F3E0;"
                isControversial
                title="Your Commute Is Unpaid Labour"
                preview="500+ hours a year for the average UK worker. Zero pounds paid."
              >
                <div
                  style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8 }}
                >
                  The average UK commuter spends 56 minutes per day travelling (ONS).
                  That&apos;s 4.7 hours per week an employer benefits from but doesn&apos;t
                  pay for. &quot;It&apos;s my choice&quot; &mdash; no. It&apos;s a
                  structural requirement that 2020 proved most knowledge workers don&apos;t
                  need.
                </div>
              </ExpandableCard>
            </FadeIn>
            <FadeIn delay={0.16}>
              <ExpandableCard
                icon="&#x1F37D;&#xFE0F;"
                isControversial
                title="Lunch Breaks Are Employer-Imposed Downtime"
                preview="60 minutes mandated. Geographically trapped. Can't see your family. But 'it doesn't count' apparently."
              >
                <div
                  style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8 }}
                >
                  An office lunch break is 60 minutes of forced downtime in a location you
                  didn&apos;t choose &mdash; can&apos;t see kids, run errands, or eat when
                  actually hungry. At home, it&apos;s 15 minutes. That 45-minute daily
                  delta is 195 hours per year of constrained time that only exists because
                  of where the job requires you to sit.
                </div>
              </ExpandableCard>
            </FadeIn>
            <FadeIn delay={0.2}>
              <ExpandableCard
                icon="&#x1F4CA;"
                isControversial
                title="The 4% Rule Doesn't Work in the UK"
                preview="Designed for American markets. For UK investors, it's dangerously optimistic."
              >
                <div
                  style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8 }}
                >
                  The &quot;4% rule&quot; comes from the Trinity Study using US data from
                  1926&ndash;1995. UK markets have historically returned less (FTSE 100:
                  ~5&ndash;7% nominal vs S&amp;P 500: 10%+). TrueWage uses 2.5% SWR. On
                  &pound;25k annual spending, that&apos;s a &pound;1,000,000 FIRE target
                  instead of &pound;625,000. Uncomfortable, but honest.
                </div>
              </ExpandableCard>
            </FadeIn>
            <FadeIn delay={0.24}>
              <ExpandableCard
                icon="&#x1F630;"
                isControversial
                title="Stress Has a Calculable Financial Cost"
                preview="'You can't put stress in a calculator.' You can \u2014 if you measure what it makes you spend."
              >
                <div
                  style={{
                    fontSize: 14,
                    color: '#cbd5e1',
                    lineHeight: 1.8,
                    marginBottom: 16,
                  }}
                >
                  The common objection: &quot;stress is subjective, you can&apos;t quantify
                  it.&quot; But stress has measurable downstream financial effects &mdash;
                  takeaways, retail therapy, escape holidays, post-work drinks. That
                  averages &pound;750/month or &pound;9,000/year, which is roughly 780
                  hours at the average true hourly rate.
                </div>
                <div
                  style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8 }}
                >
                  The Stress &amp; Burnout calculator doesn&apos;t ask &quot;how stressed
                  are you?&quot; It asks about spending patterns and shows the compound
                  opportunity cost if that money were invested. Stress itself isn&apos;t
                  measurable &mdash; but its cost to your wallet absolutely is.
                </div>
              </ExpandableCard>
            </FadeIn>
            <FadeIn delay={0.28}>
              <ExpandableCard
                icon="&#x1F3E1;"
                isControversial
                title="WFH Isn't a Perk \u2014 It's a Pay Rise"
                preview="The exact financial value of remote work. For London commuters, it's equivalent to thousands."
              >
                <div
                  style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8 }}
                >
                  Remote work eliminates wardrobe overhead, the morning routine, expensive
                  lunches, stress spending, and commute costs. For the average London
                  commuter, full remote equals a &pound;5,000&ndash;&pound;8,000 pre-tax
                  rise in monetary savings. Factor in reclaimed time value, and it&apos;s
                  closer to &pound;12,000&ndash;&pound;15,000 in true compensation. The WFH
                  Savings calculator quantifies exactly how much.
                </div>
              </ExpandableCard>
            </FadeIn>
          </section>

          {/* THE DATA */}
          <section id="data" style={{ marginBottom: 96 }}>
            <FadeIn>
              <h2 style={sectionTitle}>The Data</h2>
            </FadeIn>
            <FadeIn delay={0.05}>
              <p
                style={{
                  fontSize: 15,
                  color: '#64748b',
                  marginBottom: 36,
                  lineHeight: 1.7,
                }}
              >
                Every calculation is backed by official sources.
              </p>
            </FadeIn>
            {[
              {
                src: 'HMRC',
                detail:
                  '2025/26 Income Tax bands, NI rates, all 5 Student Loan thresholds',
                url: 'gov.uk/income-tax-rates',
              },
              {
                src: 'ONS',
                detail:
                  'Average UK commute: 56 mins/day. Average contracted hours: 36.4/week',
                url: 'ons.gov.uk',
              },
              {
                src: 'TUC',
                detail:
                  '\u00A335 billion in unpaid overtime by UK workers annually',
                url: 'tuc.org.uk',
              },
              {
                src: 'S&P Global',
                detail:
                  'S&P 500 20-year average return: 10.4% nominal',
                url: 'spglobal.com',
              },
              {
                src: 'Trinity Study',
                detail:
                  'Original 4% rule research \u2014 referenced to explain why 2.5% is used for UK',
                url: 'Published 1998',
              },
              {
                src: 'Citizens Advice',
                detail:
                  'UK households save avg. \u00A31,100/year optimising UK-specific expenses',
                url: 'citizensadvice.org.uk',
              },
            ].map((item, i) => (
              <FadeIn key={item.src} delay={0.08 + i * 0.03}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    marginBottom: 12,
                    padding: '14px 18px',
                    background: 'rgba(30,41,59,0.3)',
                    borderRadius: 10,
                    border: '1px solid rgba(148,163,184,0.06)',
                  }}
                >
                  <div
                    style={{
                      minWidth: 80,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#ef4444',
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: 0.5,
                      paddingTop: 2,
                    }}
                  >
                    {item.src}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        color: '#cbd5e1',
                        lineHeight: 1.6,
                      }}
                    >
                      {item.detail}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#334155',
                        marginTop: 3,
                      }}
                    >
                      {item.url}
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </section>

          {/* FAQ */}
          <section id="faq" style={{ marginBottom: 96 }}>
            <FadeIn>
              <h2 style={sectionTitle}>Methodology FAQ</h2>
            </FadeIn>
            {[
              {
                q: "Why don't you include pension contributions in the true wage?",
                a: "Pension contributions aren't liquid compensation. They can't be spent, invested freely, or accessed for decades. Including them inflates the 'true wage' with money that isn't controlled by the earner. An optional toggle exists for those who want it \u2014 but the default shows reality.",
              },
              {
                q: "Isn't counting lunch breaks unfair?",
                a: "At home, lunch is 15 minutes when you choose. At an office, it's 60 mandated minutes in a location you didn't pick. The 45-minute daily delta is 195 hours/year of geographically constrained time that only exists because of the job's structure.",
              },
              {
                q: "My commute lets me read. It's not 'lost' time.",
                a: "You could read at home too \u2014 without the packed train, the delays, or the 6am alarm. The question isn't whether commute time can be made productive. It's whether that time would exist without the job. It wouldn't.",
              },
              {
                q: 'Why 2.5% SWR instead of 4%?',
                a: "The 4% rule comes from US data. UK markets have historically returned less, GBP isn't the global reserve currency, and UK cost-of-living inflation runs higher. A realistic FIRE number that's too high is better than an optimistic one that fails.",
              },
              {
                q: "This doesn't account for work intensity. Isn't that a flaw?",
                a: "Yes. Someone doing 40 hours at a relaxed role gets better value than someone doing 40 hours in a high-pressure environment. But work intensity is subjective and impossible to quantify objectively. Time is measurable. So we measure time.",
              },
              {
                q: 'Can stress really be measured in a calculator?',
                a: "Stress itself can't. But its financial effects can. The calculator asks about spending patterns \u2014 takeaways, retail therapy, escape holidays \u2014 not feelings. These have exact pound values. It quantifies the downstream cost, not the emotion.",
              },
              {
                q: "Why no employer benefits like healthcare or gym?",
                a: "Benefits have value but aren't cash. A gym membership can't be invested. Dental coverage doesn't compound. TrueWage focuses on liquid compensation because that's what builds wealth.",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={0.05 + i * 0.03}>
                <ExpandableCard icon="?" title={item.q} preview="Click to expand">
                  <div
                    style={{
                      fontSize: 14,
                      color: '#cbd5e1',
                      lineHeight: 1.8,
                    }}
                  >
                    {item.a}
                  </div>
                </ExpandableCard>
              </FadeIn>
            ))}
          </section>

          {/* CTA */}
          <FadeIn>
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(15,23,42,0.95) 100%)',
                border: '1px solid rgba(220,38,38,0.18)',
                borderRadius: 22,
                padding: '56px 40px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -100,
                  right: -100,
                  width: 300,
                  height: 300,
                  background:
                    'radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <h2
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  marginBottom: 16,
                  fontFamily: "'Instrument Sans', sans-serif",
                  letterSpacing: '-0.01em',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Ready to see your real number?
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: '#94a3b8',
                  marginBottom: 32,
                  lineHeight: 1.7,
                  maxWidth: 480,
                  margin: '0 auto 32px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                The methodology above powers every calculation. No signup required.
                Free forever for the core calculator.
              </p>
              <Link
                href="/calculator"
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  padding: '16px 44px',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontFamily: "'Instrument Sans', sans-serif",
                  letterSpacing: 0.3,
                  boxShadow:
                    '0 4px 30px rgba(220,38,38,0.25), 0 0 0 1px rgba(220,38,38,0.3)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Calculate Your True Wage &rarr;
              </Link>
              <div
                style={{
                  marginTop: 16,
                  fontSize: 13,
                  color: '#334155',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Join 2,400+ UK workers who discovered their true hourly rate
              </div>
            </div>
          </FadeIn>

          <div
            style={{
              marginTop: 64,
              paddingTop: 32,
              borderTop: '1px solid rgba(148,163,184,0.06)',
              fontSize: 12,
              color: '#334155',
              lineHeight: 1.9,
              textAlign: 'center',
            }}
          >
            TrueWage is for illustrative purposes only and does not constitute
            financial advice. All tax rates are 2025/26 HMRC figures. Consult a
            qualified accountant for personal tax advice. The opinions on this page
            are positions backed by data, not gospel. Think for yourself &mdash;
            that&apos;s the point.
          </div>
        </div>
      </div>
    </div>
  );
}
