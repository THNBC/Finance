import { supabase } from "@/lib/supabase";

export async function loadDashboardTransactions() {
  return supabase
    .from("transactions")
    .select("id, transaction_date, description, amount, type, source, created_at")
    .order("transaction_date", { ascending: true });
}

export async function loadTransactionsWithCards() {
  return supabase
    .from("transactions")
    .select(`
      id,
      transaction_date,
      description,
      amount,
      type,
      source,
      card_id,
      created_at,
      credit_cards (name)
    `)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function createCaixaTransaction(input: {
  transaction_date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
}) {
  return supabase.from("transactions").insert({
    transaction_date: input.transaction_date,
    description: input.description,
    amount: input.amount,
    type: input.type,
    source: "caixa",
    paid: true,
  });
}

export async function deleteTransactionById(id: string) {
  return supabase.from("transactions").delete().eq("id", id);
}
