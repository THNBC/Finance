import { X } from "lucide-react";

export function AddTransactionModal({
  open,
  saving,
  type,
  description,
  amount,
  date,
  onClose,
  onTypeChange,
  onDescriptionChange,
  onAmountChange,
  onDateChange,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  type: "income" | "expense";
  description: string;
  amount: string;
  date: string;
  onClose: () => void;
  onTypeChange: (value: "income" | "expense") => void;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onSave: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-6">
      <div className="my-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#081018] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold sm:text-xl">
              Adicionar transação
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Lance uma entrada ou saída direto na Conta Caixa.
            </p>
          </div>

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
              Tipo
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onTypeChange("income")}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${type === "income"
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/5"
                  }`}
              >
                Entrada
              </button>

              <button
                type="button"
                onClick={() => onTypeChange("expense")}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${type === "expense"
                  ? "border-red-400/40 bg-red-400/10 text-red-300"
                  : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/5"
                  }`}
              >
                Saída
              </button>
            </div>
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
              placeholder="Ex: Salário, mercado, pix..."
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400/50"
            />
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
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400/50"
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
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
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
            className="h-11 flex-1 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar transação"}
          </button>
        </div>
      </div>
    </div>
  );
}