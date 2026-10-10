import { Pencil, Trash2, X } from "lucide-react";

import type { SelectedInvoice } from "@/lib/cartoes/types";
import { formatBRL } from "@/lib/cartoes/utils";

function formatPurchaseDate(value: string) {
  if (!value) return "-";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export function InvoiceDetailsModal({
  selectedInvoice,
  payingInvoiceId,
  deletingPurchaseId,
  onClose,
  onPayClick,
  onEditPurchase,
  onDeletePurchase,
}: {
  selectedInvoice: SelectedInvoice | null;
  payingInvoiceId: string | null;
  deletingPurchaseId: string | null;
  onClose: () => void;
  onPayClick: (invoice: SelectedInvoice) => void;
  onEditPurchase: (purchaseId: string) => void;
  onDeletePurchase: (purchaseId: string) => void;
}) {
  if (!selectedInvoice) return null;

  const isPaying =
    payingInvoiceId === selectedInvoice.invoice.id;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-4 sm:items-center sm:py-6">
      <div className="my-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-[#081018] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold sm:text-xl">
              {selectedInvoice.cardName} · {selectedInvoice.invoice.label}
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Compras da fatura
            </p>
          </div>

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

        <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-zinc-500">
            Valor da fatura
          </p>

          <strong className="mt-1 block break-words text-2xl font-semibold text-white sm:text-3xl">
            {formatBRL(selectedInvoice.invoice.total)}
          </strong>
        </div>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1 sm:max-h-[420px]">
          {selectedInvoice.invoice.items.map((item) => {
            const isDeleting =
              deletingPurchaseId === item.purchase_id;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                {/* MOBILE / TABLET */}
                <div className="lg:hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-zinc-200">
                        {item.description}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Compra em {formatPurchaseDate(item.purchaseDate)}
                      </p>
                    </div>

                    <strong className="shrink-0 whitespace-nowrap text-sm text-white">
                      {formatBRL(item.amount)}
                    </strong>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <div>
                      <p className="text-xs text-zinc-500">
                        Parcela
                      </p>

                      <p className="mt-1 text-sm text-zinc-300">
                        {item.installmentLabel}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onEditPurchase(item.purchase_id)
                        }
                        disabled={isDeleting || isPaying}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Editar compra"
                        title="Editar compra"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onDeletePurchase(item.purchase_id)
                        }
                        disabled={isDeleting || isPaying}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Excluir compra"
                        title="Excluir compra"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* DESKTOP */}
                <div className="hidden grid-cols-[minmax(0,1fr)_110px_80px_110px_90px] items-center gap-3 lg:grid">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {item.description}
                    </p>
                  </div>

                  <span className="text-center text-sm text-zinc-400">
                    {formatPurchaseDate(item.purchaseDate)}
                  </span>

                  <span className="text-center text-sm text-zinc-400">
                    {item.installmentLabel}
                  </span>

                  <strong className="text-right text-sm text-white">
                    {formatBRL(item.amount)}
                  </strong>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEditPurchase(item.purchase_id)
                      }
                      disabled={isDeleting || isPaying}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Editar compra"
                      title="Editar compra"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDeletePurchase(item.purchase_id)
                      }
                      disabled={isDeleting || isPaying}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Excluir compra"
                      title="Excluir compra"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPaying}
            className="h-11 flex-1 rounded-xl border border-white/10 px-4 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
          >
            Fechar
          </button>

          {selectedInvoice.canPay && (
            <button
              type="button"
              onClick={() => onPayClick(selectedInvoice)}
              disabled={isPaying}
              className="h-11 flex-1 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPaying ? "Pagando..." : "Pagar fatura"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}