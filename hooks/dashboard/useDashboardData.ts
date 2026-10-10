"use client";

import { useEffect, useMemo, useState } from "react";

import { buildDashboardData } from "@/lib/dashboard/calculations";
import type { Account, DashboardPeriod, Transaction } from "@/lib/dashboard/types";
import { supabase } from "@/lib/supabase";

export function useDashboardData(period: DashboardPeriod) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);

    const [transactionsResponse, accountsResponse] = await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, transaction_date, description, amount, type, source, created_at",
        )
        .order("transaction_date", { ascending: true }),

      supabase.from("accounts").select("*"),
    ]);

    if (transactionsResponse.error) {
      console.error(transactionsResponse.error);
    } else {
      setTransactions((transactionsResponse.data ?? []) as Transaction[]);
    }

    if (accountsResponse.error) {
      console.error(accountsResponse.error);
    } else {
      setAccounts((accountsResponse.data ?? []) as Account[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const dashboardData = useMemo(
    () => buildDashboardData(transactions, accounts, period),
    [transactions, accounts, period],
  );

  return {
    loading,
    transactions,
    accounts,
    dashboardData,
    loadDashboard,
  };
}
