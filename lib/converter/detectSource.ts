export function detectSource(text: string) {
  const normalized = text.toLowerCase();

  if (
    normalized.includes("mercado pago") ||
    normalized.includes("cartão de crédito mercado pago") ||
    normalized.includes("pague sua fatura pelo app mercado pago")
  ) {
    return "mercadopago";
  }

  if (
    normalized.includes("banco inter") ||
    normalized.includes("inter") ||
    normalized.includes("fatura inter")
  ) {
    return "inter";
  }

  if (normalized.includes("caixa")) {
    return "caixa";
  }

  return "manual";
}