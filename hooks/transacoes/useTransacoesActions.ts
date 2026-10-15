"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Transaction, TransactionItem } from "@/lib/transacoes/types";
import { parseBRLInput } from "@/lib/transacoes/utils";

type Props = {
  reload: () => Promise<void>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setItemsByTransaction: React.Dispatch<
    React.SetStateAction<Record<string, TransactionItem[]>>
  >;
  setExpandedRow: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

export function useTransacoesActions({
  reload,
  setTransactions,
  setItemsByTransaction,
  setExpandedRow,
  setCurrentPage,
}: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [clearHistoryLoading, setClearHistoryLoading] = useState(false);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense"
  );
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionIsSalary, setTransactionIsSalary] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  async function deleteTransaction() {
    if (!deleteTarget) return;

    const { error: cardItemsError } = await supabase
      .from("credit_card_items")
      .delete()
      .eq("transaction_id", deleteTarget.id);

    if (cardItemsError) {
      console.error(cardItemsError);
    }

    const { error: incomeItemsError } = await supabase
      .from("transaction_items")
      .delete()
      .eq("transaction_id", deleteTarget.id);

    if (incomeItemsError) {
      console.error(incomeItemsError);
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      alert("Erro ao excluir transação.");
      console.error(error);
      return;
    }

    setDeleteTarget(null);
    setExpandedRow(null);
    await reload();
  }

  async function saveManualTransaction() {
    const amount = parseBRLInput(transactionAmount);

    if (!transactionDescription.trim()) {
      alert("Informe a descrição da transação.");
      return;
    }

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      alert("Informe um valor válido.");
      return;
    }

    setSavingTransaction(true);

    const signedAmount =
      transactionType === "income" ? Math.abs(amount) : -Math.abs(amount);

    const { error } = await supabase.from("transactions").insert({
      transaction_date: transactionDate,
      description: transactionDescription.trim(),
      amount: signedAmount,
      type: transactionType,
      source: "caixa",
      paid: true,
      is_salary: transactionType === "income" && transactionIsSalary,
    });

    setSavingTransaction(false);

    if (error) {
      console.error("Erro ao salvar transação:", error);
      alert(error.message);
      return;
    }

    setShowTransactionModal(false);
    setTransactionType("expense");
    setTransactionDescription("");
    setTransactionIsSalary(false);
    setTransactionAmount("");
    setTransactionDate(new Date().toISOString().split("T")[0]);

    await reload();
  }

  async function clearHistory() {
    try {
      setClearHistoryLoading(true);

      const { error: cardItemsError } = await supabase
        .from("credit_card_items")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (cardItemsError) {
        console.error(cardItemsError);
        alert("Erro ao limpar os itens das faturas.");
        return;
      }

      const { error: transactionItemsError } = await supabase
        .from("transaction_items")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (transactionItemsError) {
        console.error(transactionItemsError);
        alert("Erro ao limpar os detalhes das transações.");
        return;
      }

      const { error: transactionsError } = await supabase
        .from("transactions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (transactionsError) {
        console.error(transactionsError);
        alert("Erro ao limpar o histórico de transações.");
        return;
      }

      setTransactions([]);
      setItemsByTransaction({});
      setExpandedRow(null);
      setDeleteTarget(null);
      setClearHistoryOpen(false);
      setCurrentPage(1);

      await reload();
    } finally {
      setClearHistoryLoading(false);
    }
  }

  return {
    deleteTarget,
    setDeleteTarget,
    deleteTransaction,

    clearHistoryOpen,
    setClearHistoryOpen,
    clearHistoryLoading,
    clearHistory,

    showTransactionModal,
    setShowTransactionModal,
    savingTransaction,
    transactionType,
    setTransactionType,
    transactionDescription,
    setTransactionDescription,
    transactionIsSalary,
    setTransactionIsSalary,
    transactionAmount,
    setTransactionAmount,
    transactionDate,
    setTransactionDate,
    saveManualTransaction,
  };
}
