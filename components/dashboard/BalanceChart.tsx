
"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { BalanceChartItem, DashboardPeriod } from "@/lib/dashboard/types";
import { formatBRL } from "@/lib/dashboard/utils";
import { ChartCard } from "./ChartCard";

type Props = {
  data: BalanceChartItem[];
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
};

function formatAxisValue(value: number) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (absoluteValue >= 1_000) {
    return `${(value / 1_000).toFixed(0)}k`;
  }

  return String(Math.round(value));
}

export function BalanceChart({
  data,
  period,
  onPeriodChange,
}: Props) {
  const values = data.map((item) => Number(item.balance ?? 0));
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);

  // Define o domínio do eixo para que o zero tenha posição conhecida.
  const padding = (maxValue - minValue || 1) * 0.08;
  const yMin = minValue < 0 ? minValue - padding : 0;
  const yMax = maxValue > 0 ? maxValue + padding : 0;

  // Percentual vertical do zero no gradiente SVG.
  const zeroOffset =
    yMax === yMin ? 50 : (yMax / (yMax - yMin)) * 100;

  const gradientId = "balanceLineGradient";
  const totalBalance = data.reduce(
    (sum, item) => sum + Number(item.balance ?? 0),
    0,
  );

  return (
    
<ChartCard
  title="Evolução do saldo geral"
  rightContent={
    <span
      className={`text-sm font-semibold tabular-nums sm:text-base ${
        totalBalance < 0 ? "text-red-400" : "text-emerald-400"
      }`}
    >
      {formatBRL(totalBalance)}
    </span>
  }
>
  <div className="mb-4 flex w-full gap-2 sm:w-auto">
    {[3, 6, 12].map((item) => (
      <button
        key={item}
        type="button"
        onClick={() => onPeriodChange(item as DashboardPeriod)}
        className={`flex-1 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs transition sm:flex-none ${
          period === item
            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
            : "border-white/10 text-zinc-500 hover:border-emerald-400/40 hover:text-emerald-300"
        }`}
      >
        {item} meses
      </button>
    ))}
  </div>

  <div className="h-[220px] sm:h-[260px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 4,
          left: -18,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="#10b981" />
            <stop offset={`${zeroOffset}%`} stopColor="#10b981" />
            <stop offset={`${zeroOffset}%`} stopColor="#ef4444" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#14202b" />

        <XAxis
          dataKey="month"
          stroke="#71717a"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />

        <YAxis
          domain={[yMin, yMax]}
          stroke="#71717a"
          tickLine={false}
          axisLine={false}
          width={52}
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => formatAxisValue(Number(value))}
        />

        <Tooltip
          formatter={(value) => {
            const balance = Number(value);

            return [
              <span
                style={{
                  color: balance < 0 ? "#ef4444" : "#10b981",
                  fontWeight: 600,
                }}
              >
                {formatBRL(balance)}
              </span>,
              "Saldo",
            ];
          }}
          contentStyle={{
            background: "#081018",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            color: "#fff",
            fontSize: "12px",
          }}
          labelStyle={{
            color: "#a1a1aa",
            marginBottom: "4px",
          }}
        />

        <Line
          type="monotone"
          dataKey="balance"
          stroke={`url(#${gradientId})`}
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 4, fill: "#10b981" }}
          isAnimationActive
          animationDuration={700}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</ChartCard>

  );
}
