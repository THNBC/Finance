import { X } from "lucide-react";

import type { CreditCardRow } from "@/lib/cartoes/types";

export function PurchaseModal({
  open,
  saving,
  editing,
  cards,
  cardId,
  description,
  amount,
  installments,
  date,
  onClose,
  onCardChange,
  onDescriptionChange,
  onAmountChange,
  onInstallmentsChange,
  onDateChange,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  editing: boolean;
  cards: CreditCardRow[];
  cardId: string;
  description: string;
  amount: string;
  installments: string;
  date: string;
  onClose: () => void;
  onCardChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onInstallmentsChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onSave: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-4 sm:items-center sm:py-6">
      <div className="my-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#081018] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold sm:text-xl">
            {editing ? "Editar compra" : "Nova compra no cartão"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="shrink-0 rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Cartão
            </label>

            <select
              value={cardId}
              onChange={(event) => onCardChange(event.target.value)}
              className="w-full appearance-none rounded-xl border border-zinc-700 bg-[#081018] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-[#081018] text-white">
                Selecione
              </option>

              {cards
                .filter((card) => card.active !== false)
                .map((card) => (
                  <option
                    key={card.id}
                    value={card.id}
                    className="bg-[#081018] text-white"
                  >
                    {card.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Descrição
            </label>

            <input
              value={description}
              onChange={(event) =>
                onDescriptionChange(event.target.value)
              }
              placeholder="Ex: Amazon, Mercado Livre..."
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Valor total
              </label>

              <input
                inputMode="decimal"
                value={amount}
                onChange={(event) =>
                  onAmountChange(event.target.value)
                }
                placeholder="Ex: 1.200,00"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Parcelas
              </label>

              <select
                value={installments}
                onChange={(event) =>
                  onInstallmentsChange(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-zinc-700 bg-[#081018] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                {Array.from({ length: 12 }).map((_, index) => {
                  const value = String(index + 1);

                  return (
                    <option
                      key={value}
                      value={value}
                      className="bg-[#081018] text-white"
                    >
                      {value}x
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Data da compra
            </label>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                onDateChange(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
            />

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              A fatura fecha dia 9 e vence dia 15. Compras até dia 9 entram na
              fatura do mês atual; após dia 9 entram na próxima fatura.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 flex-1 rounded-xl border border-white/10 px-4 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="h-11 flex-1 rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? editing
                ? "Salvando..."
                : "Salvando..."
              : editing
                ? "Salvar alterações"
                : "Salvar compra"}
          </button>
        </div>
      </div>
    </div>
  );
}