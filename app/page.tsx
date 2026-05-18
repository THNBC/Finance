"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  ChevronDown,
  CreditCard,
  Fuel,
  HandCoins,
  Home,
  Plus,
  ShoppingCart,
  Utensils,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AddTransactionModal from "@/components/AddTransactionModal";
import { useTransactions } from "@/hooks/useTransactions";
import { supabase } from "@/lib/supabase";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const categoryIcons: Record<string, any> = {
  Compras: ShoppingCart,
  iFood: Utensils,
  Fatura: CreditCard,
  Pix: CreditCard,
  Combustível: Fuel,
  Salário: BanknoteArrowUp,
  Receita: BanknoteArrowUp,
  Moradia: Home,
};

const categoryColors: Record<string, string> = {
  Fatura: "#ef4444",
  Pix: "#10b981",
  Compras: "#8b5cf6",
  iFood: "#f97316",
  Academia: "#3b82f6",
  Streaming: "#ec4899",
  Assinatura: "#eab308",
  Combustível: "#06b6d4",
  Dentista: "#14b8a6",
  "Manutenção carro": "#71717a",
  Salário: "#22c55e",
  Transferência: "#3b82f6",
  "Bônus salário": "#22c55e",
  "Crédito juros": "#6366f1",
  Outros: "#14b8a6",
};

export default function DashboardPage() {
  const { transactions, loading, reload } = useTransactions();
  const [mainAccountBalance, setMainAccountBalance] = useState(0);

  const [openModal, setOpenModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [chartPeriod, setChartPeriod] = useState<6 | 12>(6);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function loadMainAccountBalance() {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("balance")
      .eq("id", "caixa")
      .single();

    if (error) {
      console.log("ERRO AO BUSCAR SALDO DA CAIXA:", error);
      return;
    }

    setMainAccountBalance(Number(data?.balance ?? 0));
  }

  useEffect(() => {
    loadMainAccountBalance();
  }, []);

  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return transactions.filter((transaction) => {
      const date = new Date(transaction.transaction_date + "T00:00:00");

      return date.getMonth() === month && date.getFullYear() === year;
    });
  }, [transactions]);

  const income = useMemo(
    () =>
      currentMonthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    [currentMonthTransactions]
  );

  const expenses = useMemo(
    () =>
      currentMonthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    [currentMonthTransactions]
  );

  const balance = mainAccountBalance;

  const previousMonthBalance = useMemo(() => {
    const now = new Date();

    const previousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const previousTransactions = transactions.filter((transaction) => {
      const date = new Date(transaction.transaction_date + "T00:00:00");

      return (
        date.getMonth() === previousMonth.getMonth() &&
        date.getFullYear() === previousMonth.getFullYear()
      );
    });

    const income = previousTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const expenses = previousTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return income - expenses;
  }, [transactions]);

  const balanceGrowth = useMemo(() => {
    if (previousMonthBalance === 0) {
      return 100;
    }

    return (
      ((balance - previousMonthBalance) / Math.abs(previousMonthBalance)) *
      100
    );
  }, [balance, previousMonthBalance]);
  const dashboardTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (transaction.payment_method !== "credit_card") {
        return true;
      }

      const paidInvoiceExists = transactions.some(
        (historyTransaction) =>
          historyTransaction.payment_method === "credit_card_invoice" &&
          historyTransaction.card_id === transaction.card_id &&
          historyTransaction.type === "expense"
      );

      return !paidInvoiceExists;
    });
  }, [transactions]);
  const recentTransactions = useMemo(() => {
    const today = new Date();

    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return dashboardTransactions
      .filter((transaction) => {
        const transactionDate = new Date(
          transaction.transaction_date + "T00:00:00"
        );

        return transactionDate <= todayOnly;
      })
      .sort((a, b) => {
        return (
          new Date(b.transaction_date + "T00:00:00").getTime() -
          new Date(a.transaction_date + "T00:00:00").getTime()
        );
      })
      .slice(0, 5);
  }, [dashboardTransactions]);



  const categoriesByPeriod = useMemo(() => {
    const grouped = new Map<string, number>();

    const filteredTransactions = dashboardTransactions.filter((transaction) => {
      if (!startDate || !endDate) {
        return true;
      }

      const date = new Date(transaction.transaction_date + "T00:00:00");

      return (
        date >= new Date(startDate + "T00:00:00") &&
        date <= new Date(endDate + "T23:59:59")
      );
    });

    filteredTransactions.forEach((transaction) => {
      const category = transaction.category || "Outros";

      grouped.set(
        category,
        (grouped.get(category) ?? 0) + Number(transaction.amount)
      );
    });

    return Array.from(grouped.entries())
      .map(([category, value]) => ({
        category,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [dashboardTransactions, startDate, endDate]);

  const categoriesTotal = useMemo(() => {
    return categoriesByPeriod.reduce((sum, item) => sum + item.value, 0);
  }, [categoriesByPeriod]);

  const balanceEvolution = useMemo(() => {
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    if (!startDate || !endDate) {
      const now = new Date();

      return Array.from({ length: chartPeriod }, (_, index) => {
        const date = new Date(
          now.getFullYear(),
          now.getMonth() - (chartPeriod - 1) + index,
          1
        );

        const month = date.getMonth();
        const year = date.getFullYear();

        const monthTransactions = dashboardTransactions.filter((transaction) => {
          const transactionDate = new Date(
            transaction.transaction_date + "T00:00:00"
          );

          return (
            transactionDate.getMonth() === month &&
            transactionDate.getFullYear() === year
          );
        });

        const monthBalance = monthTransactions.reduce((sum, transaction) => {
          return transaction.type === "income"
            ? sum + Number(transaction.amount)
            : sum - Number(transaction.amount);
        }, 0);

        return {
          month: `${months[month]}/${year}`,
          saldo: monthBalance,
          order: date.getTime(),
        };
      });
    }

    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    const filteredTransactions = transactions.filter((transaction) => {
      const date = new Date(transaction.transaction_date + "T00:00:00");

      return date >= start && date <= end;
    });

    const grouped = new Map<string, { saldo: number; order: number }>();

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.transaction_date + "T00:00:00");

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const key = `${months[date.getMonth()]}/${date.getFullYear()}`;

      const current = grouped.get(key) ?? {
        saldo: 0,
        order: monthStart.getTime(),
      };

      grouped.set(key, {
        order: current.order,
        saldo:
          current.saldo +
          (transaction.type === "income"
            ? Number(transaction.amount)
            : -Number(transaction.amount)),
      });
    });

    return Array.from(grouped.entries())
      .map(([month, data]) => ({
        month,
        saldo: data.saldo,
        order: data.order,
      }))
      .sort((a, b) => a.order - b.order);
  }, [dashboardTransactions, chartPeriod, startDate, endDate]);

  const chartLimits = useMemo(() => {
    const values = balanceEvolution.map((item) => item.saldo);

    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);

    const padding = Math.max(Math.abs(min), Math.abs(max)) * 0.2 || 1000;

    const domainMin = min - padding;
    const domainMax = max + padding;

    const zeroOffset = (domainMax / (domainMax - domainMin)) * 100;

    return {
      domainMin,
      domainMax,
      zeroOffset,
    };
  }, [balanceEvolution]);

  return (
    <>
      <div className="space-y-6">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[42px] font-semibold text-white">
              Dashboard
            </h1>

            <p className="mt-2 text-base font-normal text-zinc-400">
              Aqui está o resumo das suas finanças
            </p>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="flex h-12 cursor-pointer items-center gap-3 rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            <Plus size={20} />
            Adicionar transação
            <ChevronDown size={18} />
          </button>
        </header>

        <section className="grid grid-cols-3 gap-5">
          <SummaryCard
            title="Saldo total"
            value={formatBRL(balance)}
            helper={`${balanceGrowth >= 0 ? "▲" : "▼"
              } ${Math.abs(balanceGrowth).toFixed(1)}% vs mês anterior`}
            icon={<HandCoins size={24} />}
            color="blue"
          />

          <SummaryCard
            title="Receitas"
            value={formatBRL(income)}
            helper="Este mês"
            icon={<BanknoteArrowUp size={22} />}
            color="green"
          />

          <SummaryCard
            title="Despesas"
            value={formatBRL(expenses)}
            helper="Este mês"
            icon={<BanknoteArrowDown size={22} />}
            color="red"
          />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-[#081018]/90 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Evolução do saldo
            </h2>

            <div className="flex items-center gap-3">
              <div className="flex overflow-hidden rounded-lg border border-zinc-700">
                <button
                  onClick={() => setChartPeriod(6)}
                  className={`h-10 px-4 text-sm transition ${chartPeriod === 6
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  6 meses
                </button>

                <button
                  onClick={() => setChartPeriod(12)}
                  className={`h-10 border-l border-zinc-700 px-4 text-sm transition ${chartPeriod === 12
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  12 meses
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 rounded-lg border border-zinc-700 bg-[#081018] px-3 text-sm text-zinc-300 outline-none transition hover:border-zinc-600"
                />

                <span className="text-sm text-zinc-500">até</span>

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 rounded-lg border border-zinc-700 bg-[#081018] px-3 text-sm text-zinc-300 outline-none transition hover:border-zinc-600"
                />

                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="h-10 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={balanceEvolution}>
                <defs>
                  <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop
                      offset={`${chartLimits.zeroOffset}%`}
                      stopColor="#22c55e"
                    />
                    <stop
                      offset={`${chartLimits.zeroOffset}%`}
                      stopColor="#ef4444"
                    />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>

                  <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />

                    <stop
                      offset={`${chartLimits.zeroOffset}%`}
                      stopColor="#22c55e"
                      stopOpacity={0.12}
                    />

                    <stop
                      offset={`${chartLimits.zeroOffset}%`}
                      stopColor="#ef4444"
                      stopOpacity={0.12}
                    />

                    <stop
                      offset="100%"
                      stopColor="#ef4444"
                      stopOpacity={0.45}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

                <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="3 3" />

                <XAxis dataKey="month" stroke="#a1a1aa" />

                <YAxis
                  domain={[chartLimits.domainMin, chartLimits.domainMax]}
                  tick={false}
                  axisLine={false}
                  tickLine={false}
                  width={0}
                />

                <Tooltip
                  contentStyle={{
                    background: "#05090d",
                    border: "1px solid #27272a",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                  formatter={(value) => formatBRL(Number(value))}
                />

                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="url(#lineColor)"
                  strokeWidth={3}
                  fill="url(#splitColor)"
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    fill: "#05090d",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid grid-cols-[0.9fr_1.1fr] gap-5">
          <div className="rounded-xl border border-zinc-800 bg-[#081018]/90 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Transações recentes
              </h2>

              <Link
                href="/history"
                className="cursor-pointer text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
              >
                Ver todas
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-zinc-500">Carregando transações...</p>
            ) : recentTransactions.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nenhuma transação cadastrada ainda.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_130px_130px] border-b border-zinc-800 pb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <span className="pl-[62px]">Transação</span>

                  <div className="flex justify-start">
                    <span>Data</span>
                  </div>

                  <span className="text-left">Valor</span>
                </div>

                {recentTransactions.map((transaction) => {
                  const category = transaction.category || "Outros";
                  const Icon = categoryIcons[category] || CreditCard;

                  return (
                    <div
                      key={transaction.id}
                      className="grid grid-cols-[1fr_130px_130px] items-center gap-4 rounded-xl border border-transparent px-2 py-3 transition hover:border-zinc-800 hover:bg-white/[0.02]"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                          style={{
                            backgroundColor:
                              transaction.type === "income"
                                ? "#2563eb"
                                : categoryColors[category] || "#22c55e",
                          }}
                        >
                          <Icon size={21} className="text-white" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">
                            {transaction.title}
                          </p>

                          <p className="mt-1 text-sm text-zinc-400">
                            {category}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-start text-sm text-zinc-400">
                        {new Date(
                          transaction.transaction_date + "T00:00:00"
                        ).toLocaleDateString("pt-BR")}
                      </div>

                      <p
                        className={`text-left text-sm font-bold ${transaction.type === "income"
                          ? "text-emerald-400"
                          : "text-red-400"
                          }`}
                      >
                        {transaction.type === "income" ? "+ " : "- "}
                        {formatBRL(Number(transaction.amount))}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-[#081018]/90 p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-white">
                Movimentações por categoria
              </h2>
            </div>

            {categoriesByPeriod.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nenhuma movimentação encontrada no período.
              </p>
            ) : (
              <div className="grid grid-cols-[280px_1fr] items-center gap-6">
                <div className="relative h-[260px]">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={categoriesByPeriod}
                        dataKey="value"
                        nameKey="category"
                        innerRadius={74}
                        outerRadius={118}
                        paddingAngle={0}
                        stroke="transparent"
                      >
                        {categoriesByPeriod.map((item, index) => (
                          <Cell
                            key={item.category}
                            fill={categoryColors[item.category] || "#14b8a6"}
                            style={{
                              transform:
                                activeIndex === index
                                  ? "scale(1.045)"
                                  : "scale(1)",
                              transformOrigin: "center",
                              transition:
                                "transform 320ms cubic-bezier(0.16, 1, 0.3, 1), filter 260ms ease, opacity 260ms ease, stroke 260ms ease",
                              filter:
                                activeIndex === index
                                  ? "brightness(1.18) drop-shadow(0 0 18px rgba(255,255,255,0.18))"
                                  : "brightness(1)",
                              opacity:
                                activeIndex === -1 || activeIndex === index
                                  ? 1
                                  : 0.55,
                              stroke:
                                activeIndex === index
                                  ? "rgba(255,255,255,0.95)"
                                  : "transparent",
                              strokeWidth: activeIndex === index ? 3 : 0,
                              cursor: "pointer",
                            }}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(-1)}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          background: "#05090d",
                          border: "1px solid #27272a",
                          borderRadius: "10px",
                          color: "#fff",
                        }}
                        formatter={(value) => formatBRL(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-left text-sm text-zinc-400">
                      Total
                    </span>
                    <span className="mt-1 text-lg font-semibold text-white">
                      {formatBRL(categoriesTotal)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {categoriesByPeriod.map((item) => {
                    const percentage =
                      categoriesTotal > 0
                        ? (item.value / categoriesTotal) * 100
                        : 0;

                    return (
                      <div
                        key={item.category}
                        className="grid grid-cols-[1fr_110px_45px] items-center gap-4 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor:
                                categoryColors[item.category] || "#14b8a6",
                            }}
                          />

                          <span className="text-zinc-200">
                            {item.category}
                          </span>
                        </div>

                        <span className="text-right text-zinc-200">
                          {formatBRL(item.value)}
                        </span>

                        <span className="text-right text-zinc-400">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <AddTransactionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={async () => {
          await reload();
          await loadMainAccountBalance();
        }}
      />
    </>
  );
}

function SummaryCard({
  title,
  value,
  helper,
  icon,
  color,
}: {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
  color: "blue" | "green" | "red";
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-[#081018]/90 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700">
      <div className="relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-base font-medium text-white">{title}</p>

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 ${color === "green"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400 group-hover:border-emerald-400/40 group-hover:bg-emerald-500/20"
              : color === "red"
                ? "border-red-500/30 bg-red-500/15 text-red-400 group-hover:border-red-400/40 group-hover:bg-red-500/20"
                : "border-blue-500/30 bg-blue-500/15 text-blue-400 group-hover:border-blue-400/40 group-hover:bg-blue-500/20"
              }`}
          >
            {icon}
          </div>
        </div>

        <p
          className={`text-4xl font-semibold tracking-tight transition-all duration-300 ${color === "green"
            ? "text-emerald-400 group-hover:text-emerald-300"
            : color === "red"
              ? "text-red-400 group-hover:text-red-300"
              : "text-blue-400 group-hover:text-blue-300"
            }`}
        >
          {value}
        </p>

        <p
          className={`mt-5 text-sm font-medium ${helper.includes("▲")
            ? "text-emerald-400"
            : helper.includes("▼")
              ? "text-red-400"
              : "text-zinc-400"
            }`}
        >
          {helper}
        </p>
      </div>
    </div>
  );
}