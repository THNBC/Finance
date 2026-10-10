"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MonthlyChartItem } from "@/lib/dashboard/types";
import { formatBRL } from "@/lib/dashboard/utils";
import { ChartCard } from "./ChartCard";

type Props = {
  data: MonthlyChartItem[];
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

export function MonthlyMovementChart({ data }: Props) {
  return (
    <ChartCard title="Movimentação mensal">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Receitas
        </span>

        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          Despesas
        </span>
      </div>

      <div className="h-[220px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 4,
              left: -18,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#14202b"
            />

            <XAxis
              dataKey="month"
              stroke="#71717a"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />

            <YAxis
              stroke="#71717a"
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) =>
                formatAxisValue(Number(value))
              }
            />

            <Tooltip
              formatter={(value) => formatBRL(Number(value))}
              contentStyle={{
                background: "#081018",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                color: "#fff",
                fontSize: "12px",
              }}
            />

            <Bar
              dataKey="income"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
            />

            <Bar
              dataKey="expense"
              fill="#ef4444"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}