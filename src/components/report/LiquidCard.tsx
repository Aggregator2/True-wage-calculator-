'use client';

import type { ReactNode } from 'react';

interface LiquidCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  hover?: boolean;
}

export function LiquidCard({ children, className = '', glowColor, hover = false }: LiquidCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-[#0A1628]/80 backdrop-blur-xl
        border border-white/[0.08]
        ${hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 hover:border-white/[0.12]' : ''}
        ${className}
      `}
      style={glowColor ? {
        boxShadow: `0 0 60px ${glowColor}15, inset 0 1px 0 rgba(255,255,255,0.05)`
      } : {
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* Glass reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-6 pt-6 pb-2 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-6 pb-6 ${className}`}>
      {children}
    </div>
  );
}

export function LiquidButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  disabled?: boolean;
}) {
  const variants = {
    primary: 'bg-[#10B981] text-[#0A1628] font-semibold hover:shadow-lg hover:shadow-[#10B981]/30',
    secondary: 'bg-white/[0.08] text-white border border-white/[0.12] hover:bg-white/[0.12]',
    ghost: 'text-white/70 hover:text-white hover:bg-white/[0.06]',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-xl px-5 py-2.5 text-sm
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
