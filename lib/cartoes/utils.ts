import type { Transaction } from "./types";

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function parseBRLInput(value: string) {
  return Number(value.replace(/\./g, "").replace(",", ".").trim());
}

export function getCardSource(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("mercado")) return "mercadopago";
  if (normalized.includes("inter")) return "inter";

  return normalized.replace(/\s/g, "");
}

export function getIcon(source: string) {
  if (source === "inter") return "/icons/inter.png";
  if (source === "mercadopago") return "/icons/mercadopago.png";
  return "/icons/caixa.png";
}

export function getLimitBarClass(percent: number, source: string) {
  if (percent >= 81) return "bg-red-500";
  if (percent >= 70) return "bg-yellow-400";

  return source === "inter" ? "bg-orange-500" : "bg-blue-500";
}

export function getInvoiceHoverClass(source: string) {
  if (source === "inter") {
    return "hover:border-orange-500/50 hover:bg-orange-500/5";
  }

  if (source === "mercadopago") {
    return "hover:border-blue-500/50 hover:bg-blue-500/5";
  }

  return "hover:border-cyan-400/50 hover:bg-cyan-400/5";
}

export function getMonthLabel(monthIndex: number) {
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

  return months[monthIndex] ?? "";
}

export function addMonths(date: Date, monthsToAdd: number) {
  return new Date(date.getFullYear(), date.getMonth() + monthsToAdd, 1);
}

export function toMonthInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function getFirstInvoiceDateFromPurchaseDate(purchaseDate: string) {
  const date = new Date(`${purchaseDate}T12:00:00`);
  const invoiceMonthOffset = date.getDate() < 9 ? 0 : 1;

  return new Date(date.getFullYear(), date.getMonth() + invoiceMonthOffset, 15);
}

export function isCaixaProfitTransaction(transaction: Transaction) {
  if (transaction.source !== "caixa") return false;
  if (transaction.type !== "income") return false;

  const description = (transaction.description ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    description.includes("rendimento") ||
    description.includes("credito juros") ||
    description.includes("correcao monetaria")
  );
}
