"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  HOUSE_COLORS,
  HOUSE_DOT_COLORS,
  HOUSES,
} from "@/lib/bets/constants";
import type { ChartRange, ChartRow } from "@/lib/bets/types";
import { formatBRL } from "@/lib/bets/utils";
import { Legend } from "./Legend";
import { Panel } from "./Panel";

export function PerformanceChartPanel({
  chartRange,
  onChartRangeChange,
  data,
}: {
  chartRange: ChartRange;
  onChartRangeChange: (value: ChartRange) => void;
  data: ChartRow[];
}) {
  return (
    <Panel
      title="Desempenho por casa"
      action={
        <select
          value={chartRange}
          onChange={(event) =>
            onChartRangeChange(
              Number(event.target.value) as ChartRange
            )
          }
          className="h-9 rounded-xl border border-white/10 bg-[#081018] px-2 text-xs text-white outline-none sm:px-3 sm:text-sm"
        >
          <option value={3}>3 meses</option>
          <option value={6}>6 meses</option>
          <option value={12}>12 meses</option>
        </select>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:gap-x-6 sm:text-sm">
        <Legend
          color={HOUSE_DOT_COLORS.Bet365}
          label="Bet365"
        />

        <Legend
          color={HOUSE_DOT_COLORS.Betano}
          label="Betano"
        />

        <Legend
          color={HOUSE_DOT_COLORS.Superbet}
          label="Superbet"
        />
      </div>

      <div className="h-[230px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{
              top: 5,
              right: 4,
              left: -15,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="#1f2937"
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />

            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              axisLine={false}
              width={62}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) =>
                Math.abs(Number(value)) >= 1000
                  ? `R$${(Number(value) / 1000).toFixed(0)}k`
                  : `R$${Number(value)}`
              }
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#081018",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                fontSize: "12px",
              }}
              formatter={(value) => formatBRL(Number(value))}
            />

            {HOUSES.map((house) => (
              <Line
                key={house}
                type="monotone"
                dataKey={house}
                stroke={HOUSE_COLORS[house]}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}