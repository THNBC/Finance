import { supabase } from "@/lib/supabase";

export async function loadBetAccounts() {
  return supabase.from("bet_accounts").select("*").order("name");
}

export async function loadBetTransactions() {
  return supabase.from("bet_transactions").select("*").order("created_at", { ascending: false });
}

export async function createBetAccount(name: string) {
  return supabase.from("bet_accounts").insert({ name, balance: 0 }).select("*").single();
}

export async function updateBetAccountBalance(id: string, balance: number) {
  return supabase.from("bet_accounts").update({ balance }).eq("id", id);
}

export async function createBetTransaction(input: {
  type: string;
  from_account: string | null;
  to_account: string | null;
  amount: number;
  description: string;
  created_at: string;
}) {
  return supabase.from("bet_transactions").insert(input);
}

export async function deleteBetTransaction(id: string) {
  return supabase.from("bet_transactions").delete().eq("id", id);
}
