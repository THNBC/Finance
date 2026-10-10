"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { calculateCartoesData } from "@/lib/cartoes/calculations";
import type {
  Account,
  CreditCardInstallment,
  CreditCardPurchase,
  CreditCardRow,
  Investment,
  InvestmentTransaction,
  Transaction,
} from "@/lib/cartoes/types";
import { supabase } from "@/lib/supabase";

export function useCartoesData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCardRow[]>([]);
  const [purchases, setPurchases] = useState<CreditCardPurchase[]>([]);
  const [installments, setInstallments] = useState<CreditCardInstallment[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentTransactions, setInvestmentTransactions] = useState<
    InvestmentTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [
      transactionsRes,
      accountsRes,
      cardsRes,
      purchasesRes,
      installmentsRes,
      investmentsRes,
      investmentTransactionsRes,
    ] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, transaction_date, description, amount, type, source, paid")
        .order("transaction_date", { ascending: false }),

      supabase
        .from("accounts")
        .select("id, name, balance, active"),

      supabase
        .from("credit_cards")
        .select("id, name, limit_total, active")
        .order("name", { ascending: true }),

      supabase
        .from("credit_card_purchases")
        .select(
          "id, card_id, description, purchase_date, total_amount, installments"
        )
        .order("purchase_date", { ascending: false }),

      supabase
        .from("credit_card_installments")
        .select(
          "id, purchase_id, card_id, description, installment_number, installment_total, due_month, due_year, due_date, amount, paid, payment_date"
        )
        .order("due_date", { ascending: true }),

      supabase
        .from("investments")
        .select("*")
        .order("name"),

      supabase
        .from("investment_transactions")
        .select("id, investment_id, type, amount, transaction_date")
        .order("transaction_date", { ascending: true }),
    ]);

    if (
      transactionsRes.error ||
      accountsRes.error ||
      cardsRes.error ||
      purchasesRes.error ||
      installmentsRes.error ||
      investmentsRes.error ||
      investmentTransactionsRes.error
    ) {
      console.error(
        transactionsRes.error ||
          accountsRes.error ||
          cardsRes.error ||
          purchasesRes.error ||
          installmentsRes.error ||
          investmentsRes.error ||
          investmentTransactionsRes.error
      );

      setLoading(false);
      return;
    }

    setTransactions((transactionsRes.data ?? []) as Transaction[]);
    setAccounts((accountsRes.data ?? []) as Account[]);
    setCards((cardsRes.data ?? []) as CreditCardRow[]);
    setPurchases((purchasesRes.data ?? []) as CreditCardPurchase[]);
    setInstallments(
      (installmentsRes.data ?? []) as CreditCardInstallment[]
    );

    setInvestmentTransactions(
      (investmentTransactionsRes.data ?? []) as InvestmentTransaction[]
    );

    const rawInvestments = (investmentsRes.data ?? []) as Array<
      Investment & {
        amount?: number | null;
        profit?: number | null;
        description?: string | null;
      }
    >;

    setInvestments(
      rawInvestments.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        amount: Number(item.amount ?? 0),
        profit: Number(item.profit ?? 0),
      }))
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const data = useMemo(
    () =>
      calculateCartoesData({
        accounts,
        transactions,
        cards,
        purchases,
        installments,
        investments,
      }),
    [
      accounts,
      transactions,
      cards,
      purchases,
      installments,
      investments,
    ]
  );

  return {
    loading,
    transactions,
    accounts,
    cards,
    purchases,
    investments,
    investmentTransactions,
    data,
    loadData,
  };
}