import { supabase } from "@/lib/supabase";

export async function loadInvestments() {
  return supabase.from("investments").select("*").order("name");
}

export async function loadInvestmentTransactions() {
  return supabase
    .from("investment_transactions")
    .select("id, investment_id, type, amount, transaction_date")
    .order("transaction_date", { ascending: true });
}

export async function createInvestmentTransaction(input: {
  investment_id: string;
  type: "aporte" | "rendimento" | "saque";
  amount: number;
  transaction_date: string;
}) {
  return supabase.from("investment_transactions").insert(input);
}

export async function updateInvestment(id: string, input: { amount: number; profit: number }) {
  return supabase.from("investments").update(input).eq("id", id);
}
