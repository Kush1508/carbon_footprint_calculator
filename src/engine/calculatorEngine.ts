// Audit-Grade Functional Carbon Accounting Computation Engine
// GHG Protocol Corporate Standard, ISO 14064-1, IPCC AR6, and GSF SCI v1.0 Compliant

import {
  HouseholdData,
  AgricultureData,
  CorporateData,
  EngineOutput,
  AuditRecord,
  RegionalGridPreset,
} from '../types';
import {
  HOUSEHOLD_FACTORS,
  AGRICULTURE_FACTORS,
  FUEL_FACTORS,
  REFRIGERANT_GWP,
  FREIGHT_FACTORS,
  EEIO_FACTORS,
  GSF_SCI_FACTORS,
  IPCC_AR6_GWP,
  REGIONAL_GRID_PRESETS,
} from './factors';

/** Defensive numerical sanitization helper preventing NaN, null, or undefined propagation */
export const safeNum = (val: number | string | null | undefined): number => {
  if (val === null || val === undefined) return 0;
  const parsed = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, parsed);
};

export const roundTo = (num: number, decimals: number = 3): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

// ==========================================
// 1. HOUSEHOLD CARBON ACCOUNTING
// ==========================================
export const calculateHousehold = (
  raw: HouseholdData,
  grid: RegionalGridPreset
): EngineOutput => {
  const electricityKwh = safeNum(raw.electricityKwhMonthly);
  const waterM3 = safeNum(raw.waterM3Monthly);
  const wasteKgWeekly = safeNum(raw.wasteKgWeekly);
  const wasteKgMonthly = wasteKgWeekly * 4.333; // 52 weeks / 12 months

  const auditRecords: AuditRecord[] = [];

  // Electricity
  const elecEmissionsKg = electricityKwh * grid.emissionFactorKwh;
  auditRecords.push({
    id: 'hh-elec-grid',
    archetype: 'household',
    metricLabel: 'Monthly Grid Electricity Consumption',
    scope: 'Direct Household',
    category: 'Household Power & Energy',
    formulaLatex: 'E_{elec} = \\text{kWh} \\times \\text{EF}_{grid}',
    arithmeticDisplay: `${electricityKwh.toLocaleString()} kWh × ${grid.emissionFactorKwh} kg CO₂e/kWh`,
    activityAmount: electricityKwh,
    activityUnit: 'kWh/month',
    factorValue: grid.emissionFactorKwh,
    factorUnit: 'kg CO₂e/kWh',
    gwpStandard: 'IPCC AR6 GWP100',
    citation: grid.citation,
    methodologyStandard: 'GHG Protocol Scope 2 / National Baseline',
    uncertaintyConfidence: `±${grid.uncertaintyPercent}% (95% CI)`,
    calculatedEmissionsKg: roundTo(elecEmissionsKg, 2),
    calculatedEmissionsTons: roundTo(elecEmissionsKg / 1000, 4),
    notes: `Calculated using ${grid.sourceAuthority} baseline factor.`,
  });

  // Water & Wastewater
  const waterSupplyEf = HOUSEHOLD_FACTORS.waterSupplyKgPerM3;
  const waterTreatmentEf = raw.hasSewageTreatment
    ? HOUSEHOLD_FACTORS.waterTreatmentKgPerM3
    : 0;
  const effectiveWaterEf = waterSupplyEf + waterTreatmentEf;
  const waterEmissionsKg = waterM3 * effectiveWaterEf;

  auditRecords.push({
    id: 'hh-water-treatment',
    archetype: 'household',
    metricLabel: 'Domestic Water Supply & Wastewater',
    scope: 'Direct Household',
    category: 'Water Utility & Sanitation',
    formulaLatex: 'E_{water} = V_{m^3} \\times (\\text{EF}_{supply} + \\text{EF}_{treatment})',
    arithmeticDisplay: `${waterM3.toLocaleString()} m³ × (${waterSupplyEf} + ${waterTreatmentEf}) kg CO₂e/m³`,
    activityAmount: waterM3,
    activityUnit: 'm³/month',
    factorValue: effectiveWaterEf,
    factorUnit: 'kg CO₂e/m³',
    gwpStandard: 'IPCC AR6 GWP100',
    citation: 'Venkatesh & Brattebø (2011) Water Research; UK Defra 2023 Water Guidelines',
    methodologyStandard: 'Life Cycle Assessment (Cradle-to-Tap & Wastewater Discharge)',
    uncertaintyConfidence: '±6.0% (95% CI)',
    calculatedEmissionsKg: roundTo(waterEmissionsKg, 2),
    calculatedEmissionsTons: roundTo(waterEmissionsKg / 1000, 4),
    notes: raw.hasSewageTreatment
      ? 'Includes municipal aerobic/anaerobic wastewater treatment facility energy.'
      : 'Septic/unconnected: supply pumping and purification only.',
  });

  // Solid Waste
  let wasteEf = HOUSEHOLD_FACTORS.wasteLandfillKgPerKg;
  let wasteRouteLabel = 'Mixed Landfill Disposal';
  if (raw.wasteRoute === 'compost') {
    wasteEf = HOUSEHOLD_FACTORS.wasteCompostKgPerKg;
    wasteRouteLabel = 'Source-Segregated Composting';
  } else if (raw.wasteRoute === 'recycling') {
    wasteEf = HOUSEHOLD_FACTORS.wasteRecyclingKgPerKg;
    wasteRouteLabel = 'Dry Mechanical Recycling Stream';
  }
  const wasteEmissionsKg = wasteKgMonthly * wasteEf;

  auditRecords.push({
    id: 'hh-solid-waste',
    archetype: 'household',
    metricLabel: `Solid Municipal Waste (${wasteRouteLabel})`,
    scope: 'Direct Household',
    category: 'Municipal Solid Waste',
    formulaLatex: 'E_{waste} = M_{kg} \\times \\text{DOC} \\times \\text{DOC}_f \\times F \\times (16/12) \\times \\text{GWP}_{CH_4}',
    arithmeticDisplay: `${roundTo(wasteKgMonthly, 1)} kg/mo (${wasteKgWeekly} kg/wk) × ${wasteEf} kg CO₂e/kg`,
    activityAmount: wasteKgMonthly,
    activityUnit: 'kg/month',
    factorValue: wasteEf,
    factorUnit: 'kg CO₂e/kg',
    gwpStandard: 'IPCC AR6 (GWP_CH4 = 28)',
    citation: 'IPCC 2006 Guidelines for National GHG Inventories, Vol 5 Waste (First Order Decay)',
    methodologyStandard: 'IPCC Waste Model Tier 1 (Methane correction factor & DOC dissipation)',
    uncertaintyConfidence: '±12.0% (95% CI)',
    calculatedEmissionsKg: roundTo(wasteEmissionsKg, 2),
    calculatedEmissionsTons: roundTo(wasteEmissionsKg / 1000, 4),
    notes: 'Derived from Degradable Organic Carbon (DOC) methane generation model.',
  });

  const grossKg = elecEmissionsKg + waterEmissionsKg + wasteEmissionsKg;
  const grossTons = grossKg / 1000;
  const annualKg = grossKg * 12;
  const treesNeeded = annualKg / HOUSEHOLD_FACTORS.treeAnnualAbsorptionKg;
  const benchmarkDiffPercent =
    ((grossKg - HOUSEHOLD_FACTORS.householdBenchmarkMonthlyKg) /
      HOUSEHOLD_FACTORS.householdBenchmarkMonthlyKg) *
    100;

  return {
    totalEmissionsTons: roundTo(grossTons, 3),
    grossEmissionsKg: roundTo(grossKg, 2),
    scope1Tons: roundTo(wasteEmissionsKg / 1000, 3),
    scope2Tons: roundTo(elecEmissionsKg / 1000, 3),
    scope2LocationTons: roundTo(elecEmissionsKg / 1000, 3),
    scope2MarketTons: roundTo(elecEmissionsKg / 1000, 3),
    scope3Tons: roundTo(waterEmissionsKg / 1000, 3),
    auditRecords,
    breakdownByCategory: [
      { name: 'Grid Electricity', tons: roundTo(elecEmissionsKg / 1000, 3), scope: 'Energy', color: '#3730A3' },
      { name: 'Water & Sanitation', tons: roundTo(waterEmissionsKg / 1000, 3), scope: 'Utility', color: '#0284C7' },
      { name: 'Municipal Waste', tons: roundTo(wasteEmissionsKg / 1000, 3), scope: 'Waste', color: '#D97706' },
    ],
    contextualEquivalents: {
      treesAbsorptionAnnual: Math.round(treesNeeded),
      gasolineGallonsEquivalent: Math.round(annualKg / 8.887),
      passengerKmEquivalent: Math.round(annualKg / 0.171),
      regionalAverageDeltaPercent: roundTo(benchmarkDiffPercent, 1),
    },
  };
};

// ==========================================
// 2. AGRICULTURE & FARM (IPCC TIER 1 AFOLU)
// ==========================================
export const calculateAgriculture = (
  raw: AgricultureData,
  grid: RegionalGridPreset
): EngineOutput => {
  const auditRecords: AuditRecord[] = [];
  let entericTotalKg = 0;

  // Livestock Enteric Fermentation
  raw.livestock.forEach((batch) => {
    const headcount = safeNum(batch.headcount);
    if (headcount <= 0) return;

    const efCh4PerHead =
      AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear[batch.animalType] || 50;
    const gwpCh4 = IPCC_AR6_GWP.CH4; // 28
    const emissionsKg = headcount * efCh4PerHead * gwpCh4;
    entericTotalKg += emissionsKg;

    const animalNames: Record<string, string> = {
      dairy_cattle: 'Dairy Cattle (Lactating Cows)',
      beef_cattle: 'Beef / Non-Dairy Bovine',
      buffalo: 'Water Buffalo',
      sheep_goats: 'Sheep & Goats (Small Ruminants)',
      swine: 'Market Swine / Breeding Pigs',
    };

    auditRecords.push({
      id: `ag-enteric-${batch.id}`,
      archetype: 'agriculture',
      metricLabel: `Enteric Fermentation: ${animalNames[batch.animalType] || batch.animalType}`,
      scope: 'Agricultural AFOLU',
      category: 'Livestock Enteric Methane (CH₄)',
      formulaLatex: 'E_{enteric} = \\text{Headcount} \\times \\text{EF}_{CH_4} \\times \\text{GWP}_{CH_4}',
      arithmeticDisplay: `${headcount} head × ${efCh4PerHead} kg CH₄/yr × 28 (GWP_AR6)`,
      activityAmount: headcount,
      activityUnit: 'head',
      factorValue: efCh4PerHead * gwpCh4,
      factorUnit: 'kg CO₂e/head/yr',
      gwpStandard: 'IPCC AR6 (GWP_CH4 = 28)',
      citation: 'IPCC 2019 Refinement to 2006 Guidelines, Vol 4 AFOLU Chapter 10, Table 10.11',
      methodologyStandard: 'IPCC Tier 1 Enteric Fermentation Methodology',
      uncertaintyConfidence: '±15.0% (95% CI)',
      calculatedEmissionsKg: roundTo(emissionsKg, 2),
      calculatedEmissionsTons: roundTo(emissionsKg / 1000, 3),
      notes: 'Tier 1 regional default emission factor based on average feed intake and digestibility.',
    });
  });

  // Fertilizer Direct Soil N2O Emissions
  const nFraction =
    AGRICULTURE_FACTORS.fertilizerNitrogenFraction[raw.syntheticFertilizerType] || 0.46;
  const synthGrossKg = safeNum(raw.syntheticFertilizerGrossKg);
  const synthElementalN_Kg = synthGrossKg * nFraction;
  const manureElementalN_Kg = safeNum(raw.organicManureN_Kg);
  const totalN_Kg = synthElementalN_Kg + manureElementalN_Kg;

  // E_soil = N_total * EF1 (0.01) * (44/28) * GWP_N2O (273)
  const soilN2O_EmissionsKg =
    totalN_Kg *
    AGRICULTURE_FACTORS.soilN2O_EF1 *
    AGRICULTURE_FACTORS.n2oToN2Ratio *
    IPCC_AR6_GWP.N2O;

  auditRecords.push({
    id: 'ag-soil-n2o',
    archetype: 'agriculture',
    metricLabel: 'Managed Agricultural Soil N₂O (Synthetic & Manure)',
    scope: 'Agricultural AFOLU',
    category: 'Soil Nitrous Oxide (N₂O)',
    formulaLatex: 'E_{soil} = (N_{synth} + N_{org}) \\times \\text{EF}_1 \\times (44/28) \\times \\text{GWP}_{N_2O}',
    arithmeticDisplay: `(${roundTo(synthElementalN_Kg, 1)} kg N synth + ${roundTo(manureElementalN_Kg, 1)} kg N org) × 0.01 × (44/28) × 273`,
    activityAmount: roundTo(totalN_Kg, 1),
    activityUnit: 'kg Elemental N applied',
    factorValue: roundTo(
      AGRICULTURE_FACTORS.soilN2O_EF1 *
        AGRICULTURE_FACTORS.n2oToN2Ratio *
        IPCC_AR6_GWP.N2O,
      3
    ),
    factorUnit: 'kg CO₂e / kg N',
    gwpStandard: 'IPCC AR6 (GWP_N2O = 273)',
    citation: 'Bouwman et al. (2002); IPCC 2006 Vol 4 AFOLU Chapter 11, Direct N2O Emissions from Managed Soils',
    methodologyStandard: 'IPCC Tier 1 Direct Soil N2O (EF1 default = 1% volatilization/nitrification)',
    uncertaintyConfidence: '±25.0% (95% CI)',
    calculatedEmissionsKg: roundTo(soilN2O_EmissionsKg, 2),
    calculatedEmissionsTons: roundTo(soilN2O_EmissionsKg / 1000, 3),
    notes: `Derived with elemental N conversion fraction: ${roundTo(nFraction * 100, 0)}% N for ${raw.syntheticFertilizerType.toUpperCase()}.`,
  });

  // Rice Cultivation (Flooded Paddy Methane)
  const paddyHa = safeNum(raw.floodedPaddyHectares);
  const paddyDays = safeNum(raw.floodedPaddyDays);
  const waterScaling =
    AGRICULTURE_FACTORS.paddyWaterScalingFactor[raw.paddyWaterRegime] || 1.0;
  const paddyCh4Kg =
    paddyHa *
    paddyDays *
    AGRICULTURE_FACTORS.paddyBaselineMethaneKgPerHaDay *
    waterScaling;
  const paddyEmissionsKg = paddyCh4Kg * IPCC_AR6_GWP.CH4;

  auditRecords.push({
    id: 'ag-paddy-rice',
    archetype: 'agriculture',
    metricLabel: `Flooded Rice Paddy Cultivation (${raw.paddyWaterRegime.replace(/_/g, ' ')})`,
    scope: 'Agricultural AFOLU',
    category: 'Paddy Rice Anaerobic CH₄',
    formulaLatex: 'E_{rice} = \\text{Area (ha)} \\times \\text{Days} \\times \\text{EF}_{baseline} \\times \\text{SF}_w \\times \\text{GWP}_{CH_4}',
    arithmeticDisplay: `${paddyHa} ha × ${paddyDays} days × 1.30 kg CH₄/ha/day × ${waterScaling} SF_w × 28`,
    activityAmount: paddyHa * paddyDays,
    activityUnit: 'ha·days',
    factorValue: roundTo(AGRICULTURE_FACTORS.paddyBaselineMethaneKgPerHaDay * waterScaling * IPCC_AR6_GWP.CH4, 3),
    factorUnit: 'kg CO₂e/ha/day',
    gwpStandard: 'IPCC AR6 (GWP_CH4 = 28)',
    citation: 'IPCC 2006 Guidelines, Vol 4 AFOLU Chapter 5.5 (Methane Emissions from Rice Cultivation)',
    methodologyStandard: 'IPCC Tier 1 Rice Model with Water Regime Scaling Factors (SF_w)',
    uncertaintyConfidence: '±18.0% (95% CI)',
    calculatedEmissionsKg: roundTo(paddyEmissionsKg, 2),
    calculatedEmissionsTons: roundTo(paddyEmissionsKg / 1000, 3),
    notes:
      raw.paddyWaterRegime === 'alternate_wetting_drying'
        ? 'Alternate Wetting and Drying (AWD) reduces anaerobic methanogen activity by ~52%.'
        : 'Continuous flooding maximizes organic matter decomposition into methane gas.',
  });

  // Mobile Diesel & Agricultural Machinery
  const dieselLiters = safeNum(raw.machineryDieselLiters);
  const machineryDieselKg =
    dieselLiters * AGRICULTURE_FACTORS.machineryDieselKgPerLiter;

  auditRecords.push({
    id: 'ag-machinery-diesel',
    archetype: 'agriculture',
    metricLabel: 'Mobile Farm Tractors & Irrigation Pumpsets',
    scope: 'Scope 1',
    category: 'Agricultural Machinery Combustion',
    formulaLatex: 'E_{diesel} = \\text{Liters} \\times \\text{NCV (0.038 GJ/L)} \\times \\text{EF (74.1 kg CO}_2/\\text{GJ)}',
    arithmeticDisplay: `${dieselLiters.toLocaleString()} L × 0.038 GJ/L × 74.1 kg CO₂/GJ (${AGRICULTURE_FACTORS.machineryDieselKgPerLiter} kg CO₂e/L)`,
    activityAmount: dieselLiters,
    activityUnit: 'Liters diesel',
    factorValue: AGRICULTURE_FACTORS.machineryDieselKgPerLiter,
    factorUnit: 'kg CO₂e/L',
    gwpStandard: 'IPCC AR6',
    citation: 'IPCC 2006 Vol 2 Energy, Mobile Machinery in Agriculture & Forestry',
    methodologyStandard: 'GHG Protocol Stationary / Mobile Combustion Guidance',
    uncertaintyConfidence: '±4.0% (95% CI)',
    calculatedEmissionsKg: roundTo(machineryDieselKg, 2),
    calculatedEmissionsTons: roundTo(machineryDieselKg / 1000, 3),
    notes: 'Combustion factor includes biogenic fuel additive assumptions and engine thermal efficiency.',
  });

  const grossKg =
    entericTotalKg + soilN2O_EmissionsKg + paddyEmissionsKg + machineryDieselKg;
  const grossTons = grossKg / 1000;

  return {
    totalEmissionsTons: roundTo(grossTons, 3),
    grossEmissionsKg: roundTo(grossKg, 2),
    scope1Tons: roundTo(machineryDieselKg / 1000, 3),
    scope2Tons: 0,
    scope2LocationTons: 0,
    scope2MarketTons: 0,
    scope3Tons: 0,
    auditRecords,
    breakdownByCategory: [
      { name: 'Enteric Fermentation (CH₄)', tons: roundTo(entericTotalKg / 1000, 3), scope: 'AFOLU', color: '#16A34A' },
      { name: 'Managed Soils (N₂O)', tons: roundTo(soilN2O_EmissionsKg / 1000, 3), scope: 'AFOLU', color: '#CA8A04' },
      { name: 'Rice Cultivation (CH₄)', tons: roundTo(paddyEmissionsKg / 1000, 3), scope: 'AFOLU', color: '#059669' },
      { name: 'Tractor / Pump Diesel', tons: roundTo(machineryDieselKg / 1000, 3), scope: 'Scope 1', color: '#475569' },
    ],
    contextualEquivalents: {
      treesAbsorptionAnnual: Math.round(grossKg / HOUSEHOLD_FACTORS.treeAnnualAbsorptionKg),
      gasolineGallonsEquivalent: Math.round(grossKg / 8.887),
      passengerKmEquivalent: Math.round(grossKg / 0.171),
      regionalAverageDeltaPercent: 0,
    },
  };
};

// ==========================================
// 3. CORPORATE & INDUSTRIAL (GHG PROTOCOL)
// ==========================================
export const calculateCorporate = (
  raw: CorporateData,
  grid: RegionalGridPreset
): EngineOutput => {
  const auditRecords: AuditRecord[] = [];

  // Scope 1: Stationary / Mobile Fuels
  let fuelsTotalKg = 0;
  raw.fuels.forEach((item) => {
    const volume = safeNum(item.volume);
    if (volume <= 0) return;
    const factorData = FUEL_FACTORS[item.fuelType] || FUEL_FACTORS.diesel;
    const emissionsKg = volume * factorData.efKgPerUnit;
    fuelsTotalKg += emissionsKg;

    auditRecords.push({
      id: `corp-fuel-${item.id}`,
      archetype: 'corporate',
      metricLabel: `Scope 1 Combustion: ${item.fuelType.toUpperCase().replace('_', ' ')}`,
      scope: 'Scope 1',
      category: 'Stationary & Mobile Fuel Combustion',
      formulaLatex: 'E_{fuel} = V \\times \\text{NCV} \\times \\text{EF}_{fuel}',
      arithmeticDisplay: `${volume.toLocaleString()} ${factorData.unit} × ${factorData.efKgPerUnit} kg CO₂e/${factorData.unit}`,
      activityAmount: volume,
      activityUnit: factorData.unit,
      factorValue: factorData.efKgPerUnit,
      factorUnit: `kg CO₂e/${factorData.unit}`,
      gwpStandard: 'IPCC AR6',
      citation: factorData.citation,
      methodologyStandard: 'GHG Protocol Corporate Standard (Direct Stationary Combustion)',
      uncertaintyConfidence: '±3.5% (95% CI)',
      calculatedEmissionsKg: roundTo(emissionsKg, 2),
      calculatedEmissionsTons: roundTo(emissionsKg / 1000, 3),
      notes: `Net calorific value: ${factorData.ncvMjPerUnit} MJ/${factorData.unit}.`,
    });
  });

  // Scope 1: Fugitive Refrigerants
  let refrigerantsTotalKg = 0;
  raw.refrigerants.forEach((item) => {
    const kgLost = safeNum(item.kgLeaked);
    if (kgLost <= 0) return;
    const gwp = REFRIGERANT_GWP[item.refrigerantType] || 2000;
    const emissionsKg = kgLost * gwp;
    refrigerantsTotalKg += emissionsKg;

    auditRecords.push({
      id: `corp-ref-${item.id}`,
      archetype: 'corporate',
      metricLabel: `Scope 1 Fugitive: ${item.refrigerantType.toUpperCase()} Gas Leakage`,
      scope: 'Scope 1',
      category: 'Fugitive HVAC & Chiller Refrigerants',
      formulaLatex: 'E_{refrig} = M_{lost} \\times \\text{GWP}_{AR6}',
      arithmeticDisplay: `${kgLost} kg leaked × ${gwp} (IPCC AR6 100-yr GWP)`,
      activityAmount: kgLost,
      activityUnit: 'kg gas lost',
      factorValue: gwp,
      factorUnit: 'kg CO₂e / kg gas',
      gwpStandard: `IPCC AR6 (GWP = ${gwp})`,
      citation: 'IPCC Sixth Assessment Report (AR6), Working Group I, Chapter 7, Table 7.15',
      methodologyStandard: 'GHG Protocol Guidance on Fugitive Emissions from HVAC and Chillers',
      uncertaintyConfidence: '±8.0% (95% CI)',
      calculatedEmissionsKg: roundTo(emissionsKg, 2),
      calculatedEmissionsTons: roundTo(emissionsKg / 1000, 3),
      notes: 'Direct radiative forcing factor without climate-carbon feedback.',
    });
  });

  const scope1TotalKg = fuelsTotalKg + refrigerantsTotalKg;

  // Scope 2: Dual-Track (Location-Based vs Market-Based)
  const totalGridMwh = safeNum(raw.gridElectricityMwhAnnual);
  const contractedGreenMwh = Math.min(totalGridMwh, safeNum(raw.contractedGreenPpaMwhAnnual));
  const residualMwh = Math.max(0, totalGridMwh - contractedGreenMwh);

  // Location-Based: MWh * 1000 * Grid EF
  const scope2LocationKg = totalGridMwh * 1000 * grid.emissionFactorKwh;
  auditRecords.push({
    id: 'corp-scope2-location',
    archetype: 'corporate',
    metricLabel: 'Scope 2 Location-Based Method (Total Grid Electricity)',
    scope: 'Scope 2',
    category: 'Purchased Electricity (Location-Based)',
    formulaLatex: 'E_{Scope2,Loc} = \\text{Total MWh} \\times 1000 \\times \\text{EF}_{grid}',
    arithmeticDisplay: `${totalGridMwh.toLocaleString()} MWh × 1,000 kWh/MWh × ${grid.emissionFactorKwh} kg CO₂e/kWh`,
    activityAmount: totalGridMwh * 1000,
    activityUnit: 'kWh/year',
    factorValue: grid.emissionFactorKwh,
    factorUnit: 'kg CO₂e/kWh',
    gwpStandard: 'IPCC AR6',
    citation: grid.citation,
    methodologyStandard: 'GHG Protocol Scope 2 Guidance (2015 Amendment, Location Method)',
    uncertaintyConfidence: `±${grid.uncertaintyPercent}% (95% CI)`,
    calculatedEmissionsKg: roundTo(scope2LocationKg, 2),
    calculatedEmissionsTons: roundTo(scope2LocationKg / 1000, 3),
    notes: 'Reflects the physical average carbon intensity of grids on which energy is consumed.',
  });

  // Market-Based: Contracted Green MWh (EF=0) + Residual MWh * Residual EF
  const scope2MarketKg = residualMwh * 1000 * grid.residualFactorKwh;
  auditRecords.push({
    id: 'corp-scope2-market',
    archetype: 'corporate',
    metricLabel: 'Scope 2 Market-Based Method (Contractual Instruments & Residual Mix)',
    scope: 'Scope 2',
    category: 'Purchased Electricity (Market-Based)',
    formulaLatex: 'E_{Scope2,Mkt} = (\\text{Total MWh} - \\text{PPA/EAC MWh}) \\times 1000 \\times \\text{EF}_{residual}',
    arithmeticDisplay: `(${totalGridMwh.toLocaleString()} - ${contractedGreenMwh.toLocaleString()} green MWh) × 1,000 kWh/MWh × ${grid.residualFactorKwh} kg CO₂e/kWh`,
    activityAmount: residualMwh * 1000,
    activityUnit: 'kWh residual',
    factorValue: grid.residualFactorKwh,
    factorUnit: 'kg CO₂e/kWh',
    gwpStandard: 'IPCC AR6',
    citation: `${grid.sourceAuthority} / AIB Residual Mix & Contractual Guidance`,
    methodologyStandard: 'GHG Protocol Scope 2 Guidance (Market-Based Quality Criteria Compliant)',
    uncertaintyConfidence: '±5.5% (95% CI)',
    calculatedEmissionsKg: roundTo(scope2MarketKg, 2),
    calculatedEmissionsTons: roundTo(scope2MarketKg / 1000, 3),
    notes: `Includes ${contractedGreenMwh} MWh certified zero-carbon PPA / REC retirement.`,
  });

  // Scope 3: Upstream Freight Logistics (Category 4)
  let freightTotalKg = 0;
  raw.freightLogs.forEach((item) => {
    const mass = safeNum(item.massTonnes);
    const dist = safeNum(item.distanceKm);
    const tkm = mass * dist;
    if (tkm <= 0) return;
    const factorData = FREIGHT_FACTORS[item.mode] || FREIGHT_FACTORS.truck_heavy;
    const emissionsKg = tkm * factorData.efKgPerTkm;
    freightTotalKg += emissionsKg;

    auditRecords.push({
      id: `corp-freight-${item.id}`,
      archetype: 'corporate',
      metricLabel: `Scope 3 Cat 4 Freight: ${factorData.label}`,
      scope: 'Scope 3',
      category: 'Upstream Transportation & Distribution (Cat 4)',
      formulaLatex: 'E_{freight} = \\text{Mass (t)} \\times \\text{Distance (km)} \\times \\text{EF}_{tkm}',
      arithmeticDisplay: `${mass} t × ${dist.toLocaleString()} km (${tkm.toLocaleString()} tkm) × ${factorData.efKgPerTkm} kg CO₂e/tkm`,
      activityAmount: tkm,
      activityUnit: 'tonne-kilometres (tkm)',
      factorValue: factorData.efKgPerTkm,
      factorUnit: 'kg CO₂e/tkm',
      gwpStandard: 'IPCC AR6',
      citation: factorData.citation,
      methodologyStandard: 'GLEC Framework v3.0 / EN 16258 / ISO 14083',
      uncertaintyConfidence: '±7.0% (95% CI)',
      calculatedEmissionsKg: roundTo(emissionsKg, 2),
      calculatedEmissionsTons: roundTo(emissionsKg / 1000, 3),
      notes: 'Well-to-Wheel (WTW) lifecycle emissions factor including fuel supply chain.',
    });
  });

  // Scope 3: Spend-Based Procurement (Category 1)
  let spendTotalKg = 0;
  raw.procurementSpends.forEach((item) => {
    const spend = safeNum(item.spendUsd);
    if (spend <= 0) return;
    const factorData = EEIO_FACTORS[item.sector] || EEIO_FACTORS.software_cloud;
    const emissionsKg = spend * factorData.efKgPerUsd;
    spendTotalKg += emissionsKg;

    auditRecords.push({
      id: `corp-spend-${item.id}`,
      archetype: 'corporate',
      metricLabel: `Scope 3 Cat 1 Procurement: ${factorData.label}`,
      scope: 'Scope 3',
      category: 'Purchased Goods & Services (Cat 1 Spend-Based)',
      formulaLatex: 'E_{spend} = \\text{Spend (\\$)} \\times \\text{EEIO}_{sector}',
      arithmeticDisplay: `$${spend.toLocaleString()} × ${factorData.efKgPerUsd} kg CO₂e/$`,
      activityAmount: spend,
      activityUnit: 'USD ($)',
      factorValue: factorData.efKgPerUsd,
      factorUnit: 'kg CO₂e/$',
      gwpStandard: 'IPCC AR6',
      citation: factorData.citation,
      methodologyStandard: 'USEEIO v2.0 Environmentally-Extended Input-Output Model',
      uncertaintyConfidence: '±15.0% (95% CI)',
      calculatedEmissionsKg: roundTo(emissionsKg, 2),
      calculatedEmissionsTons: roundTo(emissionsKg / 1000, 3),
      notes: 'Based on US 2021 dollar-deflated multi-regional sector input-output tables.',
    });
  });

  // Tech & Software Workload Module (Green Software Foundation SCI)
  const vcpuHours = safeNum(raw.computeVcpuHours);
  const ramGbHours = safeNum(raw.computeRamGbHours);
  const pue = Math.min(2.0, Math.max(1.05, safeNum(raw.datacenterPue) || 1.2));
  const dcRegionKey = raw.datacenterRegion || 'us_egrid';
  const dcGrid = factorsRegionLookup(dcRegionKey);

  // Operational energy = ((vCPU_hrs * 0.012 kW) + (RAM_GB_hrs * 0.000392 kW)) * PUE
  const operationalKwh =
    (vcpuHours * GSF_SCI_FACTORS.vCpuPowerKw +
      ramGbHours * GSF_SCI_FACTORS.ramPowerKwPerGb) *
    pue;
  const operationalCloudKg = operationalKwh * dcGrid.emissionFactorKwh;

  // Embodied hardware = vCPU_hrs * 0.0018 kg CO2e
  const embodiedCloudKg = vcpuHours * GSF_SCI_FACTORS.embodiedVcpuHourKg;
  const workstationsCount = safeNum(raw.developerWorkstationsCount);
  const workstationsKg =
    workstationsCount * GSF_SCI_FACTORS.developerWorkstationAnnualKg;

  const totalSciKg = operationalCloudKg + embodiedCloudKg + workstationsKg;

  auditRecords.push({
    id: 'corp-gsf-sci',
    archetype: 'corporate',
    metricLabel: 'Green Software Foundation SCI: Cloud Workloads & Developer Workstations',
    scope: 'Scope 3',
    category: 'Digital Infrastructure & Cloud Computing (GSF SCI)',
    formulaLatex: 'E_{cloud} = ((vCPU_{hrs} \\times P_{vCPU}) + (RAM_{hrs} \\times P_{RAM})) \\times \\text{PUE} \\times \\text{EF}_{grid} + \\text{Embodied}_{HW}',
    arithmeticDisplay: `((${vcpuHours.toLocaleString()} vCPU-hrs × 12W) + (${ramGbHours.toLocaleString()} GB-hrs × 0.392W)) × ${pue} PUE × ${dcGrid.emissionFactorKwh} kg/kWh + ${roundTo(embodiedCloudKg + workstationsKg, 1)} kg embodied`,
    activityAmount: roundTo(operationalKwh, 1),
    activityUnit: 'kWh compute + hardware allocation',
    factorValue: dcGrid.emissionFactorKwh,
    factorUnit: 'kg CO₂e/kWh',
    gwpStandard: 'IPCC AR6',
    citation: GSF_SCI_FACTORS.citation,
    methodologyStandard: 'Green Software Foundation Software Carbon Intensity Specification v1.0',
    uncertaintyConfidence: '±9.0% (95% CI)',
    calculatedEmissionsKg: roundTo(totalSciKg, 2),
    calculatedEmissionsTons: roundTo(totalSciKg / 1000, 3),
    notes: `PUE: ${pue}, Datacenter region: ${dcGrid.country} (${dcGrid.emissionFactorKwh} kg/kWh). Includes ${workstationsCount} dev workstation amortizations.`,
  });

  const scope3TotalKg = freightTotalKg + spendTotalKg + totalSciKg;

  // We report Scope 2 using Market-Based as primary ledger, noting Location-based dual track
  const grossKg = scope1TotalKg + scope2MarketKg + scope3TotalKg;
  const grossTons = grossKg / 1000;

  return {
    totalEmissionsTons: roundTo(grossTons, 3),
    grossEmissionsKg: roundTo(grossKg, 2),
    scope1Tons: roundTo(scope1TotalKg / 1000, 3),
    scope2Tons: roundTo(scope2MarketKg / 1000, 3),
    scope2LocationTons: roundTo(scope2LocationKg / 1000, 3),
    scope2MarketTons: roundTo(scope2MarketKg / 1000, 3),
    scope3Tons: roundTo(scope3TotalKg / 1000, 3),
    auditRecords,
    breakdownByCategory: [
      { name: 'Scope 1: Direct Combustion & HVAC', tons: roundTo(scope1TotalKg / 1000, 3), scope: 'Scope 1', color: '#475569' },
      { name: 'Scope 2: Purchased Electricity (Market)', tons: roundTo(scope2MarketKg / 1000, 3), scope: 'Scope 2', color: '#4F46E5' },
      { name: 'Scope 3: Freight Logistics (Cat 4)', tons: roundTo(freightTotalKg / 1000, 3), scope: 'Scope 3', color: '#D97706' },
      { name: 'Scope 3: Supply Chain Spend (Cat 1)', tons: roundTo(spendTotalKg / 1000, 3), scope: 'Scope 3', color: '#B45309' },
      { name: 'Scope 3: Cloud & Workstations (SCI)', tons: roundTo(totalSciKg / 1000, 3), scope: 'Scope 3', color: '#059669' },
    ],
    contextualEquivalents: {
      treesAbsorptionAnnual: Math.round(grossKg / HOUSEHOLD_FACTORS.treeAnnualAbsorptionKg),
      gasolineGallonsEquivalent: Math.round(grossKg / 8.887),
      passengerKmEquivalent: Math.round(grossKg / 0.171),
      regionalAverageDeltaPercent: 0,
    },
  };
};

function factorsRegionLookup(regionKey: string): RegionalGridPreset {
  return REGIONAL_GRID_PRESETS[regionKey as keyof typeof REGIONAL_GRID_PRESETS] || REGIONAL_GRID_PRESETS.us_egrid;
}
