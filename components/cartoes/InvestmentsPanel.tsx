"use client";

import { SquarePen } from "lucide-react";

import type { CartoesData, Investment } from "@/lib/cartoes/types";
import { InvestmentCard } from "./InvestmentCard";

export function InvestmentsPanel({
  investments,
  data,
  onAddInvestment,
}: {
  investments: Investment[];
  data: CartoesData;
  onAddInvestment: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col rounded-3xl border border-white/10 bg-[#081018]/90">
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <h3 className="text-lg font-semibold">Investimentos</h3>

        <button
          type="button"
          onClick={onAddInvestment}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 sm:w-auto"
        >
          <SquarePen size={16} />
          Adicionar Rendimento
        </button>
      </div>

      <div className="flex flex-1 px-4 py-2 sm:px-5">
        <InvestmentCard
          investments={investments}
          totalInvested={data.totalInvested}
          totalProfit={data.totalProfit}
          profitability={data.profitability}
        />
      </div>
    </section>
  );
}