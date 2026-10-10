import { X } from "lucide-react";

export function EditBalanceModal({
  open,
  saving,
  value,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-4 sm:items-center sm:py-6">
      <div className="my-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#081018] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold sm:text-xl">
            Editar saldo da Caixa
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

        <label className="mb-2 block text-sm text-zinc-400">
          Novo saldo atual
        </label>

        <input
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ex: 19.610,91"
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
        />

        <p className="mt-3 text-xs leading-5 text-zinc-500">
          Esse campo ajusta o saldo inicial da Conta Caixa para que o saldo atual
          fique exatamente no valor informado.
        </p>

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
            {saving ? "Salvando..." : "Salvar saldo"}
          </button>
        </div>
      </div>
    </div>
  );
}