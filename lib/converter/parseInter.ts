import {
  ImportedCardItem,
  ImportedTransaction,
} from "@/types/transaction";

function parseBRL(value: string) {
  return Number(
    value
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  );
}

function monthNameToNumber(month: string) {
  const months: Record<string, string> = {
    jan: "01",
    fev: "02",
    mar: "03",
    abr: "04",
    mai: "05",
    jun: "06",
    jul: "07",
    ago: "08",
    set: "09",
    out: "10",
    nov: "11",
    dez: "12",
  };

  return months[month.toLowerCase().slice(0, 3)] ?? "01";
}

function parseItemDate(value: string) {
  const match = value.match(/(\d{2}) de ([a-zç.]+)\s*(\d{4})/i);

  if (!match) return "";

  const day = match[1];
  const month = monthNameToNumber(match[2].replace(".", ""));
  const year = match[3];

  return `${year}-${month}-${day}`;
}

function parseInstallment(description: string) {
  const match = description.match(/\(Parcela\s+(\d+)\s+de\s+(\d+)\)/i);

  if (!match) return undefined;

  const current = match[1].padStart(2, "0");
  const total = match[2].padStart(2, "0");

  return `${current}/${total}`;
}

export function parseInter(text: string): ImportedTransaction[] {
  const totalMatch = text.match(/Total da sua fatura\s*R\$\s*([\d.,]+)/i);

  const vencimentoMatch = text.match(
    /Data de Vencimento\s*(\d{2}\/\d{2}\/\d{4})/i
  );

  if (!totalMatch || !vencimentoMatch) {
    return [];
  }

  const amount = parseBRL(totalMatch[1]);
  const [day, month, year] = vencimentoMatch[1].split("/");

  const monthNames = [
    "",
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

  const items: ImportedCardItem[] = [];

  const itemsArea =
    text.split("Despesas da fatura")[1]?.split("Limite de crédito total")[0] ??
    "";

  const itemRegex =
    /(\d{2} de [a-zç.]+ \d{4})(.*?)([+-]?\s*R\$\s*[\d.,]+)/gi;

  let match;

  while ((match = itemRegex.exec(itemsArea)) !== null) {
    const rawDate = match[1];
    const rawDescription = match[2].trim();
    const rawAmount = match[3];

    if (!rawDescription) continue;
    if (rawDescription.toLowerCase().startsWith("total cartão")) continue;
    if (rawDescription.toLowerCase().includes("pagamento on line")) continue;

    const installment = parseInstallment(rawDescription);

    const description = rawDescription
      .replace(/\(Parcela\s+\d+\s+de\s+\d+\)/i, "")
      .replace(/^-/, "")
      .trim();

    const parsedAmount = Math.abs(parseBRL(rawAmount));

    items.push({
      date: parseItemDate(rawDate),
      description,
      amount: parsedAmount,
      installment,
    });
  }

  return [
    {
      date: `${year}-${month}-${day}`,
      description: `Fatura Inter ${monthNames[Number(month)]}/${year}`,
      amount: -amount,
      type: "expense",
      source: "inter",
      invoiceMonth: Number(month),
      invoiceYear: Number(year),
      cardName: "Inter",
      items,
    },
  ];
}