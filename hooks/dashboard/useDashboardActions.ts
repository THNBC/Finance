
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

  const [transactionType, setTransactionType] = useState<
    "income" | "expense"
  >("expense");

  const [transactionIsSalary, setTransactionIsSalary] = useState(false);
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  function handleTransactionTypeChange(value: "income" | "expense") {
    setTransactionType(value);

    if (value === "expense") {
      setTransactionIsSalary(false);
    }
  }

  async function saveManualTransaction() {
    const amount = parseBRLInput(transactionAmount);

    if (
      !(transactionType === "income" && transactionIsSalary) &&
      !transactionDescription.trim()
    ) {
      alert("Informe a descrição da transação.");
      return;
    }

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      alert("Informe um valor válido.");
      return;
    }

    setSavingTransaction(true);

    try {
      const signedAmount =
        transactionType === "income"
          ? Math.abs(amount)
          : -Math.abs(amount);

      const { error } = await supabase.from("transactions").insert({
        transaction_date: transactionDate,
        description:
          transactionType === "income" && transactionIsSalary
            ? "Salário"
            : transactionDescription.trim(),
        amount: signedAmount,
        type: transactionType,
        source: "caixa",
        paid: true,
        is_salary:
          transactionType === "income" && transactionIsSalary,
      });

      if (error) {
        console.error("Erro ao salvar transação:", error);
        alert(error.message);
        return;
      }

      setShowTransactionModal(false);
      setTransactionType("expense");
      setTransactionIsSalary(false);
      setTransactionDescription("");
      setTransactionAmount("");
      setTransactionDate(new Date().toISOString().split("T")[0]);

      await reload();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      alert("Não foi possível salvar a transação.");
    } finally {
      setSavingTransaction(false);
    }
  }

  return {
    showTransactionModal,
    setShowTransactionModal,
    savingTransaction,
    transactionType,
    setTransactionType,
    handleTransactionTypeChange,
    transactionIsSalary,
    setTransactionIsSalary,
    transactionDescription,
    setTransactionDescription,
    transactionAmount,
    setTransactionAmount,
    transactionDate,
    setTransactionDate,
    saveManualTransaction,
  };
}
