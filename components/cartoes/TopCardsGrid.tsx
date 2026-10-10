"use client";

import type { CartoesData } from "@/lib/cartoes/types";
import { formatBRL } from "@/lib/cartoes/utils";
import { TopCard } from "./TopCard";

export function TopCardsGrid({ data }: { data: CartoesData }) {
  return (
    <section className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4 xl:gap-5">
      <TopCard
        title="Total geral"
        value={formatBRL(data.totalGeneral)}
      />

      <TopCard
        title="Disponível"
        value={formatBRL(data.caixaBalance)}
      />

      <TopCard
        title="Total das faturas"
        value={formatBRL(data.totalInvoices)}
      />

      <TopCard
        title="Parcelas em aberto"
        value={formatBRL(data.totalUsed)}
      />
    </section>
  );
}