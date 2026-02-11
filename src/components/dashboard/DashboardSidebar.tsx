'use client';

import Link from 'next/link';
import { useCalculatorStore, useIsPremium } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  Plus,
  FolderOpen,
  TrendingUp,
  Wrench,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { view: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
  { view: 'new', icon: Plus, label: 'New Scenario', isLink: true, href: '/calculator' },
  { view: 'scenarios', icon: FolderOpen, label: 'My Scenarios' },
  { view: 'fire', icon: TrendingUp, label: 'FIRE Tracker' },
  { view: 'tools', icon: Wrench, label: 'Tools' },
];

export default function DashboardSidebar({ collapsed, onToggle, activeView, onViewChange }: DashboardSidebarProps) {
  const { user, subscriptionStatus } = useCalculatorStore();
  const isPremium = useIsPremium();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-white/[0.04] z-30 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/[0.04] justify-between">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 font-bold text-sm">TW</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-white text-base tracking-tight whitespace-nowrap">
              TrueWage
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="hidden lg:flex w-6 h-6 items-center justify-center rounded text-zinc-500 hover:text-white transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.isLink && item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-zinc-400 hover:text-white hover:bg-white/[0.04] ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          const isActive = activeView === item.view;
          return (
            <button
              key={item.label}
              onClick={() => onViewChange(item.view)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all w-full text-left ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/[0.04] p-3 space-y-2">
        <button
          onClick={() => onViewChange('settings')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full text-left ${
            activeView === 'settings' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-all w-full ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Log Out' : undefined}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>

        {/* User info */}
        {user && !collapsed && (
          <div className="px-3 py-2 mt-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300 flex-shrink-0">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white truncate">{user.email}</p>
                <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${
                  isPremium
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {subscriptionStatus === 'lifetime' ? 'Lifetime' : isPremium ? 'Premium' : 'Free'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
