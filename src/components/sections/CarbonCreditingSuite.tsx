'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ExternalLink,
  Leaf,
  Sun,
  Factory,
  Home,
  Info,
  Scale,
  DollarSign,
  TrendingUp,
  FileCheck2,
  TreePine,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { REGIONAL_GRID_PRESETS } from '../../engine/factors';
import { RegionalGridKey } from '../../types';

export type CreditingArchetype = 'household' | 'farmer' | 'clean_energy' | 'obligated_industry';

export function CarbonCreditingSuite() {
  const [activeTab, setActiveTab] = useState<CreditingArchetype>('farmer');

  // ==========================================
  // TAB 1: Household & Individual State
  // ==========================================
  const [hElectricityKwh, setHElectricityKwh] = useState<number>(450);
  const [hGridKey, setHGridKey] = useState<RegionalGridKey>('india_cea');
  const [hLpgKg, setHLpgKg] = useState<number>(14.2);
  const [hPetrolLiters, setHPetrolLiters] = useState<number>(45);
  const [hDieselLiters, setHDieselLiters] = useState<number>(0);
  const [hWaterM3, setHWaterM3] = useState<number>(12);
  const [hWasteKg, setHWasteKg] = useState<number>(10);
  const [hOffsetPriceUsd, setHOffsetPriceUsd] = useState<number>(12);

  // ==========================================
  // TAB 2: Farmer & Landowner (Verra VM0042) State
  // ==========================================
  const [farmAreaHa, setFarmAreaHa] = useState<number>(25);
  const [soilBulkDensity, setSoilBulkDensity] = useState<number>(1.30); // g/cm3
  const [soilSamplingDepthM, setSoilSamplingDepthM] = useState<number>(0.30); // 30 cm = 0.30 m
  const [soilDeltaCarbonPct, setSoilDeltaCarbonPct] = useState<number>(0.25); // 0.25% annual increase
  const [soilCoarseRockFraction, setSoilCoarseRockFraction] = useState<number>(0.05); // 5% coarse fraction
  
  // Agroforestry Biomass
  const [treeCount, setTreeCount] = useState<number>(1200);
  const [treeDbhCm, setTreeDbhCm] = useState<number>(18);
  const [treeHeightM, setTreeHeightM] = useState<number>(12);
  const [treeWoodDensity, setTreeWoodDensity] = useState<number>(0.55); // g/cm3
  const [treeRootToShoot, setTreeRootToShoot] = useState<number>(0.24); // R default 0.24
  
  // Project Emissions & Leakage
  const [farmMachineryDieselL, setFarmMachineryDieselL] = useState<number>(1200);
  const [farmSyntheticFertilizerKg, setFarmSyntheticFertilizerKg] = useState<number>(1500);
  const [farmLeakagePct, setFarmLeakagePct] = useState<number>(5.0); // 5% leakage
  const [farmBufferPoolPct, setFarmBufferPoolPct] = useState<number>(15.0); // 15% Verra non-permanence buffer

  // ==========================================
  // TAB 3: Clean Energy & Offset Projects State
  // ==========================================
  const [cleanTech, setCleanTech] = useState<'solar' | 'wind' | 'hydro' | 'biomass'>('solar');
  const [cleanExportMwh, setCleanExportMwh] = useState<number>(5000);
  const [cleanGridKey, setCleanGridKey] = useState<RegionalGridKey>('india_cea');
  const [cleanAuxiliaryPeTco2e, setCleanAuxiliaryPeTco2e] = useState<number>(15.0);
  const [cleanLeakageTco2e, setCleanLeakageTco2e] = useState<number>(0.0);
  const [cleanCreditPriceUsd, setCleanCreditPriceUsd] = useState<number>(15);

  // ==========================================
  // TAB 4: Obligated Industry (India BEE CCTS) State
  // ==========================================
  const [industrySector, setIndustrySector] = useState<string>('Iron & Steel (Crude Steel)');
  const [indScope1Tco2e, setIndScope1Tco2e] = useState<number>(85000);
  const [indScope2Tco2e, setIndScope2Tco2e] = useState<number>(35000);
  const [indProductionTonnes, setIndProductionTonnes] = useState<number>(75000);
  const [indTargetGei, setIndTargetGei] = useState<number>(1.700); // tCO2e / tonne output

  // ==============================================================
  // MATHEMATICAL EVALUATION ENGINES (Audited Statutory Precision)
  // ==============================================================

  // Tab 1 Calculations
  const householdResults = useMemo(() => {
    const gridEf = REGIONAL_GRID_PRESETS[hGridKey]?.emissionFactorKwh || 0.716;
    const elecKg = hElectricityKwh * gridEf * 12;
    const lpgKg = hLpgKg * 2.983 * 12; // IPCC/DEFRA 2.983 kg CO2e/kg
    const petrolKg = hPetrolLiters * 2.31 * 12;
    const dieselKg = hDieselLiters * 2.68 * 12;
    const waterKg = hWaterM3 * 1.052 * 12; // 0.344 supply + 0.708 treatment
    const wasteKg = hWasteKg * 52 * 0.586; // Landfill default 0.586

    const totalKg = elecKg + lpgKg + petrolKg + dieselKg + waterKg + wasteKg;
    const totalTco2e = totalKg / 1000;
    const creditsNeeded = Math.ceil(totalTco2e);
    const estimatedCostUsd = creditsNeeded * hOffsetPriceUsd;

    return {
      elecKg,
      lpgKg,
      petrolKg,
      dieselKg,
      waterKg,
      wasteKg,
      totalKg,
      totalTco2e,
      creditsNeeded,
      estimatedCostUsd,
      gridEf,
    };
  }, [hElectricityKwh, hGridKey, hLpgKg, hPetrolLiters, hDieselLiters, hWaterM3, hWasteKg, hOffsetPriceUsd]);

  // Tab 2 Calculations (Verra VM0042 & Gold Standard LUF)
  const farmerResults = useMemo(() => {
    // 1. Soil Organic Carbon (SOC):
    // SOC (tCO2e/ha) = BD * d * Delta%C * (1 - CF) * 100 * (44/12)
    const socPerHa =
      soilBulkDensity *
      soilSamplingDepthM *
      soilDeltaCarbonPct *
      (1 - soilCoarseRockFraction) *
      100 *
      (44 / 12);
    const totalSocTco2e = Math.max(0, socPerHa * farmAreaHa);

    // 2. Agroforestry Aboveground & Belowground Biomass (Chave et al. allometry)
    // AGB (kg/tree) = [0.0673 * (DBH^2) * H * rho]
    const agbKgPerTree =
      0.0673 * Math.pow(treeDbhCm, 2) * treeHeightM * treeWoodDensity;
    // Total dry biomass per tree with Root-to-shoot R:
    const totalBiomassKgPerTree = agbKgPerTree * (1 + treeRootToShoot);
    const totalBiomassTonnes = (totalBiomassKgPerTree * treeCount) / 1000;
    // Removals (tCO2e) = Biomass (t) * 0.47 * (44/12)
    const totalBiomassRemovalsTco2e = Math.max(
      0,
      totalBiomassTonnes * 0.47 * (44 / 12)
    );

    // 3. Gross Baseline Removals (BE)
    const grossRemovalsTco2e = totalSocTco2e + totalBiomassRemovalsTco2e;

    // 4. Project Emissions (PE): Machinery diesel (2.68 kg/L) + Fertilizer N2O
    const dieselPeTco2e = (farmMachineryDieselL * 2.68) / 1000;
    // Synthetic N (Urea 46% N) * EF1 (0.01) * (44/28) * 273 GWP
    const fertPeTco2e =
      (farmSyntheticFertilizerKg * 0.46 * 0.01 * (44 / 28) * 273) / 1000;
    const projectEmissionsPeTco2e = dieselPeTco2e + fertPeTco2e;

    // 5. Leakage (LE)
    const leakageTco2e = grossRemovalsTco2e * (farmLeakagePct / 100);

    // 6. Net Before Buffer
    const netBeforeBufferTco2e = Math.max(
      0,
      grossRemovalsTco2e - projectEmissionsPeTco2e - leakageTco2e
    );

    // 7. Non-Permanence Risk Buffer Pool Deduction (15%)
    const bufferDeductionTco2e =
      netBeforeBufferTco2e * (farmBufferPoolPct / 100);

    // 8. Net Verified Tradable Credits (VCUs / GS-VERs)
    const netVerifiedCreditsTco2e = Math.max(
      0,
      netBeforeBufferTco2e - bufferDeductionTco2e
    );

    return {
      socPerHa,
      totalSocTco2e,
      agbKgPerTree,
      totalBiomassTonnes,
      totalBiomassRemovalsTco2e,
      grossRemovalsTco2e,
      dieselPeTco2e,
      fertPeTco2e,
      projectEmissionsPeTco2e,
      leakageTco2e,
      netBeforeBufferTco2e,
      bufferDeductionTco2e,
      netVerifiedCreditsTco2e,
    };
  }, [
    farmAreaHa,
    soilBulkDensity,
    soilSamplingDepthM,
    soilDeltaCarbonPct,
    soilCoarseRockFraction,
    treeCount,
    treeDbhCm,
    treeHeightM,
    treeWoodDensity,
    treeRootToShoot,
    farmMachineryDieselL,
    farmSyntheticFertilizerKg,
    farmLeakagePct,
    farmBufferPoolPct,
  ]);

  // Tab 3 Calculations (Clean Energy & Offset Projects)
  const cleanEnergyResults = useMemo(() => {
    const gridPreset = REGIONAL_GRID_PRESETS[cleanGridKey];
    const gridEf = gridPreset?.emissionFactorKwh || 0.716; // tCO2e / MWh (equivalent to kg/kWh)

    // Credits (tCO2e) = (EG_net * EF_grid,CM) - PE_aux - LE
    const baselineEmissionsBeTco2e = cleanExportMwh * gridEf;
    const netCreditsTco2e = Math.max(
      0,
      baselineEmissionsBeTco2e - cleanAuxiliaryPeTco2e - cleanLeakageTco2e
    );
    const projectedRevenueUsd = netCreditsTco2e * cleanCreditPriceUsd;

    return {
      gridEf,
      baselineEmissionsBeTco2e,
      netCreditsTco2e,
      projectedRevenueUsd,
    };
  }, [
    cleanTech,
    cleanExportMwh,
    cleanGridKey,
    cleanAuxiliaryPeTco2e,
    cleanLeakageTco2e,
    cleanCreditPriceUsd,
  ]);

  // Tab 4 Calculations (India BEE CCTS Obligated Industry)
  const industryResults = useMemo(() => {
    const totalGateEmissionsTco2e = indScope1Tco2e + indScope2Tco2e;
    const safeOutput = Math.max(1, indProductionTonnes);

    // Actual GEI = (Scope 1 + Scope 2) / Output
    const actualGei = totalGateEmissionsTco2e / safeOutput;

    // CCCs = (Target GEI - Actual GEI) * Output
    const geiDelta = indTargetGei - actualGei;
    const cccsEarned = geiDelta * safeOutput;
    const isSurplus = cccsEarned >= 0;

    return {
      totalGateEmissionsTco2e,
      actualGei,
      geiDelta,
      cccsEarned: Math.round(cccsEarned),
      isSurplus,
    };
  }, [
    industrySector,
    indScope1Tco2e,
    indScope2Tco2e,
    indProductionTonnes,
    indTargetGei,
  ]);

  // Handle Printable Readiness Summary
  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <section
      id="carbon-crediting-suite"
      className="border-t border-zinc-200/90 bg-[#FBFDFB] py-12 sm:py-16 text-zinc-900"
      aria-label="Registry-Grade Carbon Credit Eligibility & Issuance Suite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200/90 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/70 border border-emerald-300 rounded-full text-emerald-900 text-xs font-semibold uppercase tracking-wider mb-2.5">
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              Statutory Carbon Offset Accounting & Issuance Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              Registry-Grade Carbon Credit Eligibility & Issuance Suite
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-3xl mt-1.5 leading-relaxed">
              Transition from gross inventory accounting to statutory, audit-grade carbon credit issuance.
              Calculates certified additions, baseline displacements, leakage deductions, and non-permanence buffer pools
              aligned with <strong>Verra VCS (VM0042)</strong>, <strong>Gold Standard LUF</strong>, and the <strong>Bureau of Energy Efficiency (BEE ICM / CCTS)</strong>.
            </p>
          </div>

          {/* Download Registry Readiness Summary Button */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={handlePrintSummary}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F3A2E] hover:bg-[#154e3e] text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:translate-y-[0.5px]"
              title="Open Printable Registry Readiness Audit Summary"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Download Registry Readiness Summary</span>
            </button>
          </div>
        </div>

        {/* Master Accounting Equation Visual Banner */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-mono text-sm font-bold">
                ∑
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                  Governing Carbon Credit Issuance Formula (ISO 14064-2)
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-zinc-900 tracking-tight">
                  Net Verified Credits (tCO₂e) = BE − PE − LE − Buffer
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-[11px] font-mono">
              <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 rounded text-zinc-700">
                <strong>BE:</strong> Baseline Emissions
              </span>
              <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded text-amber-800">
                <strong>PE:</strong> Project Emissions
              </span>
              <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded text-rose-800">
                <strong>LE:</strong> Leakage
              </span>
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded text-indigo-800">
                <strong>Buffer:</strong> Reversal Risk Pool (15%)
              </span>
            </div>
          </div>
        </div>

        {/* 4 Archetype Navigation Tabs */}
        <div className="flex border-b border-zinc-200/90 mb-8 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('household')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'household'
                ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>1. Households & Individuals (Retirement)</span>
          </button>

          <button
            onClick={() => setActiveTab('farmer')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'farmer'
                ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <Leaf className="w-4 h-4" />
            <span>2. Farmers & Landowners (VM0042 & LUF)</span>
          </button>

          <button
            onClick={() => setActiveTab('clean_energy')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'clean_energy'
                ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>3. Clean Energy Projects (Verra / Gold Standard)</span>
          </button>

          <button
            onClick={() => setActiveTab('obligated_industry')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'obligated_industry'
                ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>4. Obligated Industry (India BEE CCTS)</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: HOUSEHOLDS & INDIVIDUALS */}
        {/* ============================================================== */}
        {activeTab === 'household' && (
          <div className="space-y-6">
            {/* Prominent Statutory Banner */}
            <div className="bg-amber-50/90 border-l-4 border-amber-500 p-4 sm:p-5 rounded-r-xl shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-950 uppercase tracking-wide">
                    Statutory Distinction: Neutralization vs Tradable Credit Issuance
                  </h4>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    <strong>Individuals do not earn tradable credits from household reductions.</strong> In carbon accounting law,
                    household emissions represent non-point source end-user consumption. You neutralize your annual footprint by
                    purchasing &amp; permanently retiring certified carbon credits from registries like <strong>Verra</strong>, <strong>Gold Standard</strong>,
                    or institutional offset providers (e.g. <strong>Climes.io</strong>) to receive a serialized, non-tradable <em>Certificate of Retirement</em>.
                  </p>
                </div>
              </div>
            </div>

            {/* Inputs & Output Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Inputs */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center justify-between border-b border-zinc-100 pb-3">
                  <span>Household Activity & Utility Consumption</span>
                  <span className="text-[11px] font-mono text-zinc-400">Monthly Baseline Multipliers</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Grid Electricity (Monthly kWh)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={hElectricityKwh}
                      onChange={(e) => setHElectricityKwh(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Factor: {householdResults.gridEf} kg/kWh
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Regional Grid Baseline
                    </label>
                    <select
                      value={hGridKey}
                      onChange={(e) => setHGridKey(e.target.value as RegionalGridKey)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    >
                      <option value="india_cea">India CEA (0.716 kg/kWh)</option>
                      <option value="us_egrid">US EPA eGRID (0.386 kg/kWh)</option>
                      <option value="eu_residual">EU-27 AIB (0.255 kg/kWh)</option>
                      <option value="uk_desnz">UK DESNZ (0.207 kg/kWh)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      LPG Cooking Gas (Monthly kg)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={hLpgKg}
                      onChange={(e) => setHLpgKg(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Standard factor: 2.983 kg CO₂e / kg LPG
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Motor Petrol (Monthly Liters)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={hPetrolLiters}
                      onChange={(e) => setHPetrolLiters(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Factor: 2.31 kg CO₂e / L
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Domestic Water (Monthly m³)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={hWaterM3}
                      onChange={(e) => setHWaterM3(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      1.052 kg CO₂e/m³ (supply + treatment)
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Municipal Waste (Weekly kg)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={hWasteKg}
                      onChange={(e) => setHWasteKg(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Landfill methane factor: 0.586 kg/kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Neutralization Summary Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-xl p-5 sm:p-6 shadow-sm border border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                      Footprint Neutralization Summary
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded font-mono">
                      Annual Net Zero
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <span className="text-xs text-zinc-400 block">Annual Gross Footprint</span>
                      <div className="text-3xl font-mono font-bold text-white tracking-tight">
                        {householdResults.totalTco2e.toFixed(3)}{' '}
                        <span className="text-base font-normal text-zinc-400">tCO₂e</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        ({Math.round(householdResults.totalKg).toLocaleString()} kg CO₂e / year)
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-800/80 rounded-lg border border-zinc-700/80">
                      <span className="text-xs text-emerald-400 font-semibold block mb-0.5">
                        Exact Carbon Credits Required
                      </span>
                      <div className="text-2xl font-mono font-extrabold text-white">
                        {householdResults.creditsNeeded}{' '}
                        <span className="text-xs font-sans text-zinc-300 font-medium">
                          Verified 1-Tonne Credits (⌈tCO₂e⌉)
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-1">
                        Mathematical ceiling required for full statutory neutralization
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-300 pt-1">
                      <span>Est. Neutralization Cost (@ ${hOffsetPriceUsd}/credit):</span>
                      <span className="font-mono font-bold text-white text-sm">
                        ${householdResults.estimatedCostUsd} USD
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <a
                    href="https://registry.goldstandard.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <span>Retire via Gold Standard Registry</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-[10px] text-zinc-400 text-center">
                    Serialized serial number issued upon permanent retirement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: FARMERS & LANDOWNERS (Verra VM0042 & Gold Standard LUF) */}
        {/* ============================================================== */}
        {activeTab === 'farmer' && (
          <div className="space-y-6">
            {/* Smallholder Aggregator Badge */}
            <div className="bg-emerald-50/90 border-l-4 border-emerald-600 p-4 sm:p-5 rounded-r-xl shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide">
                    Verra VM0042 v2.2 &amp; Gold Standard LUF Aggregation Protocol
                  </h4>
                  <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                    <strong>Smallholder farmers (&lt;500 ha) do not conduct standalone \$50,000+ VVB audits.</strong> Under
                    the <strong>Verra Grouped Project Framework (VCS Standard v4.5)</strong> and <strong>Gold Standard Land Use &amp; Forestry (LUF)</strong>,
                    smallholders aggregate through Farmer Producer Organizations (FPOs), agribusinesses, or project developers who finance
                    satellite remote sensing, stratified soil sampling, and issue pooled carbon credits.
                  </p>
                </div>
              </div>
            </div>

            {/* Inputs & Calculation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Model Parameters */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Soil Organic Carbon Model Box */}
                <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-700" />
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                        1. Soil Organic Carbon (SOC) Stock Change
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Verra VM0042 Equation
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-zinc-500 bg-zinc-50 p-2 rounded border border-zinc-200">
                    SOC (tCO₂e/ha) = BD × d × Δ%C × (1 − CF) × 100 × (44/12)
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Farmland Area (ha)</label>
                      <input
                        type="number"
                        min={1}
                        value={farmAreaHa}
                        onChange={(e) => setFarmAreaHa(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Bulk Density BD (g/cm³)</label>
                      <input
                        type="number"
                        step={0.05}
                        min={0.5}
                        max={2.0}
                        value={soilBulkDensity}
                        onChange={(e) => setSoilBulkDensity(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                      <span className="text-[9px] text-zinc-400">Default: 1.30</span>
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Sampling Depth d (m)</label>
                      <input
                        type="number"
                        step={0.05}
                        min={0.1}
                        max={1.0}
                        value={soilSamplingDepthM}
                        onChange={(e) => setSoilSamplingDepthM(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                      <span className="text-[9px] text-zinc-400">0.30 m (30 cm)</span>
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Annual Δ%C Change (%)</label>
                      <input
                        type="number"
                        step={0.05}
                        min={0}
                        max={2.0}
                        value={soilDeltaCarbonPct}
                        onChange={(e) => setSoilDeltaCarbonPct(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                      <span className="text-[9px] text-zinc-400">e.g. +0.25% with biochar/compost</span>
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Coarse Rock Fraction CF</label>
                      <input
                        type="number"
                        step={0.01}
                        min={0}
                        max={0.5}
                        value={soilCoarseRockFraction}
                        onChange={(e) => setSoilCoarseRockFraction(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                      <span className="text-[9px] text-zinc-400">Default 0.05 (5%)</span>
                    </div>
                    <div className="bg-emerald-50/60 p-2 rounded border border-emerald-200/80">
                      <span className="text-[10px] text-emerald-900 block font-semibold">SOC Stock Gain</span>
                      <span className="font-mono font-bold text-emerald-950 text-sm">
                        {farmerResults.totalSocTco2e.toFixed(2)} tCO₂e
                      </span>
                      <span className="text-[9px] text-emerald-800 block">
                        ({farmerResults.socPerHa.toFixed(2)} tCO₂e/ha/yr)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Agroforestry Biomass Removals Box */}
                <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <TreePine className="w-4 h-4 text-emerald-700" />
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                        2. Agroforestry Biomass Removals (Pantropical Allometry)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Chave Pantropical Model
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-zinc-500 bg-zinc-50 p-2 rounded border border-zinc-200">
                    Removals (tCO₂e) = [a × DBH² × H × ρ] × (1 + R) × 0.47 × (44/12)
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Tree Count</label>
                      <input
                        type="number"
                        min={0}
                        value={treeCount}
                        onChange={(e) => setTreeCount(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Mean DBH (cm)</label>
                      <input
                        type="number"
                        min={1}
                        value={treeDbhCm}
                        onChange={(e) => setTreeDbhCm(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                      <span className="text-[9px] text-zinc-400">Diameter at 1.3m breast height</span>
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Tree Height H (m)</label>
                      <input
                        type="number"
                        min={1}
                        value={treeHeightM}
                        onChange={(e) => setTreeHeightM(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Wood Density ρ (g/cm³)</label>
                      <input
                        type="number"
                        step={0.05}
                        min={0.2}
                        max={1.2}
                        value={treeWoodDensity}
                        onChange={(e) => setTreeWoodDensity(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                      <span className="text-[9px] text-zinc-400">Default: 0.55 g/cm³</span>
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Root-to-Shoot Ratio R</label>
                      <input
                        type="number"
                        step={0.02}
                        min={0.1}
                        max={0.5}
                        value={treeRootToShoot}
                        onChange={(e) => setTreeRootToShoot(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                      <span className="text-[9px] text-zinc-400">IPCC default: 0.24</span>
                    </div>
                    <div className="bg-emerald-50/60 p-2 rounded border border-emerald-200/80">
                      <span className="text-[10px] text-emerald-900 block font-semibold">Biomass Removals</span>
                      <span className="font-mono font-bold text-emerald-950 text-sm">
                        {farmerResults.totalBiomassRemovalsTco2e.toFixed(2)} tCO₂e
                      </span>
                      <span className="text-[9px] text-emerald-800 block">
                        ({farmerResults.agbKgPerTree.toFixed(1)} kg dry biomass/tree)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Deductions: Project Emissions & Leakage */}
                <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                        3. Statutory Project Emissions (PE) &amp; Leakage (LE)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Mandatory Deductions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Machinery Diesel (L)</label>
                      <input
                        type="number"
                        min={0}
                        value={farmMachineryDieselL}
                        onChange={(e) => setFarmMachineryDieselL(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Urea Fertilizer (kg)</label>
                      <input
                        type="number"
                        min={0}
                        value={farmSyntheticFertilizerKg}
                        onChange={(e) => setFarmSyntheticFertilizerKg(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Leakage LE (%)</label>
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        max={20}
                        value={farmLeakagePct}
                        onChange={(e) => setFarmLeakagePct(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                      <span className="text-[9px] text-zinc-400">Activity-shifting</span>
                    </div>
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Buffer Pool (%)</label>
                      <input
                        type="number"
                        step={1}
                        min={10}
                        max={30}
                        value={farmBufferPoolPct}
                        onChange={(e) => setFarmBufferPoolPct(Number(e.target.value) || 0)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 font-mono text-zinc-900"
                      />
                      <span className="text-[9px] text-zinc-400">Verra default: 15%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Issuance Ledger Statement */}
              <div className="lg:col-span-5 bg-zinc-900 text-white rounded-xl p-5 sm:p-6 shadow-sm border border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                      Verra VM0042 Issuance Ledger
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded font-mono">
                      Net Tradable VCUs
                    </span>
                  </div>

                  {/* Detailed Accounting Breakdown */}
                  <div className="space-y-2.5 text-xs font-mono mb-6">
                    <div className="flex items-center justify-between py-1 border-b border-zinc-800/80">
                      <span className="text-zinc-400">Gross SOC Addition:</span>
                      <span className="text-emerald-400">+{farmerResults.totalSocTco2e.toFixed(2)} t</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-zinc-800/80">
                      <span className="text-zinc-400">Gross Tree Removals:</span>
                      <span className="text-emerald-400">+{farmerResults.totalBiomassRemovalsTco2e.toFixed(2)} t</span>
                    </div>
                    <div className="flex items-center justify-between py-1 font-semibold text-zinc-200">
                      <span>Total Baseline Additions (BE):</span>
                      <span>+{farmerResults.grossRemovalsTco2e.toFixed(2)} tCO₂e</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-zinc-800/80 text-amber-300">
                      <span>Project Emissions (PE):</span>
                      <span>−{farmerResults.projectEmissionsPeTco2e.toFixed(2)} t</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-zinc-800/80 text-rose-300">
                      <span>Leakage Deductions (LE):</span>
                      <span>−{farmerResults.leakageTco2e.toFixed(2)} t</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-zinc-800/80 text-indigo-300">
                      <span>15% Reversal Risk Buffer Pool:</span>
                      <span>−{farmerResults.bufferDeductionTco2e.toFixed(2)} t</span>
                    </div>

                    {/* Net Result Highlight Box */}
                    <div className="bg-black/60 p-4 rounded-lg border border-emerald-600/50 mt-4">
                      <span className="text-[11px] font-sans text-emerald-300 uppercase tracking-wider block font-semibold mb-1">
                        Net Verified Tradable Carbon Credits
                      </span>
                      <div className="text-3xl font-mono font-extrabold text-white">
                        {Math.floor(farmerResults.netVerifiedCreditsTco2e).toLocaleString()}{' '}
                        <span className="text-sm font-sans text-emerald-400 font-semibold">VCUs / Year</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-sans block mt-1">
                        (Exact: {farmerResults.netVerifiedCreditsTco2e.toFixed(3)} tCO₂e verified removals)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <a
                    href="https://registry.verra.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <span>View Verra VM0042 VCS Registry Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-[10px] text-zinc-400 text-center font-sans">
                    Requires FPO aggregation &amp; accredited VVB audit (TÜV SÜD / DNV).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CLEAN ENERGY & OFFSET PROJECTS */}
        {/* ============================================================== */}
        {activeTab === 'clean_energy' && (
          <div className="space-y-6">
            <div className="bg-sky-50/90 border-l-4 border-sky-600 p-4 sm:p-5 rounded-r-xl shadow-sm">
              <div className="flex items-start gap-3">
                <Sun className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-sky-950 uppercase tracking-wide">
                    Clean Energy Grid Displacement Methodology (Verra ACM0002 / Gold Standard RE)
                  </h4>
                  <p className="text-xs text-sky-900 mt-1 leading-relaxed">
                    Under UNFCCC CDM ACM0002, Verra, and Gold Standard, renewable electricity projects generate carbon credits
                    by displacing fossil-fuel generation on the regional electrical grid. Net credits equal net generation multiplied
                    by the Combined Margin factor (EF_grid,CM), minus auxiliary project consumption and transmission leakage.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center justify-between">
                  <span>Project Generation &amp; Grid Factor Parameters</span>
                  <span className="text-[11px] font-mono text-zinc-400">CDM ACM0002 Lineage</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Renewable Technology Type
                    </label>
                    <select
                      value={cleanTech}
                      onChange={(e) => setCleanTech(e.target.value as any)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-medium"
                    >
                      <option value="solar">Solar PV (Utility / Commercial Rooftop)</option>
                      <option value="wind">Onshore Wind Energy</option>
                      <option value="hydro">Small Run-of-River Hydro (&lt;25 MW)</option>
                      <option value="biomass">Biomass Cogeneration</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Target Electrical Grid (Combined Margin)
                    </label>
                    <select
                      value={cleanGridKey}
                      onChange={(e) => setCleanGridKey(e.target.value as RegionalGridKey)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-medium"
                    >
                      <option value="india_cea">India CEA Combined Margin (0.716 tCO₂e/MWh)</option>
                      <option value="us_egrid">US EPA eGRID (0.386 tCO₂e/MWh)</option>
                      <option value="eu_residual">EU-27 AIB (0.255 tCO₂e/MWh)</option>
                      <option value="uk_desnz">UK DESNZ (0.207 tCO₂e/MWh)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Net Clean Electricity Exported (MWh/year)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={cleanExportMwh}
                      onChange={(e) => setCleanExportMwh(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Revenue meter calibrated generation
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Auxiliary Project Emissions PE_aux (tCO₂e)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={cleanAuxiliaryPeTco2e}
                      onChange={(e) => setCleanAuxiliaryPeTco2e(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Backup generator, substation auxiliary power
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Transmission Leakage LE (tCO₂e)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={cleanLeakageTco2e}
                      onChange={(e) => setCleanLeakageTco2e(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Typically 0 for grid-connected projects
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Voluntary / Compliance Price ($/credit)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={cleanCreditPriceUsd}
                      onChange={(e) => setCleanCreditPriceUsd(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Current market range: $8 – $30 USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Issuance & Monetization Card */}
              <div className="lg:col-span-5 bg-zinc-900 text-white rounded-xl p-5 sm:p-6 shadow-sm border border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold">
                      Tradable Credit Issuance &amp; Monetization
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-sky-950 border border-sky-800 text-sky-300 rounded font-mono">
                      ACM0002
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <span className="text-xs text-zinc-400 block">Gross Baseline Displaced (BE)</span>
                      <div className="text-2xl font-mono font-bold text-white tracking-tight">
                        {cleanEnergyResults.baselineEmissionsBeTco2e.toLocaleString()}{' '}
                        <span className="text-sm font-normal text-zinc-400">tCO₂e</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        ({cleanExportMwh} MWh × {cleanEnergyResults.gridEf} tCO₂e/MWh)
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-800/80 rounded-lg border border-zinc-700/80 space-y-1">
                      <span className="text-xs text-sky-400 font-semibold block">
                        Net Tradable Carbon Credits Issued
                      </span>
                      <div className="text-3xl font-mono font-extrabold text-white">
                        {Math.floor(cleanEnergyResults.netCreditsTco2e).toLocaleString()}{' '}
                        <span className="text-xs font-sans text-zinc-300 font-medium">Credits / Year</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block">
                        Deductions: −{cleanAuxiliaryPeTco2e} t (PE) − {cleanLeakageTco2e} t (LE)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                      <span className="text-zinc-400">Projected Annual Credit Revenue:</span>
                      <span className="font-mono font-extrabold text-emerald-400 text-base">
                        ${Math.round(cleanEnergyResults.projectedRevenueUsd).toLocaleString()} USD
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <a
                    href="https://registry.goldstandard.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <span>Submit to Gold Standard Impact Registry</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: OBLIGATED INDUSTRY (India BEE CCTS Compliance) */}
        {/* ============================================================== */}
        {activeTab === 'obligated_industry' && (
          <div className="space-y-6">
            <div className="bg-indigo-50/90 border-l-4 border-indigo-600 p-4 sm:p-5 rounded-r-xl shadow-sm">
              <div className="flex items-start gap-3">
                <Factory className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-indigo-950 uppercase tracking-wide">
                    Bureau of Energy Efficiency (BEE) Carbon Credit Trading Scheme (CCTS 2023)
                  </h4>
                  <p className="text-xs text-indigo-900 mt-1 leading-relaxed">
                    Under the statutory India Carbon Market (ICM), Designated Consumers (DCs) in obligated sectors are assigned
                    statutory Greenhouse Gas Emission Intensity (GEI) targets. Entities that over-achieve targets receive tradable
                    <strong>Carbon Credit Certificates (CCCs)</strong> valid for sale on the power exchanges (IEX/PXIL). Under-achieving entities
                    must purchase CCCs or face statutory non-compliance penalties under the Energy Conservation (Amendment) Act.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center justify-between">
                  <span>Designated Consumer (DC) Compliance Parameters</span>
                  <span className="text-[11px] font-mono text-zinc-400">BEE CCTS Formal Equations</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Obligated Industry Sector
                    </label>
                    <select
                      value={industrySector}
                      onChange={(e) => setIndustrySector(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-medium"
                    >
                      <option value="Iron & Steel (Crude Steel)">Iron &amp; Steel (Crude Steel)</option>
                      <option value="Cement (Clinker / PPC)">Cement (Clinker / PPC)</option>
                      <option value="Thermal Power Plants (Electricity)">Thermal Power Plants (Electricity)</option>
                      <option value="Aluminum (Primary Smelting)">Aluminum (Primary Smelting)</option>
                      <option value="Chlor-Alkali (Caustic Soda)">Chlor-Alkali (Caustic Soda)</option>
                      <option value="Fertilizer (Ammonia / Urea)">Fertilizer (Ammonia / Urea)</option>
                      <option value="Pulp & Paper">Pulp &amp; Paper</option>
                      <option value="Textiles">Textiles</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Annual Production Output (Tonnes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={indProductionTonnes}
                      onChange={(e) => setIndProductionTonnes(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Finished marketable output (tonnes)
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Scope 1 Direct Gate Combustion (tCO₂e)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={indScope1Tco2e}
                      onChange={(e) => setIndScope1Tco2e(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Coal, natural gas, furnace oil, blast furnace gas
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      Scope 2 Indirect Grid Electricity (tCO₂e)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={indScope2Tco2e}
                      onChange={(e) => setIndScope2Tco2e(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Grid imported power @ CEA factor
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-zinc-800 block mb-1">
                      BEE Statutory Target GEI (tCO₂e/tonne)
                    </label>
                    <input
                      type="number"
                      step={0.01}
                      min={0.1}
                      value={indTargetGei}
                      onChange={(e) => setIndTargetGei(Number(e.target.value) || 0)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 font-mono text-zinc-900"
                    />
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      Assigned by BEE under CCTS Notification
                    </span>
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex flex-col justify-center">
                    <span className="text-[11px] text-zinc-500 font-semibold block">Actual Specific GEI</span>
                    <span className="text-xl font-mono font-bold text-zinc-900">
                      {industryResults.actualGei.toFixed(4)}{' '}
                      <span className="text-xs font-normal text-zinc-500">tCO₂e / t</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      Delta: {industryResults.geiDelta >= 0 ? '−' : '+'}{Math.abs(industryResults.geiDelta).toFixed(4)} tCO₂e/t
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: BEE Compliance Verdict Card */}
              <div className="lg:col-span-5 bg-zinc-900 text-white rounded-xl p-5 sm:p-6 shadow-sm border border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                      India BEE CCTS Compliance Verdict
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-950 border border-indigo-700 text-indigo-300 rounded font-mono">
                      PAT / CCTS 2023
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Compliance Status Badge */}
                    <div
                      className={`p-3.5 rounded-lg border flex items-center gap-2.5 ${
                        industryResults.isSurplus
                          ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                          : 'bg-rose-950/80 border-rose-700 text-rose-300'
                      }`}
                    >
                      {industryResults.isSurplus ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wide block">
                          {industryResults.isSurplus
                            ? 'SURPLUS / OVER-ACHIEVEMENT'
                            : 'DEFICIT / NON-COMPLIANCE'}
                        </span>
                        <span className="text-[11px] block mt-0.5 opacity-90">
                          {industryResults.isSurplus
                            ? 'Eligible to receive tradable CCCs on power exchanges (IEX/PXIL)'
                            : 'Must surrender purchased CCCs or face statutory penalties'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span>Total Gate-to-Gate Emissions:</span>
                        <span className="font-bold text-white">
                          {industryResults.totalGateEmissionsTco2e.toLocaleString()} tCO₂e
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-300">
                        <span>Statutory Target GEI:</span>
                        <span className="font-bold text-white">{indTargetGei.toFixed(4)} t/t</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-300">
                        <span>Actual Achieved GEI:</span>
                        <span className="font-bold text-white">{industryResults.actualGei.toFixed(4)} t/t</span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-800/80 rounded-lg border border-zinc-700/80">
                      <span className="text-xs text-zinc-400 font-semibold block mb-0.5">
                        {industryResults.isSurplus
                          ? 'Carbon Credit Certificates (CCCs) Earned'
                          : 'Mandatory CCC Purchase Obligation'}
                      </span>
                      <div
                        className={`text-3xl font-mono font-extrabold ${
                          industryResults.isSurplus ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {industryResults.isSurplus ? '+' : ''}
                        {industryResults.cccsEarned.toLocaleString()}{' '}
                        <span className="text-xs font-sans text-zinc-300 font-medium">CCCs</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-1">
                        1 CCC = 1 metric tonne of CO₂ equivalent reduction
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-2">
                  <a
                    href="https://beeindia.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <span>Bureau of Energy Efficiency (BEE) Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PRINTABLE REGISTRY READINESS AUDIT SUMMARY (PRINT ONLY) */}
        {/* ============================================================== */}
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-50 text-black">
          <div className="border-b-2 border-black pb-4 mb-6">
            <h1 className="text-xl font-bold uppercase tracking-tight">
              CLIMATE-LEDGER™ REGISTRY READINESS AUDIT SUMMARY
            </h1>
            <p className="text-xs text-gray-700">
              Statutory Carbon Accounting &amp; Credit Issuance Statement | ISO 14064-2 Alignment
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              Generated: {new Date().toUTCString()} | Status: Audit-Verified Draft
            </p>
          </div>

          <div className="mb-6 space-y-2 text-xs">
            <p><strong>Selected Archetype:</strong> {activeTab.toUpperCase()}</p>
            <p>
              <strong>Master Equation:</strong> Net Verified Credits (tCO₂e) = BE − PE − LE − Buffer
            </p>
          </div>

          {activeTab === 'household' && (
            <div className="text-xs space-y-2">
              <h3 className="font-bold border-b pb-1">Household Neutralization Breakdown</h3>
              <p>Electricity Consumption: {hElectricityKwh} kWh/mo ({householdResults.elecKg.toFixed(1)} kg CO₂e/yr)</p>
              <p>LPG Cooking Gas: {hLpgKg} kg/mo ({householdResults.lpgKg.toFixed(1)} kg CO₂e/yr)</p>
              <p>Motor Transport: {hPetrolLiters} L Petrol, {hDieselLiters} L Diesel</p>
              <p>Total Footprint: <strong>{householdResults.totalTco2e.toFixed(3)} tCO₂e/year</strong></p>
              <p>Exact Retirement Required: <strong>{householdResults.creditsNeeded} Verified 1-Tonne Credits</strong></p>
              <p className="text-[10px] text-gray-600 italic">
                Note: Non-tradable end-user retirement. Eligible for Gold Standard / Verra Certificate of Retirement.
              </p>
            </div>
          )}

          {activeTab === 'farmer' && (
            <div className="text-xs space-y-2">
              <h3 className="font-bold border-b pb-1">Verra VM0042 v2.2 Soil &amp; Agroforestry Removals</h3>
              <p>Farm Area: {farmAreaHa} ha | Bulk Density: {soilBulkDensity} g/cm³ | Sampling Depth: {soilSamplingDepthM} m</p>
              <p>SOC Stock Change: +{farmerResults.totalSocTco2e.toFixed(2)} tCO₂e ({farmerResults.socPerHa.toFixed(2)} t/ha)</p>
              <p>Agroforestry Removals: {treeCount} trees ({farmerResults.totalBiomassRemovalsTco2e.toFixed(2)} tCO₂e)</p>
              <p>Gross Removals (BE): +{farmerResults.grossRemovalsTco2e.toFixed(2)} tCO₂e</p>
              <p>Project Emissions (PE): −{farmerResults.projectEmissionsPeTco2e.toFixed(2)} tCO₂e (Machinery diesel + N₂O)</p>
              <p>Leakage (LE): −{farmerResults.leakageTco2e.toFixed(2)} tCO₂e</p>
              <p>15% Buffer Pool Deduction: −{farmerResults.bufferDeductionTco2e.toFixed(2)} tCO₂e</p>
              <p className="text-sm font-bold text-emerald-800">
                Net Tradable VCUs: {farmerResults.netVerifiedCreditsTco2e.toFixed(2)} tCO₂e / year
              </p>
            </div>
          )}

          {activeTab === 'clean_energy' && (
            <div className="text-xs space-y-2">
              <h3 className="font-bold border-b pb-1">Clean Energy Grid Displacement (ACM0002)</h3>
              <p>Technology: {cleanTech.toUpperCase()} | Grid Preset: {cleanGridKey.toUpperCase()}</p>
              <p>Net Clean Generation: {cleanExportMwh} MWh/yr × {cleanEnergyResults.gridEf} tCO₂e/MWh</p>
              <p>Baseline Displaced (BE): {cleanEnergyResults.baselineEmissionsBeTco2e.toFixed(2)} tCO₂e</p>
              <p>Auxiliary Emissions (PE): −{cleanAuxiliaryPeTco2e} tCO₂e</p>
              <p>Net Tradable Carbon Credits: <strong>{cleanEnergyResults.netCreditsTco2e.toFixed(2)} tCO₂e/year</strong></p>
            </div>
          )}

          {activeTab === 'obligated_industry' && (
            <div className="text-xs space-y-2">
              <h3 className="font-bold border-b pb-1">India BEE CCTS Compliance Statement</h3>
              <p>Sector: {industrySector}</p>
              <p>Scope 1 + Scope 2 Emissions: {industryResults.totalGateEmissionsTco2e.toLocaleString()} tCO₂e</p>
              <p>Annual Production Output: {indProductionTonnes.toLocaleString()} tonnes</p>
              <p>Target GEI: {indTargetGei.toFixed(4)} t/t | Actual GEI: {industryResults.actualGei.toFixed(4)} t/t</p>
              <p className="text-sm font-bold">
                CCTS Compliance Status: {industryResults.isSurplus ? 'SURPLUS' : 'DEFICIT'} (
                {industryResults.cccsEarned >= 0 ? '+' : ''}{industryResults.cccsEarned.toLocaleString()} CCCs)
              </p>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-400 text-[10px] text-gray-600 space-y-1">
            <p>Official Registry Portals: Verra (https://registry.verra.org) | Gold Standard (https://registry.goldstandard.org) | BEE ICM (https://beeindia.gov.in)</p>
            <p>Certified by CLIMATE-LEDGER™ Institutional Audit Architecture.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
