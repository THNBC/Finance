"use client";

import type {
  DashboardData,
  DashboardPeriod,
} from "@/lib/dashboard/types";

import { BalanceChart } from "./BalanceChart";
import { MonthlyMovementChart } from "./MonthlyMovementChart";

type Props = {
  data: DashboardData;
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
};

export function DashboardCharts({
  data,
  period,
  onPeriodChange,
}: Props) {
  return (
    <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
      <BalanceChart
        data={data.balanceChartData}
        period={period}
        onPeriodChange={onPeriodChange}
      />

      <MonthlyMovementChart
        data={data.monthlyChartData}
        salaryData={data.salaryChartData}
      />
    </section>
  );
}