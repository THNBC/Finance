import { ImportedTransaction } from "./types";

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function parseBRL(value: string) {
  return Number(value.replace(/\./g, "").replace(",", ".").trim());
}

export function getSourceLabel(source?: string | null) {
  if (source === "caixa") return "Caixa";
  if (source === "inter") return "Inter";
  if (source === "mercadopago") return "Mercado Pago";
  if (source === "json") return "JSON padronizado";
  return "--";
}

export function getInvoiceDescription(source: string) {
  if (source === "inter") return "Fatura Inter";
  if (source === "mercadopago") return "Fatura Mercado Pago";
  return "Fatura Cartão";
}

export function getInstallmentClasses(installment: string) {
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

export function cleanDescription(description: string) {
  return description.replace(/\s*-\s*"?\d+$/g, "").trim();
}

export function getTodayBRDate() {
  return new Date().toISOString().split("T")[0];
}

export function isIncomeGroup(transaction: ImportedTransaction) {
  return (
    transaction.group_type === "income_group" ||
    transaction.description.toLowerCase().startsWith("rendimentos")
  );
}

export function normalizeTransaction(
  transaction: ImportedTransaction
): ImportedTransaction {
  const type =
    transaction.type ?? (transaction.amount >= 0 ? "income" : "expense");

  return {
    ...transaction,
    amount: Number(transaction.amount),
    type,
    source: transaction.source ?? "caixa",
    group_type: transaction.group_type ?? null,
    items: (transaction.items ?? []).map((item) => ({
      date: item.date,
      description: item.description,
      amount: Number(item.amount),
      installment: item.installment ?? null,
    })),
  };
}

export function getStatusLabel(status: string) {
  if (status === "idle") return "Aguardando arquivo";
  if (status === "selected") return "Arquivo selecionado";
  if (status === "reading") return "Lendo JSON";
  if (status === "ready") return "Pronto para revisão";
  return "Erro na leitura";
}