# CLIMATE-LEDGER™ — Institutional Carbon Accounting & GHG Protocol Audit Suite

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel_Production-0F3A2E?style=for-the-badge&logo=vercel)](https://carbonfootprintcalculator-two.vercel.app)
[![Compliance](https://img.shields.io/badge/Compliance-ISO_14064--1_%26_GHG_Protocol-10B981?style=for-the-badge)](https://carbonfootprintcalculator-two.vercel.app)
[![GWP Standard](https://img.shields.io/badge/GWP_Metric-IPCC_AR6_(100--Year)-6366F1?style=for-the-badge)](https://carbonfootprintcalculator-two.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-334155?style=for-the-badge)](LICENSE)

An audit-grade, high-precision carbon accounting web platform modeled directly on **Watershed Climate**, **Persefoni**, and **Stripe Climate**. Designed for institutional ESG disclosures, carbon audits, and dual-track Scope 2 reporting.

🌐 **Live Application**: [https://carbonfootprintcalculator-two.vercel.app](https://carbonfootprintcalculator-two.vercel.app)

---

## 🏛️ Supported User Archetypes

### 1. Residential Households
* **Grid Electricity**: Regional grid emission factors ($E_{\text{elec}} = \text{kWh} \times \text{EF}_{\text{grid}}$).
* **Domestic Water & Wastewater**: Cradle-to-tap potable supply ($0.28\text{ kg/m}^3$) and municipal wastewater treatment ($0.57\text{ kg/m}^3$) per *Venkatesh & Brattebø (2011), Water Research*.
* **Municipal Solid Waste**: IPCC Vol 5 First-Order Decay model across Mixed Landfill ($0.52\text{ kg/kg}$), Segregated Composting ($0.10\text{ kg/kg}$), and Recycling ($0.04\text{ kg/kg}$).
* **Equivalents**: Mature tree absorption offsets ($21.77\text{ kg CO}_2/\text{yr}$), displaced gallons of gasoline, and regional benchmark comparison deltas.

### 2. Agriculture & Farm (IPCC Tier 1 AFOLU)
* **Enteric Fermentation**: Dynamic livestock batch repeater (Dairy Cattle, Beef Bovine, Buffalo, Sheep/Goats, Swine) using IPCC 2019 Refinement coefficients scaled by IPCC AR6 100-year $\text{GWP}_{\text{CH}_4} = 28$.
* **Soil Nitrous Oxide ($\text{N}_2\text{O}$)**: Automated stoichiometric elemental nitrogen assay conversion for commercial fertilizers (Urea 46% N, DAP 18% N, Ammonium Nitrate 34% N, NPK 20-20-20) plus organic manure:
  $$E_{\text{soil}} = (N_{\text{synth}} + N_{\text{org}}) \times 0.01 \times \frac{44}{28} \times 273$$
* **Paddy Rice Cultivation**: Tier 1 baseline ($1.30\text{ kg CH}_4/\text{ha/day}$) modulated by water regime scaling factors ($\text{SF}_w$):
  * Continuously Flooded ($\text{SF}_w = 1.00$)
  * Single Aeration Mid-Season ($\text{SF}_w = 0.71$)
  * Alternate Wetting & Drying - AWD ($\text{SF}_w = 0.48$ — 52% methane reduction)
* **Mobile Machinery & Pumps**: Net calorific combustion of diesel ($0.038\text{ GJ/L} \times 74.1\text{ kg CO}_2/\text{GJ} = 2.8158\text{ kg CO}_2\text{e/L}$).

### 3. Corporate & Industrial Entities (GHG Protocol Scopes 1, 2, 3)
* **Scope 1 Direct Combustion & Fugitive Gases**:
  * Stationary/mobile fuels: Diesel, Natural Gas, LPG, Petrol.
  * Fugitive Refrigerant leak tracking with IPCC AR6 100-yr GWPs: R-410A ($2,256$), R-134a ($1,530$), R-32 ($771$), R-404A ($4,728$).
* **Scope 2 Dual-Track Reporting Ledger**: Side-by-side compliance reporting:
  * **Location-Based Method**: $\text{Total MWh} \times 1,000 \times \text{EF}_{\text{grid}}$
  * **Market-Based Method**: $(\text{Total MWh} - \text{Contracted Green PPA MWh}) \times 1,000 \times \text{EF}_{\text{residual}}$
* **Scope 3 Upstream Freight (Category 4)**: GLEC Framework v3.0 / EN 16258 tonne-kilometre ($t\cdot\text{km}$) routing for Heavy Duty Trucks, Freight Rail, Air Cargo, and Container Ships.
* **Scope 3 Procurement Spend (Category 1)**: USEEIO v2.0 economic input-output factoring across IT Hardware, Software & Cloud, Professional Services, Machinery, Chemicals, and Construction.
* **Green Software Foundation SCI (ISO 21031)**:
  $$E_{\text{cloud}} = ((\text{vCPU}_{\text{hrs}} \times 0.012\text{ kW}) + (\text{RAM}_{\text{hrs}} \times 0.000392\text{ kW})) \times \text{PUE} \times \text{EF}_{\text{grid}} + \text{Embodied}_{\text{Hardware}}$$
  Includes developer workstation hardware amortization ($120\text{ kg CO}_2\text{e/station/yr}$).

---

## 🔍 Persefoni Audit Slide-Over Drawer

Every metric and row includes a **"Trace"** or **"Audit Ledger"** micro-action that opens a slide-over audit drawer displaying:
- Exact LaTeX mathematical equation
- Substituted arithmetic ledger calculation
- Primary citation & protocol standard (GHG Protocol, IPCC, USEEIO, GSF)
- IPCC AR6 100-year Global Warming Potential (GWP) factor
- 95% Confidence Interval uncertainty bounds (e.g., $\pm 4.0\%$)
- One-click structured JSON ledger export for third-party certifiers

---

## 📄 ISO 14064-1:2018 Verification Statement Generator

Includes a modal engine generating a formal GHG Inventory Audit Statement with lead auditor attestation blocks, full Scope 1/2/3 summary tables, itemized verification ledgers, and one-click PDF printing or JSON export.

---

## 🛠️ Tech Stack & Architecture

- **Core Engine**: Pure functional TypeScript calculation engine (`/src/engine/calculatorEngine.ts`) with zero UI dependencies and defensive input coercion (`safeNum()`).
- **Frontend Framework**: React 19 + TypeScript + Vite.
- **Styling & Design System**: Tailwind CSS with institutional design tokens (`#F9FAFB` zinc-50 shell, deep spruce `#0F3A2E`, slate Scope 1, indigo Scope 2, amber Scope 3, emerald removals).
- **Data Visualizations**: Recharts styled with institutional palettes.
- **Icons**: Lucide React with uniform `1.5` stroke width.

---

## 🚀 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/Kush1508/carbon_footprint_calculator.git
cd carbon_footprint_calculator

# Install dependencies
npm install

# Start development server
npm run dev

# Run production build & type checks
npm run build
```

---

## 📜 Compliance Standards

- **GHG Protocol**: Corporate Accounting and Reporting Standard
- **GHG Protocol**: Scope 2 Guidance (2015 Amendment)
- **ISO 14064-1:2018**: Quantification and Reporting of Greenhouse Gas Emissions
- **IPCC 2006 / 2019 Refinement**: Guidelines for National GHG Inventories (Vol 4 AFOLU & Vol 5 Waste)
- **IPCC AR6**: Sixth Assessment Report 100-Year Global Warming Potentials
- **GSF SCI v1.0 / ISO 21031**: Software Carbon Intensity Standard
