"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  MoreHorizontal,
  Plus,
  SquarePen,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import { supabase } from "@/lib/supabase";

type Transaction = {
  id: string;
  transaction_date: string;
  amount: number;
  type: "income" | "expense";
  source: string | null;
  paid: boolean | null;
};

type Account = {
  id: string;
  name: string;
  balance: number;
  active: boolean;
};

type CreditCardRow = {
  id: string;
  name: string;
  limit_total: number;
  active: boolean;
};

type CreditCardItem = {
  id: string;
  transaction_id: string;
  item_date: string | null;
  description: string;
  amount: number;
  installment: string | null;
};

type Investment = {
  id: string;
  name: string;
  description: string;
  amount: number;
  profit: number;
};

type InvestmentTransaction = {
  id: string;
  investment_id: string;
  type: "aporte" | "rendimento" | "saque";
  amount: number;
  transaction_date: string;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseBRLInput(value: string) {
  return Number(value.replace(/\./g, "").replace(",", ".").trim());
}

function getCardSource(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("mercado")) return "mercadopago";
  if (normalized.includes("inter")) return "inter";

  return normalized.replace(/\s/g, "");
}

function getSourceAliases(source: string) {
  if (source === "mercadopago") {
    return ["mercadopago", "mercado-pago", "mercado_pago"];
  }

  return [source];
}

function getIcon(source: string) {
  if (source === "inter") return "/icons/inter.png";
  if (source === "mercadopago") return "/icons/mercadopago.png";
  return "/icons/caixa.png";
}

function getInvestmentIcon(id: string) {
  if (id === "cdi") return "/icons/cdi.png";
  if (id === "porquinho-bets") return "/icons/porquinho-bets.png";

  return "/icons/logo.png";
}

function parseInstallment(installment?: string | null) {
  if (!installment) return null;

  const match = installment.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;

  const current = Number(match[1]);
  const total = Number(match[2]);

  if (!current || !total) return null;

  return { current, total };
}

function buildInvestmentEvolution(transactions: InvestmentTransaction[]) {
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

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let cdiBalance = 0;
  let porquinhoBalance = 0;

  return months.slice(0, currentMonth + 1).map((month, monthIndex) => {
    const monthTransactions = transactions.filter((transaction) => {
      const date = new Date(`${transaction.transaction_date}T12:00:00`);

      return (
        date.getFullYear() === currentYear && date.getMonth() === monthIndex
      );
    });

    for (const transaction of monthTransactions) {
      const amount = Number(transaction.amount ?? 0);
      const value = transaction.type === "saque" ? -amount : amount;

      if (transaction.investment_id === "cdi") cdiBalance += value;
      if (transaction.investment_id === "porquinho-bets") {
        porquinhoBalance += value;
      }
    }

    return {
      month,
      cdi: cdiBalance,
      porquinhoBets: porquinhoBalance,
    };
  });
}

function InvestmentsLineChart({
  transactions,
}: {
  transactions: InvestmentTransaction[];
}) {
  const data = buildInvestmentEvolution(transactions);

  return (
    <div className="h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
          <XAxis dataKey="month" stroke="#71717a" tickLine={false} />
          <YAxis
            stroke="#71717a"
            tickLine={false}
            tickFormatter={(value) => formatBRL(Number(value))}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#081018",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            }}
            labelStyle={{
              color: "#71717a",
              fontWeight: 600,
            }}
            itemStyle={{ color: "#ffffff" }}
            formatter={(value) => formatBRL(Number(value))}
          />
          <Legend />

          <Line
            type="monotone"
            dataKey="cdi"
            name="CDI"
            stroke="#fb923c"
            strokeWidth={3}
            dot={{ r: 5, fill: "#fb923c" }}
            activeDot={{ r: 7, fill: "#fb923c" }}
          />

          <Line
            type="monotone"
            dataKey="porquinhoBets"
            name="Porquinho Bets"
            stroke="#34d399"
            strokeWidth={3}
            dot={{ r: 5, fill: "#34d399" }}
            activeDot={{ r: 7, fill: "#34d399" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CartoesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCardRow[]>([]);
  const [items, setItems] = useState<CreditCardItem[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentTransactions, setInvestmentTransactions] = useState<
    InvestmentTransaction[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [savingInvestment, setSavingInvestment] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [savingBalance, setSavingBalance] = useState(false);
  const [balanceValue, setBalanceValue] = useState("");

  const [investmentId, setInvestmentId] = useState("cdi");
  const [investmentType, setInvestmentType] =
    useState<InvestmentTransaction["type"]>("aporte");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentDate, setInvestmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [
      transactionsRes,
      accountsRes,
      cardsRes,
      itemsRes,
      investmentsRes,
      investmentTransactionsRes,
    ] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, transaction_date, amount, type, source, paid")
        .order("transaction_date", { ascending: false }),

      supabase.from("accounts").select("id, name, balance, active"),

      supabase
        .from("credit_cards")
        .select("id, name, limit_total, active")
        .order("name", { ascending: true }),

      supabase
        .from("credit_card_items")
        .select(
          "id, transaction_id, item_date, description, amount, installment"
        ),

      supabase.from("investments").select("*").order("name"),

      supabase
        .from("investment_transactions")
        .select("id, investment_id, type, amount, transaction_date")
        .order("transaction_date", { ascending: true }),
    ]);

    if (
      transactionsRes.error ||
      accountsRes.error ||
      cardsRes.error ||
      itemsRes.error ||
      investmentsRes.error ||
      investmentTransactionsRes.error
    ) {
      console.error(
        transactionsRes.error ||
        accountsRes.error ||
        cardsRes.error ||
        itemsRes.error ||
        investmentsRes.error ||
        investmentTransactionsRes.error
      );
      setLoading(false);
      return;
    }

    setTransactions((transactionsRes.data ?? []) as Transaction[]);
    setAccounts((accountsRes.data ?? []) as Account[]);
    setCards((cardsRes.data ?? []) as CreditCardRow[]);
    setItems((itemsRes.data ?? []) as CreditCardItem[]);
    setInvestmentTransactions(
      (investmentTransactionsRes.data ?? []) as InvestmentTransaction[]
    );

    setInvestments(
      (investmentsRes.data ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        amount: Number(item.amount ?? 0),
        profit: Number(item.profit ?? 0),
      }))
    );

    setLoading(false);
  }

  const data = useMemo(() => {
    const initialAccountBalance = accounts.reduce(
      (sum, account) =>
        account.active === false ? sum : sum + Number(account.balance ?? 0),
      0
    );

    const transactionsBalance = transactions.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0
    );

    const caixaBalance = initialAccountBalance + transactionsBalance;

    const cardRows = cards
      .filter((card) => card.active !== false)
      .map((card) => {
        const source = getCardSource(card.name);
        const sourceAliases = getSourceAliases(source);

        const cardTransactions = transactions
          .filter((transaction) =>
            sourceAliases.includes(transaction.source ?? "")
          )
          .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

        const latestInvoice = cardTransactions.find((transaction) =>
          items.some((item) => item.transaction_id === transaction.id)
        );

        const latestInvoiceItems = latestInvoice
          ? items.filter((item) => item.transaction_id === latestInvoice.id)
          : [];

        const used = latestInvoiceItems.reduce((sum, item) => {
          const installment = parseInstallment(item.installment);

          if (!installment) return sum;
          if (installment.current >= installment.total) return sum;

          const remaining = installment.total - installment.current;

          return sum + Math.abs(Number(item.amount)) * remaining;
        }, 0);

        const limit = Number(card.limit_total ?? 0);
        const available = Math.max(limit - used, 0);
        const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

        return {
          id: card.id,
          name: card.name,
          source,
          limit,
          used,
          available,
          percent,
          icon: getIcon(source),
          subtitle:
            source === "inter"
              ? "Cartão Inter"
              : source === "mercadopago"
                ? "Cartão Mercado Pago"
                : "Cartão",
          barClass: source === "inter" ? "bg-orange-500" : "bg-blue-500",
        };
      });

    const totalLimit = cardRows.reduce((sum, card) => sum + card.limit, 0);
    const totalUsed = cardRows.reduce((sum, card) => sum + card.used, 0);
    const availableLimit = Math.max(totalLimit - totalUsed, 0);

    const totalInvestmentBase = investments.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

    const totalProfit = investments.reduce(
      (sum, item) => sum + Number(item.profit),
      0
    );

    const totalInvested = totalInvestmentBase + totalProfit;

    const profitability =
      totalInvestmentBase > 0 ? (totalProfit / totalInvestmentBase) * 100 : 0;

    return {
      caixaBalance,
      transactionsBalance,
      cardRows,
      totalLimit,
      totalUsed,
      availableLimit,
      totalInvested,
      totalProfit,
      profitability,
      totalGeneral: caixaBalance + totalInvested,
    };
  }, [transactions, accounts, cards, items, investments]);

  function openBalanceModal() {
    setBalanceValue(
      data.caixaBalance.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    setShowBalanceModal(true);
  }

  async function saveBalance() {
    const desiredCurrentBalance = parseBRLInput(balanceValue);

    if (Number.isNaN(desiredCurrentBalance)) {
      alert("Informe um saldo válido.");
      return;
    }

    const account = accounts.find((item) => item.active !== false);

    if (!account) {
      alert("Conta Caixa não encontrada.");
      return;
    }

    const newInitialBalance = desiredCurrentBalance - data.transactionsBalance;

    setSavingBalance(true);

    const { data: updatedAccount, error } = await supabase
      .from("accounts")
      .update({
        balance: newInitialBalance,
      })
      .eq("id", account.id)
      .select("id, name, balance")
      .single();

    setSavingBalance(false);

    if (error) {
      console.error("ERRO AO ATUALIZAR SALDO:", error);
      alert(error.message);
      return;
    }

    console.log("SALDO ATUALIZADO:", updatedAccount);

    setShowBalanceModal(false);
    await loadData();
  }

  async function saveInvestmentTransaction() {
    const amount = parseBRLInput(investmentAmount);

    if (!amount || amount <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    setSavingInvestment(true);

    const currentInvestment = investments.find(
      (item) => item.id === investmentId
    );

    if (!currentInvestment) {
      alert("Investimento não encontrado.");
      setSavingInvestment(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("investment_transactions")
      .insert({
        investment_id: investmentId,
        type: investmentType,
        amount,
        transaction_date: investmentDate,
      });

    if (insertError) {
      console.error("Erro insert investment_transactions:", insertError);
      alert(insertError.message);
      setSavingInvestment(false);
      return;
    }

    const nextAmount =
      investmentType === "aporte"
        ? currentInvestment.amount + amount
        : investmentType === "saque"
          ? currentInvestment.amount - amount
          : currentInvestment.amount;

    const nextProfit =
      investmentType === "rendimento"
        ? currentInvestment.profit + amount
        : currentInvestment.profit;

    const { error: updateError } = await supabase
      .from("investments")
      .update({
        amount: nextAmount,
        profit: nextProfit,
      })
      .eq("id", investmentId);

    if (updateError) {
      console.error("Erro update investments:", updateError);
      alert(updateError.message);
      setSavingInvestment(false);
      return;
    }

    setShowInvestmentModal(false);
    setInvestmentAmount("");
    setInvestmentType("aporte");
    setInvestmentId("cdi");
    setInvestmentDate(new Date().toISOString().split("T")[0]);

    await loadData();

    setSavingInvestment(false);
  }

  return (
    <main className="min-h-screen">
      <section className="w-full px-8 py-7">
        <header className="mb-7 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Cartões e Contas
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Gerencie seus cartões, contas, investimentos e movimentações.
            </p>
          </div>

          <Link
            href="/importar"
            className="flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300"
          >
            <Plus size={18} />
            Nova importação
          </Link>
        </header>

        {loading ? (
          <div className="flex h-[60vh] items-center justify-center text-zinc-500">
            <Loader2 size={22} className="mr-2 animate-spin" />
            Carregando...
          </div>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-4 gap-5">
              <TopCard
                title="Total geral"
                value={formatBRL(data.totalGeneral)}
              />
              <TopCard title="Disponível" value={formatBRL(data.caixaBalance)} />
              <TopCard
                title="Parcelas em aberto"
                value={formatBRL(data.totalUsed)}
              />
              <TopCard title="Limite total" value={formatBRL(data.totalLimit)} />
            </section>

            <section className="grid grid-cols-12 items-stretch gap-5">
              <div className="col-span-6 flex flex-col gap-5">
                <Panel
                  title="Contas"
                  action="Editar Saldo"
                  onAction={openBalanceModal}
                >
                  <AccountRow
                    icon="/icons/caixa.png"
                    title="Conta Caixa"
                    subtitle="Conta corrente"
                    value={formatBRL(data.caixaBalance)}
                  />
                </Panel>

                <section className="flex flex-1 flex-col rounded-3xl border border-white/10 bg-[#081018]/90">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                    <h3 className="text-lg font-semibold">Investimentos</h3>

                    <button
                      onClick={() => setShowInvestmentModal(true)}
                      className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
                    >
                      <SquarePen size={16} />
                      Adicionar Rendimento
                    </button>
                  </div>

                  <div className="flex flex-1 px-5 py-2">
                    <InvestmentCard
                      investments={investments}
                      totalInvested={data.totalInvested}
                      totalProfit={data.totalProfit}
                      profitability={data.profitability}
                    />
                  </div>
                </section>
              </div>

              <div className="col-span-6 flex">
                <Panel title="Cartões de crédito" className="h-full w-full">
                  <div className="flex h-full flex-col justify-between">
                    <div className="space-y-6">
                      {data.cardRows.map((card) => (
                        <div
                          key={card.id}
                          className="border-b border-white/10 pb-6 last:border-0 last:pb-0"
                        >
                          <div className="grid grid-cols-[1fr_220px_30px] items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/5">
                                <Image
                                  src={card.icon}
                                  alt={card.name}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-contain"
                                />
                              </div>

                              <div>
                                <p className="font-medium text-zinc-100">
                                  {card.name}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {card.subtitle}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-2xl font-semibold leading-none text-white">
                                {formatBRL(card.used)}
                              </p>
                              <p className="mt-2 text-sm text-zinc-500">
                                de {formatBRL(card.limit)}
                              </p>
                            </div>

                            <div className="flex justify-end">
                              <MoreHorizontal
                                size={20}
                                className="text-zinc-500"
                              />
                            </div>
                          </div>

                          <div className="mt-5 grid grid-cols-[1fr_45px] items-center gap-4">
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full ${card.barClass}`}
                                style={{ width: `${card.percent}%` }}
                              />
                            </div>

                            <span className="w-10 text-right text-xs text-zinc-400">
                              {card.percent.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
                      <InfoBox
                        title="Utilizado"
                        value={formatBRL(data.totalUsed)}
                      />
                      <InfoBox
                        title="Disponível"
                        value={formatBRL(data.availableLimit)}
                      />
                      <InfoBox
                        title="Limite total"
                        value={formatBRL(data.totalLimit)}
                      />
                    </div>
                  </div>
                </Panel>
              </div>

              <div className="col-span-12">
                <Panel title="Evolução dos investimentos">
                  <InvestmentsLineChart transactions={investmentTransactions} />
                </Panel>
              </div>
            </section>
          </>
        )}
      </section>

      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081018] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Editar saldo da Caixa</h3>

              <button
                onClick={() => setShowBalanceModal(false)}
                className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mb-2 block text-sm text-zinc-400">
              Novo saldo atual
            </label>
            <input
              value={balanceValue}
              onChange={(event) => setBalanceValue(event.target.value)}
              placeholder="Ex: 19.610,91"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
            />

            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Esse campo ajusta o saldo inicial da Conta Caixa para que o saldo
              atual fique exatamente no valor informado.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowBalanceModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={saveBalance}
                disabled={savingBalance}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingBalance ? "Salvando..." : "Salvar saldo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvestmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081018] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Nova movimentação</h3>

              <button
                onClick={() => setShowInvestmentModal(false)}
                className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Investimento
                </label>
                <select
                  value={investmentId}
                  onChange={(event) => setInvestmentId(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-zinc-700 bg-[#081018] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                >
                  {investments.map((investment) => (
                    <option
                      key={investment.id}
                      value={investment.id}
                      className="bg-[#081018] text-white"
                    >
                      {investment.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">Tipo</label>
                <select
                  value={investmentType}
                  onChange={(event) =>
                    setInvestmentType(
                      event.target.value as InvestmentTransaction["type"]
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-zinc-700 bg-[#081018] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option value="aporte" className="bg-[#081018] text-white">
                    Aporte
                  </option>
                  <option value="rendimento" className="bg-[#081018] text-white">
                    Rendimento
                  </option>
                  <option value="saque" className="bg-[#081018] text-white">
                    Saque
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Valor
                </label>
                <input
                  value={investmentAmount}
                  onChange={(event) => setInvestmentAmount(event.target.value)}
                  placeholder="Ex: 1000 ou 1.000,50"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">Data</label>
                <input
                  type="date"
                  value={investmentDate}
                  onChange={(event) => setInvestmentDate(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowInvestmentModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={saveInvestmentTransaction}
                disabled={savingInvestment}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingInvestment ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function TopCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-6">
      <p className="text-sm text-zinc-500">{title}</p>
      <strong className="mt-4 block text-2xl font-semibold text-white">
        {value}
      </strong>
      <p className="mt-2 text-xs text-zinc-600">Atualizado automaticamente</p>
    </div>
  );
}

function Panel({
  title,
  action,
  onAction,
  children,
  className = "",
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-[#081018]/90 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h3 className="text-lg font-semibold">{title}</h3>

        {action && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
          >
            <SquarePen size={16} />
            {action}
          </button>
        )}
      </div>

      <div className="h-[calc(100%-65px)] p-5">{children}</div>
    </section>
  );
}

function AccountRow({
  icon,
  title,
  subtitle,
  value,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_190px_30px] items-center gap-4 border-b border-white/10 py-2 last:border-0">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white/5">
          <Image
            src={icon}
            alt={title}
            width={56}
            height={56}
            className="h-full w-full object-contain"
          />
        </div>

        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
      </div>

      <strong className="text-right text-2xl font-semibold text-white">
        {value}
      </strong>

      <div className="flex justify-end">
        <MoreHorizontal size={20} className="text-zinc-500" />
      </div>
    </div>
  );
}

function InvestmentCard({
  investments,
  totalInvested,
  totalProfit,
  profitability,
}: {
  investments: Investment[];
  totalInvested: number;
  totalProfit: number;
  profitability: number;
}) {
  return (
    <div className="flex w-full flex-1 flex-col justify-between">
      <div>
        {investments.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
            Nenhum investimento cadastrado.
          </div>
        ) : (
          <div className="space-y-2">
            {investments.map((investment) => (
              <div
                key={investment.id}
                className="flex items-center justify-between border-b border-white/10 pb-2 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/5">
                    <Image
                      src={getInvestmentIcon(investment.id)}
                      alt={investment.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div>
                    <p className="font-medium">{investment.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {investment.description}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-semibold text-white">
                    {formatBRL(
                      Number(investment.amount) + Number(investment.profit)
                    )}
                  </p>
                  <p className="mt-1 text-sm text-emerald-400">
                    +{formatBRL(investment.profit)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
        <InfoBox title="Total investido" value={formatBRL(totalInvested)} />
        <InfoBox title="Rendimento" value={`+${formatBRL(totalProfit)}`} />
        <InfoBox title="Rentabilidade" value={`${profitability.toFixed(2)}%`} />
      </div>
    </div>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-zinc-500">{title}</p>
      <strong className="mt-1 block text-2xl font-semibold text-white">
        {value}
      </strong>
    </div>
  );
}