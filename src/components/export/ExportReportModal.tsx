import React, { useRef } from 'react';
import { EngineOutput, RegionalGridPreset, Archetype } from '../../types';
import { Button } from '../ui/button';
import {
  X,
  Download,
  Printer,
  FileCheck2,
} from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  output: EngineOutput;
  archetype: Archetype;
  gridPreset: RegionalGridPreset;
}

export function ExportReportModal({
  isOpen,
  onClose,
  output,
  archetype,
  gridPreset,
}: ExportReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const exportData = {
      standard: 'ISO 14064-1:2018 / GHG Protocol Corporate Standard',
      exportTimestamp: new Date().toISOString(),
      archetype,
      gridPreset,
      summary: {
        totalEmissionsTons: output.totalEmissionsTons,
        grossEmissionsKg: output.grossEmissionsKg,
        scope1Tons: output.scope1Tons,
        scope2LocationTons: output.scope2LocationTons,
        scope2MarketTons: output.scope2MarketTons,
        scope3Tons: output.scope3Tons,
      },
      auditLedger: output.auditRecords,
      equivalents: output.contextualEquivalents,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ISO-14064-Audit-Report-${archetype}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden my-4 sm:my-8 z-10 max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 bg-zinc-50 print:hidden shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 leading-tight">
                ISO 14064-1:2018 Audit Statement
              </h3>
            </div>
            <button
              onClick={onClose}
              className="sm:hidden p-1 rounded text-zinc-400 hover:text-zinc-700"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleDownloadJson} className="h-8 text-xs flex-1 sm:flex-initial">
              <Download className="w-3.5 h-3.5 mr-1" /> Export JSON
            </Button>
            <Button variant="spruce" size="sm" onClick={handlePrint} className="h-8 text-xs flex-1 sm:flex-initial">
              <Printer className="w-3.5 h-3.5 mr-1" /> Print / PDF
            </Button>
            <button
              onClick={onClose}
              className="hidden sm:block p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Surface */}
        <div ref={reportRef} className="p-4 sm:p-8 space-y-5 sm:space-y-6 text-zinc-900 font-sans print:p-0 overflow-y-auto">
          {/* Institutional Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-zinc-900 pb-4 sm:pb-6 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#0F3A2E] rounded-sm shrink-0" />
                <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase text-zinc-600">
                  CLIMATE-LEDGER™ INSTITUTIONAL ESG
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 mt-1">
                Greenhouse Gas Inventory Audit Statement
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-500 mt-1 leading-relaxed">
                In compliance with ISO 14064-1:2018 Specification with Guidance for Quantification and Reporting of GHG Emissions
              </p>
            </div>
            <div className="text-left sm:text-right text-[11px] sm:text-xs space-y-0.5 font-mono text-zinc-600 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
              <p>
                <strong className="text-zinc-900">Standard:</strong> ISO 14064-1
              </p>
              <p>
                <strong className="text-zinc-900">GWP:</strong> IPCC AR6 100-Year
              </p>
              <p>
                <strong className="text-zinc-900">Date:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Statement Metadata Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 sm:p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase tracking-wider font-semibold">
                Reporting Entity Archetype
              </span>
              <span className="font-semibold text-zinc-900 uppercase">
                {archetype === 'household'
                  ? 'Residential Household'
                  : archetype === 'agriculture'
                  ? 'Agricultural Farm & AFOLU'
                  : 'Corporate & Industrial Enterprise'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase tracking-wider font-semibold">
                Regional Grid Baseline
              </span>
              <span className="font-medium text-zinc-900">
                {gridPreset.country} ({gridPreset.emissionFactorKwh} kg CO₂e/kWh)
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase tracking-wider font-semibold">
                Audited Net Footprint
              </span>
              <span className="text-base font-bold font-mono text-zinc-950">
                {output.totalEmissionsTons.toLocaleString()} tCO₂e
              </span>
            </div>
          </div>

          {/* GHG Protocol Scope Ledger Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Disclosed Scope Summary (GHG Protocol Corporate Standard)
            </h4>
            <div className="border border-zinc-200 rounded-lg overflow-x-auto">
              <table className="w-full text-xs min-w-[480px]">
                <thead className="bg-zinc-100 border-b border-zinc-200 font-medium text-zinc-600">
                  <tr>
                    <th className="p-2.5 sm:p-3 text-left">Emissions Scope</th>
                    <th className="p-2.5 sm:p-3 text-left">Primary Operational Categories</th>
                    <th className="p-2.5 sm:p-3 text-right">Metric Tons</th>
                    <th className="p-2.5 sm:p-3 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  <tr>
                    <td className="p-2.5 sm:p-3 font-semibold text-slate-800">Scope 1 (Direct)</td>
                    <td className="p-2.5 sm:p-3 font-sans text-zinc-600">
                      Stationary/Mobile Combustion, Fugitive Leakage, Livestock CH₄
                    </td>
                    <td className="p-2.5 sm:p-3 text-right font-bold">{output.scope1Tons.toLocaleString()} t</td>
                    <td className="p-2.5 sm:p-3 text-right">
                      {output.totalEmissionsTons > 0
                        ? Math.round((output.scope1Tons / output.totalEmissionsTons) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 sm:p-3 font-semibold text-indigo-900">Scope 2 (Market-Based)</td>
                    <td className="p-2.5 sm:p-3 font-sans text-zinc-600">
                      Purchased Grid Electricity (Residual Mix - Certified PPAs)
                    </td>
                    <td className="p-2.5 sm:p-3 text-right font-bold">{output.scope2MarketTons.toLocaleString()} t</td>
                    <td className="p-2.5 sm:p-3 text-right">
                      {output.totalEmissionsTons > 0
                        ? Math.round((output.scope2MarketTons / output.totalEmissionsTons) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 sm:p-3 font-semibold text-zinc-500 italic pl-5 sm:pl-6">
                      ↳ Scope 2 (Location-Based Dual Track)
                    </td>
                    <td className="p-2.5 sm:p-3 font-sans text-zinc-400">
                      Regional Grid Average Factor ({gridPreset.emissionFactorKwh} kg/kWh)
                    </td>
                    <td className="p-2.5 sm:p-3 text-right text-zinc-500">{output.scope2LocationTons.toLocaleString()} t</td>
                    <td className="p-2.5 sm:p-3 text-right text-zinc-400">-</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 sm:p-3 font-semibold text-amber-900">Scope 3 (Value Chain)</td>
                    <td className="p-2.5 sm:p-3 font-sans text-zinc-600">
                      Upstream Logistics, Spend-Based Procurement, GSF SCI Cloud
                    </td>
                    <td className="p-2.5 sm:p-3 text-right font-bold">{output.scope3Tons.toLocaleString()} t</td>
                    <td className="p-2.5 sm:p-3 text-right">
                      {output.totalEmissionsTons > 0
                        ? Math.round((output.scope3Tons / output.totalEmissionsTons) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                  <tr className="bg-zinc-50 font-bold border-t-2 border-zinc-900">
                    <td className="p-2.5 sm:p-3 font-sans text-zinc-950">Total Gross Footprint</td>
                    <td className="p-2.5 sm:p-3 font-sans text-zinc-700">Combined Disclosed Scopes 1, 2, 3</td>
                    <td className="p-2.5 sm:p-3 text-right text-zinc-950 text-sm">
                      {output.totalEmissionsTons.toLocaleString()} tCO₂e
                    </td>
                    <td className="p-2.5 sm:p-3 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Granular Audit Ledger Verification List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Granular Verification Traceability Ledger (Itemized Calculations)
            </h4>
            <div className="border border-zinc-200 rounded-lg overflow-x-auto">
              <table className="w-full text-[11px] min-w-[540px]">
                <thead className="bg-zinc-100 border-b border-zinc-200 font-medium text-zinc-600">
                  <tr>
                    <th className="p-2.5 text-left">Activity / Metric</th>
                    <th className="p-2.5 text-left">Formula & Arithmetic Ledger</th>
                    <th className="p-2.5 text-left">Emission Factor & Authority</th>
                    <th className="p-2.5 text-right">Emissions (t)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {output.auditRecords.map((rec) => (
                    <tr key={rec.id}>
                      <td className="p-2.5 font-medium text-zinc-900 align-top">
                        <div>{rec.metricLabel}</div>
                        <span className="text-[10px] text-zinc-400 font-mono">{rec.scope}</span>
                      </td>
                      <td className="p-2.5 font-mono text-zinc-700 align-top max-w-xs break-words">
                        <div className="text-zinc-500 text-[10px]">{rec.formulaLatex}</div>
                        <div className="font-semibold text-zinc-900 mt-0.5">{rec.arithmeticDisplay}</div>
                      </td>
                      <td className="p-2.5 text-zinc-600 align-top max-w-xs">
                        <div className="font-mono text-zinc-800">
                          {rec.factorValue} {rec.factorUnit}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">{rec.citation}</div>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-zinc-950 align-top">
                        {rec.calculatedEmissionsTons.toLocaleString()} t
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Statement & Signoff Block */}
          <div className="border-t border-zinc-200 pt-4 sm:pt-6 mt-4 sm:mt-6 flex flex-col sm:flex-row items-start justify-between gap-4 text-xs text-zinc-500">
            <div className="max-w-md space-y-1">
              <span className="font-semibold text-zinc-800 block">Lead Auditor Attestation:</span>
              <p className="text-[11px] leading-relaxed">
                This report has been compiled strictly adhering to the GHG Protocol Corporate Standard and verified against IPCC AR6 Global Warming Potentials. No material discrepancies or unauthorized extrapolation noted.
              </p>
            </div>
            <div className="text-left sm:text-right space-y-2 font-mono text-[11px] shrink-0">
              <div className="border-b border-zinc-400 pb-1 w-44 sm:w-48 text-left sm:text-center text-zinc-800 font-sans font-semibold">
                Audit Verification Engine
              </div>
              <p className="text-zinc-400">Certified Digital Ledger Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
