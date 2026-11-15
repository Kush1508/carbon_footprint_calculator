'use client';

import React, { useState } from 'react';
import App from '@/App';
import { QuickHouseholdCalculator } from '../sections/QuickHouseholdCalculator';
import { CarbonCreditingSuite } from '../sections/CarbonCreditingSuite';
import { Zap, ShieldCheck, Scale, ArrowRight, Sparkles } from 'lucide-react';

export type ExperienceMode = 'quick' | 'audit';

export function CalculatorExperience() {
  const [mode, setMode] = useState<ExperienceMode>('quick');

  return (
    <div className="w-full">
      {/* Top-Level Progressive Disclosure Mode Switcher */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight text-zinc-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              MODE:
            </span>
            <span className="text-xs text-zinc-500 hidden md:inline">
              Choose your assessment depth
            </span>
          </div>

          {/* Two-Pill Switcher */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/90 shadow-inner">
            {/* Pill 1: Quick Mode (Default) */}
            <button
              onClick={() => setMode('quick')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                mode === 'quick'
                  ? 'bg-white text-emerald-950 shadow-sm border border-zinc-200 font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <Zap className={`w-4 h-4 ${mode === 'quick' ? 'text-amber-500 fill-amber-500' : 'text-zinc-500'}`} />
              <span>⚡ Quick Footprint Estimate (60s)</span>
            </button>

            {/* Pill 2: Registry-Grade Audit */}
            <button
              onClick={() => setMode('audit')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                mode === 'audit'
                  ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200 font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${mode === 'audit' ? 'text-emerald-700' : 'text-zinc-500'}`} />
              <span>🏛️ Registry-Grade Audit &amp; Issuance</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
            {mode === 'quick' ? (
              <span>Consumer Zero-Jargon Mode</span>
            ) : (
              <span>ISO 14064 / GHG Protocol Verified</span>
            )}
          </div>
        </div>
      </div>

      {/* Mode View Rendering */}
      {mode === 'quick' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <QuickHouseholdCalculator onSwitchToAudit={() => setMode('audit')} />
        </div>
      ) : (
        <div>
          {/* Detailed Full App (Corporate, Agriculture, Household with Persefoni Drawer) */}
          <App />

          {/* Registry-Grade Carbon Credit Eligibility & Issuance Suite */}
          <CarbonCreditingSuite />
        </div>
      )}
    </div>
  );
}
