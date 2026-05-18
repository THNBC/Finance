"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
    ArrowRightLeft,
    BarChart3,
    ChevronDown,
    Info,
    Landmark,
    Plus,
    X,
    Settings2,
    TrendingUp,
    ArrowDownToLine,
    ArrowUpToLine,
} from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { supabase } from "@/lib/supabase";

type BetAccount = {
    id: string;
    name: string;
    logo: string;
    balance: number;
    deposits: number;
    withdrawals: number;
};

type BetTransaction = {
    id: string;
    type: "transfer" | "withdraw" | "profit" | "deposit";
    from_account: string;
    to_account: string;
    amount: number;
    created_at: string;
};



function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function parseBRL(value: string) {
    return Number(value.replace(/\./g, "").replace(",", "."));
}
function formatChartDate(value: string) {
    return new Date(value).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
    });
}
export default function BetsPage() {
    const [accounts, setAccounts] = useState<BetAccount[]>([]);
    const [porquinhoBalance, setPorquinhoBalance] = useState(0);
    const [transactions, setTransactions] = useState<BetTransaction[]>([]);

    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [transferFrom, setTransferFrom] = useState("");
    const [transferTo, setTransferTo] = useState("");
    const [transferAmount, setTransferAmount] = useState("");

    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [withdrawAccountId, setWithdrawAccountId] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");

    const [profitModalOpen, setProfitModalOpen] = useState(false);
    const [profitAccountId, setProfitAccountId] = useState("");
    const [profitAmount, setProfitAmount] = useState("");
    const [profitMode, setProfitMode] = useState<"profit" | "deposit">("profit");
    const [isLoss, setIsLoss] = useState(false);

    const [actionsModalOpen, setActionsModalOpen] = useState(false);
    const [actionsAccountId, setActionsAccountId] = useState("");
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyAccountId, setHistoryAccountId] = useState("");
    const [chartPeriod, setChartPeriod] = useState<3 | 6 | 12>(3);
    const transferAccounts = useMemo<BetAccount[]>(
        () => [
            ...accounts,
            {
                id: "porquinho-bets",
                name: "Porquinho Bets",
                logo: "/icons/inter.png",
                balance: porquinhoBalance,
                deposits: 0,
                withdrawals: 0,
            },
        ],
        [accounts, porquinhoBalance]
    );

    const totalBalance = accounts.reduce((acc, item) => acc + item.balance, 0);
    const totalDeposits = accounts.reduce((acc, item) => acc + item.deposits, 0);
    const totalWithdrawals = accounts.reduce(
        (acc, item) => acc + item.withdrawals,
        0
    );

    const liquidResult = transactions
        .filter((transaction) => transaction.type === "profit")
        .reduce((acc, transaction) => acc + Number(transaction.amount), 0);

    const averageRoi =
        totalDeposits > 0 ? (liquidResult / totalDeposits) * 100 : 0;

    useEffect(() => {
        loadAccounts();
    }, []);

    async function loadAccounts() {
        const defaultAccounts: BetAccount[] = [
            {
                id: "bet365",
                name: "Bet365",
                logo: "/icons/bet365.png",
                balance: 0,
                deposits: 0,
                withdrawals: 0,
            },
            {
                id: "betano",
                name: "Betano",
                logo: "/icons/betano.png",
                balance: 0,
                deposits: 0,
                withdrawals: 0,
            },
            {
                id: "superbet",
                name: "Superbet",
                logo: "/icons/superbet.png",
                balance: 0,
                deposits: 0,
                withdrawals: 0,
            },
        ];

        const { data: betAccounts } = await supabase
            .from("bet_accounts")
            .select("*");

        const { data: investments } = await supabase
            .from("investments")
            .select("*");

        const { data: betTransactions } = await supabase
            .from("bet_transactions")
            .select("*")
            .order("created_at", { ascending: false });

        const porquinho = investments?.find((item) =>
            String(item.name || "").toLowerCase().includes("porquinho")
        );

        setPorquinhoBalance(
            Number(
                porquinho?.current_amount ??
                porquinho?.amount ??
                porquinho?.balance ??
                porquinho?.value ??
                0
            )
        );

        const mergedAccounts = defaultAccounts.map((defaultAccount) => {
            const savedAccount = betAccounts?.find(
                (item) => item.id === defaultAccount.id
            );

            return {
                ...defaultAccount,
                balance: Number(savedAccount?.balance ?? defaultAccount.balance),
                deposits: Number(savedAccount?.deposits ?? defaultAccount.deposits),
                withdrawals: Number(
                    savedAccount?.withdrawals ?? defaultAccount.withdrawals
                ),
            };
        });

        setAccounts(mergedAccounts);
        setTransactions((betTransactions as BetTransaction[]) || []);
    }

    function openTransfer(accountId: string) {
        setTransferFrom(accountId);
        setTransferTo(
            transferAccounts.find((item) => item.id !== accountId)?.id || ""
        );
        setTransferAmount("");
        setTransferModalOpen(true);
    }

    async function confirmTransfer() {
        const value = parseBRL(transferAmount);

        if (!transferFrom || !transferTo || !value || value <= 0) return;

        const fromAccount = transferAccounts.find((item) => item.id === transferFrom);
        const toAccount = transferAccounts.find((item) => item.id === transferTo);

        if (!fromAccount || !toAccount) return;
        if (fromAccount.balance < value) return;

        const newFromBalance = fromAccount.balance - value;
        const newToBalance = toAccount.balance + value;

        if (transferFrom !== "porquinho-bets") {
            const { error } = await supabase.from("bet_accounts").upsert(
                {
                    id: fromAccount.id,
                    name: fromAccount.name,
                    logo: fromAccount.logo,
                    balance: newFromBalance,
                    deposits: fromAccount.deposits,
                    withdrawals: fromAccount.withdrawals,
                },
                { onConflict: "id" }
            );

            if (error) {
                console.error("Erro ao atualizar conta origem:", error);
                return;
            }
        }

        if (transferTo !== "porquinho-bets") {
            const { error } = await supabase.from("bet_accounts").upsert(
                {
                    id: toAccount.id,
                    name: toAccount.name,
                    logo: toAccount.logo,
                    balance: newToBalance,
                    deposits: toAccount.deposits,
                    withdrawals: toAccount.withdrawals,
                },
                { onConflict: "id" }
            );

            if (error) {
                console.error("Erro ao atualizar conta destino:", error);
                return;
            }
        }

        if (transferFrom === "porquinho-bets") {
            const { error } = await supabase
                .from("investments")
                .update({ current_amount: newFromBalance })
                .ilike("name", "%porquinho%");

            if (error) {
                console.error("Erro ao atualizar Porquinho origem:", error);
                return;
            }
        }

        if (transferTo === "porquinho-bets") {
            const { error } = await supabase
                .from("investments")
                .update({ current_amount: newToBalance })
                .ilike("name", "%porquinho%");

            if (error) {
                console.error("Erro ao atualizar Porquinho destino:", error);
                return;
            }
        }

        const { error: transactionError } = await supabase
            .from("bet_transactions")
            .insert({
                type: "transfer",
                from_account: fromAccount.name,
                to_account: toAccount.name,
                amount: value,
            });

        if (transactionError) {
            console.error("Erro ao salvar movimentação:", transactionError);
            return;
        }

        setTransferModalOpen(false);
        setTransferFrom("");
        setTransferTo("");
        setTransferAmount("");

        await loadAccounts();
    }

    async function confirmWithdraw() {
        const account = accounts.find((item) => item.id === withdrawAccountId);
        const value = parseBRL(withdrawAmount);

        if (!account || !value || value <= 0) return;
        if (account.balance < value) return;

        const newBetBalance = account.balance - value;
        const newPorquinhoBalance = porquinhoBalance + value;

        await supabase.from("bet_accounts").upsert(
            {
                id: account.id,
                name: account.name,
                logo: account.logo,
                balance: newBetBalance,
                deposits: account.deposits,
                withdrawals: account.withdrawals + value,
            },
            { onConflict: "id" }
        );

        await supabase
            .from("investments")
            .update({ current_amount: newPorquinhoBalance })
            .ilike("name", "%porquinho%");

        await supabase.from("bet_transactions").insert({
            type: "withdraw",
            from_account: account.name,
            to_account: "Porquinho Bets",
            amount: value,
        });

        setWithdrawModalOpen(false);
        setWithdrawAccountId("");
        setWithdrawAmount("");

        await loadAccounts();
    }

    async function confirmProfit() {
        const account = accounts.find((item) => item.id === profitAccountId);
        const value = parseBRL(profitAmount);

        if (!account || !value || value <= 0) return;

        const finalValue = profitMode === "profit" && isLoss ? value * -1 : value;
        const newBalance = account.balance + finalValue;

        const { error: accountError } = await supabase.from("bet_accounts").upsert(
            {
                id: account.id,
                name: account.name,
                logo: account.logo,
                balance: newBalance,
                deposits:
                    profitMode === "deposit"
                        ? account.deposits + value
                        : account.deposits,
                withdrawals: account.withdrawals,
            },
            { onConflict: "id" }
        );

        if (accountError) {
            console.error("Erro ao atualizar conta:", accountError);
            return;
        }

        const { error: transactionError } = await supabase
            .from("bet_transactions")
            .insert({
                type: profitMode === "deposit" ? "deposit" : "profit",
                from_account:
                    profitMode === "deposit"
                        ? "Depósito"
                        : isLoss
                            ? "Perda"
                            : "Lucro",
                to_account: account.name,
                amount: finalValue,
            });

        if (transactionError) {
            console.error("Erro ao salvar movimentação:", transactionError);
            return;
        }

        setProfitModalOpen(false);
        setProfitAccountId("");
        setProfitAmount("");
        setProfitMode("profit");
        setIsLoss(false);

        await loadAccounts();
    }
    const historyAccount = accounts.find(
        (item) => item.id === historyAccountId
    );

    const filteredTransactions = transactions.filter((transaction) => {
        if (!historyAccount) return false;

        return (
            transaction.from_account === historyAccount.name ||
            transaction.to_account === historyAccount.name
        );
    });
    const performanceChartData = useMemo(() => {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - chartPeriod);

        const groupedByDay = transactions
            .filter((transaction) => {
                const transactionDate = new Date(transaction.created_at);

                return (
                    transaction.type === "profit" &&
                    transactionDate >= startDate
                );
            })
            .reduce<Record<string, number>>((acc, transaction) => {
                const dateKey = new Date(transaction.created_at)
                    .toISOString()
                    .split("T")[0];

                acc[dateKey] = (acc[dateKey] || 0) + Number(transaction.amount);

                return acc;
            }, {});

        const sortedDays = Object.entries(groupedByDay).sort(
            ([dateA], [dateB]) =>
                new Date(dateA).getTime() - new Date(dateB).getTime()
        );

        let accumulated = 0;

        return [
            {
                date: "Início",
                value: 0,
            },
            ...sortedDays.map(([date, amount]) => {
                accumulated += amount;

                return {
                    date: formatChartDate(date),
                    value: accumulated,
                };
            }),
        ];
    }, [transactions, chartPeriod]);

    return (
        <main className="min-h-screen text-white">
            <header className="mb-10">
                <h1 className="text-[42px] font-semibold text-white">Bets</h1>

                <p className="mt-3 text-sm text-zinc-400">
                    Acompanhe o saldo e o desempenho das suas contas.
                </p>
            </header>

            <section>
                <h2 className="mb-4 text-lg font-semibold">Minhas contas</h2>

                <div className="grid grid-cols-3 gap-6">
                    {accounts.map((account) => {
                        const accountProfit = transactions
                            .filter(
                                (transaction) =>
                                    transaction.type === "profit" &&
                                    transaction.to_account === account.name
                            )
                            .reduce((acc, transaction) => acc + Number(transaction.amount), 0);

                        const roi =
                            account.deposits > 0 ? (accountProfit / account.deposits) * 100 : 0;

                        return (
                            <div
                                key={account.id}
                                className={`
                  group rounded-2xl border bg-[#081018] p-6
                  transition-all duration-300 hover:-translate-y-1
                  ${account.id === "bet365"
                                        ? "border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_45px_rgba(16,185,129,0.22)]"
                                        : account.id === "betano"
                                            ? "border-orange-500/30 hover:border-orange-400 hover:shadow-[0_0_45px_rgba(249,115,22,0.22)]"
                                            : "border-red-500/30 hover:border-red-400 hover:shadow-[0_0_45px_rgba(239,68,68,0.22)]"
                                    }
                `}
                            >
                                <div className="flex h-full flex-col overflow-hidden">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="relative h-14 w-24 shrink-0">
                                            <Image
                                                src={account.logo}
                                                alt={account.name}
                                                fill
                                                className="object-contain object-left drop-shadow-[0_0_12px_rgba(255,255,255,0.12)]"
                                            />
                                        </div>

                                        <div className="flex min-w-0 flex-1 items-start justify-between pl-4">
                                            <div className="min-w-[150px] pr-5 text-right">
                                                <p className="text-sm text-zinc-400">
                                                    Saldo disponível
                                                </p>

                                                <strong className="mt-1 block whitespace-nowrap text-[28px] font-medium leading-none tracking-tight text-white">
                                                    {formatBRL(account.balance)}
                                                </strong>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setHistoryAccountId(account.id);
                                                    setHistoryModalOpen(true);
                                                }}
                                                className="
            flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg
            border border-white/10 bg-white/[0.03]
            px-3 text-xs font-semibold text-zinc-200
            transition-all duration-300
            hover:border-white/20 hover:bg-white/[0.06] hover:text-white
        "
                                            >
                                                <BarChart3 size={14} strokeWidth={2.2} />

                                                <span className="whitespace-nowrap">
                                                    Histórico
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="my-6 h-px bg-white/10" />

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-emerald-500">Depósitos</p>

                                            <strong className="mt-2 block whitespace-nowrap text-xl font-medium text-white">
                                                {formatBRL(account.deposits)}
                                            </strong>
                                        </div>

                                        <div className="border-l border-white/10 pl-6">
                                            <p className="text-sm text-red-500">Saques</p>

                                            <strong className="mt-2 block whitespace-nowrap text-xl font-medium text-white">
                                                {formatBRL(account.withdrawals)}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="my-6 h-px bg-white/10" />

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm text-zinc-400">
                                                    Resultado líquido
                                                </p>

                                                <Info size={13} className="text-zinc-500" />
                                            </div>

                                            <strong
                                                className={`mt-2 block whitespace-nowrap text-lg font-medium ${accountProfit >= 0
                                                    ? "text-emerald-500"
                                                    : "text-red-500"
                                                    }`}
                                            >
                                                {formatBRL(accountProfit)}
                                            </strong>
                                        </div>

                                        <div className="border-l border-white/10 pl-6">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm text-zinc-400">ROI</p>

                                                <Info size={13} className="text-zinc-500" />
                                            </div>

                                            <strong
                                                className={`mt-2 block whitespace-nowrap text-lg font-medium ${roi >= 0
                                                    ? "text-emerald-500"
                                                    : "text-red-500"
                                                    }`}
                                            >
                                                {roi.toFixed(2).replace(".", ",")}%
                                            </strong>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setActionsAccountId(account.id);
                                            setActionsModalOpen(true);
                                        }}
                                        className="
            mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl
            border border-white/10 bg-white/[0.03]
            px-4 text-sm font-semibold text-zinc-200
            transition-all duration-300
            hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400
            hover:shadow-[0_0_25px_rgba(16,185,129,0.16)]
        "
                                    >
                                        <Settings2 size={17} />
                                        Movimentar conta
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="mt-6 rounded-xl border border-white/10 bg-[#081018] p-6 shadow-[0_0_60px_rgba(0,0,0,0.35)]">
                <h2 className="mb-6 text-lg font-semibold">Resumo geral</h2>

                <div className="grid grid-cols-5 gap-6">
                    <div>
                        <p className="text-sm text-zinc-400">Saldo total disponível</p>
                        <strong className="mt-2 block text-2xl font-medium">
                            {formatBRL(totalBalance)}
                        </strong>
                    </div>

                    <div className="border-l border-white/10 pl-8">
                        <p className="text-sm text-zinc-400">Total depositado</p>
                        <strong className="mt-2 block text-2xl font-medium">
                            {formatBRL(totalDeposits)}
                        </strong>
                    </div>

                    <div className="border-l border-white/10 pl-8">
                        <p className="text-sm text-zinc-400">Total sacado</p>
                        <strong className="mt-2 block text-2xl font-medium">
                            {formatBRL(totalWithdrawals)}
                        </strong>
                    </div>

                    <div className="border-l border-white/10 pl-8">
                        <p className="text-sm text-zinc-400">Resultado líquido</p>
                        <strong
                            className={`mt-2 block text-2xl font-medium ${liquidResult >= 0
                                ? "text-emerald-500"
                                : "text-red-500"
                                }`}
                        >
                            {formatBRL(liquidResult)}
                        </strong>
                    </div>

                    <div className="border-l border-white/10 pl-8">
                        <p className="text-sm text-zinc-400">ROI médio</p>
                        <strong
                            className={`mt-2 block text-2xl font-medium ${averageRoi >= 0
                                ? "text-emerald-500"
                                : "text-red-500"
                                }`}
                        >
                            {averageRoi.toFixed(2).replace(".", ",")}%
                        </strong>
                    </div>
                </div>
            </section>

            <section className="mt-6 rounded-xl border border-white/10 bg-[#081018] p-6 shadow-[0_0_60px_rgba(0,0,0,0.35)]">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">Desempenho líquido</h2>
                            <Info size={15} className="text-zinc-500" />
                        </div>

                        <p className="mt-2 text-sm text-zinc-500">
                            Evolução acumulada considerando apenas lucros e perdas.
                        </p>
                    </div>

                    <div className="relative">
                        <select
                            value={chartPeriod}
                            onChange={(event) =>
                                setChartPeriod(Number(event.target.value) as 3 | 6 | 12)
                            }
                            className="
    h-10 cursor-pointer appearance-none rounded-xl border border-white/10
    bg-[#0b1319] px-4 pr-10 text-xs font-semibold text-zinc-200
    outline-none transition
    hover:border-white/20
    focus:border-white/20
    [&>option]:bg-[#0b1319] [&>option]:text-white
"
                        >
                            <option value={3}>3 meses</option>
                            <option value={6}>6 meses</option>
                            <option value={12}>12 meses</option>
                        </select>

                        <ChevronDown
                            size={15}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                        />
                    </div>
                </div>


                {performanceChartData.length <= 1 ? (
                    <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10">
                        <p className="text-sm text-zinc-500">
                            Nenhum dado de desempenho registrado.
                        </p>
                    </div>
                ) : (
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={performanceChartData}>
                                <defs>
                                    <linearGradient id="betsLineGradient" x1="0" y1="0" x2="1" y2="0">
                                        {performanceChartData.map((item, index) => {
                                            const offset =
                                                performanceChartData.length <= 1
                                                    ? 0
                                                    : (index / (performanceChartData.length - 1)) * 100;

                                            const color =
                                                Number(item.value) >= 0
                                                    ? "#00c853"
                                                    : "#ef4444";

                                            return (
                                                <stop
                                                    key={`${item.date}-${index}`}
                                                    offset={`${offset}%`}
                                                    stopColor={color}
                                                />
                                            );
                                        })}
                                    </linearGradient>


                                </defs>

                                <CartesianGrid
                                    stroke="rgba(255,255,255,0.08)"
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#d4d4d8", fontSize: 13 }}
                                />

                                <YAxis
                                    hide
                                    tickLine={false}
                                    axisLine={false}
                                />

                                <Tooltip
                                    contentStyle={{
                                        background: "#05090d",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        borderRadius: "10px",
                                        color: "#fff",
                                    }}
                                    labelStyle={{
                                        color: "#a1a1aa",
                                        marginBottom: "6px",
                                    }}
                                    formatter={(value) => [
                                        formatBRL(Number(value)),
                                        "Resultado",
                                    ]}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="url(#betsLineGradient)"
                                    strokeWidth={3}
                                    fill="transparent"
                                    dot={(props: any) => {
                                        const { cx, cy, payload } = props;

                                        const color =
                                            Number(payload.value) >= 0
                                                ? "#00c853"
                                                : "#ef4444";

                                        return (
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={3}
                                                fill={color}
                                                stroke={color}
                                            />
                                        );
                                    }}
                                    activeDot={(props: any) => {
                                        const { cx, cy, payload } = props;

                                        const color =
                                            Number(payload.value) >= 0
                                                ? "#00c853"
                                                : "#ef4444";

                                        return (
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={6}
                                                fill={color}
                                                stroke="#fff"
                                                strokeWidth={2}
                                            />
                                        );
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>



            {
                transferModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="w-full max-w-[560px] rounded-2xl border border-zinc-700 bg-[#081018] p-7 shadow-[0_0_80px_rgba(0,0,0,0.65)]">
                            <div className="mb-7 flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold text-white">
                                        Transferir entre contas
                                    </h2>

                                    <p className="mt-3 text-sm text-zinc-400">
                                        Transfira saldo entre suas contas de apostas.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setTransferModalOpen(false)}
                                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-[55px_1fr] items-center gap-4">
                                    <label className="text-base text-zinc-400">De</label>

                                    <div className="relative flex h-16 items-center justify-between rounded-xl border border-zinc-700 bg-[#0b1319] px-5 transition focus-within:border-sky-500">
                                        <div className="relative h-8 w-28">
                                            <Image
                                                src={
                                                    transferAccounts.find(
                                                        (item) => item.id === transferFrom
                                                    )?.logo || "/icons/inter.png"
                                                }
                                                alt="Conta origem"
                                                fill
                                                className="object-contain object-left"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-semibold text-white">
                                                {formatBRL(
                                                    transferAccounts.find(
                                                        (item) => item.id === transferFrom
                                                    )?.balance || 0
                                                )}
                                            </span>

                                            <ChevronDown size={18} className="text-zinc-400" />
                                        </div>

                                        <select
                                            value={transferFrom}
                                            onChange={(event) => {
                                                setTransferFrom(event.target.value);

                                                if (event.target.value === transferTo) {
                                                    setTransferTo(
                                                        transferAccounts.find(
                                                            (item) => item.id !== event.target.value
                                                        )?.id || ""
                                                    );
                                                }
                                            }}
                                            className="absolute inset-0 cursor-pointer opacity-0 [&>option]:bg-[#0b1319] [&>option]:text-white"
                                        >
                                            {transferAccounts.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[55px_1fr] items-center gap-4">
                                    <label className="text-base text-zinc-400">Para</label>

                                    <div className="relative flex h-16 items-center justify-between rounded-xl border border-zinc-700 bg-[#0b1319] px-5 transition focus-within:border-sky-500">
                                        <div className="relative h-8 w-28">
                                            <Image
                                                src={
                                                    transferAccounts.find((item) => item.id === transferTo)
                                                        ?.logo || "/icons/inter.png"
                                                }
                                                alt="Conta destino"
                                                fill
                                                className="object-contain object-left"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-semibold text-white">
                                                {formatBRL(
                                                    transferAccounts.find(
                                                        (item) => item.id === transferTo
                                                    )?.balance || 0
                                                )}
                                            </span>

                                            <ChevronDown size={18} className="text-zinc-400" />
                                        </div>

                                        <select
                                            value={transferTo}
                                            onChange={(event) => setTransferTo(event.target.value)}
                                            className="absolute inset-0 cursor-pointer opacity-0 [&>option]:bg-[#0b1319] [&>option]:text-white"
                                        >
                                            {transferAccounts
                                                .filter((item) => item.id !== transferFrom)
                                                .map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[55px_1fr] items-center gap-4">
                                    <label className="text-base text-zinc-400">Valor</label>

                                    <div className="flex h-14 overflow-hidden rounded-xl border border-zinc-700 bg-[#0b1319] transition focus-within:border-sky-500">
                                        <div className="flex w-16 items-center justify-center border-r border-zinc-700 text-sm font-semibold text-white">
                                            R$
                                        </div>

                                        <input
                                            value={transferAmount}
                                            onChange={(event) => setTransferAmount(event.target.value)}
                                            placeholder="0,00"
                                            className="w-full bg-transparent px-4 text-sm text-white outline-none placeholder:text-zinc-600"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-3 pl-[71px]">
                                    {["50", "100", "200"].map((value) => (
                                        <button
                                            key={value}
                                            onClick={() => setTransferAmount(value)}
                                            className="h-12 rounded-lg border border-zinc-700 text-sm text-zinc-200 transition hover:border-sky-500/60 hover:bg-sky-500/10 hover:text-sky-400"
                                        >
                                            + R$ {value}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => {
                                            const account = transferAccounts.find(
                                                (item) => item.id === transferFrom
                                            );

                                            setTransferAmount(
                                                String(account?.balance || 0).replace(".", ",")
                                            );
                                        }}
                                        className="h-12 rounded-lg border border-zinc-700 text-sm text-zinc-200 transition hover:border-sky-500/60 hover:bg-sky-500/10 hover:text-sky-400"
                                    >
                                        Máx.
                                    </button>
                                </div>
                            </div>

                            <div className="mt-7 flex gap-4 rounded-xl border border-zinc-700 bg-[#0b1319] p-5 text-sm leading-6 text-zinc-300">
                                <Info size={22} className="mt-1 shrink-0 text-zinc-300" />
                                <p>
                                    Transferências são instantâneas entre suas contas e não envolvem
                                    saques ou depósitos externos.
                                </p>
                            </div>

                            <div className="mt-7 flex justify-end gap-4">
                                <button
                                    onClick={() => setTransferModalOpen(false)}
                                    className="h-14 rounded-xl border border-zinc-700 px-9 text-sm font-medium text-zinc-200 transition hover:bg-white/5 hover:text-white"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={confirmTransfer}
                                    className="flex h-14 items-center gap-3 rounded-xl bg-sky-600 px-9 text-sm font-semibold text-white transition hover:bg-sky-500"
                                >
                                    <ArrowRightLeft size={18} />
                                    Transferir
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                withdrawModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="w-full max-w-[520px] rounded-2xl border border-zinc-700 bg-[#081018] p-7 shadow-[0_0_80px_rgba(0,0,0,0.65)]">
                            <div className="mb-7 flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold text-white">
                                        Sacar valor
                                    </h2>

                                    <p className="mt-3 text-sm text-zinc-400">
                                        O valor será enviado para o Porquinho Bets.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setWithdrawModalOpen(false)}
                                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-[70px_1fr] items-center gap-4">
                                    <label className="text-base text-zinc-400">Conta</label>

                                    <div className="flex h-16 items-center justify-between rounded-xl border border-zinc-700 bg-[#0b1319] px-5">
                                        <div className="relative h-8 w-28">
                                            <Image
                                                src={
                                                    accounts.find((item) => item.id === withdrawAccountId)
                                                        ?.logo || "/icons/inter.png"
                                                }
                                                alt="Conta saque"
                                                fill
                                                className="object-contain object-left"
                                            />
                                        </div>

                                        <span className="text-lg font-semibold text-white">
                                            {formatBRL(
                                                accounts.find((item) => item.id === withdrawAccountId)
                                                    ?.balance || 0
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[70px_1fr] items-center gap-4">
                                    <label className="text-base text-zinc-400">Valor</label>

                                    <div className="flex h-14 overflow-hidden rounded-xl border border-zinc-700 bg-[#0b1319] transition focus-within:border-emerald-500">
                                        <div className="flex w-16 items-center justify-center border-r border-zinc-700 text-sm font-semibold text-white">
                                            R$
                                        </div>

                                        <input
                                            value={withdrawAmount}
                                            onChange={(event) => setWithdrawAmount(event.target.value)}
                                            placeholder="0,00"
                                            className="w-full bg-transparent px-4 text-sm text-white outline-none placeholder:text-zinc-600"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-3 pl-[86px]">
                                    {["50", "100", "200"].map((value) => (
                                        <button
                                            key={value}
                                            onClick={() => setWithdrawAmount(value)}
                                            className="h-12 rounded-lg border border-zinc-700 text-sm text-zinc-200 transition hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-400"
                                        >
                                            + R$ {value}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => {
                                            const account = accounts.find(
                                                (item) => item.id === withdrawAccountId
                                            );

                                            setWithdrawAmount(
                                                String(account?.balance || 0).replace(".", ",")
                                            );
                                        }}
                                        className="h-12 rounded-lg border border-zinc-700 text-sm text-zinc-200 transition hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-400"
                                    >
                                        Máx.
                                    </button>
                                </div>

                            </div>

                            <div className="mt-7 flex justify-end gap-4">
                                <button
                                    onClick={() => setWithdrawModalOpen(false)}
                                    className="h-14 rounded-xl border border-zinc-700 px-9 text-sm font-medium text-zinc-200 transition hover:bg-white/5 hover:text-white"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={confirmWithdraw}
                                    className="flex h-14 items-center gap-3 rounded-xl bg-emerald-600 px-9 text-sm font-semibold text-white transition hover:bg-emerald-500"
                                >
                                    <Landmark size={18} />
                                    Sacar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                profitModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="w-full max-w-[520px] rounded-2xl border border-zinc-700 bg-[#081018] p-7 shadow-[0_0_80px_rgba(0,0,0,0.65)]">
                            <div className="mb-7 flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold text-white">
                                        {profitMode === "deposit" ? "Adicionar depósito" : "Adicionar lucro"}
                                    </h2>

                                    <p className="mt-3 text-sm text-zinc-400">
                                        {profitMode === "deposit"
                                            ? "Adicione um valor externo nesta conta."
                                            : "Adicione um valor de lucro diretamente nesta conta."}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setProfitModalOpen(false)}
                                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-[70px_1fr] items-center gap-4">
                                    <label className="text-base text-zinc-400">Conta</label>

                                    <div className="flex h-16 items-center justify-between rounded-xl border border-zinc-700 bg-[#0b1319] px-5">
                                        <div className="relative h-8 w-28">
                                            <Image
                                                src={
                                                    accounts.find((item) => item.id === profitAccountId)
                                                        ?.logo || "/icons/inter.png"
                                                }
                                                alt="Conta lucro"
                                                fill
                                                className="object-contain object-left"
                                            />
                                        </div>

                                        <span className="text-lg font-semibold text-white">
                                            {formatBRL(
                                                accounts.find((item) => item.id === profitAccountId)
                                                    ?.balance || 0
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[70px_1fr] items-center gap-4">
                                    <label className="text-base text-zinc-400">Valor</label>

                                    <div className="flex h-14 overflow-hidden rounded-xl border border-zinc-700 bg-[#0b1319] transition focus-within:border-emerald-500">
                                        <div className="flex w-16 items-center justify-center border-r border-zinc-700 text-sm font-semibold text-white">
                                            R$
                                        </div>

                                        <input
                                            value={profitAmount}
                                            onChange={(event) => setProfitAmount(event.target.value)}
                                            placeholder="0,00"
                                            className="w-full bg-transparent px-4 text-sm text-white outline-none placeholder:text-zinc-600"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-3 pl-[86px]">
                                    {["50", "100", "200"].map((value) => (
                                        <button
                                            key={value}
                                            onClick={() => setProfitAmount(value)}
                                            className="h-12 rounded-lg border border-zinc-700 text-sm text-zinc-200 transition hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-400"
                                        >
                                            + R$ {value}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => {
                                            const account = accounts.find(
                                                (item) => item.id === profitAccountId
                                            );

                                            setProfitAmount(
                                                String(account?.balance || 0).replace(".", ",")
                                            );
                                        }}
                                        className="h-12 rounded-lg border border-zinc-700 text-sm text-zinc-200 transition hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-400"
                                    >
                                        Saldo
                                    </button>
                                </div>
                                {profitMode === "profit" && (
                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-zinc-200">
                                        <input
                                            type="checkbox"
                                            checked={isLoss}
                                            onChange={(event) => setIsLoss(event.target.checked)}
                                            className="h-4 w-4 accent-red-500"
                                        />

                                        Registrar como perda
                                    </label>
                                )}
                            </div>

                            <div className="mt-7 flex justify-end gap-4">
                                <button
                                    onClick={() => setProfitModalOpen(false)}
                                    className="h-14 rounded-xl border border-zinc-700 px-9 text-sm font-medium text-zinc-200 transition hover:bg-white/5 hover:text-white"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={confirmProfit}
                                    className="flex h-14 items-center gap-3 rounded-xl bg-emerald-600 px-9 text-sm font-semibold text-white transition hover:bg-emerald-500"
                                >
                                    <Plus size={18} />
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                actionsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="w-full max-w-[520px] rounded-2xl border border-zinc-700 bg-[#081018] p-7 shadow-[0_0_80px_rgba(0,0,0,0.65)]">
                            <div className="mb-7 flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold text-white">
                                        Movimentar conta
                                    </h2>

                                    <p className="mt-3 text-sm text-zinc-400">
                                        Escolha o tipo de movimentação para esta conta.
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setActionsModalOpen(false);
                                        setActionsAccountId("");
                                    }}
                                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mb-6 flex h-16 items-center justify-between rounded-xl border border-zinc-700 bg-[#0b1319] px-5">
                                <div className="relative h-8 w-32">
                                    <Image
                                        src={
                                            accounts.find((item) => item.id === actionsAccountId)?.logo ||
                                            "/icons/inter.png"
                                        }
                                        alt="Conta"
                                        fill
                                        className="object-contain object-left"
                                    />
                                </div>

                                <span className="text-lg font-semibold text-white">
                                    {formatBRL(
                                        accounts.find((item) => item.id === actionsAccountId)?.balance || 0
                                    )}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setProfitMode("profit");
                                        setIsLoss(false);
                                        setProfitAccountId(actionsAccountId);
                                        setProfitAmount("");
                                        setActionsModalOpen(false);
                                        setProfitModalOpen(true);
                                    }}
                                    className="
            flex min-h-[120px] flex-col items-start justify-between rounded-2xl
            border border-emerald-500/30 bg-emerald-500/10 p-5 text-left
            transition-all duration-300 hover:border-emerald-400/60
            hover:bg-emerald-500/15 hover:shadow-[0_0_28px_rgba(16,185,129,0.18)]
        "
                                >
                                    <TrendingUp size={24} className="text-emerald-400" />

                                    <div>
                                        <p className="text-sm font-semibold text-emerald-300">Lucro</p>
                                        <p className="mt-1 text-xs text-emerald-500/70">
                                            Adicionar ganho
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setProfitMode("deposit");
                                        setIsLoss(false);
                                        setProfitAccountId(actionsAccountId);
                                        setProfitAmount("");
                                        setActionsModalOpen(false);
                                        setProfitModalOpen(true);
                                    }}
                                    className="
            flex min-h-[120px] flex-col items-start justify-between rounded-2xl
            border border-violet-500/30 bg-violet-500/10 p-5 text-left
            transition-all duration-300 hover:border-violet-400/60
            hover:bg-violet-500/15 hover:shadow-[0_0_28px_rgba(139,92,246,0.18)]
        "
                                >
                                    <ArrowDownToLine size={24} className="text-violet-400" />

                                    <div>
                                        <p className="text-sm font-semibold text-violet-300">Depósito</p>
                                        <p className="mt-1 text-xs text-violet-400/70">
                                            Entrada externa
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        openTransfer(actionsAccountId);
                                        setActionsModalOpen(false);
                                    }}
                                    className="
            flex min-h-[120px] flex-col items-start justify-between rounded-2xl
            border border-sky-500/30 bg-sky-500/10 p-5 text-left
            transition-all duration-300 hover:border-sky-400/60
            hover:bg-sky-500/15 hover:shadow-[0_0_28px_rgba(14,165,233,0.18)]
        "
                                >
                                    <ArrowRightLeft size={24} className="text-sky-400" />

                                    <div>
                                        <p className="text-sm font-semibold text-sky-300">Transferir</p>
                                        <p className="mt-1 text-xs text-sky-400/70">
                                            Entre contas
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setWithdrawAccountId(actionsAccountId);
                                        setWithdrawAmount("");
                                        setActionsModalOpen(false);
                                        setWithdrawModalOpen(true);
                                    }}
                                    className="
            flex min-h-[120px] flex-col items-start justify-between rounded-2xl
            border border-red-500/30 bg-red-500/10 p-5 text-left
            transition-all duration-300 hover:border-red-400/60
            hover:bg-red-500/15 hover:shadow-[0_0_28px_rgba(239,68,68,0.18)]
        "
                                >
                                    <ArrowUpToLine size={24} className="text-red-400" />

                                    <div>
                                        <p className="text-sm font-semibold text-red-300">Sacar</p>
                                        <p className="mt-1 text-xs text-red-400/70">
                                            Enviar ao Porquinho
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                )
            }
            {
                historyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="w-full max-w-[700px] rounded-2xl border border-zinc-700 bg-[#081018] p-7 shadow-[0_0_80px_rgba(0,0,0,0.65)]">
                            <div className="mb-7 flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold text-white">
                                        Histórico da conta
                                    </h2>

                                    <p className="mt-2 text-sm text-zinc-400">
                                        {historyAccount?.name}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setHistoryModalOpen(false)}
                                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                                {filteredTransactions.length === 0 ? (
                                    <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10">
                                        <p className="text-sm text-zinc-500">
                                            Nenhuma movimentação encontrada.
                                        </p>
                                    </div>
                                ) : (
                                    filteredTransactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b1319] px-5 py-4"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {transaction.type === "transfer"
                                                        ? `${transaction.from_account} → ${transaction.to_account}`
                                                        : transaction.type === "withdraw"
                                                            ? `Saque para Porquinho`
                                                            : transaction.type === "deposit"
                                                                ? `Depósito em ${transaction.to_account}`
                                                                : transaction.amount < 0
                                                                    ? `Perda registrada`
                                                                    : `Lucro registrado`}
                                                </p>

                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {new Date(
                                                        transaction.created_at
                                                    ).toLocaleDateString("pt-BR")}
                                                </p>
                                            </div>

                                            <strong
                                                className={
                                                    transaction.type === "withdraw"
                                                        ? "text-red-400"
                                                        : transaction.amount < 0
                                                            ? "text-red-400"
                                                            : transaction.type === "deposit"
                                                                ? "text-violet-400"
                                                                : transaction.type === "transfer"
                                                                    ? "text-sky-400"
                                                                    : "text-emerald-400"
                                                }
                                            >
                                                {transaction.type === "transfer"
                                                    ? ""
                                                    : transaction.amount < 0
                                                        ? "-"
                                                        : "+"}
                                                {formatBRL(
                                                    Math.abs(Number(transaction.amount))
                                                )}
                                            </strong>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </main >
    );
}