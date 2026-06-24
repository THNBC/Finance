"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Dumbbell,
    FileText,
    Fuel,
    LockKeyhole,
    Pencil,
    PlaySquare,
    Plus,
    Repeat,
    ShoppingBag,
    Stethoscope,
    Utensils,
    Wallet,
    Wrench,
    X,
    XCircle,
} from "lucide-react";
import {
    loadAccountsData,
    updateBankAccountBalance,
    saveCreditCardSettings,
    payCreditCardInvoice,
    cancelCreditCardInvoicePayment,
} from "@/services/accountsService";
import { formatBRL } from "@/lib/formatters";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

type CreditCardData = {
    id: string;
    bank_name: string;
    last_digits: string | null;
    total_limit: number;
    due_day: number | null;
    closing_day: number | null;
    color: string | null;
};

type CardTransaction = {
    id: string;
    card_id: string | null;
    title: string;
    amount: number;
    transaction_date: string;
    category: string | null;
    payment_method: string | null;
    type: "income" | "expense";
    invoice_month?: number | null;
    invoice_year?: number | null;
};
type BankAccount = {
    id: string;
    bank_name: string;
    balance: number;
};

type InvoicePayment = {
    id: string;
    card_id: string;
    invoice_month: number;
    invoice_year: number;
    amount: number;
    paid_at: string;
};

type CardWithInvoice = CreditCardData & {
    invoice: number;
    nextInvoice: number;
    available: number;
    usage: number;
    purchases: CardTransaction[];
    nextPurchases: CardTransaction[];
    usedLimit: number;
    invoiceMonth: number;
    invoiceYear: number;
    isPaid: boolean;
};

const defaultCards: CreditCardData[] = [
    {
        id: "inter",
        bank_name: "Banco Inter",
        last_digits: "1234",
        total_limit: 0,
        due_day: 15,
        closing_day: 9,
        color: "emerald",
    },
    {
        id: "mercado-pago",
        bank_name: "Mercado Pago",
        last_digits: "5678",
        total_limit: 0,
        due_day: 15,
        closing_day: 9,
        color: "blue",
    },
];

function formatDate(date?: string | null) {
    if (!date) return "—";

    return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatDueDay(day?: number | string | null) {
    if (!day) return "—";

    return `Dia ${day}`;
}

function getCurrentInvoicePeriod(closingDay: number, dueDay: number | null, cardId: string, invoicePayments: InvoicePayment[]) {
    const today = new Date();
    const currentDay = today.getDate();

    // Começamos assumindo o mês e ano civil atual
    let targetMonth = today.getMonth() + 1;
    let targetYear = today.getFullYear();

    // Se hoje ainda é antes ou igual ao dia de vencimento (ex: dia 15)
    if (dueDay && currentDay <= dueDay) {
        // Precisamos checar se a fatura do mês REFERENTE ao mês passado está paga
        // Se a fatura de Maio (referência mês 4) NÃO foi paga, mantemos ela ativa na tela
        const previousMonth = targetMonth === 1 ? 12 : targetMonth - 1;
        const previousYear = targetMonth === 1 ? targetYear - 1 : targetYear;

        const isPreviousPaid = invoicePayments.some(
            (payment) =>
                payment.card_id === cardId &&
                payment.invoice_month === previousMonth &&
                payment.invoice_year === previousYear
        );

        if (!isPreviousPaid) {
            // Se não está paga, a fatura ativa na tela deve continuar sendo a do mês passado!
            targetMonth = previousMonth;
            targetYear = previousYear;
        }
    } else if (dueDay && currentDay > dueDay) {
        // Se já passou do dia 15, naturalmente a fatura vira para o próximo ciclo
        targetMonth += 1;

        if (targetMonth > 12) {
            targetMonth = 1;
            targetYear += 1;
        }
    }

    return {
        invoiceMonth: targetMonth,
        invoiceYear: targetYear,
    };
}


function getBankLogo(bankName: string) {
    const normalized = bankName.toLowerCase();

    if (normalized.includes("inter")) return "/icons/inter.png";
    if (normalized.includes("mercado")) return "/icons/mercadopago.png";

    return null;
}

function getUsageColor(usage: number) {
    if (usage >= 90) {
        return "bg-red-500";
    }

    if (usage >= 70) {
        return "bg-amber-400";
    }

    return "bg-emerald-500";
}

function getCardBrand(cardId: string) {
    if (cardId === "inter") return "mastercard";
    if (cardId === "mercado-pago") return "VISA";

    return "cartão";
}
function CategoryIcon({ category }: { category: string }) {
    const iconProps = {
        size: 16,
        className: "text-white",
    };

    switch (category) {
        case "Fatura":
            return <CreditCard {...iconProps} />;
        case "Pix":
            return <Wallet {...iconProps} />;
        case "Compras":
            return <ShoppingBag {...iconProps} />;
        case "Alimentação":
            return <Utensils {...iconProps} />;
        case "Academia":
            return <Dumbbell {...iconProps} />;
        case "Streaming":
            return <PlaySquare {...iconProps} />;
        case "Assinatura":
            return <Repeat {...iconProps} />;
        case "Combustível":
            return <Fuel {...iconProps} />;
        case "Dentista":
            return <Stethoscope {...iconProps} />;
        case "Manutenção carro":
            return <Wrench {...iconProps} />;
        default:
            return <Wallet {...iconProps} />;
    }
}

function getCategoryColor(category: string) {
    switch (category) {
        case "Fatura":
            return "bg-red-500";
        case "Pix":
            return "bg-emerald-500";
        case "Compras":
            return "bg-violet-500";
        case "iFood":
            return "bg-orange-500";
        case "Academia":
            return "bg-blue-500";
        case "Streaming":
            return "bg-pink-500";
        case "Assinatura":
            return "bg-yellow-500";
        case "Combustível":
            return "bg-cyan-500";
        case "Dentista":
            return "bg-teal-500";
        case "Manutenção carro":
            return "bg-zinc-500";
        default:
            return "bg-indigo-500";
    }
}

export default function CardsPage() {
    const [cards, setCards] = useState<CreditCardData[]>(defaultCards);
    const [transactions, setTransactions] = useState<CardTransaction[]>([]);
    const [invoicePayments, setInvoicePayments] = useState<InvoicePayment[]>([]);
    const [mainAccount, setMainAccount] = useState<BankAccount | null>(null);
    const [depositModalOpen, setDepositModalOpen] = useState(false);
    const [invoiceHistoryPeriod, setInvoiceHistoryPeriod] = useState(6);
    const [loading, setLoading] = useState(true);
    const [editingCard, setEditingCard] = useState<CreditCardData | null>(null);
    const [invoiceCard, setInvoiceCard] = useState<CardWithInvoice | null>(null);
    const [payInvoiceCard, setPayInvoiceCard] =
        useState<CardWithInvoice | null>(null);

    const [toast, setToast] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);
    const accountBalance = useMemo(() => {
        return transactions.reduce((sum, transaction) => {
            if (transaction.payment_method === "credit_card") return sum;

            if (transaction.type === "income") {
                return sum + Number(transaction.amount);
            }

            return sum - Number(transaction.amount);
        }, 0);
    }, [transactions]);
    function showToast(type: "success" | "error", message: string) {
        setToast({ type, message });

        setTimeout(() => {
            setToast(null);
        }, 2800);
    }
    async function handlePayInvoice(card: CardWithInvoice) {
        if (card.invoice <= 0) {
            showToast("error", "Não existe fatura em aberto para pagar.");
            return;
        }

        try {
            await payCreditCardInvoice({
                cardId: card.id,
                bankName: card.bank_name,
                invoiceMonth: card.invoiceMonth,
                invoiceYear: card.invoiceYear,
                amount: card.invoice,
            });

            setPayInvoiceCard(null);
            await loadCards();
            showToast("success", "Fatura paga e saldo debitado com sucesso.");
        } catch (error) {
            console.error(error);
            showToast("error", "Erro ao pagar fatura.");
        }
    }

    async function handleCancelInvoicePayment(card: CardWithInvoice) {
        try {
            await cancelCreditCardInvoicePayment({
                cardId: card.id,
                invoiceMonth: card.invoiceMonth,
                invoiceYear: card.invoiceYear,
            });

            setPayInvoiceCard(null);
            await loadCards();
            showToast("success", "Pagamento cancelado e valor devolvido para a Caixa.");
        } catch (error) {
            console.error(error);
            showToast("error", "Erro ao cancelar pagamento.");
        }
    }

    async function loadCards() {
        try {
            setLoading(true);

            const {
                settingsData,
                transactionsData,
                paymentsData,
                accountData,
            } = await loadAccountsData();

            const settings = (settingsData ?? []) as CreditCardData[];

            const mergedCards = defaultCards.map((card) => {
                const saved = settings.find((item) => item.id === card.id);

                return {
                    ...card,
                    ...saved,
                    bank_name: card.bank_name,
                    color: card.color,
                };
            });

            setCards(mergedCards);
            setTransactions((transactionsData ?? []) as CardTransaction[]);
            setInvoicePayments((paymentsData ?? []) as InvoicePayment[]);
            setMainAccount(accountData as BankAccount);
        } catch (error) {
            console.error(error);
            showToast("error", "Erro ao carregar cartões.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCards();
    }, []);

    const cardsWithInvoice = useMemo(() => {


        return cards.map((card) => {
            const cardTransactions = transactions.filter(
                (transaction) =>
                    transaction.card_id === card.id &&
                    transaction.payment_method === "credit_card"
            );

            const closingDay = card.closing_day ?? 9;

            // Alterado: Passando os parâmetros necessários para validar se o mês anterior está pago
            const { invoiceMonth, invoiceYear } =
                getCurrentInvoicePeriod(closingDay, card.due_day, card.id, invoicePayments);



            // Correção: O início do período da fatura atual se baseia no invoiceMonth/invoiceYear calculados


            const currentMonthPurchases = cardTransactions.filter((transaction) => {
                return (
                    transaction.payment_method === "credit_card" &&
                    transaction.invoice_month === invoiceMonth &&
                    transaction.invoice_year === invoiceYear
                );
            });

            const paidInvoice = invoicePayments.find(
                (payment) =>
                    payment.card_id === card.id &&
                    payment.invoice_month === invoiceMonth &&
                    payment.invoice_year === invoiceYear
            );

            const paidAt = paidInvoice
                ? new Date(paidInvoice.paid_at)
                : null;

            const openInvoicePurchases = paidAt
                ? currentMonthPurchases.filter((transaction) => {
                    const transactionDate = new Date(transaction.transaction_date + "T00:00:00");
                    return transactionDate > paidAt;
                })
                : currentMonthPurchases;



            const invoice = openInvoicePurchases.reduce(
                (sum, transaction) => sum + Number(transaction.amount),
                0
            );

            // Correção: A próxima fatura começa logo após o término da atual calculada


            const nextMonth = invoiceMonth === 12 ? 1 : invoiceMonth + 1;
            const nextYear = invoiceMonth === 12 ? invoiceYear + 1 : invoiceYear;

            const nextInvoicePurchases = cardTransactions.filter((transaction) => {

                return (
                    transaction.payment_method === "credit_card" &&
                    transaction.invoice_month === nextMonth &&
                    transaction.invoice_year === nextYear
                );
            });

            const nextInvoice = nextInvoicePurchases.reduce(
                (sum, transaction) => sum + Number(transaction.amount),
                0
            );

            const paidInvoices = [
                ...invoicePayments.filter((payment) => payment.card_id === card.id),
                ...transactions
                    .filter(
                        (transaction) =>
                            transaction.card_id === card.id &&
                            transaction.payment_method === "credit_card_invoice" &&
                            transaction.invoice_month &&
                            transaction.invoice_year
                    )
                    .map((transaction) => ({
                        id: transaction.id,
                        card_id: transaction.card_id as string,
                        invoice_month: transaction.invoice_month as number,
                        invoice_year: transaction.invoice_year as number,
                        amount: Number(transaction.amount),
                        paid_at: transaction.transaction_date,
                    })),
            ];

            const usedLimitTransactions = cardTransactions.filter((transaction) => {
                if (transaction.payment_method !== "credit_card") return false;
                if (!transaction.invoice_month || !transaction.invoice_year) return false;

                const invoiceIsPaid = paidInvoices.some(
                    (payment) =>
                        payment.invoice_month === transaction.invoice_month &&
                        payment.invoice_year === transaction.invoice_year
                );

                return !invoiceIsPaid;
            });

            const usedLimit = usedLimitTransactions.reduce(
                (sum, transaction) => sum + Number(transaction.amount),
                0
            );

            const limit = Number(card.total_limit || 0);
            const available = Math.max(limit - usedLimit, 0);
            const usage = limit > 0 ? (usedLimit / limit) * 100 : 0;

            return {
                ...card,
                invoice,
                nextInvoice,
                usedLimit,
                available,
                usage,
                purchases: openInvoicePurchases,
                nextPurchases: nextInvoicePurchases,
                invoiceMonth,
                invoiceYear,
                isPaid: !!paidInvoice && invoice === 0,
            };
        });
    }, [cards, transactions, invoicePayments]);

    const totalInvoice = cardsWithInvoice.reduce(
        (sum, card) => sum + card.invoice,
        0
    );

    const totalUsedLimit = cardsWithInvoice.reduce(
        (sum, card) => sum + card.usedLimit,
        0
    );

    const totalLimit = cardsWithInvoice.reduce(
        (sum, card) => sum + Number(card.total_limit || 0),
        0
    );

    const availableLimit = Math.max(totalLimit - totalUsedLimit, 0);
    const usage = totalLimit > 0 ? (totalUsedLimit / totalLimit) * 100 : 0;

    const invoiceHistory = useMemo(() => {
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

        return Array.from({ length: invoiceHistoryPeriod }, (_, index) => {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - (invoiceHistoryPeriod - 1) + index,
                1
            );

            const month = date.getMonth();
            const year = date.getFullYear();

            // Buscando as configurações de fechamento de cada cartão dinamicamente


            // Filtra transações do Inter que pertencem ao ciclo desta fatura específica
            const interTotal = transactions
                .filter((transaction) => {
                    return (
                        transaction.card_id === "inter" &&
                        transaction.payment_method === "credit_card" &&
                        transaction.invoice_month === month + 1 &&
                        transaction.invoice_year === year
                    );
                })
                .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

            // Filtra transações do Mercado Pago que pertencem ao ciclo desta fatura específica
            const mercadoPagoTotal = transactions
                .filter((transaction) => {
                    return (
                        transaction.card_id === "mercado-pago" &&
                        transaction.payment_method === "credit_card" &&
                        transaction.invoice_month === month + 1 &&
                        transaction.invoice_year === year
                    );
                })
                .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

            return {
                month: `${months[month]}/${String(year).slice(2)}`,
                inter: interTotal,
                mercadoPago: mercadoPagoTotal,
            };
        });
    }, [transactions, cards, invoiceHistoryPeriod]); // Adicionado 'cards' como dependência



    return (
        <>
            <main className="min-h-screen bg-[#05090d] px-10 py-9 text-white">
                <div className="mb-9">
                    <h1 className="text-[42px] font-semibold tracking-tight text-white">
                        Cartões
                    </h1>

                    <p className="mt-2 text-base font-normal text-zinc-400">
                        Gerencie seus cartões de crédito e acompanhe suas faturas.
                    </p>
                </div>

                <section className="mb-5">
                    <h2 className="mb-5 text-2xl font-semibold tracking-tight text-white">
                        Meus cartões
                    </h2>
                    <div className="group mb-5 overflow-hidden rounded-2xl border border-blue-500/20 bg-[#081018]/90 p-7 shadow-[0_0_45px_rgba(59,130,246,0.14)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-400/40 hover:shadow-[0_0_45px_rgba(59,130,246,0.22)]">
                        <div className="relative flex w-full items-start justify-between gap-10">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="relative h-[72px] w-[120px]">
                                        <Image
                                            src="/icons/caixa.png"
                                            alt="Caixa Econômica"
                                            fill
                                            sizes="120px"
                                            className="object-contain object-left"
                                        />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-400">
                                            Conta principal
                                        </p>

                                        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white">
                                            Caixa Econômica
                                        </h2>
                                    </div>
                                </div>

                                <div className="mt-10">
                                    <p className="text-sm text-zinc-500">
                                        Saldo disponível
                                    </p>

                                    <h3 className="mt-3 text-[42px] font-semibold tracking-tight text-white">
                                        {formatBRL(accountBalance)}
                                    </h3>
                                </div>
                            </div>

                            <button
                                onClick={() => setDepositModalOpen(true)}
                                className="absolute right-0 top-0 flex h-12 min-w-[160px] items-center justify-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-6 text-sm font-medium text-white transition hover:border-blue-400/50 hover:bg-blue-500/15 hover:text-blue-300"
                            >
                                <Pencil size={18} />
                                Editar saldo
                            </button>
                        </div>
                    </div>{loading ? (
                        <div className="rounded-xl border border-zinc-800 bg-[#081018]/90 p-8 text-sm text-zinc-500">
                            Carregando cartões...
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-5">
                            {cardsWithInvoice.map((card) => {
                                const logo = getBankLogo(card.bank_name);
                                const barColor = getUsageColor(card.usage);

                                return (
                                    <div
                                        key={card.id}
                                        className={`group relative overflow-hidden rounded-xl border bg-[#081018]/90 p-7 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] ${card.id === "inter"
                                            ? "border-orange-500/20 hover:border-orange-400/40 hover:shadow-[0_0_45px_rgba(249,115,22,0.18)]"
                                            : "border-white/10 hover:border-white/20 hover:shadow-[0_0_45px_rgba(255,255,255,0.08)]"
                                            }`}
                                    >


                                        <div>
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex items-center gap-1">
                                                    {logo ? (
                                                        <div className="relative h-[72px] w-[110px]">
                                                            <Image
                                                                src={logo}
                                                                alt={card.bank_name}
                                                                fill
                                                                sizes="110px"
                                                                className="object-contain object-left"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                                                            <CreditCard size={26} />
                                                        </div>
                                                    )}

                                                    <div>
                                                        <h3 className="text-[24px] font-semibold tracking-tight text-white">
                                                            {card.bank_name}
                                                        </h3>

                                                        <p className="mt-1 text-sm font-medium tracking-tight text-zinc-400">
                                                            {getCardBrand(card.id)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setEditingCard(card)}
                                                    className="flex h-10 items-center gap-2 rounded-lg border border-zinc-700/80 bg-[#080d13] px-3 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-400"
                                                >
                                                    <Pencil size={14} />
                                                    Editar
                                                </button>
                                            </div>

                                            <div className="my-7 h-px bg-zinc-800" />

                                            <div className="grid grid-cols-2 gap-8">
                                                <div>
                                                    <p className="text-sm text-zinc-400">Fatura atual</p>

                                                    <h3 className="mt-4 text-[30px] font-normal tracking-tight text-white">
                                                        {formatBRL(card.invoice)}
                                                    </h3>


                                                    <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
                                                        <span>Vencimento {formatDueDay(card.due_day)}</span>
                                                        <CalendarDays size={15} />
                                                    </div>

                                                    <p className="mt-2 text-xs text-zinc-500">
                                                        Fecha dia {card.closing_day ?? 9}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-zinc-400">
                                                        Limite disponível
                                                    </p>

                                                    <h3 className="mt-4 text-[30px] font-semibold tracking-tight text-emerald-400">
                                                        {formatBRL(card.available)}
                                                    </h3>

                                                    <p className="mt-4 text-sm text-zinc-400">
                                                        em uso {formatBRL(card.usedLimit)}
                                                    </p>
                                                    <div className="mt-5 flex items-center justify-between rounded-xl border border-zinc-800/80 bg-[#05090d]/50 px-4 py-3">
                                                        <div>
                                                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                                                                Próxima fatura
                                                            </p>

                                                            <p className="mt-1 text-lg font-semibold tracking-tight text-white">
                                                                {formatBRL(card.nextInvoice)}
                                                            </p>
                                                        </div>

                                                        <button
                                                            onClick={() =>
                                                                setInvoiceCard({
                                                                    ...card,
                                                                    purchases: card.nextPurchases,
                                                                    invoice: card.nextInvoice,
                                                                })
                                                            }
                                                            className="rounded-lg border border-zinc-700/80 bg-[#080d13] px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-400"
                                                        >
                                                            Ver fatura
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="my-7 h-px bg-zinc-800" />

                                            <div className="grid grid-cols-2 gap-8">
                                                <div>
                                                    <p className="text-sm text-zinc-400">Limite total</p>

                                                    <p className="mt-5 text-lg font-medium text-white">
                                                        {formatBRL(card.total_limit)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-zinc-400">Utilizado</p>

                                                    <div className="mt-5 flex items-center gap-4">
                                                        <p className="w-16 text-lg font-medium text-white">
                                                            {card.usage.toFixed(2).replace(".", ",")}%
                                                        </p>

                                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                                                            <div
                                                                className={`h-full rounded-full ${barColor}`}
                                                                style={{
                                                                    width: `${Math.min(card.usage, 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-8 flex items-center gap-4">
                                                <button
                                                    onClick={() => setInvoiceCard(card)}
                                                    className="flex h-12 items-center gap-3 rounded-lg border border-zinc-700/80 bg-[#080d13] px-7 text-sm font-medium text-white transition hover:border-emerald-500/40 hover:text-emerald-400"
                                                >
                                                    <CreditCard size={18} />
                                                    Ver fatura
                                                </button>
                                                <button
                                                    onClick={() => setPayInvoiceCard(card)}
                                                    className="flex h-12 items-center gap-3 rounded-lg border border-zinc-700/80 bg-[#080d13] px-7 text-sm font-medium text-white transition hover:border-emerald-500/40 hover:text-emerald-400"
                                                >
                                                    <CheckCircle2 size={18} />
                                                    {card.isPaid ? "Cancelar pagamento" : "Pagar fatura"}
                                                </button>

                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section >

                <section className="mb-5 rounded-xl border border-zinc-800 bg-[#081018]/90 p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight text-white">
                                Resumo dos cartões
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                Visão geral das faturas e limites disponíveis.
                            </p>
                        </div>

                        <div className="rounded-lg border border-zinc-800 bg-[#05090d] px-4 py-2 text-sm font-medium text-zinc-300">
                            {usage.toFixed(2).replace(".", ",")}% utilizado
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <SummaryCard
                            label="Fatura total"
                            value={formatBRL(totalInvoice)}
                            helper="Somatório das faturas abertas"
                            tone="red"
                        />

                        <SummaryCard
                            label="Limite total"
                            value={formatBRL(totalLimit)}
                            helper="Limite combinado dos cartões"
                            tone="white"
                        />

                        <SummaryCard
                            label="Limite disponível"
                            value={formatBRL(availableLimit)}
                            helper="Valor ainda disponível para uso"
                            tone="green"
                        />

                        <div className="rounded-xl border border-zinc-800 bg-[#05090d]/70 p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-zinc-400">Utilização</p>

                                <span
                                    className={`rounded-md border px-2.5 py-1 text-xs font-medium ${usage >= 80
                                        ? "border-red-500/40 bg-red-500/10 text-red-400"
                                        : usage >= 50
                                            ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                                        }`}
                                >
                                    {usage >= 80 ? "Alta" : usage >= 50 ? "Média" : "Saudável"}
                                </span>
                            </div>

                            <div className="mt-5 flex items-end justify-between">
                                <h3 className="text-[30px] font-semibold tracking-tight text-white">
                                    {usage.toFixed(2).replace(".", ",")}%
                                </h3>

                                <p className="pb-1 text-sm text-zinc-500">do limite</p>
                            </div>

                            <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-800">
                                <div
                                    className={`h-full rounded-full ${usage >= 80
                                        ? "bg-red-500"
                                        : usage >= 50
                                            ? "bg-amber-500"
                                            : "bg-emerald-500"
                                        }`}
                                    style={{ width: `${Math.min(usage, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-zinc-800 bg-[#081018]/90 p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight text-white">
                                Histórico das faturas
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                Comparativo mensal das faturas dos cartões.
                            </p>
                        </div>

                        <select
                            value={invoiceHistoryPeriod}
                            onChange={(e) => setInvoiceHistoryPeriod(Number(e.target.value))}
                            className="h-10 rounded-lg border border-zinc-800 bg-[#05090d] px-4 text-sm font-medium text-zinc-300 outline-none transition hover:border-zinc-700 focus:border-blue-500/50"
                        >
                            <option value={3}>Últimos 3 meses</option>
                            <option value={6}>Últimos 6 meses</option>
                            <option value={12}>Últimos 12 meses</option>
                        </select>
                    </div>

                    <div className="h-[340px] w-full">
                        <ResponsiveContainer width="100%" height={340}>
                            <LineChart data={invoiceHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

                                <XAxis
                                    dataKey="month"
                                    stroke="#71717a"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12 }}
                                />

                                <YAxis
                                    stroke="#71717a"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) =>
                                        Number(value).toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                            maximumFractionDigits: 0,
                                        })
                                    }
                                />

                                <Tooltip
                                    contentStyle={{
                                        background: "#05090d",
                                        border: "1px solid #27272a",
                                        borderRadius: "12px",
                                        color: "#fff",
                                    }}
                                    labelStyle={{ color: "#fff" }}
                                    formatter={(value, name) => [
                                        formatBRL(Number(value)),
                                        name === "inter" ? "Banco Inter" : "Mercado Pago",
                                    ]}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="inter"
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 5 }}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="mercadoPago"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-5 flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                            Banco Inter
                        </div>

                        <div className="flex items-center gap-2 text-zinc-400">
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                            Mercado Pago
                        </div>
                    </div>
                </section>

                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-zinc-600">
                    <LockKeyhole size={15} />
                    <span>Seus dados estão protegidos com segurança de ponta.</span>
                </div>
            </main >

            <EditCardModal
                card={editingCard}
                onClose={() => setEditingCard(null)}
                onSuccess={async () => {
                    setEditingCard(null);
                    await loadCards();
                    showToast("success", "Cartão atualizado com sucesso.");
                }}
                onError={() => showToast("error", "Erro ao atualizar cartão.")}
            />
            {
                payInvoiceCard && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                        <div className="w-full max-w-[420px] rounded-2xl border border-zinc-800 bg-[#081018] p-6 text-white">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                {payInvoiceCard.isPaid ? "Cancelar pagamento?" : "Pagar fatura?"}
                            </h2>

                            <p className="mt-3 text-sm text-zinc-400">
                                {payInvoiceCard.isPaid ? (
                                    <>
                                        Deseja cancelar o pagamento da fatura do {payInvoiceCard.bank_name}?
                                        <br />
                                        O valor pago será devolvido para a Caixa.
                                    </>
                                ) : (
                                    <>
                                        Confirmar pagamento da fatura do {payInvoiceCard.bank_name} no valor de{" "}
                                        <span className="font-semibold text-white">
                                            {formatBRL(payInvoiceCard.invoice)}
                                        </span>
                                        ?
                                    </>
                                )}
                            </p>

                            <div className="mt-7 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setPayInvoiceCard(null)}
                                    className="h-12 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={() =>
                                        payInvoiceCard.isPaid
                                            ? handleCancelInvoicePayment(payInvoiceCard)
                                            : handlePayInvoice(payInvoiceCard)
                                    }
                                    className={`h-12 rounded-xl text-sm font-medium text-white transition ${payInvoiceCard.isPaid
                                        ? "bg-red-600 hover:bg-red-500"
                                        : "bg-emerald-600 hover:bg-emerald-500"
                                        }`}
                                >
                                    {payInvoiceCard.isPaid ? "Cancelar pagamento" : "Confirmar pagamento"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            <DepositModal
                open={depositModalOpen}
                onClose={() => setDepositModalOpen(false)}
                account={mainAccount}
                onSuccess={async () => {
                    setDepositModalOpen(false);
                    await loadCards();
                    showToast("success", "Saldo atualizado com sucesso.");
                }}
                onError={() => showToast("error", "Erro ao realizar depósito.")}
            />

            <InvoiceModal
                card={invoiceCard}
                onClose={() => setInvoiceCard(null)}
            />

            {toast && <Toast type={toast.type} message={toast.message} />}
        </>
    );
}

function EditCardModal({
    card,
    onClose,
    onSuccess,
    onError,
}: {
    card: CreditCardData | null;
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
    onError: () => void;
}) {
    const [totalLimit, setTotalLimit] = useState("");
    const [dueDay, setDueDay] = useState("");
    const [closingDay, setClosingDay] = useState("9");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!card) return;

        setTotalLimit(String(card.total_limit || ""));
        setDueDay(card.due_day ? String(card.due_day) : "");
        setClosingDay(
            card.closing_day
                ? String(card.closing_day)
                : "9"
        );
    }, [card]);

    if (!card) return null;

    async function handleSave() {
        if (!card) return;

        setSaving(true);

        try {
            await saveCreditCardSettings({
                id: card.id,
                bank_name: card.bank_name,
                last_digits: card.last_digits,
                total_limit: Number(totalLimit || 0),
                due_day: Number(dueDay) || null,
                closing_day: Number(closingDay) || 9,
                color: card.color || "emerald",
            });

            setSaving(false);
            await onSuccess();
        } catch (error) {
            console.error("ERRO AO SALVAR CARTÃO:", error);
            setSaving(false);
            onError();
        }
    }

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-[460px] rounded-2xl border border-zinc-800 bg-[#081018] p-6 text-white">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Editar cartão
                        </h2>

                        <p className="mt-2 text-sm text-zinc-400">{card.bank_name}</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <InputBox label="Limite total">
                        <input
                            type="number"
                            value={totalLimit}
                            onChange={(event) => setTotalLimit(event.target.value)}
                            placeholder="0"
                            className="h-11 w-full rounded-lg border border-zinc-700 bg-[#05090d] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/60"
                        />
                    </InputBox>

                    <InputBox label="Dia de vencimento">
                        <input
                            type="number"
                            min={1}
                            max={31}
                            value={dueDay}
                            onChange={(event) => setDueDay(event.target.value)}
                            placeholder="15"
                            className="h-11 w-full rounded-lg border border-zinc-700 bg-[#05090d] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500/60"
                        />
                    </InputBox>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="h-11 flex-1 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
                        >
                            Cancelar
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-11 flex-1 rounded-lg bg-emerald-600 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Salvando..." : "Salvar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InvoiceModal({
    card,
    onClose,
}: {
    card: CardWithInvoice | null;
    onClose: () => void;
}) {
    if (!card) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-[760px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#081018] text-white">
                <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Fatura atual
                        </h2>

                        <p className="mt-2 text-sm text-zinc-400">
                            {card.bank_name} • {getCardBrand(card.id)} •{" "}
                            {formatBRL(card.invoice)}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {card.purchases.length === 0 ? (
                    <div className="flex items-center justify-center gap-4 px-6 py-14 text-zinc-400">
                        <FileText size={34} className="text-zinc-600" />
                        Nenhuma compra encontrada neste mês.
                    </div>
                ) : (
                    <div className="max-h-[460px] overflow-y-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Descrição</th>
                                    <th className="px-6 py-4">Categoria</th>
                                    <th className="px-6 py-4 text-right">Valor</th>
                                </tr>
                            </thead>

                            <tbody>
                                {card.purchases.map((purchase) => (
                                    <tr
                                        key={purchase.id}
                                        className="border-b border-zinc-800/80 transition hover:bg-white/[0.02]"
                                    >
                                        <td className="px-6 py-4 text-sm text-zinc-300">
                                            {formatDate(purchase.transaction_date)}
                                        </td>

                                        <td className="px-6 py-4 text-sm font-medium text-white">
                                            {purchase.title}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full ${getCategoryColor(
                                                        purchase.category || ""
                                                    )}`}
                                                >
                                                    <CategoryIcon category={purchase.category || ""} />
                                                </span>

                                                <span className="text-sm text-zinc-300">
                                                    {purchase.category || "Outros"}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-right text-sm font-medium text-red-400">
                                            - {formatBRL(Number(purchase.amount))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-5">
                    <span className="text-sm text-zinc-400">Total da fatura</span>

                    <strong className="text-xl font-semibold text-white">
                        {formatBRL(card.invoice)}
                    </strong>
                </div>
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

function SummaryCard({
    label,
    value,
    helper,
    tone,
}: {
    label: string;
    value: string;
    helper: string;
    tone: "red" | "green" | "white";
}) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-[#05090d]/70 p-5">
            <p className="text-sm text-zinc-400">{label}</p>

            <h3
                className={`mt-4 text-[30px] font-semibold tracking-tight ${tone === "red"
                    ? "text-red-400"
                    : tone === "green"
                        ? "text-emerald-400"
                        : "text-white"
                    }`}
            >
                {value}
            </h3>

            <p className="mt-3 text-sm leading-5 text-zinc-500">{helper}</p>
        </div>
    );
}

function DepositModal({
    open,
    onClose,
    account,
    onSuccess,
    onError,
}: {
    open: boolean;
    onClose: () => void;
    account: BankAccount | null;
    onSuccess: () => void | Promise<void>;
    onError: () => void;
}) {
    const [amount, setAmount] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;

        setAmount(String(account?.balance ?? 0));
    }, [open, account]);

    if (!open) return null;

    async function handleSaveBalance() {
        if (!account) return;

        const newBalance = Number(amount.replace(",", "."));

        if (Number.isNaN(newBalance) || newBalance < 0) {
            onError();
            return;
        }

        setSaving(true);

        try {
            await updateBankAccountBalance({
                accountId: account.id,
                balance: newBalance,
            });

            setSaving(false);
            await onSuccess();
        } catch (error) {
            console.error("ERRO AO EDITAR SALDO:", error);
            setSaving(false);
            onError();
        }
    }

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-[420px] rounded-2xl border border-zinc-800 bg-[#081018] p-6 text-white">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Editar saldo da Caixa
                </h2>

                <p className="mt-3 text-sm text-zinc-400">
                    Defina o saldo atual da sua conta principal.
                </p>

                <div className="mt-6">
                    <label className="mb-2 block text-sm text-zinc-400">
                        Saldo atual
                    </label>

                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        className="h-12 w-full rounded-xl border border-zinc-800 bg-[#05090d] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500/50"
                    />
                </div>

                <div className="mt-7 grid grid-cols-2 gap-4">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="h-12 rounded-xl border border-zinc-800 bg-[#0b1118] text-sm font-medium text-white transition hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleSaveBalance}
                        disabled={saving}
                        className="h-12 rounded-xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? "Salvando..." : "Salvar saldo"}
                    </button>
                </div>
            </div>
        </div>
    );
}


