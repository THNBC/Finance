"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type {
  CreditCardInstallment,
  CreditCardRow,
  Transaction,
  TransactionItem,
} from "@/lib/transacoes/types";
import { buildPaidInvoiceItems } from "@/lib/transacoes/utils";

export function useTransacoesData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [itemsByTransaction, setItemsByTransaction] = useState<
    Record<string, TransactionItem[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: transactionData, error: transactionError } = await supabase
      .from("transactions")
      .select(
        `
        id,
        transaction_date,
        description,
        amount,
        type,
        source,
        card_id,
        created_at,
        credit_cards (
          name
        )
      `
      )
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (transactionError) {
      console.error(transactionError);
      setLoading(false);
      return;
    }

    const rawTransactions = (transactionData ?? []) as Array<
      Omit<Transaction, "credit_cards"> & {
        credit_cards?: { name: string } | { name: string }[] | null;
      }
    >;

    const parsedTransactions: Transaction[] = rawTransactions.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
      credit_cards: Array.isArray(transaction.credit_cards)
        ? transaction.credit_cards
        : transaction.credit_cards
          ? [transaction.credit_cards]
          : [],
    }));

    const [
      { data: cardsData, error: cardsError },
      { data: installmentsData, error: installmentsError },
    ] = await Promise.all([
      supabase.from("credit_cards").select("id, name, active"),
      supabase
        .from("credit_card_installments")
        .select(
          "id, purchase_id, card_id, description, installment_number, installment_total, due_month, due_year, due_date, amount, paid, payment_date"
        )
        .eq("paid", true)
        .order("due_date", { ascending: true }),
    ]);

    if (cardsError) {
      console.error(cardsError);
    }

    if (installmentsError) {
      console.error(installmentsError);
    }

    const creditCards = (cardsData ?? []) as CreditCardRow[];
    const paidInstallments = (installmentsData ?? []) as CreditCardInstallment[];

    const transactionIds = parsedTransactions.map((item) => item.id);

    if (transactionIds.length === 0) {
      setTransactions(parsedTransactions);
      setItemsByTransaction({});
      setLoading(false);
      return;
    }

    const { data: cardItemsData, error: cardItemsError } = await supabase
      .from("credit_card_items")
      .select("*")
      .in("transaction_id", transactionIds)
      .order("item_date", { ascending: true });

    if (cardItemsError) {
      console.error(cardItemsError);
    }

    const rawCardItems = (cardItemsData ?? []) as Array<
      Partial<TransactionItem> & { title?: string | null }
    >;

    const cardItems: TransactionItem[] = rawCardItems.map((item) => ({
      id: String(item.id),
      transaction_id: String(item.transaction_id),
      item_date: item.item_date ?? null,
      description: item.description ?? item.title ?? "-",
      amount: Number(item.amount ?? 0),
      installment: item.installment ?? null,
      created_at: String(item.created_at),
      item_type: "credit_card",
    }));

    const { data: incomeItemsData, error: incomeItemsError } = await supabase
      .from("transaction_items")
      .select("*")
      .in("transaction_id", transactionIds)
      .order("item_date", { ascending: true });

    if (incomeItemsError) {
      console.error(incomeItemsError);
    }

    const rawIncomeItems = (incomeItemsData ?? []) as Array<
      Partial<TransactionItem> & { title?: string | null }
    >;

    const incomeItems: TransactionItem[] = rawIncomeItems.map((item) => ({
      id: String(item.id),
      transaction_id: String(item.transaction_id),
      item_date: item.item_date ?? null,
      description: item.title ?? item.description ?? "-",
      amount: Number(item.amount ?? 0),
      installment: null,
      created_at: String(item.created_at),
      item_type: "income",
    }));

    const paidInvoiceItems = parsedTransactions.flatMap((transaction) =>
      buildPaidInvoiceItems(transaction, creditCards, paidInstallments)
    );

    const allItems = [...cardItems, ...incomeItems, ...paidInvoiceItems];

    const groupedItems = allItems.reduce(
      (acc: Record<string, TransactionItem[]>, item) => {
        if (!acc[item.transaction_id]) {
          acc[item.transaction_id] = [];
        }

        acc[item.transaction_id].push(item);

        return acc;
      },
      {}
    );

    setTransactions(parsedTransactions);
    setItemsByTransaction(groupedItems);
    setLoading(false);
  }

  return {
    loading,
    transactions,
    setTransactions,
    itemsByTransaction,
    setItemsByTransaction,
    loadData,
  };
}
