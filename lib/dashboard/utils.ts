export const monthNames = [
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

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function parseBRLInput(value: string) {
  return Number(value.replace(/\./g, "").replace(",", ".").trim());
}

export function formatDateBR(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

export function getSourceLabel(source?: string | null) {
  if (source === "caixa") return "Caixa";
  if (source === "inter") return "Inter";
  if (source === "mercadopago") return "Mercado Pago";
  return "Manual";
}

export function getMonthKey(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}
