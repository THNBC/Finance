"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  FileUp,
  List,
  Loader2,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/lib/supabase";

type Transaction = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  source: string | null;
  created_at: string;
};

type Account = {
  id: string;
  name: string;
  balance: number;
  active?: boolean;
};

const monthNames = [
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

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateBR(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

function getSourceLabel(source?: string | null) {
  if (source === "caixa") return "Caixa";
  if (source === "inter") return "Inter";
  if (source === "mercadopago") return "Mercado Pago";
  return "Manual";
}

function getMonthKey(date: string) {
  const parsedDate = new Date(date + "T00:00:00");
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<3 | 6 | 12>(6);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const [transactionsResponse, accountsResponse] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, transaction_date, description, amount, type, source, created_at"
        )
        .order("transaction_date", { ascending: true }),

      supabase
        .from("accounts")
        .select("*"),
    ]);

    if (transactionsResponse.error) {
      console.error(transactionsResponse.error);
    } else {
      setTransactions((transactionsResponse.data ?? []) as Transaction[]);
    }

    if (accountsResponse.error) {
      console.error(accountsResponse.error);
    } else {
      console.log("ACCOUNTS DASH:", accountsResponse.data);
      setAccounts((accountsResponse.data ?? []) as Account[]);
    }

    setLoading(false);
  }

  const dashboardData = useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) =>
      a.transaction_date.localeCompare(b.transaction_date)
    );

    const initialBalance = accounts.reduce(
      (sum, account) => sum + Number(account.balance ?? 0),
      0
    );

    const transactionBalance = sortedTransactions.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    const currentBalance = initialBalance + transactionBalance;

    const totalIncome = sortedTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);

    const totalExpense = sortedTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);

    const totalTransactions = sortedTransactions.length;

    const lastTransaction = [...sortedTransactions].sort((a, b) =>
      b.transaction_date.localeCompare(a.transaction_date)
    )[0];

    const lastImport = lastTransaction
      ? formatDateBR(lastTransaction.transaction_date)
      : "Nenhuma";

    const now = new Date();

    const months = Array.from({ length: period }).map((_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (period - 1 - index),
        1
      );

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      return {
        key,
        month: monthNames[date.getMonth()],
        income: 0,
        expense: 0,
      };
    });

    const monthlyMap = new Map(months.map((item) => [item.key, item]));

    for (const transaction of sortedTransactions) {
      const key = getMonthKey(transaction.transaction_date);
      const monthData = monthlyMap.get(key);

      if (!monthData) continue;

      if (transaction.type === "income") {
        monthData.income += Math.abs(Number(transaction.amount));
      } else {
        monthData.expense += Math.abs(Number(transaction.amount));
      }
    }

    let runningBalance = initialBalance;

    const balanceChartData = months.map((month) => {
      const monthTransactions = sortedTransactions.filter(
        (transaction) => getMonthKey(transaction.transaction_date) === month.key
      );

      const monthBalance = monthTransactions.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );

      runningBalance += monthBalance;

      return {
        month: month.month,
        balance: runningBalance,
      };
    });

    const monthlyChartData = months.map((month) => ({
      month: month.month,
      income: month.income,
      expense: month.expense,
    }));

    const recentImports = [...sortedTransactions]
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
      .slice(0, 8);

    return {
      currentBalance,
      totalIncome,
      totalExpense,
      totalTransactions,
      lastImport,
      balanceChartData,
      monthlyChartData,
      recentImports,
      accountBalance: initialBalance,
    };
  }, [transactions, accounts, period]);

  return (
    <main className="min-h-screen">
      <section className="w-full px-8 py-7">
        <header className="mb-7 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Visão geral das suas finanças
            </p>
          </div>

          <Link
            href="/importar"
            className="flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
          >
            <FileUp size={18} />
            Importar arquivo
          </Link>
        </header>

        {loading ? (
          <div className="flex h-[60vh] items-center justify-center text-zinc-500">
            <Loader2 size={22} className="mr-2 animate-spin" />
            Carregando dashboard...
          </div>
        ) : (
          <>
            <section className="mb-5 grid grid-cols-4 gap-4">
              <SummaryCard
                title="Saldo em conta"
                value={formatBRL(dashboardData.currentBalance)}
                helper="Conta Caixa"
                icon={<Wallet size={21} />}
                variant="blue"
              />

              <SummaryCard
                title="Transações"
                value={String(dashboardData.totalTransactions)}
                helper="Lançamentos salvos"
                icon={<List size={21} />}
                variant="purple"
              />

              <SummaryCard
                title="Receitas"
                value={formatBRL(dashboardData.totalIncome)}
                helper="Total de entradas"
                icon={<ArrowUpRight size={21} />}
                variant="green"
              />

              <SummaryCard
                title="Despesas"
                value={formatBRL(dashboardData.totalExpense)}
                helper={`Última importação: ${dashboardData.lastImport}`}
                icon={<Clock size={21} />}
                variant="red"
              />
            </section>

            <section className="mb-5 grid grid-cols-2 gap-4">
              <ChartCard title="Evolução do saldo geral">
                <div className="mb-4 flex gap-2">
                  {[3, 6, 12].map((item) => (
                    <button
                      key={item}
                      onClick={() => setPeriod(item as 3 | 6 | 12)}
                      className={`rounded-xl border px-3 py-1.5 text-xs transition ${period === item
                        ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                        : "border-white/10 text-zinc-500 hover:border-cyan-400/40 hover:text-cyan-300"
                        }`}
                    >
                      {item} meses
                    </button>
                  ))}
                </div>

                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={dashboardData.balanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#14202b" />
                    <XAxis dataKey="month" stroke="#71717a" tickLine={false} />
                    <YAxis stroke="#71717a" tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => formatBRL(Number(value))}
                      contentStyle={{
                        background: "#081018",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "14px",
                        color: "#fff",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#22d3ee"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Movimentação mensal">
                <div className="mb-4 flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Receitas
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    Despesas
                  </span>
                </div>

                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dashboardData.monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#14202b" />
                    <XAxis dataKey="month" stroke="#71717a" tickLine={false} />
                    <YAxis stroke="#71717a" tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => formatBRL(Number(value))}
                      contentStyle={{
                        background: "#081018",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "14px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="income" fill="#22c55e" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#081018]/90 shadow-[0_0_40px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <h3 className="text-lg font-medium">
                    Movimentações recentes
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Últimos lançamentos salvos no sistema
                  </p>
                </div>

                <Link
                  href="/importar"
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:border-cyan-400/40 hover:text-cyan-300"
                >
                  Nova importação
                </Link>
              </div>

              <div className="overflow-hidden">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-white/[0.02] text-zinc-500">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Data</th>
                      <th className="px-5 py-3 text-left font-medium">
                        Descrição
                      </th>
                      <th className="px-5 py-3 text-left font-medium">
                        Origem
                      </th>
                      <th className="px-5 py-3 text-left font-medium">Tipo</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Valor
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboardData.recentImports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center">
                          <p className="text-sm text-zinc-400">
                            Nenhuma movimentação encontrada
                          </p>
                          <p className="mt-1 text-xs text-zinc-600">
                            Importe seu primeiro arquivo para começar.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      dashboardData.recentImports.map((transaction) => (
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
                            className={`px-5 py-3 text-right font-medium ${Number(transaction.amount) >= 0
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
          </>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  helper,
  icon,
  variant,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  variant: "green" | "red" | "blue" | "purple" | "neutral";
}) {
  const variants = {
    green: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    red: "text-red-300 bg-red-400/10 border-red-400/20",
    blue: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
    purple: "text-violet-300 bg-violet-400/10 border-violet-400/20",
    neutral: "text-zinc-300 bg-white/5 border-white/10",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5 shadow-[0_0_40px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{title}</p>

        <div className={`rounded-2xl border p-2 ${variants[variant]}`}>
          {icon}
        </div>
      </div>

      <strong className="mt-5 block text-3xl font-semibold tracking-tight">
        {value}
      </strong>

      <p className="mt-2 text-xs text-zinc-600">{helper}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5 shadow-[0_0_40px_rgba(0,0,0,0.15)]">
      <h3 className="mb-4 text-lg font-medium">{title}</h3>
      {children}
    </div>
  );
}