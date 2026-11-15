'use client';

import React, { useState, useMemo } from 'react';
import {
  Zap,
  Flame,
  Car,
  Plane,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Globe,
  Info,
  Scale,
  HeartHandshake,
  Loader2,
  Users,
  Fuel,
  Compass,
  Utensils,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Droplet,
  Trash,
  Train,
  Bike,
  Bus,
} from 'lucide-react';
import { REGIONAL_GRID_PRESETS } from '../../engine/factors';
import { RegionalGridKey } from '../../types';

interface QuickHouseholdCalculatorProps {
  onSwitchToAudit?: () => void;
}

export type CookingFuelType = 'lpg' | 'png' | 'biogas' | 'electric_induction';

export type TransitMode =
  | 'bicycle_walk'
  | 'metro_rail'
  | 'commuter_train'
  | 'public_bus'
  | 'ev'
  | 'two_wheeler'
  | 'petrol_car'
  | 'diesel_car';

export interface CommuteLeg {
  id: string;
  mode: TransitMode;
  method: 'distance' | 'fuel_receipt'; // for two_wheeler, petrol_car, diesel_car
  weeklyKm: number;
  efficiency: number; // L/100km or kWh/km
  fuelLitersMonth: number;
}

export function QuickHouseholdCalculator({ onSwitchToAudit }: QuickHouseholdCalculatorProps) {
  // 1. Household Allocation
  const [residents, setResidents] = useState<number>(1);

  // 2. Electricity & Grid
  const [electricityKwh, setElectricityKwh] = useState<number>(300);
  const [gridKey, setGridKey] = useState<RegionalGridKey>('india_cea');
  const [useCustomGridFactor, setUseCustomGridFactor] = useState<boolean>(false);
  const [customGridFactor, setCustomGridFactor] = useState<number>(0.716);

  // 3. Multi-Fuel Cooking Energy
  const [cookingFuel, setCookingFuel] = useState<CookingFuelType>('lpg');
  const [lpgCylinders, setLpgCylinders] = useState<number>(1); // 14.2 kg standard cylinder
  const [useExactLpgKg, setUseExactLpgKg] = useState<boolean>(false);
  const [exactLpgKgMonth, setExactLpgKgMonth] = useState<number>(14.2);
  const [pngM3Month, setPngM3Month] = useState<number>(15);
  const [biogasM3Month, setBiogasM3Month] = useState<number>(20);

  // 4. Opt-In Domestic Water & Municipal Solid Waste (No silent default)
  const [includeWaterWaste, setIncludeWaterWaste] = useState<boolean>(false);
  const [waterM3Month, setWaterM3Month] = useState<number>(10);
  const [wasteKgWeek, setWasteKgWeek] = useState<number>(5);

  // 5. Multi-Leg Commute (Separated Transit Modes & Strict XOR)
  const [commuteLegs, setCommuteLegs] = useState<CommuteLeg[]>([
    {
      id: 'leg-1',
      mode: 'two_wheeler',
      method: 'distance',
      weeklyKm: 75,
      efficiency: 2.5,
      fuelLitersMonth: 15,
    },
  ]);

  // 6. Aviation (Flights, Cabin Class, High-Altitude Radiative Forcing)
  const [aviationMode, setAviationMode] = useState<'counts' | 'exact_km'>('counts');
  const [shortHaulFlights, setShortHaulFlights] = useState<number>(1);
  const [longHaulFlights, setLongHaulFlights] = useState<number>(0);
  const [exactFlightKmYear, setExactFlightKmYear] = useState<number>(2500);
  const [cabinClass, setCabinClass] = useState<'economy' | 'business'>('economy');
  const [includeRadiativeForcing, setIncludeRadiativeForcing] = useState<boolean>(true);

  // 7. Optional Lifestyle Add-ons (Diet & Goods)
  const [showLifestyle, setShowLifestyle] = useState<boolean>(false);
  const [dietProfile, setDietProfile] = useState<'mixed' | 'vegan' | 'vegetarian' | 'high_meat'>('mixed');
  const [goodsSpendAnnual, setGoodsSpendAnnual] = useState<number>(0);
  const [spendCurrency, setSpendCurrency] = useState<'USD' | 'INR'>('INR');

  // Retirement Flow State
  const [selectedProjectId, setSelectedProjectId] = useState<'india_renewables' | 'verra_vm0042_soil' | 'gold_standard_cookstoves'>('india_renewables');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('My Household');
  const [isRetiring, setIsRetiring] = useState<boolean>(false);
  const [retirementQuote, setRetirementQuote] = useState<any | null>(null);

  // Active grid factor (Preset or custom override)
  const gridPreset = REGIONAL_GRID_PRESETS[gridKey] || REGIONAL_GRID_PRESETS.india_cea;
  const activeGridEf = useCustomGridFactor && customGridFactor > 0 ? customGridFactor : gridPreset.emissionFactorKwh;

  // Commute Leg Management
  const addCommuteLeg = () => {
    const newLeg: CommuteLeg = {
      id: `leg-${Date.now()}`,
      mode: 'metro_rail',
      method: 'distance',
      weeklyKm: 40,
      efficiency: 0,
      fuelLitersMonth: 0,
    };
    setCommuteLegs([...commuteLegs, newLeg]);
  };

  const removeCommuteLeg = (id: string) => {
    if (commuteLegs.length > 1) {
      setCommuteLegs(commuteLegs.filter((leg) => leg.id !== id));
    }
  };

  const updateCommuteLeg = (id: string, updates: Partial<CommuteLeg>) => {
    setCommuteLegs(
      commuteLegs.map((leg) => {
        if (leg.id !== id) return leg;
        const updated = { ...leg, ...updates };
        // Sync default efficiency when mode changes
        if (updates.mode) {
          if (updates.mode === 'petrol_car') updated.efficiency = 7.5;
          else if (updates.mode === 'diesel_car') updated.efficiency = 6.0;
          else if (updates.mode === 'two_wheeler') updated.efficiency = 2.5;
          else if (updates.mode === 'ev') updated.efficiency = 0.15; // kWh/km
          else updated.efficiency = 0;
        }
        return updated;
      })
    );
  };

  // Full double-precision floating-point calculation
  const footprint = useMemo(() => {
    const validResidents = Math.max(1, Number(residents) || 1);

    // 1. Electricity (Shared across residents)
    const annualElecKwh = Number(electricityKwh) * 12;
    const householdElecKg = annualElecKwh * activeGridEf;
    const personalElecTco2e = (householdElecKg / validResidents) / 1000;

    // 2. Multi-Fuel Cooking Energy (Shared across residents)
    let householdCookingKg = 0;
    if (cookingFuel === 'lpg') {
      const monthlyLpgKg = useExactLpgKg ? Number(exactLpgKgMonth) : Number(lpgCylinders) * 14.2;
      householdCookingKg = monthlyLpgKg * 12 * 2.983; // IPCC 2.983 kg CO2e/kg LPG
    } else if (cookingFuel === 'png') {
      householdCookingKg = Number(pngM3Month) * 12 * 2.020; // Piped Natural Gas: 2.020 kg CO2e/m3
    } else if (cookingFuel === 'biogas') {
      householdCookingKg = 0; // Biogenic carbon neutral per IPCC guidelines
    } else {
      // Electric Induction
      householdCookingKg = 0; // Counted under electricity kWh to prevent double counting
    }
    const personalCookingTco2e = (householdCookingKg / validResidents) / 1000;

    // 3. Opt-In Domestic Water & Municipal Solid Waste
    let householdWaterKg = 0;
    let householdWasteKg = 0;
    let personalWaterWasteTco2e = 0;
    if (includeWaterWaste) {
      const annualWaterM3 = Number(waterM3Month) * 12;
      householdWaterKg = annualWaterM3 * (0.344 + 0.708); // Supply + Aerobic digestion
      const annualWasteKg = Number(wasteKgWeek) * 52;
      householdWasteKg = annualWasteKg * 0.586; // Landfill methane factor
      personalWaterWasteTco2e = ((householdWaterKg + householdWasteKg) / validResidents) / 1000;
    }

    // 4. Multi-Leg Commute (Separated Transit Modes & Strict XOR)
    let totalTransportKg = 0;
    commuteLegs.forEach((leg) => {
      const annualKm = Number(leg.weeklyKm) * 52;
      if (leg.mode === 'bicycle_walk') {
        totalTransportKg += 0;
      } else if (leg.mode === 'metro_rail') {
        totalTransportKg += annualKm * 0.035; // 0.035 kg CO2e/pkm
      } else if (leg.mode === 'commuter_train') {
        totalTransportKg += annualKm * 0.041; // 0.041 kg CO2e/pkm
      } else if (leg.mode === 'public_bus') {
        totalTransportKg += annualKm * 0.089; // 0.089 kg CO2e/pkm
      } else if (leg.mode === 'ev') {
        totalTransportKg += annualKm * Number(leg.efficiency) * activeGridEf;
      } else if (leg.mode === 'two_wheeler') {
        if (leg.method === 'fuel_receipt') {
          totalTransportKg += Number(leg.fuelLitersMonth) * 12 * 2.315;
        } else {
          totalTransportKg += (annualKm * (Number(leg.efficiency) / 100)) * 2.315;
        }
      } else if (leg.mode === 'petrol_car') {
        if (leg.method === 'fuel_receipt') {
          totalTransportKg += Number(leg.fuelLitersMonth) * 12 * 2.315;
        } else {
          totalTransportKg += (annualKm * (Number(leg.efficiency) / 100)) * 2.315;
        }
      } else if (leg.mode === 'diesel_car') {
        if (leg.method === 'fuel_receipt') {
          totalTransportKg += Number(leg.fuelLitersMonth) * 12 * 2.687;
        } else {
          totalTransportKg += (annualKm * (Number(leg.efficiency) / 100)) * 2.687;
        }
      }
    });
    const personalTransportTco2e = totalTransportKg / 1000;

    // 5. Aviation (Distance, Cabin Class & High-Altitude Radiative Forcing)
    let flightKmTotal = 0;
    if (aviationMode === 'exact_km') {
      flightKmTotal = Number(exactFlightKmYear);
    } else {
      flightKmTotal = Number(shortHaulFlights) * 1200 + Number(longHaulFlights) * 7000;
    }
    const cabinMultiplier = cabinClass === 'business' ? 2.0 : 1.0;
    const baseDirectFlightKg = flightKmTotal * 0.115 * cabinMultiplier; // ICAO / DEFRA base direct CO2
    const directFlightTco2e = baseDirectFlightKg / 1000;
    const radiativeForcingMultiplier = includeRadiativeForcing ? 1.9 : 1.0;
    const personalAviationTco2e = (baseDirectFlightKg * radiativeForcingMultiplier) / 1000;

    // 6. Optional Lifestyle Add-ons (Diet & Consumption Goods)
    let dietTco2e = 0;
    let goodsTco2e = 0;
    if (showLifestyle) {
      const dietFactors = {
        vegan: 1020,
        vegetarian: 1460,
        mixed: 2050,
        high_meat: 3100,
      };
      dietTco2e = dietFactors[dietProfile] / 1000;

      if (goodsSpendAnnual > 0) {
        const spendUsd = spendCurrency === 'INR' ? Number(goodsSpendAnnual) / 85 : Number(goodsSpendAnnual);
        goodsTco2e = (spendUsd * 0.280) / 1000; // USEEIO consumer goods factor 0.280 kg/$
      }
    }

    // Totals
    const totalPersonalTco2e =
      personalElecTco2e +
      personalCookingTco2e +
      personalWaterWasteTco2e +
      personalTransportTco2e +
      personalAviationTco2e +
      dietTco2e +
      goodsTco2e;

    // Gross Household Total (Before resident division)
    const totalHouseholdGrossTco2e =
      (householdElecKg + householdCookingKg + householdWaterKg + householdWasteKg) / 1000 +
      personalTransportTco2e * validResidents +
      personalAviationTco2e * validResidents;

    const creditsNeeded = Math.ceil(totalPersonalTco2e);

    // Benchmarks
    const nationalAverage =
      gridKey === 'india_cea' ? 1.9 : gridKey === 'us_egrid' ? 14.9 : gridKey === 'uk_desnz' ? 5.2 : 6.8;
    const pctOfAverage = Math.round((totalPersonalTco2e / nationalAverage) * 100);

    return {
      personalElecTco2e,
      personalCookingTco2e,
      personalWaterWasteTco2e,
      personalTransportTco2e,
      personalAviationTco2e,
      directFlightTco2e,
      dietTco2e,
      goodsTco2e,
      totalPersonalTco2e,
      totalHouseholdGrossTco2e,
      creditsNeeded,
      nationalAverage,
      pctOfAverage,
      validResidents,
    };
  }, [
    residents,
    electricityKwh,
    activeGridEf,
    cookingFuel,
    useExactLpgKg,
    exactLpgKgMonth,
    lpgCylinders,
    pngM3Month,
    biogasM3Month,
    includeWaterWaste,
    waterM3Month,
    wasteKgWeek,
    commuteLegs,
    aviationMode,
    exactFlightKmYear,
    shortHaulFlights,
    longHaulFlights,
    cabinClass,
    includeRadiativeForcing,
    showLifestyle,
    dietProfile,
    goodsSpendAnnual,
    spendCurrency,
    gridKey,
  ]);

  // Handle live quote preview
  const handleGetRetirementQuote = async () => {
    setIsRetiring(true);
    try {
      const res = await fetch('/api/retire-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tco2e: footprint.totalPersonalTco2e,
          projectId: selectedProjectId,
          beneficiaryName,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setRetirementQuote(data);
      }
    } catch (err) {
      console.error('Failed to fetch quote', err);
    } finally {
      setIsRetiring(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16 md:pb-0">
      {/* Top Banner: Exact Primary Data & KTH Rules */}
      <div className="bg-emerald-950 text-white rounded-2xl p-4 sm:p-6 shadow-xs border border-emerald-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              KTH Boundary Rules · Full Double-Precision Math
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Personal &amp; Household Carbon Assessment
          </h2>
          <p className="text-xs text-emerald-200/80 max-w-2xl mt-0.5">
            Combines fast estimate sliders with multi-fuel cooking, multi-leg transit modes, household resident allocation,
            and opt-in municipal utility metrics.
          </p>
        </div>

        {/* Household Residents Control */}
        <div className="bg-emerald-900/90 border border-emerald-700/80 rounded-xl p-3 flex items-center gap-3 shrink-0">
          <Users className="w-5 h-5 text-emerald-300" />
          <div>
            <label htmlFor="household-residents" className="text-[11px] font-bold text-emerald-200 block">
              Residents in Household
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                id="household-residents"
                type="number"
                min={1}
                max={20}
                value={residents}
                onChange={(e) => setResidents(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 bg-white text-zinc-950 font-mono font-bold text-sm px-2 py-1 rounded border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <span className="text-[10px] text-emerald-300 font-mono">
                Divides shared utilities
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Categories */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Home Utilities (Electricity & Multi-Fuel Cooking) */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  1. Electricity &amp; Multi-Fuel Cooking
                </h3>
              </div>

              {/* Grid Preset Selector */}
              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs">
                <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <select
                  value={gridKey}
                  onChange={(e) => setGridKey(e.target.value as RegionalGridKey)}
                  className="bg-transparent font-medium text-zinc-800 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="india_cea">India Grid (0.716 kg/kWh)</option>
                  <option value="us_egrid">United States (0.386 kg/kWh)</option>
                  <option value="eu_residual">European Union (0.255 kg/kWh)</option>
                  <option value="uk_desnz">United Kingdom (0.207 kg/kWh)</option>
                </select>
              </div>
            </div>

            {/* Custom Grid Factor Override Toggle */}
            <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-700 font-medium">
                <input
                  type="checkbox"
                  checked={useCustomGridFactor}
                  onChange={(e) => setUseCustomGridFactor(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
                <span>Override with Specific Utility Emission Factor</span>
              </label>
              {useCustomGridFactor && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={customGridFactor}
                    onChange={(e) => setCustomGridFactor(Number(e.target.value))}
                    className="w-24 bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">kg CO₂e/kWh</span>
                </div>
              )}
            </div>

            {/* Electricity Slider & Exact Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-zinc-900">
                  Monthly Electricity (kWh)
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={electricityKwh}
                    onChange={(e) => setElectricityKwh(Math.max(0, Number(e.target.value)))}
                    className="w-20 bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 font-mono font-bold text-xs text-right text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                  <span className="text-xs font-mono text-zinc-500">kWh/mo</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={1500}
                step={25}
                value={electricityKwh}
                onChange={(e) => setElectricityKwh(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>0 kWh</span>
                <span>300 kWh (Standard Family)</span>
                <span>1500 kWh (Heavy AC)</span>
              </div>
            </div>

            {/* Multi-Fuel Cooking Energy Selector */}
            <div className="space-y-3 pt-3 border-t border-zinc-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-semibold text-zinc-900">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Cooking Energy Fuel Source</span>
                </div>
                <select
                  value={cookingFuel}
                  onChange={(e) => setCookingFuel(e.target.value as CookingFuelType)}
                  className="bg-zinc-100 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-800"
                >
                  <option value="lpg">LPG Cylinder (2.983 kg CO₂e/kg)</option>
                  <option value="png">Piped Natural Gas / PNG (2.020 kg CO₂e/m³)</option>
                  <option value="biogas">Biogas / Anaerobic Digester (Biogenic 0 kg CO₂e)</option>
                  <option value="electric_induction">Electric Induction / Stove (0 kg Direct Scope 1)</option>
                </select>
              </div>

              {/* Cooking Input Fields Depending on Fuel */}
              {cookingFuel === 'lpg' && (
                <div className="space-y-2 bg-orange-50/40 p-3 rounded-xl border border-orange-200/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700 font-medium">LPG Cylinders (14.2 kg each):</span>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-zinc-500 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useExactLpgKg}
                          onChange={(e) => setUseExactLpgKg(e.target.checked)}
                          className="rounded text-orange-600"
                        />
                        <span>Enter exact kg</span>
                      </label>
                      {useExactLpgKg ? (
                        <input
                          type="number"
                          min={0}
                          value={exactLpgKgMonth}
                          onChange={(e) => setExactLpgKgMonth(Number(e.target.value))}
                          className="w-16 bg-white border border-zinc-200 rounded px-2 py-0.5 font-mono text-xs text-right text-zinc-900"
                        />
                      ) : (
                        <span className="font-mono font-bold text-zinc-900 text-xs bg-white px-2 py-0.5 rounded border border-orange-200">
                          {lpgCylinders} cylinder{lpgCylinders !== 1 ? 's' : ''} / mo
                        </span>
                      )}
                    </div>
                  </div>
                  {!useExactLpgKg && (
                    <input
                      type="range"
                      min={0}
                      max={4}
                      step={0.5}
                      value={lpgCylinders}
                      onChange={(e) => setLpgCylinders(Number(e.target.value))}
                      className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                    />
                  )}
                </div>
              )}

              {cookingFuel === 'png' && (
                <div className="space-y-2 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700 font-medium">Monthly Piped Natural Gas (m³):</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={pngM3Month}
                        onChange={(e) => setPngM3Month(Math.max(0, Number(e.target.value)))}
                        className="w-20 bg-white border border-zinc-200 rounded px-2 py-0.5 font-mono font-bold text-xs text-right text-zinc-900"
                      />
                      <span className="text-xs font-mono text-zinc-500">m³/mo</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={pngM3Month}
                    onChange={(e) => setPngM3Month(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>0 m³</span>
                    <span>15 m³ (Average Indian/EU Household)</span>
                    <span>50 m³ (Heavy cooking)</span>
                  </div>
                </div>
              )}

              {cookingFuel === 'biogas' && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Biogenic Carbon Neutral (0.000 kg CO₂e / m³)
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Under IPCC and GHG Protocol guidelines, combustion of biogenic methane from agricultural
                    or manure anaerobic digesters is closed-loop carbon neutral.
                  </p>
                </div>
              )}

              {cookingFuel === 'electric_induction' && (
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Zero Direct Scope 1 Emissions
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Electric induction cooking energy is accounted for under your monthly electricity consumption (kWh)
                    above to prevent double-counting.
                  </p>
                </div>
              )}
            </div>

            {/* Opt-In Municipal Water & Solid Waste (Removed silent default) */}
            <div className="pt-3 border-t border-zinc-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-900">
                <input
                  type="checkbox"
                  checked={includeWaterWaste}
                  onChange={(e) => setIncludeWaterWaste(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
                <span>Include Municipal Water &amp; Solid Waste (Opt-In Assessment)</span>
              </label>

              {includeWaterWaste ? (
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-700 flex items-center gap-1 font-medium">
                          <Droplet className="w-3.5 h-3.5 text-blue-500" />
                          Water Supply &amp; Sewage:
                        </span>
                        <span className="font-mono font-bold text-zinc-900">{waterM3Month} m³/mo</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        step={1}
                        value={waterM3Month}
                        onChange={(e) => setWaterM3Month(Number(e.target.value))}
                        className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-700 flex items-center gap-1 font-medium">
                          <Trash className="w-3.5 h-3.5 text-zinc-500" />
                          Municipal Solid Waste:
                        </span>
                        <span className="font-mono font-bold text-zinc-900">{wasteKgWeek} kg/wk</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={25}
                        step={1}
                        value={wasteKgWeek}
                        onChange={(e) => setWasteKgWeek(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-300 rounded-lg appearance-none cursor-pointer accent-zinc-700"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block">
                    Divided by {footprint.validResidents} {footprint.validResidents === 1 ? 'resident' : 'residents'} per KTH boundary rules.
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-zinc-400 block italic">
                  Water &amp; landfill waste excluded by default to avoid unmetered assumptions. Check above to include.
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Road & Public Transport (Multi-Leg & Separated Transit Modes) */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    2. Multi-Leg Commute &amp; Separated Transit
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    COMBINE MULTIPLE LEGS · STRICT MOTORIZED XOR BOUNDARY
                  </span>
                </div>
              </div>

              {/* Add Leg Button */}
              <button
                type="button"
                onClick={addCommuteLeg}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Commute Leg</span>
              </button>
            </div>

            {/* Commute Legs List */}
            <div className="space-y-4">
              {commuteLegs.map((leg, index) => {
                const isMotorizedPersonal =
                  leg.mode === 'two_wheeler' || leg.mode === 'petrol_car' || leg.mode === 'diesel_car';

                return (
                  <div
                    key={leg.id}
                    className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/40 space-y-3 relative group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-mono text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <select
                          value={leg.mode}
                          onChange={(e) => updateCommuteLeg(leg.id, { mode: e.target.value as TransitMode })}
                          className="bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs font-bold text-zinc-900 cursor-pointer"
                        >
                          <option value="bicycle_walk">Bicycle / Walking (0.000 kg/pkm)</option>
                          <option value="metro_rail">Metro / Urban Rail (0.035 kg/pkm)</option>
                          <option value="commuter_train">Commuter / Intercity Train (0.041 kg/pkm)</option>
                          <option value="public_bus">Public Bus (0.089 kg/pkm)</option>
                          <option value="ev">Electric Vehicle / EV (kWh/km × Grid)</option>
                          <option value="two_wheeler">Motorcycle / Scooter (Petrol)</option>
                          <option value="petrol_car">Petrol Car</option>
                          <option value="diesel_car">Diesel Car</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Motorized XOR Method Switcher */}
                        {isMotorizedPersonal && (
                          <div className="flex items-center p-0.5 bg-zinc-200/70 rounded border border-zinc-300/80 text-[11px]">
                            <button
                              type="button"
                              onClick={() => updateCommuteLeg(leg.id, { method: 'distance' })}
                              className={`px-2 py-0.5 rounded font-bold transition ${
                                leg.method === 'distance' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                              }`}
                            >
                              Distance
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCommuteLeg(leg.id, { method: 'fuel_receipt' })}
                              className={`px-2 py-0.5 rounded font-bold transition ${
                                leg.method === 'fuel_receipt' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                              }`}
                            >
                              Fuel (L)
                            </button>
                          </div>
                        )}

                        {commuteLegs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCommuteLeg(leg.id)}
                            className="p-1 text-zinc-400 hover:text-red-600 transition"
                            title="Remove this leg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Leg Controls */}
                    {leg.mode === 'bicycle_walk' ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                        <Bike className="w-4 h-4 text-emerald-600" />
                        <span>Zero emissions active transit mode.</span>
                      </div>
                    ) : isMotorizedPersonal && leg.method === 'fuel_receipt' ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-600">Fuel Consumed per Month:</span>
                          <span className="font-mono font-bold text-zinc-900">{leg.fuelLitersMonth} L/mo</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={200}
                          step={5}
                          value={leg.fuelLitersMonth}
                          onChange={(e) => updateCommuteLeg(leg.id, { fuelLitersMonth: Number(e.target.value) })}
                          className="w-full h-1.5 bg-blue-200 rounded appearance-none accent-blue-600 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-600">Weekly Commute Distance:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={1000}
                              value={leg.weeklyKm}
                              onChange={(e) =>
                                updateCommuteLeg(leg.id, { weeklyKm: Math.max(0, Number(e.target.value)) })
                              }
                              className="w-16 bg-white border border-zinc-200 rounded px-1.5 py-0.5 font-mono text-xs text-right font-bold"
                            />
                            <span className="font-mono text-zinc-400 text-xs">km/wk</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={350}
                          step={5}
                          value={leg.weeklyKm}
                          onChange={(e) => updateCommuteLeg(leg.id, { weeklyKm: Number(e.target.value) })}
                          className="w-full h-1.5 bg-zinc-200 rounded appearance-none accent-emerald-700 cursor-pointer"
                        />

                        {/* Vehicle Efficiency if Motorized */}
                        {(isMotorizedPersonal || leg.mode === 'ev') && (
                          <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 font-mono">
                            <span>Vehicle Efficiency ({leg.mode === 'ev' ? 'kWh/km' : 'L/100km'}):</span>
                            <input
                              type="number"
                              step="0.1"
                              min="0.05"
                              value={leg.efficiency}
                              onChange={(e) => updateCommuteLeg(leg.id, { efficiency: Number(e.target.value) })}
                              className="w-16 bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-right font-bold text-zinc-900"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Aviation (Flights, Cabin Class, Radiative Forcing) */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
                  <Plane className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  3. Aviation &amp; Flight Radiative Forcing
                </h3>
              </div>

              {/* Cabin Class Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500 font-medium">Cabin:</span>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value as any)}
                  className="bg-zinc-100 border border-zinc-200 rounded px-2 py-1 text-xs font-semibold text-zinc-800"
                >
                  <option value="economy">Economy (1.0×)</option>
                  <option value="business">Business / First (2.0×)</option>
                </select>
              </div>
            </div>

            {/* Aviation Input Mode (Flight count vs Exact Distance) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-800 block">
                  Short-Haul Flights (&lt;3 hrs)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={shortHaulFlights}
                    onChange={(e) => setShortHaulFlights(Math.max(0, Number(e.target.value)))}
                    className="w-20 bg-zinc-100 border border-zinc-200 rounded px-2.5 py-1 font-mono font-bold text-xs text-zinc-900"
                  />
                  <span className="text-[11px] text-zinc-400">~1,200 km ea</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-800 block">
                  Long-Haul Flights (&gt;3 hrs)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={longHaulFlights}
                    onChange={(e) => setLongHaulFlights(Math.max(0, Number(e.target.value)))}
                    className="w-20 bg-zinc-100 border border-zinc-200 rounded px-2.5 py-1 font-mono font-bold text-xs text-zinc-900"
                  />
                  <span className="text-[11px] text-zinc-400">~7,000 km ea</span>
                </div>
              </div>
            </div>

            {/* High-Altitude Radiative Forcing Toggle */}
            <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-sky-950">
                  <input
                    type="checkbox"
                    checked={includeRadiativeForcing}
                    onChange={(e) => setIncludeRadiativeForcing(e.target.checked)}
                    className="rounded text-sky-700 focus:ring-sky-700"
                  />
                  <span>Include Non-CO₂ High-Altitude Radiative Forcing (1.9× Multiplier)</span>
                </label>
              </div>
              <p className="text-[11px] text-sky-900/80 leading-relaxed">
                Aviation causes warming beyond engine CO₂ due to short-lived contrail cirrus, NOx formation,
                and particulate haze at cruising altitudes (IPCC/DEFRA 1.9× factor).
              </p>
              <div className="flex items-center gap-4 text-[11px] font-mono pt-1 text-sky-950">
                <span>Direct CO₂: <strong>{footprint.directFlightTco2e.toFixed(3)} t</strong></span>
                <span>Total Radiative Impact: <strong>{footprint.personalAviationTco2e.toFixed(3)} tCO₂e</strong></span>
              </div>
            </div>
          </div>

          {/* Card 4: Optional Lifestyle Add-ons (Diet & Goods) */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-sm space-y-4">
            <button
              type="button"
              onClick={() => setShowLifestyle(!showLifestyle)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">
                    Optional: Dietary Profile &amp; Goods Consumption Spend
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    Add food lifecycle and consumer goods to your footprint
                  </span>
                </div>
              </div>
              {showLifestyle ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>

            {showLifestyle && (
              <div className="pt-3 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-800 block">
                    Dietary Pattern:
                  </label>
                  <select
                    value={dietProfile}
                    onChange={(e) => setDietProfile(e.target.value as any)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-800"
                  >
                    <option value="vegan">Vegan (~1,020 kg CO₂e/yr)</option>
                    <option value="vegetarian">Vegetarian (~1,460 kg CO₂e/yr)</option>
                    <option value="mixed">Mixed / Omnivore (~2,050 kg CO₂e/yr)</option>
                    <option value="high_meat">High-Meat Diet (~3,100 kg CO₂e/yr)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-800 block">
                    Annual Non-Food Goods Spend:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={spendCurrency}
                      onChange={(e) => setSpendCurrency(e.target.value as any)}
                      className="bg-zinc-100 border border-zinc-200 rounded px-2 py-1.5 text-xs font-bold text-zinc-800"
                    >
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={goodsSpendAnnual}
                      onChange={(e) => setGoodsSpendAnnual(Number(e.target.value))}
                      placeholder="e.g. 50000"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Instant Result Card & Breakdown */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0F3A2E] to-[#0A261E] text-white rounded-2xl p-5 sm:p-7 shadow-lg space-y-6 lg:sticky lg:top-24">
          <div className="border-b border-emerald-800/80 pb-4">
            <span className="text-[11px] font-mono text-emerald-300 font-bold uppercase tracking-wider block">
              Personal Per-Capita Footprint
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-white">
                {footprint.totalPersonalTco2e.toFixed(3)}
              </span>
              <span className="text-sm font-mono text-emerald-200 font-medium">
                tCO₂e / year
              </span>
            </div>
            {footprint.validResidents > 1 && (
              <span className="text-[11px] font-mono text-emerald-300/80 block mt-1">
                Gross Household Total: <strong>{footprint.totalHouseholdGrossTco2e.toFixed(2)} tCO₂e</strong> (shared by {footprint.validResidents} residents)
              </span>
            )}
          </div>

          {/* National Benchmark Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-emerald-300">Vs National Average:</span>
              <span className="font-bold text-white">
                {footprint.pctOfAverage}% ({footprint.nationalAverage} tCO₂e avg)
              </span>
            </div>
            <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800/60">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  footprint.pctOfAverage > 100 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, footprint.pctOfAverage)}%` }}
              />
            </div>
          </div>

          {/* Scope Breakdown */}
          <div className="space-y-2 pt-2 border-t border-emerald-800/80">
            <span className="text-[11px] font-mono text-emerald-300 font-bold uppercase tracking-wider block">
              Source Breakdown (Full Double Precision)
            </span>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                <span className="text-emerald-200">Scope 2: Grid Electricity</span>
                <span className="font-bold text-white">{footprint.personalElecTco2e.toFixed(3)} t</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                <span className="text-emerald-200">Scope 1: Cooking ({cookingFuel.toUpperCase()})</span>
                <span className="font-bold text-white">{footprint.personalCookingTco2e.toFixed(3)} t</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                <span className="text-emerald-200">Scope 3: Commute &amp; Aviation</span>
                <span className="font-bold text-white">
                  {(footprint.personalTransportTco2e + footprint.personalAviationTco2e).toFixed(3)} t
                </span>
              </div>
              {includeWaterWaste && (
                <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                  <span className="text-emerald-200">Scope 3: Water &amp; Waste</span>
                  <span className="font-bold text-white">{footprint.personalWaterWasteTco2e.toFixed(3)} t</span>
                </div>
              )}
              {showLifestyle && (
                <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                  <span className="text-emerald-200">Scope 3: Diet &amp; Goods Spend</span>
                  <span className="font-bold text-white">
                    {(footprint.dietTco2e + footprint.goodsTco2e).toFixed(3)} t
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Credits Needed */}
          <div className="p-4 rounded-xl bg-emerald-900/80 border border-emerald-600/70 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-emerald-300 block">
                Credits Required to Neutralize:
              </span>
              <span className="text-2xl font-bold font-mono text-white">
                {footprint.creditsNeeded} Credits
              </span>
            </div>
            <Scale className="w-8 h-8 text-emerald-300 opacity-80" />
          </div>

          {/* Switch to Detailed Audit Link */}
          <div className="pt-2">
            {onSwitchToAudit ? (
              <button
                type="button"
                onClick={onSwitchToAudit}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 group"
              >
                <span>Need Corporate or Verra Audit? Switch to Registry Suite</span>
                <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <a
                href="#carbon-crediting-suite"
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 group"
              >
                <span>Need Corporate or Verra Audit? Switch to Registry Suite</span>
                <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* OFFSET RETIREMENT FLOW & CERTIFICATE ACTION CARD */}
      {/* ============================================================== */}
      <div id="retire-section" className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-7 shadow-sm space-y-6">
        <div className="border-b border-zinc-100 pb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold uppercase tracking-wider mb-2">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
            Verified Permanent Retirement Action
          </div>
          <h3 className="text-lg font-bold text-zinc-950">
            Neutralize Footprint &amp; Receive Official Certificate of Retirement
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-3xl leading-relaxed">
            <strong>Individuals do not earn tradable credits from household reductions.</strong> In statutory carbon accounting,
            you achieve climate neutrality by purchasing and permanently retiring certified credits issued by internationally accredited
            registries. Once retired, serial numbers are irreversibly taken off circulation and you receive a non-tradable Certificate of Retirement.
          </p>
        </div>

        {/* Project Selector (3 Verified Options) */}
        <div>
          <label className="text-xs font-bold text-zinc-800 uppercase tracking-wide block mb-3">
            Step 1: Select Verified Registry Project
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Project 1 */}
            <div
              onClick={() => setSelectedProjectId('india_renewables')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedProjectId === 'india_renewables'
                  ? 'border-emerald-700 bg-emerald-50/40 shadow-sm'
                  : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  Verra VCS / BEE
                </span>
                <span className="text-xs font-bold text-zinc-900 font-mono">$12.50 / t</span>
              </div>
              <h4 className="text-xs font-bold text-zinc-900 mb-1">
                India Bundled Solar &amp; Wind Clean Grid
              </h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Displaces fossil thermal coal power from the Indian national grid. Verified under UNFCCC CDM ACM0002.
              </p>
            </div>

            {/* Project 2 */}
            <div
              onClick={() => setSelectedProjectId('verra_vm0042_soil')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedProjectId === 'verra_vm0042_soil'
                  ? 'border-emerald-700 bg-emerald-50/40 shadow-sm'
                  : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  Verra VM0042
                </span>
                <span className="text-xs font-bold text-zinc-900 font-mono">$18.00 / t</span>
              </div>
              <h4 className="text-xs font-bold text-zinc-900 mb-1">
                Regenerative Soil &amp; Agroforestry Removals
              </h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                High-permanence soil organic carbon enhancement and smallholder tree biomass sequestration.
              </p>
            </div>

            {/* Project 3 */}
            <div
              onClick={() => setSelectedProjectId('gold_standard_cookstoves')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedProjectId === 'gold_standard_cookstoves'
                  ? 'border-emerald-700 bg-emerald-50/40 shadow-sm'
                  : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                  Gold Standard
                </span>
                <span className="text-xs font-bold text-zinc-900 font-mono">$15.00 / t</span>
              </div>
              <h4 className="text-xs font-bold text-zinc-900 mb-1">
                Clean Cookstoves &amp; Rural Safe Water
              </h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Directly reduces firewood deforestation while improving family respiratory health in rural communities.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: Beneficiary Name & Generate Quote */}
        <div className="bg-zinc-50 rounded-xl p-4 sm:p-5 border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="recipient-name" className="text-xs font-bold text-zinc-800 block mb-1">
              Recipient Name for Certificate of Retirement
            </label>
            <input
              id="recipient-name"
              type="text"
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              placeholder="Enter full name or household name"
              className="w-full sm:max-w-md bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
            <span className="text-[10px] text-zinc-400 mt-0.5 block">
              This name will be permanently inscribed into the retirement certificate ledger.
            </span>
          </div>

          <button
            type="button"
            onClick={handleGetRetirementQuote}
            disabled={isRetiring}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            {isRetiring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Quote &amp; Certificate...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Generate Retirement Quote &amp; Certificate</span>
              </>
            )}
          </button>
        </div>

        {/* Retirement Quote Preview Modal / Drawer */}
        {retirementQuote && (
          <div className="p-5 sm:p-7 bg-zinc-900 text-white rounded-xl border border-zinc-800 shadow-xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Official Certificate of Carbon Retirement (Preview)
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-semibold">
                {retirementQuote.sandbox_mode ? 'Sandbox Mode' : 'Live Carbonmark Verified'}
              </span>
            </div>

            {/* Certificate Presentation Box */}
            <div className="border border-emerald-500/30 bg-emerald-950/20 rounded-xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/40 pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                    Official Certificate of Retirement
                  </span>
                  <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                    Issued to: {retirementQuote.certificate_preview.beneficiary_name}
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono">
                  <span className="text-[10px] text-zinc-400 block">Certificate Serial Number</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-400">
                    {retirementQuote.certificate_preview.certificate_id}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-zinc-800/60 p-2.5 rounded border border-zinc-700/50">
                  <span className="text-zinc-400 text-[10px] block">Volume Retired</span>
                  <span className="text-sm font-bold text-white">
                    {retirementQuote.quote.quantity_tco2e} tCO₂e
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    ({retirementQuote.quote.quantity_kg_co2e} kg CO₂e)
                  </span>
                </div>

                <div className="bg-zinc-800/60 p-2.5 rounded border border-zinc-700/50">
                  <span className="text-zinc-400 text-[10px] block">Verified Project</span>
                  <span className="text-xs font-bold text-white truncate block" title={retirementQuote.project.name}>
                    {retirementQuote.project.name}
                  </span>
                  <span className="text-[10px] text-emerald-400 block">
                    {retirementQuote.project.standard}
                  </span>
                </div>

                <div className="bg-zinc-800/60 p-2.5 rounded border border-zinc-700/50">
                  <span className="text-zinc-400 text-[10px] block">Methodology &amp; Vintage</span>
                  <span className="text-xs font-bold text-white truncate block">
                    {retirementQuote.project.methodology}
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Vintage: {retirementQuote.project.vintage}
                  </span>
                </div>

                <div className="bg-zinc-800/60 p-2.5 rounded border border-zinc-700/50">
                  <span className="text-zinc-400 text-[10px] block">Quote Total</span>
                  <span className="text-sm font-bold text-emerald-400 block">
                    ${retirementQuote.quote.total_usd} USD
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Unit: ${retirementQuote.quote.price_per_tco2e_usd}/t
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Status: <strong>{retirementQuote.certificate_preview.legal_status}</strong></span>
                </div>
                <div className="font-mono text-[10px] text-zinc-500">
                  Batch: {retirementQuote.project.serial_number_preview}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-zinc-400 text-[11px]">
                Proceed to live credit settlement via institutional marketplaces:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={retirementQuote.settlement_options.carbonmark_marketplace_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition"
                >
                  <span>Settle on Carbonmark</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={retirementQuote.settlement_options.climes_settlement_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded text-xs font-semibold transition"
                >
                  <span>Settle on Climes.io</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom Summary Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md text-white border-t border-zinc-800 px-4 py-2.5 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] font-mono text-emerald-400 block uppercase">Personal Footprint</span>
          <span className="text-base font-bold font-mono text-white">
            {footprint.totalPersonalTco2e.toFixed(3)} <span className="text-[10px] text-zinc-400">tCO₂e/yr</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-400 block">Neutralize</span>
            <span className="text-xs font-bold font-mono text-emerald-400">{footprint.creditsNeeded} Credits</span>
          </div>
          <a
            href="#retire-section"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition"
          >
            Retire
          </a>
        </div>
      </div>
    </div>
  );
}
