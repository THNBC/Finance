"use client";

import type {
  InvestmentTransaction,
  Transaction,
} from "@/lib/cartoes/types";
import { InvestmentsLineChart } from "./InvestmentsLineChart";
import { Panel } from "./Panel";

export function InvestmentsChartPanel({
  investmentTransactions,
  transactions,
  chartMonths,
  onChartMonthsChange,
}: {
  investmentTransactions: InvestmentTransaction[];
  transactions: Transaction[];
  chartMonths: 3 | 6 | 12;
  onChartMonthsChange: (months: 3 | 6 | 12) => void;
}) {
  return (
    <Panel
      title="Evolução dos investimentos"
      rightContent={
        <div className="flex w-full gap-2 sm:w-auto">
          {[3, 6, 12].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                onChartMonthsChange(value as 3 | 6 | 12)
              }
              className={`flex-1 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs transition sm:flex-none ${chartMonths === value
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 text-zinc-500 hover:border-emerald-400/40 hover:text-emerald-300"
                }`}
            >
              {value} meses
            </button>
          ))}
        </div>
      }
    >
      <InvestmentsLineChart
        investmentTransactions={investmentTransactions}
        transactions={transactions}
        monthsToShow={chartMonths}
      />
    </Panel>
  );
}