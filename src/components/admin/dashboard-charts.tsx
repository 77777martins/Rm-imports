"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCents } from "@/lib/utils";

const AXIS = { fontSize: 11, fill: "#64748b" };

function ChartTooltip({ active, payload, label, format }: { active?: boolean; payload?: { value: number; payload: Record<string, unknown> }[]; label?: string; format: (p: Record<string, unknown>) => React.ReactNode }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs shadow-lift">
      {label && <p className="mb-0.5 font-semibold text-slate-900">{label}</p>}
      <div className="text-slate-600">{format(payload[0].payload)}</div>
    </div>
  );
}

const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

/** Receita diária (série única → sem legenda; o título identifica a série). */
export function RevenueChart({ data }: { data: { date: string; revenueCents: number; orders: number }[] }) {
  const rows = data.map((d) => ({ ...d, label: shortDate(d.date), revenue: d.revenueCents / 100 }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => `R$ ${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
        <Tooltip
          cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
          content={<ChartTooltip format={(p) => <>{formatCents(p.revenueCents as number)} · {p.orders as number} pedido(s)</>} />}
        />
        <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#rev-fill)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Barras horizontais de um só tom — magnitude por categoria, com rótulo direto. */
export function HorizontalBars({ data, format, color = "var(--secondary)" }: { data: { name: string; value: number }[]; format: (v: number) => string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barCategoryGap={8}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" tick={{ ...AXIS, fill: "#334155" }} tickLine={false} axisLine={false} width={150} />
        <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip format={(p) => format(p.value as number)} />} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={22} label={{ position: "right", fontSize: 11, fill: "#334155", formatter: (v: unknown) => format(Number(v)) }} />
      </BarChart>
    </ResponsiveContainer>
  );
}
