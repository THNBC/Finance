import { ImportedTransaction } from "@/types/transaction";

function parseBRL(value: string) {
  return Number(
    value
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  );
}

export function parseCaixa(
  text: string
): ImportedTransaction[] {
  const transactions: ImportedTransaction[] = [];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (
      line.includes("SALDO DIA") ||
      line.includes("SALDO ANTERIOR")
    ) {
      continue;
    }

    const dateMatch = line.match(
      /(\d{2}\/\d{2}\/\d{4})/
    );

    if (!dateMatch) continue;

    const date = dateMatch[1];

    let type: "income" | "expense" | null = null;

    if (
      line.includes("PIX RECEBIDO") ||
      line.includes("CREDITO JUROS") ||
      line.includes("CORRECAO MONETARIA") ||
      line.includes("CR CONV SAQ DEP-JAM FGTS")
    ) {
      type = "income";
    }

    if (
      line.includes("PIX ENVIADO") ||
      line.includes("CLARO RESIDENCIAL")
    ) {
      type = "expense";
    }

    if (!type) continue;

    const valueMatch = line.match(
      /(\d{1,3}(?:\.\d{3})*,\d{2})\s*[CD]?$/i
    );

    if (!valueMatch) continue;

    const amount = parseBRL(valueMatch[1]);

    let description = line
      .replace(date, "")
      .replace(valueMatch[0], "")
      .trim();

    transactions.push({
      date: date.split("/").reverse().join("-"),
      description,
      amount:
        type === "expense"
          ? -Math.abs(amount)
          : Math.abs(amount),
      type,
      source: "caixa",
    });
  }

  console.log(
    `CAIXA: ${transactions.length} transações encontradas`
  );

  return transactions;
}