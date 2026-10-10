import { Loader2, X } from "lucide-react";

type Props = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ClearHistoryModal({
  open,
  loading,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-6">
      <div className="my-auto w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#081018] p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold sm:text-xl">
              Limpar histórico?
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Essa ação vai apagar todas as transações e todos os detalhes
              vinculados.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="shrink-0 rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
          <p className="text-sm font-medium text-red-300">
            Esta ação não pode ser desfeita.
          </p>

          <p className="mt-1 text-xs text-red-200/70">
            Contas, cartões e investimentos não serão apagados.
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 flex-1 rounded-2xl border border-white/10 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Limpar tudo
          </button>
        </div>
      </div>
    </div>
  );
}