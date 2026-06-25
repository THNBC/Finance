"use client";

import React from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";

import { ImportedTransaction } from "@/lib/import/types";
import {
  cleanDescription,
  formatBRL,
  getInstallmentClasses,
  getSourceLabel,
  isIncomeGroup,
} from "@/lib/import/helpers";

type Props = {
  transactions: ImportedTransaction[];
  source: string;
  expandedRow: number | null;
  onToggleExpanded: (index: number) => void;
  onAddManual: () => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
};

export default function PreviewTable({
  transactions,
  source,
  expandedRow,
  onToggleExpanded,
  onAddManual,
  onEdit,
  onRemove,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#081018]/90">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h3 className="text-lg font-medium">Prévia da importação</h3>
          <p className="mt-1 text-xs text-zinc-500">
            As transações aparecerão aqui antes de serem salvas.
          </p>
        </div>

        <button
          onClick={onAddManual}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
        >
          <Plus size={16} />
          Adicionar manualmente
        </button>
      </div>

      <div className="overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-white/[0.02] text-zinc-500">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Data</th>
              <th className="px-5 py-3 text-left font-medium">Descrição</th>
              <th className="px-5 py-3 text-left font-medium">Tipo</th>
              <th className="px-5 py-3 text-left font-medium">Origem</th>
              <th className="px-5 py-3 text-left font-medium">Detalhes</th>
              <th className="px-5 py-3 text-right font-medium">Valor</th>
              <th className="px-5 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>

          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center">
                  <p className="text-sm text-zinc-400">
                    Nenhuma transação carregada
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Selecione um JSON ou adicione uma movimentação manual.
                  </p>
                </td>
              </tr>
            ) : (
              transactions.map((transaction, index) => {
                const itemTotal =
                  transaction.items?.reduce(
                    (sum, item) => sum + Number(item.amount),
                    0
                  ) ?? 0;

                const hasItems = Boolean(transaction.items?.length);
                const isIncomeGrouped = isIncomeGroup(transaction);

                return (
                  <React.Fragment
                    key={`${transaction.date}-${cleanDescription(
                      transaction.description
                    )}-${index}`}
                  >
                    <tr className="border-t border-white/5">
                      <td className="px-5 py-3 text-zinc-400">
                        {transaction.date}
                      </td>

                      <td className="px-5 py-3 text-zinc-200">
                        {cleanDescription(transaction.description)}
                      </td>

                      <td className="px-5 py-3 text-zinc-400">
                        {transaction.type === "income" ? "Receita" : "Despesa"}
                      </td>

                      <td className="px-5 py-3 text-zinc-400">
                        {getSourceLabel(transaction.source ?? source)}
                      </td>

                      <td className="px-5 py-3">
                        {hasItems ? (
                          <div>
                            <p className="text-xs text-zinc-400">
                              {isIncomeGrouped
                                ? `${transaction.items?.length} rendimentos`
                                : `${transaction.items?.length} compras`}
                            </p>

                            <button
                              onClick={() => onToggleExpanded(index)}
                              className="mt-1 text-xs text-cyan-300 transition hover:text-cyan-200"
                            >
                              {expandedRow === index
                                ? "Ocultar detalhes"
                                : "Ver detalhes"}
                            </button>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td
                        className={`px-5 py-3 text-right font-medium ${
                          transaction.amount >= 0
                            ? "text-emerald-300"
                            : "text-red-300"
                        }`}
                      >
                        {formatBRL(transaction.amount)}
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onEdit(index)}
                            className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:text-cyan-300"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => onRemove(index)}
                            className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-red-400/40 hover:text-red-300"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedRow === index && hasItems && (
                      <tr>
                        <td colSpan={7} className="bg-black/20 px-5 py-4">
                          <div className="overflow-hidden rounded-2xl border border-white/10">
                            <table className="w-full text-sm">
                              <thead className="bg-white/[0.03]">
                                <tr>
                                  <th className="px-4 py-3 text-left">Data</th>
                                  <th className="px-4 py-3 text-left">
                                    Descrição
                                  </th>

                                  {!isIncomeGrouped && (
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
                                {transaction.items?.map((item, itemIndex) => (
                                  <tr
                                    key={`${item.date}-${item.description}-${itemIndex}`}
                                    className="border-t border-white/5"
                                  >
                                    <td className="px-4 py-3 text-zinc-400">
                                      {item.date}
                                    </td>

                                    <td className="px-4 py-3 text-zinc-200">
                                      {cleanDescription(item.description)}
                                    </td>

                                    {!isIncomeGrouped && (
                                      <td className="px-4 py-3">
                                        {item.installment ? (
                                          <span
                                            className={`rounded-full border px-2 py-1 text-xs ${getInstallmentClasses(
                                              item.installment
                                            )}`}
                                          >
                                            {item.installment}
                                          </span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>
                                    )}

                                    <td
                                      className={`px-4 py-3 text-right ${
                                        isIncomeGrouped
                                          ? "text-emerald-300"
                                          : "text-zinc-200"
                                      }`}
                                    >
                                      {formatBRL(item.amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>

                              <tfoot>
                                <tr className="border-t border-white/10 bg-white/[0.02]">
                                  <td
                                    colSpan={isIncomeGrouped ? 2 : 3}
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
      </div>
    </div>
  );
}