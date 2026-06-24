import { detectSource } from "./detectSource";
import { parseCaixa } from "./parseCaixa";
import { parseInter } from "./parseInter";
import { parseMercadoPago } from "./parseMercadoPago";

export function parseTransactions(
  text: string
) {
  const source = detectSource(text);

  switch (source) {
    case "caixa":
      return parseCaixa(text);

    case "inter":
      return parseInter(text);

    case "mercadopago":
      return parseMercadoPago(text);

    default:
      return [];
  }
}