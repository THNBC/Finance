"use client";

import { ArrowUpRight } from "lucide-react";

type Props = {
  onAddTransaction: () => void;
};

export function DashboardHeader({ onAddTransaction }: Props) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Dashboard
        </h2>

        <p className="mt-1 hidden text-sm text-zinc-500 lg:block">
          Visão geral das suas finanças
        </p>
      </div>

      <button
        type="button"
        onClick={onAddTransaction}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 sm:w-auto"
      >
        <ArrowUpRight size={18} />
        Adicionar Transação
      </button>
    </header>
  );
}