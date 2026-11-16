'use client';

import React, { useState, useMemo } from 'react';
import {
  Archetype,
  RegionalGridKey,
  HouseholdData,
  AgricultureData,
  CorporateData,
} from './types';
import { REGIONAL_GRID_PRESETS } from './engine/factors';
import {
  calculateHousehold,
  calculateAgriculture,
  calculateCorporate,
} from './engine/calculatorEngine';
import { Navbar } from './components/layout/Navbar';
import { AnalyticsSummary } from './components/dashboard/AnalyticsSummary';
import { HouseholdView } from './components/views/HouseholdView';
import { AgricultureView } from './components/views/AgricultureView';
import { CorporateView } from './components/views/CorporateView';
import { AuditSheet } from './components/audit/AuditSheet';
import { ExportReportModal } from './components/export/ExportReportModal';
import {
  ExternalLink,
  Globe,
} from 'lucide-react';

// Realistic, audit-grade baseline state data
const INITIAL_HOUSEHOLD_DATA: HouseholdData = {
  electricityKwhMonthly: 450,
  waterM3Monthly: 14,
  hasSewageTreatment: true,
  wasteKgWeekly: 12,
  wasteRoute: 'landfill',
};

const INITIAL_AGRICULTURE_DATA: AgricultureData = {
  livestock: [
    { id: 'batch-1', animalType: 'dairy_cattle', headcount: 35 },
    { id: 'batch-2', animalType: 'beef_cattle', headcount: 20 },
    { id: 'batch-3', animalType: 'sheep_goats', headcount: 45 },
  ],
  syntheticFertilizerType: 'urea',
  syntheticFertilizerGrossKg: 1200,
  organicManureN_Kg: 350,
  floodedPaddyHectares: 4.5,
  floodedPaddyDays: 90,
  paddyWaterRegime: 'continuously_flooded',
  machineryDieselLiters: 850,
};

const INITIAL_CORPORATE_DATA: CorporateData = {
  fuels: [
    { id: 'f-1', fuelType: 'diesel', volume: 4500 },
    { id: 'f-2', fuelType: 'natural_gas', volume: 8200 },
  ],
  refrigerants: [
    { id: 'r-1', refrigerantType: 'r410a', kgLeaked: 12 },
    { id: 'r-2', refrigerantType: 'r134a', kgLeaked: 6 },
  ],
  gridElectricityMwhAnnual: 850,
  contractedGreenPpaMwhAnnual: 350,
  freightLogs: [
    { id: 'fr-1', mode: 'truck_heavy', massTonnes: 120, distanceKm: 650 },
    { id: 'fr-2', mode: 'rail', massTonnes: 250, distanceKm: 1200 },
    { id: 'fr-3', mode: 'air_cargo', massTonnes: 8, distanceKm: 4500 },
  ],
  procurementSpends: [
    { id: 'sp-1', sector: 'software_cloud', spendUsd: 125000 },
    { id: 'sp-2', sector: 'it_hardware', spendUsd: 85000 },
    { id: 'sp-3', sector: 'professional_services', spendUsd: 65000 },
  ],
  computeVcpuHours: 240000,
  computeRamGbHours: 480000,
  datacenterPue: 1.25,
  datacenterRegion: 'us_egrid',
  developerWorkstationsCount: 45,
};

interface AppProps {
  initialArchetype?: Archetype;
}

export default function App({ initialArchetype = 'corporate' }: AppProps) {
  const [archetype, setArchetype] = useState<Archetype>(initialArchetype);

  React.useEffect(() => {
    if (initialArchetype) {
      setArchetype(initialArchetype);
    }
  }, [initialArchetype]);
  const [selectedGridKey, setSelectedGridKey] = useState<RegionalGridKey>('india_cea');

  // Input states for each archetype
  const [householdData, setHouseholdData] = useState<HouseholdData>(INITIAL_HOUSEHOLD_DATA);
  const [agricultureData, setAgricultureData] = useState<AgricultureData>(INITIAL_AGRICULTURE_DATA);
  const [corporateData, setCorporateData] = useState<CorporateData>(INITIAL_CORPORATE_DATA);

  // Audit sheet and export modal states
  const [isAuditSheetOpen, setIsAuditSheetOpen] = useState<boolean>(false);
  const [selectedAuditRecordId, setSelectedAuditRecordId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const activeGridPreset = REGIONAL_GRID_PRESETS[selectedGridKey];

  // Active calculation output based on selected archetype
  const output = useMemo(() => {
    switch (archetype) {
      case 'household':
        return calculateHousehold(householdData, activeGridPreset);
      case 'agriculture':
        return calculateAgriculture(agricultureData, activeGridPreset);
      case 'corporate':
      default:
        return calculateCorporate(corporateData, activeGridPreset);
    }
  }, [archetype, householdData, agricultureData, corporateData, activeGridPreset]);

  const handleOpenAudit = (recordId?: string | null) => {
    setSelectedAuditRecordId(recordId || null);
    setIsAuditSheetOpen(true);
  };

  const archetypeLabel =
    archetype === 'household'
      ? 'Residential Household'
      : archetype === 'agriculture'
      ? 'Farm & Agriculture AFOLU'
      : 'Corporate & Industrial Enterprise';

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation Shell */}
      <Navbar
        currentArchetype={archetype}
        onSelectArchetype={(arc) => {
          setArchetype(arc);
          setSelectedAuditRecordId(null);
        }}
        selectedGridKey={selectedGridKey}
        onSelectGridKey={setSelectedGridKey}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAuditSheet={() => handleOpenAudit(null)}
        totalEmissionsTons={output.totalEmissionsTons}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-8">
        {/* Compliance & Methodology Sub-Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-zinc-200/80 gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              Standard:
            </span>
            <span className="text-zinc-600 font-medium text-[11px] sm:text-xs">
              GHG Protocol Corporate & ISO 14064-1
            </span>
            <span className="hidden sm:inline text-zinc-300">|</span>
            <span className="text-zinc-500 font-mono text-[10px] sm:text-[11px] block sm:inline">
              IPCC AR6 GWP100
            </span>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
            {/* Mobile / Compact Grid Selector */}
            <div className="flex md:hidden items-center gap-1 bg-zinc-100/90 border border-zinc-200 rounded-md px-2 py-1 text-[11px]">
              <Globe className="w-3 h-3 text-zinc-500 shrink-0" />
              <select
                value={selectedGridKey}
                onChange={(e) => setSelectedGridKey(e.target.value as RegionalGridKey)}
                className="bg-transparent font-medium text-zinc-800 focus:outline-none cursor-pointer text-[11px]"
              >
                <option value="india_cea">India CEA (0.716)</option>
                <option value="us_egrid">US eGRID (0.386)</option>
                <option value="eu_residual">EU-27 (0.255)</option>
                <option value="uk_desnz">UK DESNZ (0.207)</option>
              </select>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-zinc-500 font-mono text-[11px]">
              <span className="text-zinc-400">Regional Factor:</span>
              <span className="font-bold text-zinc-800">
                {activeGridPreset.emissionFactorKwh} kg CO₂e/kWh
              </span>
              <span className="text-zinc-400">({activeGridPreset.country})</span>
            </div>

            <button
              onClick={() => handleOpenAudit(null)}
              className="text-xs text-emerald-800 font-medium hover:underline flex items-center gap-1 shrink-0"
            >
              Audit Trail ({output.auditRecords.length}) <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Real-Time Financial Ledger Analytics Cards & Charts */}
        <AnalyticsSummary
          output={output}
          archetypeLabel={archetypeLabel}
          onOpenAudit={handleOpenAudit}
        />

        {/* Dynamic Archetype Input Form */}
        <div className="pt-1 sm:pt-2">
          {archetype === 'household' && (
            <HouseholdView
              data={householdData}
              onChange={(updated) =>
                setHouseholdData((prev) => ({ ...prev, ...updated }))
              }
              gridPreset={activeGridPreset}
              onOpenAudit={handleOpenAudit}
            />
          )}

          {archetype === 'agriculture' && (
            <AgricultureView
              data={agricultureData}
              onChange={(updated) =>
                setAgricultureData((prev) => ({ ...prev, ...updated }))
              }
              gridPreset={activeGridPreset}
              onOpenAudit={handleOpenAudit}
            />
          )}

          {archetype === 'corporate' && (
            <CorporateView
              data={corporateData}
              onChange={(updated) =>
                setCorporateData((prev) => ({ ...prev, ...updated }))
              }
              gridPreset={activeGridPreset}
              onOpenAudit={handleOpenAudit}
            />
          )}
        </div>
      </main>

      {/* Enterprise Audit Footer */}
      <footer className="border-t border-zinc-200/90 bg-white py-5 sm:py-6 mt-8 sm:mt-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-800 tracking-tight">CLIMATE-LEDGER™</span>
            <span>—</span>
            <span className="text-[11px] sm:text-xs">Institutional FinTech & Carbon Accounting</span>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-2.5 sm:gap-4 text-[10px] sm:text-[11px] font-mono text-zinc-400 flex-wrap">
            <span>GHG Protocol</span>
            <span>•</span>
            <span>IPCC AFOLU Tier 1</span>
            <span>•</span>
            <span>USEEIO v2.0</span>
            <span>•</span>
            <span>GSF SCI (ISO 21031)</span>
          </div>
        </div>
      </footer>

      {/* Slide-Over Persefoni Audit Ledger Sheet */}
      <AuditSheet
        isOpen={isAuditSheetOpen}
        onClose={() => {
          setIsAuditSheetOpen(false);
          setSelectedAuditRecordId(null);
        }}
        auditRecords={output.auditRecords}
        selectedRecordId={selectedAuditRecordId}
      />

      {/* ISO 14064 Audit Export Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        output={output}
        archetype={archetype}
        gridPreset={activeGridPreset}
      />
    </div>
  );
}
