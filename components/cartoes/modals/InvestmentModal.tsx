import { X } from "lucide-react";

import type { Investment, InvestmentTransaction } from "@/lib/cartoes/types";

export function InvestmentModal({
  open,
  saving,
  investments,
  investmentId,
  type,
  amount,
  date,
  onClose,
  onInvestmentChange,
  onTypeChange,
  onAmountChange,
  onDateChange,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  investments: Investment[];
  investmentId: string;
  type: InvestmentTransaction["type"];
  amount: string;
  date: string;
  onClose: () => void;
  onInvestmentChange: (value: string) => void;
  onTypeChange: (value: InvestmentTransaction["type"]) => void;
  onAmountChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onSave: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-4 sm:items-center sm:py-6">
      <div className="my-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#081018] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold sm:text-xl">
            Nova movimentação
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
              Investimento
            </label>

            <select
              value={investmentId}
              onChange={(event) =>
                onInvestmentChange(event.target.value)
              }
              className="w-full appearance-none rounded-xl border border-zinc-700 bg-[#081018] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
            >
              <option
                value="caixa"
                className="bg-[#081018] text-white"
              >
                Caixa
              </option>

              {investments.map((investment) => (
                <option
                  key={investment.id}
                  value={investment.id}
                  className="bg-[#081018] text-white"
                >
                  {investment.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Tipo
            </label>

            <select
              value={type}
              onChange={(event) =>
                onTypeChange(
                  event.target.value as InvestmentTransaction["type"]
                )
              }
              disabled={investmentId === "caixa"}
              className="w-full appearance-none rounded-xl border border-zinc-700 bg-[#081018] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option
                value="aporte"
                className="bg-[#081018] text-white"
              >
                Aporte
              </option>

              <option
                value="rendimento"
                className="bg-[#081018] text-white"
              >
                Rendimento
              </option>

              <option
                value="saque"
                className="bg-[#081018] text-white"
              >
                Saque
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Valor
            </label>

            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) =>
                onAmountChange(event.target.value)
              }
              placeholder="Ex: 1000 ou 1.000,50"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Data
            </label>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                onDateChange(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
            />
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
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}