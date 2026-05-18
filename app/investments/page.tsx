"use client";

import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {

    Info,
    PiggyBank,
    Plus,
    TrendingUp,
    Wallet,
    X,
    History,
    Pencil,
    Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Investment = {
    id: string;
    name: string;
    type: string;
    color: string | null;
    initial_amount: number;
    current_amount: number;
    created_at: string;
};

type InvestmentTransaction = {
    id: string;
    investment_id: string;
    type: "aporte" | "rendimento" | "saque";
    amount: number;
    description: string | null;
    created_at: string;
};

type ChartPoint = {
    date: string;
    originalDate: string;
    value: number;
};

function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function formatPercent(value: number) {
    return `${value.toFixed(2).replace(".", ",")}%`;
}

function parseBRL(value: string) {
    const clean = value.replace(/\./g, "").replace(",", ".");
    return Number(clean) || 0;
}

function formatChartDate(value: string) {
    return new Date(value).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
    });
}

function buildChartData(
    investment: Investment,
    transactions: InvestmentTransaction[]
): ChartPoint[] {
    const ordered = transactions
        .filter((item) => item.investment_id === investment.id)
        .sort(
            (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

    let runningTotal = Number(investment.initial_amount || 0);

    if (ordered.length === 0) {
        return [
            {
                date: formatChartDate(investment.created_at),
                originalDate: investment.created_at,
                value: Number(investment.current_amount || 0),
            },
        ];
    }

    return ordered.map((item) => {
        if (item.type === "saque") {
            runningTotal -= Number(item.amount || 0);
        } else {
            runningTotal += Number(item.amount || 0);
        }

        return {
            date: formatChartDate(item.created_at),
            originalDate: item.created_at,
            value: runningTotal,
        };
    });
}

function SummaryCard({
    title,
    value,
    subtitle,
    positive = true,
}: {
    title: string;
    value: string;
    subtitle: string;
    positive?: boolean;
}) {

    return (
        <div className="rounded-2xl border border-zinc-800/80 bg-[#070b11]/90 p-6 shadow-[0_0_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-zinc-400">{title}</p>

                    <h3 className="mt-4 text-[30px] font-normal tracking-tight text-white">
                        {value}
                    </h3>

                    <p
                        className={`mt-3 text-sm ${positive ? "text-orange-400" : "text-red-400"
                            }`}
                    >
                        {subtitle}
                    </p>
                </div>


            </div>
        </div>
    );
}

function InvestmentCard({
    investment,
    transactions,
    onAdd,
    onHistory,
}: {
    investment: Investment;
    transactions: InvestmentTransaction[];
    onAdd: (investment: Investment) => void;
    onHistory: (investment: Investment) => void;
}) {
    const [selectedPeriod, setSelectedPeriod] = useState("6");

    const allChartData = buildChartData(investment, transactions);

    const chartData = allChartData.filter((item: any) => {
        const months = Number(selectedPeriod);

        const itemDate = new Date(item.originalDate);

        const limitDate = new Date();

        limitDate.setMonth(limitDate.getMonth() - months);

        return itemDate >= limitDate;
    });

    const investmentTransactions = transactions.filter(
        (item) => item.investment_id === investment.id
    );

    const aportes = investmentTransactions
        .filter((item) => item.type === "aporte")
        .reduce((acc, item) => acc + Number(item.amount || 0), 0);

    const rendimentos = investmentTransactions
        .filter((item) => item.type === "rendimento")
        .reduce((acc, item) => acc + Number(item.amount || 0), 0);

    const saques = investmentTransactions
        .filter((item) => item.type === "saque")
        .reduce((acc, item) => acc + Number(item.amount || 0), 0);

    const valorInvestido =
        Number(investment.initial_amount || 0) + aportes - saques;

    const rentabilidade =
        valorInvestido > 0
            ? (rendimentos / valorInvestido) * 100
            : 0;

    const color = "#f97316";

    return (
        <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-[#05090d]/95 shadow-[0_0_80px_rgba(0,0,0,0.45)]">
            <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr]">
                <div className="border-b border-zinc-900 p-6 xl:border-b-0 xl:border-r">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-full shadow-[0_0_35px_rgba(16,185,129,0.22)]"
                            style={{ background: color }}
                        >
                            {investment.name.toLowerCase().includes("porquinho") ? (
                                <PiggyBank className="h-5 w-5 text-white" />
                            ) : (
                                <Wallet className="h-5 w-5 text-white" />
                            )}
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-white">
                                {investment.name}
                            </h3>

                            <div className="mt-2 flex items-center gap-2">
                                <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
                                    {investment.type}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-5">
                        <div>
                            <p className="text-sm text-zinc-500">Valor investido</p>
                            <h4 className="mt-1 text-lg font-light text-white">
                                {formatBRL(valorInvestido)}
                            </h4>
                        </div>

                        <div>
                            <p className="text-sm text-zinc-500">Rendimento</p>
                            <h4 className="mt-1 text-lg font-light text-emerald-400">
                                {formatBRL(rendimentos)} ({formatPercent(rentabilidade)})
                            </h4>
                        </div>

                        <div>
                            <p className="text-sm text-zinc-500">Valor atual</p>
                            <h4 className="mt-1 text-lg font-light text-white">
                                {formatBRL(Number(investment.current_amount || 0))}
                            </h4>
                        </div>
                    </div>

                    <button
                        onClick={() => onAdd(investment)}
                        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition hover:scale-[1.02]"
                        style={{
                            borderColor: color,
                            color,
                        }}
                    >
                        <Plus className="h-4 w-4" />
                        Adicionar valor
                    </button>
                </div>

                <div className="relative p-6">
                    <div className="mb-6 flex justify-end gap-3">
                        <select
                            value={selectedPeriod}
                            onChange={(event) => setSelectedPeriod(event.target.value)}
                            className="h-11 rounded-xl border border-zinc-800 bg-[#05090d] px-4 text-sm text-white outline-none transition hover:border-zinc-700 focus:border-emerald-500"
                        >
                            <option value="3">Últimos 3 meses</option>
                            <option value="6">Últimos 6 meses</option>
                            <option value="12">Últimos 12 meses</option>
                        </select>

                        <button
                            onClick={() => onHistory(investment)}
                            className="flex h-11 items-center gap-2 rounded-xl border border-zinc-800 bg-[#05090d] px-4 text-sm text-zinc-300 transition hover:border-emerald-500 hover:text-white"
                        >
                            <History className="h-4 w-4" />
                            Histórico
                        </button>
                    </div>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient
                                        id={`gradient-${investment.id}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid stroke="#18181b" vertical={false} />

                                <XAxis
                                    dataKey="date"
                                    stroke="#71717a"
                                    tickLine={false}
                                    axisLine={false}
                                />

                                <YAxis
                                    stroke="#71717a"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                                />

                                <Tooltip
                                    contentStyle={{
                                        background: "#05090d",
                                        border: "1px solid #27272a",
                                        borderRadius: "14px",
                                        color: "#fff",
                                    }}
                                    formatter={(value) => {
                                        const numericValue =
                                            typeof value === "number" ? value : Number(value || 0);

                                        return formatBRL(numericValue);
                                    }}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={color}
                                    strokeWidth={3}
                                    fill={`url(#gradient-${investment.id})`}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function InvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedInvestment, setSelectedInvestment] =
        useState<Investment | null>(null);

    const [historyInvestment, setHistoryInvestment] =
        useState<Investment | null>(null);

    const [transactionType, setTransactionType] =
        useState<InvestmentTransaction["type"]>("aporte");

    const [amount, setAmount] = useState("");

    const [transactionDate, setTransactionDate] = useState("");

    const [editingTransaction, setEditingTransaction] =
        useState<InvestmentTransaction | null>(null);

    const [editAmount, setEditAmount] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editDate, setEditDate] = useState("");

    const [deletingTransaction, setDeletingTransaction] =
        useState<InvestmentTransaction | null>(null);

    async function loadData() {
        setLoading(true);

        const { data: investmentsData, error: investmentsError } =
            await supabase
                .from("investments")
                .select("*")
                .order("created_at", { ascending: true });

        if (investmentsError) {
            toast.error("Erro ao carregar investimentos.");
            setLoading(false);
            return;
        }

        const { data: transactionsData, error: transactionsError } =
            await supabase
                .from("investment_transactions")
                .select("*")
                .order("created_at", { ascending: true });

        if (transactionsError) {
            toast.error("Erro ao carregar histórico.");
            setLoading(false);
            return;
        }

        setInvestments((investmentsData || []) as Investment[]);
        setTransactions(
            (transactionsData || []) as InvestmentTransaction[]
        );

        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, []);

    const totals = useMemo(() => {
        const patrimonio = investments.reduce(
            (acc, item) => acc + Number(item.current_amount || 0),
            0
        );

        const aportes = transactions
            .filter((item) => item.type === "aporte")
            .reduce((acc, item) => acc + Number(item.amount || 0), 0);

        const rendimentos = transactions
            .filter((item) => item.type === "rendimento")
            .reduce((acc, item) => acc + Number(item.amount || 0), 0);

        const saques = transactions
            .filter((item) => item.type === "saque")
            .reduce((acc, item) => acc + Number(item.amount || 0), 0);

        const initialAmount = investments.reduce(
            (acc, item) => acc + Number(item.initial_amount || 0),
            0
        );

        const investido = initialAmount + aportes - saques;

        const rentabilidade =
            investido > 0 ? (rendimentos / investido) * 100 : 0;

        return {
            patrimonio,
            investido,
            rendimento: rendimentos,
            rentabilidade,
            quantidade: investments.length,
        };
    }, [investments, transactions]);

    function openModal(investment: Investment) {
        setSelectedInvestment(investment);
        setTransactionType("aporte");
        setAmount("");

        setTransactionDate(new Date().toISOString().split("T")[0]);
    }

    async function handleSaveTransaction() {
        if (!selectedInvestment) return;

        const parsedAmount = parseBRL(amount);

        if (parsedAmount <= 0) {
            toast.error("Informe um valor válido.");
            return;
        }

        const newCurrentAmount =
            transactionType === "saque"
                ? Number(selectedInvestment.current_amount || 0) - parsedAmount
                : Number(selectedInvestment.current_amount || 0) + parsedAmount;

        const { error: transactionError } = await supabase
            .from("investment_transactions")
            .insert({
                investment_id: selectedInvestment.id,
                type: transactionType,
                amount: parsedAmount,
                description: null,
                created_at: transactionDate
                    ? new Date(`${transactionDate}T12:00:00`).toISOString()
                    : new Date().toISOString(),
            });

        if (transactionError) {
            toast.error("Erro ao salvar movimentação.");
            return;
        }

        const { error: updateError } = await supabase
            .from("investments")
            .update({
                current_amount: newCurrentAmount,
            })
            .eq("id", selectedInvestment.id);

        if (updateError) {
            toast.error("Movimentação salva, mas erro ao atualizar saldo.");
            return;
        }

        toast.success("Movimentação salva com sucesso.");
        setSelectedInvestment(null);
        loadData();
    }

    async function recalculateInvestmentBalance(investmentId: string) {
        const { data, error } = await supabase
            .from("investment_transactions")
            .select("*")
            .eq("investment_id", investmentId);

        if (error) {
            toast.error("Erro ao recalcular saldo.");
            return;
        }

        const investment = investments.find((item) => item.id === investmentId);

        const total = (data || []).reduce((acc, item) => {
            if (item.type === "saque") {
                return acc - Number(item.amount || 0);
            }

            return acc + Number(item.amount || 0);
        }, Number(investment?.initial_amount || 0));

        const { error: updateError } = await supabase
            .from("investments")
            .update({
                current_amount: total,
            })
            .eq("id", investmentId);

        if (updateError) {
            toast.error("Erro ao atualizar saldo.");
        }
    }

    function handleDeleteTransaction(transaction: InvestmentTransaction) {
        setDeletingTransaction(transaction);
    }

    function handleEditTransaction(transaction: InvestmentTransaction) {
        setEditingTransaction(transaction);
        setEditAmount(String(transaction.amount).replace(".", ","));
        setEditDescription(transaction.description || "");
        setEditDate(new Date(transaction.created_at).toISOString().split("T")[0]);
    }

    async function confirmDeleteTransaction() {
        if (!deletingTransaction) return;

        const investmentId = deletingTransaction.investment_id;

        const { data, error } = await supabase
            .from("investment_transactions")
            .delete()
            .eq("id", deletingTransaction.id)
            .select();

        if (error) {
            toast.error(`Erro ao apagar: ${error.message}`);
            return;
        }

        if (!data || data.length === 0) {
            toast.error("Nenhum registro foi apagado. Verifique a policy de DELETE no Supabase.");
            return;
        }

        await recalculateInvestmentBalance(investmentId);
        await loadData();

        setDeletingTransaction(null);
        toast.success("Movimentação apagada.");
    }

    async function confirmEditTransaction() {
        if (!editingTransaction) return;

        const parsedAmount = parseBRL(editAmount);

        if (parsedAmount <= 0) {
            toast.error("Informe um valor válido.");
            return;
        }

        const { error } = await supabase
            .from("investment_transactions")
            .update({
                amount: parsedAmount,
                description: editDescription || null,
                created_at: editDate
                    ? new Date(`${editDate}T12:00:00`).toISOString()
                    : editingTransaction.created_at,
            })
            .eq("id", editingTransaction.id);

        if (error) {
            toast.error("Erro ao editar movimentação.");
            return;
        }

        await recalculateInvestmentBalance(editingTransaction.investment_id);
        await loadData();

        toast.success("Movimentação atualizada.");
        setEditingTransaction(null);
    }

    return (
        <main className="min-h-screen bg-[#03070b] px-8 py-8 text-white">
            <Toaster position="top-center" />

            <div className="mb-8 flex items-start justify-between gap-6">
                <div>
                    <h1 className="text-[42px] font-semibold text-white">Investimentos</h1>

                    <p className="mt-3 text-sm text-zinc-400">
                        Acompanhe a evolução dos seus investimentos.
                    </p>
                </div>


            </div>

            <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-4">
                <SummaryCard
                    title="Patrimônio total"
                    value={formatBRL(totals.patrimonio)}
                    subtitle="Valor atual da carteira"
                />

                <SummaryCard
                    title="Rendimento total"
                    value={formatBRL(totals.rendimento)}
                    subtitle={formatPercent(totals.rentabilidade)}
                    positive={totals.rendimento >= 0}
                />

                <SummaryCard
                    title="Investimentos"
                    value={String(totals.quantidade)}
                    subtitle="Ativos"
                />

                <SummaryCard
                    title="Rentabilidade"
                    value={formatPercent(totals.rentabilidade)}
                    subtitle="No período"
                    positive={totals.rentabilidade >= 0}
                />
            </section>

            {loading ? (
                <div className="rounded-3xl border border-zinc-800 bg-[#05090d] p-10 text-center text-zinc-400">
                    Carregando investimentos...
                </div>
            ) : investments.length === 0 ? (
                <div className="rounded-3xl border border-zinc-800 bg-[#05090d] p-10 text-center">
                    <h2 className="text-xl font-semibold text-white">
                        Nenhum investimento cadastrado
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                        Crie seus investimentos na tabela investments para a página exibir
                        os dados reais.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {investments.map((investment) => (
                        <InvestmentCard
                            key={investment.id}
                            investment={investment}
                            transactions={transactions}
                            onAdd={openModal}
                            onHistory={setHistoryInvestment}
                        />
                    ))}
                </div>
            )}

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-[#05090d]/90 p-5">
                <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
                        <Info className="h-5 w-5 text-emerald-400" />
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold">
                            Rentabilidade no período
                        </h4>

                        <p className="mt-1 text-sm text-zinc-500">
                            Os dados são calculados com base nas movimentações reais salvas no
                            Supabase.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3 text-sm text-zinc-600">
                <TrendingUp className="h-4 w-4" />
                Seus dados estão protegidos com segurança de ponta.
            </div>

            {selectedInvestment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
                    <div className="w-full max-w-[480px] overflow-hidden rounded-3xl border border-zinc-800 bg-[#05090d] shadow-[0_0_90px_rgba(0,0,0,0.85)]">
                        <div className="border-b border-zinc-900 bg-gradient-to-br from-zinc-900/80 via-[#05090d] to-emerald-950/20 p-6">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
                                        Movimentação
                                    </p>

                                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                                        Adicionar valor
                                    </h2>

                                    <p className="mt-2 text-sm text-zinc-500">
                                        {selectedInvestment.name}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setSelectedInvestment(null)}
                                    className="rounded-xl border border-zinc-800 bg-black/30 p-2 text-zinc-400 transition hover:border-zinc-600 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm text-zinc-400">
                                    Tipo de movimentação
                                </label>

                                <select
                                    value={transactionType}
                                    onChange={(event) =>
                                        setTransactionType(
                                            event.target.value as InvestmentTransaction["type"]
                                        )
                                    }
                                    className="h-12 w-full rounded-xl border border-zinc-800 bg-[#080d13] px-4 text-sm text-white outline-none transition focus:border-emerald-500"
                                >
                                    <option value="aporte">Aporte</option>
                                    <option value="rendimento">Rendimento</option>
                                    <option value="saque">Saque</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-zinc-400">
                                    Valor
                                </label>

                                <input
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    placeholder="0,00"
                                    className="h-12 w-full rounded-xl border border-zinc-800 bg-[#080d13] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-zinc-400">
                                    Data
                                </label>

                                <input
                                    type="date"
                                    value={transactionDate}
                                    onChange={(event) => setTransactionDate(event.target.value)}
                                    className="h-12 w-full rounded-xl border border-zinc-800 bg-[#080d13] px-4 text-sm text-white outline-none transition focus:border-orange-500"
                                />
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm">
                                <div className="mb-3 flex justify-between">
                                    <span className="text-zinc-500">Saldo atual</span>
                                    <strong className="font-medium text-white">
                                        {formatBRL(Number(selectedInvestment.current_amount || 0))}
                                    </strong>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Valor informado</span>
                                    <strong className="font-medium text-emerald-400">
                                        {formatBRL(parseBRL(amount))}
                                    </strong>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setSelectedInvestment(null)}
                                    className="h-12 flex-1 rounded-xl border border-zinc-800 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={handleSaveTransaction}
                                    className="h-12 flex-1 rounded-xl bg-emerald-500 text-sm font-black text-white transition hover:scale-[1.02] hover:bg-emerald-400"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {historyInvestment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
                    <div className="w-full max-w-[720px] overflow-hidden rounded-3xl border border-zinc-800 bg-[#05090d] shadow-[0_0_90px_rgba(0,0,0,0.85)]">
                        <div className="border-b border-zinc-900 bg-gradient-to-br from-zinc-900/80 via-[#05090d] to-emerald-950/20 p-6">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
                                        Histórico
                                    </p>

                                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                                        {historyInvestment.name}
                                    </h2>

                                    <p className="mt-2 text-sm text-zinc-500">
                                        Movimentações registradas.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setHistoryInvestment(null)}
                                    className="rounded-xl border border-zinc-800 bg-black/30 p-2 text-zinc-400 transition hover:border-zinc-600 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[520px] overflow-y-auto p-6">
                            {transactions.filter(
                                (item) => item.investment_id === historyInvestment.id
                            ).length === 0 ? (
                                <div className="rounded-2xl border border-zinc-800 bg-black/30 p-8 text-center text-sm text-zinc-500">
                                    Nenhuma movimentação registrada.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions
                                        .filter(
                                            (item) =>
                                                item.investment_id === historyInvestment.id
                                        )
                                        .sort(
                                            (a, b) =>
                                                new Date(b.created_at).getTime() -
                                                new Date(a.created_at).getTime()
                                        )
                                        .map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-black/30 p-4"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`rounded-lg px-3 py-1 text-xs font-bold uppercase ${item.type === "saque"
                                                                ? "bg-red-500/10 text-red-400"
                                                                : item.type === "rendimento"
                                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                                    : "bg-blue-500/10 text-blue-400"
                                                                }`}
                                                        >
                                                            {item.type}
                                                        </span>

                                                        <span className="text-sm text-zinc-500">
                                                            {new Date(
                                                                item.created_at
                                                            ).toLocaleDateString("pt-BR")}
                                                        </span>
                                                    </div>

                                                    {item.description && (
                                                        <p className="mt-2 text-sm text-zinc-400">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <strong
                                                        className={`text-lg font-medium ${item.type === "saque"
                                                            ? "text-red-400"
                                                            : "text-emerald-400"
                                                            }`}
                                                    >
                                                        {item.type === "saque" ? "- " : "+ "}
                                                        {formatBRL(Number(item.amount || 0))}
                                                    </strong>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEditTransaction(item)}
                                                            className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2 text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteTransaction(item)}
                                                            className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2 text-zinc-400 transition hover:border-red-500 hover:text-red-400"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {editingTransaction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
                    <div className="w-full max-w-[460px] overflow-hidden rounded-3xl border border-zinc-800 bg-[#05090d] shadow-[0_0_90px_rgba(0,0,0,0.85)]">
                        <div className="border-b border-zinc-900 bg-gradient-to-br from-zinc-900/80 via-[#05090d] to-orange-950/20 p-6">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-400">
                                        Editar movimentação
                                    </p>

                                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                                        Atualizar registro
                                    </h2>
                                </div>

                                <button
                                    onClick={() => setEditingTransaction(null)}
                                    className="rounded-xl border border-zinc-800 bg-black/30 p-2 text-zinc-400 transition hover:border-zinc-600 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm text-zinc-400">
                                    Valor
                                </label>

                                <input
                                    value={editAmount}
                                    onChange={(event) =>
                                        setEditAmount(event.target.value)
                                    }
                                    className="h-12 w-full rounded-xl border border-zinc-800 bg-[#080d13] px-4 text-sm text-white outline-none transition focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-zinc-400">
                                    Data
                                </label>

                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={(event) =>
                                        setEditDate(event.target.value)
                                    }
                                    className="h-12 w-full rounded-xl border border-zinc-800 bg-[#080d13] px-4 text-sm text-white outline-none transition focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-zinc-400">
                                    Observação
                                </label>

                                <input
                                    value={editDescription}
                                    onChange={(event) =>
                                        setEditDescription(event.target.value)
                                    }
                                    placeholder="Opcional"
                                    className="h-12 w-full rounded-xl border border-zinc-800 bg-[#080d13] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setEditingTransaction(null)}
                                    className="h-12 flex-1 rounded-xl border border-zinc-800 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={confirmEditTransaction}
                                    className="h-12 flex-1 rounded-xl bg-orange-500 text-sm font-black text-white transition hover:scale-[1.02] hover:bg-orange-400"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {deletingTransaction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
                    <div className="w-full max-w-[430px] overflow-hidden rounded-3xl border border-zinc-800 bg-[#05090d] shadow-[0_0_90px_rgba(0,0,0,0.85)]">
                        <div className="border-b border-zinc-900 bg-gradient-to-br from-zinc-900/80 via-[#05090d] to-red-950/20 p-6">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-red-400">
                                        Excluir registro
                                    </p>

                                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                                        Confirmar exclusão
                                    </h2>
                                </div>

                                <button
                                    onClick={() => setDeletingTransaction(null)}
                                    className="rounded-xl border border-zinc-800 bg-black/30 p-2 text-zinc-400 transition hover:border-zinc-600 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5 p-6">
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                                <p className="text-sm text-zinc-300">
                                    Tem certeza que deseja apagar esta movimentação?
                                </p>

                                <p className="mt-2 text-lg font-semibold text-red-400">
                                    {formatBRL(Number(deletingTransaction.amount || 0))}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setDeletingTransaction(null)}
                                    className="h-12 flex-1 rounded-xl border border-zinc-800 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={confirmDeleteTransaction}
                                    className="h-12 flex-1 rounded-xl bg-red-500 text-sm font-black text-white transition hover:scale-[1.02] hover:bg-red-400"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}