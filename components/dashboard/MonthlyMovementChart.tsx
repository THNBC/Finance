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
import { TrendingDown, TrendingUp } from "lucide-react";

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

function CustomTooltip({
  active,
  payload,
  label,
  chartData,
  salaryOnly,
}: {
  active?: boolean;
  payload?: readonly {
    dataKey?: string;
    value?: number | string;
  }[];
  label?: string;
  chartData: MonthlyChartItem[];
  salaryOnly: boolean;
}) {
  if (!active || !payload?.length) return null;

  const monthIndex = chartData.findIndex((item) => item.month === label);
  const current = chartData[monthIndex];

  if (!current) return null;

  const income = Number(current.income ?? 0);
  const previous = monthIndex > 0 ? chartData[monthIndex - 1] : null;
  const previousIncome = previous ? Number(previous.income ?? 0) : null;

  const hasComparison =
    salaryOnly &&
    previousIncome !== null &&
    previousIncome > 0;

  const variation = hasComparison
    ? ((income - previousIncome!) / previousIncome!) * 100
    : null;

  const variationColor =
    variation === null || variation === 0
      ? "#a1a1aa"
      : variation > 0
        ? "#34d399"
        : "#f87171";

  const isPositive = variation !== null && variation > 0;
  const isNegative = variation !== null && variation < 0;

  return (
    <div className="min-w-[190px] rounded-xl border border-white/10 bg-[#081018] p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-white">{label}</span>

        {salaryOnly && variation !== null && (
          <span
            className="flex items-center gap-1 text-sm font-medium tabular-nums"
            style={{ color: variationColor }}
          >
            {isNegative ? (
              <TrendingDown size={14} />
            ) : (
              <TrendingUp size={14} />
            )}

            {isPositive ? "+" : ""}
            {variation.toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            %
          </span>
        )}
      </div>

      {payload.map((entry) => {
        const isExpense = entry.dataKey === "expense";
        const color = isExpense ? "#f87171" : "#34d399";

        return (
          <div
            key={entry.dataKey}
            className="text-sm tabular-nums"
            style={{ color }}
          >
            {formatBRL(Number(entry.value ?? 0))}
          </div>
        );
      })}

      {salaryOnly && variation === null && (
        <div className="text-xs text-zinc-500">
          Sem comparação
        </div>
      )}
    </div>
  );
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
              content={(props) => (
                <CustomTooltip
                  active={props.active}
                  payload={props.payload as readonly {
                    dataKey?: string;
                    value?: number | string;
                  }[] | undefined}
                  label={String(props.label ?? "")}
                  chartData={chartData}
                  salaryOnly={salaryOnly}
                />
              )}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
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