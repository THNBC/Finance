"use client";

import { useState } from "react";
import {
    X,
    Banknote,
    BanknoteArrowDown,
    BanknoteArrowUp,
    Calendar,
    Coins,
    CreditCard,
    Utensils,
    ChevronDown,
    ShoppingBag,
    Dumbbell,
    PlaySquare,
    Repeat,
    Fuel,
    Stethoscope,
    Wrench,
    Wallet,
    Landmark,
    CheckCircle2,
    XCircle,
    QrCode,
    HandCoins,
    RefreshCcw,
    Wifi,
    Smartphone,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Props = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
};

const expenseCategories = [
    "Fatura",
    "Pix",
    "Compras",
    "Alimentação",
    "Academia",
    "Streaming",
    "Assinatura",
    "Internet",
    "Recarga de celular",
    "Combustível",
    "Dentista",
    "Manutenção carro",
];

const incomeCategories = [
    "Salário",
    "Pix",
    "Transferência",
    "Bônus salário",
    "Crédito juros",
];

const creditCards = [
    {
        id: "inter",
        label: "Banco Inter",
    },
    {
        id: "mercado-pago",
        label: "Mercado Pago",
    },
];

const formatBRL = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);

function getToday() {
    return new Date().toISOString().split("T")[0];
}

function Toast({
    show,
    message,
    type = "success",
}: {
    show: boolean;
    message: string;
    type?: "success" | "error";
}) {
    if (!show) return null;

    return (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 animate-[toastIn_280ms_ease-out]">
            <div
                className={`flex items-center gap-3 rounded-xl border px-5 py-4 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl ${type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                    }`}
            >
                {type === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}

                <p className="text-sm font-medium text-white">{message}</p>
            </div>
        </div>
    );
}

function CategoryIcon({ category }: { category: string }) {
    const iconProps = {
        size: 18,
        className: "text-white",
    };

    switch (category) {
        case "Fatura":
            return <CreditCard {...iconProps} />;

        case "Pix":
            return <QrCode {...iconProps} />;

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

        case "Salário":
            return <HandCoins {...iconProps} />;

        case "Transferência":
            return <RefreshCcw {...iconProps} />;

        case "Bônus salário":
            return <BanknoteArrowUp {...iconProps} />;

        case "Crédito juros":
            return <Coins {...iconProps} />;

        case "Dinheiro":
            return <Banknote {...iconProps} />;

        case "Conta corrente":
            return <Landmark {...iconProps} />;

        default:
            return <Wallet {...iconProps} />;
        case "Internet":
            return <Wifi {...iconProps} />;

        case "Recarga de celular":
            return <Smartphone {...iconProps} />;
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
        case "Alimentação":
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
        case "Salário":
            return "bg-emerald-500";
        case "Transferência":
            return "bg-blue-500";
        case "Bônus salário":
            return "bg-green-500";
        default:
            return "bg-indigo-500";
        case "Internet":
            return "bg-sky-500";

        case "Recarga de celular":
            return "bg-lime-500";
    }
}



function getPaymentMethodIcon(method: string) {
    switch (method) {
        case "Pix":
            return <QrCode size={18} />;

        case "Cartão de crédito":
            return <CreditCard size={18} />;

        case "Débito":
            return <CreditCard size={18} />;

        case "Dinheiro":
            return <Banknote size={18} />;

        case "Conta corrente":
            return <Landmark size={18} />;

        case "Salário":
            return <HandCoins size={18} />;

        case "Transferência":
            return <RefreshCcw size={18} />;

        case "Bônus salário":
            return <BanknoteArrowUp size={18} />;

        case "Crédito juros":
            return <Coins size={18} />;

        default:
            return <CreditCard size={18} />;
    }
}

export default function AddTransactionModal({
    open,
    onClose,
    onSuccess,
}: Props) {
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"expense" | "income">("expense");
    const [category, setCategory] = useState("Fatura");
    const [transactionDate, setTransactionDate] = useState(getToday());
    const [paymentMethod, setPaymentMethod] = useState("Pix");
    const [selectedCardId, setSelectedCardId] = useState("inter");
    const [installments, setInstallments] = useState("1x");

    const [loading, setLoading] = useState(false);


    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState<"success" | "error">("success");
    const [toastMessage, setToastMessage] = useState("");
    if (!open) {
        return <Toast show={showToast} message={toastMessage} type={toastType} />;
    }

    function showLocalToast(type: "success" | "error", message: string) {
        setToastType(type);
        setToastMessage(message);
        setShowToast(true);

        setTimeout(() => {
            setShowToast(false);
        }, 2800);
    }

    async function updateCaixaBalance(
        type: "expense" | "income",
        amount: number
    ) {
        const { data, error: accountError } = await supabase
            .from("bank_accounts")
            .select("balance")
            .eq("id", "caixa")
            .single();

        if (accountError) {
            console.log("ERRO AO BUSCAR SALDO DA CAIXA:", accountError);
            return;
        }

        const currentBalance = Number(data?.balance ?? 0);

        const newBalance =
            type === "income"
                ? currentBalance + amount
                : currentBalance - amount;

        const { error: updateError } = await supabase
            .from("bank_accounts")
            .update({
                balance: newBalance,
                updated_at: new Date().toISOString(),
            })
            .eq("id", "caixa");

        if (updateError) {
            console.log("ERRO AO ATUALIZAR SALDO DA CAIXA:", updateError);
        }
    }

    function handleTypeChange(newType: "expense" | "income") {
        setType(newType);
        setCategory(newType === "expense" ? "Fatura" : "Salário");
        setPaymentMethod(newType === "expense" ? "Pix" : "Conta corrente");
        setSelectedCardId("inter");
        setInstallments("1x");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!title.trim()) {
            showLocalToast("error", "Informe a descrição.");
            return;
        }

        if (!amount || Number(amount) <= 0) {
            showLocalToast("error", "Informe um valor válido.");
            return;
        }


        setLoading(true);

        const totalAmount = Number(amount);

        const isCreditCard =
            type === "expense" && paymentMethod === "Cartão de crédito";

        const installmentCount = isCreditCard
            ? Number(installments.replace("x", ""))
            : 1;

        const installmentValue = totalAmount / installmentCount;

        const baseDate = new Date(transactionDate + "T00:00:00");



        const transactionsToInsert = Array.from(
            { length: installmentCount },
            (_, index) => {
                const installmentDate = new Date(baseDate);



                installmentDate.setMonth(baseDate.getMonth() + index);

                const generatedMonth = `${installmentDate.getFullYear()}-${String(
                    installmentDate.getMonth() + 1
                ).padStart(2, "0")}`;

                return {
                    title:
                        installmentCount > 1
                            ? `${title.trim()} (${index + 1}/${installmentCount})`
                            : title.trim(),
                    amount: installmentValue,
                    type,
                    category,
                    transaction_date: installmentDate.toISOString().split("T")[0],
                    payment_method: isCreditCard ? "credit_card" : paymentMethod,
                    card_id: isCreditCard ? selectedCardId : null,
                    installments: installmentCount,
                    installment_number: index + 1,
                    total_amount: totalAmount,
                    note: null,
                    recurring_id: null,
                    generated_month: null,
                };
            }
        );

        const { error } = await supabase
            .from("transactions")
            .insert(transactionsToInsert);

        setLoading(false);

        if (error) {
            console.log("ERRO AO SALVAR TRANSAÇÃO:", error);
            showLocalToast("error", "Erro ao salvar transação.");
            return;
        }

        showLocalToast(
            "success",
            "Transação salva com sucesso."
        );

        setTitle("");
        setAmount("");
        setType("expense");
        setCategory("Fatura");
        setTransactionDate(getToday());
        setPaymentMethod("Pix");
        setSelectedCardId("inter");
        setInstallments("1x");



        if (!isCreditCard) {
            await updateCaixaBalance(type, totalAmount);
        }

        await onSuccess();

        setTimeout(() => {
            onClose();
        }, 100);
    }
    return (
        <>
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                <div className="w-full max-w-[670px] rounded-2xl border border-zinc-700/80 bg-[#0b121a] p-8 shadow-[0_0_80px_rgba(0,0,0,0.65)]">
                    <div className="mb-8 flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-white">
                            Adicionar transação
                        </h2>

                        <button
                            onClick={onClose}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 rounded-xl border border-zinc-700 bg-[#081018]">
                            <button
                                type="button"
                                onClick={() => handleTypeChange("expense")}
                                className={`flex h-14 items-center justify-center gap-3 border-b-2 text-sm font-medium transition ${type === "expense"
                                    ? "border-red-500 text-red-400"
                                    : "border-transparent text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <BanknoteArrowDown size={21} />
                                Despesa
                            </button>

                            <button
                                type="button"
                                onClick={() => handleTypeChange("income")}
                                className={`flex h-14 items-center justify-center gap-3 border-b-2 text-sm font-medium transition ${type === "income"
                                    ? "border-emerald-500 text-emerald-400"
                                    : "border-transparent text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <BanknoteArrowUp size={21} />
                                Receita
                            </button>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-white">
                                Descrição
                            </label>

                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="Despesas ou Receitas"
                                className="h-14 w-full rounded-xl border border-zinc-700 bg-[#081018] px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white">
                                    Valor total
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    placeholder="R$ 0,00"
                                    className="h-14 w-full rounded-xl border border-zinc-700 bg-[#081018] px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-white">
                                    Data
                                </label>

                                <div className="relative">
                                    <Calendar
                                        size={18}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                                    />

                                    <input
                                        type="date"
                                        value={transactionDate}
                                        onChange={(e) => setTransactionDate(e.target.value)}
                                        className="h-14 w-full rounded-xl border border-zinc-700 bg-[#081018] px-11 text-white outline-none transition focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div
                            className={`grid gap-6 ${type === "expense" ? "grid-cols-2" : "grid-cols-1"
                                }`}
                        >
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white">
                                    Categoria
                                </label>

                                <div className="relative">
                                    <div
                                        className={`pointer-events-none absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full ${getCategoryColor(
                                            category
                                        )}`}
                                    >
                                        <CategoryIcon category={category} />
                                    </div>

                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="h-14 w-full appearance-none rounded-xl border border-zinc-700 bg-[#081018] px-14 pr-11 text-white outline-none transition focus:border-emerald-500"
                                    >
                                        {(type === "expense"
                                            ? expenseCategories
                                            : incomeCategories
                                        ).map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>

                                    <ChevronDown
                                        size={18}
                                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                                    />
                                </div>
                            </div>

                            {type === "expense" && (
                                <SelectBox
                                    label="Forma de pagamento"
                                    icon={getPaymentMethodIcon(paymentMethod)}
                                    value={paymentMethod}
                                    onChange={setPaymentMethod}
                                    options={[
                                        "Pix",
                                        "Cartão de crédito",
                                        "Débito",
                                        "Dinheiro",
                                        "Conta corrente",
                                        "Salário",
                                        "Transferência",
                                        "Bônus salário",
                                        "Crédito juros",
                                    ]}
                                    color="zinc"
                                />
                            )}
                        </div>

                        {type === "expense" && paymentMethod === "Cartão de crédito" && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-white">
                                            Cartão
                                        </label>

                                        <div className="relative">
                                            <div
                                                className={`pointer-events-none absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full ${selectedCardId === "inter"
                                                    ? "bg-orange-500 text-white"
                                                    : "bg-blue-500 text-white"
                                                    }`}
                                            >
                                                <CreditCard size={18} />
                                            </div>

                                            <select
                                                value={selectedCardId}
                                                onChange={(e) => setSelectedCardId(e.target.value)}
                                                className="h-14 w-full appearance-none rounded-xl border border-zinc-700 bg-[#081018] px-14 pr-11 text-white outline-none transition focus:border-emerald-500"
                                            >
                                                {creditCards.map((card) => (
                                                    <option key={card.id} value={card.id}>
                                                        {card.label}
                                                    </option>
                                                ))}
                                            </select>

                                            <ChevronDown
                                                size={18}
                                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                                            />
                                        </div>
                                    </div>

                                    <SelectBox
                                        label="Parcelamento"
                                        icon={getPaymentMethodIcon(paymentMethod)}
                                        value={installments}
                                        onChange={setInstallments}
                                        options={[
                                            "1x",
                                            "2x",
                                            "3x",
                                            "4x",
                                            "5x",
                                            "6x",
                                            "7x",
                                            "8x",
                                            "9x",
                                            "10x",
                                            "11x",
                                            "12x",
                                        ]}
                                        color="zinc"
                                    />
                                </div>

                                {Number(amount || 0) > 0 && (
                                    <div className="rounded-xl border border-zinc-700 bg-[#081018] px-5 py-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-zinc-400">Valor total</p>

                                                <p className="mt-1 text-lg font-semibold text-white">
                                                    {formatBRL(Number(amount))}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm text-zinc-400">Parcelamento</p>

                                                <p className="mt-1 text-lg font-semibold text-emerald-400">
                                                    {installments} de{" "}
                                                    {formatBRL(
                                                        Number(amount) /
                                                        Number(installments.replace("x", ""))
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}



                        <div className="grid grid-cols-2 gap-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-14 rounded-xl border border-zinc-700 text-sm font-medium text-white transition hover:bg-white/5"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="h-14 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {loading ? "Salvando..." : "Salvar transação"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Toast show={showToast} message={toastMessage} type={toastType} />
        </>
    );
}

function SelectBox({
    label,
    icon,
    value,
    onChange,
    options,
    color,
}: {
    label: string;
    icon: React.ReactNode;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    color: "red" | "zinc";
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-white">
                {label}
            </label>

            <div className="relative">
                <div
                    className={`pointer-events-none absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full ${color === "red"
                        ? "bg-red-500 text-white"
                        : "bg-zinc-800 text-zinc-300"
                        }`}
                >
                    {icon}
                </div>

                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-14 w-full appearance-none rounded-xl border border-zinc-700 bg-[#081018] px-14 pr-11 text-white outline-none transition focus:border-emerald-500"
                >
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                />
            </div>
        </div>
    );
}