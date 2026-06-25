import { supabase } from "@/lib/supabase";

type ImportItem = {
  date: string;
  description: string;
  amount: number;
  installment?: string | null;
};

type ImportTransaction = {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  source: string;
  group_type?: "credit_card_invoice" | "income_group" | null;
  items?: ImportItem[];
};

type ImportFile = {
  transactions: ImportTransaction[];
};

export async function saveImport(payload: ImportFile) {
  let savedCount = 0;
  let duplicateCount = 0;
  let itemCount = 0;

  for (const transaction of payload.transactions) {
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("transaction_date", transaction.date)
      .eq("description", transaction.description)
      .eq("amount", transaction.amount)
      .eq("source", transaction.source)
      .maybeSingle();

    if (existing) {
      duplicateCount++;
      continue;
    }

    let cardId: string | null = null;

    if (transaction.group_type === "credit_card_invoice") {
      const cardName =
        transaction.source === "inter"
          ? "Inter"
          : transaction.source === "mercadopago"
          ? "Mercado Pago"
          : null;

      if (cardName) {
        const { data: card } = await supabase
          .from("credit_cards")
          .select("id")
          .eq("name", cardName)
          .maybeSingle();

        cardId = card?.id ?? null;
      }
    }

    const { data: savedTransaction, error } = await supabase
      .from("transactions")
      .insert({
        transaction_date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        source: transaction.source,
        card_id: cardId,
      })
      .select("id")
      .single();

    if (error) throw error;

    savedCount++;

    if (!transaction.items?.length) continue;

    if (transaction.group_type === "credit_card_invoice") {
      const { error: itemsError } = await supabase
        .from("credit_card_items")
        .insert(
          transaction.items.map((item) => ({
            transaction_id: savedTransaction.id,
            item_date: item.date,
            description: item.description,
            amount: Math.abs(Number(item.amount)),
            installment: item.installment ?? null,
          }))
        );

      if (itemsError) throw itemsError;

      itemCount += transaction.items.length;
    }

    if (transaction.group_type === "income_group") {
      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(
          transaction.items.map((item) => ({
            transaction_id: savedTransaction.id,
            item_date: item.date,
            title: item.description,
            amount: Math.abs(Number(item.amount)),
            category: "rendimentos",
          }))
        );

      if (itemsError) throw itemsError;

      itemCount += transaction.items.length;
    }
  }

  return {
    savedCount,
    duplicateCount,
    itemCount,
    invoicePaymentIgnoredCount: 0,
  };
}