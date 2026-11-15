import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import {
  CorporateData,
  RegionalGridPreset,
  Scope1StationaryItem,
  Scope1RefrigerantItem,
  Scope3FreightItem,
  Scope3SpendItem,
  StationaryFuelType,
  RefrigerantType,
  FreightMode,
  EeioSector,
} from '../../types';
import {
  FUEL_FACTORS,
  REFRIGERANT_GWP,
  FREIGHT_FACTORS,
  EEIO_FACTORS,
} from '../../engine/factors';
import {
  Flame,
  Zap,
  Truck,
  Cpu,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';

interface CorporateViewProps {
  data: CorporateData;
  onChange: (updated: Partial<CorporateData>) => void;
  gridPreset: RegionalGridPreset;
  onOpenAudit: (recordId?: string | null) => void;
}

export function CorporateView({
  data,
  onChange,
  gridPreset,
  onOpenAudit,
}: CorporateViewProps) {
  // Fuel handlers
  const handleAddFuel = () => {
    const newItem: Scope1StationaryItem = {
      id: `fuel-${Date.now()}`,
      fuelType: 'diesel',
      volume: 1000,
    };
    onChange({ fuels: [...data.fuels, newItem] });
  };

  const handleRemoveFuel = (id: string) => {
    onChange({ fuels: data.fuels.filter((f) => f.id !== id) });
  };

  const handleUpdateFuel = (id: string, field: keyof Scope1StationaryItem, value: any) => {
    onChange({
      fuels: data.fuels.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    });
  };

  // Refrigerant handlers
  const handleAddRefrigerant = () => {
    const newItem: Scope1RefrigerantItem = {
      id: `ref-${Date.now()}`,
      refrigerantType: 'r410a',
      kgLeaked: 5,
    };
    onChange({ refrigerants: [...data.refrigerants, newItem] });
  };

  const handleRemoveRefrigerant = (id: string) => {
    onChange({ refrigerants: data.refrigerants.filter((r) => r.id !== id) });
  };

  const handleUpdateRefrigerant = (
    id: string,
    field: keyof Scope1RefrigerantItem,
    value: any
  ) => {
    onChange({
      refrigerants: data.refrigerants.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    });
  };

  // Freight handlers
  const handleAddFreight = () => {
    const newItem: Scope3FreightItem = {
      id: `fr-${Date.now()}`,
      mode: 'truck_heavy',
      massTonnes: 15,
      distanceKm: 500,
    };
    onChange({ freightLogs: [...data.freightLogs, newItem] });
  };

  const handleRemoveFreight = (id: string) => {
    onChange({ freightLogs: data.freightLogs.filter((item) => item.id !== id) });
  };

  const handleUpdateFreight = (
    id: string,
    field: keyof Scope3FreightItem,
    value: any
  ) => {
    onChange({
      freightLogs: data.freightLogs.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  // Spend handlers
  const handleAddSpend = () => {
    const newItem: Scope3SpendItem = {
      id: `sp-${Date.now()}`,
      sector: 'software_cloud',
      spendUsd: 25000,
    };
    onChange({ procurementSpends: [...data.procurementSpends, newItem] });
  };

  const handleRemoveSpend = (id: string) => {
    onChange({ procurementSpends: data.procurementSpends.filter((s) => s.id !== id) });
  };

  const handleUpdateSpend = (
    id: string,
    field: keyof Scope3SpendItem,
    value: any
  ) => {
    onChange({
      procurementSpends: data.procurementSpends.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  // Dual-Track Scope 2 metrics preview
  const locTons = (data.gridElectricityMwhAnnual * 1000 * gridPreset.emissionFactorKwh) / 1000;
  const residualMwh = Math.max(
    0,
    data.gridElectricityMwhAnnual - data.contractedGreenPpaMwhAnnual
  );
  const mktTons = (residualMwh * 1000 * gridPreset.residualFactorKwh) / 1000;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Informative Header / Standard Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200/80 gap-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight">
              Corporate & Industrial GHG Accounting Suite
            </h2>
            <Badge variant="methodology">GHG Protocol Corporate Standard & ISO 14064</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            Institutional financial ledger format supporting dual Scope 2 reporting, EEIO procurement spend, and GSF SCI compute intensity.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenAudit('corp-scope2-market')}
          className="text-xs shrink-0 self-start sm:self-auto h-8 px-2.5"
        >
          <FileText className="w-3.5 h-3.5 mr-1 text-emerald-700" />
          Trace Corporate Ledger
        </Button>
      </div>

      {/* ========================================================= */}
      {/* 1. SCOPE 1 DIRECT COMBUSTION & FUGITIVE MODULE */}
      {/* ========================================================= */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 shrink-0">
              <Flame className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                Scope 1: Direct Combustion & Refrigerant Leaks
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 hidden sm:block">
                Stationary generators, natural gas boilers, vehicle fleets, and HVAC chiller gas top-ups.
              </p>
            </div>
          </div>
          <Badge variant="scope1" className="shrink-0">Direct Scope 1</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stationary Fuels Table */}
          <Card className="border-zinc-200/90 shadow-sm">
            <CardHeader className="py-2.5 sm:py-3 px-3.5 sm:px-4 flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xs uppercase tracking-wider text-zinc-700">
                  Stationary & Fleet Fuels
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-[11px]">
                  Calorific combustion factor (NCV × EF)
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddFuel}
                className="h-7 text-xs px-2 shrink-0"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Fuel
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[360px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead className="text-right">Tons CO₂e</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.fuels.map((item) => {
                      const factor = FUEL_FACTORS[item.fuelType] || FUEL_FACTORS.diesel;
                      const tons = Math.round(((item.volume * factor.efKgPerUnit) / 1000) * 100) / 100;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <select
                              value={item.fuelType}
                              onChange={(e) =>
                                handleUpdateFuel(item.id, 'fuelType', e.target.value as StationaryFuelType)
                              }
                              className="text-xs bg-white border border-zinc-200 rounded px-2 py-1 font-medium w-full"
                            >
                              <option value="diesel">Diesel (Generators / Trucks)</option>
                              <option value="natural_gas">Natural Gas (Boilers / Heat)</option>
                              <option value="lpg">LPG / Propane</option>
                              <option value="petrol">Motor Gasoline / Petrol</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <div className="w-24 sm:w-28">
                              <Input
                                type="number"
                                min="0"
                                value={item.volume}
                                onChange={(e) =>
                                  handleUpdateFuel(item.id, 'volume', Math.max(0, parseFloat(e.target.value) || 0))
                                }
                                addonRight={factor.unit}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-zinc-900 text-xs">
                            {tons.toLocaleString()} t
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleRemoveFuel(item.id)}
                              className="text-zinc-400 hover:text-rose-600 p-1"
                              aria-label="Remove fuel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Refrigerants Table */}
          <Card className="border-zinc-200/90 shadow-sm">
            <CardHeader className="py-2.5 sm:py-3 px-3.5 sm:px-4 flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xs uppercase tracking-wider text-zinc-700">
                  Fugitive Refrigerant Losses
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-[11px]">
                  HVAC top-up gas mass × IPCC AR6 GWP
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRefrigerant}
                className="h-7 text-xs px-2 shrink-0"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Gas
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[360px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Refrigerant Blend</TableHead>
                      <TableHead>Mass Lost</TableHead>
                      <TableHead className="text-right">Tons CO₂e</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.refrigerants.map((item) => {
                      const gwp = REFRIGERANT_GWP[item.refrigerantType] || 2000;
                      const tons = Math.round(((item.kgLeaked * gwp) / 1000) * 100) / 100;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <select
                              value={item.refrigerantType}
                              onChange={(e) =>
                                handleUpdateRefrigerant(
                                  item.id,
                                  'refrigerantType',
                                  e.target.value as RefrigerantType
                                )
                              }
                              className="text-xs bg-white border border-zinc-200 rounded px-2 py-1 font-medium w-full"
                            >
                              <option value="r410a">R-410A (GWP = 2,256)</option>
                              <option value="r134a">R-134a (GWP = 1,530)</option>
                              <option value="r32">R-32 (GWP = 771)</option>
                              <option value="r404a">R-404A (GWP = 4,728)</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <div className="w-24 sm:w-28">
                              <Input
                                type="number"
                                min="0"
                                value={item.kgLeaked}
                                onChange={(e) =>
                                  handleUpdateRefrigerant(
                                    item.id,
                                    'kgLeaked',
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  )
                                }
                                addonRight="kg"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-zinc-900 text-xs">
                            {tons.toLocaleString()} t
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleRemoveRefrigerant(item.id)}
                              className="text-zinc-400 hover:text-rose-600 p-1"
                              aria-label="Remove refrigerant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SCOPE 2 DUAL-TRACK REPORTING PANEL (PERSEFONI/GHG PROTOCOL) */}
      {/* ========================================================= */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
              <Zap className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                Scope 2: Mandatory Dual-Track Reporting Ledger
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 hidden sm:block">
                GHG Protocol Scope 2 Guidance requires disclosing BOTH Location-Based and Market-Based accounting.
              </p>
            </div>
          </div>
          <Badge variant="scope2" className="shrink-0">Dual Scope 2</Badge>
        </div>

        {/* Global Consumption Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-zinc-50 p-3.5 sm:p-4 rounded-xl border border-zinc-200/80">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 block">
              Annual Total Grid Electricity Purchased
            </label>
            <Input
              type="number"
              min="0"
              value={data.gridElectricityMwhAnnual || ''}
              onChange={(e) =>
                onChange({
                  gridElectricityMwhAnnual: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              addonRight="MWh/year"
            />
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono block">
              ≈ {(data.gridElectricityMwhAnnual * 1000).toLocaleString()} kWh
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 block">
              Certified Renewable PPA / Green Tariff / RECs
            </label>
            <Input
              type="number"
              min="0"
              max={data.gridElectricityMwhAnnual}
              value={data.contractedGreenPpaMwhAnnual || ''}
              onChange={(e) =>
                onChange({
                  contractedGreenPpaMwhAnnual: Math.max(
                    0,
                    parseFloat(e.target.value) || 0
                  ),
                })
              }
              addonRight="Green MWh"
            />
            <span className="text-[10px] sm:text-[11px] text-emerald-700 font-mono block truncate">
              Direct Zero-Emission Contractual Instrument (Market Offset)
            </span>
          </div>
        </div>

        {/* Two Parallel Cards: Location vs Market */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location-Based Method */}
          <Card className="border-zinc-200/90 shadow-sm bg-white flex flex-col justify-between">
            <CardHeader className="border-b border-zinc-100">
              <div className="flex items-center justify-between gap-1">
                <CardTitle className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                  Location-Based Method
                </CardTitle>
                <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">Physical Grid Mix</Badge>
              </div>
              <CardDescription>
                Calculates emissions based on the average carbon intensity of the local grid where power is consumed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-baseline justify-between border-b border-zinc-100 pb-2">
                <span className="text-xs text-zinc-500">Calculated Footprint:</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-900">
                  {locTons.toLocaleString()} <span className="text-xs font-sans text-zinc-500">tCO₂e</span>
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-zinc-600 font-mono">
                <div className="flex items-center justify-between gap-1">
                  <span>Grid Intensity Factor:</span>
                  <span className="font-semibold text-zinc-900">{gridPreset.emissionFactorKwh} kg/kWh</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span>Regional Authority:</span>
                  <span className="truncate max-w-[180px] text-zinc-700">{gridPreset.country}</span>
                </div>
              </div>
              <Button
                variant="micro"
                className="w-full justify-between"
                onClick={() => onOpenAudit('corp-scope2-location')}
              >
                <span>View Location Protocol Trail</span>
                <FileText className="w-3 h-3 text-emerald-600" />
              </Button>
            </CardContent>
          </Card>

          {/* Market-Based Method */}
          <Card className="border-indigo-200/80 shadow-sm bg-gradient-to-b from-white to-indigo-50/20 flex flex-col justify-between">
            <CardHeader className="border-b border-indigo-100">
              <div className="flex items-center justify-between gap-1">
                <CardTitle className="text-xs sm:text-sm font-semibold text-indigo-950 truncate">
                  Market-Based Method
                </CardTitle>
                <Badge variant="scope2" className="shrink-0 text-[10px] sm:text-xs">Contractual Instruments</Badge>
              </div>
              <CardDescription>
                Calculates emissions based on contractual instruments (PPAs, GOs, RECs) and residual mix factors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-baseline justify-between border-b border-indigo-100 pb-2">
                <span className="text-xs text-zinc-500">Calculated Footprint:</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-indigo-950">
                  {mktTons.toLocaleString()} <span className="text-xs font-sans text-zinc-500">tCO₂e</span>
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-zinc-600 font-mono">
                <div className="flex items-center justify-between gap-1">
                  <span>Residual Mix Intensity:</span>
                  <span className="font-semibold text-indigo-900">{gridPreset.residualFactorKwh} kg/kWh</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span>Zero-Carbon PPA Share:</span>
                  <span className="font-semibold text-emerald-700 truncate">
                    {data.contractedGreenPpaMwhAnnual.toLocaleString()} MWh ({(data.gridElectricityMwhAnnual > 0 ? Math.round((data.contractedGreenPpaMwhAnnual / data.gridElectricityMwhAnnual) * 100) : 0)}%)
                  </span>
                </div>
              </div>
              <Button
                variant="micro"
                className="w-full justify-between border-indigo-200 bg-white"
                onClick={() => onOpenAudit('corp-scope2-market')}
              >
                <span>View Market Quality Criteria Trail</span>
                <FileText className="w-3 h-3 text-emerald-600" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SCOPE 3 SUPPLY CHAIN & LOGISTICS MODULE */}
      {/* ========================================================= */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <Truck className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                Scope 3: Upstream Freight Logistics & EEIO Procurement
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 hidden sm:block">
                GLEC-compliant freight routing (Cat 4) and USEEIO spend-based factoring (Cat 1).
              </p>
            </div>
          </div>
          <Badge variant="scope3" className="shrink-0">Scope 3</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Freight Table */}
          <Card className="border-zinc-200/90 shadow-sm">
            <CardHeader className="py-2.5 sm:py-3 px-3.5 sm:px-4 flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xs uppercase tracking-wider text-zinc-700">
                  Upstream Freight (tkm Logistics)
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-[11px]">
                  Mass (t) × Distance (km) × Modal EF
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddFreight}
                className="h-7 text-xs px-2 shrink-0"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Route
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[420px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mode</TableHead>
                      <TableHead>Mass</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead className="text-right">tCO₂e</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.freightLogs.map((item) => {
                      const factor = FREIGHT_FACTORS[item.mode] || FREIGHT_FACTORS.truck_heavy;
                      const tkm = item.massTonnes * item.distanceKm;
                      const tons = Math.round(((tkm * factor.efKgPerTkm) / 1000) * 100) / 100;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <select
                              value={item.mode}
                              onChange={(e) =>
                                handleUpdateFreight(item.id, 'mode', e.target.value as FreightMode)
                              }
                              className="text-xs bg-white border border-zinc-200 rounded px-2 py-1 font-medium w-full"
                            >
                              <option value="truck_heavy">Heavy Truck (&gt;33t)</option>
                              <option value="rail">Freight Rail</option>
                              <option value="air_cargo">Air Freighter</option>
                              <option value="maritime">Container Ship</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <input
                                type="number"
                                min="0"
                                className="w-12 sm:w-14 text-xs font-mono p-1 border rounded"
                                value={item.massTonnes}
                                onChange={(e) =>
                                  handleUpdateFreight(
                                    item.id,
                                    'massTonnes',
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  )
                                }
                              />
                              <span className="text-[10px] text-zinc-400 ml-1">t</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <input
                                type="number"
                                min="0"
                                className="w-14 sm:w-16 text-xs font-mono p-1 border rounded"
                                value={item.distanceKm}
                                onChange={(e) =>
                                  handleUpdateFreight(
                                    item.id,
                                    'distanceKm',
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  )
                                }
                              />
                              <span className="text-[10px] text-zinc-400 ml-1">km</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-zinc-900 text-xs">
                            {tons.toLocaleString()} t
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleRemoveFreight(item.id)}
                              className="text-zinc-400 hover:text-rose-600 p-1"
                              aria-label="Remove freight route"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Spend-Based Procurement Table */}
          <Card className="border-zinc-200/90 shadow-sm">
            <CardHeader className="py-2.5 sm:py-3 px-3.5 sm:px-4 flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xs uppercase tracking-wider text-zinc-700">
                  Spend-Based Procurement (Cat 1)
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-[11px]">
                  Spend ($) × USEEIO v2.0 Sector Intensity
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSpend}
                className="h-7 text-xs px-2 shrink-0"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Spend
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[360px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Industry Sector</TableHead>
                      <TableHead>Spend Amount</TableHead>
                      <TableHead className="text-right">tCO₂e</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.procurementSpends.map((item) => {
                      const factor = EEIO_FACTORS[item.sector] || EEIO_FACTORS.software_cloud;
                      const tons = Math.round(((item.spendUsd * factor.efKgPerUsd) / 1000) * 100) / 100;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <select
                              value={item.sector}
                              onChange={(e) =>
                                handleUpdateSpend(item.id, 'sector', e.target.value as EeioSector)
                              }
                              className="text-xs bg-white border border-zinc-200 rounded px-2 py-1 font-medium w-full"
                            >
                              <option value="it_hardware">IT Hardware & Silicon</option>
                              <option value="software_cloud">Software & SaaS Subscriptions</option>
                              <option value="professional_services">Legal & Consulting Services</option>
                              <option value="machinery">Industrial Machinery</option>
                              <option value="chemicals">Chemicals & Plastics</option>
                              <option value="construction">Construction & Facilities</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <div className="w-24 sm:w-28">
                              <Input
                                type="number"
                                min="0"
                                value={item.spendUsd}
                                onChange={(e) =>
                                  handleUpdateSpend(
                                    item.id,
                                    'spendUsd',
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  )
                                }
                                addonLeft="$"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-zinc-900 text-xs">
                            {tons.toLocaleString()} t
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleRemoveSpend(item.id)}
                              className="text-zinc-400 hover:text-rose-600 p-1"
                              aria-label="Remove spend item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. TECH & SOFTWARE CARBON INTENSITY (GSF SCI v1.0) */}
      {/* ========================================================= */}
      <Card className="border-emerald-200/80 shadow-sm bg-gradient-to-b from-white to-emerald-50/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                  <Cpu className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <CardTitle className="text-emerald-950">
                  Green Software Foundation: Software Carbon Intensity (SCI)
                </CardTitle>
                <Badge variant="methodology">ISO 21031</Badge>
              </div>
              <CardDescription>
                Compute power (vCPU + RAM) × Facility PUE × Cloud Grid Carbon Intensity + Embodied Hardware.
              </CardDescription>
            </div>
            <Button
              variant="micro"
              onClick={() => onOpenAudit('corp-gsf-sci')}
              className="border-emerald-300 bg-white self-start sm:self-auto shrink-0"
            >
              Trace SCI Equation
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 block">
                Total Annual vCPU-Hours
              </label>
              <Input
                type="number"
                min="0"
                step="5000"
                value={data.computeVcpuHours || ''}
                onChange={(e) =>
                  onChange({
                    computeVcpuHours: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                addonRight="vCPU-hrs"
              />
              <span className="text-[10px] text-zinc-400 font-mono">12W power/core</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 block">
                Total Memory Allocation
              </label>
              <Input
                type="number"
                min="0"
                step="10000"
                value={data.computeRamGbHours || ''}
                onChange={(e) =>
                  onChange({
                    computeRamGbHours: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                addonRight="GB-hrs"
              />
              <span className="text-[10px] text-zinc-400 font-mono">0.392W per GB RAM</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 block">
                Datacenter PUE (1.1 - 1.6)
              </label>
              <Input
                type="number"
                min="1.05"
                max="2.0"
                step="0.05"
                value={data.datacenterPue || ''}
                onChange={(e) =>
                  onChange({
                    datacenterPue: Math.max(1.05, Math.min(2.0, parseFloat(e.target.value) || 1.2)),
                  })
                }
                addonRight="PUE"
              />
              <span className="text-[10px] text-zinc-400 font-mono">Power Usage Effectiveness</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 block">
                Cloud Datacenter Region
              </label>
              <select
                value={data.datacenterRegion}
                onChange={(e) =>
                  onChange({ datacenterRegion: e.target.value as any })
                }
                className="w-full text-xs bg-white border border-zinc-200 rounded-lg px-2.5 py-2 font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="us_egrid">US Cloud (0.386 kg/kWh)</option>
                <option value="eu_residual">EU Clean Grid (0.255 kg/kWh)</option>
                <option value="uk_desnz">UK Datacenters (0.207 kg/kWh)</option>
                <option value="india_cea">India Central (0.716 kg/kWh)</option>
              </select>
              <span className="text-[10px] text-zinc-400 font-mono">Marginal cloud grid factor</span>
            </div>
          </div>

          {/* Developer Workstation Hardware Amortization */}
          <div className="rounded-lg bg-white border border-emerald-200/60 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-zinc-900 block">
                Developer Workstation Hardware Amortization
              </span>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Amortizes laptop, dual monitors, and peripheral embodied carbon at 120 kg CO₂e/station/year (3-year lifecycle).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-medium text-zinc-600 whitespace-nowrap">
                Workstations:
              </label>
              <div className="w-24 sm:w-28">
                <Input
                  type="number"
                  min="0"
                  value={data.developerWorkstationsCount}
                  onChange={(e) =>
                    onChange({
                      developerWorkstationsCount: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  addonRight="units"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
