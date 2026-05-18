"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string | null;
  transaction_date: string;
  payment_method?: string | null;
  card_id?: string | null;
  recurring_id?: string | null;
  generated_month?: string | null;
};

type RecurringTransaction = {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string | null;
  payment_method: string | null;
  card_id: string | null;
  due_day: number;
  active: boolean;
};

function getCurrentMonthKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${date.getFullYear()}-${month}`;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function generateRecurringTransactions() {
    const now = new Date();

    const currentMonthKey = getCurrentMonthKey(now);

    const { data: recurringData, error: recurringError } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("active", true);

    if (recurringError) {
      console.log("ERRO RECORRÊNCIAS:", recurringError);
      return;
    }

    const recurringTransactions =
      (recurringData ?? []) as RecurringTransaction[];

    for (const recurring of recurringTransactions) {
      const { data: existingTransaction } = await supabase
        .from("transactions")
        .select("id")
        .eq("recurring_id", recurring.id)
        .eq("generated_month", currentMonthKey)
        .maybeSingle();

      if (existingTransaction) {
        continue;
      }

      const dueDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        recurring.due_day
      );

      const transactionPayload = {
        title: recurring.title,
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        transaction_date: dueDate.toISOString().split("T")[0],
        payment_method: recurring.payment_method,
        card_id: recurring.card_id,
        recurring_id: recurring.id,
        generated_month: currentMonthKey,
      };

      const { error: insertError } = await supabase
        .from("transactions")
        .insert(transactionPayload);

      if (insertError) {
        console.log(
          "ERRO AO GERAR TRANSAÇÃO RECORRENTE:",
          insertError
        );
      }
    }
  }

  async function reload() {
    setLoading(true);

    await generateRecurringTransactions();

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("transaction_date", { ascending: false });

    if (error) {
      console.log("ERRO SUPABASE:", error);
      setTransactions([]);
    } else {
      setTransactions((data ?? []) as Transaction[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  return { transactions, loading, reload };
}