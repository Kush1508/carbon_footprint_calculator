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
  ShoppingBag,
  Smartphone,
  Laptop,
  Shirt,
  Beef,
  Apple,
  RotateCcw,
  FileText,
  Sparkles,
  Layers,
  Sliders,
} from 'lucide-react';
import { REGIONAL_GRID_PRESETS } from '../../engine/factors';
import { RegionalGridKey } from '../../types';

interface QuickHouseholdCalculatorProps {
  onSwitchToAudit?: () => void;
}

export type SystemBoundary = 'operational' | 'lifecycle';

export type CookingFuelType = 'none' | 'lpg' | 'png' | 'biogas' | 'electric_induction';

export type HeatingType = 'none' | 'district_heat' | 'heat_pump' | 'fuel';

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
  name: string;
  mode: TransitMode;
  method: 'distance' | 'fuel_receipt';
  weeklyKm: number;
  efficiency: number; // L/100km or kWh/km
  fuelLitersMonth: number;
  occupancy: number;
  useCustomEf?: boolean;
  customEf?: number; // kg CO2e / unit (pkm or L)
}

export interface ProvenanceItem {
  domain: string;
  activity: string;
  quantity: string;
  baseFactor: string;
  effectiveFactor: string;
  source: string;
  boundary: string;
  lifecycleMode: string;
  emissionsTco2e: number;
}

export const REGIONAL_LIFECYCLE_PROFILES: Record<
  RegionalGridKey,
  {
    nationalAverage: number;
    benchmarkLabel: string;
    tdLossPercent: number;
    tdLossRate: number;
  }
> = {
  india_cea: {
    nationalAverage: 1.9,
    benchmarkLabel: 'India CEA / MoEFCC Baseline',
    tdLossPercent: 17.5,
    tdLossRate: 0.175,
  },
  us_egrid: {
    nationalAverage: 14.2,
    benchmarkLabel: 'US EPA / World Bank Baseline',
    tdLossPercent: 5.1,
    tdLossRate: 0.051,
  },
  eu_residual: {
    nationalAverage: 6.8,
    benchmarkLabel: 'EU-27 Eurostat Baseline',
    tdLossPercent: 6.2,
    tdLossRate: 0.062,
  },
  uk_desnz: {
    nationalAverage: 5.2,
    benchmarkLabel: 'UK DESNZ Baseline',
    tdLossPercent: 7.8,
    tdLossRate: 0.078,
  },
};

export function QuickHouseholdCalculator({ onSwitchToAudit }: QuickHouseholdCalculatorProps) {
  // =========================================================================
  // SYSTEM BOUNDARY MODE (TTW Operational vs Full Lifecycle WTW + T&D Losses)
  // =========================================================================
  const [systemBoundary, setSystemBoundary] = useState<SystemBoundary>('operational');

  // =========================================================================
  // 1. SHARED HOUSEHOLD ALLOCATION
  // =========================================================================
  const [residents, setResidents] = useState<number>(1);

  // =========================================================================
  // 2. HOME ENERGY (ELECTRICITY, HEATING & COOKING)
  // =========================================================================
  // Electricity
  const [electricityKwh, setElectricityKwh] = useState<number>(0);
  const [gridKey, setGridKey] = useState<RegionalGridKey>('india_cea');
  const [useCustomGridFactor, setUseCustomGridFactor] = useState<boolean>(false);
  const [customGridFactor, setCustomGridFactor] = useState<number>(0.716);

  // Heating (Default: None / 0)
  const [includeHeating, setIncludeHeating] = useState<boolean>(false);
  const [heatingType, setHeatingType] = useState<HeatingType>('district_heat');
  const [districtHeatKwhMonth, setDistrictHeatKwhMonth] = useState<number>(0);
  const [districtHeatEf, setDistrictHeatEf] = useState<number>(0.055);
  const [heatPumpKwhMonth, setHeatPumpKwhMonth] = useState<number>(0);
  const [heatingFuelType, setHeatingFuelType] = useState<'gas' | 'oil' | 'biomass'>('gas');
  const [heatingFuelQtyMonth, setHeatingFuelQtyMonth] = useState<number>(0);
  const [customHeatingFuelEfEnabled, setCustomHeatingFuelEfEnabled] = useState<boolean>(false);
  const [customHeatingFuelEf, setCustomHeatingFuelEf] = useState<number>(2.02);

  // Cooking (Default: None / 0)
  const [cookingFuel, setCookingFuel] = useState<CookingFuelType>('none');
  const [lpgCylindersMonth, setLpgCylindersMonth] = useState<number>(0);
  const [useExactLpgKg, setUseExactLpgKg] = useState<boolean>(false);
  const [exactLpgKgMonth, setExactLpgKgMonth] = useState<number>(0);
  const [pngM3Month, setPngM3Month] = useState<number>(0);
  const [biogasM3Month, setBiogasM3Month] = useState<number>(0);
  const [customCookingEfEnabled, setCustomCookingEfEnabled] = useState<boolean>(false);
  const [customLpgEf, setCustomLpgEf] = useState<number>(2.983);
  const [customPngEf, setCustomPngEf] = useState<number>(2.02);

  // =========================================================================
  // 3. ROAD & PUBLIC TRANSPORT (MULTI-LEG BUILDER)
  // =========================================================================
  const [commuteLegs, setCommuteLegs] = useState<CommuteLeg[]>([
    {
      id: 'leg-1',
      name: 'Primary Daily Commute',
      mode: 'metro_rail',
      method: 'distance',
      weeklyKm: 0,
      efficiency: 0,
      fuelLitersMonth: 0,
      occupancy: 1,
      useCustomEf: false,
      customEf: 0.035,
    },
  ]);

  // =========================================================================
  // 4. AVIATION (PASSENGER DISTANCE, ROUTE CLASS & OPTIONAL NON-CO2)
  // =========================================================================
  const [aviationMode, setAviationMode] = useState<'exact_km' | 'counts'>('exact_km');
  const [exactFlightKmYear, setExactFlightKmYear] = useState<number>(0);
  const [shortHaulFlights, setShortHaulFlights] = useState<number>(0);
  const [longHaulFlights, setLongHaulFlights] = useState<number>(0);
  const [flightRouteClass, setFlightRouteClass] = useState<'short_econ' | 'long_econ' | 'business_first' | 'custom'>('short_econ');
  const [customAviationEf, setCustomAviationEf] = useState<number>(0.115);
  const [includeRadiativeForcing, setIncludeRadiativeForcing] = useState<boolean>(false);

  // =========================================================================
  // 5. FOOD & DIET (MASS IN KG × EF — OPT-IN, DEFAULT 0)
  // =========================================================================
  const [includeFood, setIncludeFood] = useState<boolean>(false);
  const [beefLambKgMonth, setBeefLambKgMonth] = useState<number>(0);
  const [porkPoultryKgMonth, setPorkPoultryKgMonth] = useState<number>(0);
  const [dairyCheeseKgMonth, setDairyCheeseKgMonth] = useState<number>(0);
  const [plantGrainsKgMonth, setPlantGrainsKgMonth] = useState<number>(0);
  const [customFoodEfEnabled, setCustomFoodEfEnabled] = useState<boolean>(false);
  const [customBeefEf, setCustomBeefEf] = useState<number>(27.0);
  const [customPoultryEf, setCustomPoultryEf] = useState<number>(6.9);
  const [customDairyEf, setCustomDairyEf] = useState<number>(8.5);
  const [customPlantEf, setCustomPlantEf] = useState<number>(1.5);

  // =========================================================================
  // 6. GOODS & SERVICES (LIFECYCLE QUANTITY PREFERRED / SPEND FALLBACK — DEFAULT 0)
  // =========================================================================
  const [includeGoods, setIncludeGoods] = useState<boolean>(false);
  const [goodsMode, setGoodsMode] = useState<'lifecycle_qty' | 'spend'>('lifecycle_qty');
  // Lifecycle Quantity inputs
  const [smartphonesQtyYear, setSmartphonesQtyYear] = useState<number>(0);
  const [laptopsQtyYear, setLaptopsQtyYear] = useState<number>(0);
  const [clothingItemsYear, setClothingItemsYear] = useState<number>(0);
  const [footwearPairsYear, setFootwearPairsYear] = useState<number>(0);
  const [customGoodsEfEnabled, setCustomGoodsEfEnabled] = useState<boolean>(false);
  const [customPhoneEf, setCustomPhoneEf] = useState<number>(70.0);
  const [customLaptopEf, setCustomLaptopEf] = useState<number>(250.0);
  const [customClothingEf, setCustomClothingEf] = useState<number>(15.0);
  const [customFootwearEf, setCustomFootwearEf] = useState<number>(18.0);
  // Spend Fallback inputs
  const [spendAmount, setSpendAmount] = useState<number>(0);
  const [spendCurrency, setSpendCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>('INR');
  const [spendSector, setSpendSector] = useState<'electronics' | 'clothing' | 'services' | 'appliances'>('electronics');
  const [customSpendEf, setCustomSpendEf] = useState<number>(0.32);

  // =========================================================================
  // 7. WATER & MUNICIPAL WASTE (OPT-IN, DEFAULT 0)
  // =========================================================================
  const [includeWaterWaste, setIncludeWaterWaste] = useState<boolean>(false);
  const [waterM3Month, setWaterM3Month] = useState<number>(0);
  const [wasteKgWeek, setWasteKgWeek] = useState<number>(0);
  const [customWaterWasteEfEnabled, setCustomWaterWasteEfEnabled] = useState<boolean>(false);
  const [customWaterEf, setCustomWaterEf] = useState<number>(1.052);
  const [customWasteEf, setCustomWasteEf] = useState<number>(0.586);

  // =========================================================================
  // UI TOGGLE: AUDIT PROVENANCE LEDGER
  // =========================================================================
  const [showProvenanceLedger, setShowProvenanceLedger] = useState<boolean>(false);

  // =========================================================================
  // 8. OFFSET RETIREMENT FLOW STATE
  // =========================================================================
  const [selectedProjectId, setSelectedProjectId] = useState<'india_renewables' | 'verra_vm0042_soil' | 'gold_standard_cookstoves'>('india_renewables');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('My Household');
  const [isRetiring, setIsRetiring] = useState<boolean>(false);
  const [retirementQuote, setRetirementQuote] = useState<any | null>(null);

  // Active grid factor & Regional Profile
  const gridPreset = REGIONAL_GRID_PRESETS[gridKey] || REGIONAL_GRID_PRESETS.india_cea;
  const regionalProfile = REGIONAL_LIFECYCLE_PROFILES[gridKey] || REGIONAL_LIFECYCLE_PROFILES.india_cea;
  const activeGridEf = useCustomGridFactor && customGridFactor > 0 ? customGridFactor : gridPreset.emissionFactorKwh;

  // Dynamic Electric Rail Factors (coupled to activeGridEf):
  // Metro / Urban Rail: ~0.049 kWh/pkm × EF_grid
  // Commuter Rail / Intercity: ~0.057 kWh/pkm × EF_grid
  const dynamicMetroEf = 0.049 * activeGridEf;
  const dynamicCommuterTrainEf = 0.057 * activeGridEf;

  // Commute Leg Handlers
  const addCommuteLeg = () => {
    const newLeg: CommuteLeg = {
      id: `leg-${Date.now()}`,
      name: `Commute Leg ${commuteLegs.length + 1}`,
      mode: 'public_bus',
      method: 'distance',
      weeklyKm: 0,
      efficiency: 0,
      fuelLitersMonth: 0,
      occupancy: 1,
      useCustomEf: false,
      customEf: 0.089,
    };
    setCommuteLegs([...commuteLegs, newLeg]);
  };

  const removeCommuteLeg = (id: string) => {
    if (commuteLegs.length > 1) {
      setCommuteLegs(commuteLegs.filter((leg) => leg.id !== id));
    } else {
      setCommuteLegs([
        {
          id: 'leg-1',
          name: 'Primary Daily Commute',
          mode: 'bicycle_walk',
          method: 'distance',
          weeklyKm: 0,
          efficiency: 0,
          fuelLitersMonth: 0,
          occupancy: 1,
          useCustomEf: false,
          customEf: 0,
        },
      ]);
    }
  };

  const updateCommuteLeg = (id: string, updates: Partial<CommuteLeg>) => {
    setCommuteLegs(
      commuteLegs.map((leg) => {
        if (leg.id !== id) return leg;
        const updated = { ...leg, ...updates };
        if (updates.mode) {
          if (updates.mode === 'petrol_car') updated.efficiency = 7.5;
          else if (updates.mode === 'diesel_car') updated.efficiency = 6.0;
          else if (updates.mode === 'two_wheeler') updated.efficiency = 2.5;
          else if (updates.mode === 'ev') updated.efficiency = 0.15;
          else updated.efficiency = 0;
        }
        return updated;
      })
    );
  };

  // Quick Archetype Presets
  const applyPreset = (preset: 'zero' | 'urban_professional' | 'rural_homestead') => {
    if (preset === 'zero') {
      setResidents(1);
      setElectricityKwh(0);
      setIncludeHeating(false);
      setHeatingType('district_heat');
      setDistrictHeatKwhMonth(0);
      setHeatPumpKwhMonth(0);
      setHeatingFuelQtyMonth(0);
      setCookingFuel('none');
      setLpgCylindersMonth(0);
      setPngM3Month(0);
      setBiogasM3Month(0);
      setCommuteLegs([
        {
          id: 'leg-1',
          name: 'Primary Daily Commute',
          mode: 'bicycle_walk',
          method: 'distance',
          weeklyKm: 0,
          efficiency: 0,
          fuelLitersMonth: 0,
          occupancy: 1,
        },
      ]);
      setExactFlightKmYear(0);
      setShortHaulFlights(0);
      setLongHaulFlights(0);
      setIncludeRadiativeForcing(false);
      setIncludeFood(false);
      setBeefLambKgMonth(0);
      setPorkPoultryKgMonth(0);
      setDairyCheeseKgMonth(0);
      setPlantGrainsKgMonth(0);
      setIncludeGoods(false);
      setSmartphonesQtyYear(0);
      setLaptopsQtyYear(0);
      setClothingItemsYear(0);
      setFootwearPairsYear(0);
      setSpendAmount(0);
      setIncludeWaterWaste(false);
      setWaterM3Month(0);
      setWasteKgWeek(0);
    } else if (preset === 'urban_professional') {
      setResidents(2);
      setElectricityKwh(250);
      setIncludeHeating(false);
      setCookingFuel('png');
      setPngM3Month(14);
      setCommuteLegs([
        {
          id: 'leg-1',
          name: 'Metro Commute',
          mode: 'metro_rail',
          method: 'distance',
          weeklyKm: 60,
          efficiency: 0,
          fuelLitersMonth: 0,
          occupancy: 1,
        },
      ]);
      setAviationMode('counts');
      setShortHaulFlights(2);
      setLongHaulFlights(0);
      setIncludeRadiativeForcing(false);
      setIncludeFood(true);
      setBeefLambKgMonth(1);
      setPorkPoultryKgMonth(4);
      setDairyCheeseKgMonth(8);
      setPlantGrainsKgMonth(25);
      setIncludeGoods(true);
      setGoodsMode('lifecycle_qty');
      setSmartphonesQtyYear(1);
      setClothingItemsYear(8);
      setIncludeWaterWaste(true);
      setWaterM3Month(8);
      setWasteKgWeek(4);
    } else if (preset === 'rural_homestead') {
      setResidents(4);
      setElectricityKwh(120);
      setIncludeHeating(false);
      setCookingFuel('biogas');
      setBiogasM3Month(25);
      setCommuteLegs([
        {
          id: 'leg-1',
          name: 'Local Transport',
          mode: 'two_wheeler',
          method: 'distance',
          weeklyKm: 30,
          efficiency: 2.5,
          fuelLitersMonth: 0,
          occupancy: 1,
        },
      ]);
      setExactFlightKmYear(0);
      setShortHaulFlights(0);
      setLongHaulFlights(0);
      setIncludeRadiativeForcing(false);
      setIncludeFood(true);
      setBeefLambKgMonth(0);
      setPorkPoultryKgMonth(2);
      setDairyCheeseKgMonth(10);
      setPlantGrainsKgMonth(35);
      setIncludeGoods(false);
      setIncludeWaterWaste(false);
    }
  };

  // =========================================================================
  // CORE CALCULATION ENGINE (FULL DOUBLE-PRECISION FLOATING-POINT MATH)
  // =========================================================================
  const calculation = useMemo(() => {
    const validResidents = Math.max(1, Number(residents) || 1);
    const allocationShare = 1 / validResidents;
    const isLifecycle = systemBoundary === 'lifecycle';
    const provenanceList: ProvenanceItem[] = [];

    // Upstream multipliers
    const gridMultiplier = isLifecycle ? 1 + regionalProfile.tdLossRate : 1.0;
    const fuelWttMultiplier = isLifecycle ? 1.18 : 1.0; // +18% WTT upstream extraction/refining

    // -----------------------------------------------------------------------
    // 1. Grid Electricity (Shared)
    // -----------------------------------------------------------------------
    const annualElecKwh = Math.max(0, Number(electricityKwh)) * 12;
    const baseGridEf = activeGridEf;
    const effectiveGridEf = baseGridEf * gridMultiplier;
    const householdElecKg = annualElecKwh * effectiveGridEf;
    const personalElecTco2e = (householdElecKg * allocationShare) / 1000;
    const operationalPersonalElecTco2e = ((annualElecKwh * baseGridEf) * allocationShare) / 1000;

    if (annualElecKwh > 0) {
      provenanceList.push({
        domain: 'Home Energy',
        activity: 'Grid Electricity Consumption',
        quantity: `${annualElecKwh.toLocaleString()} kWh/yr`,
        baseFactor: `${baseGridEf.toFixed(3)} kg CO₂e/kWh`,
        effectiveFactor: `${effectiveGridEf.toFixed(3)} kg CO₂e/kWh ${isLifecycle ? `(+${regionalProfile.tdLossPercent}% T&D)` : ''}`,
        source: useCustomGridFactor ? 'Custom Utility Supplier Tariff' : gridPreset.sourceAuthority,
        boundary: `Shared ÷ ${validResidents} residents (${(allocationShare * 100).toFixed(1)}%)`,
        lifecycleMode: isLifecycle ? `WTW (Includes +${regionalProfile.tdLossPercent}% T&D loss)` : 'TTW Generation Only',
        emissionsTco2e: personalElecTco2e,
      });
    }

    // -----------------------------------------------------------------------
    // 2. Home Heating (Shared)
    // -----------------------------------------------------------------------
    let householdHeatingKg = 0;
    let operationalHouseholdHeatingKg = 0;
    if (includeHeating) {
      if (heatingType === 'district_heat') {
        const annualHeatKwh = Math.max(0, Number(districtHeatKwhMonth)) * 12;
        const baseHeatEf = Math.max(0, Number(districtHeatEf));
        const effectiveHeatEf = baseHeatEf * (isLifecycle ? 1.08 : 1.0);
        householdHeatingKg = annualHeatKwh * effectiveHeatEf;
        operationalHouseholdHeatingKg = annualHeatKwh * baseHeatEf;
        if (annualHeatKwh > 0) {
          provenanceList.push({
            domain: 'Home Energy',
            activity: 'District Heating Network',
            quantity: `${annualHeatKwh.toLocaleString()} kWh/yr`,
            baseFactor: `${baseHeatEf.toFixed(3)} kg CO₂e/kWh`,
            effectiveFactor: `${effectiveHeatEf.toFixed(3)} kg CO₂e/kWh`,
            source: 'Nordic / EU District Heat Benchmark (ISO 14064)',
            boundary: `Shared ÷ ${validResidents} residents`,
            lifecycleMode: isLifecycle ? 'WTW Network Losses' : 'TTW Heat Output',
            emissionsTco2e: (householdHeatingKg * allocationShare) / 1000,
          });
        }
      } else if (heatingType === 'heat_pump') {
        const annualCompressorKwh = Math.max(0, Number(heatPumpKwhMonth)) * 12;
        householdHeatingKg = annualCompressorKwh * effectiveGridEf;
        operationalHouseholdHeatingKg = annualCompressorKwh * baseGridEf;
        if (annualCompressorKwh > 0) {
          provenanceList.push({
            domain: 'Home Energy',
            activity: 'Heat Pump (Compressor Electricity)',
            quantity: `${annualCompressorKwh.toLocaleString()} kWh/yr`,
            baseFactor: `${baseGridEf.toFixed(3)} kg CO₂e/kWh`,
            effectiveFactor: `${effectiveGridEf.toFixed(3)} kg CO₂e/kWh`,
            source: 'Grid Emission Factor (Electricity Input Only)',
            boundary: `Shared ÷ ${validResidents} residents`,
            lifecycleMode: isLifecycle ? `WTW (+${regionalProfile.tdLossPercent}% T&D)` : 'TTW Generation Only',
            emissionsTco2e: (householdHeatingKg * allocationShare) / 1000,
          });
        }
      } else if (heatingType === 'fuel') {
        const annualFuelQty = Math.max(0, Number(heatingFuelQtyMonth)) * 12;
        const defaultFuelEf =
          heatingFuelType === 'gas' ? 2.02 : heatingFuelType === 'oil' ? 2.54 : 0.039;
        const baseFuelEf = customHeatingFuelEfEnabled && customHeatingFuelEf > 0 ? customHeatingFuelEf : defaultFuelEf;
        const effectiveFuelEf = baseFuelEf * (heatingFuelType === 'biomass' ? 1.0 : fuelWttMultiplier);
        const fuelUnit = heatingFuelType === 'gas' ? 'm³' : heatingFuelType === 'oil' ? 'L' : 'kg';
        householdHeatingKg = annualFuelQty * effectiveFuelEf;
        operationalHouseholdHeatingKg = annualFuelQty * baseFuelEf;
        if (annualFuelQty > 0) {
          provenanceList.push({
            domain: 'Home Energy',
            activity: `Heating Fuel (${heatingFuelType.toUpperCase()})`,
            quantity: `${annualFuelQty.toLocaleString()} ${fuelUnit}/yr`,
            baseFactor: `${baseFuelEf.toFixed(3)} kg CO₂e/${fuelUnit}`,
            effectiveFactor: `${effectiveFuelEf.toFixed(3)} kg CO₂e/${fuelUnit} ${isLifecycle && heatingFuelType !== 'biomass' ? '(+18% WTT)' : ''}`,
            source: customHeatingFuelEfEnabled ? 'Custom Fuel Specification' : 'IPCC Guidelines National GHG Inventories Vol 2',
            boundary: `Shared ÷ ${validResidents} residents`,
            lifecycleMode: isLifecycle ? 'WTW Upstream Extraction + Combustion' : 'TTW Direct Combustion',
            emissionsTco2e: (householdHeatingKg * allocationShare) / 1000,
          });
        }
      }
    }
    const personalHeatingTco2e = (householdHeatingKg * allocationShare) / 1000;
    const operationalPersonalHeatingTco2e = (operationalHouseholdHeatingKg * allocationShare) / 1000;

    // -----------------------------------------------------------------------
    // 3. Cooking Energy (Shared)
    // -----------------------------------------------------------------------
    let householdCookingKg = 0;
    let operationalHouseholdCookingKg = 0;
    if (cookingFuel === 'lpg') {
      const monthlyLpgKg = useExactLpgKg
        ? Math.max(0, Number(exactLpgKgMonth))
        : Math.max(0, Number(lpgCylindersMonth)) * 14.2;
      const annualLpgKg = monthlyLpgKg * 12;
      const baseLpgEf = customCookingEfEnabled && customLpgEf > 0 ? customLpgEf : 2.983;
      const effectiveLpgEf = baseLpgEf * fuelWttMultiplier;
      householdCookingKg = annualLpgKg * effectiveLpgEf;
      operationalHouseholdCookingKg = annualLpgKg * baseLpgEf;
      if (annualLpgKg > 0) {
        provenanceList.push({
          domain: 'Home Energy',
          activity: 'LPG Cooking Cylinders',
          quantity: `${annualLpgKg.toFixed(1)} kg/yr`,
          baseFactor: `${baseLpgEf.toFixed(3)} kg CO₂e/kg`,
          effectiveFactor: `${effectiveLpgEf.toFixed(3)} kg CO₂e/kg ${isLifecycle ? '(+18% WTT)' : ''}`,
          source: customCookingEfEnabled ? 'Custom LPG Specification' : 'IPCC AR6 WG III / MoPNG',
          boundary: `Shared ÷ ${validResidents} residents`,
          lifecycleMode: isLifecycle ? 'WTW Refining + Direct Combustion' : 'TTW Combustion Only',
          emissionsTco2e: (householdCookingKg * allocationShare) / 1000,
        });
      }
    } else if (cookingFuel === 'png') {
      const annualPngM3 = Math.max(0, Number(pngM3Month)) * 12;
      const basePngEf = customCookingEfEnabled && customPngEf > 0 ? customPngEf : 2.02;
      const effectivePngEf = basePngEf * fuelWttMultiplier;
      householdCookingKg = annualPngM3 * effectivePngEf;
      operationalHouseholdCookingKg = annualPngM3 * basePngEf;
      if (annualPngM3 > 0) {
        provenanceList.push({
          domain: 'Home Energy',
          activity: 'Piped Natural Gas (PNG) Cooking',
          quantity: `${annualPngM3.toLocaleString()} m³/yr`,
          baseFactor: `${basePngEf.toFixed(3)} kg CO₂e/m³`,
          effectiveFactor: `${effectivePngEf.toFixed(3)} kg CO₂e/m³ ${isLifecycle ? '(+18% WTT)' : ''}`,
          source: customCookingEfEnabled ? 'Custom PNG Specification' : 'DEFRA / UK DESNZ 2023 & IPCC Vol 2',
          boundary: `Shared ÷ ${validResidents} residents`,
          lifecycleMode: isLifecycle ? 'WTW Wellhead + Pipeline + Burn' : 'TTW Direct Combustion',
          emissionsTco2e: (householdCookingKg * allocationShare) / 1000,
        });
      }
    } else if (cookingFuel === 'biogas') {
      householdCookingKg = 0;
      operationalHouseholdCookingKg = 0;
      if (Number(biogasM3Month) > 0) {
        provenanceList.push({
          domain: 'Home Energy',
          activity: 'Biogas (Anaerobic Digester)',
          quantity: `${(Number(biogasM3Month) * 12).toLocaleString()} m³/yr`,
          baseFactor: '0.000 kg CO₂e/m³',
          effectiveFactor: '0.000 kg CO₂e/m³',
          source: 'IPCC AR6 Chapter 5 (Biogenic Carbon Neutral)',
          boundary: `Shared ÷ ${validResidents} residents`,
          lifecycleMode: 'Closed-Loop Biogenic Neutral',
          emissionsTco2e: 0,
        });
      }
    } else if (cookingFuel === 'electric_induction') {
      householdCookingKg = 0;
      operationalHouseholdCookingKg = 0;
    }
    const personalCookingTco2e = (householdCookingKg * allocationShare) / 1000;
    const operationalPersonalCookingTco2e = (operationalHouseholdCookingKg * allocationShare) / 1000;

    // -----------------------------------------------------------------------
    // 4. Opt-In Domestic Water & Municipal Solid Waste (Shared)
    // -----------------------------------------------------------------------
    let householdWaterKg = 0;
    let householdWasteKg = 0;
    let personalWaterWasteTco2e = 0;
    let operationalPersonalWaterWasteTco2e = 0;
    if (includeWaterWaste) {
      const annualWaterM3 = Math.max(0, Number(waterM3Month)) * 12;
      const baseWaterEf = customWaterWasteEfEnabled && customWaterEf > 0 ? customWaterEf : (0.344 + 0.708);
      const effectiveWaterEf = baseWaterEf * (isLifecycle ? 1.05 : 1.0);
      householdWaterKg = annualWaterM3 * effectiveWaterEf;

      const annualWasteKg = Math.max(0, Number(wasteKgWeek)) * 52;
      const baseWasteEf = customWaterWasteEfEnabled && customWasteEf > 0 ? customWasteEf : 0.586;
      householdWasteKg = annualWasteKg * baseWasteEf;

      personalWaterWasteTco2e = ((householdWaterKg + householdWasteKg) * allocationShare) / 1000;
      operationalPersonalWaterWasteTco2e = (((annualWaterM3 * baseWaterEf) + (annualWasteKg * baseWasteEf)) * allocationShare) / 1000;

      if (annualWaterM3 > 0) {
        provenanceList.push({
          domain: 'Municipal Utilities',
          activity: 'Tap Water Supply & Sewage Treatment',
          quantity: `${annualWaterM3.toLocaleString()} m³/yr`,
          baseFactor: `${baseWaterEf.toFixed(3)} kg CO₂e/m³`,
          effectiveFactor: `${effectiveWaterEf.toFixed(3)} kg CO₂e/m³`,
          source: customWaterWasteEfEnabled ? 'Custom Municipal Water Audit' : 'UK DESNZ 2023 Water Infrastructure',
          boundary: `Shared ÷ ${validResidents} residents`,
          lifecycleMode: isLifecycle ? 'WTW Embodied Treatment Pumping' : 'Direct Utility Operations',
          emissionsTco2e: (householdWaterKg * allocationShare) / 1000,
        });
      }
      if (annualWasteKg > 0) {
        provenanceList.push({
          domain: 'Municipal Utilities',
          activity: 'Municipal Solid Waste (Landfill Methane)',
          quantity: `${annualWasteKg.toLocaleString()} kg/yr`,
          baseFactor: `${baseWasteEf.toFixed(3)} kg CO₂e/kg`,
          effectiveFactor: `${baseWasteEf.toFixed(3)} kg CO₂e/kg`,
          source: customWaterWasteEfEnabled ? 'Custom Waste Stream Assay' : 'IPCC Waste Model AR6 GWP100',
          boundary: `Shared ÷ ${validResidents} residents`,
          lifecycleMode: '20-Year Fugitive Landfill Methane',
          emissionsTco2e: (householdWasteKg * allocationShare) / 1000,
        });
      }
    }

    // -----------------------------------------------------------------------
    // 5. Road & Public Transport (100% Personal)
    // -----------------------------------------------------------------------
    let totalTransportKg = 0;
    let operationalTransportKg = 0;

    commuteLegs.forEach((leg) => {
      const annualKm = Math.max(0, Number(leg.weeklyKm)) * 52;
      const occupancyDivider = Math.max(1, Number(leg.occupancy) || 1);

      if (leg.mode === 'bicycle_walk') {
        // Zero
      } else if (leg.mode === 'metro_rail') {
        // Dynamically coupled to activeGridEf (0.049 kWh/pkm × EF_grid)
        const baseMetroEf = leg.useCustomEf && leg.customEf && leg.customEf > 0 ? leg.customEf : dynamicMetroEf;
        const effectiveMetroEf = baseMetroEf * gridMultiplier;
        const legKg = annualKm * effectiveMetroEf;
        totalTransportKg += legKg;
        operationalTransportKg += annualKm * baseMetroEf;
        if (annualKm > 0) {
          provenanceList.push({
            domain: 'Transport',
            activity: `Public Metro / Urban Rail (${leg.name})`,
            quantity: `${annualKm.toLocaleString()} pkm/yr`,
            baseFactor: `${baseMetroEf.toFixed(4)} kg CO₂e/pkm (0.049 kWh/pkm × ${activeGridEf.toFixed(3)})`,
            effectiveFactor: `${effectiveMetroEf.toFixed(4)} kg CO₂e/pkm ${isLifecycle ? `(+${regionalProfile.tdLossPercent}% T&D)` : ''}`,
            source: leg.useCustomEf ? 'Custom Transit Authority Factor' : 'Dynamic Regional Rail Coupling (KTH Model)',
            boundary: '100% Personal',
            lifecycleMode: isLifecycle ? `WTW Grid Losses (+${regionalProfile.tdLossPercent}%)` : 'TTW Traction Power',
            emissionsTco2e: legKg / 1000,
          });
        }
      } else if (leg.mode === 'commuter_train') {
        // Dynamically coupled to activeGridEf (0.057 kWh/pkm × EF_grid)
        const baseTrainEf = leg.useCustomEf && leg.customEf && leg.customEf > 0 ? leg.customEf : dynamicCommuterTrainEf;
        const effectiveTrainEf = baseTrainEf * gridMultiplier;
        const legKg = annualKm * effectiveTrainEf;
        totalTransportKg += legKg;
        operationalTransportKg += annualKm * baseTrainEf;
        if (annualKm > 0) {
          provenanceList.push({
            domain: 'Transport',
            activity: `Commuter Train / Intercity Rail (${leg.name})`,
            quantity: `${annualKm.toLocaleString()} pkm/yr`,
            baseFactor: `${baseTrainEf.toFixed(4)} kg CO₂e/pkm (0.057 kWh/pkm × ${activeGridEf.toFixed(3)})`,
            effectiveFactor: `${effectiveTrainEf.toFixed(4)} kg CO₂e/pkm ${isLifecycle ? `(+${regionalProfile.tdLossPercent}% T&D)` : ''}`,
            source: leg.useCustomEf ? 'Custom Rail Agency Factor' : 'Dynamic Regional Rail Coupling (UIC / KTH)',
            boundary: '100% Personal',
            lifecycleMode: isLifecycle ? `WTW Rail Grid Losses (+${regionalProfile.tdLossPercent}%)` : 'TTW Traction Power',
            emissionsTco2e: legKg / 1000,
          });
        }
      } else if (leg.mode === 'public_bus') {
        const baseBusEf = leg.useCustomEf && leg.customEf && leg.customEf > 0 ? leg.customEf : 0.089;
        const effectiveBusEf = baseBusEf * fuelWttMultiplier;
        const legKg = annualKm * effectiveBusEf;
        totalTransportKg += legKg;
        operationalTransportKg += annualKm * baseBusEf;
        if (annualKm > 0) {
          provenanceList.push({
            domain: 'Transport',
            activity: `Public Transit Bus (${leg.name})`,
            quantity: `${annualKm.toLocaleString()} pkm/yr`,
            baseFactor: `${baseBusEf.toFixed(3)} kg CO₂e/pkm`,
            effectiveFactor: `${effectiveBusEf.toFixed(3)} kg CO₂e/pkm ${isLifecycle ? '(+18% WTT)' : ''}`,
            source: leg.useCustomEf ? 'Custom Municipal Fleet Factor' : 'UK DESNZ 2023 Local Bus',
            boundary: '100% Personal',
            lifecycleMode: isLifecycle ? 'WTW Upstream Fuel + Exhaust' : 'TTW Fleet Exhaust',
            emissionsTco2e: legKg / 1000,
          });
        }
      } else if (leg.mode === 'ev') {
        const legKwh = annualKm * Math.max(0, Number(leg.efficiency));
        const legKg = legKwh * effectiveGridEf;
        totalTransportKg += legKg;
        operationalTransportKg += legKwh * baseGridEf;
        if (annualKm > 0) {
          provenanceList.push({
            domain: 'Transport',
            activity: `Electric Vehicle (${leg.name})`,
            quantity: `${annualKm.toLocaleString()} km/yr (${legKwh.toFixed(1)} kWh charging)`,
            baseFactor: `${baseGridEf.toFixed(3)} kg CO₂e/kWh @ ${leg.efficiency} kWh/km`,
            effectiveFactor: `${effectiveGridEf.toFixed(3)} kg CO₂e/kWh ${isLifecycle ? `(+${regionalProfile.tdLossPercent}% T&D)` : ''}`,
            source: 'Grid Emission Factor × Battery Powertrain Draw',
            boundary: '100% Personal',
            lifecycleMode: isLifecycle ? `WTW Grid (+${regionalProfile.tdLossPercent}% T&D)` : 'TTW Generation Only',
            emissionsTco2e: legKg / 1000,
          });
        }
      } else if (leg.mode === 'two_wheeler' || leg.mode === 'petrol_car') {
        const baseFuelEf = leg.useCustomEf && leg.customEf && leg.customEf > 0 ? leg.customEf : 2.315;
        const effectiveFuelEf = baseFuelEf * fuelWttMultiplier;
        let legKg = 0;
        let opLegKg = 0;
        let qtyLabel = '';
        if (leg.method === 'fuel_receipt') {
          const annualLiters = Math.max(0, Number(leg.fuelLitersMonth)) * 12;
          legKg = (annualLiters * effectiveFuelEf) / occupancyDivider;
          opLegKg = (annualLiters * baseFuelEf) / occupancyDivider;
          qtyLabel = `${annualLiters.toLocaleString()} L petrol/yr`;
        } else {
          const litersUsed = annualKm * (Math.max(0, Number(leg.efficiency)) / 100);
          legKg = (litersUsed * effectiveFuelEf) / occupancyDivider;
          opLegKg = (litersUsed * baseFuelEf) / occupancyDivider;
          qtyLabel = `${annualKm.toLocaleString()} km/yr (${litersUsed.toFixed(1)} L @ ${leg.efficiency} L/100km)`;
        }
        totalTransportKg += legKg;
        operationalTransportKg += opLegKg;
        if (legKg > 0) {
          provenanceList.push({
            domain: 'Transport',
            activity: `${leg.mode === 'two_wheeler' ? 'Motorcycle/Scooter' : 'Petrol Automobile'} (${leg.method === 'fuel_receipt' ? 'Fuel Receipts' : 'Distance'})`,
            quantity: qtyLabel,
            baseFactor: `${baseFuelEf.toFixed(3)} kg CO₂e/L`,
            effectiveFactor: `${effectiveFuelEf.toFixed(3)} kg CO₂e/L ${isLifecycle ? '(+18% WTT)' : ''}`,
            source: leg.useCustomEf ? 'Custom Fuel Specification' : 'IPCC AR6 Chapter 10 Transport / EPA AP-42',
            boundary: occupancyDivider > 1 ? `Personal (Carpooled ÷ ${occupancyDivider})` : '100% Personal',
            lifecycleMode: isLifecycle ? 'WTW Well-to-Wheel (Extraction + Tailpipe)' : 'TTW Tank-to-Wheel Tailpipe Only',
            emissionsTco2e: legKg / 1000,
          });
        }
      } else if (leg.mode === 'diesel_car') {
        const baseFuelEf = leg.useCustomEf && leg.customEf && leg.customEf > 0 ? leg.customEf : 2.687;
        const effectiveFuelEf = baseFuelEf * fuelWttMultiplier;
        let legKg = 0;
        let opLegKg = 0;
        let qtyLabel = '';
        if (leg.method === 'fuel_receipt') {
          const annualLiters = Math.max(0, Number(leg.fuelLitersMonth)) * 12;
          legKg = (annualLiters * effectiveFuelEf) / occupancyDivider;
          opLegKg = (annualLiters * baseFuelEf) / occupancyDivider;
          qtyLabel = `${annualLiters.toLocaleString()} L diesel/yr`;
        } else {
          const litersUsed = annualKm * (Math.max(0, Number(leg.efficiency)) / 100);
          legKg = (litersUsed * effectiveFuelEf) / occupancyDivider;
          opLegKg = (litersUsed * baseFuelEf) / occupancyDivider;
          qtyLabel = `${annualKm.toLocaleString()} km/yr (${litersUsed.toFixed(1)} L @ ${leg.efficiency} L/100km)`;
        }
        totalTransportKg += legKg;
        operationalTransportKg += opLegKg;
        if (legKg > 0) {
          provenanceList.push({
            domain: 'Transport',
            activity: `Diesel Automobile (${leg.method === 'fuel_receipt' ? 'Fuel Receipts' : 'Distance'})`,
            quantity: qtyLabel,
            baseFactor: `${baseFuelEf.toFixed(3)} kg CO₂e/L`,
            effectiveFactor: `${effectiveFuelEf.toFixed(3)} kg CO₂e/L ${isLifecycle ? '(+18% WTT)' : ''}`,
            source: leg.useCustomEf ? 'Custom Fuel Specification' : 'IPCC AR6 Chapter 10 Transport',
            boundary: occupancyDivider > 1 ? `Personal (Carpooled ÷ ${occupancyDivider})` : '100% Personal',
            lifecycleMode: isLifecycle ? 'WTW Well-to-Wheel (Refinery + Combustion)' : 'TTW Tailpipe Only',
            emissionsTco2e: legKg / 1000,
          });
        }
      }
    });
    const personalTransportTco2e = totalTransportKg / 1000;
    const operationalPersonalTransportTco2e = operationalTransportKg / 1000;

    // -----------------------------------------------------------------------
    // 6. Aviation (100% Personal)
    // -----------------------------------------------------------------------
    let flightKmTotal = 0;
    if (aviationMode === 'exact_km') {
      flightKmTotal = Math.max(0, Number(exactFlightKmYear));
    } else {
      flightKmTotal =
        Math.max(0, Number(shortHaulFlights)) * 1200 + Math.max(0, Number(longHaulFlights)) * 7000;
    }

    const routeClassEf =
      flightRouteClass === 'short_econ'
        ? 0.115
        : flightRouteClass === 'long_econ'
        ? 0.102
        : flightRouteClass === 'business_first'
        ? 0.295
        : Math.max(0, Number(customAviationEf));

    const effectiveAviationEf = routeClassEf * (isLifecycle ? 1.09 : 1.0); // +9% WTT Jet A-1 fuel
    const baseDirectFlightKg = flightKmTotal * effectiveAviationEf;
    const directFlightTco2e = baseDirectFlightKg / 1000;
    const radiativeMultiplier = includeRadiativeForcing ? 1.9 : 1.0;
    const personalAviationTco2e = (baseDirectFlightKg * radiativeMultiplier) / 1000;
    const operationalPersonalAviationTco2e = ((flightKmTotal * routeClassEf) * radiativeMultiplier) / 1000;

    if (flightKmTotal > 0) {
      provenanceList.push({
        domain: 'Aviation',
        activity: `Commercial Passenger Aviation (${flightRouteClass.replace('_', ' ').toUpperCase()})`,
        quantity: `${flightKmTotal.toLocaleString()} pkm/yr`,
        baseFactor: `${routeClassEf.toFixed(3)} kg CO₂e/pkm`,
        effectiveFactor: `${effectiveAviationEf.toFixed(3)} kg CO₂e/pkm ${includeRadiativeForcing ? '× 1.90 RF factor' : ''} ${isLifecycle ? '(+9% Jet WTT)' : ''}`,
        source: 'ICAO Carbon Calculator & UK DESNZ Aviation Factors',
        boundary: '100% Personal (Direct + Optional Cirrus Forcing)',
        lifecycleMode: isLifecycle ? 'WTW Jet Fuel Refining + High-Altitude Burn' : 'Direct In-Flight Fuel Burn',
        emissionsTco2e: personalAviationTco2e,
      });
    }

    // -----------------------------------------------------------------------
    // 7. Food & Diet (100% Personal — Opt-In, Default 0)
    // -----------------------------------------------------------------------
    let personalFoodTco2e = 0;
    if (includeFood) {
      const annualBeefKg = Math.max(0, Number(beefLambKgMonth)) * 12;
      const annualPorkKg = Math.max(0, Number(porkPoultryKgMonth)) * 12;
      const annualDairyKg = Math.max(0, Number(dairyCheeseKgMonth)) * 12;
      const annualPlantKg = Math.max(0, Number(plantGrainsKgMonth)) * 12;

      const beefEf = customFoodEfEnabled && customBeefEf > 0 ? customBeefEf : 27.0;
      const poultryEf = customFoodEfEnabled && customPoultryEf > 0 ? customPoultryEf : 6.9;
      const dairyEf = customFoodEfEnabled && customDairyEf > 0 ? customDairyEf : 8.5;
      const plantEf = customFoodEfEnabled && customPlantEf > 0 ? customPlantEf : 1.5;

      const beefKgCo2e = annualBeefKg * beefEf;
      const porkKgCo2e = annualPorkKg * poultryEf;
      const dairyKgCo2e = annualDairyKg * dairyEf;
      const plantKgCo2e = annualPlantKg * plantEf;

      const totalFoodKgCo2e = beefKgCo2e + porkKgCo2e + dairyKgCo2e + plantKgCo2e;
      personalFoodTco2e = totalFoodKgCo2e / 1000;

      if (totalFoodKgCo2e > 0) {
        provenanceList.push({
          domain: 'Diet & Nutrition',
          activity: 'Direct Dietary Intake (Mass-Based)',
          quantity: `${(annualBeefKg + annualPorkKg + annualDairyKg + annualPlantKg).toFixed(1)} kg food/yr`,
          baseFactor: `LCA Factors (Beef ${beefEf.toFixed(1)}, Poultry ${poultryEf.toFixed(1)}, Dairy ${dairyEf.toFixed(1)}, Plant ${plantEf.toFixed(1)})`,
          effectiveFactor: 'Direct cradle-to-farm-gate mass coefficients',
          source: customFoodEfEnabled ? 'Custom Food LCA Study' : 'Poore & Nemecek (Science 2018) / IPCC AR6',
          boundary: '100% Personal',
          lifecycleMode: 'Cradle-to-Retail Food System LCA',
          emissionsTco2e: personalFoodTco2e,
        });
      }
    }

    // -----------------------------------------------------------------------
    // 8. Goods & Services (100% Personal — Opt-In, Default 0)
    // -----------------------------------------------------------------------
    let personalGoodsTco2e = 0;
    if (includeGoods) {
      if (goodsMode === 'lifecycle_qty') {
        const phoneEf = customGoodsEfEnabled && customPhoneEf > 0 ? customPhoneEf : 70.0;
        const laptopEf = customGoodsEfEnabled && customLaptopEf > 0 ? customLaptopEf : 250.0;
        const clothingEf = customGoodsEfEnabled && customClothingEf > 0 ? customClothingEf : 15.0;
        const footwearEf = customGoodsEfEnabled && customFootwearEf > 0 ? customFootwearEf : 18.0;

        const smartphonesKg = Math.max(0, Number(smartphonesQtyYear)) * phoneEf;
        const laptopsKg = Math.max(0, Number(laptopsQtyYear)) * laptopEf;
        const clothingKg = Math.max(0, Number(clothingItemsYear)) * clothingEf;
        const footwearKg = Math.max(0, Number(footwearPairsYear)) * footwearEf;
        const totalGoodsKg = smartphonesKg + laptopsKg + clothingKg + footwearKg;
        personalGoodsTco2e = totalGoodsKg / 1000;

        if (totalGoodsKg > 0) {
          provenanceList.push({
            domain: 'Manufactured Goods',
            activity: 'Durable Electronics & Apparel Acquisition (LCA Qty)',
            quantity: `${smartphonesQtyYear} phones, ${laptopsQtyYear} laptops, ${clothingItemsYear} apparel items`,
            baseFactor: `Phone ${phoneEf}kg, PC ${laptopEf}kg, Garment ${clothingEf}kg, Shoes ${footwearEf}kg`,
            effectiveFactor: 'Direct Product Environmental Reports (LCA)',
            source: customGoodsEfEnabled ? 'Custom LCA Bill of Materials' : 'Apple / Dell Product Reports & WRAP UK',
            boundary: '100% Personal',
            lifecycleMode: 'Cradle-to-Grave Manufacturing LCA',
            emissionsTco2e: personalGoodsTco2e,
          });
        }
      } else {
        const rateToUsd =
          spendCurrency === 'INR'
            ? 0.0118
            : spendCurrency === 'EUR'
            ? 1.08
            : spendCurrency === 'GBP'
            ? 1.28
            : 1.0;
        const spendUsd = Math.max(0, Number(spendAmount)) * rateToUsd;
        const defaultSectorEf =
          spendSector === 'electronics'
            ? 0.32
            : spendSector === 'clothing'
            ? 0.45
            : spendSector === 'services'
            ? 0.18
            : 0.38;
        const sectorEf = customGoodsEfEnabled && customSpendEf > 0 ? customSpendEf : defaultSectorEf;
        const goodsKg = spendUsd * sectorEf;
        personalGoodsTco2e = goodsKg / 1000;

        if (goodsKg > 0) {
          provenanceList.push({
            domain: 'Consumer Goods',
            activity: `Discretionary Spend (${spendSector.toUpperCase()}, ${spendCurrency})`,
            quantity: `${spendCurrency} ${Number(spendAmount).toLocaleString()} ($${spendUsd.toFixed(0)} USD)`,
            baseFactor: `${sectorEf.toFixed(3)} kg CO₂e / USD (2024 price basis)`,
            effectiveFactor: `${sectorEf.toFixed(3)} kg CO₂e / USD`,
            source: customGoodsEfEnabled ? 'Custom Environmentally Extended Input-Output Factor' : 'US EPA USEEIO v2.0.1 (2024)',
            boundary: '100% Personal',
            lifecycleMode: 'Supply Chain EEIO Multiplier',
            emissionsTco2e: personalGoodsTco2e,
          });
        }
      }
    }

    // -----------------------------------------------------------------------
    // Totals & Allocation Synthesis
    // -----------------------------------------------------------------------
    const totalPersonalTco2e =
      personalElecTco2e +
      personalHeatingTco2e +
      personalCookingTco2e +
      personalWaterWasteTco2e +
      personalTransportTco2e +
      personalAviationTco2e +
      personalFoodTco2e +
      personalGoodsTco2e;

    const operationalPersonalTco2e =
      operationalPersonalElecTco2e +
      operationalPersonalHeatingTco2e +
      operationalPersonalCookingTco2e +
      operationalPersonalWaterWasteTco2e +
      operationalPersonalTransportTco2e +
      operationalPersonalAviationTco2e +
      personalFoodTco2e +
      personalGoodsTco2e;

    const upstreamLifecycleDeltaTco2e = Math.max(0, totalPersonalTco2e - operationalPersonalTco2e);

    const totalHouseholdGrossTco2e =
      (householdElecKg +
        householdHeatingKg +
        householdCookingKg +
        householdWaterKg +
        householdWasteKg) /
        1000 +
      personalTransportTco2e * validResidents +
      personalAviationTco2e * validResidents +
      personalFoodTco2e * validResidents +
      personalGoodsTco2e * validResidents;

    const creditsNeeded = Math.ceil(totalPersonalTco2e);

    // Dynamic Regional Benchmark Comparison
    const nationalAverage = regionalProfile.nationalAverage;
    const benchmarkLabel = regionalProfile.benchmarkLabel;
    const pctOfAverage = nationalAverage > 0 ? Math.round((totalPersonalTco2e / nationalAverage) * 100) : 0;

    return {
      validResidents,
      allocationShare,
      isLifecycle,
      systemBoundary,
      personalElecTco2e,
      personalHeatingTco2e,
      personalCookingTco2e,
      personalWaterWasteTco2e,
      personalTransportTco2e,
      personalAviationTco2e,
      directFlightTco2e,
      personalFoodTco2e,
      personalGoodsTco2e,
      totalPersonalTco2e,
      operationalPersonalTco2e,
      upstreamLifecycleDeltaTco2e,
      totalHouseholdGrossTco2e,
      creditsNeeded,
      nationalAverage,
      benchmarkLabel,
      pctOfAverage,
      provenanceList,
    };
  }, [
    residents,
    systemBoundary,
    electricityKwh,
    activeGridEf,
    useCustomGridFactor,
    gridPreset,
    regionalProfile,
    includeHeating,
    heatingType,
    districtHeatKwhMonth,
    districtHeatEf,
    heatPumpKwhMonth,
    heatingFuelType,
    heatingFuelQtyMonth,
    customHeatingFuelEfEnabled,
    customHeatingFuelEf,
    cookingFuel,
    useExactLpgKg,
    exactLpgKgMonth,
    lpgCylindersMonth,
    pngM3Month,
    biogasM3Month,
    customCookingEfEnabled,
    customLpgEf,
    customPngEf,
    includeWaterWaste,
    waterM3Month,
    wasteKgWeek,
    customWaterWasteEfEnabled,
    customWaterEf,
    customWasteEf,
    commuteLegs,
    dynamicMetroEf,
    dynamicCommuterTrainEf,
    aviationMode,
    exactFlightKmYear,
    shortHaulFlights,
    longHaulFlights,
    flightRouteClass,
    customAviationEf,
    includeRadiativeForcing,
    includeFood,
    beefLambKgMonth,
    porkPoultryKgMonth,
    dairyCheeseKgMonth,
    plantGrainsKgMonth,
    customFoodEfEnabled,
    customBeefEf,
    customPoultryEf,
    customDairyEf,
    customPlantEf,
    includeGoods,
    goodsMode,
    smartphonesQtyYear,
    laptopsQtyYear,
    clothingItemsYear,
    footwearPairsYear,
    customGoodsEfEnabled,
    customPhoneEf,
    customLaptopEf,
    customClothingEf,
    customFootwearEf,
    spendAmount,
    spendCurrency,
    spendSector,
    customSpendEf,
  ]);

  // Retirement Flow Action
  const handleGetRetirementQuote = async () => {
    setIsRetiring(true);
    try {
      const res = await fetch('/api/retire-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tco2e: calculation.totalPersonalTco2e,
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
    <div className="space-y-8 animate-fadeIn pb-20 md:pb-0 w-full max-w-full overflow-x-hidden">
      {/* ============================================================== */}
      {/* TOP BANNER: KTH BOUNDARY RULES & ZERO FORCED DEFAULTS */}
      {/* ============================================================== */}
      <div className="bg-emerald-950 text-white rounded-2xl p-4 sm:p-6 shadow-xs border border-emerald-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              KTH Lifecycle Precision Engine · Zero Forced Defaults
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Personal &amp; Household Carbon Assessment
          </h2>
          <p className="text-xs text-emerald-200/80 max-w-2xl mt-0.5 leading-relaxed">
            Deterministic double-precision accounting. Strictly separates shared household utilities (divided by residents) from 100% personal transit, flights, diet, and manufactured goods.
          </p>
        </div>

        {/* Quick Archetype Loaders */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <span className="text-[11px] font-mono text-emerald-300/80 mr-1 hidden sm:inline">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('zero')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-[11px] font-mono font-bold text-white border border-emerald-700/60 transition flex items-center gap-1"
            title="Reset all fields to exact 0"
          >
            <RotateCcw className="w-3 h-3 text-emerald-400" />
            <span>Zero Baseline</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('urban_professional')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-[11px] font-mono font-bold text-emerald-100 border border-emerald-600/60 transition"
          >
            Urban Pro
          </button>
          <button
            type="button"
            onClick={() => applyPreset('rural_homestead')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-[11px] font-mono font-bold text-emerald-100 border border-emerald-600/60 transition"
          >
            Homestead
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SYSTEM BOUNDARY SELECTION (TTW VS FULL LIFECYCLE WTW + T&D) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono text-emerald-800 font-bold uppercase tracking-wider block">
              Accounting System Boundary (ISO 14064-1 &amp; GHG Protocol Scope 3 Cat 3)
            </span>
            <h3 className="text-sm sm:text-base font-bold text-zinc-950">
              Lifecycle System Boundary Selection
            </h3>
          </div>

          {/* Segmented Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSystemBoundary('operational')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition text-center ${
                systemBoundary === 'operational'
                  ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <span>🏛️ Statutory Operational (TTW / Scope 1+2)</span>
            </button>
            <button
              type="button"
              onClick={() => setSystemBoundary('lifecycle')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition text-center ${
                systemBoundary === 'lifecycle'
                  ? 'bg-emerald-800 text-white shadow-xs font-extrabold'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <span>🔬 Full Lifecycle (WTW + T&amp;D Losses)</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-xs text-zinc-600 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          {systemBoundary === 'operational' ? (
            <div>
              <strong>Statutory Operational Boundary Active:</strong> Direct Tank-to-Wheel (TTW) combustion factors and statutory generation grid factors ({activeGridEf.toFixed(3)} kg/kWh). Aligns with standard corporate Scope 1 &amp; 2 carbon registers.
            </div>
          ) : (
            <div>
              <strong>Full Lifecycle Well-to-Wheel (WTW) Active:</strong> Adds Scope 3 Category 3 upstream fuel extraction &amp; refining (+18% WTT) and regional grid Transmission &amp; Distribution losses (+{regionalProfile.tdLossPercent}% for {gridPreset.country}). Accurately captures full atmospheric warming impacts.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2-COLUMN MAIN WORKSPACE */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: All 8 KTH Modules */}
        <div className="lg:col-span-7 space-y-6">
          {/* ========================================================== */}
          {/* MODULE 1: SHARED HOUSEHOLD ALLOCATION */}
          {/* ========================================================== */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  1. Shared Household Allocation
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                Allocation Share: {(calculation.allocationShare * 100).toFixed(1)}%
              </span>
            </div>

            <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label htmlFor="household-residents" className="text-xs font-bold text-zinc-800 block">
                  Number of Household Residents
                </label>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Applies <code className="text-emerald-700 font-mono font-bold">1 ÷ residents</code> strictly to shared utilities (Electricity, Heating, Cooking, Water, Municipal Waste).
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  id="household-residents"
                  type="number"
                  min={1}
                  max={25}
                  value={residents}
                  onChange={(e) => setResidents(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-sm text-center text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
                <span className="text-xs font-medium text-zinc-600">people</span>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* MODULE 2: HOME ENERGY (ELECTRICITY, HEATING & COOKING) */}
          {/* ========================================================== */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  2. Home Energy (Electricity, Heating &amp; Cooking)
                </h3>
              </div>

              {/* Grid Preset Dropdown */}
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

            {/* Sub-item A: Grid Electricity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">
                    Monthly Electricity Draw
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Active Grid Factor: <code className="font-mono text-emerald-800 font-bold">{activeGridEf.toFixed(3)} kg CO₂e/kWh</code>
                    {systemBoundary === 'lifecycle' && (
                      <span className="text-purple-700 font-mono ml-1">
                        (+{regionalProfile.tdLossPercent}% T&amp;D = {(activeGridEf * (1 + regionalProfile.tdLossRate)).toFixed(3)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={electricityKwh}
                    onChange={(e) => setElectricityKwh(Math.max(0, Number(e.target.value)))}
                    className="w-20 bg-zinc-100 border border-zinc-200 rounded px-2 py-1 font-mono font-bold text-xs text-right text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
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
                <span>500 kWh</span>
                <span>1000 kWh</span>
                <span>1500 kWh</span>
              </div>

              {/* Custom Grid Factor Toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-600">
                  <input
                    type="checkbox"
                    checked={useCustomGridFactor}
                    onChange={(e) => setUseCustomGridFactor(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-700"
                  />
                  <span>Override with specific utility supplier emission factor</span>
                </label>
                {useCustomGridFactor && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                    <span className="text-zinc-600">Custom Factor:</span>
                    <input
                      type="number"
                      step={0.001}
                      min={0}
                      value={customGridFactor}
                      onChange={(e) => setCustomGridFactor(Number(e.target.value))}
                      className="w-24 bg-white border border-zinc-300 rounded px-2 py-0.5 font-mono text-xs text-right text-zinc-900"
                    />
                    <span className="text-zinc-500 font-mono text-[10px]">kg CO₂e/kWh</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-item B: Home Heating (Optional — Default 0) */}
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-900">
                <input
                  type="checkbox"
                  checked={includeHeating}
                  onChange={(e) => setIncludeHeating(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
                <span>Include Home Space Heating Assessment (Default: None / 0)</span>
              </label>

              {includeHeating && (
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-4 animate-fadeIn text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="font-bold text-zinc-800">Heating Technology:</label>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setHeatingType('district_heat')}
                        className={`px-2.5 py-1 rounded text-xs font-medium border ${
                          heatingType === 'district_heat'
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-zinc-700 border-zinc-200'
                        }`}
                      >
                        District Heating
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeatingType('heat_pump')}
                        className={`px-2.5 py-1 rounded text-xs font-medium border ${
                          heatingType === 'heat_pump'
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-zinc-700 border-zinc-200'
                        }`}
                      >
                        Heat Pump
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeatingType('fuel')}
                        className={`px-2.5 py-1 rounded text-xs font-medium border ${
                          heatingType === 'fuel'
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-zinc-700 border-zinc-200'
                        }`}
                      >
                        Combustion Fuel
                      </button>
                    </div>
                  </div>

                  {heatingType === 'district_heat' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-zinc-700 block mb-1">Monthly Heat Delivered (kWh):</label>
                        <input
                          type="number"
                          min={0}
                          value={districtHeatKwhMonth}
                          onChange={(e) => setDistrictHeatKwhMonth(Number(e.target.value))}
                          className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 font-mono text-zinc-900 text-xs"
                          placeholder="e.g. 500"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-700 block mb-1">District Heat EF (kg CO₂e/kWh):</label>
                        <input
                          type="number"
                          step={0.001}
                          min={0}
                          value={districtHeatEf}
                          onChange={(e) => setDistrictHeatEf(Number(e.target.value))}
                          className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 font-mono text-zinc-900 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {heatingType === 'heat_pump' && (
                    <div className="pt-1 space-y-2">
                      <label className="text-zinc-700 block">Compressor Electricity Input (kWh/month):</label>
                      <input
                        type="number"
                        min={0}
                        value={heatPumpKwhMonth}
                        onChange={(e) => setHeatPumpKwhMonth(Number(e.target.value))}
                        className="w-full sm:w-48 bg-white border border-zinc-300 rounded px-2.5 py-1.5 font-mono text-zinc-900 text-xs"
                        placeholder="e.g. 200"
                      />
                      <p className="text-[11px] text-zinc-500">
                        ⚡ Per ISO/KTH rules, only electrical energy input is accounted for; ambient extracted thermal heat is renewable energy.
                      </p>
                    </div>
                  )}

                  {heatingType === 'fuel' && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-zinc-700 block mb-1">Fuel Type:</label>
                          <select
                            value={heatingFuelType}
                            onChange={(e) => setHeatingFuelType(e.target.value as any)}
                            className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-zinc-900 text-xs"
                          >
                            <option value="gas">Natural Gas (2.02 kg CO₂e/m³)</option>
                            <option value="oil">Heating Oil (2.54 kg CO₂e/L)</option>
                            <option value="biomass">Wood Pellets (0.039 kg CO₂e/kg)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-zinc-700 block mb-1">
                            Monthly Quantity ({heatingFuelType === 'gas' ? 'm³' : heatingFuelType === 'oil' ? 'L' : 'kg'}):
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={heatingFuelQtyMonth}
                            onChange={(e) => setHeatingFuelQtyMonth(Number(e.target.value))}
                            className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 font-mono text-zinc-900 text-xs"
                            placeholder="e.g. 50"
                          />
                        </div>
                      </div>

                      {/* Custom Heating Fuel EF Override */}
                      <div className="pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600">
                          <input
                            type="checkbox"
                            checked={customHeatingFuelEfEnabled}
                            onChange={(e) => setCustomHeatingFuelEfEnabled(e.target.checked)}
                            className="rounded text-emerald-700 focus:ring-emerald-700"
                          />
                          <span>Override heating fuel emission factor</span>
                        </label>
                        {customHeatingFuelEfEnabled && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <input
                              type="number"
                              step={0.001}
                              min={0}
                              value={customHeatingFuelEf}
                              onChange={(e) => setCustomHeatingFuelEf(Number(e.target.value))}
                              className="w-24 bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-xs text-zinc-900"
                            />
                            <span className="text-[10px] text-zinc-500 font-mono">kg CO₂e/unit</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sub-item C: Cooking Energy (Multi-Fuel Selector) */}
            <div className="pt-4 border-t border-zinc-100 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-zinc-900">
                    Cooking Energy (Multi-Fuel Selector)
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setCookingFuel('none')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                      cookingFuel === 'none'
                        ? 'bg-white text-zinc-900 shadow-xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    None / 0
                  </button>
                  <button
                    type="button"
                    onClick={() => setCookingFuel('lpg')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                      cookingFuel === 'lpg'
                        ? 'bg-white text-zinc-900 shadow-xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    LPG Cylinder
                  </button>
                  <button
                    type="button"
                    onClick={() => setCookingFuel('png')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                      cookingFuel === 'png'
                        ? 'bg-white text-zinc-900 shadow-xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    PNG Gas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCookingFuel('biogas')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                      cookingFuel === 'biogas'
                        ? 'bg-white text-zinc-900 shadow-xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Biogas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCookingFuel('electric_induction')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                      cookingFuel === 'electric_induction'
                        ? 'bg-white text-zinc-900 shadow-xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Electric
                  </button>
                </div>
              </div>

              {cookingFuel === 'none' && (
                <p className="text-[11px] text-zinc-400 italic">
                  Zero cooking fuel emissions recorded.
                </p>
              )}

              {cookingFuel === 'lpg' && (
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-zinc-800 block">LPG Consumption Mode:</span>
                      <span className="text-[11px] text-zinc-500 font-mono">Factor: 2.983 kg CO₂e / kg LPG</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600">
                      <input
                        type="checkbox"
                        checked={useExactLpgKg}
                        onChange={(e) => setUseExactLpgKg(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-700"
                      />
                      <span>Exact kg input</span>
                    </label>
                  </div>

                  {useExactLpgKg ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={exactLpgKgMonth}
                        onChange={(e) => setExactLpgKgMonth(Number(e.target.value))}
                        className="w-24 bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                      />
                      <span className="text-zinc-600 font-mono">kg LPG / month</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-zinc-700">Standard 14.2 kg Cylinders:</span>
                        <span className="font-bold text-zinc-900">{lpgCylindersMonth} cylinders/mo</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={4}
                        step={0.5}
                        value={lpgCylindersMonth}
                        onChange={(e) => setLpgCylindersMonth(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  )}

                  {/* Custom LPG EF Override */}
                  <div className="pt-2 border-t border-zinc-200/60">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600">
                      <input
                        type="checkbox"
                        checked={customCookingEfEnabled}
                        onChange={(e) => setCustomCookingEfEnabled(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-700"
                      />
                      <span>Custom LPG Emission Factor</span>
                    </label>
                    {customCookingEfEnabled && (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          step={0.001}
                          min={0}
                          value={customLpgEf}
                          onChange={(e) => setCustomLpgEf(Number(e.target.value))}
                          className="w-24 bg-white border border-zinc-300 rounded px-2 py-0.5 font-mono text-xs text-zinc-900"
                        />
                        <span className="text-[10px] text-zinc-500 font-mono">kg CO₂e/kg</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {cookingFuel === 'png' && (
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-zinc-800 block">Piped Natural Gas (PNG):</span>
                      <span className="text-[11px] text-zinc-500 font-mono">Factor: 2.020 kg CO₂e / m³</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={pngM3Month}
                        onChange={(e) => setPngM3Month(Number(e.target.value))}
                        className="w-20 bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs text-right"
                      />
                      <span className="text-zinc-600 font-mono">m³/mo</span>
                    </div>
                  </div>

                  {/* Custom PNG EF Override */}
                  <div className="pt-2 border-t border-zinc-200/60">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600">
                      <input
                        type="checkbox"
                        checked={customCookingEfEnabled}
                        onChange={(e) => setCustomCookingEfEnabled(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-700"
                      />
                      <span>Custom PNG Emission Factor</span>
                    </label>
                    {customCookingEfEnabled && (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          step={0.001}
                          min={0}
                          value={customPngEf}
                          onChange={(e) => setCustomPngEf(Number(e.target.value))}
                          className="w-24 bg-white border border-zinc-300 rounded px-2 py-0.5 font-mono text-xs text-zinc-900"
                        />
                        <span className="text-[10px] text-zinc-500 font-mono">kg CO₂e/m³</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {cookingFuel === 'biogas' && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Biogenic Carbon Neutral (0.000 kg CO₂e/m³)
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Per IPCC AR6 guidelines, CO₂ released from anaerobic digestion of organic kitchen waste or manure is closed-loop carbon neutral.
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
                    Electric cooking is already accounted for under your monthly electricity draw (kWh) above to prevent double-counting.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================== */}
          {/* MODULE 3: ROAD & PUBLIC TRANSPORT (MULTI-LEG BUILDER) */}
          {/* ========================================================== */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    3. Road &amp; Public Transport
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    Dynamic Regional Electric Rail · Strict Fuel-vs-Distance XOR Boundary
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={addCommuteLeg}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Commute Leg</span>
              </button>
            </div>

            <div className="space-y-4">
              {commuteLegs.map((leg, idx) => (
                <div
                  key={leg.id}
                  className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 space-y-3 text-xs relative"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-zinc-800">Leg #{idx + 1}:</span>
                      <select
                        value={leg.mode}
                        onChange={(e) => updateCommuteLeg(leg.id, { mode: e.target.value as TransitMode })}
                        className="bg-white border border-zinc-300 rounded px-2 py-1 font-medium text-zinc-900 text-xs"
                      >
                        <option value="bicycle_walk">🚶 Bicycle / Walk (0.000 kg/km)</option>
                        <option value="metro_rail">🚇 Metro Rail (Dynamic: {dynamicMetroEf.toFixed(3)} kg/pkm)</option>
                        <option value="commuter_train">🚆 Commuter Train (Dynamic: {dynamicCommuterTrainEf.toFixed(3)} kg/pkm)</option>
                        <option value="public_bus">🚌 Public Bus (0.089 kg/km)</option>
                        <option value="ev">⚡ Electric Vehicle (EV)</option>
                        <option value="two_wheeler">🛵 Motorcycle / Scooter (Two-Wheeler)</option>
                        <option value="petrol_car">🚗 Petrol Automobile</option>
                        <option value="diesel_car">🚙 Diesel Automobile</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCommuteLeg(leg.id)}
                      className="text-zinc-400 hover:text-red-600 transition"
                      title="Remove Leg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mode-Specific Controls */}
                  {['bicycle_walk', 'metro_rail', 'commuter_train', 'public_bus'].includes(leg.mode) && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-zinc-600">Weekly Commute Distance:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            value={leg.weeklyKm}
                            onChange={(e) => updateCommuteLeg(leg.id, { weeklyKm: Math.max(0, Number(e.target.value)) })}
                            className="w-20 bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs text-right"
                          />
                          <span className="text-zinc-500 font-mono">km/week</span>
                        </div>
                      </div>

                      {/* Custom EF Override for Public Transit Leg */}
                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <label className="flex items-center gap-1.5 cursor-pointer text-zinc-600">
                          <input
                            type="checkbox"
                            checked={leg.useCustomEf || false}
                            onChange={(e) => updateCommuteLeg(leg.id, { useCustomEf: e.target.checked })}
                            className="rounded text-emerald-700 focus:ring-emerald-700"
                          />
                          <span>Custom EF Override</span>
                        </label>
                        {leg.useCustomEf && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step={0.001}
                              min={0}
                              value={leg.customEf || 0.035}
                              onChange={(e) => updateCommuteLeg(leg.id, { customEf: Number(e.target.value) })}
                              className="w-20 bg-white border border-zinc-300 rounded px-1.5 py-0.5 font-mono text-xs text-right"
                            />
                            <span className="text-zinc-400 font-mono text-[10px]">kg/pkm</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {leg.mode === 'ev' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-zinc-600 block mb-1">Weekly Distance (km):</label>
                        <input
                          type="number"
                          min={0}
                          value={leg.weeklyKm}
                          onChange={(e) => updateCommuteLeg(leg.id, { weeklyKm: Math.max(0, Number(e.target.value)) })}
                          className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-600 block mb-1">Vehicle Efficiency (kWh/km):</label>
                        <input
                          type="number"
                          step={0.01}
                          min={0.05}
                          value={leg.efficiency}
                          onChange={(e) => updateCommuteLeg(leg.id, { efficiency: Number(e.target.value) })}
                          className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {['two_wheeler', 'petrol_car', 'diesel_car'].includes(leg.mode) && (
                    <div className="space-y-3 pt-1 border-t border-zinc-200/60">
                      {/* Strict XOR Method Switcher */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-zinc-700 font-bold">Accounting Method (Strict XOR):</span>
                        <div className="flex bg-zinc-200/70 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateCommuteLeg(leg.id, { method: 'distance' })}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                              leg.method === 'distance'
                                ? 'bg-white text-zinc-950 shadow-xs'
                                : 'text-zinc-600 hover:text-zinc-950'
                            }`}
                          >
                            Method B: Distance (km)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCommuteLeg(leg.id, { method: 'fuel_receipt' })}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                              leg.method === 'fuel_receipt'
                                ? 'bg-white text-zinc-950 shadow-xs'
                                : 'text-zinc-600 hover:text-zinc-950'
                            }`}
                          >
                            Method A: Fuel Liters
                          </button>
                        </div>
                      </div>

                      {leg.method === 'distance' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-zinc-600 block mb-1">Weekly Distance:</label>
                            <input
                              type="number"
                              min={0}
                              value={leg.weeklyKm}
                              onChange={(e) => updateCommuteLeg(leg.id, { weeklyKm: Math.max(0, Number(e.target.value)) })}
                              className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                            />
                            <span className="text-[10px] text-zinc-400 font-mono">km/week</span>
                          </div>
                          <div>
                            <label className="text-zinc-600 block mb-1">Fuel Economy:</label>
                            <input
                              type="number"
                              step={0.1}
                              min={0.5}
                              value={leg.efficiency}
                              onChange={(e) => updateCommuteLeg(leg.id, { efficiency: Number(e.target.value) })}
                              className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                            />
                            <span className="text-[10px] text-zinc-400 font-mono">L/100km</span>
                          </div>
                          <div>
                            <label className="text-zinc-600 block mb-1">Vehicle Occupancy:</label>
                            <input
                              type="number"
                              min={1}
                              max={6}
                              value={leg.occupancy}
                              onChange={(e) => updateCommuteLeg(leg.id, { occupancy: Math.max(1, Number(e.target.value) || 1) })}
                              className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                            />
                            <span className="text-[10px] text-zinc-400 font-mono">passengers</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-zinc-600">Monthly Fuel Purchased:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={leg.fuelLitersMonth}
                              onChange={(e) => updateCommuteLeg(leg.id, { fuelLitersMonth: Math.max(0, Number(e.target.value)) })}
                              className="w-24 bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs text-right"
                            />
                            <span className="text-zinc-500 font-mono">L/month</span>
                          </div>
                        </div>
                      )}

                      {/* Custom Fuel EF Override per Leg */}
                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <label className="flex items-center gap-1.5 cursor-pointer text-zinc-600">
                          <input
                            type="checkbox"
                            checked={leg.useCustomEf || false}
                            onChange={(e) => updateCommuteLeg(leg.id, { useCustomEf: e.target.checked })}
                            className="rounded text-emerald-700 focus:ring-emerald-700"
                          />
                          <span>Custom Fuel EF Override</span>
                        </label>
                        {leg.useCustomEf && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step={0.001}
                              min={0}
                              value={leg.customEf || (leg.mode === 'diesel_car' ? 2.687 : 2.315)}
                              onChange={(e) => updateCommuteLeg(leg.id, { customEf: Number(e.target.value) })}
                              className="w-20 bg-white border border-zinc-300 rounded px-1.5 py-0.5 font-mono text-xs text-right"
                            />
                            <span className="text-zinc-400 font-mono text-[10px]">kg CO₂e/L</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================== */}
          {/* MODULE 4: AVIATION (EXACT DISTANCE × ROUTE CLASS + NON-CO2) */}
          {/* ========================================================== */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
                  <Plane className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  4. Commercial Passenger Aviation
                </h3>
              </div>
              <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setAviationMode('exact_km')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    aviationMode === 'exact_km'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  Exact km
                </button>
                <button
                  type="button"
                  onClick={() => setAviationMode('counts')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    aviationMode === 'counts'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  Flight Counts
                </button>
              </div>
            </div>

            {aviationMode === 'exact_km' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="exact-flight-km" className="text-xs font-bold text-zinc-800">
                    Annual Round-Trip Flight Distance:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="exact-flight-km"
                      type="number"
                      min={0}
                      value={exactFlightKmYear}
                      onChange={(e) => setExactFlightKmYear(Math.max(0, Number(e.target.value)))}
                      className="w-24 bg-zinc-100 border border-zinc-200 rounded px-2 py-1 font-mono font-bold text-xs text-right text-zinc-900"
                    />
                    <span className="text-xs font-mono text-zinc-500">km/yr</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30000}
                  step={500}
                  value={exactFlightKmYear}
                  onChange={(e) => setExactFlightKmYear(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                  <span className="text-xs font-bold text-zinc-800 block">Short-Haul (&lt;1,500 km):</span>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-mono">1,200 km avg / flight</span>
                    <input
                      type="number"
                      min={0}
                      value={shortHaulFlights}
                      onChange={(e) => setShortHaulFlights(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-xs text-right text-zinc-900"
                    />
                  </div>
                </div>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-1">
                  <span className="text-xs font-bold text-zinc-800 block">Long-Haul (&gt;1,500 km):</span>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-mono">7,000 km avg / flight</span>
                    <input
                      type="number"
                      min={0}
                      value={longHaulFlights}
                      onChange={(e) => setLongHaulFlights(Math.max(0, Number(e.target.value)))}
                      className="w-16 bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-xs text-right text-zinc-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Route / Cabin Class Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-zinc-800 block mb-1">
                  Seating Class / Route Type:
                </label>
                <select
                  value={flightRouteClass}
                  onChange={(e) => setFlightRouteClass(e.target.value as any)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-medium"
                >
                  <option value="short_econ">Short-Haul Economy (0.115 kg/km)</option>
                  <option value="long_econ">Long-Haul Economy (0.102 kg/km)</option>
                  <option value="business_first">Business / First Class (0.295 kg/km)</option>
                  <option value="custom">Custom Emission Factor Override</option>
                </select>
              </div>

              {flightRouteClass === 'custom' && (
                <div>
                  <label className="text-xs font-bold text-zinc-800 block mb-1">
                    Custom Aviation EF:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step={0.001}
                      min={0}
                      value={customAviationEf}
                      onChange={(e) => setCustomAviationEf(Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1.5 font-mono text-xs text-zinc-900"
                    />
                    <span className="text-zinc-500 font-mono text-[11px]">kg/pkm</span>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Radiative Forcing (Unchecked by default) */}
            <div className="pt-2 border-t border-zinc-100">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-zinc-700">
                <input
                  type="checkbox"
                  checked={includeRadiativeForcing}
                  onChange={(e) => setIncludeRadiativeForcing(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-zinc-900">
                    Include High-Altitude Non-CO₂ Radiative Forcing (+90% CIRRUS multiplier)
                  </span>
                  <span className="text-[11px] text-zinc-500 block leading-relaxed">
                    Per DEFRA / UK DESNZ guidelines, high-altitude contrails and NOx impacts multiply gross climate forcing by 1.90. (Optional sensitivity check — unchecked by default).
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* ========================================================== */}
          {/* MODULE 5: FOOD & DIET (MASS IN KG × EF — OPT-IN) */}
          {/* ========================================================== */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Utensils className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  5. Food &amp; Diet (Mass in kg × Lifecycle EF)
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-800">
                <input
                  type="checkbox"
                  checked={includeFood}
                  onChange={(e) => setIncludeFood(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
                <span>Include Food Assessment</span>
              </label>
            </div>

            {includeFood ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Diet Quick Fill Buttons */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-zinc-500 font-mono text-[11px]">Autofill Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBeefLambKgMonth(0);
                      setPorkPoultryKgMonth(0);
                      setDairyCheeseKgMonth(0);
                      setPlantGrainsKgMonth(35);
                    }}
                    className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded text-[11px] font-medium"
                  >
                    🌱 Vegan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBeefLambKgMonth(0);
                      setPorkPoultryKgMonth(0);
                      setDairyCheeseKgMonth(12);
                      setPlantGrainsKgMonth(30);
                    }}
                    className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded text-[11px] font-medium"
                  >
                    🧀 Vegetarian
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBeefLambKgMonth(2);
                      setPorkPoultryKgMonth(5);
                      setDairyCheeseKgMonth(10);
                      setPlantGrainsKgMonth(25);
                    }}
                    className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded text-[11px] font-medium"
                  >
                    🍗 Omnivore
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBeefLambKgMonth(6);
                      setPorkPoultryKgMonth(10);
                      setDairyCheeseKgMonth(12);
                      setPlantGrainsKgMonth(20);
                    }}
                    className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded text-[11px] font-medium"
                  >
                    🥩 High-Meat
                  </button>
                </div>

                {/* 4 Mass Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-red-900">Beef &amp; Lamb:</span>
                      <span className="font-mono text-[10px] text-zinc-500">27.0 kg CO₂e/kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={beefLambKgMonth}
                        onChange={(e) => setBeefLambKgMonth(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                      />
                      <span className="text-zinc-600 font-mono">kg/mo</span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-900">Pork &amp; Poultry:</span>
                      <span className="font-mono text-[10px] text-zinc-500">6.9 kg CO₂e/kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={porkPoultryKgMonth}
                        onChange={(e) => setPorkPoultryKgMonth(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                      />
                      <span className="text-zinc-600 font-mono">kg/mo</span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-yellow-900">Dairy &amp; Cheese:</span>
                      <span className="font-mono text-[10px] text-zinc-500">8.5 kg CO₂e/kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={dairyCheeseKgMonth}
                        onChange={(e) => setDairyCheeseKgMonth(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                      />
                      <span className="text-zinc-600 font-mono">kg/mo</span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-900">Plant-Based / Grains / Legumes:</span>
                      <span className="font-mono text-[10px] text-zinc-500">1.5 kg CO₂e/kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={plantGrainsKgMonth}
                        onChange={(e) => setPlantGrainsKgMonth(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                      />
                      <span className="text-zinc-600 font-mono">kg/mo</span>
                    </div>
                  </div>
                </div>

                {/* Custom Food EFs Toggle */}
                <div className="pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600">
                    <input
                      type="checkbox"
                      checked={customFoodEfEnabled}
                      onChange={(e) => setCustomFoodEfEnabled(e.target.checked)}
                      className="rounded text-emerald-700 focus:ring-emerald-700"
                    />
                    <span>Override dietary emission factor coefficients</span>
                  </label>
                  {customFoodEfEnabled && (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Beef (kg/kg):</span>
                        <input
                          type="number"
                          step={0.1}
                          value={customBeefEf}
                          onChange={(e) => setCustomBeefEf(Number(e.target.value))}
                          className="w-full bg-white border border-zinc-300 rounded px-1.5 py-0.5 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Poultry (kg/kg):</span>
                        <input
                          type="number"
                          step={0.1}
                          value={customPoultryEf}
                          onChange={(e) => setCustomPoultryEf(Number(e.target.value))}
                          className="w-full bg-white border border-zinc-300 rounded px-1.5 py-0.5 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Dairy (kg/kg):</span>
                        <input
                          type="number"
                          step={0.1}
                          value={customDairyEf}
                          onChange={(e) => setCustomDairyEf(Number(e.target.value))}
                          className="w-full bg-white border border-zinc-300 rounded px-1.5 py-0.5 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Plants (kg/kg):</span>
                        <input
                          type="number"
                          step={0.1}
                          value={customPlantEf}
                          onChange={(e) => setCustomPlantEf(Number(e.target.value))}
                          className="w-full bg-white border border-zinc-300 rounded px-1.5 py-0.5 font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 italic">
                Food &amp; diet assessment disabled (0.000 tCO₂e). Check the box above to enter food mass by category.
              </p>
            )}
          </div>

          {/* ========================================================== */}
          {/* MODULE 6: GOODS & SERVICES (LIFECYCLE QTY / SPEND FALLBACK) */}
          {/* ========================================================== */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  6. Manufactured Goods &amp; Discretionary Services
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-800">
                <input
                  type="checkbox"
                  checked={includeGoods}
                  onChange={(e) => setIncludeGoods(e.target.checked)}
                  className="rounded text-purple-700 focus:ring-purple-700"
                />
                <span>Include Goods Assessment</span>
              </label>
            </div>

            {includeGoods ? (
              <div className="space-y-4 animate-fadeIn text-xs">
                {/* Mode Selector */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-zinc-800">Accounting Methodology:</span>
                  <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setGoodsMode('lifecycle_qty')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        goodsMode === 'lifecycle_qty'
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-950'
                      }`}
                    >
                      Preferred: Product Lifecycle Quantities
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoodsMode('spend')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        goodsMode === 'spend'
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-950'
                      }`}
                    >
                      Fallback: Annual Spend
                    </button>
                  </div>
                </div>

                {goodsMode === 'lifecycle_qty' ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                        <div className="flex items-center gap-1 font-bold text-zinc-800 mb-1">
                          <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Smartphones:</span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={smartphonesQtyYear}
                          onChange={(e) => setSmartphonesQtyYear(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                        />
                        <span className="text-[10px] text-zinc-400 font-mono">70 kg/phone</span>
                      </div>

                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                        <div className="flex items-center gap-1 font-bold text-zinc-800 mb-1">
                          <Laptop className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Laptops/PCs:</span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={laptopsQtyYear}
                          onChange={(e) => setLaptopsQtyYear(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                        />
                        <span className="text-[10px] text-zinc-400 font-mono">250 kg/PC</span>
                      </div>

                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                        <div className="flex items-center gap-1 font-bold text-zinc-800 mb-1">
                          <Shirt className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Apparel Items:</span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={clothingItemsYear}
                          onChange={(e) => setClothingItemsYear(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                        />
                        <span className="text-[10px] text-zinc-400 font-mono">15 kg/garment</span>
                      </div>

                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                        <div className="flex items-center gap-1 font-bold text-zinc-800 mb-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Footwear:</span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={footwearPairsYear}
                          onChange={(e) => setFootwearPairsYear(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs"
                        />
                        <span className="text-[10px] text-zinc-400 font-mono">18 kg/pair</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="text-zinc-700 block mb-1">Currency &amp; Price Year:</label>
                      <div className="flex gap-1.5">
                        <select
                          value={spendCurrency}
                          onChange={(e) => setSpendCurrency(e.target.value as any)}
                          className="bg-white border border-zinc-300 rounded px-2 py-1 text-xs font-bold text-zinc-800"
                        >
                          <option value="INR">₹ INR</option>
                          <option value="USD">$ USD</option>
                          <option value="EUR">€ EUR</option>
                          <option value="GBP">£ GBP</option>
                        </select>
                        <span className="bg-zinc-100 border border-zinc-200 rounded px-2 py-1 font-mono text-zinc-600 text-xs">
                          2024 Base
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-zinc-700 block mb-1">Sector Intensity:</label>
                      <select
                        value={spendSector}
                        onChange={(e) => setSpendSector(e.target.value as any)}
                        className="w-full bg-white border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-800 font-medium"
                      >
                        <option value="electronics">Consumer Electronics (0.320 kg/$)</option>
                        <option value="clothing">Clothing &amp; Textiles (0.450 kg/$)</option>
                        <option value="services">General Services (0.180 kg/$)</option>
                        <option value="appliances">Appliances (0.380 kg/$)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-zinc-700 block mb-1">Annual Spend:</label>
                      <input
                        type="number"
                        min={0}
                        value={spendAmount}
                        onChange={(e) => setSpendAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-zinc-900 text-xs text-right"
                        placeholder="e.g. 50000"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 italic">
                Goods &amp; services assessment disabled (0.000 tCO₂e). Check the box above to track product lifecycle acquisitions.
              </p>
            )}
          </div>

          {/* ========================================================== */}
          {/* MODULE 7: WATER & MUNICIPAL WASTE (OPT-IN, DEFAULT 0) */}
          {/* ========================================================== */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-100 text-cyan-800 rounded-lg">
                  <Droplet className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  7. Municipal Water &amp; Solid Waste (Opt-In)
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-800">
                <input
                  type="checkbox"
                  checked={includeWaterWaste}
                  onChange={(e) => setIncludeWaterWaste(e.target.checked)}
                  className="rounded text-cyan-700 focus:ring-cyan-700"
                />
                <span>Include Utilities Assessment</span>
              </label>
            </div>

            {includeWaterWaste ? (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-4 text-xs animate-fadeIn">
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
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>0 m³</span>
                      <span>20 m³</span>
                      <span>40 m³</span>
                    </div>
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
                      max={30}
                      step={1}
                      value={wasteKgWeek}
                      onChange={(e) => setWasteKgWeek(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-300 rounded-lg appearance-none cursor-pointer accent-zinc-700"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>0 kg</span>
                      <span>15 kg</span>
                      <span>30 kg</span>
                    </div>
                  </div>
                </div>

                {/* Custom Water & Waste Overrides */}
                <div className="pt-2 border-t border-zinc-200/60">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600">
                    <input
                      type="checkbox"
                      checked={customWaterWasteEfEnabled}
                      onChange={(e) => setCustomWaterWasteEfEnabled(e.target.checked)}
                      className="rounded text-emerald-700 focus:ring-emerald-700"
                    />
                    <span>Custom Water &amp; Waste Emission Factors</span>
                  </label>
                  {customWaterWasteEfEnabled && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Water Factor (kg/m³):</span>
                        <input
                          type="number"
                          step={0.001}
                          value={customWaterEf}
                          onChange={(e) => setCustomWaterEf(Number(e.target.value))}
                          className="w-full bg-white border border-zinc-300 rounded px-2 py-0.5 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Waste Factor (kg/kg):</span>
                        <input
                          type="number"
                          step={0.001}
                          value={customWasteEf}
                          onChange={(e) => setCustomWasteEf(Number(e.target.value))}
                          className="w-full bg-white border border-zinc-300 rounded px-2 py-0.5 font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 italic">
                Water and solid waste utilities disabled (0.000 tCO₂e). Check the box above to opt in.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Instant Result Card & Breakdown */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-gradient-to-br from-[#0F3A2E] to-[#0A261E] text-white rounded-2xl p-5 sm:p-7 shadow-lg space-y-6">
            <div className="border-b border-emerald-800/80 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono text-emerald-300 font-bold uppercase tracking-wider block">
                  Personal Per-Capita Footprint
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700/80">
                  {systemBoundary === 'lifecycle' ? 'WTW Full Lifecycle' : 'TTW Operational'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-white">
                  {calculation.totalPersonalTco2e.toFixed(3)}
                </span>
                <span className="text-sm font-mono text-emerald-200 font-medium">
                  tCO₂e / year
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-300/90 block mt-0.5">
                = {(calculation.totalPersonalTco2e * 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO₂e / yr
              </span>
              {calculation.validResidents > 1 && (
                <span className="text-[11px] font-mono text-emerald-300/80 block mt-1.5">
                  Gross Household: <strong>{calculation.totalHouseholdGrossTco2e.toFixed(2)} tCO₂e</strong> (shared by {calculation.validResidents} residents)
                </span>
              )}
            </div>

            {/* Dynamic Regional Benchmark Comparison */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-300">Vs Regional Baseline:</span>
                <span className="font-bold text-white">
                  {calculation.pctOfAverage}% ({calculation.nationalAverage} tCO₂e avg · {calculation.benchmarkLabel})
                </span>
              </div>
              <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800/60">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    calculation.pctOfAverage > 100 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, calculation.pctOfAverage)}%` }}
                />
              </div>
            </div>

            {/* Lifecycle Upstream Addition Notice (if lifecycle active) */}
            {systemBoundary === 'lifecycle' && calculation.upstreamLifecycleDeltaTco2e > 0 && (
              <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-800/80 text-xs font-mono space-y-1">
                <div className="flex justify-between text-purple-200 font-bold">
                  <span>Scope 3 Cat 3 (WTT + T&amp;D Loss):</span>
                  <span>+{calculation.upstreamLifecycleDeltaTco2e.toFixed(3)} tCO₂e</span>
                </div>
                <div className="text-[10px] text-purple-300/80 leading-relaxed">
                  Operational: {calculation.operationalPersonalTco2e.toFixed(3)} t + Upstream: {calculation.upstreamLifecycleDeltaTco2e.toFixed(3)} t
                </div>
              </div>
            )}

            {/* Double-Precision Scope Breakdown */}
            <div className="space-y-2 pt-2 border-t border-emerald-800/80">
              <span className="text-[11px] font-mono text-emerald-300 font-bold uppercase tracking-wider block">
                Source Breakdown (Double-Precision Floating-Point)
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                  <span className="text-emerald-200">Scope 2: Grid Electricity</span>
                  <span className="font-bold text-white">{calculation.personalElecTco2e.toFixed(3)} t</span>
                </div>
                {includeHeating && (
                  <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                    <span className="text-emerald-200">Scope 1/2: Home Heating</span>
                    <span className="font-bold text-white">{calculation.personalHeatingTco2e.toFixed(3)} t</span>
                  </div>
                )}
                {cookingFuel !== 'none' && (
                  <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                    <span className="text-emerald-200">Scope 1: Cooking ({cookingFuel.toUpperCase()})</span>
                    <span className="font-bold text-white">{calculation.personalCookingTco2e.toFixed(3)} t</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                  <span className="text-emerald-200">Scope 3: Ground Commute</span>
                  <span className="font-bold text-white">{calculation.personalTransportTco2e.toFixed(3)} t</span>
                </div>
                {calculation.personalAviationTco2e > 0 && (
                  <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                    <span className="text-emerald-200">Scope 3: Commercial Aviation</span>
                    <span className="font-bold text-white">{calculation.personalAviationTco2e.toFixed(3)} t</span>
                  </div>
                )}
                {includeFood && (
                  <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                    <span className="text-emerald-200">Scope 3: Dietary Intake</span>
                    <span className="font-bold text-white">{calculation.personalFoodTco2e.toFixed(3)} t</span>
                  </div>
                )}
                {includeGoods && (
                  <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                    <span className="text-emerald-200">Scope 3: Manufactured Goods</span>
                    <span className="font-bold text-white">{calculation.personalGoodsTco2e.toFixed(3)} t</span>
                  </div>
                )}
                {includeWaterWaste && (
                  <div className="flex items-center justify-between p-2 rounded bg-emerald-900/60 border border-emerald-700/50">
                    <span className="text-emerald-200">Scope 3: Municipal Water &amp; Waste</span>
                    <span className="font-bold text-white">{calculation.personalWaterWasteTco2e.toFixed(3)} t</span>
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
                  {calculation.creditsNeeded} Credits
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
      </div>

      {/* ============================================================== */}
      {/* STEP 3: LIVE FACTOR PROVENANCE & AUDIT METADATA TABLE */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowProvenanceLedger(!showProvenanceLedger)}
          className="w-full px-5 py-4 bg-zinc-50/80 hover:bg-zinc-100/80 border-b border-zinc-200/80 flex items-center justify-between text-left transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <span>Audit Factor &amp; Provenance Ledger</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {calculation.provenanceList.length} Active Items
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500">
                Statutory emission factors, datasets, and boundary allocations (KTH Specification / ISO 14064)
              </p>
            </div>
          </div>
          {showProvenanceLedger ? (
            <ChevronUp className="w-5 h-5 text-zinc-500 shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-500 shrink-0" />
          )}
        </button>

        {showProvenanceLedger && (
          <div className="p-4 sm:p-6 space-y-4 animate-fadeIn">
            {calculation.provenanceList.length > 0 ? (
              <div className="w-full overflow-x-auto border border-zinc-200 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-100 text-zinc-700 border-b border-zinc-200 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5">Domain &amp; Activity</th>
                      <th className="px-3 py-2.5">Annual Activity Level</th>
                      <th className="px-3 py-2.5">Base Emission Factor</th>
                      <th className="px-3 py-2.5">Effective Factor</th>
                      <th className="px-3 py-2.5">System Boundary</th>
                      <th className="px-3 py-2.5">Allocation</th>
                      <th className="px-3 py-2.5">Statutory Source</th>
                      <th className="px-3 py-2.5 text-right">Net tCO₂e</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {calculation.provenanceList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="px-3 py-2 font-medium text-zinc-900">
                          <span className="text-[10px] text-zinc-400 block font-sans uppercase">
                            {item.domain}
                          </span>
                          {item.activity}
                        </td>
                        <td className="px-3 py-2 text-zinc-700 font-bold">{item.quantity}</td>
                        <td className="px-3 py-2 text-zinc-700 font-mono">{item.baseFactor}</td>
                        <td className="px-3 py-2 text-emerald-800 font-bold">{item.effectiveFactor}</td>
                        <td className="px-3 py-2 text-purple-800 text-[11px] font-semibold">{item.lifecycleMode}</td>
                        <td className="px-3 py-2 text-zinc-600 text-[11px]">{item.boundary}</td>
                        <td className="px-3 py-2 text-zinc-600 text-[11px] max-w-[200px]">
                          {item.source}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-zinc-950">
                          {item.emissionsTco2e.toFixed(3)} t
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-100/80 font-bold border-t border-zinc-200 text-zinc-900">
                    <tr>
                      <td colSpan={7} className="px-3 py-2.5 text-right uppercase text-[11px]">
                        Personal Footprint Total ({systemBoundary === 'lifecycle' ? 'WTW Full Lifecycle' : 'TTW Operational'}):
                      </td>
                      <td className="px-3 py-2.5 text-right text-emerald-800 text-sm">
                        {calculation.totalPersonalTco2e.toFixed(3)} tCO₂e
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                All activity lines are currently at zero. Enter your household electricity, commute, or optional categories above to view real-time statutory provenance and audit trails.
              </div>
            )}
          </div>
        )}
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
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Retirement Commitment Prepared
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Quote ID: {retirementQuote.quote_id}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-xs font-bold">
                {retirementQuote.retirement_summary.credits_to_retire} Credits = ${retirementQuote.pricing.total_usd.toFixed(2)} USD
              </span>
            </div>

            {/* Official Certificate Preview */}
            <div className="p-5 bg-zinc-950 border border-emerald-800/80 rounded-xl font-mono text-xs space-y-3 relative overflow-hidden">
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/80 text-[10px] uppercase font-bold">
                Official Specimen
              </div>
              <div className="text-emerald-400 font-bold uppercase tracking-widest text-[11px]">
                International Carbon Registry · Certificate of Retirement
              </div>
              <div className="space-y-1 text-zinc-300">
                <div>
                  <span className="text-zinc-500">Beneficiary:</span> <strong>{retirementQuote.retirement_summary.beneficiary}</strong>
                </div>
                <div>
                  <span className="text-zinc-500">Registry Project:</span> {retirementQuote.project.name} ({retirementQuote.project.standard})
                </div>
                <div>
                  <span className="text-zinc-500">Permanent Volume:</span>{' '}
                  <span className="text-emerald-400 font-bold">
                    {retirementQuote.retirement_summary.credits_to_retire} Metric Tonnes CO₂e
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 truncate">
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

      {/* ============================================================== */}
      {/* MOBILE STICKY BOTTOM SUMMARY BAR */}
      {/* ============================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md text-white border-t border-zinc-800 px-4 py-2.5 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] font-mono text-emerald-400 block uppercase">
            Personal ({systemBoundary === 'lifecycle' ? 'WTW' : 'TTW'})
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold font-mono text-white">
              {(calculation.totalPersonalTco2e * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] text-zinc-400 font-normal">kg</span>
            </span>
            <span className="text-xs font-mono text-emerald-300 font-medium">
              ({calculation.totalPersonalTco2e.toFixed(3)} t)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-400 block">Neutralize</span>
            <span className="text-xs font-bold font-mono text-emerald-400">{calculation.creditsNeeded} Credits</span>
          </div>
          <a
            href="#retire-section"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition shadow-sm"
          >
            Retire
          </a>
        </div>
      </div>
    </div>
  );
}
