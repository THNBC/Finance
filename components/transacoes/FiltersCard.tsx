import { Search } from "lucide-react";

import type {
  TransactionSourceFilter,
  TransactionTypeFilter,
} from "@/lib/transacoes/types";

type Props = {
  search: string;
  typeFilter: TransactionTypeFilter;
  sourceFilter: TransactionSourceFilter;
  startDate: string;
  endDate: string;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: TransactionTypeFilter) => void;
  onSourceFilterChange: (value: TransactionSourceFilter) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

export function FiltersCard({
  search,
  typeFilter,
  sourceFilter,
  startDate,
  endDate,
  onSearchChange,
  onTypeFilterChange,
  onSourceFilterChange,
  onStartDateChange,
  onEndDateChange,
}: Props) {
  return (
    <section className="mb-5 rounded-3xl border border-white/10 bg-[#081018]/90 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_160px_180px_160px_160px]">
        <div className="flex h-11 min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 sm:col-span-2 lg:col-span-1">
          <Search size={17} className="shrink-0 text-zinc-500" />

          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar transação..."
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(event) =>
            onTypeFilterChange(event.target.value as TransactionTypeFilter)
          }
          className="h-11 min-w-0 w-full rounded-2xl border border-white/10 bg-[#081018] px-4 text-sm text-zinc-300 outline-none"
        >
          <option value="all">Todos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(event) =>
            onSourceFilterChange(event.target.value as TransactionSourceFilter)
          }
          className="h-11 min-w-0 w-full rounded-2xl border border-white/10 bg-[#081018] px-4 text-sm text-zinc-300 outline-none"
        >
          <option value="all">Todas origens</option>
          <option value="caixa">Caixa</option>
          <option value="inter">Inter</option>
          <option value="mercadopago">Mercado Pago</option>
          <option value="manual">Manual</option>
        </select>

        <div className="min-w-0">
          <p className="mb-1.5 text-xs text-zinc-500 lg:hidden">
            Data inicial
          </p>

          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="h-11 min-w-0 w-full rounded-2xl border border-white/10 bg-[#081018] px-3 text-sm text-zinc-300 outline-none sm:px-4"
          />
        </div>

        <div className="min-w-0">
          <p className="mb-1.5 text-xs text-zinc-500 lg:hidden">
            Data final
          </p>

          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="h-11 min-w-0 w-full rounded-2xl border border-white/10 bg-[#081018] px-3 text-sm text-zinc-300 outline-none sm:px-4"
          />
        </div>
      </div>
    </section>
  );
}