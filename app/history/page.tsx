"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Coins,
  CreditCard,
  Download,
  Dumbbell,
  Fuel,
  HandCoins,
  Stethoscope,
  Landmark,
  Repeat,
  MoreVertical,
  Plus,
  QrCode,
  RefreshCcw,
  Search,
  ShoppingCart,
  Trash2,
  Utensils,
  Wallet,
  Wifi,
  Smartphone,
  Wrench,
  X,
  XCircle,
  Banknote,
  BanknoteArrowUp,
  PlaySquare,

} from "lucide-react";
import Image from "next/image";
import AddTransactionModal from "@/components/AddTransactionModal";
import { useTransactions, type Transaction } from "@/hooks/useTransactions";
import { supabase } from "@/lib/supabase";

type TransactionWithPayment = Transaction & {
  payment_method?: string | null;
};

const categoryIcons: Record<string, any> = {
  Fatura: CreditCard,
  Pix: QrCode,
  Compras: ShoppingCart,
  Alimentação: Utensils,
  Academia: Dumbbell,
  Streaming: PlaySquare,
  Assinatura: Repeat,
  Combustível: Fuel,
  Dentista: Stethoscope,
  "Manutenção carro": Wrench,
  Salário: HandCoins,
  Transferência: RefreshCcw,
  "Bônus salário": BanknoteArrowUp,
  "Crédito juros": Coins,
  Dinheiro: Banknote,
  "Conta corrente": Landmark,
  Receita: CircleDollarSign,
  Outros: Wallet,
  Internet: Wifi,
  "Recarga de celular": Smartphone,

};

const categoryColors: Record<string, string> = {
  Fatura: "red",
  Pix: "emerald",
  Compras: "purple",
  iFood: "amber",
  Alimentação: "amber",
  Academia: "blue",
  Streaming: "pink",
  Assinatura: "yellow",
  Combustível: "cyan",
  Dentista: "teal",
  "Manutenção carro": "zinc",
  Salário: "emerald",
  Receita: "emerald",
  Transferência: "blue",
  "Bônus salário": "emerald",
  "Crédito juros": "indigo",
  Moradia: "purple",
  Outros: "emerald",
  Internet: "sky",
  "Recarga de celular": "lime",
};

function formatCurrency(value: number) {
  return Math.abs(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}


function formatPaymentMethod(method?: string | null) {
  if (!method) return "Conta principal";

  const methods: Record<string, string> = {
    credit_card: "Cartão de crédito",
    credit_card_invoice: "Débito",
    "Cartão de crédito": "Cartão de crédito",
    debit: "Cartão de débito",
    "Cartão de débito": "Cartão de débito",
    pix: "Pix",
    Pix: "Pix",
    cash: "Dinheiro",
    Dinheiro: "Dinheiro",
    bank_account: "Conta corrente",
    "Conta corrente": "Conta corrente",
    salary: "Salário",
    transfer: "Transferência",
    salary_bonus: "Bônus salário",
    interest_credit: "Crédito juros",
  };

  return methods[method] || method;
}

function getPaymentMethodIcon(method?: string | null) {
  const normalized = formatPaymentMethod(method);

  switch (normalized) {
    case "Pix":
      return QrCode;

    case "Cartão de crédito":
      return CreditCard;

    case "Cartão de débito":
      return CreditCard;

    case "Dinheiro":
      return Banknote;

    case "Conta corrente":
      return Landmark;

    case "Salário":
      return HandCoins;

    case "Transferência":
      return RefreshCcw;

    case "Bônus salário":
      return BanknoteArrowUp;

    case "Crédito juros":
      return Coins;

    default:
      return Landmark;
  }
}

function formatMonth(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatDay(date: string) {
  const today = new Date();
  const transactionDate = new Date(date + "T00:00:00");

  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const transactionOnly = new Date(
    transactionDate.getFullYear(),
    transactionDate.getMonth(),
    transactionDate.getDate()
  );

  const diffDays =
    (todayOnly.getTime() - transactionOnly.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";

  return transactionDate.toLocaleDateString("pt-BR", {
    weekday: "long",
  });
}

function categoryStyle(color: string) {
  const styles: Record<string, string> = {
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    amber: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    purple: "border-purple-500/50 bg-purple-500/10 text-purple-300",
    red: "border-red-500/50 bg-red-500/10 text-red-400",
    blue: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    pink: "border-pink-500/50 bg-pink-500/10 text-pink-400",
    yellow: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
    cyan: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
    teal: "border-teal-500/50 bg-teal-500/10 text-teal-400",
    zinc: "border-zinc-500/50 bg-zinc-500/10 text-zinc-300",
    indigo: "border-indigo-500/50 bg-indigo-500/10 text-indigo-400",
    sky: "border-sky-500/50 bg-sky-500/10 text-sky-400",
    lime: "border-lime-500/50 bg-lime-500/10 text-lime-400",
  };

  return styles[color] || styles.emerald;
}

function iconStyle(color: string) {
  const styles: Record<string, string> = {
    emerald: "bg-emerald-500 text-white",
    amber: "bg-amber-500 text-white",
    orange: "bg-orange-500 text-white",
    blue: "bg-blue-500 text-white",
    purple: "bg-purple-500 text-white",
    red: "bg-red-500 text-white",
    pink: "bg-pink-500 text-white",
    yellow: "bg-yellow-500 text-white",
    cyan: "bg-cyan-500 text-white",
    teal: "bg-teal-500 text-white",
    zinc: "bg-zinc-500 text-white",
    indigo: "bg-indigo-500 text-white",
    sky: "bg-sky-500 text-white",
    lime: "bg-lime-500 text-white",
  };

  return styles[color] || styles.emerald;
}


export default function HistoryPage() {
  const { transactions, loading, reload } = useTransactions();

  const [openModal, setOpenModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithPayment | null>(null);
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);
  const [invoiceTransactions, setInvoiceTransactions] = useState<Transaction[]>([]);
  const [invoiceCardName, setInvoiceCardName] = useState("");
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortField, setSortField] = useState<"date" | "title">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });

    setTimeout(() => {
      setToast(null);
    }, 2800);
  }
  async function openInvoiceDetails(transaction: TransactionWithPayment) {
    if (!transaction.card_id) return;

    const paidDate = new Date(transaction.transaction_date + "T00:00:00");

    const startDate = new Date(paidDate);
    startDate.setMonth(startDate.getMonth() - 1);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("card_id", transaction.card_id)
      .eq("payment_method", "credit_card")
      .neq("payment_method", "credit_card_invoice")
      .gte("transaction_date", startDate.toISOString().slice(0, 10))
      .lte("transaction_date", transaction.transaction_date)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.log("ERRO AO BUSCAR FATURA:", error);
      return;
    }

    setInvoiceTransactions((data ?? []) as Transaction[]);
    setInvoiceCardName(
      transaction.title.replace("Fatura do cartão ", "").replace(" paga", "")
    );
    setInvoiceDetailsOpen(true);
  }
  async function handleClearHistory() {
    const { data, error: fetchError } = await supabase
      .from("transactions")
      .select("id");

    if (fetchError) {
      showToast("error", "Erro ao buscar transações.");
      return;
    }

    if (!data || data.length === 0) {
      showToast("error", "Nenhuma transação encontrada.");
      return;
    }

    const ids = data.map((item) => item.id);

    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("id", ids);

    if (error) {
      console.log("ERRO AO LIMPAR HISTÓRICO:", error);
      showToast("error", "Erro ao limpar histórico.");
      return;
    }

    setClearHistoryOpen(false);

    await reload();

    showToast("success", "Histórico limpo com sucesso.");
  }
  const typedTransactions = transactions as TransactionWithPayment[];

  const categories = useMemo(() => {
    return Array.from(
      new Set(typedTransactions.map((item) => item.category || "Outros"))
    ).sort();
  }, [typedTransactions]);

  const paymentMethods = useMemo(() => {
    return Array.from(
      new Set(
        typedTransactions.map((item) =>
          formatPaymentMethod(item.payment_method)
        )
      )
    ).sort();
  }, [typedTransactions]);

  const filteredTransactions = useMemo(() => {
    return typedTransactions
      .filter((transaction) => {
        const transactionDate = new Date(
          transaction.transaction_date + "T00:00:00"
        );

        const amount = Number(transaction.amount);
        const category = transaction.category || "Outros";
        const paymentMethod = formatPaymentMethod(transaction.payment_method);

        if (transaction.payment_method === "credit_card") {
          const paidInvoiceExists = typedTransactions.some(
            (historyTransaction) =>
              historyTransaction.payment_method === "credit_card_invoice" &&
              historyTransaction.card_id === transaction.card_id &&
              historyTransaction.type === "expense"
          );

          if (paidInvoiceExists) {
            return false;
          }
        }

        if (
          search.trim() &&
          !transaction.title.toLowerCase().includes(search.trim().toLowerCase())
        ) {
          return false;
        }

        const now = new Date();

        const hasCustomPeriod = startDate || endDate;

        if (hasCustomPeriod) {
          if (startDate) {
            const start = new Date(startDate + "T00:00:00");

            if (transactionDate < start) {
              return false;
            }
          }

          if (endDate) {
            const end = new Date(endDate + "T23:59:59");

            if (transactionDate > end) {
              return false;
            }
          }
        } else {
          if (
            transactionDate.getMonth() !== now.getMonth() ||
            transactionDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        }

        if (minAmount && amount < Number(minAmount)) return false;
        if (maxAmount && amount > Number(maxAmount)) return false;

        if (typeFilter !== "all" && transaction.type !== typeFilter) {
          return false;
        }

        if (categoryFilter !== "all" && category !== categoryFilter) {
          return false;
        }

        if (paymentFilter !== "all" && paymentMethod !== paymentFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === "title") {
          const result = a.title.localeCompare(b.title);
          return sortDirection === "asc" ? result : -result;
        }

        const dateA = new Date(a.transaction_date + "T00:00:00").getTime();
        const dateB = new Date(b.transaction_date + "T00:00:00").getTime();

        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [
    typedTransactions,
    search,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    typeFilter,
    categoryFilter,
    paymentFilter,
    sortField,
    sortDirection,
  ]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  }, [filteredTransactions]);

  const balance = totalIncome - totalExpenses;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / itemsPerPage)
  );

  const visibleTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const groupedVisibleTransactions = useMemo(() => {
    const grouped = new Map<string, TransactionWithPayment[]>();

    visibleTransactions.forEach((transaction) => {
      const month = formatMonth(transaction.transaction_date);

      if (!grouped.has(month)) {
        grouped.set(month, []);
      }

      grouped.get(month)?.push(transaction);
    });

    return Array.from(grouped.entries());
  }, [visibleTransactions]);

  const visiblePages = useMemo(() => {
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

    if (totalPages <= 5) return pages;

    if (currentPage <= 3) return pages.slice(0, 5);
    if (currentPage >= totalPages - 2) return pages.slice(totalPages - 5);

    return pages.slice(currentPage - 3, currentPage + 2);
  }, [currentPage, totalPages]);

  function resetPage() {
    setCurrentPage(1);
  }

  function toggleSort(field: "date" | "title") {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  function clearFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setPaymentFilter("all");
    setCurrentPage(1);
  }

  function exportCsv() {
    const header = [
      "Data",
      "Título",
      "Categoria",
      "Tipo",
      "Forma de pagamento",
      "Valor",
    ];

    const rows = filteredTransactions.map((transaction) => [
      formatDate(transaction.transaction_date),
      transaction.title,
      transaction.category || "Outros",
      transaction.type === "income" ? "Receita" : "Despesa",
      formatPaymentMethod(transaction.payment_method),
      Number(transaction.amount).toFixed(2).replace(".", ","),
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "historico-transacoes.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <main className="min-h-screen bg-[#05090d] px-10 py-9 text-white">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[42px] font-semibold tracking-tight text-white">
              Histórico
            </h1>

            <p className="mt-2 text-base font-normal text-zinc-400">
              Veja todas as suas transações realizadas.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={exportCsv}
              className="flex h-12 items-center gap-3 rounded-lg border border-zinc-700/80 bg-[#080d13] px-5 text-sm font-medium text-zinc-200 transition hover:border-zinc-500"
            >
              Exportar
              <Download size={17} className="text-zinc-400" />
            </button>

            <button
              onClick={() => setOpenModal(true)}
              className="flex h-12 items-center gap-3 rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              <Plus size={18} />
              Adicionar transação
              <ChevronDown size={17} />
            </button>
          </div>
        </div>

        <section className="mb-5 rounded-xl border border-zinc-800 bg-[#081018]/90 p-6">
          <div className="mb-5 grid grid-cols-[1fr_1fr_0.8fr] gap-4">
            <div>
              <p className="mb-3 text-sm text-zinc-300">Buscar</p>

              <div className="flex h-[46px] items-center gap-3 rounded-lg border border-zinc-700/80 bg-[#080d13] px-4">
                <Search size={17} className="text-zinc-400" />

                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    resetPage();
                  }}
                  placeholder="Buscar por nome..."
                  className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm text-zinc-300">Período</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex h-[46px] items-center gap-3 rounded-lg border border-zinc-700/80 bg-[#080d13] px-4">
                  <CalendarDays size={17} className="text-zinc-400" />

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      resetPage();
                    }}
                    className="w-full bg-transparent text-sm text-zinc-200 outline-none"
                  />
                </div>

                <div className="flex h-[46px] items-center gap-3 rounded-lg border border-zinc-700/80 bg-[#080d13] px-4">
                  <CalendarDays size={17} className="text-zinc-400" />

                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => {
                      setEndDate(event.target.value);
                      resetPage();
                    }}
                    className="w-full bg-transparent text-sm text-zinc-200 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm text-zinc-300">Valor</p>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={minAmount}
                  onChange={(event) => {
                    setMinAmount(event.target.value);
                    resetPage();
                  }}
                  placeholder="Mín."
                  className="h-[46px] rounded-lg border border-zinc-700/80 bg-[#080d13] px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                />

                <input
                  type="number"
                  value={maxAmount}
                  onChange={(event) => {
                    setMaxAmount(event.target.value);
                    resetPage();
                  }}
                  placeholder="Máx."
                  className="h-[46px] rounded-lg border border-zinc-700/80 bg-[#080d13] px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[0.8fr_1fr_1fr_auto] gap-6">
            <SelectBox
              label="Tipo"
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value as "all" | "income" | "expense");
                resetPage();
              }}
              options={[
                { label: "Todos", value: "all" },
                { label: "Receitas", value: "income" },
                { label: "Despesas", value: "expense" },
              ]}
            />

            <SelectBox
              label="Categoria"
              value={categoryFilter}
              onChange={(value) => {
                setCategoryFilter(value);
                resetPage();
              }}
              options={[
                { label: "Todas as categorias", value: "all" },
                ...categories.map((category) => ({
                  label: category,
                  value: category,
                })),
              ]}
            />

            <SelectBox
              label="Forma de pagamento"
              value={paymentFilter}
              onChange={(value) => {
                setPaymentFilter(value);
                resetPage();
              }}
              options={[
                { label: "Todas", value: "all" },
                ...paymentMethods.map((payment) => ({
                  label: payment,
                  value: payment,
                })),
              ]}
            />

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="flex h-[46px] items-center gap-3 rounded-lg border border-zinc-700/80 bg-[#080d13] px-6 text-sm text-zinc-200 transition hover:border-emerald-500/50 hover:text-emerald-400"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-4 rounded-xl border border-zinc-800 bg-[#081018]/90 px-8 py-7">
          <SummaryCard
            label="Total de receitas"
            value={formatCurrency(totalIncome)}
            color="text-emerald-400"
          />

          <SummaryCard
            label="Total de despesas"
            value={formatCurrency(totalExpenses)}
            color="text-red-400"
          />

          <SummaryCard
            label="Saldo no período"
            value={formatCurrency(balance)}
            color={balance >= 0 ? "text-emerald-400" : "text-red-400"}
          />

          <SummaryCard
            label="Total de transações"
            value={String(filteredTransactions.length)}
            color="text-white"
            noBorder
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-zinc-800 bg-[#081018]/90">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-sm font-medium text-zinc-200">
                <th className="px-7 py-5">
                  <button
                    onClick={() => toggleSort("date")}
                    className="transition hover:text-emerald-400"
                  >
                    Data{" "}
                    {sortField === "date"
                      ? sortDirection === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </button>
                </th>

                <th className="px-7 py-5">
                  <button
                    onClick={() => toggleSort("title")}
                    className="transition hover:text-emerald-400"
                  >
                    Descrição{" "}
                    {sortField === "title"
                      ? sortDirection === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </button>
                </th>

                <th className="px-7 py-5">Categoria</th>
                <th className="px-7 py-5">Tipo</th>
                <th className="px-7 py-5">Forma de pagamento</th>
                <th className="px-7 py-5 text-left">Valor</th>
                <th className="px-7 py-5 text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-7 py-10 text-center text-zinc-500"
                  >
                    Carregando transações...
                  </td>
                </tr>
              ) : visibleTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-7 py-10 text-center text-zinc-500"
                  >
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                groupedVisibleTransactions.map(([month, items]) => (
                  <React.Fragment key={month}>
                    <tr>
                      <td
                        colSpan={7}
                        className="border-b border-zinc-800 bg-black/20 px-7 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500"
                      >
                        {month}
                      </td>
                    </tr>

                    {items.map((transaction) => {
                      const category = transaction.category || "Outros";
                      const Icon = categoryIcons[category] || CreditCard;
                      const isIncome = transaction.type === "income";
                      const color = categoryColors[category] || "emerald";
                      const paymentMethod = formatPaymentMethod(transaction.payment_method);

                      return (
                        <tr
                          key={transaction.id}
                          onClick={() => {
                            if (transaction.payment_method === "credit_card_invoice") {
                              openInvoiceDetails(transaction);
                            }
                          }}
                          className={`border-b border-zinc-800/80 transition ${transaction.payment_method === "credit_card_invoice"
                            ? "cursor-pointer hover:bg-blue-500/5"
                            : "hover:bg-white/[0.02]"
                            }`}
                        >
                          <td className="px-7 py-4 align-middle">
                            <p className="text-sm text-zinc-200">
                              {formatDate(transaction.transaction_date)}
                            </p>

                            <p className="mt-1 text-sm capitalize text-zinc-400">
                              {formatDay(transaction.transaction_date)}
                            </p>
                          </td>

                          <td className="px-7 py-4">
                            <div className="flex items-center gap-4">
                              {transaction.payment_method === "credit_card_invoice" ? (
                                <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#05090d] ring-1 ring-zinc-800">
                                  <Image
                                    src={
                                      transaction.card_id === "inter"
                                        ? "/icons/inter.png"
                                        : transaction.card_id === "mercado-pago"
                                          ? "/icons/mercadopago.png"
                                          : "/icons/card.png"
                                    }
                                    alt="Cartão"
                                    fill
                                    sizes="64px"
                                    className="object-contain p-1 scale-125"
                                  />
                                </div>
                              ) : (
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-full ${iconStyle(
                                    color
                                  )}`}
                                >
                                  <Icon size={20} />
                                </div>
                              )}

                              <div>
                                <p className="text-sm font-medium text-white">
                                  {transaction.title}
                                </p>

                                {transaction.payment_method === "credit_card_invoice" ? (
                                  <p className="mt-1 text-sm text-blue-400">
                                    Clique para ver a fatura
                                  </p>
                                ) : (
                                  <p className="mt-1 text-sm text-zinc-400">
                                    {isIncome ? "Entrada registrada" : "Saída registrada"}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-7 py-4">
                            <span
                              className={`rounded-md border px-2.5 py-1 text-xs font-medium ${categoryStyle(
                                color
                              )}`}
                            >
                              {category}
                            </span>
                          </td>

                          <td className="px-7 py-4">
                            <div
                              className={`flex items-center gap-2 text-sm font-medium ${isIncome ? "text-emerald-400" : "text-red-400"
                                }`}
                            >
                              {isIncome ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                              {isIncome ? "Receita" : "Despesa"}
                            </div>
                          </td>

                          <td className="px-7 py-4">
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              {(() => {
                                const PaymentIcon = getPaymentMethodIcon(transaction.payment_method);

                                return <PaymentIcon size={18} className="text-zinc-300" />;
                              })()}
                              {paymentMethod}
                            </div>
                          </td>

                          <td
                            className={`px-7 py-4 text-left text-sm font-medium ${isIncome ? "text-emerald-400" : "text-red-400"
                              }`}
                          >
                            {isIncome ? "+ " : "- "}
                            {formatCurrency(Number(transaction.amount))}
                          </td>

                          <td className="px-7 py-4 text-right">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedTransaction(transaction);
                              }}
                              className="rounded-md p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-7 py-5">
            <p className="text-sm text-zinc-400">
              Mostrando{" "}
              {filteredTransactions.length === 0
                ? 0
                : (currentPage - 1) * itemsPerPage + 1}{" "}
              a{" "}
              {Math.min(
                currentPage * itemsPerPage,
                filteredTransactions.length
              )}{" "}
              de {filteredTransactions.length} transações
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${currentPage === page
                    ? "border border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-300 hover:bg-white/5"
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <select
              value={itemsPerPage}
              onChange={(event) => {
                setItemsPerPage(Number(event.target.value));
                setCurrentPage(1);
              }}
              className="h-10 rounded-lg border border-zinc-800 bg-[#080d13] px-4 text-sm text-zinc-300 outline-none transition hover:border-zinc-600"
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </section>
        <div className="mt-5 flex justify-start">
          <button
            onClick={() => setClearHistoryOpen(true)}
            disabled={filteredTransactions.length === 0}
            className="flex h-11 items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-5 text-sm font-medium text-red-400 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={16} />
            Limpar histórico
          </button>
        </div>
      </main>

      <AddTransactionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={async () => {
          await reload();
          showToast("success", "Transação adicionada com sucesso.");
        }}
      />
      {clearHistoryOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[460px] rounded-2xl border border-zinc-800 bg-[#081018] p-6 text-white">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Limpar histórico?
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Essa ação vai excluir todas as transações do histórico. Você tem certeza?
                </p>
              </div>

              <button
                onClick={() => setClearHistoryOpen(false)}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm leading-6 text-zinc-300">
                As transações serão removidas definitivamente.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setClearHistoryOpen(false)}
                className="h-11 flex-1 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={handleClearHistory}
                className="h-11 flex-1 rounded-lg bg-red-600 text-sm font-medium text-white transition hover:bg-red-500"
              >
                Sim, limpar
              </button>
            </div>
          </div>
        </div>
      )}
      {invoiceDetailsOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[720px] rounded-2xl border border-zinc-800 bg-[#081018] text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Fatura do cartão
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  {invoiceCardName}
                </p>
              </div>

              <button
                onClick={() => setInvoiceDetailsOpen(false)}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[560px] overflow-y-auto p-6">
              {invoiceTransactions.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Nenhuma compra encontrada para essa fatura.
                </p>
              ) : (
                <div className="space-y-3">
                  {invoiceTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#05090d]/70 p-4 transition hover:border-zinc-700 hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
                          <CreditCard size={18} />
                        </div>

                        <div>
                          <p className="font-medium text-white">
                            {transaction.title || "Transação sem título"}
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            {formatDate(transaction.transaction_date)}
                          </p>
                        </div>
                      </div>

                      <p className="text-lg font-semibold text-red-400">
                        - {formatCurrency(Number(transaction.amount))}
                      </p>
                    </div>
                  ))}

                  <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-5">
                    <p className="text-sm text-zinc-500">Total da fatura</p>

                    <p className="text-2xl font-semibold tracking-tight text-white">
                      {formatCurrency(
                        invoiceTransactions.reduce(
                          (sum, transaction) => sum + Number(transaction.amount),
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <TransactionActionsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onSuccess={async (message) => {
          setSelectedTransaction(null);
          await reload();
          showToast("success", message);
        }}
        onError={(message) => showToast("error", message)}
      />

      {toast && <Toast type={toast.type} message={toast.message} />}
    </>
  );
}

function TransactionActionsModal({
  transaction,
  onClose,
  onSuccess,
  onError,
}: {
  transaction: TransactionWithPayment | null;
  onClose: () => void;
  onSuccess: (message: string) => void | Promise<void>;
  onError: (message: string) => void;
}) {
  const [mode, setMode] = useState<"actions" | "edit" | "delete">("actions");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [title, setTitle] = useState(transaction?.title ?? "");
  const [amount, setAmount] = useState(String(transaction?.amount ?? ""));
  const [type, setType] = useState<"income" | "expense">(
    transaction?.type ?? "expense"
  );
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [paymentMethod, setPaymentMethod] = useState(
    transaction?.payment_method ?? "Conta principal"
  );
  const [transactionDate, setTransactionDate] = useState(
    transaction?.transaction_date ?? ""
  );



  useEffect(() => {
    if (!transaction) return;

    setMode("actions");
    setFeedback("");

    setTitle(transaction.title);
    setAmount(String(transaction.amount));
    setType(transaction.type);
    setCategory(transaction.category ?? "");
    setPaymentMethod(transaction.payment_method ?? "Conta principal");
    setTransactionDate(transaction.transaction_date);
  }, [transaction]);

  if (!transaction) return null;

  async function handleUpdate() {
    if (!transaction) return;

    setSaving(true);
    setFeedback("");

    const { error } = await supabase
      .from("transactions")
      .update({
        title,
        amount: Number(amount),
        type,
        category: category || null,
        payment_method: paymentMethod || null,
        transaction_date: transactionDate,
      })
      .eq("id", transaction.id);

    setSaving(false);

    if (error) {
      setFeedback("Erro ao salvar alteração.");
      onError("Erro ao salvar alteração.");
      return;
    }

    await onSuccess("Transação atualizada com sucesso.");
  }

  async function handleDelete() {
    if (!transaction) return;

    setSaving(true);
    setFeedback("");

    if (
      transaction.payment_method !== "credit_card" &&
      transaction.payment_method !== "credit_card_invoice"
    ) {
      const { data: accountData, error: accountError } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("id", "caixa")
        .single();

      if (accountError) {
        setSaving(false);
        setFeedback("Erro ao buscar saldo da Caixa.");
        return;
      }

      const currentBalance = Number(accountData?.balance ?? 0);
      const amount = Number(transaction.amount);

      const newBalance =
        transaction.type === "income"
          ? currentBalance - amount
          : currentBalance + amount;

      const { error: balanceError } = await supabase
        .from("bank_accounts")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "caixa");

      if (balanceError) {
        setSaving(false);
        setFeedback("Erro ao atualizar saldo da Caixa.");
        return;
      }
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transaction.id);

    setSaving(false);

    if (error) {
      setFeedback("Erro ao excluir transação.");
      onError("Erro ao excluir transação.");
      return;
    }

    await onSuccess("Transação excluída com sucesso.");
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[500px] rounded-2xl border border-zinc-800 bg-[#081018] p-6 text-white">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {mode === "actions" && "Ações da transação"}
              {mode === "edit" && "Editar transação"}
              {mode === "delete" && "Excluir transação"}
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              {transaction.title} • {formatCurrency(Number(transaction.amount))}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {mode === "actions" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("edit")}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-emerald-600 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Editar transação
            </button>

            <button
              onClick={() => setMode("delete")}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 text-sm font-medium text-red-400 transition hover:bg-red-500/15"
            >
              <Trash2 size={17} />
              Excluir transação
            </button>
          </div>
        )}

        {mode === "edit" && (
          <div className="space-y-4">
            <InputBox label="Título">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-11 w-full rounded-lg border border-zinc-700 bg-[#05090d] px-4 text-sm text-white outline-none transition focus:border-emerald-500/60"
              />
            </InputBox>

            <div className="grid grid-cols-2 gap-4">
              <InputBox label="Valor">
                <input
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-11 w-full rounded-lg border border-zinc-700 bg-[#05090d] px-4 text-sm text-white outline-none transition focus:border-emerald-500/60"
                />
              </InputBox>

              <InputBox label="Tipo">
                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as "income" | "expense")
                  }
                  className="h-11 w-full rounded-lg border border-zinc-700 bg-[#05090d] px-4 text-sm text-white outline-none transition focus:border-emerald-500/60"
                >
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </InputBox>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputBox label="Categoria">
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-11 w-full rounded-lg border border-zinc-700 bg-[#05090d] px-4 text-sm text-white outline-none transition focus:border-emerald-500/60"
                />
              </InputBox>

              <InputBox label="Data">
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(event) => setTransactionDate(event.target.value)}
                  className="h-11 w-full rounded-lg border border-zinc-700 bg-[#05090d] px-4 text-sm text-white outline-none transition focus:border-emerald-500/60"
                />
              </InputBox>
            </div>

            <InputBox label="Forma de pagamento">
              <input
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                placeholder="Ex: Banco Inter, Mercado Pago, Pix..."
                className="h-11 w-full rounded-lg border border-zinc-700 bg-[#05090d] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/60"
              />
            </InputBox>

            {feedback && <p className="text-sm text-red-400">{feedback}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setMode("actions")}
                className="h-11 flex-1 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
              >
                Voltar
              </button>

              <button
                onClick={handleUpdate}
                disabled={saving}
                className="h-11 flex-1 rounded-lg bg-emerald-600 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        )}

        {mode === "delete" && (
          <div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm leading-6 text-zinc-300">
                Essa transação será excluída definitivamente. Você tem certeza?
              </p>
            </div>

            {feedback && <p className="mt-4 text-sm text-red-400">{feedback}</p>}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setMode("actions")}
                className="h-11 flex-1 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={handleDelete}
                disabled={saving}
                className="h-11 flex-1 rounded-lg bg-red-600 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Toast({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-6 left-1/2 z-[120] -translate-x-1/2">
      <div
        className={`flex min-w-[320px] animate-[toastIn_280ms_ease-out] items-center gap-3 rounded-xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${isSuccess
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
          : "border-red-500/30 bg-red-500/15 text-red-300"
          }`}
      >
        {isSuccess ? <CheckCircle2 size={20} /> : <XCircle size={20} />}

        <p className="text-sm font-medium text-white">{message}</p>
      </div>
    </div>
  );
}

function InputBox({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function SelectBox({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <p className="mb-3 text-sm text-zinc-300">{label}</p>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[46px] w-full rounded-lg border border-zinc-700/80 bg-[#080d13] px-4 text-sm text-zinc-200 outline-none transition hover:border-emerald-500/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  noBorder = false,
}: {
  label: string;
  value: string;
  color: string;
  noBorder?: boolean;
}) {
  return (
    <div className={`${noBorder ? "" : "border-r border-zinc-800"} px-2`}>
      <p className="mb-3 text-sm text-zinc-400">{label}</p>

      <h2 className={`text-[28px] font-semibold tracking-tight ${color}`}>
        {value}
      </h2>
    </div>
  );
}