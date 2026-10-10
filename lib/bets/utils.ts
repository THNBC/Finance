import type { BetTransaction, HouseName } from "./types";

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function parseBRL(value: string) {
  return Number(value.replace(/\./g, "").replace(",", ".").trim());
}

export function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

export function parseHouseName(value?: string | null): HouseName | null {
  if (!value) return null;

  const normalized = value.toLowerCase();

  if (normalized.includes("bet365")) return "Bet365";
  if (normalized.includes("betano")) return "Betano";
  if (normalized.includes("superbet")) return "Superbet";

  return null;
}

export function getTransactionHouse(transaction: BetTransaction): HouseName | null {
  return (
    parseHouseName(transaction.to_account) ??
    parseHouseName(transaction.from_account)
  );
}

export function getTypeLabel(type: string) {
  if (type === "base") return "Valor base";
  if (type === "deposit") return "Depósito";
  if (type === "withdraw") return "Saque";
  if (type === "profit") return "Lucro";
  if (type === "loss") return "Perda";
  if (type === "bet") return "Aposta";
  return type;
}

export function getPerformanceAmount(transaction: BetTransaction) {
  const amount = Math.abs(Number(transaction.amount ?? 0));

  if (transaction.type === "profit") return amount;
  if (transaction.type === "loss") return -amount;
  if (transaction.type === "bet") return -amount;

  return 0;
}

export function getResultAmount(transaction: BetTransaction) {
  const amount = Math.abs(Number(transaction.amount ?? 0));

  if (transaction.type === "withdraw") return amount;
  if (transaction.type === "profit") return amount;

  if (transaction.type === "deposit") return -amount;
  if (transaction.type === "loss") return -amount;
  if (transaction.type === "bet") return -amount;

  return 0;
}

export function getTypeColor(type: string) {
  if (type === "withdraw") return "text-blue-400";
  if (type === "deposit") return "text-orange-400";
  if (type === "profit") return "text-emerald-400";
  if (type === "base") return "text-cyan-400";

  return "text-red-400";
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

export function isCurrentMonth(date: Date) {
  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export function isPreviousMonth(date: Date) {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return (
    date.getMonth() === previous.getMonth() &&
    date.getFullYear() === previous.getFullYear()
  );
}

export function getMonthComparison(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? "0,0% vs mês anterior" : "Novo valor no mês";
  }

  const diff = current - previous;
  const percent = (diff / Math.abs(previous)) * 100;
  const sign = diff >= 0 ? "+" : "-";

  return `${sign} ${Math.abs(percent).toFixed(1)}% (${sign} ${formatBRL(
    Math.abs(diff),
  )}) vs mês anterior`;
}
