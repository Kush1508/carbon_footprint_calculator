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
import { RegionalGridKey } from '@/types';

// Zod Schema for input validation
const calculateQuerySchema = z.object({
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

  // Farmer / Agriculture parameters
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

function executeCalculation(params: CalculateParams) {
  const gridPreset = REGIONAL_GRID_PRESETS[params.grid as RegionalGridKey] || REGIONAL_GRID_PRESETS.india_cea;
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

    // 3. Solid Waste
    let wasteEf = HOUSEHOLD_FACTORS.wasteLandfillKgPerKg;
    if (params.wasteRoute === 'compost') wasteEf = HOUSEHOLD_FACTORS.wasteCompostKgPerKg;
    if (params.wasteRoute === 'recycling') wasteEf = HOUSEHOLD_FACTORS.wasteRecyclingKgPerKg;
    const wasteKg = params.wasteKg * wasteEf;
    if (params.wasteKg > 0) {
      breakdown['solid_waste'] = {
        kg_co2e: roundTo(wasteKg, 2),
        t_co2e: roundTo(wasteKg / 1000, 4),
        scope: 'Scope 1',
        description: `${params.wasteKg} kg × ${wasteEf} kg CO2e/kg (${params.wasteRoute})`,
      };
      methodologies.push(`Waste: ${params.wasteKg} kg × ${wasteEf} kg CO2e/kg [Ref: IPCC Vol 5 First Order Decay]`);
      totalKg += wasteKg;
    }

    // 4. LPG / Cooking Gas
    if (params.lpgKg > 0) {
      const lpgKgCO2 = params.lpgKg * FUEL_FACTORS.lpg.efKgPerUnit;
      breakdown['lpg_cooking'] = {
        kg_co2e: roundTo(lpgKgCO2, 2),
        t_co2e: roundTo(lpgKgCO2 / 1000, 4),
        scope: 'Scope 1',
        description: `${params.lpgKg} kg LPG × ${FUEL_FACTORS.lpg.efKgPerUnit} kg CO2e/kg`,
      };
      methodologies.push(`LPG: ${params.lpgKg} kg × 2.98 kg CO2e/kg [Ref: DEFRA / IPCC 2006]`);
      totalKg += lpgKgCO2;
    }

    // 5. Petrol / Gasoline
    if (params.petrolLiters > 0) {
      const petKgCO2 = params.petrolLiters * FUEL_FACTORS.petrol.efKgPerUnit;
      breakdown['petrol_transport'] = {
        kg_co2e: roundTo(petKgCO2, 2),
        t_co2e: roundTo(petKgCO2 / 1000, 4),
        scope: 'Scope 1',
        description: `${params.petrolLiters} L Petrol × ${FUEL_FACTORS.petrol.efKgPerUnit} kg CO2e/L`,
      };
      methodologies.push(`Petrol: ${params.petrolLiters} L × 2.31 kg CO2e/L [Ref: IPCC 2006 Vol 2 Mobile Combustion]`);
      totalKg += petKgCO2;
    }

    // 6. Diesel
    if (params.dieselLiters > 0) {
      const dslKgCO2 = params.dieselLiters * FUEL_FACTORS.diesel.efKgPerUnit;
      breakdown['diesel_transport'] = {
        kg_co2e: roundTo(dslKgCO2, 2),
        t_co2e: roundTo(dslKgCO2 / 1000, 4),
        scope: 'Scope 1',
        description: `${params.dieselLiters} L Diesel × ${FUEL_FACTORS.diesel.efKgPerUnit} kg CO2e/L`,
      };
      methodologies.push(`Diesel: ${params.dieselLiters} L × 2.68 kg CO2e/L [Ref: IPCC 2006 Stationary/Mobile Combustion]`);
      totalKg += dslKgCO2;
    }
  } else if (isFarmer) {
    // 1. Enteric Fermentation
    const livestockList = [
      { count: params.dairyCattle, ef: AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear.dairy_cattle, label: 'Dairy Cattle' },
      { count: params.beefCattle, ef: AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear.beef_cattle, label: 'Beef Cattle' },
      { count: params.buffalo, ef: AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear.buffalo, label: 'Water Buffalo' },
      { count: params.sheepGoats, ef: AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear.sheep_goats, label: 'Sheep/Goats' },
      { count: params.swine, ef: AGRICULTURE_FACTORS.entericMethaneKgPerHeadYear.swine, label: 'Swine' },
    ];

    let entericTotalKg = 0;
    livestockList.forEach((item) => {
      if (item.count > 0) {
        const itemKg = item.count * item.ef * IPCC_AR6_GWP.CH4;
        entericTotalKg += itemKg;
      }
    });

    if (entericTotalKg > 0) {
      breakdown['enteric_fermentation'] = {
        kg_co2e: roundTo(entericTotalKg, 2),
        t_co2e: roundTo(entericTotalKg / 1000, 4),
        scope: 'Agricultural AFOLU',
        description: `Ruminant CH4 converted via IPCC AR6 GWP_CH4 = 28`,
      };
      methodologies.push(`Enteric: Headcount × EF_CH4 × 28 GWP [Ref: IPCC 2019 Refinement Vol 4 AFOLU]`);
      totalKg += entericTotalKg;
    }

    // 2. Soil N2O from Fertilizer & Manure
    const nFraction = AGRICULTURE_FACTORS.fertilizerNitrogenFraction[params.fertilizerType] || 0.46;
    const synthN = params.fertilizerKg * nFraction;
    const totalN = synthN + params.manureKgN;
    if (totalN > 0) {
      const soilN2OKg = totalN * AGRICULTURE_FACTORS.soilN2O_EF1 * AGRICULTURE_FACTORS.n2oToN2Ratio * IPCC_AR6_GWP.N2O;
      breakdown['soil_n2o'] = {
        kg_co2e: roundTo(soilN2OKg, 2),
        t_co2e: roundTo(soilN2OKg / 1000, 4),
        scope: 'Agricultural AFOLU',
        description: `${roundTo(totalN, 1)} kg elemental N applied × EF1 (0.01) × (44/28) × 273 (GWP)`,
      };
      methodologies.push(`Soil N2O: (${roundTo(synthN, 1)} kg N synth + ${params.manureKgN} kg N org) × 0.01 × (44/28) × 273 [Ref: Bouwman et al. 2002; IPCC AR6]`);
      totalKg += soilN2OKg;
    }

    // 3. Flooded Paddy Methane
    if (params.paddyHectares > 0 && params.paddyDays > 0) {
      const waterScaling = AGRICULTURE_FACTORS.paddyWaterScalingFactor[params.waterRegime] || 1.0;
      const paddyKg = params.paddyHectares * params.paddyDays * AGRICULTURE_FACTORS.paddyBaselineMethaneKgPerHaDay * waterScaling * IPCC_AR6_GWP.CH4;
      breakdown['paddy_rice_methane'] = {
        kg_co2e: roundTo(paddyKg, 2),
        t_co2e: roundTo(paddyKg / 1000, 4),
        scope: 'Agricultural AFOLU',
        description: `${params.paddyHectares} ha × ${params.paddyDays} days × 1.30 kg CH4/ha/day × ${waterScaling} SF_w × 28`,
      };
      methodologies.push(`Paddy Rice: Area × Days × 1.30 kg CH4/ha/day × ${waterScaling} SF_w × 28 [Ref: IPCC Vol 4 AFOLU / Verra VM0042]`);
      totalKg += paddyKg;
    }

    // 4. Tractor / Irrigation Diesel
    if (params.machineryDieselLiters > 0) {
      const machDieselKg = params.machineryDieselLiters * AGRICULTURE_FACTORS.machineryDieselKgPerLiter;
      breakdown['machinery_diesel'] = {
        kg_co2e: roundTo(machDieselKg, 2),
        t_co2e: roundTo(machDieselKg / 1000, 4),
        scope: 'Scope 1',
        description: `${params.machineryDieselLiters} L × 0.038 GJ/L × 74.1 kg CO2/GJ`,
      };
      methodologies.push(`Machinery Diesel: ${params.machineryDieselLiters} L × 2.8158 kg CO2e/L [Ref: IPCC 2006 Vol 2 Energy]`);
      totalKg += machDieselKg;
    }
  } else if (isCorporate) {
    // 1. Scope 1 Stationary & Mobile Fuels
    if (params.dieselLiters > 0) {
      const dslKg = params.dieselLiters * FUEL_FACTORS.diesel.efKgPerUnit;
      breakdown['stationary_diesel'] = {
        kg_co2e: roundTo(dslKg, 2),
        t_co2e: roundTo(dslKg / 1000, 4),
        scope: 'Scope 1',
        description: `${params.dieselLiters} L Diesel × ${FUEL_FACTORS.diesel.efKgPerUnit} kg CO2e/L`,
      };
      totalKg += dslKg;
    }

    if (params.naturalGasM3 > 0) {
      const ngKg = params.naturalGasM3 * FUEL_FACTORS.natural_gas.efKgPerUnit;
      breakdown['natural_gas'] = {
        kg_co2e: roundTo(ngKg, 2),
        t_co2e: roundTo(ngKg / 1000, 4),
        scope: 'Scope 1',
        description: `${params.naturalGasM3} m³ Gas × ${FUEL_FACTORS.natural_gas.efKgPerUnit} kg CO2e/m³`,
      };
      totalKg += ngKg;
    }

    // 2. Fugitive Refrigerants
    if (params.r410aKg > 0) {
      const r410Kg = params.r410aKg * REFRIGERANT_GWP.r410a;
      breakdown['fugitive_r410a'] = {
        kg_co2e: roundTo(r410Kg, 2),
        t_co2e: roundTo(r410Kg / 1000, 4),
        scope: 'Scope 1',
        description: `${params.r410aKg} kg R-410A × ${REFRIGERANT_GWP.r410a} GWP`,
      };
      totalKg += r410Kg;
    }

    // 3. Scope 2 Grid Electricity (Market-Based with Green PPA deduction)
    if (params.gridElectricityMwh > 0) {
      const residualMwh = Math.max(0, params.gridElectricityMwh - params.greenPpaMwh);
      const mktKg = residualMwh * 1000 * gridPreset.residualFactorKwh;
      const locKg = params.gridElectricityMwh * 1000 * gridPreset.emissionFactorKwh;
      breakdown['grid_electricity_market'] = {
        kg_co2e: roundTo(mktKg, 2),
        t_co2e: roundTo(mktKg / 1000, 4),
        scope: 'Scope 2',
        description: `(${params.gridElectricityMwh} - ${params.greenPpaMwh} PPA MWh) × 1000 × ${gridPreset.residualFactorKwh} kg/kWh [Location-Based: ${roundTo(locKg / 1000, 2)} t]`,
      };
      methodologies.push(`Scope 2 Market: Residual Mix (${gridPreset.residualFactorKwh} kg/kWh) [Ref: GHG Protocol Scope 2 Guidance 2015]`);
      totalKg += mktKg;
    }

    // 4. Scope 3 Freight
    if (params.freightTkm > 0) {
      const freightKg = params.freightTkm * FREIGHT_FACTORS.truck_heavy.efKgPerTkm;
      breakdown['upstream_freight'] = {
        kg_co2e: roundTo(freightKg, 2),
        t_co2e: roundTo(freightKg / 1000, 4),
        scope: 'Scope 3',
        description: `${params.freightTkm} tkm × ${FREIGHT_FACTORS.truck_heavy.efKgPerTkm} kg CO2e/tkm`,
      };
      totalKg += freightKg;
    }

    // 5. Scope 3 Procurement Spend
    if (params.spendUsd > 0) {
      const sectorFactor = EEIO_FACTORS[params.spendSector] || EEIO_FACTORS.software_cloud;
      const spendKg = params.spendUsd * sectorFactor.efKgPerUsd;
      breakdown['procurement_spend'] = {
        kg_co2e: roundTo(spendKg, 2),
        t_co2e: roundTo(spendKg / 1000, 4),
        scope: 'Scope 3',
        description: `$${params.spendUsd} × ${sectorFactor.efKgPerUsd} kg CO2e/$ (${sectorFactor.label})`,
      };
      totalKg += spendKg;
    }

    // 6. GSF SCI Cloud Workloads
    if (params.vcpuHours > 0 || params.ramGbHours > 0) {
      const opKwh = (params.vcpuHours * GSF_SCI_FACTORS.vCpuPowerKw + params.ramGbHours * GSF_SCI_FACTORS.ramPowerKwPerGb) * params.pue;
      const opKg = opKwh * gridPreset.emissionFactorKwh;
      const embKg = params.vcpuHours * GSF_SCI_FACTORS.embodiedVcpuHourKg;
      const sciTotalKg = opKg + embKg;
      breakdown['gsf_sci_cloud'] = {
        kg_co2e: roundTo(sciTotalKg, 2),
        t_co2e: roundTo(sciTotalKg / 1000, 4),
        scope: 'Scope 3',
        description: `${roundTo(opKwh, 1)} kWh @ ${gridPreset.emissionFactorKwh} kg/kWh + ${roundTo(embKg, 1)} kg embodied carbon`,
      };
      totalKg += sciTotalKg;
    }
  }

  // Recommended Carbon Offset Registry based on archetype
  let recommendedRegistry = 'Gold Standard';
  let registryDetails = 'Gold Standard for the Global Goals (GS4GG) micro-scale verified credits.';

  if (isFarmer) {
    recommendedRegistry = 'Verra';
    registryDetails = 'Verra Verified Carbon Standard (VCS) Methodology VM0042 (Improved Agricultural Land Management / Alternate Wetting & Drying).';
  } else if (isCorporate) {
    recommendedRegistry = 'BEE ICM';
    registryDetails = 'Bureau of Energy Efficiency (BEE) India Carbon Market (ICM) / Carbon Credit Trading Scheme (CCTS) compliance units.';
  }

  const totalTons = roundTo(totalKg / 1000, 4);
  const creditsNeeded = Math.ceil(totalTons);

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
