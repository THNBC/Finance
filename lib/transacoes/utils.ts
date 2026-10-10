import type {
  CreditCardInstallment,
  CreditCardRow,
  Transaction,
  TransactionItem,
} from "./types";

export const pageSizeOptions = [10, 20, 50];

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function parseBRLInput(value: string) {
  return Number(value.replace(/\./g, "").replace(",", ".").trim());
}

export function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

export function getSourceLabel(source?: string | null) {
  if (source === "inter") return "Inter";
  if (source === "mercadopago") return "Mercado Pago";
  if (source === "caixa") return "Caixa";
  return "Manual";
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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

export function buildPaidInvoiceItems(
  transaction: Transaction,
  cards: CreditCardRow[],
  installments: CreditCardInstallment[]
): TransactionItem[] {
  if (transaction.source !== "caixa") return [];
  if (transaction.type !== "expense") return [];

  const normalizedDescription = normalizeText(transaction.description ?? "");

  if (!normalizedDescription.includes("pagamento fatura")) {
    return [];
  }

  const matchedCard = cards.find((card) =>
    normalizedDescription.includes(normalizeText(card.name))
  );

  if (!matchedCard) return [];

  const cardInstallments = installments.filter(
    (installment) =>
      installment.card_id === matchedCard.id && installment.paid === true
  );

  const groupedByInvoice = cardInstallments.reduce(
    (acc: Record<string, CreditCardInstallment[]>, installment) => {
      const key = `${installment.due_year}-${String(
        installment.due_month
      ).padStart(2, "0")}`;

      if (!acc[key]) acc[key] = [];
      acc[key].push(installment);

      return acc;
    },
    {}
  );

  const matchedInvoice = Object.values(groupedByInvoice).find((invoiceItems) => {
    const firstItem = invoiceItems[0];

    if (!firstItem) return false;

    const label = `${getMonthLabel(firstItem.due_month - 1)}/${firstItem.due_year}`;

    return normalizedDescription.includes(normalizeText(label));
  });

  if (!matchedInvoice) return [];

  return matchedInvoice
    .sort((a, b) => {
      if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
      return a.installment_number - b.installment_number;
    })
    .map((installment) => ({
      id: installment.id,
      transaction_id: transaction.id,
      item_date: installment.due_date,
      description: installment.description ?? "Compra",
      amount: Math.abs(Number(installment.amount ?? 0)),
      installment: `${installment.installment_number}/${installment.installment_total}`,
      created_at: transaction.created_at,
      item_type: "credit_card",
    }));
}
