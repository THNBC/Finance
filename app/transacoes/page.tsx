"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { FiltersCard } from "@/components/transacoes/FiltersCard";
import { SummaryCard } from "@/components/transacoes/SummaryCard";
import { TransactionsTable } from "@/components/transacoes/TransactionsTable";

import { ClearHistoryModal } from "@/components/transacoes/modals/ClearHistoryModal";
import { DeleteTransactionModal } from "@/components/transacoes/modals/DeleteTransactionModal";
import { useTransacoesActions } from "@/hooks/transacoes/useTransacoesActions";
import { useTransacoesData } from "@/hooks/transacoes/useTransacoesData";
import type {
  TransactionSourceFilter,
  TransactionTypeFilter,
} from "@/lib/transacoes/types";
import { formatBRL, getSourceLabel } from "@/lib/transacoes/utils";

export default function TransacoesPage() {
  const {
    loading,
    transactions,
    setTransactions,
    itemsByTransaction,
    setItemsByTransaction,
    loadData,
  } = useTransacoesData();

  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] =
    useState<TransactionTypeFilter>("all");

  const [sourceFilter, setSourceFilter] =
    useState<TransactionSourceFilter>("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const actions = useTransacoesActions({
    reload: loadData,
    setTransactions,
    setItemsByTransaction,
    setExpandedRow,
    setCurrentPage,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, sourceFilter, startDate, endDate, pageSize]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const sourceLabel =
        transaction.credit_cards?.[0]?.name ??
        getSourceLabel(transaction.source);

      const matchesSearch =
        !search.trim() ||
        transaction.description
          .toLowerCase()
          .includes(search.trim().toLowerCase()) ||
        sourceLabel
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter;

      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "manual"
          ? !transaction.source || transaction.source === "unknown"
          : transaction.source === sourceFilter);

      const matchesStartDate =
        !startDate || transaction.transaction_date >= startDate;

      const matchesEndDate =
        !endDate || transaction.transaction_date <= endDate;

      return (
        matchesSearch &&
        matchesType &&
        matchesSource &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    transactions,
    search,
    typeFilter,
    sourceFilter,
    startDate,
    endDate,
  ]);

  const balanceTransactions = filteredTransactions.filter(
    (transaction) => transaction.source === "caixa"
  );

  const totalIncome = balanceTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpense = balanceTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);

  const balance = totalIncome - totalExpense;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize)
  );

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <main className="min-h-screen w-full text-white">
      <section className="w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <header className="mb-7">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Transações
          </h2>

          <p className="mt-1 hidden text-sm text-zinc-500 lg:block">
            Veja e gerencie suas movimentações financeiras.
          </p>
        </header>

        <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Receitas"
            value={formatBRL(totalIncome)}
            variant="green"
          />

          <SummaryCard
            title="Despesas"
            value={formatBRL(totalExpense)}
            variant="red"
          />

          <SummaryCard
            title="Saldo"
            value={formatBRL(balance)}
            variant={balance >= 0 ? "green" : "red"}
          />

          <SummaryCard
            title="Transações"
            value={String(filteredTransactions.length)}
            variant="blue"
          />
        </section>

        <FiltersCard
          search={search}
          typeFilter={typeFilter}
          sourceFilter={sourceFilter}
          startDate={startDate}
          endDate={endDate}
          onSearchChange={setSearch}
          onTypeFilterChange={setTypeFilter}
          onSourceFilterChange={setSourceFilter}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        <TransactionsTable
          loading={loading}
          transactions={paginatedTransactions}
          itemsByTransaction={itemsByTransaction}
          expandedRow={expandedRow}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          totalTransactions={filteredTransactions.length}
          onExpandedRowChange={setExpandedRow}
          onDeleteTargetChange={actions.setDeleteTarget}
          onCurrentPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />

        <div className="mt-5 flex">
          <button
            onClick={() => actions.setClearHistoryOpen(true)}
            disabled={transactions.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            <Trash2 size={16} />
            Limpar histórico
          </button>
        </div>
      </section>



      <ClearHistoryModal
        open={actions.clearHistoryOpen}
        loading={actions.clearHistoryLoading}
        onClose={() => actions.setClearHistoryOpen(false)}
        onConfirm={actions.clearHistory}
      />

      <DeleteTransactionModal
        transaction={actions.deleteTarget}
        onClose={() => actions.setDeleteTarget(null)}
        onConfirm={actions.deleteTransaction}
      />
    </main>
  );
}