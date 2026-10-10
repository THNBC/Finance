"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import { HOUSES } from "@/lib/bets/constants";
import type { BetAccount, BetTransaction, ChartRange, ChartRow } from "@/lib/bets/types";
import {
  getMonthKey,
  getMonthLabel,
  getPerformanceAmount,
  getResultAmount,
  getTransactionHouse,
  isCurrentMonth,
  isPreviousMonth,
  parseHouseName,
} from "@/lib/bets/utils";

export function useBetsData() {
  const [accounts, setAccounts] = useState<BetAccount[]>([]);
  const [transactions, setTransactions] = useState<BetTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [chartRange, setChartRange] = useState<ChartRange>(6);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [itemsPerPage, transactions]);

  async function loadData() {
    setLoading(true);

    const [accountsRes, transactionsRes] = await Promise.all([
      supabase.from("bet_accounts").select("*").order("name"),
      supabase
        .from("bet_transactions")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (accountsRes.error || transactionsRes.error) {
      alert(
        accountsRes.error?.message ||
          transactionsRes.error?.message ||
          "Erro ao carregar bets.",
      );
      setLoading(false);
      return;
    }

    setAccounts((accountsRes.data ?? []) as BetAccount[]);
    setTransactions((transactionsRes.data ?? []) as BetTransaction[]);
    setLoading(false);
  }

  const data = useMemo(() => {
    const visibleAccounts = HOUSES.map((house) => {
      const account = accounts.find((item) => parseHouseName(item.name) === house);

      return {
        id: account?.id ?? house,
        name: house,
        balance: Number(account?.balance ?? 0),
      };
    });

    const totalBalance = visibleAccounts.reduce(
      (sum, item) => sum + Number(item.balance ?? 0),
      0,
    );

    const currentMonthTransactions = transactions.filter((transaction) =>
      isCurrentMonth(new Date(transaction.created_at)),
    );

    const previousMonthTransactions = transactions.filter((transaction) =>
      isPreviousMonth(new Date(transaction.created_at)),
    );

    const totalDeposited = currentMonthTransactions
      .filter((item) => item.type === "deposit")
      .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

    const previousDeposited = previousMonthTransactions
      .filter((item) => item.type === "deposit")
      .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

    const totalWithdrawn = currentMonthTransactions
      .filter((item) => item.type === "withdraw")
      .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

    const previousWithdrawn = previousMonthTransactions
      .filter((item) => item.type === "withdraw")
      .reduce((sum, item) => sum + Math.abs(Number(item.amount ?? 0)), 0);

    const monthResult = currentMonthTransactions.reduce(
      (sum, item) => sum + getResultAmount(item),
      0,
    );

    const previousMonthResult = previousMonthTransactions.reduce(
      (sum, item) => sum + getResultAmount(item),
      0,
    );

    const chartMonths = Array.from({ length: chartRange }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (chartRange - 1 - index));
      date.setDate(1);

      return {
        key: getMonthKey(date),
        label: getMonthLabel(date),
      };
    });

    const performanceData: ChartRow[] = chartMonths.map((month) => {
      const row: ChartRow = {
        month: month.label,
        Bet365: 0,
        Betano: 0,
        Superbet: 0,
      };

      const monthTransactions = transactions.filter((transaction) => {
        const date = new Date(transaction.created_at);
        return getMonthKey(date) === month.key;
      });

      for (const transaction of monthTransactions) {
        const house = getTransactionHouse(transaction);
        if (!house) continue;

        row[house] += getPerformanceAmount(transaction);
      }

      return row;
    });

    const recentTransactions = [...transactions]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .map((transaction) => {
        const house = getTransactionHouse(transaction);

        return {
          ...transaction,
          house,
          displayAmount: getResultAmount(transaction),
        };
      });

    const totalPages = Math.max(1, Math.ceil(recentTransactions.length / itemsPerPage));
    const safePage = Math.min(page, totalPages);

    const paginatedTransactions = recentTransactions.slice(
      (safePage - 1) * itemsPerPage,
      safePage * itemsPerPage,
    );

    return {
      visibleAccounts,
      totalBalance,
      totalDeposited,
      previousDeposited,
      totalWithdrawn,
      previousWithdrawn,
      monthResult,
      previousMonthResult,
      performanceData,
      recentTransactions,
      paginatedTransactions,
      totalPages,
      safePage,
    };
  }, [accounts, transactions, chartRange, page, itemsPerPage]);

  return {
    accounts,
    transactions,
    loading,
    chartRange,
    setChartRange,
    page,
    setPage,
    itemsPerPage,
    setItemsPerPage,
    data,
    loadData,
  };
}
