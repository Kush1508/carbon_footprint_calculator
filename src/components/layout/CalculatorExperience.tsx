'use client';

import React, { useState } from 'react';
import App from '@/App';
import { QuickHouseholdCalculator } from '../sections/QuickHouseholdCalculator';
import { CarbonCreditingSuite } from '../sections/CarbonCreditingSuite';
import { VerraNavbar } from './VerraNavbar';
import { VerraHeroVideo } from '../sections/VerraHeroVideo';
import { Zap, ShieldCheck, Home, Wheat, Building2 } from 'lucide-react';
import { Archetype } from '../../types';

export type ExperienceMode = 'quick' | 'audit';

export function CalculatorExperience() {
  const [mode, setMode] = useState<ExperienceMode>('quick');
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>('household');

  const handleSelectMode = (newMode: ExperienceMode) => {
    setMode(newMode);
  };

  const handleSelectArchetype = (arc: Archetype) => {
    setSelectedArchetype(arc);
    setMode('audit');
  };

  return (
    <div className="w-full bg-white text-zinc-900 selection:bg-[#057299] selection:text-white">
      {/* 1. Exact Verra Replicated Navbar (Utility Nav + Main Menu) */}
      <VerraNavbar
        currentMode={mode}
        onSelectMode={handleSelectMode}
        onSelectArchetype={handleSelectArchetype}
      />

      {/* 2. Verra Inspired Hero Section with Background Video hero.mp4 */}
      <VerraHeroVideo
        onSelectMode={handleSelectMode}
        onSelectArchetype={handleSelectArchetype}
      />

      {/* 3. Calculator Experience Section (Anchor for smooth scroll) */}
      <section id="calculator-section" className="w-full border-t border-zinc-200 bg-zinc-50/50 py-8 sm:py-12 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* Sub-Header & Two-Tier Mode Control Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200/90 shadow-xs mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0E2B64] text-white flex items-center justify-center font-bold text-xs tracking-tight shrink-0 shadow-sm">
                CF
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-950">
                    {mode === 'quick' ? 'Personal Carbon Footprint Calculator' : 'Institutional Audit & Registry Issuance Suite'}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    {mode === 'quick' ? '60s Estimate' : 'Audit-Grade'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-medium">
                  {mode === 'quick'
                    ? '4 zero-jargon sliders with instant certified carbon credit offset calculations.'
                    : 'Statutory accounting for House (Domestic), Farmers (IPCC AFOLU Tier 1), and Industry (Corporate Scopes 1-3).'}
                </p>
              </div>
            </div>

            {/* Two-Pill Segmented Mode Switcher */}
            <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200 shadow-inner w-full md:w-auto">
              {/* Tab 1: Personal Use */}
              <button
                type="button"
                onClick={() => setMode('quick')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  mode === 'quick'
                    ? 'bg-white text-emerald-950 shadow-sm border border-zinc-200/90 font-extrabold'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
                }`}
              >
                <Zap className={`w-4 h-4 ${mode === 'quick' ? 'text-amber-500 fill-amber-500' : 'text-zinc-500'}`} />
                <span className="whitespace-nowrap">Personal Use</span>
              </button>

              {/* Tab 2: Serious Users & Professionals */}
              <button
                type="button"
                onClick={() => setMode('audit')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  mode === 'audit'
                    ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/90 font-extrabold'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${mode === 'audit' ? 'text-emerald-700' : 'text-zinc-500'}`} />
                <span className="whitespace-nowrap">Serious Users &amp; Professionals</span>
              </button>
            </div>
          </div>

          {/* Mode View Rendering */}
          {mode === 'quick' ? (
            <div className="w-full">
              <QuickHouseholdCalculator onSwitchToAudit={() => setMode('audit')} />
            </div>
          ) : (
            <div className="w-full space-y-8">
              {/* Detailed Full App (Corporate, Agriculture, Household with Persefoni Drawer) */}
              <App initialArchetype={selectedArchetype} />

              {/* Registry-Grade Carbon Credit Eligibility & Issuance Suite */}
              <CarbonCreditingSuite />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
