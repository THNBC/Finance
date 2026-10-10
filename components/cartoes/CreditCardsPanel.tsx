"use client";

import type { CartoesData, SelectedInvoice } from "@/lib/cartoes/types";
import { formatBRL } from "@/lib/cartoes/utils";
import { CreditCardCard } from "./CreditCardCard";
import { InfoBox } from "./InfoBox";
import { Panel } from "./Panel";

export function CreditCardsPanel({
  data,
  onAddPurchase,
  onSelectInvoice,
}: {
  data: CartoesData;
  onAddPurchase: () => void;
  onSelectInvoice: (invoice: SelectedInvoice) => void;
}) {
  return (
    <Panel
      title="Cartões de crédito"
      action="Adicionar Compra"
      onAction={onAddPurchase}
      className="h-full w-full"
    >
      <div className="flex h-full flex-col justify-between">
        <div className="space-y-6">
          {data.cardRows.map((card) => (
            <CreditCardCard
              key={card.id}
              card={card}
              onSelectInvoice={onSelectInvoice}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 sm:gap-4">
          <InfoBox
            title="Utilizado"
            value={formatBRL(data.totalUsed)}
          />

          <InfoBox
            title="Disponível"
            value={formatBRL(data.availableLimit)}
          />

          <InfoBox
            title="Limite total"
            value={formatBRL(data.totalLimit)}
          />
        </div>
      </div>
    </Panel>
  );
}