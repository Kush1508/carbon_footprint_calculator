// Types for Carbon Accounting Engine and Institutional ESG Ledger

export type Archetype = 'household' | 'agriculture' | 'corporate';

export type RegionalGridKey = 'india_cea' | 'us_egrid' | 'eu_residual' | 'uk_desnz';

export interface RegionalGridPreset {
  id: RegionalGridKey;
  label: string;
  country: string;
  emissionFactorKwh: number; // kg CO2e per kWh
  residualFactorKwh: number; // kg CO2e per kWh for market-based residual mix
  citation: string;
  sourceAuthority: string;
  uncertaintyPercent: number;
}

export interface AuditRecord {
  id: string;
  archetype: Archetype;
  metricLabel: string;
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3' | 'Direct Household' | 'Agricultural AFOLU';
  category: string;
  formulaLatex: string;
  arithmeticDisplay: string;
  activityAmount: number;
  activityUnit: string;
  factorValue: number;
  factorUnit: string;
  gwpStandard: string; // e.g., "IPCC AR6 (100-yr)"
  citation: string;
  methodologyStandard: string; // e.g., "GHG Protocol Corporate Standard", "IPCC 2006/2019 AFOLU Tier 1"
  uncertaintyConfidence: string; // e.g., "±5% (95% CI)"
  calculatedEmissionsKg: number;
  calculatedEmissionsTons: number;
  notes?: string;
}

// Household Inputs
export interface HouseholdData {
  electricityKwhMonthly: number;
  waterM3Monthly: number;
  hasSewageTreatment: boolean;
  wasteKgWeekly: number;
  wasteRoute: 'landfill' | 'compost' | 'recycling';
}

// Agriculture Inputs
export interface LivestockBatch {
  id: string;
  animalType: 'dairy_cattle' | 'beef_cattle' | 'buffalo' | 'sheep_goats' | 'swine';
  headcount: number;
}

export type FertilizerType = 'urea' | 'dap' | 'ammonium_nitrate' | 'npk_20_20_20' | 'pure_n';

export interface AgricultureData {
  livestock: LivestockBatch[];
  syntheticFertilizerType: FertilizerType;
  syntheticFertilizerGrossKg: number; // gross fertilizer applied
  organicManureN_Kg: number; // kg elemental N from manure
  floodedPaddyHectares: number;
  floodedPaddyDays: number;
  paddyWaterRegime: 'continuously_flooded' | 'single_aeration' | 'alternate_wetting_drying';
  machineryDieselLiters: number;
}

// Corporate & Industrial Inputs
export type StationaryFuelType = 'diesel' | 'natural_gas' | 'lpg' | 'petrol';
export type RefrigerantType = 'r410a' | 'r134a' | 'r32' | 'r404a';

export interface Scope1StationaryItem {
  id: string;
  fuelType: StationaryFuelType;
  volume: number; // Liters or m3
}

export interface Scope1RefrigerantItem {
  id: string;
  refrigerantType: RefrigerantType;
  kgLeaked: number;
}

export type FreightMode = 'truck_heavy' | 'rail' | 'air_cargo' | 'maritime';
export type EeioSector = 'it_hardware' | 'software_cloud' | 'professional_services' | 'machinery' | 'chemicals' | 'construction';

export interface Scope3FreightItem {
  id: string;
  mode: FreightMode;
  massTonnes: number;
  distanceKm: number;
}

export interface Scope3SpendItem {
  id: string;
  sector: EeioSector;
  spendUsd: number;
}

export interface CorporateData {
  // Scope 1
  fuels: Scope1StationaryItem[];
  refrigerants: Scope1RefrigerantItem[];

  // Scope 2 Dual-Track
  gridElectricityMwhAnnual: number;
  contractedGreenPpaMwhAnnual: number;

  // Scope 3
  freightLogs: Scope3FreightItem[];
  procurementSpends: Scope3SpendItem[];

  // Green Software Foundation SCI
  computeVcpuHours: number;
  computeRamGbHours: number;
  datacenterPue: number; // 1.1 to 1.8
  datacenterRegion: RegionalGridKey;
  developerWorkstationsCount: number;
}

// Engine Calculation Output
export interface EngineOutput {
  totalEmissionsTons: number;
  grossEmissionsKg: number;
  scope1Tons: number;
  scope2Tons: number;
  scope2LocationTons: number;
  scope2MarketTons: number;
  scope3Tons: number;
  auditRecords: AuditRecord[];
  breakdownByCategory: { name: string; tons: number; scope: string; color: string }[];
  contextualEquivalents: {
    treesAbsorptionAnnual: number;
    gasolineGallonsEquivalent: number;
    passengerKmEquivalent: number;
    regionalAverageDeltaPercent: number;
  };
}
