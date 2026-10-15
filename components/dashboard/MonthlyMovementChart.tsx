"use client";

import { useState } from "react";
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
  salaryData: MonthlyChartItem[];
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

export function MonthlyMovementChart({ data, salaryData }: Props) {
  const [salaryOnly, setSalaryOnly] = useState(false);
  const chartData = salaryOnly ? salaryData : data;

  return (
    <ChartCard
      title="Movimentação mensal"
      rightContent={
        <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setSalaryOnly(false)}
            aria-pressed={!salaryOnly}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${!salaryOnly
                ? "bg-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            Todas
          </button>

          <button
            type="button"
            onClick={() => setSalaryOnly(true)}
            aria-pressed={salaryOnly}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${salaryOnly
                ? "bg-emerald-400/10 text-emerald-300"
                : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            Salários
          </button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {salaryOnly ? "Salários" : "Receitas"}
        </span>

        {!salaryOnly && (
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Despesas
          </span>
        )}
      </div>

      <div className="h-[220px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
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
              name={salaryOnly ? "Salários" : "Receitas"}
              fill="#10b981"
              radius={[6, 6, 0, 0]}
            />

            {!salaryOnly && (
              <Bar
                dataKey="expense"
                name="Despesas"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}