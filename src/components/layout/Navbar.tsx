import React from 'react';
import { Archetype, RegionalGridKey } from '../../types';
import { REGIONAL_GRID_PRESETS } from '../../engine/factors';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Globe,
  Home,
  Wheat,
  Building2,
  Download,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';

interface NavbarProps {
  currentArchetype: Archetype;
  onSelectArchetype: (arc: Archetype) => void;
  selectedGridKey: RegionalGridKey;
  onSelectGridKey: (key: RegionalGridKey) => void;
  onOpenExportModal: () => void;
  onOpenAuditSheet: () => void;
  totalEmissionsTons: number;
}

export function Navbar({
  currentArchetype,
  onSelectArchetype,
  selectedGridKey,
  onSelectGridKey,
  onOpenExportModal,
  onOpenAuditSheet,
  totalEmissionsTons,
}: NavbarProps) {
  const activeGrid = REGIONAL_GRID_PRESETS[selectedGridKey];

  return (
    <nav className="w-full h-14 border-b border-zinc-200/90 bg-zinc-50/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto h-full px-2.5 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Workspace Scope Label */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-[#0F3A2E] text-white">
              AUDIT SUITE
            </span>
            <div className="hidden sm:block">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-zinc-900">
                Institutional Workspace
              </span>
            </div>
          </div>
          <div className="hidden lg:flex items-center pl-2 border-l border-zinc-200">
            <Badge variant="methodology">
              <ShieldCheck className="w-3 h-3 text-emerald-700" /> ISO 14064 &amp; GHG Protocol
            </Badge>
          </div>
        </div>

        {/* Global Archetype Switcher Segmented Control */}
        <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80 shadow-inner">
          <button
            onClick={() => onSelectArchetype('household')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-medium transition-all ${
              currentArchetype === 'household'
                ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/60 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
            title="Household Emissions"
          >
            <Home className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span className="inline sm:hidden">House</span>
            <span className="hidden sm:inline">Household</span>
          </button>

          <button
            onClick={() => onSelectArchetype('agriculture')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-medium transition-all ${
              currentArchetype === 'agriculture'
                ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/60 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
            title="Agriculture & Farm"
          >
            <Wheat className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span className="inline sm:hidden">Farm</span>
            <span className="hidden sm:inline">Agriculture</span>
          </button>

          <button
            onClick={() => onSelectArchetype('corporate')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-medium transition-all ${
              currentArchetype === 'corporate'
                ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/60 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
            }`}
            title="Corporate & Industry"
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span className="inline sm:hidden">Corp</span>
            <span className="hidden sm:inline">Corporate</span>
          </button>
        </div>

        {/* Right Action Tools: Regional Grid Preset & Export ISO Report */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Regional Grid Preset Dropdown (Desktop / Tablet) */}
          <div className="hidden md:flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2 h-8 sm:h-9 text-xs">
            <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <select
              value={selectedGridKey}
              onChange={(e) => onSelectGridKey(e.target.value as RegionalGridKey)}
              className="bg-transparent font-medium text-zinc-800 focus:outline-none cursor-pointer text-xs pr-1"
            >
              <option value="india_cea">India CEA (0.716)</option>
              <option value="us_egrid">US eGRID (0.386)</option>
              <option value="eu_residual">EU-27 AIB (0.255)</option>
              <option value="uk_desnz">UK DESNZ (0.207)</option>
            </select>
          </div>

          {/* Export Audit Report Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExportModal}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-800 hover:text-zinc-950 h-8 sm:h-9 px-2.5 sm:px-3"
            title="Export ISO 14064 Audit Report"
          >
            <Download className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="hidden md:inline">Export ISO 14064 Report</span>
            <span className="inline md:hidden">Export</span>
          </Button>

          {/* Mobile Export Icon Button */}
          <button
            onClick={onOpenExportModal}
            className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
            title="Export ISO 14064 Audit Report"
            aria-label="Export report"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Quick Ledger Badge Trigger */}
          <button
            onClick={onOpenAuditSheet}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50/80 hover:bg-zinc-100 hover:border-zinc-300 transition-all text-xs shrink-0"
            title="Open audit trail ledger"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-mono font-bold text-zinc-900 tabular-nums text-[11px] sm:text-xs">
              {totalEmissionsTons.toLocaleString()} t
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
