import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const retireQuoteSchema = z.object({
  tco2e: z.coerce.number().min(0.001, 'Minimum retirement quantity is 0.001 tCO2e').default(1.0),
  projectId: z.enum(['india_renewables', 'verra_vm0042_soil', 'gold_standard_cookstoves']).default('india_renewables'),
  beneficiaryName: z.string().optional().default('Verified Household'),
  retirementMessage: z.string().optional().default('Carbon Neutrality Commitment'),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Content-Type': 'application/json; charset=utf-8',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const PROJECT_CATALOG = {
  india_renewables: {
    id: 'india_renewables',
    name: 'India Bundled Solar & Wind Clean Grid Displacement',
    registry: 'Verra VCS / BEE ICM',
    methodology: 'UNFCCC CDM ACM0002 / VCS Grid Displacement',
    standard: 'Verified Carbon Standard (VCS)',
    country: 'India',
    vintage: '2023-2024',
    basePricePerTco2eUsd: 12.50,
    serialPrefix: 'VCS-IN-ACM0002-2024',
  },
  verra_vm0042_soil: {
    id: 'verra_vm0042_soil',
    name: 'Regenerative Agriculture & Agroforestry Carbon Removals',
    registry: 'Verra VCS',
    methodology: 'VM0042 v2.2 (Improved Agricultural Land Management)',
    standard: 'Verra AFOLU Carbon Removals',
    country: 'Global / Smallholder FPOs',
    vintage: '2023-2024',
    basePricePerTco2eUsd: 18.00,
    serialPrefix: 'VCS-VM0042-REM-2024',
  },
  gold_standard_cookstoves: {
    id: 'gold_standard_cookstoves',
    name: 'Clean Cookstoves & Community Water Purification',
    registry: 'Gold Standard',
    methodology: 'GS4GG Clean Cooking & Safe Water Access',
    standard: 'Gold Standard for the Global Goals (GS-VER)',
    country: 'Kenya / India Rural',
    vintage: '2024',
    basePricePerTco2eUsd: 15.00,
    serialPrefix: 'GS-VER-2024-SDG',
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    const validated = retireQuoteSchema.safeParse(rawParams);

    if (!validated.success) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid quote parameters', errors: validated.error.issues },
        { status: 400, headers: corsHeaders }
      );
    }

    return generateQuoteResponse(validated.data);
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to generate retirement quote', error: error?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const validated = retireQuoteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid JSON request body', errors: validated.error.issues },
        { status: 400, headers: corsHeaders }
      );
    }

    return generateQuoteResponse(validated.data);
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to generate retirement quote', error: error?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

function generateQuoteResponse(params: z.infer<typeof retireQuoteSchema>) {
  const hasCarbonmarkApiKey = Boolean(process.env.CARBONMARK_API_KEY);
  const project = PROJECT_CATALOG[params.projectId] || PROJECT_CATALOG.india_renewables;

  const quantityTco2e = Math.round(params.tco2e * 1000) / 1000;
  const subtotalUsd = Math.round(quantityTco2e * project.basePricePerTco2eUsd * 100) / 100;
  const registryRetirementFeeUsd = Math.round(quantityTco2e * 0.40 * 100) / 100; // Standard registry transaction levy
  const totalUsd = Math.round((subtotalUsd + registryRetirementFeeUsd) * 100) / 100;

  const uniqueSuffix = Math.floor(100000 + Math.random() * 900000);
  const certificateId = `CL-RET-${new Date().getFullYear()}-${uniqueSuffix}`;
  const serialNumberPreview = `${project.serialPrefix}-SEQ-${uniqueSuffix}`;

  return NextResponse.json(
    {
      status: 'success',
      timestamp: new Date().toISOString(),
      live_api_connected: hasCarbonmarkApiKey,
      sandbox_mode: !hasCarbonmarkApiKey,
      quote: {
        quantity_tco2e: quantityTco2e,
        quantity_kg_co2e: Math.round(quantityTco2e * 1000),
        currency: 'USD',
        price_per_tco2e_usd: project.basePricePerTco2eUsd,
        subtotal_usd: subtotalUsd,
        registry_fee_usd: registryRetirementFeeUsd,
        total_usd: totalUsd,
      },
      project: {
        id: project.id,
        name: project.name,
        registry: project.registry,
        methodology: project.methodology,
        standard: project.standard,
        country: project.country,
        vintage: project.vintage,
        serial_number_preview: serialNumberPreview,
      },
      certificate_preview: {
        certificate_id: certificateId,
        beneficiary_name: params.beneficiaryName,
        retirement_message: params.retirementMessage,
        legal_status: 'Permanent Non-Tradable Retirement (ISO 14064-3 / Verra & GS rules)',
        transferrable: false,
      },
      settlement_options: {
        carbonmark_marketplace_url: `https://marketplace.carbonmark.com`,
        climes_settlement_url: `https://climes.io`,
        gold_standard_registry_url: `https://registry.goldstandard.org`,
        verra_registry_url: `https://registry.verra.org`,
      },
    },
    { status: 200, headers: corsHeaders }
  );
}
