import { supabase } from "@/lib/supabase";

export async function loadAccounts() {
  return supabase.from("accounts").select("*");
}

export async function updateAccountBalance(accountId: string, balance: number) {
  return supabase
    .from("accounts")
    .update({ balance })
    .eq("id", accountId)
    .select("id, name, balance")
    .single();
}
