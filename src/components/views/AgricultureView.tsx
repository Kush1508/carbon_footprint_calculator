import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import { AgricultureData, LivestockBatch, FertilizerType, RegionalGridPreset } from '../../types';
import { AGRICULTURE_FACTORS, IPCC_AR6_GWP } from '../../engine/factors';
import {
  Wheat,
  Plus,
  Trash2,
  Tractor,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface AgricultureViewProps {
  data: AgricultureData;
  onChange: (updated: Partial<AgricultureData>) => void;
  gridPreset: RegionalGridPreset;
  onOpenAudit: (recordId?: string | null) => void;
}

export function AgricultureView({
  data,
  onChange,
  gridPreset,
  onOpenAudit,
}: AgricultureViewProps) {
  // Add new livestock row
  const handleAddLivestock = () => {
    const newBatch: LivestockBatch = {
      id: `batch-${Date.now()}`,
      animalType: 'dairy_cattle',
      headcount: 10,
    };
    onChange({ livestock: [...data.livestock, newBatch] });
  };

  // Remove livestock row
  const handleRemoveLivestock = (id: string) => {
    onChange({ livestock: data.livestock.filter((b) => b.id !== id) });
  };

  // Update livestock row
  const handleUpdateLivestock = (
    id: string,
    field: keyof LivestockBatch,
    value: any
  ) => {
    onChange({
      livestock: data.livestock.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    });
  };

  const nFraction =
    AGRICULTURE_FACTORS.fertilizerNitrogenFraction[data.syntheticFertilizerType] || 0.46;
  const synthElementalN = Math.round(data.syntheticFertilizerGrossKg * nFraction);
  const totalN = synthElementalN + data.organicManureN_Kg;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Informative Header / Standard Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200/80 gap-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight">
              Agriculture, Forestry & Land Use (AFOLU) Accounting
            </h2>
            <Badge variant="methodology">IPCC 2006 / 2019 Tier 1</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            Biological enteric fermentation, direct agricultural soil N₂O nitrification, and flooded anaerobic paddy dynamics.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenAudit('ag-soil-n2o')}
          className="text-xs shrink-0 self-start sm:self-auto h-8 px-2.5"
        >
          <FileText className="w-3.5 h-3.5 mr-1 text-emerald-700" />
          Trace AFOLU Equations
        </Button>
      </div>

      {/* Category 1: Enteric Fermentation Livestock Repeater */}
      <Card className="border-zinc-200/90 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle>Category 1: Enteric Fermentation Livestock Batches</CardTitle>
                <Badge variant="scope1">IPCC Tier 1 AFOLU</Badge>
              </div>
              <CardDescription>
                Methane (CH₄) generated from ruminant enteric fermentation (GWP = 28 per IPCC AR6).
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLivestock}
              className="text-xs flex items-center gap-1.5 self-start sm:self-auto h-8 px-3 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Livestock Batch
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/5">Animal Classification</TableHead>
                  <TableHead className="w-1/4">Headcount</TableHead>
                  <TableHead>IPCC Factor</TableHead>
                  <TableHead className="text-right">Calculated CH₄</TableHead>
                  <TableHead className="w-12 text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.livestock.map((batch) => {
                  const ef =
                    AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear[batch.animalType] || 50;
                  const co2eKg = batch.headcount * ef * IPCC_AR6_GWP.CH4;
                  const co2eTons = Math.round((co2eKg / 1000) * 100) / 100;

                  return (
                    <TableRow key={batch.id}>
                      <TableCell>
                        <select
                          value={batch.animalType}
                          onChange={(e) =>
                            handleUpdateLivestock(batch.id, 'animalType', e.target.value)
                          }
                          className="w-full text-xs bg-white border border-zinc-200 rounded-md px-2 py-1.5 font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        >
                          <option value="dairy_cattle">Dairy Cow (Lactating Bovine)</option>
                          <option value="beef_cattle">Beef Cattle (Non-Dairy Bovine)</option>
                          <option value="buffalo">Water Buffalo</option>
                          <option value="sheep_goats">Sheep & Goats (Small Ruminants)</option>
                          <option value="swine">Swine / Commercial Pigs</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <div className="w-28 sm:w-32">
                          <Input
                            type="number"
                            min="0"
                            value={batch.headcount}
                            onChange={(e) =>
                              handleUpdateLivestock(
                                batch.id,
                                'headcount',
                                Math.max(0, parseInt(e.target.value) || 0)
                              )
                            }
                            addonRight="head"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-zinc-600 text-xs">
                        {ef} kg/yr
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-zinc-900 text-xs">
                        {co2eTons.toLocaleString()} tCO₂e
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleRemoveLivestock(batch.id)}
                          className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                          title="Remove batch"
                          aria-label="Remove batch"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Equation: Headcount × EF × 28
            </span>
            <Button
              variant="micro"
              onClick={() => onOpenAudit(`ag-enteric-${data.livestock[0]?.id || '1'}`)}
              className="self-start sm:self-auto"
            >
              Verify Livestock Audit Trail
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category 2 & 3: Fertilizers, Rice Paddy, and Diesel Machinery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Category 2: Agricultural Soil & Nitrogen Fertilizers */}
        <Card className="border-zinc-200/90 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                  <Wheat className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <CardTitle className="truncate">Category 2: Soil Nitrous Oxide (N₂O)</CardTitle>
              </div>
              <Badge variant="scope1" className="shrink-0">IPCC Vol 4</Badge>
            </div>
            <CardDescription>
              Direct emissions from microbial nitrification and denitrification of added nitrogen.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 block">
                Synthetic Fertilizer Formulation & Grade
              </label>
              <select
                value={data.syntheticFertilizerType}
                onChange={(e) =>
                  onChange({ syntheticFertilizerType: e.target.value as FertilizerType })
                }
                className="w-full text-xs bg-white border border-zinc-200 rounded-lg px-2.5 sm:px-3 py-2 font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="urea">Urea [CO(NH₂)₂] - 46% N</option>
                <option value="dap">Diammonium Phosphate (DAP) - 18% N</option>
                <option value="ammonium_nitrate">Ammonium Nitrate [NH₄NO₃] - 34% N</option>
                <option value="npk_20_20_20">NPK Complex 20:20:20 - 20% N</option>
                <option value="pure_n">Direct Pure Elemental N (100% N)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 block">
                  Gross Synthetic Fertilizer
                </label>
                <Input
                  type="number"
                  min="0"
                  value={data.syntheticFertilizerGrossKg || ''}
                  onChange={(e) =>
                    onChange({
                      syntheticFertilizerGrossKg: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  addonRight="kg gross"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 block">
                  Organic Manure Nitrogen
                </label>
                <Input
                  type="number"
                  min="0"
                  value={data.organicManureN_Kg || ''}
                  onChange={(e) =>
                    onChange({
                      organicManureN_Kg: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  addonRight="kg N"
                />
              </div>
            </div>

            {/* Stoichiometric N Conversion Box */}
            <div className="rounded-lg bg-zinc-50 border border-zinc-200/80 p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-zinc-600 gap-1">
                <span className="text-[11px] text-zinc-500">Elemental N in Synthetic:</span>
                <span className="font-mono font-medium text-zinc-800">
                  {synthElementalN.toLocaleString()} kg N ({Math.round(nFraction * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-600 gap-1">
                <span className="text-[11px] text-zinc-500">Total Reactive N Applied:</span>
                <span className="font-mono font-semibold text-zinc-950">
                  {totalN.toLocaleString()} kg N
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-200/60 font-mono">
                EF1 = 1.0% N₂O-N × (44/28) × 273 (GWP)
              </p>
            </div>

            <Button
              variant="micro"
              className="w-full justify-between"
              onClick={() => onOpenAudit('ag-soil-n2o')}
            >
              <span>View Bouwman et al. Soil N₂O Model</span>
              <FileText className="w-3 h-3 text-emerald-600" />
            </Button>
          </CardContent>
        </Card>

        {/* Category 3: Rice Paddy Anaerobic Methane & Diesel Machinery */}
        <Card className="border-zinc-200/90 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                  <Tractor className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <CardTitle className="truncate">Category 3: Paddy & Machinery</CardTitle>
              </div>
              <Badge variant="scope1" className="shrink-0">Combustion & CH₄</Badge>
            </div>
            <CardDescription>
              Flooded methanogen dynamics in paddy soils and tractor/pump mobile combustion.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 block">
                Paddy Water Management Regime
              </label>
              <select
                value={data.paddyWaterRegime}
                onChange={(e) =>
                  onChange({ paddyWaterRegime: e.target.value as any })
                }
                className="w-full text-xs bg-white border border-zinc-200 rounded-lg px-2.5 sm:px-3 py-2 font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="continuously_flooded">
                  Continuously Flooded (SF_w = 1.00)
                </option>
                <option value="single_aeration">
                  Single Aeration Mid-Season (SF_w = 0.71)
                </option>
                <option value="alternate_wetting_drying">
                  Alternate Wetting & Drying - AWD (SF_w = 0.48)
                </option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 block">
                  Cultivation Area
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={data.floodedPaddyHectares || ''}
                  onChange={(e) =>
                    onChange({
                      floodedPaddyHectares: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  addonRight="Hectares"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 block">
                  Flooding Duration
                </label>
                <Input
                  type="number"
                  min="0"
                  value={data.floodedPaddyDays || ''}
                  onChange={(e) =>
                    onChange({
                      floodedPaddyDays: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  addonRight="Days"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-zinc-700 flex items-center justify-between gap-1">
                <span>Tractor & Pump Diesel</span>
                <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">0.038 GJ/L</span>
              </label>
              <Input
                type="number"
                min="0"
                step="50"
                value={data.machineryDieselLiters || ''}
                onChange={(e) =>
                  onChange({
                    machineryDieselLiters: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                addonRight="Liters"
              />
            </div>

            <Button
              variant="micro"
              className="w-full justify-between"
              onClick={() => onOpenAudit('ag-paddy-rice')}
            >
              <span>View IPCC Rice CH₄ & Machinery Fuel Equation</span>
              <FileText className="w-3 h-3 text-emerald-600" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
