"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    LineChart,
    Loader2,
    Plus,
    Trash2,
    Wallet,
    X,
} from "lucide-react";
import {
    CartesianGrid,
    Line,
    LineChart as RechartsLineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { supabase } from "@/lib/supabase";

type HouseName = "Bet365" | "Betano" | "Superbet";
type MovementType = "base" | "deposit" | "profit" | "loss" | "withdraw";
type ChartRange = 3 | 6 | 12;

type BetAccount = {
    id: string;
    name: string;
    balance: number | null;
};

type BetTransaction = {
    id: string;
    type: string;
    from_account: string | null;
    to_account: string | null;
    amount: number;
    created_at: string;
    description?: string | null;
};

type ChartRow = {
    month: string;
    Bet365: number;
    Betano: number;
    Superbet: number;
};

const HOUSES: HouseName[] = ["Bet365", "Betano", "Superbet"];

const LOGO_BY_HOUSE: Record<HouseName, string> = {
    Bet365: "/icons/bet365.png",
    Betano: "/icons/betano.png",
    Superbet: "/icons/superbet.png",
};

const HOUSE_COLORS: Record<HouseName, string> = {
    Bet365: "#22c55e",
    Betano: "#f97316",
    Superbet: "#ef4444",
};

const HOUSE_DOT_COLORS: Record<HouseName, string> = {
    Bet365: "bg-emerald-400",
    Betano: "bg-orange-400",
    Superbet: "bg-red-400",
};

function formatBRL(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function parseBRL(value: string) {
    return Number(value.replace(/\./g, "").replace(",", ".").trim());
}

function todayInputDate() {
    return new Date().toISOString().slice(0, 10);
}

function parseHouseName(value?: string | null): HouseName | null {
    if (!value) return null;

    const normalized = value.toLowerCase();

    if (normalized.includes("bet365")) return "Bet365";
    if (normalized.includes("betano")) return "Betano";
    if (normalized.includes("superbet")) return "Superbet";

    return null;
}

function getTransactionHouse(transaction: BetTransaction): HouseName | null {
    return (
        parseHouseName(transaction.to_account) ??
        parseHouseName(transaction.from_account)
    );
}

function getTypeLabel(type: string) {
    if (type === "base") return "Valor base";
    if (type === "deposit") return "Depósito";
    if (type === "withdraw") return "Saque";
    if (type === "profit") return "Lucro";
    if (type === "loss") return "Perda";
    if (type === "bet") return "Aposta";
    return type;
}

function getPerformanceAmount(transaction: BetTransaction) {
    const amount = Math.abs(Number(transaction.amount ?? 0));

    if (transaction.type === "profit") return amount;
    if (transaction.type === "loss") return -amount;
    if (transaction.type === "bet") return -amount;

    return 0;
}

function getResultAmount(transaction: BetTransaction) {
    const amount = Math.abs(Number(transaction.amount ?? 0));

    if (transaction.type === "withdraw") return amount;
    if (transaction.type === "profit") return amount;

    if (transaction.type === "deposit") return -amount;
    if (transaction.type === "loss") return -amount;
    if (transaction.type === "bet") return -amount;

    return 0;
}

function getTypeColor(type: string) {
    if (type === "withdraw") return "text-blue-400";
    if (type === "deposit") return "text-orange-400";
    if (type === "profit") return "text-emerald-400";
    if (type === "base") return "text-cyan-400";

    return "text-red-400";
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function getMonthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
    )}`;
}

function getMonthLabel(date: Date) {
    return date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
    });
}

function isCurrentMonth(date: Date) {
    const now = new Date();

    return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    );
}

function isPreviousMonth(date: Date) {
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return (
        date.getMonth() === previous.getMonth() &&
        date.getFullYear() === previous.getFullYear()
    );
}

function getMonthComparison(current: number, previous: number) {
    if (previous === 0) {
        return current === 0 ? "0,0% vs mês anterior" : "Novo valor no mês";
    }

    const diff = current - previous;
    const percent = (diff / Math.abs(previous)) * 100;
    const sign = diff >= 0 ? "+" : "-";

    return `${sign} ${Math.abs(percent).toFixed(1)}% (${sign} ${formatBRL(
        Math.abs(diff)
    )}) vs mês anterior`;
}

export default function BetsPage() {
    const [accounts, setAccounts] = useState<BetAccount[]>([]);
    const [transactions, setTransactions] = useState<BetTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [chartRange, setChartRange] = useState<ChartRange>(6);

    const [modalOpen, setModalOpen] = useState(false);
    const [formHouse, setFormHouse] = useState<HouseName>("Bet365");
    const [formType, setFormType] = useState<MovementType>("profit");
    const [formAmount, setFormAmount] = useState("");
    const [formDate, setFormDate] = useState(todayInputDate());
    const [saving, setSaving] = useState(false);

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [itemsPerPage, transactions]);

    async function loadData() {
        setLoading(true);

        const [accountsRes, transactionsRes] = await Promise.all([
            supabase.from("bet_accounts").select("*").order("name"),
            supabase
                .from("bet_transactions")
                .select("*")
                .order("created_at", { ascending: false }),
        ]);

        if (accountsRes.error || transactionsRes.error) {
            alert(
                accountsRes.error?.message ||
                transactionsRes.error?.message ||
                "Erro ao carregar bets."
            );
            setLoading(false);
            return;
        }

        setAccounts((accountsRes.data ?? []) as BetAccount[]);
        setTransactions((transactionsRes.data ?? []) as BetTransaction[]);
        setLoading(false);
    }

    async function getOrCreateAccount(house: HouseName) {
        const existing = accounts.find(
            (item) => parseHouseName(item.name) === house
        );

        if (existing) return existing;

        const { data, error } = await supabase
            .from("bet_accounts")
            .insert({
                name: house,
                balance: 0,
            })
            .select("*")
            .single();

        if (error) throw error;

        return data as BetAccount;
    }

    function resetForm() {
        setModalOpen(false);
        setFormAmount("");
        setFormType("profit");
        setFormHouse("Bet365");
        setFormDate(todayInputDate());
    }

    async function saveMovement() {
        const amount = parseBRL(formAmount);

        if (!amount || amount <= 0) {
            alert("Informe um valor válido.");
            return;
        }

        try {
            setSaving(true);

            const account = await getOrCreateAccount(formHouse);
            const currentBalance = Number(account.balance ?? 0);

            if (formType === "base") {
                const { error } = await supabase
                    .from("bet_accounts")
                    .update({ balance: amount })
                    .eq("id", account.id);

                if (error) throw error;

                resetForm();
                await loadData();
                return;
            }

            const nextBalance =
                formType === "deposit" || formType === "profit"
                    ? currentBalance + amount
                    : currentBalance - amount;

            const { error: accountError } = await supabase
                .from("bet_accounts")
                .update({ balance: nextBalance })
                .eq("id", account.id);

            if (accountError) throw accountError;

            const transactionPayload = {
                type:
                    formType === "deposit"
                        ? "deposit"
                        : formType === "profit"
                            ? "profit"
                            : formType === "loss"
                                ? "loss"
                                : "withdraw",
                from_account:
                    formType === "withdraw" || formType === "loss" ? formHouse : null,
                to_account:
                    formType === "deposit" || formType === "profit" ? formHouse : null,
                amount,
                description: getTypeLabel(formType),
                created_at: `${formDate}T12:00:00`,
            };

            const { error: transactionError } = await supabase
                .from("bet_transactions")
                .insert(transactionPayload);

            if (transactionError) {
                alert(transactionError.message);
                return;
            }

            resetForm();
            await loadData();
        } catch (error) {
            alert(
                error instanceof Error ? error.message : "Erro ao salvar movimentação."
            );
        } finally {
            setSaving(false);
        }
    }


    async function deleteMovement(id: string) {
        const confirmed = confirm("Deseja excluir essa movimentação?");
        if (!confirmed) return;

        const { error } = await supabase
            .from("bet_transactions")
            .delete()
            .eq("id", id);

        if (error) {
            alert(error.message);
            return;
        }

        await loadData();
    }

    const data = useMemo(() => {
        const visibleAccounts = HOUSES.map((house) => {
            const account = accounts.find(
                (item) => parseHouseName(item.name) === house
            );

            return {
                id: account?.id ?? house,
                name: house,
                balance: Number(account?.balance ?? 0),
            };
        });

        const totalBalance = visibleAccounts.reduce(
            (sum, item) => sum + Number(item.balance ?? 0),
            0
        );

        const currentMonthTransactions = transactions.filter((transaction) =>
            isCurrentMonth(new Date(transaction.created_at))
        );

        const previousMonthTransactions = transactions.filter((transaction) =>
            isPreviousMonth(new Date(transaction.created_at))
        );

        const totalDeposited = currentMonthTransactions
            .filter((item) => item.type === "deposit")
            .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

        const previousDeposited = previousMonthTransactions
            .filter((item) => item.type === "deposit")
            .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

        const totalWithdrawn = currentMonthTransactions
            .filter((item) => item.type === "withdraw")
            .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

        const previousWithdrawn = previousMonthTransactions
            .filter((item) => item.type === "withdraw")
            .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

        const monthResult = currentMonthTransactions.reduce(
            (sum, item) => sum + getResultAmount(item),
            0
        );

        const previousMonthResult = previousMonthTransactions.reduce(
            (sum, item) => sum + getResultAmount(item),
            0
        );

        const chartMonths = Array.from({ length: chartRange }).map((_, index) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (chartRange - 1 - index));
            date.setDate(1);

            return {
                key: getMonthKey(date),
                label: getMonthLabel(date),
            };
        });

        const performanceData: ChartRow[] = chartMonths.map((month) => {
            const row: ChartRow = {
                month: month.label,
                Bet365: 0,
                Betano: 0,
                Superbet: 0,
            };

            const monthTransactions = transactions.filter((transaction) => {
                const date = new Date(transaction.created_at);
                return getMonthKey(date) === month.key;
            });

            for (const transaction of monthTransactions) {
                const house = getTransactionHouse(transaction);
                if (!house) continue;

                row[house] += getPerformanceAmount(transaction);
            }

            return row;
        });

        const recentTransactions = [...transactions]
            .sort(
                (a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            .map((transaction) => {
                const house = getTransactionHouse(transaction);

                return {
                    ...transaction,
                    house,
                    displayAmount: getResultAmount(transaction),
                };
            });

        const totalPages = Math.max(
            1,
            Math.ceil(recentTransactions.length / itemsPerPage)
        );

        const safePage = Math.min(page, totalPages);

        const paginatedTransactions = recentTransactions.slice(
            (safePage - 1) * itemsPerPage,
            safePage * itemsPerPage
        );

        return {
            visibleAccounts,
            totalBalance,
            totalDeposited,
            previousDeposited,
            totalWithdrawn,
            previousWithdrawn,
            monthResult,
            previousMonthResult,
            performanceData,
            recentTransactions,
            paginatedTransactions,
            totalPages,
            safePage,
        };
    }, [accounts, transactions, chartRange, page, itemsPerPage]);

    return (
        <main className="min-h-screen w-full text-white">
            <section className="w-full px-8 py-7">
                <header className="mb-7 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight">Bets</h2>
                        <p className="mt-1 text-sm text-zinc-500">
                            Acompanhe seus resultados e controle suas apostas.
                        </p>
                    </div>

                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
                    >
                        <Plus size={18} />
                        Adicionar movimentação
                    </button>
                </header>

                {loading ? (
                    <div className="flex h-[60vh] items-center justify-center text-zinc-500">
                        <Loader2 size={22} className="mr-2 animate-spin" />
                        Carregando bets...
                    </div>
                ) : (
                    <>
                        <section className="mb-5 grid grid-cols-4 gap-4">
                            <TopCard
                                title="Saldo nas casas"
                                value={formatBRL(data.totalBalance)}
                                helper="Soma do saldo disponível"
                                icon={<Wallet size={25} />}
                                variant="green"
                            />

                            <TopCard
                                title="Total depositado"
                                value={formatBRL(data.totalDeposited)}
                                helper={getMonthComparison(
                                    data.totalDeposited,
                                    data.previousDeposited
                                )}
                                icon={<ArrowDown size={25} />}
                                variant="red"
                            />

                            <TopCard
                                title="Total sacado"
                                value={formatBRL(data.totalWithdrawn)}
                                helper={getMonthComparison(
                                    data.totalWithdrawn,
                                    data.previousWithdrawn
                                )}
                                icon={<ArrowUp size={25} />}
                                variant="green"
                            />

                            <TopCard
                                title="Resultado do mês"
                                value={formatBRL(data.monthResult)}
                                helper={getMonthComparison(
                                    data.monthResult,
                                    data.previousMonthResult
                                )}
                                icon={<LineChart size={25} />}
                                variant={data.monthResult >= 0 ? "purple" : "red"}
                            />
                        </section>

                        <section className="mb-5 grid grid-cols-[520px_1fr] gap-5">
                            <Panel title="Saldo por casa">
                                <div className="grid grid-cols-[1fr_140px] border-b border-white/10 pb-3 text-sm text-zinc-500">
                                    <span>Casa</span>
                                    <span className="text-right">Saldo</span>
                                </div>

                                <div className="divide-y divide-white/5">
                                    {data.visibleAccounts.map((house) => (
                                        <div
                                            key={house.id}
                                            className="grid grid-cols-[1fr_140px] items-center py-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={LOGO_BY_HOUSE[house.name]}
                                                    alt={house.name}
                                                    width={36}
                                                    height={36}
                                                    className="rounded-full"
                                                />
                                                <span className="font-medium">{house.name}</span>
                                            </div>

                                            <span className="text-right font-medium">
                                                {formatBRL(house.balance)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-4 font-semibold">
                                    <span>Total</span>
                                    <span>{formatBRL(data.totalBalance)}</span>
                                </div>
                            </Panel>

                            <Panel
                                title="Desempenho por casa"
                                action={
                                    <select
                                        value={chartRange}
                                        onChange={(event) =>
                                            setChartRange(Number(event.target.value) as ChartRange)
                                        }
                                        className="h-9 rounded-xl border border-white/10 bg-[#081018] px-3 text-sm text-white outline-none"
                                    >
                                        <option value={3}>3 meses</option>
                                        <option value={6}>6 meses</option>
                                        <option value={12}>12 meses</option>
                                    </select>
                                }
                            >
                                <div className="mb-4 flex items-center gap-6 text-sm">
                                    <Legend color={HOUSE_DOT_COLORS.Bet365} label="Bet365" />
                                    <Legend color={HOUSE_DOT_COLORS.Betano} label="Betano" />
                                    <Legend color={HOUSE_DOT_COLORS.Superbet} label="Superbet" />
                                </div>

                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsLineChart data={data.performanceData}>
                                            <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
                                            <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} />
                                            <YAxis
                                                stroke="#94a3b8"
                                                tickLine={false}
                                                tickFormatter={(value) => `R$ ${value}`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#081018",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: "16px",
                                                }}
                                                formatter={(value) => formatBRL(Number(value))}
                                            />

                                            {HOUSES.map((house) => (
                                                <Line
                                                    key={house}
                                                    type="monotone"
                                                    dataKey={house}
                                                    stroke={HOUSE_COLORS[house]}
                                                    strokeWidth={3}
                                                    dot={{ r: 5 }}
                                                />
                                            ))}
                                        </RechartsLineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Panel>
                        </section>

                        <section>
                            <Panel title="Movimentações recentes">
                                <div className="grid grid-cols-[14%_22%_18%_18%_16%_12%] border-b border-white/10 pb-3 text-sm text-zinc-500">
                                    <span>Data</span>
                                    <span>Descrição</span>
                                    <span>Casa</span>
                                    <span>Tipo</span>
                                    <span>Valor</span>
                                    <span className="text-right">Ações</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {data.paginatedTransactions.length === 0 ? (
                                        <div className="py-10 text-center text-sm text-zinc-500">
                                            Nenhuma movimentação cadastrada.
                                        </div>
                                    ) : (
                                        data.paginatedTransactions.map((movement) => (
                                            <div
                                                key={movement.id}
                                                className="grid grid-cols-[14%_22%_18%_18%_16%_12%] items-center py-4 text-sm"
                                            >
                                                <span className="text-zinc-400">
                                                    {formatDate(movement.created_at)}
                                                </span>

                                                <span className="truncate pr-4">
                                                    {getTypeLabel(movement.type)}
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    {movement.house ? (
                                                        <>
                                                            <Image
                                                                src={LOGO_BY_HOUSE[movement.house]}
                                                                alt={movement.house}
                                                                width={26}
                                                                height={26}
                                                                className="rounded-full"
                                                            />
                                                            <span>{movement.house}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-zinc-500">-</span>
                                                    )}
                                                </div>

                                                <span className={getTypeColor(movement.type)}>
                                                    {movement.type === "withdraw"
                                                        ? "→"
                                                        : movement.type === "deposit"
                                                            ? "←"
                                                            : movement.type === "profit"
                                                                ? "↑"
                                                                : "↓"}{" "}
                                                    {getTypeLabel(movement.type)}
                                                </span>

                                                <span
                                                    className={`font-semibold ${getTypeColor(
                                                        movement.type
                                                    )}`}
                                                >
                                                    {movement.displayAmount >= 0 ? "+" : "-"}{" "}
                                                    {formatBRL(Math.abs(movement.displayAmount))}
                                                </span>

                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => deleteMovement(movement.id)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
                                                        title="Excluir movimentação"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                                    <p className="text-sm text-zinc-500">
                                        Mostrando{" "}
                                        {data.recentTransactions.length === 0
                                            ? 0
                                            : (data.safePage - 1) * itemsPerPage + 1}{" "}
                                        a{" "}
                                        {Math.min(
                                            data.safePage * itemsPerPage,
                                            data.recentTransactions.length
                                        )}{" "}
                                        de {data.recentTransactions.length} movimentações
                                    </p>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                                            disabled={data.safePage === 1}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/5 disabled:opacity-40"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>

                                        <div className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-cyan-400 bg-cyan-400/10 px-3 text-cyan-300">
                                            {data.safePage}
                                        </div>

                                        <button
                                            onClick={() =>
                                                setPage((current) =>
                                                    Math.min(data.totalPages, current + 1)
                                                )
                                            }
                                            disabled={data.safePage === data.totalPages}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/5 disabled:opacity-40"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>

                                    <select
                                        value={itemsPerPage}
                                        onChange={(event) => setItemsPerPage(Number(event.target.value))}
                                        className="h-10 rounded-xl border border-white/10 bg-[#081018] px-3 text-sm text-white outline-none"
                                    >
                                        <option value={10}>10 por página</option>
                                        <option value={20}>20 por página</option>
                                        <option value={50}>50 por página</option>
                                    </select>
                                </div>
                            </Panel>
                        </section>
                    </>
                )}
            </section>

            {modalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081018] p-6"
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-semibold">
                                    Adicionar movimentação
                                </h3>
                                <p className="mt-1 text-sm text-zinc-500">
                                    Atualize o saldo e registre o movimento da casa.
                                </p>
                            </div>

                            <button
                                onClick={() => setModalOpen(false)}
                                className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm text-zinc-400">Casa</label>
                                <select
                                    value={formHouse}
                                    onChange={(event) =>
                                        setFormHouse(event.target.value as HouseName)
                                    }
                                    className="h-11 w-full rounded-2xl border border-white/10 bg-[#081018] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
                                >
                                    <option value="Bet365">Bet365</option>
                                    <option value="Betano">Betano</option>
                                    <option value="Superbet">Superbet</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-zinc-400">Tipo</label>
                                <select
                                    value={formType}
                                    onChange={(event) =>
                                        setFormType(event.target.value as MovementType)
                                    }
                                    className="h-11 w-full rounded-2xl border border-white/10 bg-[#081018] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
                                >
                                    <option value="base">Valor base da casa</option>
                                    <option value="deposit">Depósito</option>
                                    <option value="profit">Lucro</option>
                                    <option value="loss">Perda</option>
                                    <option value="withdraw">Saque</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-zinc-400">Data</label>
                                <input
                                    type="date"
                                    value={formDate}
                                    onChange={(event) => setFormDate(event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-400/50"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-zinc-400">Valor</label>
                                <input
                                    value={formAmount}
                                    onChange={(event) => setFormAmount(event.target.value)}
                                    placeholder="Ex: 100,00"
                                    className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
                                />
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                                {formType === "base" && "Define o saldo atual da casa."}
                                {formType === "deposit" &&
                                    "Depósito aumenta o saldo da casa, mas conta como negativo no resultado."}
                                {formType === "profit" &&
                                    "Lucro aumenta o saldo da casa e conta como positivo."}
                                {formType === "loss" &&
                                    "Perda diminui o saldo da casa e conta como negativo."}
                                {formType === "withdraw" &&
                                    "Saque diminui o saldo da casa, mas conta como positivo no resultado."}
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="h-11 flex-1 rounded-2xl border border-white/10 text-sm text-zinc-300 transition hover:bg-white/5"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={saveMovement}
                                disabled={saving}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
                            >
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function Panel({
    title,
    action,
    children,
}: {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                {action}
            </div>

            {children}
        </section>
    );
}

function TopCard({
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
    variant: "green" | "red" | "purple";
}) {
    const variants = {
        green: "bg-emerald-400/10 text-emerald-300",
        red: "bg-red-400/10 text-red-300",
        purple: "bg-purple-400/10 text-purple-300",
    };

    const valueColor = variant === "red" ? "text-red-400" : "text-emerald-400";

    return (
        <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${variants[variant]}`}
                >
                    {icon}
                </div>

                <div>
                    <p className="text-sm text-zinc-300">{title}</p>
                    <strong className={`mt-2 block text-2xl font-semibold ${valueColor}`}>
                        {value}
                    </strong>
                    <p className="mt-2 text-xs text-zinc-500">{helper}</p>
                </div>
            </div>
        </div>
    );
}

function Legend({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2 text-zinc-300">
            <span className={`h-3 w-3 rounded-full ${color}`} />
            {label}
        </div>
    );
}