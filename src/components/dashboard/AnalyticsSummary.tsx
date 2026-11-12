import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { EngineOutput } from '../../types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  FileText,
  Trees,
  Fuel,
  TrendingDown,
  TrendingUp,
  Percent,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface AnalyticsSummaryProps {
  output: EngineOutput;
  archetypeLabel: string;
  onOpenAudit: (recordId?: string | null) => void;
}

export function AnalyticsSummary({
  output,
  archetypeLabel,
  onOpenAudit,
}: AnalyticsSummaryProps) {
  const total = output.totalEmissionsTons;
  const s1 = output.scope1Tons;
  const s2 = output.scope2Tons;
  const s3 = output.scope3Tons;

  const s1Pct = total > 0 ? Math.round((s1 / total) * 100) : 0;
  const s2Pct = total > 0 ? Math.round((s2 / total) * 100) : 0;
  const s3Pct = total > 0 ? Math.round((s3 / total) * 100) : 0;

  // Chart data
  const chartData = output.breakdownByCategory.map((item) => ({
    name: item.name,
    tons: item.tons,
    scope: item.scope,
    color: item.color,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-zinc-200 p-2.5 sm:p-3 rounded-lg shadow-lg text-xs font-mono max-w-xs">
          <p className="font-semibold text-zinc-900 font-sans">{data.name}</p>
          <p className="text-zinc-600 mt-1">
            Emissions: <span className="font-bold text-zinc-900">{data.tons.toLocaleString()} tCO₂e</span>
          </p>
          <p className="text-zinc-400 text-[11px] mt-0.5">Scope: {data.scope}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 4-Metric Institutional KPI Ledger Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Metric Card */}
        <Card className="relative overflow-hidden border-zinc-200/90 shadow-sm bg-gradient-to-b from-white to-zinc-50/50">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#0F3A2E]" />
          <CardContent className="p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between gap-1 text-zinc-500 text-xs">
              <span className="font-medium tracking-tight truncate">Total Gross Footprint</span>
              <Badge variant="methodology" className="shrink-0">GHG Protocol</Badge>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-zinc-950 tabular-nums">
                {output.totalEmissionsTons.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-zinc-500 font-medium">tCO₂e</span>
            </div>
            <div className="flex items-center justify-between pt-1 gap-2">
              <span className="text-[11px] text-zinc-500 font-mono truncate">
                {output.grossEmissionsKg.toLocaleString()} kg CO₂e
              </span>
              <Button
                variant="micro"
                onClick={() => onOpenAudit(null)}
                className="text-[10px] text-zinc-700 hover:text-zinc-900 flex items-center gap-1 shrink-0"
              >
                <FileText className="w-3 h-3 text-emerald-700" /> Audit Ledger
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scope 1 Card */}
        <Card className="relative overflow-hidden border-zinc-200/90 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-500" />
          <CardContent className="p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between gap-1 text-zinc-500 text-xs">
              <span className="font-medium truncate">Scope 1 (Direct)</span>
              <Badge variant="scope1" className="shrink-0">{s1Pct}% Share</Badge>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-800 tabular-nums">
                {s1.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-zinc-500 font-medium">tCO₂e</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 gap-2">
              <span className="truncate">Stationary & Fleet</span>
              <button
                onClick={() => onOpenAudit('corp-fuel-diesel')}
                className="text-zinc-400 hover:text-zinc-700 flex items-center gap-0.5 shrink-0"
              >
                Trace <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Scope 2 Card */}
        <Card className="relative overflow-hidden border-zinc-200/90 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
          <CardContent className="p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between gap-1 text-zinc-500 text-xs">
              <span className="font-medium truncate">Scope 2 (Energy)</span>
              <Badge variant="scope2" className="shrink-0">{s2Pct}% Share</Badge>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-indigo-950 tabular-nums">
                {s2.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-zinc-500 font-medium">tCO₂e</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 gap-2">
              <span className="truncate">Dual Method Track</span>
              <button
                onClick={() => onOpenAudit('corp-scope2-market')}
                className="text-zinc-400 hover:text-zinc-700 flex items-center gap-0.5 shrink-0"
              >
                Trace <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Scope 3 Card */}
        <Card className="relative overflow-hidden border-zinc-200/90 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <CardContent className="p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between gap-1 text-zinc-500 text-xs">
              <span className="font-medium truncate">Scope 3 (Value Chain)</span>
              <Badge variant="scope3" className="shrink-0">{s3Pct}% Share</Badge>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-amber-900 tabular-nums">
                {s3.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-zinc-500 font-medium">tCO₂e</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 gap-2">
              <span className="truncate">Logistics & Spend</span>
              <button
                onClick={() => onOpenAudit('corp-freight-1')}
                className="text-zinc-400 hover:text-zinc-700 flex items-center gap-0.5 shrink-0"
              >
                Trace <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics & Breakdown Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Donut Chart Component */}
        <Card className="lg:col-span-1 border-zinc-200/90 shadow-sm">
          <div className="p-3.5 sm:p-4 border-b border-zinc-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> Emissions Composition
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">AR6 GWP100</span>
          </div>
          <CardContent className="p-3.5 sm:p-4 flex flex-col items-center justify-center">
            <div className="w-full h-48 sm:h-52 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="tons"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={1.5} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] sm:text-xs text-zinc-400 font-sans uppercase tracking-wider">Total</span>
                <span className="text-sm sm:text-base font-bold font-mono text-zinc-900">
                  {output.totalEmissionsTons.toLocaleString()} t
                </span>
              </div>
            </div>

            {/* Muted Legend */}
            <div className="w-full space-y-1.5 pt-2 border-t border-zinc-100">
              {chartData.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 truncate pr-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-zinc-600 truncate text-[11px] sm:text-xs">{item.name}</span>
                  </div>
                  <span className="font-mono text-zinc-900 font-medium shrink-0 text-[11px] sm:text-xs">
                    {item.tons.toLocaleString()} t
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stacked Ledger Bar Breakdown & Equivalents */}
        <Card className="lg:col-span-2 border-zinc-200/90 shadow-sm flex flex-col justify-between">
          <div className="p-3.5 sm:p-4 border-b border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
              Category Distribution (tCO₂e)
            </span>
            <span className="text-[11px] text-zinc-500 font-mono truncate">
              {archetypeLabel}
            </span>
          </div>
          <CardContent className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
            <div className="w-full h-44 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F4F4F5" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#71717A' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={95}
                    tick={{ fontSize: 10, fill: '#52525B' }}
                    tickFormatter={(val: string) => (val.length > 13 ? val.slice(0, 12) + '…' : val)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tons" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Environmental Offset Equivalents Row - Fully Responsive 1-col on mobile, 3-col on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-zinc-100 mt-2">
              <div className="bg-zinc-50 border border-zinc-200/70 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                  <Trees className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate font-medium">Carbon Absorption</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-sm sm:text-base font-bold font-mono text-zinc-900">
                    {output.contextualEquivalents.treesAbsorptionAnnual.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-sans">mature trees/yr</span>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200/70 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                  <Fuel className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate font-medium">Gasoline Displaced</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-sm sm:text-base font-bold font-mono text-zinc-900">
                    {output.contextualEquivalents.gasolineGallonsEquivalent.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-sans">gallons burned</span>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200/70 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                  {output.contextualEquivalents.regionalAverageDeltaPercent <= 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="truncate font-medium">Benchmark Delta</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={`text-sm sm:text-base font-bold font-mono ${
                    output.contextualEquivalents.regionalAverageDeltaPercent <= 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}>
                    {output.contextualEquivalents.regionalAverageDeltaPercent > 0 ? '+' : ''}
                    {output.contextualEquivalents.regionalAverageDeltaPercent}%
                  </span>
                  <span className="text-[10px] text-zinc-500 font-sans">vs average</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
