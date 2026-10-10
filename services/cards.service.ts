import { supabase } from "@/lib/supabase";

export async function loadCreditCards() {
  return supabase.from("credit_cards").select("id, name, limit_total, active").order("name", { ascending: true });
}

export async function loadCreditCardsBasic() {
  return supabase.from("credit_cards").select("id, name, active");
}

export async function loadCreditCardInstallments() {
  return supabase
    .from("credit_card_installments")
    .select("id, purchase_id, card_id, description, installment_number, installment_total, due_month, due_year, due_date, amount, paid, payment_date")
    .order("due_date", { ascending: true });
}

export async function loadPaidCreditCardInstallments() {
  return supabase
    .from("credit_card_installments")
    .select("id, purchase_id, card_id, description, installment_number, installment_total, due_month, due_year, due_date, amount, paid, payment_date")
    .eq("paid", true)
    .order("due_date", { ascending: true });
}

export async function createCreditCardPurchase(input: {
  card_id: string;
  description: string;
  purchase_date: string;
  total_amount: number;
  installments: number;
}) {
  return supabase.from("credit_card_purchases").insert(input).select("id").single();
}

export async function createCreditCardInstallments(rows: unknown[]) {
  return supabase.from("credit_card_installments").insert(rows);
}

export async function markInstallmentsAsPaid(ids: string[], paymentDate: string) {
  return supabase
    .from("credit_card_installments")
    .update({ paid: true, payment_date: paymentDate })
    .in("id", ids);
}
