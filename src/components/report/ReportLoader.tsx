'use client';

import { useEffect, useState, useRef } from 'react';

interface LoaderProps {
  size?: number;
  text?: string;
  /** When true, renders inline instead of as a fullscreen fixed overlay */
  inline?: boolean;
}

const STAGES = ['Analyzing', 'Crunching Numbers', 'Building Report', 'Generating Insights'];

export default function ReportLoader({ size = 180, text, inline = false }: LoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [displayText, setDisplayText] = useState(text || STAGES[0]);
  const [textVisible, setTextVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const prevTextRef = useRef(text || STAGES[0]);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Cycle through stages if no text prop
  useEffect(() => {
    if (text) return;
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [text]);

  // Smooth text transitions — fade out, swap, fade in
  useEffect(() => {
    const newText = text || STAGES[stageIndex];
    if (newText === prevTextRef.current) return;

    // Fade out
    setTextVisible(false);

    const timer = setTimeout(() => {
      setDisplayText(newText);
      prevTextRef.current = newText;
      // Fade in
      setTextVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [text, stageIndex]);

  const orbSize = Math.round(size * 0.75);

  return (
    <div
      className={`
        ${inline
          ? 'flex flex-col items-center justify-center gap-8'
          : 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a3379] via-[#0f172a] to-black'
        }
        transition-opacity duration-700 ease-out
        ${mounted ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Orb container — the spinning circle with breathing glow */}
      <div className="relative flex items-center justify-center">
        {/* Breathing glow behind the orb */}
        <div
          className="absolute rounded-full"
          style={{
            width: orbSize + 60,
            height: orbSize + 60,
            background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(0,93,255,0.06) 50%, transparent 70%)',
            animation: 'orbGlow 4s ease-in-out infinite',
          }}
        />

        {/* The spinning orb */}
        <div
          className="relative rounded-full"
          style={{
            width: orbSize,
            height: orbSize,
            animation: 'loaderCircle 5s linear infinite',
          }}
        />
      </div>

      {/* Stage text — below the orb, fades smoothly between stages */}
      <div
        className="text-center transition-all duration-300 ease-in-out"
        style={{
          opacity: textVisible ? 1 : 0,
          transform: textVisible ? 'translateY(0)' : 'translateY(6px)',
        }}
      >
        <p className="text-white/80 text-base font-medium tracking-wide">
          {displayText}
        </p>
      </div>

      <style>{`
        @keyframes loaderCircle {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 6px 12px 0 #38bdf8 inset,
              0 12px 18px 0 #005dff inset,
              0 36px 36px 0 #1e40af inset,
              0 0 3px 1.2px rgba(56,189,248,0.3),
              0 0 6px 1.8px rgba(0,93,255,0.2);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 6px 12px 0 #60a5fa inset,
              0 12px 6px 0 #0284c7 inset,
              0 24px 36px 0 #005dff inset,
              0 0 3px 1.2px rgba(56,189,248,0.3),
              0 0 6px 1.8px rgba(0,93,255,0.2);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 6px 12px 0 #4dc8fd inset,
              0 12px 18px 0 #005dff inset,
              0 36px 36px 0 #1e40af inset,
              0 0 3px 1.2px rgba(56,189,248,0.3),
              0 0 6px 1.8px rgba(0,93,255,0.2);
          }
        }
        @keyframes orbGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
