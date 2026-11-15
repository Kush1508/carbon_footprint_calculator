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
  ShoppingBag,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { REGIONAL_GRID_PRESETS } from '../../engine/factors';
import { RegionalGridKey } from '../../types';

interface QuickHouseholdCalculatorProps {
  onSwitchToAudit?: () => void;
}

export function QuickHouseholdCalculator({ onSwitchToAudit }: QuickHouseholdCalculatorProps) {
  // 1. Household Allocation
  const [residents, setResidents] = useState<number>(1);

  // 2. Electricity & Grid
  const [electricityKwh, setElectricityKwh] = useState<number>(300);
  const [gridKey, setGridKey] = useState<RegionalGridKey>('india_cea');
  const [useCustomGridFactor, setUseCustomGridFactor] = useState<boolean>(false);
  const [customGridFactor, setCustomGridFactor] = useState<number>(0.716);

  // 3. Cooking Gas (LPG)
  const [lpgCylinders, setLpgCylinders] = useState<number>(1); // 14.2 kg standard cylinder
  const [useExactLpgKg, setUseExactLpgKg] = useState<boolean>(false);
  const [exactLpgKgMonth, setExactLpgKgMonth] = useState<number>(14.2);

  // 4. Domestic Water & Solid Waste (Shared Household)
  const [waterM3Month, setWaterM3Month] = useState<number>(10);
  const [wasteKgWeek, setWasteKgWeek] = useState<number>(5);

  // 5. Road Transport (Strict XOR: Fuel Receipt vs Distance & Efficiency)
  const [transportMethod, setTransportMethod] = useState<'distance' | 'fuel_receipt'>('distance');
  // Fuel Receipt
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel' | 'cng'>('petrol');
  const [fuelLitersMonth, setFuelLitersMonth] = useState<number>(35);
  // Distance & Efficiency
  const [commuteKmWeek, setCommuteKmWeek] = useState<number>(75);
  const [commuteMode, setCommuteMode] = useState<'petrol_car' | 'diesel_car' | 'two_wheeler' | 'ev' | 'metro_bus'>('two_wheeler');
  const [vehicleEfficiency, setVehicleEfficiency] = useState<number>(2.5); // L/100km or kWh/km

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

  // Sync default vehicle efficiency when commuteMode changes
  const handleCommuteModeChange = (mode: 'petrol_car' | 'diesel_car' | 'two_wheeler' | 'ev' | 'metro_bus') => {
    setCommuteMode(mode);
    if (mode === 'petrol_car') setVehicleEfficiency(7.5);
    else if (mode === 'diesel_car') setVehicleEfficiency(6.0);
    else if (mode === 'two_wheeler') setVehicleEfficiency(2.5);
    else if (mode === 'ev') setVehicleEfficiency(0.15); // kWh/km
    else setVehicleEfficiency(0);
  };

  // Full double-precision floating-point computation
  const footprint = useMemo(() => {
    const validResidents = Math.max(1, Number(residents) || 1);

    // 1. Electricity (Shared across residents)
    const annualElecKwh = Number(electricityKwh) * 12;
    const householdElecKg = annualElecKwh * activeGridEf;
    const personalElecTco2e = (householdElecKg / validResidents) / 1000;

    // 2. Cooking Gas / LPG (Shared across residents)
    const monthlyLpgKg = useExactLpgKg ? Number(exactLpgKgMonth) : Number(lpgCylinders) * 14.2;
    const annualLpgKg = monthlyLpgKg * 12;
    const householdLpgKg = annualLpgKg * 2.983; // IPCC 2.983 kg CO2e/kg LPG
    const personalLpgTco2e = (householdLpgKg / validResidents) / 1000;

    // 3. Water & Municipal Solid Waste (Shared across residents)
    const annualWaterM3 = Number(waterM3Month) * 12;
    const householdWaterKg = annualWaterM3 * (0.344 + 0.708); // Supply (0.344) + Aerobic treatment (0.708)
    const annualWasteKg = Number(wasteKgWeek) * 52;
    const householdWasteKg = annualWasteKg * 0.586; // Municipal landfill baseline
    const personalWaterWasteTco2e = ((householdWaterKg + householdWasteKg) / validResidents) / 1000;

    // 4. Road Transport (Strict XOR: Fuel Receipt vs Distance & Efficiency)
    let transportPersonalKg = 0;
    if (transportMethod === 'fuel_receipt') {
      const fuelEf = fuelType === 'petrol' ? 2.315 : fuelType === 'diesel' ? 2.687 : 2.750;
      const annualLiters = Number(fuelLitersMonth) * 12;
      transportPersonalKg = annualLiters * fuelEf;
    } else {
      const annualCommuteKm = Number(commuteKmWeek) * 52;
      if (commuteMode === 'petrol_car') {
        const litersAnnual = (annualCommuteKm * Number(vehicleEfficiency)) / 100;
        transportPersonalKg = litersAnnual * 2.315;
      } else if (commuteMode === 'diesel_car') {
        const litersAnnual = (annualCommuteKm * Number(vehicleEfficiency)) / 100;
        transportPersonalKg = litersAnnual * 2.687;
      } else if (commuteMode === 'two_wheeler') {
        const litersAnnual = (annualCommuteKm * Number(vehicleEfficiency)) / 100;
        transportPersonalKg = litersAnnual * 2.315;
      } else if (commuteMode === 'ev') {
        const kwhAnnual = annualCommuteKm * Number(vehicleEfficiency); // efficiency in kWh/km
        transportPersonalKg = kwhAnnual * activeGridEf;
      } else {
        // Metro / Public Bus
        transportPersonalKg = annualCommuteKm * 0.035;
      }
    }
    const personalTransportTco2e = transportPersonalKg / 1000;

    // 5. Aviation (Distance, Cabin Class, Radiative Forcing)
    let flightKmTotal = 0;
    if (aviationMode === 'exact_km') {
      flightKmTotal = Number(exactFlightKmYear);
    } else {
      flightKmTotal = Number(shortHaulFlights) * 1200 + Number(longHaulFlights) * 7000;
    }
    const cabinMultiplier = cabinClass === 'business' ? 2.0 : 1.0;
    const baseDirectFlightKg = flightKmTotal * 0.115 * cabinMultiplier; // ICAO / DEFRA direct CO2
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
      personalLpgTco2e +
      personalWaterWasteTco2e +
      personalTransportTco2e +
      personalAviationTco2e +
      dietTco2e +
      goodsTco2e;

    // Gross Household Total (Before division)
    const totalHouseholdGrossTco2e =
      (householdElecKg + householdLpgKg + householdWaterKg + householdWasteKg) / 1000 +
      personalTransportTco2e * validResidents +
      personalAviationTco2e * validResidents;

    const creditsNeeded = Math.ceil(totalPersonalTco2e);

    // Benchmarks
    const nationalAverage =
      gridKey === 'india_cea' ? 1.9 : gridKey === 'us_egrid' ? 14.9 : gridKey === 'uk_desnz' ? 5.2 : 6.8;
    const pctOfAverage = Math.round((totalPersonalTco2e / nationalAverage) * 100);

    return {
      personalElecTco2e,
      personalLpgTco2e,
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
    useExactLpgKg,
    exactLpgKgMonth,
    lpgCylinders,
    waterM3Month,
    wasteKgWeek,
    transportMethod,
    fuelType,
    fuelLitersMonth,
    commuteKmWeek,
    commuteMode,
    vehicleEfficiency,
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
    <div className="space-y-8 animate-fadeIn">
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
            Combines fast estimate sliders with exact primary utility receipts, household resident allocation,
            strict Fuel-vs-Distance XOR boundaries, and aviation radiative forcing.
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
          {/* Card 1: Home Utilities (Electricity, LPG, Water, Grid Override) */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  1. Household Electricity &amp; Cooking Gas
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

            {/* Cooking Gas (LPG) */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-semibold text-zinc-900">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Cooking Gas (LPG)</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-zinc-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useExactLpgKg}
                      onChange={(e) => setUseExactLpgKg(e.target.checked)}
                      className="rounded text-emerald-700"
                    />
                    <span>Enter exact kg</span>
                  </label>
                  {useExactLpgKg ? (
                    <input
                      type="number"
                      min={0}
                      value={exactLpgKgMonth}
                      onChange={(e) => setExactLpgKgMonth(Number(e.target.value))}
                      className="w-16 bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 font-mono text-xs text-right text-zinc-900"
                    />
                  ) : (
                    <span className="font-mono font-bold text-zinc-900 text-xs bg-zinc-100 px-2 py-0.5 rounded">
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
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
              )}
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>0 (PNG/Induction)</span>
                <span>1 Cylinder (14.2 kg standard)</span>
                <span>4 Cylinders</span>
              </div>
            </div>

            {/* Water & Waste Summary Info */}
            <div className="bg-zinc-50/80 rounded-lg p-2.5 border border-zinc-200/60 text-[11px] text-zinc-600 flex items-center justify-between">
              <span>Domestic Water (10 m³/mo) &amp; Waste (5 kg/wk) included</span>
              <span className="font-mono text-emerald-700 font-semibold">
                Allocated ÷ {footprint.validResidents} {footprint.validResidents === 1 ? 'resident' : 'residents'}
              </span>
            </div>
          </div>

          {/* Card 2: Road Transport (Strict XOR Boundary) */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    2. Road Transport &amp; Commute
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    STRICT XOR BOUNDARY · PREVENTS DOUBLE-COUNTING
                  </span>
                </div>
              </div>

              {/* XOR Method Switcher */}
              <div className="flex items-center p-0.5 bg-zinc-100 rounded-lg border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setTransportMethod('distance')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                    transportMethod === 'distance'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Distance &amp; Efficiency
                </button>
                <button
                  type="button"
                  onClick={() => setTransportMethod('fuel_receipt')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                    transportMethod === 'fuel_receipt'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Fuel Receipts (Liters)
                </button>
              </div>
            </div>

            {/* Method A: Fuel Receipts */}
            {transportMethod === 'fuel_receipt' ? (
              <div className="space-y-4 bg-blue-50/40 p-4 rounded-xl border border-blue-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-blue-600" />
                    Exact Monthly Fuel Consumption
                  </span>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as any)}
                    className="bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-medium text-zinc-800"
                  >
                    <option value="petrol">Petrol (2.315 kg CO₂e/L)</option>
                    <option value="diesel">Diesel (2.687 kg CO₂e/L)</option>
                    <option value="cng">CNG (2.750 kg CO₂e/kg)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600">Fuel Consumed per Month</span>
                    <span className="font-mono font-bold text-zinc-900 text-sm">
                      {fuelLitersMonth} Liters / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={250}
                    step={5}
                    value={fuelLitersMonth}
                    onChange={(e) => setFuelLitersMonth(Number(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>0 L</span>
                    <span>35 L (~450 km commute)</span>
                    <span>250 L (Long daily drive)</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Method B: Distance & Efficiency */
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-700">Vehicle Type &amp; Mode:</span>
                  <select
                    value={commuteMode}
                    onChange={(e) => handleCommuteModeChange(e.target.value as any)}
                    className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-800"
                  >
                    <option value="two_wheeler">Motorcycle / Scooter (Petrol)</option>
                    <option value="petrol_car">Petrol Car</option>
                    <option value="diesel_car">Diesel Car</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                    <option value="metro_bus">Metro / Public Bus</option>
                  </select>
                </div>

                {/* Distance Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-zinc-900">Weekly Commute Distance</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        value={commuteKmWeek}
                        onChange={(e) => setCommuteKmWeek(Math.max(0, Number(e.target.value)))}
                        className="w-20 bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 font-mono font-bold text-xs text-right text-zinc-900 focus:outline-none"
                      />
                      <span className="text-xs font-mono text-zinc-500">km/wk</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    step={10}
                    value={commuteKmWeek}
                    onChange={(e) => setCommuteKmWeek(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>0 km (Remote/Walk)</span>
                    <span>75 km / week</span>
                    <span>500 km / week</span>
                  </div>
                </div>

                {/* Efficiency Setting for vehicles */}
                {commuteMode !== 'metro_bus' && (
                  <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-600">
                      Vehicle Efficiency ({commuteMode === 'ev' ? 'kWh/km' : 'Liters/100km'}):
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.05"
                      value={vehicleEfficiency}
                      onChange={(e) => setVehicleEfficiency(Number(e.target.value))}
                      className="w-20 bg-white border border-zinc-300 rounded px-2 py-1 font-mono font-bold text-xs text-right text-zinc-900"
                    />
                  </div>
                )}
              </div>
            )}
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
                <span className="text-emerald-200">Scope 1: Cooking Gas &amp; Direct Fuel</span>
                <span className="font-bold text-white">
                  {(footprint.personalLpgTco2e + (transportMethod === 'fuel_receipt' ? footprint.personalTransportTco2e : 0)).toFixed(3)} t
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                <span className="text-emerald-200">Scope 3: Transport &amp; Aviation</span>
                <span className="font-bold text-white">
                  {((transportMethod === 'distance' ? footprint.personalTransportTco2e : 0) + footprint.personalAviationTco2e + footprint.personalWaterWasteTco2e).toFixed(3)} t
                </span>
              </div>
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
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-7 shadow-sm space-y-6">
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
    </div>
  );
}
