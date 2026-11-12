import React, { useState } from 'react';
import { Sheet } from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AuditRecord } from '../../types';
import {
  FileCheck2,
  Copy,
  Check,
  Info,
  ShieldCheck,
  Filter,
} from 'lucide-react';

interface AuditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  auditRecords: AuditRecord[];
  selectedRecordId?: string | null;
}

export function AuditSheet({
  isOpen,
  onClose,
  auditRecords,
  selectedRecordId,
}: AuditSheetProps) {
  const [filterScope, setFilterScope] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (record: AuditRecord) => {
    const jsonStr = JSON.stringify(record, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRecords = auditRecords.filter((rec) => {
    if (selectedRecordId) return rec.id === selectedRecordId;
    if (filterScope === 'all') return true;
    return rec.scope.toLowerCase().includes(filterScope.toLowerCase());
  });

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="ISO 14064 & GHG Protocol Audit Ledger"
      description="Traceable arithmetic verification, IPCC AR6 factors, and uncertainty bounds"
      width="max-w-2xl"
    >
      {/* Top Banner */}
      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-3 sm:p-3.5 flex items-start gap-2.5 sm:gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" strokeWidth={1.5} />
        <div className="text-xs text-emerald-900 leading-relaxed min-w-0">
          <p className="font-semibold text-emerald-950">
            Audit-Grade Traceability Guarantee
          </p>
          <p className="mt-0.5 text-emerald-800 text-[11px] sm:text-xs">
            Every calculated value links directly to peer-reviewed emission factors, 
            IPCC AR6 100-year Global Warming Potentials, and ISO 14064-1 uncertainty confidence intervals.
          </p>
        </div>
      </div>

      {/* Scope Filter Buttons */}
      {!selectedRecordId && (
        <div className="flex items-center gap-1.5 pb-1 overflow-x-auto scrollbar-none">
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {['all', 'Scope 1', 'Scope 2', 'Scope 3'].map((scope) => (
            <button
              key={scope}
              onClick={() => setFilterScope(scope)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                filterScope === scope
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {scope === 'all' ? 'All Ledger Items' : scope}
            </button>
          ))}
        </div>
      )}

      {/* Audit Items List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            No active audit calculations found for this filter.
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className={`rounded-xl border transition-all ${
                selectedRecordId === record.id
                  ? 'border-emerald-500 bg-emerald-50/20 shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              } p-3.5 sm:p-4 space-y-3`}
            >
              {/* Record Header - Stacks on small mobile to avoid text squeeze */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        record.scope.includes('Scope 1')
                          ? 'scope1'
                          : record.scope.includes('Scope 2')
                          ? 'scope2'
                          : record.scope.includes('Scope 3')
                          ? 'scope3'
                          : 'removals'
                      }
                      className="text-[10px] sm:text-xs"
                    >
                      {record.scope}
                    </Badge>
                    <span className="text-[10px] text-zinc-400 font-mono truncate">
                      ID: {record.id}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 leading-snug">
                    {record.metricLabel}
                  </h4>
                  <p className="text-[11px] text-zinc-500">{record.category}</p>
                </div>

                <div className="sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                  <span className="block text-sm sm:text-base font-bold font-mono text-zinc-900 tracking-tight">
                    {record.calculatedEmissionsTons.toLocaleString()} tCO₂e
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-zinc-500">
                    ({record.calculatedEmissionsKg.toLocaleString()} kg CO₂e)
                  </span>
                </div>
              </div>

              {/* Exact Formula & Arithmetic Breakdown */}
              <div className="rounded-lg bg-zinc-50 border border-zinc-200/80 p-2.5 sm:p-3 space-y-2 font-mono text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-sans font-semibold">
                    Methodology Equation (LaTeX)
                  </span>
                  <div className="text-zinc-800 bg-white p-2 rounded border border-zinc-200/70 font-mono text-[11px] sm:text-xs mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                    <code>{record.formulaLatex}</code>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-sans font-semibold">
                    Substituted Arithmetic Ledger
                  </span>
                  <div className="text-emerald-950 font-semibold bg-emerald-50/60 p-2 rounded border border-emerald-200/70 font-mono text-[11px] sm:text-xs mt-1 overflow-x-auto break-words">
                    {record.arithmeticDisplay} = {record.calculatedEmissionsKg.toLocaleString()} kg CO₂e
                  </div>
                </div>
              </div>

              {/* Factor Metadata Grid */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-400 block text-[10px]">GWP Standard</span>
                  <span className="font-medium text-zinc-800 truncate block">{record.gwpStandard}</span>
                </div>
                <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-400 block text-[10px]">Uncertainty Band</span>
                  <span className="font-mono font-medium text-zinc-800 truncate block">
                    {record.uncertaintyConfidence}
                  </span>
                </div>
                <div className="p-2 rounded bg-zinc-50 border border-zinc-100 xs:col-span-2 sm:col-span-1">
                  <span className="text-zinc-400 block text-[10px]">Activity Quantity</span>
                  <span className="font-mono font-medium text-zinc-800 truncate block">
                    {record.activityAmount.toLocaleString()} {record.activityUnit}
                  </span>
                </div>
              </div>

              {/* Citation & Standard */}
              <div className="text-xs space-y-1 pt-1.5 border-t border-zinc-100">
                <div className="flex items-start gap-1.5 text-zinc-600">
                  <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed break-words">
                    <strong className="text-zinc-700">Source:</strong> {record.citation}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 pl-5 break-words">
                  <strong className="text-zinc-700">Protocol:</strong>{' '}
                  {record.methodologyStandard}
                </div>
                {record.notes && (
                  <div className="text-[10px] sm:text-[11px] text-zinc-500 pl-5 italic break-words">
                    Note: {record.notes}
                  </div>
                )}
              </div>

              {/* Micro Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 gap-2 flex-wrap">
                <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                  <FileCheck2 className="w-3 h-3 text-emerald-600 shrink-0" /> ISO 14064-1 Verified
                </span>
                <Button
                  variant="micro"
                  onClick={() => handleCopy(record)}
                  className="flex items-center gap-1 text-[10px] h-7 px-2"
                >
                  {copiedId === record.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied JSON
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Export Ledger Entry
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Sheet>
  );
}
