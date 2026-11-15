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
      {/* Persistent Global Brand Header & Segmented Mode Switcher */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-xs backdrop-blur-md bg-white/95 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Identity (Always visible in both modes) */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0F3A2E] flex items-center justify-center text-white shadow-sm font-mono font-bold text-xs sm:text-sm tracking-tighter shrink-0">
              CL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-950">
                  CLIMATE-LEDGER™
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 font-medium">
                Audit-Grade Carbon Footprint &amp; Registry Credit Calculator
              </p>
            </div>
          </div>

          {/* Two-Pill Side-by-Side Segmented Mode Switcher */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200 shadow-inner w-full md:w-auto">
            {/* Tab 1: Quick Household Estimate (Active by default) */}
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                mode === 'quick'
                  ? 'bg-white text-emerald-950 shadow-sm border border-zinc-200/90 font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${mode === 'quick' ? 'text-amber-500 fill-amber-500' : 'text-zinc-500'}`} />
              <span className="whitespace-nowrap">⚡ Quick Household Estimate (60s)</span>
            </button>

            {/* Tab 2: Registry-Grade Audit & Issuance */}
            <button
              type="button"
              onClick={() => setMode('audit')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                mode === 'audit'
                  ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/90 font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${mode === 'audit' ? 'text-emerald-700' : 'text-zinc-500'}`} />
              <span className="whitespace-nowrap">🏛️ Registry-Grade Audit &amp; Issuance (Corporate, Farmers &amp; BEE)</span>
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
