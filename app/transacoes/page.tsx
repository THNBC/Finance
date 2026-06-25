"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Transaction = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  source: string | null;
  card_id: string | null;
  created_at: string;
  credit_cards?: {
    name: string;
  }[];
};

type TransactionItem = {
  id: string;
  transaction_id: string;
  item_date: string | null;
  description: string;
  amount: number;
  installment: string | null;
  created_at: string;
  item_type: "credit_card" | "income";
};

const pageSizeOptions = [10, 20, 50];

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

function getSourceLabel(source?: string | null) {
  if (source === "inter") return "Inter";
  if (source === "mercadopago") return "Mercado Pago";
  if (source === "caixa") return "Caixa";
  return "Manual";
}

function getInstallmentClasses(installment: string) {
  const [current, total] = installment.split("/").map(Number);

  if (!current || !total) {
    return "border-zinc-400/20 bg-zinc-400/10 text-zinc-300";
  }

  const progress = current / total;

  if (current === total) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (progress >= 0.75) {
    return "border-lime-400/20 bg-lime-400/10 text-lime-300";
  }

  if (progress >= 0.5) {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
  }

  if (progress >= 0.25) {
    return "border-orange-400/20 bg-orange-400/10 text-orange-300";
  }

  return "border-red-400/20 bg-red-400/10 text-red-300";
}

export default function TransacoesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [itemsByTransaction, setItemsByTransaction] = useState<
    Record<string, TransactionItem[]>
  >({});

  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "caixa" | "inter" | "mercadopago" | "manual"
  >("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [clearHistoryLoading, setClearHistoryLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, sourceFilter, startDate, endDate, pageSize]);

  async function loadData() {
    setLoading(true);

    const { data: transactionData, error: transactionError } = await supabase
      .from("transactions")
      .select(
        `
        id,
        transaction_date,
        description,
        amount,
        type,
        source,
        card_id,
        created_at,
        credit_cards (
          name
        )
      `
      )
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (transactionError) {
      console.error(transactionError);
      setLoading(false);
      return;
    }

    const parsedTransactions: Transaction[] = (transactionData ?? []).map(
      (transaction: any) => ({
        ...transaction,
        amount: Number(transaction.amount),
        credit_cards: Array.isArray(transaction.credit_cards)
          ? transaction.credit_cards
          : transaction.credit_cards
          ? [transaction.credit_cards]
          : [],
      })
    );

    const transactionIds = parsedTransactions.map((item) => item.id);

    if (transactionIds.length === 0) {
      setTransactions(parsedTransactions);
      setItemsByTransaction({});
      setLoading(false);
      return;
    }

    const { data: cardItemsData, error: cardItemsError } = await supabase
      .from("credit_card_items")
      .select("*")
      .in("transaction_id", transactionIds)
      .order("item_date", { ascending: true });

    if (cardItemsError) {
      console.error(cardItemsError);
    }

    const cardItems: TransactionItem[] = (cardItemsData ?? []).map(
      (item: any) => ({
        id: item.id,
        transaction_id: item.transaction_id,
        item_date: item.item_date,
        description: item.description ?? item.title ?? "-",
        amount: Number(item.amount),
        installment: item.installment ?? null,
        created_at: item.created_at,
        item_type: "credit_card",
      })
    );

    const { data: incomeItemsData, error: incomeItemsError } = await supabase
      .from("transaction_items")
      .select("*")
      .in("transaction_id", transactionIds)
      .order("item_date", { ascending: true });

    if (incomeItemsError) {
      console.error(incomeItemsError);
    }

    const incomeItems: TransactionItem[] = (incomeItemsData ?? []).map(
      (item: any) => ({
        id: item.id,
        transaction_id: item.transaction_id,
        item_date: item.item_date,
        description: item.title ?? item.description ?? "-",
        amount: Number(item.amount),
        installment: null,
        created_at: item.created_at,
        item_type: "income",
      })
    );

    const allItems = [...cardItems, ...incomeItems];

    const groupedItems = allItems.reduce(
      (acc: Record<string, TransactionItem[]>, item) => {
        if (!acc[item.transaction_id]) {
          acc[item.transaction_id] = [];
        }

        acc[item.transaction_id].push(item);

        return acc;
      },
      {}
    );

    setTransactions(parsedTransactions);
    setItemsByTransaction(groupedItems);
    setLoading(false);
  }

  async function deleteTransaction() {
    if (!deleteTarget) return;

    const { error: cardItemsError } = await supabase
      .from("credit_card_items")
      .delete()
      .eq("transaction_id", deleteTarget.id);

    if (cardItemsError) {
      console.error(cardItemsError);
    }

    const { error: incomeItemsError } = await supabase
      .from("transaction_items")
      .delete()
      .eq("transaction_id", deleteTarget.id);

    if (incomeItemsError) {
      console.error(incomeItemsError);
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      alert("Erro ao excluir transação.");
      console.error(error);
      return;
    }

    setDeleteTarget(null);
    setExpandedRow(null);
    await loadData();
  }

  async function clearHistory() {
    try {
      setClearHistoryLoading(true);

      const { error: cardItemsError } = await supabase
        .from("credit_card_items")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (cardItemsError) {
        console.error(cardItemsError);
        alert("Erro ao limpar os itens das faturas.");
        return;
      }

      const { error: transactionItemsError } = await supabase
        .from("transaction_items")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (transactionItemsError) {
        console.error(transactionItemsError);
        alert("Erro ao limpar os detalhes das transações.");
        return;
      }

      const { error: transactionsError } = await supabase
        .from("transactions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (transactionsError) {
        console.error(transactionsError);
        alert("Erro ao limpar o histórico de transações.");
        return;
      }

      setTransactions([]);
      setItemsByTransaction({});
      setExpandedRow(null);
      setDeleteTarget(null);
      setClearHistoryOpen(false);
      setCurrentPage(1);

      await loadData();
    } finally {
      setClearHistoryLoading(false);
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const sourceLabel =
        transaction.credit_cards?.[0]?.name ?? getSourceLabel(transaction.source);

      const matchesSearch =
        !search.trim() ||
        transaction.description
          .toLowerCase()
          .includes(search.trim().toLowerCase()) ||
        sourceLabel.toLowerCase().includes(search.trim().toLowerCase());

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
  }, [transactions, search, typeFilter, sourceFilter, startDate, endDate]);

  const totalIncome = filteredTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpense = filteredTransactions
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
      <section className="w-full px-8 py-7">
        <header className="mb-7 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Transações
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Veja as movimentações importadas dos seus PDFs.
            </p>
          </div>

          <Link
            href="/importar"
            className="flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
          >
            <FileUp size={18} />
            Importar PDF
          </Link>
        </header>

        <section className="mb-5 grid grid-cols-4 gap-4">
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

        <section className="mb-5 rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
          <div className="grid grid-cols-[1fr_160px_180px_160px_160px] gap-3">
            <div className="flex h-11 items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4">
              <Search size={17} className="text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar transação..."
                className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "all" | "income" | "expense")
              }
              className="h-11 rounded-2xl border border-white/10 bg-[#081018] px-4 text-sm text-zinc-300 outline-none"
            >
              <option value="all">Todos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(
                  event.target.value as
                    | "all"
                    | "caixa"
                    | "inter"
                    | "mercadopago"
                    | "manual"
                )
              }
              className="h-11 rounded-2xl border border-white/10 bg-[#081018] px-4 text-sm text-zinc-300 outline-none"
            >
              <option value="all">Todas origens</option>
              <option value="caixa">Caixa</option>
              <option value="inter">Inter</option>
              <option value="mercadopago">Mercado Pago</option>
              <option value="manual">Manual</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-[#081018] px-4 text-sm text-zinc-300 outline-none"
            />

            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-[#081018] px-4 text-sm text-zinc-300 outline-none"
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#081018]/90">
          <table className="w-full table-fixed border-collapse text-sm">
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
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-sm text-zinc-400">
                      Nenhuma transação encontrada
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Ajuste os filtros ou importe um PDF.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((transaction) => {
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

                  return (
                    <React.Fragment key={transaction.id}>
                      <tr className="border-t border-white/5 transition hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-zinc-400">
                          {formatDate(transaction.transaction_date)}
                        </td>

                        <td className="truncate px-5 py-3 text-zinc-200">
                          {transaction.description}
                        </td>

                        <td className="px-5 py-3 text-zinc-400">
                          {transaction.credit_cards?.[0]?.name ??
                            getSourceLabel(transaction.source)}
                        </td>

                        <td className="px-5 py-3">
                          {items.length > 0 ? (
                            <div>
                              <p className="text-xs text-zinc-400">
                                {hasIncomeItems
                                  ? `${items.length} rendimentos`
                                  : `${items.length} compras`}
                              </p>

                              <button
                                onClick={() =>
                                  setExpandedRow(
                                    isExpanded ? null : transaction.id
                                  )
                                }
                                className="mt-1 text-xs text-cyan-300 transition hover:text-cyan-200"
                              >
                                {isExpanded
                                  ? "Ocultar detalhes"
                                  : "Ver detalhes"}
                              </button>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-5 py-3">
                          <div
                            className={`flex items-center gap-2 text-sm font-medium ${
                              isIncome ? "text-emerald-300" : "text-red-300"
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUp size={15} />
                            ) : (
                              <ArrowDown size={15} />
                            )}
                            {isIncome ? "Receita" : "Despesa"}
                          </div>
                        </td>

                        <td
                          className={`px-5 py-3 text-right font-medium ${
                            isIncome ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {formatBRL(Number(transaction.amount))}
                        </td>

                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setDeleteTarget(transaction)}
                            className="rounded-xl border border-red-400/20 bg-red-400/10 p-2 text-red-300 transition hover:bg-red-400/20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && items.length > 0 && (
                        <tr>
                          <td colSpan={7} className="bg-black/20 px-5 py-4">
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
                                        {formatDate(item.item_date)}
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
                                              {item.installment}
                                            </span>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                      )}

                                      <td
                                        className={`px-4 py-3 text-right ${
                                          hasIncomeItems
                                            ? "text-emerald-300"
                                            : "text-zinc-200"
                                        }`}
                                      >
                                        {formatBRL(Number(item.amount))}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>

                                <tfoot>
                                  <tr className="border-t border-white/10 bg-white/[0.02]">
                                    <td
                                      colSpan={hasIncomeItems ? 2 : 3}
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

          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
            <p className="text-sm text-zinc-500">
              Mostrando{" "}
              <span className="text-zinc-300">
                {filteredTransactions.length === 0
                  ? 0
                  : (currentPage - 1) * pageSize + 1}
              </span>{" "}
              a{" "}
              <span className="text-zinc-300">
                {Math.min(currentPage * pageSize, filteredTransactions.length)}
              </span>{" "}
              de{" "}
              <span className="text-zinc-300">
                {filteredTransactions.length}
              </span>{" "}
              transações
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentPage((current) => Math.max(1, current - 1))
                }
                disabled={currentPage === 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex h-10 min-w-[44px] items-center justify-center rounded-xl border border-cyan-400 bg-cyan-400/10 px-4 font-medium text-cyan-300">
                {currentPage}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={currentPage === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-10 w-[150px] rounded-xl border border-white/10 bg-[#081018] px-4 text-sm text-white outline-none"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} por página
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="mt-5 flex justify-start">
          <button
            onClick={() => setClearHistoryOpen(true)}
            disabled={transactions.length === 0}
            className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={16} />
            Limpar histórico
          </button>
        </div>
      </section>

      {clearHistoryOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#081018] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Limpar histórico?</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Essa ação vai apagar todas as transações e todos os detalhes
                  vinculados.
                </p>
              </div>

              <button
                onClick={() => setClearHistoryOpen(false)}
                disabled={clearHistoryLoading}
                className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
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
                onClick={() => setClearHistoryOpen(false)}
                disabled={clearHistoryLoading}
                className="h-11 flex-1 rounded-2xl border border-white/10 text-sm text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                onClick={clearHistory}
                disabled={clearHistoryLoading}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {clearHistoryLoading && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Limpar tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#081018] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Excluir transação?</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Essa ação também remove os detalhes vinculados.
                </p>
              </div>

              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="text-sm text-zinc-300">
                {deleteTarget.description}
              </p>

              <p className="mt-2 font-semibold text-red-300">
                {formatBRL(Number(deleteTarget.amount))}
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-11 flex-1 rounded-2xl border border-white/10 text-sm text-zinc-300 transition hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={deleteTransaction}
                className="h-11 flex-1 rounded-2xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  title,
  value,
  variant,
}: {
  title: string;
  value: string;
  variant: "green" | "red" | "blue";
}) {
  const variants = {
    green: "text-emerald-300",
    red: "text-red-300",
    blue: "text-cyan-300",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
      <p className="text-sm text-zinc-500">{title}</p>
      <strong
        className={`mt-3 block text-2xl font-semibold ${variants[variant]}`}
      >
        {value}
      </strong>
    </div>
  );
}
