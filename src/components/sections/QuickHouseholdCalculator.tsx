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
  Sparkles,
  Printer,
  Globe,
  Info,
  Scale,
  DollarSign,
  HeartHandshake,
  Check,
  Loader2,
} from 'lucide-react';
import { REGIONAL_GRID_PRESETS } from '../../engine/factors';
import { RegionalGridKey } from '../../types';

interface QuickHouseholdCalculatorProps {
  onSwitchToAudit?: () => void;
}

export function QuickHouseholdCalculator({ onSwitchToAudit }: QuickHouseholdCalculatorProps) {
  // 4 Zero-Jargon Sliders
  const [electricityKwh, setElectricityKwh] = useState<number>(300);
  const [gridKey, setGridKey] = useState<RegionalGridKey>('india_cea');
  const [lpgCylinders, setLpgCylinders] = useState<number>(1); // cylinders/month (14.2 kg each)
  const [commuteKmWeek, setCommuteKmWeek] = useState<number>(75);
  const [commuteMode, setCommuteMode] = useState<'petrol_car' | 'two_wheeler' | 'metro_bus' | 'ev'>('two_wheeler');
  const [shortHaulFlights, setShortHaulFlights] = useState<number>(1);
  const [longHaulFlights, setLongHaulFlights] = useState<number>(0);

  // Retirement Flow State
  const [selectedProjectId, setSelectedProjectId] = useState<'india_renewables' | 'verra_vm0042_soil' | 'gold_standard_cookstoves'>('india_renewables');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('My Household');
  const [isRetiring, setIsRetiring] = useState<boolean>(false);
  const [retirementQuote, setRetirementQuote] = useState<any | null>(null);

  // Grid factor
  const gridPreset = REGIONAL_GRID_PRESETS[gridKey] || REGIONAL_GRID_PRESETS.india_cea;
  const gridEf = gridPreset.emissionFactorKwh;

  // Real-time calculation
  const footprint = useMemo(() => {
    // 1. Electricity: kWh * factor * 12 / 1000
    const electricityTco2e = (electricityKwh * gridEf * 12) / 1000;

    // 2. Cooking Gas: 1 cylinder = 14.2 kg * 2.983 kg CO2e/kg = 42.3586 kg
    const lpgTco2e = (lpgCylinders * 14.2 * 2.983 * 12) / 1000;

    // 3. Commute factors (kg CO2e / km)
    const commuteFactors = {
      petrol_car: 0.170,
      two_wheeler: 0.048,
      metro_bus: 0.035,
      ev: 0.025,
    };
    const commuteEf = commuteFactors[commuteMode] || 0.048;
    const commuteTco2e = (commuteKmWeek * 52 * commuteEf) / 1000;

    // 4. Flights: Short-haul ~0.35 tCO2e roundtrip, Long-haul ~1.45 tCO2e
    const flightsTco2e = shortHaulFlights * 0.35 + longHaulFlights * 1.45;

    const totalTco2e = electricityTco2e + lpgTco2e + commuteTco2e + flightsTco2e;
    const creditsNeeded = Math.ceil(totalTco2e);

    // Benchmarks
    const nationalAverage = gridKey === 'india_cea' ? 1.9 : gridKey === 'us_egrid' ? 14.9 : gridKey === 'uk_desnz' ? 5.2 : 6.8;
    const pctOfAverage = Math.round((totalTco2e / nationalAverage) * 100);

    return {
      electricityTco2e,
      lpgTco2e,
      commuteTco2e,
      flightsTco2e,
      totalTco2e,
      creditsNeeded,
      nationalAverage,
      pctOfAverage,
    };
  }, [electricityKwh, gridEf, lpgCylinders, commuteKmWeek, commuteMode, shortHaulFlights, longHaulFlights, gridKey]);

  // Handle live quote preview
  const handleGetRetirementQuote = async () => {
    setIsRetiring(true);
    try {
      const res = await fetch('/api/retire-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tco2e: footprint.totalTco2e,
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
      {/* 4 Simple Sliders + Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 4 Frictionless Sliders */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-bold block">
                Zero-Jargon Consumer Estimator
              </span>
              <h2 className="text-lg font-bold text-zinc-950">
                Your Monthly Household Lifestyle
              </h2>
            </div>

            {/* Grid Preset Switcher */}
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs">
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

          {/* Slider 1: Electricity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-semibold text-zinc-900">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Monthly Electricity Consumption</span>
              </div>
              <span className="font-mono font-bold text-zinc-900 text-sm bg-zinc-100 px-2 py-0.5 rounded">
                {electricityKwh} kWh / month
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={1500}
              step={25}
              value={electricityKwh}
              onChange={(e) => setElectricityKwh(Number(e.target.value))}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>50 kWh (Small Apt)</span>
              <span>300 kWh (Avg Family)</span>
              <span>1500 kWh (Heavy AC/Villa)</span>
            </div>
          </div>

          {/* Slider 2: Cooking Gas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-semibold text-zinc-900">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Cooking Gas (LPG Cylinders)</span>
              </div>
              <span className="font-mono font-bold text-zinc-900 text-sm bg-zinc-100 px-2 py-0.5 rounded">
                {lpgCylinders} cylinder{lpgCylinders !== 1 ? 's' : ''} / month
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={4}
              step={0.5}
              value={lpgCylinders}
              onChange={(e) => setLpgCylinders(Number(e.target.value))}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>0 (Induction/PNG)</span>
              <span>1 Cylinder (14.2 kg standard)</span>
              <span>4 Cylinders</span>
            </div>
          </div>

          {/* Slider 3: Weekly Commute */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-semibold text-zinc-900">
                <Car className="w-4 h-4 text-blue-500" />
                <span>Weekly Commute Distance</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={commuteMode}
                  onChange={(e) => setCommuteMode(e.target.value as any)}
                  className="bg-zinc-100 border border-zinc-200 rounded px-2 py-1 text-xs font-medium text-zinc-800"
                >
                  <option value="two_wheeler">Motorcycle / Scooter</option>
                  <option value="petrol_car">Petrol / Diesel Car</option>
                  <option value="ev">Electric Vehicle (EV)</option>
                  <option value="metro_bus">Metro / Public Bus</option>
                </select>
                <span className="font-mono font-bold text-zinc-900 text-sm bg-zinc-100 px-2 py-0.5 rounded">
                  {commuteKmWeek} km/wk
                </span>
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
              <span>0 (Remote / Walk)</span>
              <span>75 km / week</span>
              <span>500 km / week</span>
            </div>
          </div>

          {/* Slider 4: Annual Flights */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-semibold text-zinc-900">
                <Plane className="w-4 h-4 text-sky-500" />
                <span>Annual Flights (Round Trips)</span>
              </div>
              <span className="font-mono font-bold text-zinc-900 text-sm bg-zinc-100 px-2 py-0.5 rounded">
                {shortHaulFlights} Short · {longHaulFlights} Long
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">
                  Short-Haul (&lt;3 hrs)
                </label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={shortHaulFlights}
                  onChange={(e) => setShortHaulFlights(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">
                  Long-Haul (&gt;3 hrs)
                </label>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={1}
                  value={longHaulFlights}
                  onChange={(e) => setLongHaulFlights(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Instant Result Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0F3A2E] to-[#0A261E] text-white rounded-2xl p-5 sm:p-7 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-bold">
                  Instant Household Footprint
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300">
                Annual Model
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <span className="text-xs text-emerald-200/80 block">Total Annual Emissions</span>
                <div className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-tight">
                  {footprint.totalTco2e.toFixed(2)}{' '}
                  <span className="text-lg font-normal text-emerald-300">tCO₂e</span>
                </div>
                <span className="text-xs font-mono text-emerald-200/70 mt-1 block">
                  ~{Math.round(footprint.totalTco2e * 1000).toLocaleString()} kg CO₂e / year
                </span>
              </div>

              {/* Benchmark Comparison */}
              <div className="bg-black/30 rounded-xl p-3.5 border border-emerald-800/60 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-200">Vs. National Benchmark:</span>
                  <span className="font-mono font-bold text-white">
                    {footprint.pctOfAverage}% of Avg ({footprint.nationalAverage} t)
                  </span>
                </div>
                <div className="w-full bg-emerald-950 rounded-full h-2 overflow-hidden border border-emerald-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      footprint.pctOfAverage > 100 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, footprint.pctOfAverage)}%` }}
                  />
                </div>
              </div>

              {/* Exact Credits Required */}
              <div className="bg-emerald-950/70 border border-emerald-700/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-300 block uppercase tracking-wide">
                      Exact Offset Credits Needed
                    </span>
                    <span className="text-2xl font-mono font-extrabold text-white">
                      {footprint.creditsNeeded}{' '}
                      <span className="text-xs font-normal text-emerald-300 font-sans">
                        Credits (⌈tCO₂e⌉)
                      </span>
                    </span>
                  </div>
                  <Scale className="w-7 h-7 text-emerald-400 opacity-80" />
                </div>
                <span className="text-[10px] text-emerald-300/80 block mt-1">
                  1 credit = 1 metric tonne of certified permanent carbon avoidance/removal
                </span>
              </div>
            </div>
          </div>

          {/* Switch to Detailed Audit Link */}
          <div className="pt-6 border-t border-emerald-800/80 mt-6">
            {onSwitchToAudit ? (
              <button
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
