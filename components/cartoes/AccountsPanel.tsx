"use client";

import type { CartoesData } from "@/lib/cartoes/types";
import { formatBRL } from "@/lib/cartoes/utils";
import { AccountRow } from "./AccountRow";
import { Panel } from "./Panel";

export function AccountsPanel({
  data,
  onEditBalance,
}: {
  data: CartoesData;
  onEditBalance: () => void;
}) {
  return (
    <Panel title="Contas" action="Editar Saldo" onAction={onEditBalance}>
      <AccountRow
        icon="/icons/caixa.png"
        title="Conta Caixa"
        subtitle="Conta corrente"
        value={formatBRL(data.caixaBalance)}
        profit={`+${formatBRL(data.caixaProfit)}`}
      />
    </Panel>
  );
}