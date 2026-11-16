'use client';

import React, { useState } from 'react';
import App from '@/App';
import { QuickHouseholdCalculator } from '../sections/QuickHouseholdCalculator';
import { CarbonCreditingSuite } from '../sections/CarbonCreditingSuite';
import { ConsultantResearchWorkbench } from '../sections/ConsultantResearchWorkbench';
import { Zap, ShieldCheck, Microscope, FileText, Building2, BarChart3 } from 'lucide-react';

export type ExperienceMode = 'awareness' | 'precision' | 'workbench';

export function CalculatorExperience() {
  const [mode, setMode] = useState<ExperienceMode>('awareness');
  const [workbenchView, setWorkbenchView] = useState<'corporate_registry' | 'batch_montecarlo'>('corporate_registry');

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Persistent Global Brand Header & Segmented Mode Switcher */}
      <header className="w-full max-w-full overflow-x-hidden bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-xs backdrop-blur-md bg-white/95 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Brand Identity + Jump Link */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0F3A2E] flex items-center justify-center text-white shadow-sm font-mono font-bold text-xs sm:text-sm tracking-tighter shrink-0">
                CL
              </div>
              <div className="min-w-0">
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

            {/* Top Header Jump Link */}
            <a
              href="#methodology-section"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-emerald-800 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-2.5 py-1.5 rounded-lg transition shrink-0"
              title="Jump to Accounting Methodology and OpenAPI Documentation"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Methodology &amp; API</span>
              <span className="sm:hidden">Docs</span>
            </a>
          </div>

          {/* Three-Pill Mode Switcher (Wrapped with flex flex-wrap gap-2 w-full so it never overflows) */}
          <nav
            aria-label="Calculator Modes"
            className="flex flex-wrap gap-2 w-full lg:w-auto p-1 bg-zinc-100 rounded-xl border border-zinc-200 shadow-inner"
          >
            {/* Pill 1: Quick Awareness Estimate */}
            <button
              type="button"
              onClick={() => setMode('awareness')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center whitespace-nowrap ${
                mode === 'awareness'
                  ? 'bg-white text-emerald-950 shadow-sm border border-zinc-200/90 font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${mode === 'awareness' ? 'text-amber-500 fill-amber-500' : 'text-zinc-500'}`} />
              <span>Quick Awareness Estimate</span>
            </button>

            {/* Pill 2: Precision Lifecycle & Audit */}
            <button
              type="button"
              onClick={() => setMode('precision')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center whitespace-nowrap ${
                mode === 'precision'
                  ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/90 font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${mode === 'precision' ? 'text-emerald-700' : 'text-zinc-500'}`} />
              <span>Precision Lifecycle &amp; Audit</span>
            </button>

            {/* Pill 3: Registry & Consultant Workbench */}
            <button
              type="button"
              onClick={() => setMode('workbench')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center whitespace-nowrap ${
                mode === 'workbench'
                  ? 'bg-white text-purple-950 shadow-sm border border-zinc-200/90 font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <Microscope className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${mode === 'workbench' ? 'text-purple-700' : 'text-zinc-500'}`} />
              <span>Registry &amp; Consultant Workbench</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Mode View Rendering */}
      {mode === 'awareness' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <QuickHouseholdCalculator key="awareness" mode="awareness" onSwitchToAudit={() => setMode('precision')} />
        </div>
      ) : mode === 'precision' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <QuickHouseholdCalculator key="precision" mode="precision" onSwitchToAudit={() => setMode('workbench')} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sub-navigation for Workbench */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
            <div className="inline-flex flex-wrap p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setWorkbenchView('corporate_registry')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  workbenchView === 'corporate_registry'
                    ? 'bg-white text-zinc-950 shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Corporate Scope 1–3 &amp; Registry Crediting</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkbenchView('batch_montecarlo')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  workbenchView === 'batch_montecarlo'
                    ? 'bg-white text-purple-950 shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-700" />
                <span>Batch CSV &amp; Monte Carlo Uncertainty</span>
              </button>
            </div>
          </div>

          {workbenchView === 'corporate_registry' ? (
            <div>
              <App />
              <CarbonCreditingSuite />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-4">
              <ConsultantResearchWorkbench />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
