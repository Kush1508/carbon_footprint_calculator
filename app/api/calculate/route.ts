import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  REGIONAL_GRID_PRESETS,
  HOUSEHOLD_FACTORS,
  AGRICULTURE_FACTORS,
  FUEL_FACTORS,
  REFRIGERANT_GWP,
  FREIGHT_FACTORS,
  EEIO_FACTORS,
  GSF_SCI_FACTORS,
  IPCC_AR6_GWP,
} from '@/engine/factors';
import { safeNum, roundTo } from '@/engine/calculatorEngine';
import { RegionalGridKey, FertilizerType, EeioSector } from '@/types';

// Zod Schema for input validation
const calculateQuerySchema = z.object({
  mode: z.enum(['household', 'farmer', 'clean_energy', 'obligated_industry']).optional(),
  role: z.enum(['individual', 'household', 'farmer', 'agriculture', 'company', 'corporate']).default('individual'),
  grid: z.enum(['india_cea', 'us_egrid', 'eu_residual', 'uk_desnz']).default('india_cea'),

  // Individual / Household parameters
  kwh: z.coerce.number().min(0).default(0),
  waterM3: z.coerce.number().min(0).default(0),
  hasSewage: z.coerce.boolean().default(true),
  wasteKg: z.coerce.number().min(0).default(0),
  wasteRoute: z.enum(['landfill', 'compost', 'recycling']).default('landfill'),
  lpgKg: z.coerce.number().min(0).default(0),
  petrolLiters: z.coerce.number().min(0).default(0),
  dieselLiters: z.coerce.number().min(0).default(0),

  // Farmer / Agriculture parameters (Inventory)
  dairyCattle: z.coerce.number().min(0).default(0),
  beefCattle: z.coerce.number().min(0).default(0),
  buffalo: z.coerce.number().min(0).default(0),
  sheepGoats: z.coerce.number().min(0).default(0),
  swine: z.coerce.number().min(0).default(0),
  fertilizerKg: z.coerce.number().min(0).default(0),
  fertilizerType: z.enum(['urea', 'dap', 'ammonium_nitrate', 'npk_20_20_20', 'pure_n']).default('urea'),
  manureKgN: z.coerce.number().min(0).default(0),
  paddyHectares: z.coerce.number().min(0).default(0),
  paddyDays: z.coerce.number().min(0).default(90),
  waterRegime: z.enum(['continuously_flooded', 'single_aeration', 'alternate_wetting_drying']).default('continuously_flooded'),
  machineryDieselLiters: z.coerce.number().min(0).default(0),

  // Corporate parameters
  naturalGasM3: z.coerce.number().min(0).default(0),
  r410aKg: z.coerce.number().min(0).default(0),
  r134aKg: z.coerce.number().min(0).default(0),
  r32Kg: z.coerce.number().min(0).default(0),
  gridElectricityMwh: z.coerce.number().min(0).default(0),
  greenPpaMwh: z.coerce.number().min(0).default(0),
  freightTkm: z.coerce.number().min(0).default(0),
  spendUsd: z.coerce.number().min(0).default(0),
  spendSector: z.enum(['it_hardware', 'software_cloud', 'professional_services', 'machinery', 'chemicals', 'construction']).default('software_cloud'),
  vcpuHours: z.coerce.number().min(0).default(0),
  ramGbHours: z.coerce.number().min(0).default(0),
  pue: z.coerce.number().min(1.0).max(3.0).default(1.2),

  // Crediting Suite Specific Parameters
  farmAreaHa: z.coerce.number().min(0).default(25),
  soilBulkDensity: z.coerce.number().min(0).default(1.30),
  soilSamplingDepthM: z.coerce.number().min(0).default(0.30),
  soilDeltaCarbonPct: z.coerce.number().min(0).default(0.25),
  soilCoarseRockFraction: z.coerce.number().min(0).default(0.05),
  treeCount: z.coerce.number().min(0).default(1200),
  treeDbhCm: z.coerce.number().min(0).default(18),
  treeHeightM: z.coerce.number().min(0).default(12),
  treeWoodDensity: z.coerce.number().min(0).default(0.55),
  treeRootToShoot: z.coerce.number().min(0).default(0.24),
  farmLeakagePct: z.coerce.number().min(0).default(5.0),
  farmBufferPoolPct: z.coerce.number().min(0).default(15.0),
  cleanTech: z.enum(['solar', 'wind', 'hydro', 'biomass']).default('solar'),
  cleanExportMwh: z.coerce.number().min(0).default(5000),
  cleanAuxiliaryPeTco2e: z.coerce.number().min(0).default(15.0),
  cleanLeakageTco2e: z.coerce.number().min(0).default(0.0),
  cleanCreditPriceUsd: z.coerce.number().min(0).default(15.0),
  industrySector: z.string().default('Iron & Steel (Crude Steel)'),
  indScope1Tco2e: z.coerce.number().min(0).default(85000),
  indScope2Tco2e: z.coerce.number().min(0).default(35000),
  indProductionTonnes: z.coerce.number().min(1).default(75000),
  indTargetGei: z.coerce.number().min(0).default(1.700),
});

type CalculateParams = z.infer<typeof calculateQuerySchema>;

// CORS helper headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Content-Type': 'application/json; charset=utf-8',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function executeCreditingMode(params: CalculateParams, gridPreset: (typeof REGIONAL_GRID_PRESETS)['india_cea']) {
  const mode = params.mode;

  if (mode === 'household') {
    const gridEf = gridPreset.emissionFactorKwh;
    const elecKg = params.kwh * gridEf * 12;
    const lpgKg = params.lpgKg * 2.983 * 12;
    const petrolKg = params.petrolLiters * 2.31 * 12;
    const dieselKg = params.dieselLiters * 2.68 * 12;
    const waterKg = params.waterM3 * 1.052 * 12;
    const wasteKg = params.wasteKg * 52 * 0.586;

    const totalKg = elecKg + lpgKg + petrolKg + dieselKg + waterKg + wasteKg;
    const totalTco2e = roundTo(totalKg / 1000, 4);
    const creditsNeeded = Math.ceil(totalTco2e);

    return {
      status: 'success',
      mode: 'household',
      timestamp: new Date().toISOString(),
      governing_standard: 'Gold Standard GS4GG / Verra VCS Retirement Certificate',
      crediting_equation: 'Net Verified Credits (tCO2e) = Ceil(Annual Gross Footprint). Non-tradable end-user retirement.',
      statutory_rule: 'Individuals do not earn tradable credits from household reductions. Neutralize footprint by purchasing & permanently retiring credits via Verra, Gold Standard, or Climes.io.',
      total_kg_co2e: roundTo(totalKg, 2),
      total_tco2e: totalTco2e,
      net_credits_tco2e: creditsNeeded,
      credits_needed: creditsNeeded,
      recommended_registry: 'Gold Standard',
      registry_links: [
        { name: 'Gold Standard Impact Registry', url: 'https://registry.goldstandard.org' },
        { name: 'Verra Registry', url: 'https://registry.verra.org' },
      ],
      breakdown: {
        electricity: { kg_co2e: roundTo(elecKg, 2), t_co2e: roundTo(elecKg / 1000, 4), scope: 'Scope 2', description: `${params.kwh} kWh/mo × ${gridEf} kg/kWh × 12` },
        lpg: { kg_co2e: roundTo(lpgKg, 2), t_co2e: roundTo(lpgKg / 1000, 4), scope: 'Scope 1', description: `${params.lpgKg} kg LPG/mo × 2.983 kg CO2e/kg × 12` },
        petrol_diesel: { kg_co2e: roundTo(petrolKg + dieselKg, 2), t_co2e: roundTo((petrolKg + dieselKg) / 1000, 4), scope: 'Scope 1', description: 'Motor transport combustion' },
        water_waste: { kg_co2e: roundTo(waterKg + wasteKg, 2), t_co2e: roundTo((waterKg + wasteKg) / 1000, 4), scope: 'Scope 3', description: 'Water pumping & landfill methane' },
      },
    };
  }

  if (mode === 'farmer') {
    // 1. SOC Stock Change
    const socPerHa = params.soilBulkDensity * params.soilSamplingDepthM * params.soilDeltaCarbonPct * (1 - params.soilCoarseRockFraction) * 100 * (44 / 12);
    const totalSocTco2e = Math.max(0, socPerHa * params.farmAreaHa);

    // 2. Agroforestry Biomass
    const agbKgPerTree = 0.0673 * Math.pow(params.treeDbhCm, 2) * params.treeHeightM * params.treeWoodDensity;
    const totalBiomassTonnes = ((agbKgPerTree * (1 + params.treeRootToShoot)) * params.treeCount) / 1000;
    const totalBiomassRemovalsTco2e = Math.max(0, totalBiomassTonnes * 0.47 * (44 / 12));

    // 3. Gross Baseline Additions (BE)
    const grossBaselineBeTco2e = totalSocTco2e + totalBiomassRemovalsTco2e;

    // 4. Project Emissions (PE)
    const dieselPeTco2e = (params.machineryDieselLiters * 2.68) / 1000;
    const fertPeTco2e = (params.fertilizerKg * 0.46 * 0.01 * (44 / 28) * 273) / 1000;
    const projectEmissionsPeTco2e = dieselPeTco2e + fertPeTco2e;

    // 5. Leakage (LE)
    const leakageTco2e = grossBaselineBeTco2e * (params.farmLeakagePct / 100);

    // 6. Net before buffer
    const netBeforeBufferTco2e = Math.max(0, grossBaselineBeTco2e - projectEmissionsPeTco2e - leakageTco2e);

    // 7. 15% Buffer Pool
    const bufferPoolTco2e = netBeforeBufferTco2e * (params.farmBufferPoolPct / 100);

    // 8. Net Verified Tradable Credits
    const netCreditsTco2e = roundTo(Math.max(0, netBeforeBufferTco2e - bufferPoolTco2e), 4);

    return {
      status: 'success',
      mode: 'farmer',
      timestamp: new Date().toISOString(),
      governing_standard: 'Verra VCS Methodology VM0042 v2.2 & Gold Standard LUF',
      crediting_equation: 'Net Verified Credits (tCO2e) = BE − PE − LE − Buffer',
      aggregator_guidance: 'Smallholders (<500 ha) aggregate into Grouped Projects via FPOs/aggregators who pool monitoring and credit issuance under Verra VCS v4.5.',
      gross_baseline_tco2e: roundTo(grossBaselineBeTco2e, 4),
      project_emissions_tco2e: roundTo(projectEmissionsPeTco2e, 4),
      leakage_tco2e: roundTo(leakageTco2e, 4),
      buffer_pool_tco2e: roundTo(bufferPoolTco2e, 4),
      net_credits_tco2e: netCreditsTco2e,
      credits_needed: Math.ceil(netCreditsTco2e),
      recommended_registry: 'Verra',
      registry_links: [
        { name: 'Verra Registry (VCS VM0042)', url: 'https://registry.verra.org' },
        { name: 'Gold Standard Land Use & Forestry', url: 'https://registry.goldstandard.org' },
      ],
      breakdown: {
        soil_organic_carbon: { kg_co2e: roundTo(totalSocTco2e * 1000, 2), t_co2e: roundTo(totalSocTco2e, 4), scope: 'Removals', description: `${params.farmAreaHa} ha × ${roundTo(socPerHa, 2)} tCO2e/ha/yr` },
        agroforestry_biomass: { kg_co2e: roundTo(totalBiomassRemovalsTco2e * 1000, 2), t_co2e: roundTo(totalBiomassRemovalsTco2e, 4), scope: 'Removals', description: `${params.treeCount} trees pantropical allometry` },
        project_emissions: { kg_co2e: roundTo(projectEmissionsPeTco2e * 1000, 2), t_co2e: roundTo(projectEmissionsPeTco2e, 4), scope: 'Deductions (PE)', description: 'Machinery diesel + Urea N2O' },
        leakage: { kg_co2e: roundTo(leakageTco2e * 1000, 2), t_co2e: roundTo(leakageTco2e, 4), scope: 'Deductions (LE)', description: `${params.farmLeakagePct}% activity-shifting leakage` },
        buffer_pool: { kg_co2e: roundTo(bufferPoolTco2e * 1000, 2), t_co2e: roundTo(bufferPoolTco2e, 4), scope: 'Buffer Pool', description: `${params.farmBufferPoolPct}% non-permanence risk withholding` },
      },
    };
  }

  if (mode === 'clean_energy') {
    const gridEf = gridPreset.emissionFactorKwh; // tCO2e / MWh
    const baselineBeTco2e = params.cleanExportMwh * gridEf;
    const netCreditsTco2e = roundTo(Math.max(0, baselineBeTco2e - params.cleanAuxiliaryPeTco2e - params.cleanLeakageTco2e), 4);
    const projectedRevenueUsd = roundTo(netCreditsTco2e * params.cleanCreditPriceUsd, 2);

    return {
      status: 'success',
      mode: 'clean_energy',
      timestamp: new Date().toISOString(),
      governing_standard: 'UNFCCC CDM ACM0002 / Gold Standard Renewable Energy / Verra VCS',
      crediting_equation: 'Credits (tCO2e) = (EG_net × EF_grid,CM) − PE_aux − LE',
      gross_baseline_tco2e: roundTo(baselineBeTco2e, 4),
      project_emissions_tco2e: roundTo(params.cleanAuxiliaryPeTco2e, 4),
      leakage_tco2e: roundTo(params.cleanLeakageTco2e, 4),
      buffer_pool_tco2e: 0.0,
      net_credits_tco2e: netCreditsTco2e,
      credits_needed: Math.ceil(netCreditsTco2e),
      projected_revenue_usd: projectedRevenueUsd,
      recommended_registry: 'Gold Standard',
      registry_links: [
        { name: 'Gold Standard Impact Registry', url: 'https://registry.goldstandard.org' },
        { name: 'Verra Registry', url: 'https://registry.verra.org' },
      ],
      breakdown: {
        grid_displacement: { kg_co2e: roundTo(baselineBeTco2e * 1000, 2), t_co2e: roundTo(baselineBeTco2e, 4), scope: 'Baseline Displacement (BE)', description: `${params.cleanExportMwh} MWh × ${gridEf} tCO2e/MWh (${gridPreset.country})` },
        auxiliary_emissions: { kg_co2e: roundTo(params.cleanAuxiliaryPeTco2e * 1000, 2), t_co2e: roundTo(params.cleanAuxiliaryPeTco2e, 4), scope: 'Deductions (PE)', description: 'Stationary auxiliary generator / parasitic consumption' },
        leakage: { kg_co2e: roundTo(params.cleanLeakageTco2e * 1000, 2), t_co2e: roundTo(params.cleanLeakageTco2e, 4), scope: 'Deductions (LE)', description: 'Transmission & distribution leakage' },
      },
    };
  }

  if (mode === 'obligated_industry') {
    const totalGateEmissions = params.indScope1Tco2e + params.indScope2Tco2e;
    const actualGei = totalGateEmissions / Math.max(1, params.indProductionTonnes);
    const geiDelta = params.indTargetGei - actualGei;
    const cccsEarned = Math.round(geiDelta * params.indProductionTonnes);
    const isSurplus = cccsEarned >= 0;

    return {
      status: 'success',
      mode: 'obligated_industry',
      timestamp: new Date().toISOString(),
      governing_standard: 'Bureau of Energy Efficiency (BEE) Carbon Credit Trading Scheme (CCTS 2023)',
      crediting_equation: 'CCCs Earned / Required = (Target GEI − Actual GEI) × Production Output',
      statutory_compliance_status: isSurplus ? 'SURPLUS / OVER-ACHIEVEMENT' : 'DEFICIT / NON-COMPLIANCE',
      statutory_rule: isSurplus
        ? 'Entity over-achieved intensity target. CCCs issued for trading on power exchanges (IEX/PXIL).'
        : 'Entity under-achieved target. Must purchase and surrender CCCs or face Energy Conservation Act penalties.',
      sector: params.industrySector,
      total_gate_emissions_tco2e: totalGateEmissions,
      actual_gei_tco2e_per_tonne: roundTo(actualGei, 4),
      target_gei_tco2e_per_tonne: roundTo(params.indTargetGei, 4),
      net_credits_tco2e: cccsEarned,
      credits_needed: isSurplus ? 0 : Math.abs(cccsEarned),
      recommended_registry: 'BEE ICM',
      registry_links: [
        { name: 'Bureau of Energy Efficiency (BEE ICM)', url: 'https://beeindia.gov.in' },
      ],
      breakdown: {
        scope1_gate: { kg_co2e: params.indScope1Tco2e * 1000, t_co2e: params.indScope1Tco2e, scope: 'Scope 1', description: 'Direct process & stationary thermal combustion' },
        scope2_gate: { kg_co2e: params.indScope2Tco2e * 1000, t_co2e: params.indScope2Tco2e, scope: 'Scope 2', description: 'Imported grid power intensity' },
      },
    };
  }

  return null;
}

function executeCalculation(params: CalculateParams) {
  const gridPreset = REGIONAL_GRID_PRESETS[params.grid as RegionalGridKey] || REGIONAL_GRID_PRESETS.india_cea;

  // If explicit crediting mode requested, route to statutory crediting engine
  if (params.mode) {
    const creditingResult = executeCreditingMode(params, gridPreset);
    if (creditingResult) {
      return creditingResult;
    }
  }

  const isIndividual = params.role === 'individual' || params.role === 'household';
  const isFarmer = params.role === 'farmer' || params.role === 'agriculture';
  const isCorporate = params.role === 'company' || params.role === 'corporate';

  let totalKg = 0;
  const breakdown: Record<string, { kg_co2e: number; t_co2e: number; scope: string; description: string }> = {};
  const methodologies: string[] = [];

  if (isIndividual) {
    // 1. Grid electricity
    const elecKg = params.kwh * gridPreset.emissionFactorKwh;
    if (params.kwh > 0) {
      breakdown['grid_electricity'] = {
        kg_co2e: roundTo(elecKg, 2),
        t_co2e: roundTo(elecKg / 1000, 4),
        scope: 'Scope 2',
        description: `${params.kwh} kWh × ${gridPreset.emissionFactorKwh} kg CO2e/kWh (${gridPreset.country})`,
      };
      methodologies.push(`Electricity: ${params.kwh} kWh × ${gridPreset.emissionFactorKwh} kg CO2e/kWh [Ref: ${gridPreset.sourceAuthority}]`);
      totalKg += elecKg;
    }

    // 2. Domestic Water
    const waterEf = HOUSEHOLD_FACTORS.waterSupplyKgPerM3 + (params.hasSewage ? HOUSEHOLD_FACTORS.waterTreatmentKgPerM3 : 0);
    const waterKg = params.waterM3 * waterEf;
    if (params.waterM3 > 0) {
      breakdown['domestic_water'] = {
        kg_co2e: roundTo(waterKg, 2),
        t_co2e: roundTo(waterKg / 1000, 4),
        scope: 'Scope 3',
        description: `${params.waterM3} m³ × ${waterEf} kg CO2e/m³ (Supply + Treatment)`,
      };
      methodologies.push(`Water: ${params.waterM3} m³ × ${waterEf} kg CO2e/m³ [Ref: Venkatesh & Brattebø 2011]`);
      totalKg += waterKg;
    }

    // 3. Municipal Solid Waste
    let wasteEf = HOUSEHOLD_FACTORS.wasteLandfillKgPerKg;
    if (params.wasteRoute === 'compost') wasteEf = HOUSEHOLD_FACTORS.wasteCompostKgPerKg;
    if (params.wasteRoute === 'recycling') wasteEf = HOUSEHOLD_FACTORS.wasteRecyclingKgPerKg;
    const wasteKgAnnual = params.wasteKg * 52 * wasteEf;
    if (params.wasteKg > 0) {
      breakdown['municipal_waste'] = {
        kg_co2e: roundTo(wasteKgAnnual, 2),
        t_co2e: roundTo(wasteKgAnnual / 1000, 4),
        scope: 'Scope 3',
        description: `${params.wasteKg} kg/wk × 52 wks × ${wasteEf} kg CO2e/kg (${params.wasteRoute})`,
      };
      methodologies.push(`Waste: ${params.wasteKg} kg/wk × 52 × ${wasteEf} kg CO2e/kg [Ref: US EPA WARM v15 / IPCC 2006]`);
      totalKg += wasteKgAnnual;
    }

    // 4. LPG
    const lpgKgAnnual = params.lpgKg * FUEL_FACTORS.lpg.efKgPerUnit;
    if (params.lpgKg > 0) {
      breakdown['lpg_cooking'] = {
        kg_co2e: roundTo(lpgKgAnnual, 2),
        t_co2e: roundTo(lpgKgAnnual / 1000, 4),
        scope: 'Scope 1',
        description: `${params.lpgKg} kg LPG × ${FUEL_FACTORS.lpg.efKgPerUnit} kg CO2e/kg`,
      };
      methodologies.push(`LPG: ${params.lpgKg} kg × ${FUEL_FACTORS.lpg.efKgPerUnit} kg CO2e/kg [Ref: IPCC 2006 Vol 2 Stationary Combustion]`);
      totalKg += lpgKgAnnual;
    }

    // 5. Petrol & Diesel
    if (params.petrolLiters > 0) {
      const petrolKg = params.petrolLiters * FUEL_FACTORS.petrol.efKgPerUnit;
      breakdown['petrol_transport'] = {
        kg_co2e: roundTo(petrolKg, 2),
        t_co2e: roundTo(petrolKg / 1000, 4),
        scope: 'Scope 1',
        description: `${params.petrolLiters} L Petrol × ${FUEL_FACTORS.petrol.efKgPerUnit} kg CO2e/L`,
      };
      methodologies.push(`Petrol: ${params.petrolLiters} L × ${FUEL_FACTORS.petrol.efKgPerUnit} kg CO2e/L [Ref: IPCC 2006 Vol 2 Mobile Combustion]`);
      totalKg += petrolKg;
    }
    if (params.dieselLiters > 0) {
      const dieselKg = params.dieselLiters * FUEL_FACTORS.diesel.efKgPerUnit;
      breakdown['diesel_transport'] = {
        kg_co2e: roundTo(dieselKg, 2),
        t_co2e: roundTo(dieselKg / 1000, 4),
        scope: 'Scope 1',
        description: `${params.dieselLiters} L Diesel × ${FUEL_FACTORS.diesel.efKgPerUnit} kg CO2e/L`,
      };
      methodologies.push(`Diesel: ${params.dieselLiters} L × ${FUEL_FACTORS.diesel.efKgPerUnit} kg CO2e/L [Ref: IPCC 2006 Vol 2 Mobile Combustion]`);
      totalKg += dieselKg;
    }
  } else if (isFarmer) {
    // 1. Enteric Fermentation
    const ch4Kg =
      params.dairyCattle * AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear.dairy_cattle +
      params.beefCattle * AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear.beef_cattle +
      params.buffalo * AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear.buffalo +
      params.sheepGoats * AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear.sheep_goats +
      params.swine * AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear.swine;
    const entericKgCo2e = ch4Kg * IPCC_AR6_GWP.CH4;
    if (ch4Kg > 0) {
      breakdown['enteric_fermentation'] = {
        kg_co2e: roundTo(entericKgCo2e, 2),
        t_co2e: roundTo(entericKgCo2e / 1000, 4),
        scope: 'Agricultural AFOLU',
        description: `Ruminant CH4 converted via IPCC AR6 GWP_CH4 = ${IPCC_AR6_GWP.CH4}`,
      };
      methodologies.push(`Enteric: Headcount × EF_CH4 × ${IPCC_AR6_GWP.CH4} GWP [Ref: IPCC 2019 Refinement Vol 4 AFOLU]`);
      totalKg += entericKgCo2e;
    }

    // 2. Soil N2O (Synthetic & Organic)
    const nFraction = AGRICULTURE_FACTORS.fertilizerNitrogenFraction[params.fertilizerType as FertilizerType] || 0.46;
    const synthN_kg = params.fertilizerKg * nFraction;
    const totalN_kg = synthN_kg + params.manureKgN;
    const directN2O_N = totalN_kg * AGRICULTURE_FACTORS.soilN2O_EF1;
    const directN2O_kg = directN2O_N * AGRICULTURE_FACTORS.n2oToN2Ratio;
    const soilN2oKgCo2e = directN2O_kg * IPCC_AR6_GWP.N2O;

    if (totalN_kg > 0) {
      breakdown['soil_n2o'] = {
        kg_co2e: roundTo(soilN2oKgCo2e, 2),
        t_co2e: roundTo(soilN2oKgCo2e / 1000, 4),
        scope: 'Agricultural AFOLU',
        description: `${totalN_kg} kg elemental N applied × EF1 (${AGRICULTURE_FACTORS.soilN2O_EF1}) × (44/28) × ${IPCC_AR6_GWP.N2O} (GWP)`,
      };
      methodologies.push(`Soil N2O: (${synthN_kg} kg N synth + ${params.manureKgN} kg N org) × 0.01 × (44/28) × 273 [Ref: Bouwman et al. 2002; IPCC AR6]`);
      totalKg += soilN2oKgCo2e;
    }

    // 3. Flooded Paddy Rice Methane
    const waterSf = AGRICULTURE_FACTORS.paddyWaterScalingFactor[params.waterRegime as keyof typeof AGRICULTURE_FACTORS.paddyWaterScalingFactor] || 1.0;
    const riceCh4Kg = params.paddyHectares * params.paddyDays * AGRICULTURE_FACTORS.paddyBaselineMethaneKgPerHaDay * waterSf;
    const riceKgCo2e = riceCh4Kg * IPCC_AR6_GWP.CH4;
    if (params.paddyHectares > 0) {
      breakdown['paddy_rice_methane'] = {
        kg_co2e: roundTo(riceKgCo2e, 2),
        t_co2e: roundTo(riceKgCo2e / 1000, 4),
        scope: 'Agricultural AFOLU',
        description: `${params.paddyHectares} ha × ${params.paddyDays} days × ${AGRICULTURE_FACTORS.paddyBaselineMethaneKgPerHaDay} kg CH4/ha/day × ${waterSf} SF_w × ${IPCC_AR6_GWP.CH4}`,
      };
      methodologies.push(`Paddy Rice: Area × Days × 1.30 kg CH4/ha/day × ${waterSf} SF_w × ${IPCC_AR6_GWP.CH4} [Ref: IPCC Vol 4 AFOLU / Verra VM0042]`);
      totalKg += riceKgCo2e;
    }

    // 4. Agricultural Machinery Diesel
    if (params.machineryDieselLiters > 0) {
      const dieselKg = params.machineryDieselLiters * AGRICULTURE_FACTORS.machineryDieselKgPerLiter;
      breakdown['machinery_diesel'] = {
        kg_co2e: roundTo(dieselKg, 2),
        t_co2e: roundTo(dieselKg / 1000, 4),
        scope: 'Scope 1',
        description: `${params.machineryDieselLiters} L × ${AGRICULTURE_FACTORS.machineryDieselKgPerLiter} kg CO2e/L`,
      };
      methodologies.push(`Machinery Diesel: ${params.machineryDieselLiters} L × ${AGRICULTURE_FACTORS.machineryDieselKgPerLiter} kg CO2e/L [Ref: IPCC 2006 Vol 2 Energy]`);
      totalKg += dieselKg;
    }
  } else if (isCorporate) {
    // 1. Scope 1 Stationary Natural Gas
    if (params.naturalGasM3 > 0) {
      const ngKg = params.naturalGasM3 * FUEL_FACTORS.natural_gas.efKgPerUnit;
      breakdown['scope1_natural_gas'] = {
        kg_co2e: roundTo(ngKg, 2),
        t_co2e: roundTo(ngKg / 1000, 4),
        scope: 'Scope 1',
        description: `${params.naturalGasM3} m³ Natural Gas × ${FUEL_FACTORS.natural_gas.efKgPerUnit} kg CO2e/m³`,
      };
      methodologies.push(`Natural Gas: ${params.naturalGasM3} m³ × ${FUEL_FACTORS.natural_gas.efKgPerUnit} kg CO2e/m³ [Ref: IPCC 2006 stationary combustion]`);
      totalKg += ngKg;
    }

    // 2. Scope 1 Fugitive Refrigerants
    const refrigKg =
      params.r410aKg * REFRIGERANT_GWP.r410a +
      params.r134aKg * REFRIGERANT_GWP.r134a +
      params.r32Kg * REFRIGERANT_GWP.r32;
    if (refrigKg > 0) {
      breakdown['scope1_refrigerants'] = {
        kg_co2e: roundTo(refrigKg, 2),
        t_co2e: roundTo(refrigKg / 1000, 4),
        scope: 'Scope 1',
        description: `Fugitive HVAC refrigerant leaks converted via AR6 GWP100`,
      };
      methodologies.push(`Refrigerants: Mass × AR6 GWP [Ref: IPCC Sixth Assessment Report Table 7.15]`);
      totalKg += refrigKg;
    }

    // 3. Scope 2 Dual-Track Grid Electricity
    if (params.gridElectricityMwh > 0) {
      const elecKwh = params.gridElectricityMwh * 1000;
      const netGridKwh = Math.max(0, elecKwh - (params.greenPpaMwh * 1000));
      const scope2Kg = netGridKwh * gridPreset.emissionFactorKwh;
      breakdown['scope2_electricity_market'] = {
        kg_co2e: roundTo(scope2Kg, 2),
        t_co2e: roundTo(scope2Kg / 1000, 4),
        scope: 'Scope 2',
        description: `${params.gridElectricityMwh} MWh grid (−${params.greenPpaMwh} MWh green PPA) × ${gridPreset.emissionFactorKwh} kg/kWh`,
      };
      methodologies.push(`Scope 2 Market: Net MWh × ${gridPreset.emissionFactorKwh} kg/kWh [Ref: GHG Protocol Scope 2 Guidance]`);
      totalKg += scope2Kg;
    }

    // 4. Scope 3 Freight Logistics
    if (params.freightTkm > 0) {
      const freightKg = params.freightTkm * FREIGHT_FACTORS.truck_heavy.efKgPerTkm;
      breakdown['scope3_freight'] = {
        kg_co2e: roundTo(freightKg, 2),
        t_co2e: roundTo(freightKg / 1000, 4),
        scope: 'Scope 3',
        description: `${params.freightTkm} tonne-km × ${FREIGHT_FACTORS.truck_heavy.efKgPerTkm} kg CO2e/tkm (Heavy road freight)`,
      };
      methodologies.push(`Freight: ${params.freightTkm} tkm × ${FREIGHT_FACTORS.truck_heavy.efKgPerTkm} kg CO2e/tkm [Ref: GLEC Framework v3.0]`);
      totalKg += freightKg;
    }

    // 5. Scope 3 Spend-Based Procurement (USEEIO)
    if (params.spendUsd > 0) {
      const eeioEntry = EEIO_FACTORS[params.spendSector as EeioSector] || EEIO_FACTORS.software_cloud;
      const spendKg = params.spendUsd * eeioEntry.efKgPerUsd;
      breakdown['scope3_procurement'] = {
        kg_co2e: roundTo(spendKg, 2),
        t_co2e: roundTo(spendKg / 1000, 4),
        scope: 'Scope 3',
        description: `$${params.spendUsd} USD spend in ${params.spendSector} × ${eeioEntry.efKgPerUsd} kg CO2e/USD`,
      };
      methodologies.push(`USEEIO Spend: $${params.spendUsd} × ${eeioEntry.efKgPerUsd} kg/$ [Ref: US EPA USEEIO v2.0 Input-Output Matrix]`);
      totalKg += spendKg;
    }

    // 6. Green Software SCI (ISO 21031)
    if (params.vcpuHours > 0 || params.ramGbHours > 0) {
      const vcpuKwh = params.vcpuHours * GSF_SCI_FACTORS.vCpuPowerKw;
      const ramKwh = params.ramGbHours * GSF_SCI_FACTORS.ramPowerKwPerGb;
      const datacenterKwh = (vcpuKwh + ramKwh) * params.pue;
      const sciKg = datacenterKwh * gridPreset.emissionFactorKwh;
      breakdown['green_software_sci'] = {
        kg_co2e: roundTo(sciKg, 2),
        t_co2e: roundTo(sciKg / 1000, 4),
        scope: 'Scope 3 / SCI',
        description: `(${params.vcpuHours} vCPU-hrs + ${params.ramGbHours} RAM-GB-hrs) × PUE ${params.pue} × ${gridPreset.emissionFactorKwh} kg/kWh`,
      };
      methodologies.push(`GSF SCI: Datacenter kWh × ${gridPreset.emissionFactorKwh} kg/kWh [Ref: Green Software Foundation SCI / ISO 21031]`);
      totalKg += sciKg;
    }
  }

  const totalTons = roundTo(totalKg / 1000, 4);
  const creditsNeeded = Math.ceil(totalTons);

  // Recommended Registry Assignment
  let recommendedRegistry = 'Verra';
  let registryDetails = 'Verra Verified Carbon Standard (VCS) Methodology VM0042 (Improved Agricultural Land Management / Alternate Wetting & Drying).';

  if (isIndividual) {
    recommendedRegistry = 'Gold Standard';
    registryDetails = 'Gold Standard for the Global Goals (GS4GG) micro-scale verified credits.';
  } else if (isCorporate) {
    if (params.grid === 'india_cea') {
      recommendedRegistry = 'BEE ICM';
      registryDetails = 'Bureau of Energy Efficiency (BEE) India Carbon Market (ICM) / Carbon Credit Trading Scheme (CCTS 2023).';
    } else {
      recommendedRegistry = 'Verra';
      registryDetails = 'Verra Verified Carbon Standard (VCS) Scope 1/2 Industrial Decarbonization & Renewable PPAs.';
    }
  }

  return {
    status: 'success',
    timestamp: new Date().toISOString(),
    query: params,
    grid_used: {
      id: gridPreset.id,
      country: gridPreset.country,
      emission_factor_kg_per_kwh: gridPreset.emissionFactorKwh,
      source_authority: gridPreset.sourceAuthority,
      citation: gridPreset.citation,
    },
    total_kg_co2e: roundTo(totalKg, 2),
    total_tco2e: totalTons,
    net_credits_tco2e: creditsNeeded,
    credits_needed: creditsNeeded,
    recommended_registry: recommendedRegistry,
    registry_details: registryDetails,
    breakdown,
    methodology: methodologies.length > 0 ? methodologies : ['ISO 14064-1:2018 / GHG Protocol Corporate Standard default emission factors.'],
    uncertainty_range_percent: gridPreset.uncertaintyPercent,
    gwp_standard: 'IPCC AR6 (100-Year Climate Horizon)',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const validated = calculateQuerySchema.safeParse(rawParams);
    if (!validated.success) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid query parameters provided',
          errors: validated.error.issues,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = executeCalculation(validated.data);
    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal calculation engine error',
        error: error?.message || 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const validated = calculateQuerySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid request body schema',
          errors: validated.error.issues,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = executeCalculation(validated.data);
    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal calculation engine error',
        error: error?.message || 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
