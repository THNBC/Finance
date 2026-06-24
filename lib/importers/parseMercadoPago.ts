import { ImportedTransaction } from "@/types/transaction";

function parseBRL(value: string) {
  return Number(
    value
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim()
  );
}

function getMonthName(month: number) {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return months[month - 1];
}

export function parseMercadoPago(text: string): ImportedTransaction[] {
  const normalizedText = text.replace(/\r/g, "");

  const invoiceMatch = normalizedText.match(
    /Essa é sua fatura de\s+([a-zçãéíóú]+)[\s\S]*?Total a pagar\s*R\$\s*([\d.,]+)[\s\S]*?Vence em\s*(\d{2})\/(\d{2})\/(\d{4})/i
  );

  if (!invoiceMatch) {
    return [];
  }

  const invoiceMonthText = invoiceMatch[1];
  const totalAmount = parseBRL(invoiceMatch[2]);
  const dueDay = invoiceMatch[3];
  const dueMonth = Number(invoiceMatch[4]);
  const dueYear = Number(invoiceMatch[5]);

  const items: ImportedTransaction["items"] = [];

  const cardSectionMatch = normalizedText.match(
    /Cartão Visa \[\*+\d+\][\s\S]*?DataMovimentaçõesValor em R\$\s*([\s\S]*?)\s*TotalR\$/i
  );

  const cardSection = cardSectionMatch?.[1] ?? "";

  const itemRegex =
    /(\d{2}\/\d{2})([A-ZÀ-Úa-zà-ú0-9* .\-]+?)(?:Parcela\s+(\d+)\s+de\s+(\d+))?R\$\s*([\d.,]+)/g;

  let match;

  while ((match = itemRegex.exec(cardSection)) !== null) {
    const [, date, description, installmentCurrent, installmentTotal, amount] =
      match;

    items.push({
      date: `${dueYear}-${date.slice(3, 5)}-${date.slice(0, 2)}`,
      description: description.trim(),
      amount: -Math.abs(parseBRL(amount)),
      installment:
        installmentCurrent && installmentTotal
          ? `${installmentCurrent}/${installmentTotal}`
          : undefined,
    });
  }

  return [
    {
      date: `${dueYear}-${String(dueMonth).padStart(2, "0")}-${dueDay}`,
      description: `Fatura Mercado Pago ${getMonthName(dueMonth)}/${dueYear}`,
      amount: -Math.abs(totalAmount),
      type: "expense",
      cardName: "Mercado Pago",
      source: "mercadopago",
      items,
    },
  ];
}