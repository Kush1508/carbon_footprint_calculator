import React from 'react';
import App from '@/App';
import Link from 'next/link';
import {
  ShieldCheck,
  FileCode2,
  Terminal,
  BookOpen,
  ArrowRight,
  Database,
  Calculator,
  Cpu,
  Layers,
  Scale,
  ExternalLink,
} from 'lucide-react';

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'CLIMATE-LEDGER™ — Institutional Carbon Accounting & Credit Readiness Calculator',
  url: 'https://carbonfootprintcalculator-two.vercel.app',
  description:
    'Audit-grade, high-precision carbon accounting platform supporting Households, Farmers (IPCC Tier 1 AFOLU), and Corporate Entities (GHG Protocol Scopes 1, 2, 3 and GSF SCI). Validated for programmatic AI agent integration via REST API.',
  applicationCategory: 'BusinessApplication, ClimateFinTech',
  operatingSystem: 'All Modern Browsers',
  offers: {
    '@type': 'Offer',
    price: '0.00',
    priceCurrency: 'USD',
  },
  featureList: [
    'Household Electricity, Water, Waste, and Mobility Carbon Tracking',
    'IPCC Tier 1 Agricultural Enteric Fermentation and N2O Soil Emissions',
    'Flooded Paddy Rice Methane Accounting with Water Management Factors',
    'Dual-Track Scope 2 Location-Based vs Market-Based Renewable PPA Allocation',
    'Scope 3 USEEIO v2.0 Spend-Based Procurement and Tonne-Kilometer Logistics',
    'Green Software Foundation SCI ISO 21031 Cloud Compute Intensity',
    'Persefoni-Grade Slide-Over Audit Ledger Lineage and Tracing',
    'Automated Offset Credit Recommendations (Verra VCS, Gold Standard, BEE ICM)',
    'REST API and OpenAPI 3.1.0 Endpoint for LLM Agents and Automation',
  ],
};

const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does Climate-Ledger calculate agricultural emissions according to IPCC Tier 1?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Agricultural emissions follow the 2019 Refinement to the 2006 IPCC Guidelines for National Greenhouse Gas Inventories (Volume 4: AFOLU). Enteric fermentation calculates methane using species-specific annual emission factors (e.g., 68 kg CH4/head/yr for dairy cattle, 47 for beef cattle, 55 for buffalo) scaled by IPCC AR6 GWP100 of 27.2. Synthetic fertilizer computes direct soil N2O emissions using active nitrogen fractions (46% for urea) multiplied by the IPCC EF1 factor (0.01 kg N2O-N/kg N), stoichiometric conversion (44/28), and GWP100 of 273. Flooded rice uses baseline emission rates (1.30 kg CH4/ha/day) scaled by cultivation duration and water regime scaling factors (1.0 for continuous flooding, 0.71 for single aeration, 0.52 for alternate wetting and drying).',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between Scope 2 Location-Based and Market-Based accounting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Under the GHG Protocol Scope 2 Guidance, Location-Based accounting quantifies emissions based on the average greenhouse gas intensity of the regional grid where energy consumption occurs (e.g., India CEA v19 at 0.716 kg CO2e/kWh, US eGRID at 0.386 kg CO2e/kWh). Market-Based accounting reflects contractual decisions, allowing organizations to apply supplier-specific emission rates and contractual instruments such as Power Purchase Agreements (PPAs) and Guarantees of Origin (GOs / EACs), which carry a zero-carbon emission factor for verified bundled generation.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do autonomous AI agents (ChatGPT, Gemini, Claude, Perplexity) integrate with Climate-Ledger?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI agents can discover platform capabilities through /llms.txt (a standardized LLM context document under 100 lines) and /openapi.json (OpenAPI 3.1.0 specification). Agents can execute real-time calculations programmatically by making HTTP GET or POST requests to /api/calculate, passing archetype parameters (such as electricity kWh, cattle headcount, fertilizer mass, or procurement spend), and receiving audit-grade JSON responses complete with metric tonnes CO2e, per-activity scope breakdowns, and registry credit recommendations.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which official emission factor databases are incorporated into Climate-Ledger?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Climate-Ledger incorporates statutory emission factor baselines from Central Electricity Authority (India CEA CO2 Database Version 19, 2023-24), US EPA eGRID (2022 US Average), European Association of Issuing Bodies (AIB 2022 Residual Mix), UK Department for Energy Security and Net Zero (DESNZ / DEFRA 2023), IPCC Sixth Assessment Report (AR6 100-year GWPs), and US EPA USEEIO v2.0 input-output procurement matrices.',
      },
    },
    {
      '@type': 'Question',
      name: 'How are certified carbon offset credits calculated and allocated to registries?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Credit requirements are determined by taking the mathematical ceiling of total net emissions in metric tonnes (1 credit = 1 metric tonne of CO2 equivalent removed or avoided). The platform routes entities to appropriate certification registries based on geography and activity profile: BEE India Carbon Market (ICM CCTS 2023) for Indian industrial and power entities, Verra Verified Carbon Standard (VCS) for agriculture and forestry (AFOLU/VM0042) and global industrial projects, and Gold Standard for household energy access and domestic renewable interventions.',
      },
    },
  ],
};

export default function Page() {
  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />

      {/* Interactive Client-Side Calculator Application */}
      <App />

      {/* Semantic Server-Side Rendered Content for AI Agents & Search Engines */}
      <section
        id="methodology-and-audit"
        className="border-t border-zinc-200 bg-white py-12 sm:py-16 text-zinc-900"
        aria-label="Accounting Methodology, Statutory Emission Factors, and AI Agent Documentation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header Banner */}
          <div className="border-b border-zinc-200 pb-8 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Audit-Grade Carbon Accounting Methodology & Programmatic Reference
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-3">
              CLIMATE-LEDGER™ Technical Methodology & Statutory Standard Reference
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 max-w-4xl leading-relaxed">
              Every emission figure computed on this platform adheres to statutory carbon accounting
              frameworks: the <strong>GHG Protocol Corporate Standard</strong>, <strong>ISO 14064-1:2018</strong>,
              the <strong>2019 Refinement to the 2006 IPCC Guidelines for National Greenhouse Gas Inventories (AFOLU Tier 1)</strong>,
              and the <strong>Green Software Foundation Software Carbon Intensity (GSF SCI / ISO 21031)</strong>.
              All models are accessible programmatically to autonomous AI agents via our OpenAPI 3.1.0 interface.
            </p>
          </div>

          {/* AI Agent Quick Integration Box */}
          <div className="bg-zinc-900 text-white rounded-xl p-5 sm:p-7 mb-12 shadow-sm border border-zinc-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-700/50 rounded-lg text-emerald-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Autonomous AI Agent & LLM Tool-Calling Integration
                  </h2>
                  <p className="text-xs text-zinc-400">
                    ChatGPT, Claude, Gemini, and Perplexity can execute carbon accounting via REST API
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/llms.txt"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs font-mono text-emerald-400 transition"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  /llms.txt
                </Link>
                <Link
                  href="/openapi.json"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs font-mono text-sky-400 transition"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  /openapi.json
                </Link>
                <Link
                  href="/api/calculate?role=individual&kwh=450"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded text-xs font-mono text-white transition"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  GET /api/calculate
                </Link>
              </div>
            </div>

            <div className="bg-black/50 p-3.5 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto">
              <span className="text-zinc-500"># Programmatic curl execution for AI agents:</span>
              <br />
              <span className="text-emerald-400">curl</span> -X POST https://carbonfootprintcalculator-two.vercel.app/api/calculate \
              <br />
              &nbsp;&nbsp;-H <span className="text-amber-300">&quot;Content-Type: application/json&quot;</span> \
              <br />
              &nbsp;&nbsp;-d <span className="text-sky-300">&apos;{`{"role":"farmer","grid":"india_cea","dairyCattle":35,"fertilizerKg":2500,"paddyHectares":12}`}&apos;</span>
            </div>
          </div>

          {/* Three Detailed Methodology Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Household Column */}
            <article className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-emerald-100 rounded text-emerald-800">
                  <Database className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-zinc-900">
                  1. Household & Municipal Accounting
                </h2>
              </div>
              <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
                Applies utility-grade emission coefficients to domestic electricity, clean municipal water,
                centralized wastewater treatment, and solid waste pathways.
              </p>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="bg-white p-2.5 rounded border border-zinc-200">
                  <div className="font-semibold text-zinc-800 mb-1">Electricity (Scope 2):</div>
                  <div className="text-zinc-600">E = Monthly_kWh × EF_grid × 12</div>
                  <div className="text-[10px] text-zinc-400 mt-1">India CEA: 0.716 kg/kWh | US eGRID: 0.386 kg/kWh</div>
                </div>

                <div className="bg-white p-2.5 rounded border border-zinc-200">
                  <div className="font-semibold text-zinc-800 mb-1">Domestic Water Supply & Sewage:</div>
                  <div className="text-zinc-600">E = m³ × (0.344 + 0.708) kg CO2e/m³</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Pumping energy + aerobic wastewater digestion</div>
                </div>

                <div className="bg-white p-2.5 rounded border border-zinc-200">
                  <div className="font-semibold text-zinc-800 mb-1">Municipal Solid Waste:</div>
                  <div className="text-zinc-600">E = Weekly_kg × 52 × EF_route</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Landfill: 0.586 | Compost: 0.102 | Recycled: 0.021</div>
                </div>
              </div>
            </article>

            {/* Agriculture Column */}
            <article className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-amber-100 rounded text-amber-800">
                  <Calculator className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-zinc-900">
                  2. IPCC AFOLU Tier 1 Agriculture
                </h2>
              </div>
              <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
                Implements official IPCC 2019 Refinement equations for ruminant enteric fermentation,
                direct soil N2O synthetic nitrogen, and flooded rice cultivation.
              </p>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="bg-white p-2.5 rounded border border-zinc-200">
                  <div className="font-semibold text-zinc-800 mb-1">Enteric Fermentation (CH4):</div>
                  <div className="text-zinc-600">E = Headcount × EF_enteric × 27.2</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Dairy: 68 kg/yr | Beef: 47 | Buffalo: 55 | Sheep: 5</div>
                </div>

                <div className="bg-white p-2.5 rounded border border-zinc-200">
                  <div className="font-semibold text-zinc-800 mb-1">Soil Direct N2O Emissions:</div>
                  <div className="text-zinc-600">E = Mass_N × 0.01 × (44/28) × 273</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Urea: 46% N | DAP: 18% N | IPCC EF1 = 1.0%</div>
                </div>

                <div className="bg-white p-2.5 rounded border border-zinc-200">
                  <div className="font-semibold text-zinc-800 mb-1">Flooded Rice Cultivation (CH4):</div>
                  <div className="text-zinc-600">E = Ha × Days × 1.30 × SF_w × 27.2</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Continuous: 1.0 | Single Aeration: 0.71 | AWD: 0.52</div>
                </div>
              </div>
            </article>

            {/* Corporate Column */}
            <article className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-sky-100 rounded text-sky-800">
                  <Cpu className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-zinc-900">
                  3. Corporate Scopes 1-3 & GSF SCI
                </h2>
              </div>
              <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
                Full dual-track Scope 2 market/location accounting, USEEIO spend-based procurement,
                freight tonne-kilometers, and ISO 21031 cloud compute intensity.
              </p>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="bg-white p-2.5 rounded border border-zinc-200">
                  <div className="font-semibold text-zinc-800 mb-1">Dual-Track Scope 2 Market-Based:</div>
                  <div className="text-zinc-600">E = (Grid_MWh - PPA_MWh) × 1000 × EF</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Bundled renewable PPAs zero out market intensity</div>
                </div>

                <div className="bg-white p-2.5 rounded border border-zinc-200">
                  <div className="font-semibold text-zinc-800 mb-1">Scope 3 Spend-Based (USEEIO):</div>
                  <div className="text-zinc-600">E = Spend_USD × EEIO_factor</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Cloud/SaaS: 0.142 kg/$ | IT Hardware: 0.320 kg/$</div>
                </div>

                <div className="bg-white p-2.5 rounded border border-zinc-200">
                  <div className="font-semibold text-zinc-800 mb-1">Green Software Foundation SCI:</div>
                  <div className="text-zinc-600">E = (vCPU×0.012kW + RAM×0.0003kW) × PUE × EF</div>
                  <div className="text-[10px] text-zinc-400 mt-1">SCI = (E + M) / Functional Unit [ISO 21031]</div>
                </div>
              </div>
            </article>
          </div>

          {/* Statutory Grid Baselines Table */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden mb-12">
            <div className="bg-zinc-100/80 px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-700" />
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  Statutory Grid Electricity Emission Factor Presets (2023-2024 Baselines)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Unit: kg CO2e / kWh</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Region / Grid Preset</th>
                    <th className="py-2.5 px-4">Statutory Authority</th>
                    <th className="py-2.5 px-4">Emission Factor</th>
                    <th className="py-2.5 px-4">Generation Profile</th>
                    <th className="py-2.5 px-4">Standard Alignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono text-[11px] text-zinc-700">
                  <tr className="hover:bg-zinc-50/50">
                    <td className="py-2.5 px-4 font-sans font-semibold text-zinc-900">India (National Grid)</td>
                    <td className="py-2.5 px-4 font-sans text-zinc-600">Central Electricity Authority (CEA v19)</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">0.716 kg CO2e / kWh</td>
                    <td className="py-2.5 px-4 font-sans text-zinc-500">Thermal dominant (~73% coal + lignite)</td>
                    <td className="py-2.5 px-4 font-sans">BRSR Core / BEE CCTS</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/50">
                    <td className="py-2.5 px-4 font-sans font-semibold text-zinc-900">United States (National Average)</td>
                    <td className="py-2.5 px-4 font-sans text-zinc-600">US EPA eGRID (2022 dataset)</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">0.386 kg CO2e / kWh</td>
                    <td className="py-2.5 px-4 font-sans text-zinc-500">Natural gas + nuclear + renewables</td>
                    <td className="py-2.5 px-4 font-sans">US SEC Climate / GHG Protocol</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/50">
                    <td className="py-2.5 px-4 font-sans font-semibold text-zinc-900">European Union (Residual Mix)</td>
                    <td className="py-2.5 px-4 font-sans text-zinc-600">Association of Issuing Bodies (AIB 2022)</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">0.255 kg CO2e / kWh</td>
                    <td className="py-2.5 px-4 font-sans text-zinc-500">Residual unbundled supplier mix</td>
                    <td className="py-2.5 px-4 font-sans">EU CSRD / ESRS E1</td>
                  </tr>
                  <tr className="hover:bg-zinc-50/50">
                    <td className="py-2.5 px-4 font-sans font-semibold text-zinc-900">United Kingdom (DESNZ / DEFRA)</td>
                    <td className="py-2.5 px-4 font-sans text-zinc-600">DESNZ / DEFRA Conversion Factors 2023</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">0.207 kg CO2e / kWh</td>
                    <td className="py-2.5 px-4 font-sans text-zinc-500">Offshore wind + gas + nuclear</td>
                    <td className="py-2.5 px-4 font-sans">UK SECR / TCFD</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Certified Offset Registries */}
          <div className="border border-zinc-200 rounded-xl p-5 sm:p-6 mb-12 bg-zinc-50/30">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-emerald-800" />
              <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                Verified Offset Registries & Credit Readiness Allocation
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 mb-6 leading-relaxed">
              When our engine calculates emissions, it rounds the final footprint up to the nearest ceiling integer
              to determine required verified 1-tonne carbon credits. Based on the selected archetype and geographic
              domain, entities are paired with the governing standard registry:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-zinc-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xs text-zinc-900">BEE India Carbon Market (ICM)</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">National</span>
                </div>
                <p className="text-[11px] text-zinc-600 mb-3">
                  Statutory framework established by Bureau of Energy Efficiency under the Carbon Credit Trading Scheme (CCTS 2023)
                  for Indian industrial obligated entities and domestic clean technology deployment.
                </p>
                <div className="text-[10px] text-zinc-500 font-mono">Standard: BEE CCTS / PAT Scheme</div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xs text-zinc-900">Verra Verified Carbon Standard</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">Global</span>
                </div>
                <p className="text-[11px] text-zinc-600 mb-3">
                  World-leading voluntary carbon market standard for agricultural soil carbon enhancement (VM0042),
                  improved livestock management, and nature-based reforestation offsets.
                </p>
                <div className="text-[10px] text-zinc-500 font-mono">Standard: Verra VCS AFOLU</div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xs text-zinc-900">Gold Standard for Global Goals</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">High Impact</span>
                </div>
                <p className="text-[11px] text-zinc-600 mb-3">
                  Pioneered by WWF to ensure carbon credits deliver quantifiable progress toward the UN Sustainable
                  Development Goals, clean cookstove initiatives, and community solar installations.
                </p>
                <div className="text-[10px] text-zinc-500 font-mono">Standard: GS4GG Certified SDG Impact</div>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions (FAQ) Section */}
          <div className="border border-zinc-200 rounded-xl p-5 sm:p-8 bg-white">
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Frequently Asked Accounting Questions</h2>
            <p className="text-xs sm:text-sm text-zinc-500 mb-6">
              Core statutory answers crawled by Google and conversational AI agents.
            </p>

            <div className="space-y-4">
              {faqPageSchema.mainEntity.map((faq, index) => (
                <details
                  key={index}
                  className="group border border-zinc-200 rounded-lg p-4 open:bg-zinc-50/50 transition"
                  open={index === 0}
                >
                  <summary className="font-semibold text-sm text-zinc-900 cursor-pointer flex items-center justify-between list-none">
                    <span>{faq.name}</span>
                    <span className="text-zinc-400 group-open:rotate-90 transition-transform ml-2">▸</span>
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm text-zinc-600 leading-relaxed pt-2 border-t border-zinc-200/60">
                    {faq.acceptedAnswer.text}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
