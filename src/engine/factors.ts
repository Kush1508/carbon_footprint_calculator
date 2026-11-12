// Master Emission Factor Registry & IPCC AR6 / GHG Protocol Citation Database
import { RegionalGridKey, RegionalGridPreset, FertilizerType, FreightMode, EeioSector, StationaryFuelType, RefrigerantType } from '../types';

export const REGIONAL_GRID_PRESETS: Record<RegionalGridKey, RegionalGridPreset> = {
  india_cea: {
    id: 'india_cea',
    label: 'India CEA (CO₂ Baseline Database v19)',
    country: 'India',
    emissionFactorKwh: 0.720, // kg CO2e / kWh
    residualFactorKwh: 0.810, // residual mix accounting for non-REC grid share
    citation: 'Central Electricity Authority (CEA) of India, CO2 Baseline Database for the Indian Power Sector, User Guide Version 19.0 (2023)',
    sourceAuthority: 'Ministry of Power, Govt. of India / CEA',
    uncertaintyPercent: 4.8,
  },
  us_egrid: {
    id: 'us_egrid',
    label: 'US EPA eGRID (National US Subregion Average)',
    country: 'United States',
    emissionFactorKwh: 0.380, // kg CO2e / kWh
    residualFactorKwh: 0.442, // Green-e residual mix
    citation: 'US Environmental Protection Agency (EPA), Emissions & Generation Resource Integrated Database (eGRID2022, Released Jan 2024)',
    sourceAuthority: 'US EPA / Green-e Residual Mix Database',
    uncertaintyPercent: 3.5,
  },
  eu_residual: {
    id: 'eu_residual',
    label: 'EU-27 AIB European Residual Mix (Location/Residual)',
    country: 'European Union',
    emissionFactorKwh: 0.240, // kg CO2e / kWh average grid
    residualFactorKwh: 0.385, // AIB European Residual Mix
    citation: 'Association of Issuing Bodies (AIB), European Residual Mixes 2022 (V1.0), Published May 2023',
    sourceAuthority: 'AIB / European Energy Certificate System (EECS)',
    uncertaintyPercent: 3.0,
  },
  uk_desnz: {
    id: 'uk_desnz',
    label: 'UK DESNZ / Defra Electricity Factor',
    country: 'United Kingdom',
    emissionFactorKwh: 0.207, // kg CO2e / kWh
    residualFactorKwh: 0.312,
    citation: 'UK Department for Energy Security and Net Zero (DESNZ), Greenhouse Gas Conversion Factors for Company Reporting (2023)',
    sourceAuthority: 'UK DESNZ / Defra',
    uncertaintyPercent: 2.5,
  },
};

// IPCC Sixth Assessment Report (AR6) 100-Year Global Warming Potentials (GWPs)
export const IPCC_AR6_GWP = {
  CO2: 1,
  CH4: 28,      // Biogenic methane (AR6 Table 7.15)
  CH4_fossil: 29.8,
  N2O: 273,     // Nitrous Oxide (AR6 Table 7.15)
  R410A: 2256,  // Refrigerant blend
  R134a: 1530,  // HFC-134a
  R32: 771,     // HFC-32
  R404A: 4728,  // High-GWP blend
};

// Household Water & Waste Factors
export const HOUSEHOLD_FACTORS = {
  // Venkatesh & Brattebø (2011) Water Research; UK Defra 2023 Water Supply and Treatment
  waterSupplyKgPerM3: 0.28,      // kg CO2e / m3 water distributed
  waterTreatmentKgPerM3: 0.57,   // kg CO2e / m3 wastewater treated
  
  // IPCC 2006 Vol 5 Waste Model parameters
  wasteLandfillKgPerKg: 0.52,    // kg CO2e / kg mixed municipal solid waste to landfill
  wasteCompostKgPerKg: 0.10,     // kg CO2e / kg organic composting (aerobic digestion trace CH4/N2O)
  wasteRecyclingKgPerKg: 0.04,   // kg CO2e / kg sorting and mechanical processing
  
  // Benchmark reference baseline: Average household footprint is ~400 kg CO2e/month in mid-tier grid
  householdBenchmarkMonthlyKg: 380,
  treeAnnualAbsorptionKg: 21.77, // mature hardwood absorbs ~48 lbs = 21.77 kg CO2/year (US Forestry Service)
};

// Agriculture & Farm (IPCC Tier 1 AFOLU)
export const AGRICULTURE_FACTORS = {
  // Enteric Fermentation: kg CH4 per head per year [IPCC 2019 Refinement, Vol 4 AFOLU Table 10.11]
  entericMethaneKgPerHeadYear: {
    dairy_cattle: 68.0,
    beef_cattle: 47.0,
    buffalo: 55.0,
    sheep_goats: 5.0,
    swine: 1.5,
  },
  
  // Fertilizer N content fractions: elemental N per kg fertilizer
  fertilizerNitrogenFraction: {
    urea: 0.46,              // 46% N
    dap: 0.18,               // 18% N
    ammonium_nitrate: 0.34,  // 34% N
    npk_20_20_20: 0.20,      // 20% N
    pure_n: 1.00,            // 100% N
  } as Record<FertilizerType, number>,

  // IPCC direct N2O emission factor from managed soils (EF1 = 1% of applied N emitted as N2O-N)
  soilN2O_EF1: 0.01,
  n2oToN2Ratio: 44 / 28, // Stoichiometric conversion from N2O-N to N2O gas

  // Rice Cultivation (Flooded Paddy) Tier 1 baseline: 1.30 kg CH4 / hectare / day
  paddyBaselineMethaneKgPerHaDay: 1.30,
  paddyWaterScalingFactor: {
    continuously_flooded: 1.00,
    single_aeration: 0.71,
    alternate_wetting_drying: 0.48, // AWD reduces methane by over 50%
  },

  // Agricultural Diesel: 0.038 GJ/L net calorific value * 74.1 kg CO2/GJ = 2.8158 kg CO2e/L
  machineryDieselKgPerLiter: 2.8158,
};

// Corporate & Industrial Fuel & Refrigerant Factors
export const FUEL_FACTORS: Record<StationaryFuelType, { ncvMjPerUnit: number; efKgPerMj: number; efKgPerUnit: number; unit: string; citation: string }> = {
  diesel: {
    ncvMjPerUnit: 38.6,
    efKgPerMj: 0.0694,
    efKgPerUnit: 2.68,
    unit: 'Liters',
    citation: '2006 IPCC Guidelines for National Greenhouse Gas Inventories, Vol 2 Energy, Stationary Combustion',
  },
  petrol: {
    ncvMjPerUnit: 34.2,
    efKgPerMj: 0.0675,
    efKgPerUnit: 2.31,
    unit: 'Liters',
    citation: 'IPCC 2006 Vol 2 Energy, Mobile Combustion Table 3.2.1',
  },
  natural_gas: {
    ncvMjPerUnit: 38.3,
    efKgPerMj: 0.0530,
    efKgPerUnit: 2.03,
    unit: 'm³',
    citation: 'API Compendium of GHG Emissions Methodologies for the Oil and Natural Gas Industry (2021)',
  },
  lpg: {
    ncvMjPerUnit: 46.1,
    efKgPerMj: 0.0646,
    efKgPerUnit: 2.98,
    unit: 'kg',
    citation: 'DEFRA 2023 UK Government GHG Conversion Factors for Company Reporting',
  },
};

export const REFRIGERANT_GWP: Record<RefrigerantType, number> = {
  r410a: IPCC_AR6_GWP.R410A,
  r134a: IPCC_AR6_GWP.R134a,
  r32: IPCC_AR6_GWP.R32,
  r404a: IPCC_AR6_GWP.R404A,
};

// Scope 3 Freight Logistics (Category 4 Upstream / Downstream Transportation)
export const FREIGHT_FACTORS: Record<FreightMode, { efKgPerTkm: number; label: string; citation: string }> = {
  truck_heavy: {
    efKgPerTkm: 0.105,
    label: 'Heavy-Duty Articulated Truck (>33t)',
    citation: 'GLEC Framework for Logistics Emissions Accounting v3.0 (2023) / EN 16258',
  },
  rail: {
    efKgPerTkm: 0.028,
    label: 'Freight Rail (Grid Electric / Diesel Intermodal)',
    citation: 'EcoTransIT World / International Union of Railways (UIC) 2023',
  },
  air_cargo: {
    efKgPerTkm: 0.602,
    label: 'Air Cargo Freighter (Long-Haul Dedicated)',
    citation: 'ICAO Carbon Emissions Calculator / UK DESNZ 2023 Air Freight',
  },
  maritime: {
    efKgPerTkm: 0.016,
    label: 'Maritime Container Ship (>8,000 TEU)',
    citation: 'IMO 4th GHG Study 2020 / Clean Cargo Working Group',
  },
};

// Scope 3 Spend-Based EEIO Factors (Category 1 Purchased Goods & Services)
// USEEIO v2.0 Economic Input-Output GHG Intensity in kg CO2e / USD (2021 chained)
export const EEIO_FACTORS: Record<EeioSector, { efKgPerUsd: number; label: string; citation: string }> = {
  it_hardware: {
    efKgPerUsd: 0.34,
    label: 'Electronic Computers & IT Equipment',
    citation: 'US EPA Supply Chain GHG Emission Factors for US Industries (USEEIO v2.0.1)',
  },
  software_cloud: {
    efKgPerUsd: 0.12,
    label: 'Software Publishers & Data Processing Services',
    citation: 'USEEIO v2.0 / Bureau of Economic Analysis Input-Output Commodity 511200',
  },
  professional_services: {
    efKgPerUsd: 0.08,
    label: 'Management, Legal & Engineering Consulting',
    citation: 'USEEIO v2.0 Commodity 541300',
  },
  machinery: {
    efKgPerUsd: 0.52,
    label: 'Industrial Machinery & Mechanical Equipment',
    citation: 'USEEIO v2.0 Commodity 333100',
  },
  chemicals: {
    efKgPerUsd: 0.78,
    label: 'Basic Chemical & Petrochemical Manufacturing',
    citation: 'USEEIO v2.0 Commodity 325100',
  },
  construction: {
    efKgPerUsd: 0.44,
    label: 'Commercial & Institutional Building Construction',
    citation: 'USEEIO v2.0 Commodity 236200',
  },
};

// Green Software Foundation Software Carbon Intensity (GSF SCI v1.0)
export const GSF_SCI_FACTORS = {
  vCpuPowerKw: 0.012,     // 12W average modern cloud vCPU (Ice Lake/Zen 3)
  ramPowerKwPerGb: 0.000392, // 0.392W per GB DDR4/DDR5 server memory
  embodiedCloudServerKgPerYear: 400, // 400 kg CO2e embodied over 4-year server lifetime
  embodiedVcpuHourKg: 0.0018, // Amortized embodied carbon per vCPU-hr allocation
  developerWorkstationAnnualKg: 120, // Modern laptop + dual monitors amortized
  citation: 'Green Software Foundation SCI Specification v1.0 (ISO 21031) & Cloud Carbon Footprint Methodology',
};
