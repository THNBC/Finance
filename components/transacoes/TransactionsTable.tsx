import React from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";

import type {
  Transaction,
  TransactionItem,
} from "@/lib/transacoes/types";

import {
  formatBRL,
  formatDate,
  getInstallmentClasses,
  getSourceLabel,
  normalizeText,
  pageSizeOptions,
} from "@/lib/transacoes/utils";

type Props = {
  loading: boolean;
  transactions: Transaction[];
  itemsByTransaction: Record<string, TransactionItem[]>;
  expandedRow: string | null;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalTransactions: number;
  onExpandedRowChange: (id: string | null) => void;
  onDeleteTargetChange: (transaction: Transaction) => void;
  onCurrentPageChange: React.Dispatch<React.SetStateAction<number>>;
  onPageSizeChange: (value: number) => void;
};

export function TransactionsTable({
  loading,
  transactions,
  itemsByTransaction,
  expandedRow,
  currentPage,
  pageSize,
  totalPages,
  totalTransactions,
  onExpandedRowChange,
  onDeleteTargetChange,
  onCurrentPageChange,
  onPageSizeChange,
}: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#081018]/90">
      {/* MOBILE */}
      <div className="lg:hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-14 text-sm text-zinc-500">
            <Loader2 size={18} className="animate-spin" />
            Carregando transações...
          </div>
        ) : transactions.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <p className="text-sm text-zinc-400">
              Nenhuma transação encontrada
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Ajuste os filtros ou adicione uma transação.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {transactions.map((transaction) => {
              const items = itemsByTransaction[transaction.id] ?? [];
              const isExpanded = expandedRow === transaction.id;
              const isIncome = transaction.type === "income";

              const itemTotal = items.reduce(
                (sum, item) => sum + Number(item.amount),
                0
              );

              const hasIncomeItems = items.some(
                (item) => item.item_type === "income"
              );

              const isPaidCardInvoice =
                transaction.source === "caixa" &&
                transaction.type === "expense" &&
                normalizeText(transaction.description ?? "").includes(
                  "pagamento fatura"
                ) &&
                items.length > 0;

              const sourceLabel =
                transaction.credit_cards?.[0]?.name ??
                getSourceLabel(transaction.source);

              return (
                <div key={transaction.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-zinc-100">
                        {transaction.description}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDate(transaction.transaction_date)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onDeleteTargetChange(transaction)
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
                      aria-label="Excluir transação"
                      title="Excluir transação"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-zinc-600">
                        Origem
                      </p>

                      <p className="mt-1 truncate text-sm text-zinc-300">
                        {sourceLabel}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-zinc-600">
                        Tipo
                      </p>

                      <div
                        className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${isIncome
                            ? "text-emerald-300"
                            : "text-red-300"
                          }`}
                      >
                        {isIncome ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )}

                        {isIncome ? "Receita" : "Despesa"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-4 border-t border-white/5 pt-4">
                    <div className="min-w-0">
                      {items.length > 0 ? (
                        <>
                          <p className="text-xs text-zinc-500">
                            {hasIncomeItems
                              ? `${items.length} rendimentos`
                              : isPaidCardInvoice
                                ? `${items.length} compras da fatura`
                                : `${items.length} compras`}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              onExpandedRowChange(
                                isExpanded
                                  ? null
                                  : transaction.id
                              )
                            }
                            className="mt-1 text-xs text-cyan-300 transition hover:text-cyan-200"
                          >
                            {isExpanded
                              ? "Ocultar detalhes"
                              : isPaidCardInvoice
                                ? "Ver detalhes da fatura"
                                : "Ver detalhes"}
                          </button>
                        </>
                      ) : (
                        <p className="text-xs text-zinc-600">
                          Sem detalhes
                        </p>
                      )}
                    </div>

                    <strong
                      className={`shrink-0 whitespace-nowrap text-base font-semibold ${isIncome
                          ? "text-emerald-300"
                          : "text-red-300"
                        }`}
                    >
                      {formatBRL(Number(transaction.amount))}
                    </strong>
                  </div>

                  {isExpanded && items.length > 0 && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                      <div className="border-b border-white/10 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Detalhes
                        </p>
                      </div>

                      <div className="divide-y divide-white/5">
                        {items.map((item) => (
                          <div
                            key={`${item.item_type}-${item.id}`}
                            className="p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="break-words text-sm text-zinc-200">
                                  {item.description}
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                  {formatDate(item.item_date)}
                                </p>
                              </div>

                              <strong
                                className={`shrink-0 whitespace-nowrap text-sm ${hasIncomeItems
                                    ? "text-emerald-300"
                                    : "text-zinc-200"
                                  }`}
                              >
                                {formatBRL(Number(item.amount))}
                              </strong>
                            </div>

                            {!hasIncomeItems &&
                              item.installment && (
                                <div className="mt-3">
                                  <span
                                    className={`rounded-full border px-2 py-1 text-xs ${getInstallmentClasses(
                                      item.installment
                                    )}`}
                                  >
                                    {item.installment}
                                  </span>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-3">
                        <span className="text-sm font-medium text-zinc-400">
                          Total
                        </span>

                        <strong className="text-sm font-semibold text-cyan-300">
                          {formatBRL(itemTotal)}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <table className="hidden w-full table-fixed border-collapse text-sm lg:table">
        <thead className="bg-white/[0.02] text-zinc-500">
          <tr>
            <th className="w-[130px] px-5 py-3 text-left font-medium">
              Data
            </th>

            <th className="w-[32%] px-5 py-3 text-left font-medium">
              Descrição
            </th>

            <th className="w-[160px] px-5 py-3 text-left font-medium">
              Origem
            </th>

            <th className="w-[170px] px-5 py-3 text-left font-medium">
              Detalhes
            </th>

            <th className="w-[140px] px-5 py-3 text-left font-medium">
              Tipo
            </th>

            <th className="w-[160px] px-5 py-3 text-right font-medium">
              Valor
            </th>

            <th className="w-[90px] px-5 py-3 text-right font-medium">
              Ações
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="px-5 py-14 text-center">
                <div className="flex items-center justify-center gap-2 text-zinc-500">
                  <Loader2 size={18} className="animate-spin" />
                  Carregando transações...
                </div>
              </td>
            </tr>
          ) : transactions.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-14 text-center">
                <p className="text-sm text-zinc-400">
                  Nenhuma transação encontrada
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Ajuste os filtros ou adicione uma transação.
                </p>
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => {
              const items =
                itemsByTransaction[transaction.id] ?? [];

              const isExpanded =
                expandedRow === transaction.id;

              const isIncome =
                transaction.type === "income";

              const itemTotal = items.reduce(
                (sum, item) => sum + Number(item.amount),
                0
              );

              const hasIncomeItems = items.some(
                (item) => item.item_type === "income"
              );

              const isPaidCardInvoice =
                transaction.source === "caixa" &&
                transaction.type === "expense" &&
                normalizeText(
                  transaction.description ?? ""
                ).includes("pagamento fatura") &&
                items.length > 0;

              return (
                <React.Fragment key={transaction.id}>
                  <tr className="border-t border-white/5 transition hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-zinc-400">
                      {formatDate(
                        transaction.transaction_date
                      )}
                    </td>

                    <td className="truncate px-5 py-3 text-zinc-200">
                      {transaction.description}
                    </td>

                    <td className="px-5 py-3 text-zinc-400">
                      {transaction.credit_cards?.[0]?.name ??
                        getSourceLabel(
                          transaction.source
                        )}
                    </td>

                    <td className="px-5 py-3">
                      {items.length > 0 ? (
                        <div>
                          <p className="text-xs text-zinc-400">
                            {hasIncomeItems
                              ? `${items.length} rendimentos`
                              : isPaidCardInvoice
                                ? `${items.length} compras da fatura`
                                : `${items.length} compras`}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              onExpandedRowChange(
                                isExpanded
                                  ? null
                                  : transaction.id
                              )
                            }
                            className="mt-1 text-xs text-cyan-300 transition hover:text-cyan-200"
                          >
                            {isExpanded
                              ? "Ocultar detalhes"
                              : isPaidCardInvoice
                                ? "Ver detalhes da fatura"
                                : "Ver detalhes"}
                          </button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-5 py-3">
                      <div
                        className={`flex items-center gap-2 text-sm font-medium ${isIncome
                            ? "text-emerald-300"
                            : "text-red-300"
                          }`}
                      >
                        {isIncome ? (
                          <ArrowUp size={15} />
                        ) : (
                          <ArrowDown size={15} />
                        )}

                        {isIncome
                          ? "Receita"
                          : "Despesa"}
                      </div>
                    </td>

                    <td
                      className={`px-5 py-3 text-right font-medium ${isIncome
                          ? "text-emerald-300"
                          : "text-red-300"
                        }`}
                    >
                      {formatBRL(
                        Number(transaction.amount)
                      )}
                    </td>

                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onDeleteTargetChange(transaction)
                        }
                        className="rounded-xl border border-red-400/20 bg-red-400/10 p-2 text-red-300 transition hover:bg-red-400/20"
                        aria-label="Excluir transação"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>

                  {isExpanded && items.length > 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="bg-black/20 px-5 py-4"
                      >
                        <div className="overflow-hidden rounded-2xl border border-white/10">
                          <table className="w-full text-sm">
                            <thead className="bg-white/[0.03] text-zinc-500">
                              <tr>
                                <th className="px-4 py-3 text-left">
                                  Data
                                </th>

                                <th className="px-4 py-3 text-left">
                                  Descrição
                                </th>

                                {!hasIncomeItems && (
                                  <th className="px-4 py-3 text-left">
                                    Parcela
                                  </th>
                                )}

                                <th className="px-4 py-3 text-right">
                                  Valor
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {items.map((item) => (
                                <tr
                                  key={`${item.item_type}-${item.id}`}
                                  className="border-t border-white/5"
                                >
                                  <td className="px-4 py-3 text-zinc-400">
                                    {formatDate(
                                      item.item_date
                                    )}
                                  </td>

                                  <td className="px-4 py-3 text-zinc-200">
                                    {item.description}
                                  </td>

                                  {!hasIncomeItems && (
                                    <td className="px-4 py-3">
                                      {item.installment ? (
                                        <span
                                          className={`rounded-full border px-2 py-1 text-xs ${getInstallmentClasses(
                                            item.installment
                                          )}`}
                                        >
                                          {
                                            item.installment
                                          }
                                        </span>
                                      ) : (
                                        "-"
                                      )}
                                    </td>
                                  )}

                                  <td
                                    className={`px-4 py-3 text-right ${hasIncomeItems
                                        ? "text-emerald-300"
                                        : "text-zinc-200"
                                      }`}
                                  >
                                    {formatBRL(
                                      Number(item.amount)
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>

                            <tfoot>
                              <tr className="border-t border-white/10 bg-white/[0.02]">
                                <td
                                  colSpan={
                                    hasIncomeItems ? 2 : 3
                                  }
                                  className="px-4 py-3 text-right font-medium text-zinc-300"
                                >
                                  Total
                                </td>

                                <td className="px-4 py-3 text-right font-semibold text-cyan-300">
                                  {formatBRL(itemTotal)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>

      {/* PAGINAÇÃO */}
      <div className="flex flex-col gap-4 border-t border-white/10 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <p className="text-center text-sm text-zinc-500 lg:text-left">
          Mostrando{" "}
          <span className="text-zinc-300">
            {totalTransactions === 0
              ? 0
              : (currentPage - 1) * pageSize + 1}
          </span>{" "}
          a{" "}
          <span className="text-zinc-300">
            {Math.min(
              currentPage * pageSize,
              totalTransactions
            )}
          </span>{" "}
          de{" "}
          <span className="text-zinc-300">
            {totalTransactions}
          </span>{" "}
          transações
        </p>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() =>
              onCurrentPageChange((current) =>
                Math.max(1, current - 1)
              )
            }
            disabled={currentPage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/5 disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex h-10 min-w-[44px] items-center justify-center rounded-xl border border-cyan-400 bg-cyan-400/10 px-4 font-medium text-cyan-300">
            {currentPage}
          </div>

          <button
            type="button"
            onClick={() =>
              onCurrentPageChange((current) =>
                Math.min(totalPages, current + 1)
              )
            }
            disabled={currentPage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/5 disabled:opacity-40"
            aria-label="Próxima página"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <select
          value={pageSize}
          onChange={(event) =>
            onPageSizeChange(Number(event.target.value))
          }
          className="h-10 w-full rounded-xl border border-white/10 bg-[#081018] px-4 text-sm text-white outline-none lg:w-[150px]"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option} por página
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}