import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { HouseholdData, RegionalGridPreset } from '../../types';
import {
  Zap,
  Droplet,
  Trash2,
  HelpCircle,
  Trees,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface HouseholdViewProps {
  data: HouseholdData;
  onChange: (updated: Partial<HouseholdData>) => void;
  gridPreset: RegionalGridPreset;
  onOpenAudit: (recordId?: string | null) => void;
}

export function HouseholdView({
  data,
  onChange,
  gridPreset,
  onOpenAudit,
}: HouseholdViewProps) {
  const weeklyWaste = data.wasteKgWeekly;
  const monthlyWaste = Math.round(weeklyWaste * 4.333);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Informative Header / Standard Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200/80 gap-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight">
              Domestic Household Emissions Accounting
            </h2>
            <Badge variant="methodology">IPCC Vol 5 & GHG Protocol</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            Individual residential utility activity mapped against regional grid coefficients ({gridPreset.label}).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenAudit('hh-elec-grid')}
          className="text-xs shrink-0 self-start sm:self-auto h-8 px-2.5"
        >
          <FileText className="w-3.5 h-3.5 mr-1 text-emerald-700" />
          Trace Household Ledger
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Input Group 1: Electricity */}
        <Card className="border-zinc-200/90 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200/60 shrink-0">
                  <Zap className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <CardTitle className="truncate">Grid Electricity</CardTitle>
              </div>
              <Badge variant="scope2" className="shrink-0">Scope 2</Badge>
            </div>
            <CardDescription>
              Purchased metered power from regional transmission utility.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 flex items-center justify-between gap-1">
                <span>Monthly Metered Power</span>
                <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">Metered total</span>
              </label>
              <Input
                type="number"
                min="0"
                step="10"
                value={data.electricityKwhMonthly || ''}
                onChange={(e) =>
                  onChange({
                    electricityKwhMonthly: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                addonRight="kWh/month"
              />
            </div>

            {/* Scientific Grid Factor Details */}
            <div className="rounded-lg bg-zinc-50 border border-zinc-200/70 p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-zinc-600 gap-1">
                <span className="text-[11px] text-zinc-500">Active Grid Factor:</span>
                <span className="font-mono font-semibold text-zinc-900 shrink-0">
                  {gridPreset.emissionFactorKwh} kg/kWh
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 gap-1">
                <span>Calculated Direct Monthly:</span>
                <span className="font-mono text-zinc-700 font-medium shrink-0">
                  {Math.round(data.electricityKwhMonthly * gridPreset.emissionFactorKwh).toLocaleString()} kg CO₂e
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-200/60 italic truncate">
                Ref: {gridPreset.sourceAuthority}
              </p>
            </div>

            <Button
              variant="micro"
              className="w-full justify-between"
              onClick={() => onOpenAudit('hh-elec-grid')}
            >
              <span>View Grid Audit Formula</span>
              <FileText className="w-3 h-3 text-emerald-600" />
            </Button>
          </CardContent>
        </Card>

        {/* Input Group 2: Water & Wastewater */}
        <Card className="border-zinc-200/90 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200/60 shrink-0">
                  <Droplet className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <CardTitle className="truncate">Water & Sanitation</CardTitle>
              </div>
              <Badge variant="scope3" className="shrink-0">Scope 3</Badge>
            </div>
            <CardDescription>
              Cradle-to-tap potable supply pumping and municipal sewage treatment.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 flex items-center justify-between gap-1">
                <span>Monthly Water Volume</span>
                <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">
                  ~{(data.waterM3Monthly * 1000).toLocaleString()} L
                </span>
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={data.waterM3Monthly || ''}
                onChange={(e) =>
                  onChange({
                    waterM3Monthly: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                addonRight="m³/month"
              />
            </div>

            {/* Checkbox: Sewage treatment */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 cursor-pointer hover:bg-zinc-100/60 transition-colors">
              <input
                type="checkbox"
                checked={data.hasSewageTreatment}
                onChange={(e) => onChange({ hasSewageTreatment: e.target.checked })}
                className="mt-0.5 rounded border-zinc-300 text-[#0F3A2E] focus:ring-zinc-400 shrink-0"
              />
              <div className="text-xs min-w-0">
                <span className="font-medium text-zinc-800 block leading-snug">
                  Municipal Wastewater Treatment
                </span>
                <span className="text-[11px] text-zinc-500 leading-tight block mt-0.5">
                  Adds 0.57 kg CO₂e/m³ for aeration & sludge treatment.
                </span>
              </div>
            </label>

            <div className="rounded-lg bg-zinc-50 border border-zinc-200/70 p-3 space-y-1 text-xs">
              <div className="flex items-center justify-between text-zinc-600 gap-1">
                <span className="text-[11px] text-zinc-500">Supply Pumping Factor:</span>
                <span className="font-mono text-zinc-800">0.28 kg/m³</span>
              </div>
              <div className="flex items-center justify-between text-zinc-600 gap-1">
                <span className="text-[11px] text-zinc-500">Wastewater Treatment:</span>
                <span className="font-mono text-zinc-800">
                  {data.hasSewageTreatment ? '0.57 kg/m³' : '0.00 kg/m³'}
                </span>
              </div>
            </div>

            <Button
              variant="micro"
              className="w-full justify-between"
              onClick={() => onOpenAudit('hh-water-treatment')}
            >
              <span>View Water LCA Equation</span>
              <FileText className="w-3 h-3 text-emerald-600" />
            </Button>
          </CardContent>
        </Card>

        {/* Input Group 3: Solid Municipal Waste */}
        <Card className="border-zinc-200/90 shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/60 shrink-0">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <CardTitle className="truncate">Municipal Waste</CardTitle>
              </div>
              <Badge variant="scope1" className="shrink-0">Scope 1</Badge>
            </div>
            <CardDescription>
              IPCC Vol 5 First Order Decay methane emissions from discarded materials.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 flex items-center justify-between gap-1">
                <span>Weekly Solid Waste Mass</span>
                <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">
                  ≈ {monthlyWaste} kg/month
                </span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={data.wasteKgWeekly || ''}
                onChange={(e) =>
                  onChange({
                    wasteKgWeekly: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                addonRight="kg/week"
              />
            </div>

            {/* Disposal Route Radio Group */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-700 block">
                Disposal Stream & Treatment
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  {
                    id: 'landfill',
                    label: 'Landfill / Mixed (0.52 kg CO₂e/kg)',
                    desc: 'Anaerobic methanogenesis with fugitive escape',
                  },
                  {
                    id: 'compost',
                    label: 'Segregated Composting (0.10 kg CO₂e/kg)',
                    desc: 'Aerobic biological composting with low CH₄',
                  },
                  {
                    id: 'recycling',
                    label: 'Dry Recycling Stream (0.04 kg CO₂e/kg)',
                    desc: 'Sorting and circular material reprocessing',
                  },
                ].map((route) => (
                  <label
                    key={route.id}
                    className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      data.wasteRoute === route.id
                        ? 'border-zinc-900 bg-zinc-50'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="wasteRoute"
                      value={route.id}
                      checked={data.wasteRoute === route.id}
                      onChange={() => onChange({ wasteRoute: route.id as any })}
                      className="mt-0.5 text-zinc-900 focus:ring-zinc-400 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-medium text-zinc-900 block leading-tight truncate">
                        {route.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5 leading-tight">
                        {route.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button
              variant="micro"
              className="w-full justify-between"
              onClick={() => onOpenAudit('hh-solid-waste')}
            >
              <span>View IPCC First-Order Decay Formula</span>
              <FileText className="w-3 h-3 text-emerald-600" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
