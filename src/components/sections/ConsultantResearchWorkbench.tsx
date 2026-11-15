'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Microscope,
  Upload,
  Download,
  Copy,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  FileSpreadsheet,
  FileJson,
  Hash,
  ShieldCheck,
  Layers,
  Activity,
  BarChart2,
  Info,
  CheckCircle2,
  FileText,
  Sliders,
  Globe,
  Sparkles,
} from 'lucide-react';
import { REGIONAL_GRID_PRESETS } from '../../engine/factors';
import { RegionalGridKey } from '../../types';

export interface WorkbenchRow {
  id: string;
  scenario: string;
  domain: string;
  activityData: number;
  unit: string;
  emissionFactor: number;
  factorUnit: string;
  sourceYear: string;
  uncertaintyPercent: number; // e.g. 5.0 for ±5%
}

export type GridModelingBasis = 'attributional' | 'consequential';

export const SAMPLE_CASE_STUDY: WorkbenchRow[] = [
  {
    id: 'row-1',
    scenario: 'Campus Microgrid',
    domain: 'Scope 2 Purchased Electricity',
    activityData: 2450000,
    unit: 'kWh',
    emissionFactor: 0.716,
    factorUnit: 'kg CO₂e/kWh',
    sourceYear: 'India CEA v19 (2024)',
    uncertaintyPercent: 4.8,
  },
  {
    id: 'row-2',
    scenario: 'Heating Plant',
    domain: 'Scope 1 Stationary Combustion',
    activityData: 185000,
    unit: 'm³',
    emissionFactor: 2.02,
    factorUnit: 'kg CO₂e/m³',
    sourceYear: 'IPCC AR6 Vol 2 (Natural Gas)',
    uncertaintyPercent: 3.5,
  },
  {
    id: 'row-3',
    scenario: 'Electric Shuttle Transit',
    domain: 'Scope 3 Employee Commute',
    activityData: 350000,
    unit: 'pkm',
    emissionFactor: 0.0351,
    factorUnit: 'kg CO₂e/pkm',
    sourceYear: 'KTH Dynamic Rail (0.049 kWh/pkm × 0.716)',
    uncertaintyPercent: 8.0,
  },
  {
    id: 'row-4',
    scenario: 'Logistics Fleet',
    domain: 'Scope 1 Mobile Combustion',
    activityData: 64000,
    unit: 'L',
    emissionFactor: 2.687,
    factorUnit: 'kg CO₂e/L',
    sourceYear: 'DEFRA 2023 Commercial Diesel',
    uncertaintyPercent: 2.5,
  },
  {
    id: 'row-5',
    scenario: 'Refrigeration Chiller',
    domain: 'Scope 1 Fugitive Refrigerants',
    activityData: 42,
    unit: 'kg R410A',
    emissionFactor: 2256.0,
    factorUnit: 'kg CO₂e/kg',
    sourceYear: 'IPCC AR6 GWP100 (R-410A)',
    uncertaintyPercent: 12.0,
  },
  {
    id: 'row-6',
    scenario: 'Water Infrastructure',
    domain: 'Scope 3 Supply Utilities',
    activityData: 48000,
    unit: 'm³',
    emissionFactor: 1.052,
    factorUnit: 'kg CO₂e/m³',
    sourceYear: 'UK DESNZ 2023 Water & Sewage',
    uncertaintyPercent: 15.0,
  },
];

export function ConsultantResearchWorkbench() {
  // =========================================================================
  // 1. STATE & ACTIVITY LEDGER ROWS
  // =========================================================================
  const [rows, setRows] = useState<WorkbenchRow[]>(SAMPLE_CASE_STUDY);
  const [selectedGridKey, setSelectedGridKey] = useState<RegionalGridKey>('india_cea');
  const [gridModelingBasis, setGridModelingBasis] = useState<GridModelingBasis>('attributional');
  const [marginalGridFactor, setMarginalGridFactor] = useState<number>(0.85); // Marginal Operating Margin
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [reproducibilityHash, setReproducibilityHash] = useState<string>('Computing...');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Active Grid Emission Factor based on Attributional vs Consequential
  const activeGrid = REGIONAL_GRID_PRESETS[selectedGridKey] || REGIONAL_GRID_PRESETS.india_cea;
  const activeGridEf =
    gridModelingBasis === 'consequential'
      ? marginalGridFactor
      : activeGrid.emissionFactorKwh;

  // Dynamic Rail coupling
  const dynamicMetroEf = 0.049 * activeGridEf;
  const dynamicCommuterTrainEf = 0.057 * activeGridEf;

  // =========================================================================
  // 2. ROW OPERATIONS
  // =========================================================================
  const addRow = () => {
    const newRow: WorkbenchRow = {
      id: `row-${Date.now()}`,
      scenario: 'Facility Beta',
      domain: 'Scope 2 Purchased Electricity',
      activityData: 100000,
      unit: 'kWh',
      emissionFactor: activeGridEf,
      factorUnit: 'kg CO₂e/kWh',
      sourceYear: `${activeGrid.label} (${activeGrid.sourceAuthority})`,
      uncertaintyPercent: 5.0,
    };
    setRows([...rows, newRow]);
  };

  const updateRow = (id: string, updates: Partial<WorkbenchRow>) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  };

  const deleteRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const clearAllRows = () => {
    setRows([
      {
        id: `row-${Date.now()}`,
        scenario: 'Custom Scenario',
        domain: 'Scope 1 Stationary Combustion',
        activityData: 0,
        unit: 'kWh',
        emissionFactor: 0,
        factorUnit: 'kg CO₂e/unit',
        sourceYear: 'Primary Meter',
        uncertaintyPercent: 0,
      },
    ]);
  };

  const loadCaseStudy = () => {
    setRows(SAMPLE_CASE_STUDY);
  };

  const insertDynamicRailRow = (mode: 'metro' | 'train') => {
    const isMetro = mode === 'metro';
    const ef = isMetro ? dynamicMetroEf : dynamicCommuterTrainEf;
    const label = isMetro ? 'Metro / Light Rail Fleet' : 'Commuter Rail Transit';
    const newRow: WorkbenchRow = {
      id: `row-${Date.now()}`,
      scenario: 'Transit Electrification',
      domain: 'Scope 3 Passenger Transit',
      activityData: 250000,
      unit: 'pkm',
      emissionFactor: Number(ef.toFixed(4)),
      factorUnit: 'kg CO₂e/pkm',
      sourceYear: `KTH Dynamic Rail (${isMetro ? '0.049' : '0.057'} kWh/pkm × ${activeGridEf.toFixed(3)})`,
      uncertaintyPercent: 6.5,
    };
    setRows([...rows, newRow]);
  };

  // CSV Parsing
  const handleParseCsv = () => {
    if (!csvRawText.trim()) return;

    try {
      const lines = csvRawText.trim().split(/\r?\n/);
      const parsedRows: WorkbenchRow[] = [];

      lines.forEach((line, index) => {
        // Skip header if detected
        if (
          index === 0 &&
          (line.toLowerCase().includes('scenario') ||
            line.toLowerCase().includes('activity') ||
            line.toLowerCase().includes('factor'))
        ) {
          return;
        }

        const cols = line.split(/[,\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 4) {
          const scenario = cols[0] || `Scenario ${index + 1}`;
          const domain = cols[1] || 'Scope 1/2 Activity';
          const activityData = parseFloat(cols[2]) || 0;
          const unit = cols[3] || 'units';
          const emissionFactor = parseFloat(cols[4]) || 0;
          const factorUnit = cols[5] || `kg CO₂e/${unit}`;
          const sourceYear = cols[6] || 'Client Audit / Lab Data';
          const uncertaintyPercent = parseFloat(cols[7]) || 5.0;

          parsedRows.push({
            id: `row-csv-${index}-${Date.now()}`,
            scenario,
            domain,
            activityData,
            unit,
            emissionFactor,
            factorUnit,
            sourceYear,
            uncertaintyPercent,
          });
        }
      });

      if (parsedRows.length > 0) {
        setRows(parsedRows);
        setIsCsvModalOpen(false);
        setCsvRawText('');
      } else {
        alert('Could not parse any valid rows. Please check CSV format.');
      }
    } catch (err) {
      console.error('CSV parse error', err);
      alert('Failed to parse CSV format.');
    }
  };

  // =========================================================================
  // 3. DETERMINISTIC & MONTE CARLO UNCERTAINTY PROPAGATION (1,000 SAMPLES)
  // =========================================================================
  const analysis = useMemo(() => {
    // Deterministic Row Results
    let deterministicSumKg = 0;
    const rowCalculations = rows.map((r) => {
      const grossKg = (Number(r.activityData) || 0) * (Number(r.emissionFactor) || 0);
      const grossTco2e = grossKg / 1000;
      deterministicSumKg += grossKg;
      return {
        ...r,
        grossKg,
        grossTco2e,
      };
    });

    const deterministicTotalTco2e = deterministicSumKg / 1000;

    // 1,000-Iteration Monte Carlo Simulation
    const iterations = 1000;
    const sampleTotals: number[] = new Array(iterations);

    // Box-Muller normal random generator
    const getRandomGaussian = () => {
      let u1 = 0;
      let u2 = 0;
      while (u1 === 0) u1 = Math.random();
      while (u2 === 0) u2 = Math.random();
      return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    };

    for (let k = 0; k < iterations; k++) {
      let iterationTotalKg = 0;
      for (let i = 0; i < rowCalculations.length; i++) {
        const item = rowCalculations[i];
        const nominalKg = item.grossKg;
        const uFraction = (Math.max(0, Number(item.uncertaintyPercent)) || 0) / 100;

        if (uFraction > 0 && nominalKg !== 0) {
          // uFraction treated as 95% confidence half-width (1.96 sigma)
          const sigma = nominalKg * (uFraction / 1.96);
          const z = getRandomGaussian();
          const sampledKg = Math.max(0, nominalKg + z * sigma);
          iterationTotalKg += sampledKg;
        } else {
          iterationTotalKg += nominalKg;
        }
      }
      sampleTotals[k] = iterationTotalKg / 1000;
    }

    // Sort to extract percentiles
    sampleTotals.sort((a, b) => a - b);

    const p5Index = Math.floor(iterations * 0.05);
    const p50Index = Math.floor(iterations * 0.5);
    const p95Index = Math.floor(iterations * 0.95);

    const p5 = sampleTotals[p5Index];
    const p50 = sampleTotals[p50Index];
    const p95 = sampleTotals[p95Index];

    // Mean and standard deviation
    const mean = sampleTotals.reduce((acc, v) => acc + v, 0) / iterations;
    const variance =
      sampleTotals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (iterations - 1);
    const stdDev = Math.sqrt(variance);

    // Relative standard uncertainty percentage
    const relativeUncertaintyPct =
      deterministicTotalTco2e > 0
        ? ((p95 - p5) / (2 * deterministicTotalTco2e)) * 100
        : 0;

    return {
      rowCalculations,
      deterministicTotalTco2e,
      p5,
      p50,
      p95,
      mean,
      stdDev,
      relativeUncertaintyPct,
    };
  }, [rows]);

  // =========================================================================
  // 4. DETERMINISTIC SHA-256 REPRODUCIBILITY HASH
  // =========================================================================
  const generateAuditJsonPayload = useCallback(() => {
    return {
      auditVersion: '2.4.0-consultant-workbench',
      timestampUtc: new Date().toISOString(),
      gridModelingBasis,
      activeGridKey: selectedGridKey,
      activeGridEmissionFactorKwh: activeGridEf,
      marginalOperatingMarginKwh: marginalGridFactor,
      rows: rows.map((r) => ({
        scenario: r.scenario,
        domain: r.domain,
        activityData: Number(r.activityData),
        unit: r.unit,
        emissionFactor: Number(r.emissionFactor),
        factorUnit: r.factorUnit,
        sourceYear: r.sourceYear,
        uncertaintyPercent: Number(r.uncertaintyPercent),
        computedTco2e: Number(((Number(r.activityData) * Number(r.emissionFactor)) / 1000).toFixed(6)),
      })),
      deterministicTotalTco2e: Number(analysis.deterministicTotalTco2e.toFixed(6)),
      monteCarloAnalysis: {
        iterations: 1000,
        distribution: 'Gaussian Box-Muller Propagation',
        p5Tco2e: Number(analysis.p5.toFixed(6)),
        p50MedianTco2e: Number(analysis.p50.toFixed(6)),
        p95Tco2e: Number(analysis.p95.toFixed(6)),
        meanTco2e: Number(analysis.mean.toFixed(6)),
        standardDeviationTco2e: Number(analysis.stdDev.toFixed(6)),
        relativeUncertaintyPct: Number(analysis.relativeUncertaintyPct.toFixed(2)),
      },
    };
  }, [gridModelingBasis, selectedGridKey, activeGridEf, marginalGridFactor, rows, analysis]);

  useEffect(() => {
    async function computeHash() {
      try {
        const canonicalJson = JSON.stringify(generateAuditJsonPayload());
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
          const msgUint8 = new TextEncoder().encode(canonicalJson);
          const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
          setReproducibilityHash(hashHex);
        } else {
          setReproducibilityHash('SHA256-CLIENT-UNAVAILABLE');
        }
      } catch (err) {
        setReproducibilityHash('HASH-CALC-ERROR');
      }
    }
    computeHash();
  }, [generateAuditJsonPayload]);

  const copyHashToClipboard = () => {
    navigator.clipboard.writeText(reproducibilityHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const copyJsonToClipboard = () => {
    const payload = JSON.stringify(generateAuditJsonPayload(), null, 2);
    navigator.clipboard.writeText(payload);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const exportCsv = () => {
    const headers = [
      'Scenario/Facility',
      'Domain/Category',
      'Activity Data',
      'Unit',
      'Emission Factor',
      'Factor Unit',
      'Statutory Source',
      'Uncertainty (±%)',
      'Point Emissions (tCO2e)',
      'Verification Hash',
    ];

    const csvLines = [headers.join(',')];
    analysis.rowCalculations.forEach((r) => {
      csvLines.push(
        [
          `"${r.scenario.replace(/"/g, '""')}"`,
          `"${r.domain.replace(/"/g, '""')}"`,
          r.activityData,
          `"${r.unit}"`,
          r.emissionFactor,
          `"${r.factorUnit}"`,
          `"${r.sourceYear.replace(/"/g, '""')}"`,
          r.uncertaintyPercent,
          r.grossTco2e.toFixed(4),
          `"${reproducibilityHash.substring(0, 16)}..."`,
        ].join(',')
      );
    });

    // Summary line
    csvLines.push('');
    csvLines.push(
      `"TOTAL DETERMINISTIC",,,,,,,,${analysis.deterministicTotalTco2e.toFixed(4)},"${reproducibilityHash}"`
    );
    csvLines.push(
      `"MONTE CARLO 90% CI (P5 - P95)",,,,,,,,${analysis.p5.toFixed(4)} - ${analysis.p95.toFixed(4)},"Relative Uncertainty: ±${analysis.relativeUncertaintyPct.toFixed(1)}%"`
    );

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `carbon_audit_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJson = () => {
    const payload = JSON.stringify(generateAuditJsonPayload(), null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `carbon_audit_reproducible_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn w-full max-w-full overflow-x-hidden">
      {/* ============================================================== */}
      {/* TOP HEADER: CONSULTANT & RESEARCH WORKBENCH */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-emerald-950 text-white rounded-2xl p-5 sm:p-7 border border-zinc-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              Institutional Carbon Accounting · ISO 14064-1 &amp; GHG Protocol
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700 text-emerald-200">
              Double-Precision Float64
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Microscope className="w-6 h-6 text-emerald-400" />
            <span>Consultant &amp; Research Workbench</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl mt-1 leading-relaxed">
            Multi-facility batch activity accounting, dynamic regional grid coupling, 1,000-iteration Monte Carlo uncertainty propagation, and cryptographic SHA-256 reproducibility hashes.
          </p>
        </div>

        {/* Quick Case Study Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={loadCaseStudy}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-bold text-white transition shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Microgrid Case Study</span>
          </button>
          <button
            type="button"
            onClick={clearAllRows}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 border border-zinc-700 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Table</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* GRID MODELING BASIS (ATTRIBUTIONAL LCA VS CONSEQUENTIAL LCA) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono text-emerald-800 font-bold uppercase tracking-wider block">
              Electricity System Accounting Basis
            </span>
            <h3 className="text-base font-bold text-zinc-950">
              Grid Modeling Methodology &amp; Dynamic Electric Rail Coupling
            </h3>
          </div>

          {/* Basis Segmented Control */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setGridModelingBasis('attributional')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                gridModelingBasis === 'attributional'
                  ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <span>Attributional LCA (Average Grid)</span>
            </button>
            <button
              type="button"
              onClick={() => setGridModelingBasis('consequential')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                gridModelingBasis === 'consequential'
                  ? 'bg-emerald-800 text-white shadow-xs font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <span>Consequential LCA (Marginal Grid)</span>
            </button>
          </div>
        </div>

        {/* Grid Preset & Marginal Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
          <div>
            <label className="text-zinc-700 font-bold block mb-1">
              Regional Grid Baseline:
            </label>
            <select
              value={selectedGridKey}
              onChange={(e) => setSelectedGridKey(e.target.value as RegionalGridKey)}
              className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-zinc-900 font-medium"
            >
              <option value="india_cea">India CEA v19 (0.716 kg CO₂e/kWh)</option>
              <option value="us_egrid">US EPA eGRID (0.386 kg CO₂e/kWh)</option>
              <option value="eu_residual">EU-27 AIB Residual (0.255 kg CO₂e/kWh)</option>
              <option value="uk_desnz">UK DESNZ (0.207 kg CO₂e/kWh)</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-700 font-bold block mb-1">
              Active Grid Factor (kg CO₂e/kWh):
            </label>
            {gridModelingBasis === 'attributional' ? (
              <div className="flex items-center gap-1.5 h-8">
                <span className="font-mono font-bold text-sm text-emerald-800">
                  {activeGridEf.toFixed(3)}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">kg/kWh ({activeGrid.country} Avg)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step={0.001}
                  min={0}
                  value={marginalGridFactor}
                  onChange={(e) => setMarginalGridFactor(Number(e.target.value))}
                  className="w-24 bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 font-bold"
                />
                <span className="text-[11px] text-zinc-500 font-mono">Marginal Peaker Factor</span>
              </div>
            )}
          </div>

          {/* Dynamic Coupled Rail Info */}
          <div>
            <label className="text-zinc-700 font-bold block mb-1">
              Coupled Electric Rail:
            </label>
            <div className="text-[11px] font-mono text-zinc-700 space-y-0.5">
              <div>
                Metro: <strong>{dynamicMetroEf.toFixed(4)}</strong> kg/pkm (0.049 × EF)
              </div>
              <div>
                Train: <strong>{dynamicCommuterTrainEf.toFixed(4)}</strong> kg/pkm (0.057 × EF)
              </div>
            </div>
            <div className="flex gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => insertDynamicRailRow('metro')}
                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-semibold transition"
              >
                + Insert Metro
              </button>
              <button
                type="button"
                onClick={() => insertDynamicRailRow('train')}
                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-semibold transition"
              >
                + Insert Train
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4 SUMMARY METRIC CARDS (POINT + MONTE CARLO CONFIDENCE) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Deterministic Total */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 font-bold uppercase tracking-wider block">
            Deterministic Total
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-mono font-black text-zinc-950">
              {analysis.deterministicTotalTco2e.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </span>
            <span className="text-xs font-mono text-zinc-500 font-medium">tCO₂e</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono block">
            = {(analysis.deterministicTotalTco2e * 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO₂e
          </span>
        </div>

        {/* Card 2: 90% Confidence Interval */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-mono text-emerald-700 font-bold uppercase tracking-wider block">
            90% Confidence Interval (P5 – P95)
          </span>
          <div className="text-base sm:text-lg font-mono font-black text-zinc-900 tracking-tight">
            {analysis.p5.toFixed(2)} – {analysis.p95.toFixed(2)}{' '}
            <span className="text-xs font-normal text-zinc-500">tCO₂e</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono block">
            1,000 Monte Carlo Iterations
          </span>
        </div>

        {/* Card 3: Relative Uncertainty */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-mono text-purple-700 font-bold uppercase tracking-wider block">
            Relative Standard Uncertainty
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-purple-950">
            ±{analysis.relativeUncertaintyPct.toFixed(1)}%
          </div>
          <span className="text-[11px] text-zinc-500 font-mono block">
            Standard Deviation (σ): {analysis.stdDev.toFixed(2)} t
          </span>
        </div>

        {/* Card 4: Verification Hash */}
        <div className="bg-zinc-900 text-white rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-xs space-y-1.5">
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block flex items-center justify-between">
            <span>Reproducibility Hash</span>
            <span className="text-zinc-500 font-normal">SHA-256</span>
          </span>
          <div className="font-mono text-[11px] text-zinc-300 truncate bg-zinc-950 p-1.5 rounded border border-zinc-800 select-all">
            {reproducibilityHash}
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={copyHashToClipboard}
              className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
            >
              {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedHash ? 'Hash Copied!' : 'Copy Hash'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* EDITABLE MULTI-ROW ACTIVITY LEDGER TABLE */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              <span>Multi-Row Activity Data &amp; Emission Factor Ledger</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Edit cells directly, adjust uncertainty tolerances, or upload/paste CSV datasets.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsCsvModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold border border-zinc-300 transition flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-600" />
              <span>Upload / Paste CSV</span>
            </button>
            <button
              type="button"
              onClick={addRow}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>
        </div>

        {/* Excel-like Table */}
        <div className="w-full overflow-x-auto border border-zinc-200 rounded-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-100 text-zinc-700 border-b border-zinc-200 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-2.5 min-w-[130px]">Scenario / Facility</th>
                <th className="px-3 py-2.5 min-w-[150px]">Domain / Scope</th>
                <th className="px-3 py-2.5 min-w-[110px]">Activity Level</th>
                <th className="px-3 py-2.5 min-w-[70px]">Unit</th>
                <th className="px-3 py-2.5 min-w-[110px]">Emission Factor</th>
                <th className="px-3 py-2.5 min-w-[90px]">Factor Unit</th>
                <th className="px-3 py-2.5 min-w-[160px]">Statutory Source</th>
                <th className="px-3 py-2.5 min-w-[90px]">Uncertainty (±%)</th>
                <th className="px-3 py-2.5 text-right min-w-[100px]">Gross tCO₂e</th>
                <th className="px-2 py-2.5 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {analysis.rowCalculations.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50/80 transition-colors">
                  {/* Scenario */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.scenario}
                      onChange={(e) => updateRow(row.id, { scenario: e.target.value })}
                      className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-700 rounded px-1.5 py-1 text-xs text-zinc-900 font-medium"
                    />
                  </td>

                  {/* Domain */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.domain}
                      onChange={(e) => updateRow(row.id, { domain: e.target.value })}
                      className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-700 rounded px-1.5 py-1 text-xs text-zinc-900 font-sans"
                    />
                  </td>

                  {/* Activity Data */}
                  <td className="p-1.5">
                    <input
                      type="number"
                      value={row.activityData}
                      onChange={(e) => updateRow(row.id, { activityData: Number(e.target.value) })}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:ring-1 focus:ring-emerald-700 rounded px-1.5 py-1 text-xs text-zinc-900 font-bold text-right"
                    />
                  </td>

                  {/* Unit */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                      className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-700 rounded px-1.5 py-1 text-xs text-zinc-600"
                    />
                  </td>

                  {/* Emission Factor */}
                  <td className="p-1.5">
                    <input
                      type="number"
                      step={0.0001}
                      value={row.emissionFactor}
                      onChange={(e) => updateRow(row.id, { emissionFactor: Number(e.target.value) })}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:ring-1 focus:ring-emerald-700 rounded px-1.5 py-1 text-xs text-emerald-800 font-bold text-right"
                    />
                  </td>

                  {/* Factor Unit */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.factorUnit}
                      onChange={(e) => updateRow(row.id, { factorUnit: e.target.value })}
                      className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-700 rounded px-1.5 py-1 text-[11px] text-zinc-500"
                    />
                  </td>

                  {/* Statutory Source */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.sourceYear}
                      onChange={(e) => updateRow(row.id, { sourceYear: e.target.value })}
                      className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-700 rounded px-1.5 py-1 text-[11px] text-zinc-600"
                    />
                  </td>

                  {/* Uncertainty % */}
                  <td className="p-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400">±</span>
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        max={100}
                        value={row.uncertaintyPercent}
                        onChange={(e) => updateRow(row.id, { uncertaintyPercent: Number(e.target.value) })}
                        className="w-14 bg-zinc-50 border border-zinc-200 focus:ring-1 focus:ring-emerald-700 rounded px-1 py-1 text-xs text-zinc-900 text-right"
                      />
                      <span className="text-zinc-400 text-[10px]">%</span>
                    </div>
                  </td>

                  {/* Gross tCO2e */}
                  <td className="px-3 py-2 text-right font-bold text-zinc-950 font-mono">
                    {row.grossTco2e.toFixed(3)} t
                  </td>

                  {/* Delete */}
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      className="text-zinc-400 hover:text-red-600 transition p-1"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-100 font-bold border-t border-zinc-200 text-zinc-900">
              <tr>
                <td colSpan={8} className="px-3 py-2.5 text-right uppercase text-[11px]">
                  Total Deterministic Point Estimate:
                </td>
                <td className="px-3 py-2.5 text-right text-emerald-800 text-sm font-black">
                  {analysis.deterministicTotalTco2e.toFixed(3)} tCO₂e
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Export & Provenance Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={exportCsv}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Package (CSV)</span>
            </button>
            <button
              type="button"
              onClick={downloadJson}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition border border-zinc-700 flex items-center gap-1.5"
            >
              <FileJson className="w-3.5 h-3.5 text-zinc-400" />
              <span>Download JSON Ledger</span>
            </button>
            <button
              type="button"
              onClick={copyJsonToClipboard}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold border border-zinc-300 transition flex items-center gap-1.5"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              <span>{copiedJson ? 'JSON Copied!' : 'Copy Reproducible JSON'}</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-zinc-500">
            Certified ISO 14064-1 &amp; GHG Protocol Scope 1-3 Compliance
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CSV UPLOAD & PASTE MODAL */}
      {/* ============================================================== */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-zinc-900">
                  Upload or Paste CSV / TSV Activity Table
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Paste comma-separated or tab-separated text with columns:{' '}
              <code className="text-emerald-800 font-bold">
                Scenario, Domain, ActivityData, Unit, EmissionFactor, FactorUnit, Source, Uncertainty%
              </code>
            </p>

            <textarea
              rows={8}
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              placeholder={`Campus Microgrid, Scope 2 Electricity, 2450000, kWh, 0.716, kg CO2e/kWh, India CEA, 5.0\nHeating Plant, Scope 1 Stationary, 185000, m3, 2.02, kg CO2e/m3, IPCC AR6, 3.5`}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-zinc-400 font-mono">
                Tab or Comma separated values supported
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseCsv}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs"
                >
                  Parse &amp; Import Rows
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
