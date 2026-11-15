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
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Persistent Global Brand Header & Segmented Mode Switcher */}
      <header className="w-full max-w-full overflow-x-hidden bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-xs backdrop-blur-md bg-white/95 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0F3A2E] flex items-center justify-center text-white shadow-sm font-mono font-bold text-xs sm:text-sm tracking-tighter shrink-0">
              CL
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-950">
                  CLIMATE-LEDGER™
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 font-medium truncate sm:whitespace-normal">
                Audit-Grade Carbon Footprint &amp; Registry Credit Calculator
              </p>
            </div>
          </div>

          {/* Two-Pill Mode Switcher (Grid on mobile, flex on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shadow-inner w-full md:w-auto">
            {/* Tab 1: Quick / Exact Household */}
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center ${
                mode === 'quick'
                  ? 'bg-white text-emerald-950 shadow-sm border border-zinc-200/90 font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${mode === 'quick' ? 'text-amber-500 fill-amber-500' : 'text-zinc-500'}`} />
              <span>⚡ Personal Lifecycle (KTH Spec)</span>
            </button>

            {/* Tab 2: Registry Audit & Issuance */}
            <button
              type="button"
              onClick={() => setMode('audit')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center ${
                mode === 'audit'
                  ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/90 font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${mode === 'audit' ? 'text-emerald-700' : 'text-zinc-500'}`} />
              <span>🏛️ Registry Audit &amp; Issuance</span>
            </button>
          </div>
        </div>
      </header>

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
