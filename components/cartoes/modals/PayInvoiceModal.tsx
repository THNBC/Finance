import { X } from "lucide-react";

import type { SelectedInvoice } from "@/lib/cartoes/types";
import { formatBRL } from "@/lib/cartoes/utils";

export function PayInvoiceModal({
  invoiceToPay,
  payingInvoiceId,
  onClose,
  onPay,
}: {
  invoiceToPay: SelectedInvoice | null;
  payingInvoiceId: string | null;
  onClose: () => void;
  onPay: (invoice: SelectedInvoice) => void;
}) {
  if (!invoiceToPay) return null;

  const isPaying =
    payingInvoiceId === invoiceToPay.invoice.id;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-4 sm:items-center sm:py-6">
      <div className="my-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#081018] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold sm:text-xl">
            Confirmar pagamento
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={isPaying}
            className="shrink-0 rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm leading-6 text-zinc-400">
          Você deseja pagar esta fatura? O valor será lançado como despesa
          na Conta Caixa e as parcelas desta fatura serão marcadas como pagas.
        </p>

        <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-500">
              Cartão
            </span>

            <strong className="min-w-0 truncate text-right text-sm font-medium text-white">
              {invoiceToPay.cardName}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-500">
              Fatura
            </span>

            <strong className="text-right text-sm font-medium text-white">
              {invoiceToPay.invoice.label}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
            <span className="text-sm text-zinc-500">
              Valor
            </span>

            <strong className="break-words text-right text-xl font-semibold text-white sm:text-2xl">
              {formatBRL(invoiceToPay.invoice.total)}
            </strong>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-xs leading-5 text-emerald-300">
          Após confirmar, o saldo da Caixa será reduzido e o limite do cartão
          será liberado automaticamente pelo valor pago.
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPaying}
            className="h-11 flex-1 rounded-xl border border-white/10 px-4 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => onPay(invoiceToPay)}
            disabled={isPaying}
            className="h-11 flex-1 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPaying ? "Pagando..." : "Pagar fatura"}
          </button>
        </div>
      </div>
    </div>
  );
}