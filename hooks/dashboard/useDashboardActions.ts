"use client";

import { useState } from "react";

import { parseBRLInput } from "@/lib/dashboard/utils";
import { supabase } from "@/lib/supabase";

type Props = {
  reload: () => Promise<void>;
};

export function useDashboardActions({ reload }: Props) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense",
  );
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0],
  );

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
    setTransactionAmount("");
    setTransactionDate(new Date().toISOString().split("T")[0]);

    await reload();
  }

  return {
    showTransactionModal,
    setShowTransactionModal,
    savingTransaction,
    transactionType,
    setTransactionType,
    transactionDescription,
    setTransactionDescription,
    transactionAmount,
    setTransactionAmount,
    transactionDate,
    setTransactionDate,
    saveManualTransaction,
  };
}
