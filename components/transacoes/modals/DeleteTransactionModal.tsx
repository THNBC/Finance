import { X } from "lucide-react";

import type { Transaction } from "@/lib/transacoes/types";
import { formatBRL } from "@/lib/transacoes/utils";

type Props = {
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteTransactionModal({
  transaction,
  onClose,
  onConfirm,
}: Props) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-6">
      <div className="my-auto w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#081018] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold sm:text-xl">
              Excluir transação?
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Essa ação também remove os detalhes vinculados.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
          <p className="break-words text-sm text-zinc-300">
            {transaction.description}
          </p>

          <p className="mt-2 break-words font-semibold text-red-300">
            {formatBRL(Number(transaction.amount))}
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-2xl border border-white/10 px-3 text-sm text-zinc-300 transition hover:bg-white/5"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-2xl bg-red-500 px-3 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}