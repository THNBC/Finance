"use client";

import type { Transaction } from "@/lib/dashboard/types";
import {
  formatBRL,
  formatDateBR,
  getSourceLabel,
} from "@/lib/dashboard/utils";

type Props = {
  transactions: Transaction[];
  onAddTransaction: () => void;
};

export function RecentTransactions({
  transactions,
  onAddTransaction,
}: Props) {
  return (
    <section className="hidden rounded-3xl border border-white/10 bg-[#081018]/90 shadow-[0_0_40px_rgba(0,0,0,0.2)] lg:block">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h3 className="text-lg font-medium">
            Movimentações recentes
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            Últimos lançamentos salvos no sistema
          </p>
        </div>

        <button
          type="button"
          onClick={onAddTransaction}
          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:border-emerald-400/40 hover:text-emerald-300"
        >
          Adicionar transação
        </button>
      </div>

      <div className="overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-white/[0.02] text-zinc-500">
            <tr>
              <th className="px-5 py-3 text-left font-medium">
                Data
              </th>
              <th className="px-5 py-3 text-left font-medium">
                Descrição
              </th>
              <th className="px-5 py-3 text-left font-medium">
                Origem
              </th>
              <th className="px-5 py-3 text-left font-medium">
                Tipo
              </th>
              <th className="px-5 py-3 text-right font-medium">
                Valor
              </th>
            </tr>
          </thead>

          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-14 text-center"
                >
                  <p className="text-sm text-zinc-400">
                    Nenhuma movimentação encontrada
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Adicione sua primeira transação para começar.
                  </p>
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-t border-white/5 transition hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 text-zinc-400">
                    {formatDateBR(transaction.transaction_date)}
                  </td>

                  <td className="px-5 py-3 text-zinc-200">
                    {transaction.description}
                  </td>

                  <td className="px-5 py-3 text-zinc-400">
                    {getSourceLabel(transaction.source)}
                  </td>

                  <td className="px-5 py-3 text-zinc-400">
                    {transaction.type === "income"
                      ? "Receita"
                      : "Despesa"}
                  </td>

                  <td
                    className={`px-5 py-3 text-right font-medium ${
                      Number(transaction.amount) >= 0
                        ? "text-emerald-300"
                        : "text-red-300"
                    }`}
                  >
                    {formatBRL(Number(transaction.amount))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}