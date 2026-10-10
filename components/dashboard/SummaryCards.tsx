import { ArrowUpRight, Clock, List, Wallet } from "lucide-react";

import type { DashboardData } from "@/lib/dashboard/types";
import { formatBRL } from "@/lib/dashboard/utils";
import { SummaryCard } from "./SummaryCard";

type Props = {
  data: DashboardData;
};

export function SummaryCards({ data }: Props) {
  return (
    <section className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
      <SummaryCard
        title="Saldo em conta"
        value={formatBRL(data.currentBalance)}
        helper="Conta Caixa"
        icon={<Wallet size={21} />}
        variant="green"
      />

      <div className="hidden lg:contents">
        <SummaryCard
          title="Transações"
          value={String(data.totalTransactions)}
          helper="Lançamentos salvos"
          icon={<List size={21} />}
          variant="purple"
        />

        <SummaryCard
          title="Receitas"
          value={formatBRL(data.totalIncome)}
          helper="Total de entradas"
          icon={<ArrowUpRight size={21} />}
          variant="green"
        />

        <SummaryCard
          title="Despesas"
          value={formatBRL(data.totalExpense)}
          helper={`Última importação: ${data.lastImport}`}
          icon={<Clock size={21} />}
          variant="red"
        />
      </div>
    </section>
  );
}