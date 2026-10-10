"use client";

import { useState } from "react";

import type {
  Account,
  CartoesData,
  CreditCardPurchase,
  CreditCardRow,
  Investment,
  InvestmentTransaction,
  InvoiceRow,
  SelectedInvoice,
} from "@/lib/cartoes/types";

import {
  addMonths,
  getFirstInvoiceDateFromPurchaseDate,
  parseBRLInput,
} from "@/lib/cartoes/utils";

import { supabase } from "@/lib/supabase";

export function useCartoesActions({
  accounts,
  cards,
  purchases,
  investments,
  data,
  reload,
}: {
  accounts: Account[];
  cards: CreditCardRow[];
  purchases: CreditCardPurchase[];
  investments: Investment[];
  data: CartoesData;
  reload: () => Promise<void>;
}) {
  const [savingInvestment, setSavingInvestment] = useState(false);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [savingBalance, setSavingBalance] = useState(false);
  const [balanceValue, setBalanceValue] = useState("");

  const [investmentId, setInvestmentId] = useState<string>("cdi");

  const [investmentType, setInvestmentType] =
    useState<InvestmentTransaction["type"]>("aporte");

  const [investmentAmount, setInvestmentAmount] = useState("");

  const [investmentDate, setInvestmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ----------------------------------------------------
  // COMPRA NO CARTÃO
  // ----------------------------------------------------

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);

  const [editingPurchaseId, setEditingPurchaseId] =
    useState<string | null>(null);

  const [deletingPurchaseId, setDeletingPurchaseId] =
    useState<string | null>(null);

  const [purchaseCardId, setPurchaseCardId] = useState("");
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [purchaseInstallments, setPurchaseInstallments] = useState("1");

  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ----------------------------------------------------
  // FATURA
  // ----------------------------------------------------

  const [payingInvoiceId, setPayingInvoiceId] =
    useState<string | null>(null);

  const [selectedInvoice, setSelectedInvoice] =
    useState<SelectedInvoice | null>(null);

  const [invoiceToPay, setInvoiceToPay] =
    useState<SelectedInvoice | null>(null);

  // ----------------------------------------------------
  // TRANSAÇÃO MANUAL
  // ----------------------------------------------------

  const [showTransactionModal, setShowTransactionModal] =
    useState(false);

  const [savingTransaction, setSavingTransaction] =
    useState(false);

  const [transactionType, setTransactionType] =
    useState<"income" | "expense">("expense");

  const [transactionDescription, setTransactionDescription] =
    useState("");

  const [transactionAmount, setTransactionAmount] =
    useState("");

  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ----------------------------------------------------
  // HELPERS DE COMPRA
  // ----------------------------------------------------

  function resetPurchaseForm() {
    setEditingPurchaseId(null);
    setPurchaseCardId("");
    setPurchaseDescription("");
    setPurchaseAmount("");
    setPurchaseInstallments("1");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
  }

  function openPurchaseModal() {
    setEditingPurchaseId(null);
    setPurchaseCardId(cards[0]?.id ?? "");
    setPurchaseDescription("");
    setPurchaseAmount("");
    setPurchaseInstallments("1");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setShowPurchaseModal(true);
  }

  function openEditPurchase(purchaseId: string) {
    const purchase = purchases.find(
      (item) => item.id === purchaseId
    );

    if (!purchase) {
      alert("Compra não encontrada.");
      return;
    }

    setEditingPurchaseId(purchase.id);
    setPurchaseCardId(purchase.card_id);
    setPurchaseDescription(purchase.description ?? "");

    setPurchaseAmount(
      Number(purchase.total_amount ?? 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );

    setPurchaseInstallments(
      String(purchase.installments ?? 1)
    );

    setPurchaseDate(purchase.purchase_date);

    // Fecha os detalhes da fatura
    setSelectedInvoice(null);

    // Abre o mesmo modal usado para nova compra
    setShowPurchaseModal(true);
  }

  async function purchaseHasPaidInstallments(
    purchaseId: string
  ) {
    const { data: installmentRows, error } = await supabase
      .from("credit_card_installments")
      .select("id, paid")
      .eq("purchase_id", purchaseId);

    if (error) {
      throw error;
    }

    return (installmentRows ?? []).some(
      (item) => item.paid === true
    );
  }

  function buildInstallmentRows({
    purchaseId,
    cardId,
    description,
    totalAmount,
    installmentsCount,
    purchaseDate,
  }: {
    purchaseId: string;
    cardId: string;
    description: string;
    totalAmount: number;
    installmentsCount: number;
    purchaseDate: string;
  }) {
    const firstInvoiceDate =
      getFirstInvoiceDateFromPurchaseDate(purchaseDate);

    const installmentAmount = Number(
      (totalAmount / installmentsCount).toFixed(2)
    );

    return Array.from({
      length: installmentsCount,
    }).map((_, index) => {
      const invoiceDate = addMonths(
        firstInvoiceDate,
        index
      );

      const amount =
        index === installmentsCount - 1
          ? Number(
              (
                totalAmount -
                installmentAmount *
                  (installmentsCount - 1)
              ).toFixed(2)
            )
          : installmentAmount;

      return {
        purchase_id: purchaseId,
        card_id: cardId,
        description,
        installment_number: index + 1,
        installment_total: installmentsCount,
        due_month: invoiceDate.getMonth() + 1,
        due_year: invoiceDate.getFullYear(),
        due_date: `${invoiceDate.getFullYear()}-${String(
          invoiceDate.getMonth() + 1
        ).padStart(2, "0")}-15`,
        amount,
        paid: false,
        payment_date: null,
      };
    });
  }

  // ----------------------------------------------------
  // SALDO DA CAIXA
  // ----------------------------------------------------

  function openBalanceModal() {
    setBalanceValue(
      data.caixaBalance.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );

    setShowBalanceModal(true);
  }

  async function saveBalance() {
    const desiredCurrentBalance =
      parseBRLInput(balanceValue);

    if (Number.isNaN(desiredCurrentBalance)) {
      alert("Informe um saldo válido.");
      return;
    }

    const account = accounts.find(
      (item) => item.active !== false
    );

    if (!account) {
      alert("Conta Caixa não encontrada.");
      return;
    }

    const newInitialBalance =
      desiredCurrentBalance -
      data.transactionsBalance;

    setSavingBalance(true);

    const { error } = await supabase
      .from("accounts")
      .update({
        balance: newInitialBalance,
      })
      .eq("id", account.id)
      .select("id, name, balance")
      .single();

    setSavingBalance(false);

    if (error) {
      console.error(
        "ERRO AO ATUALIZAR SALDO:",
        error
      );

      alert(error.message);
      return;
    }

    setShowBalanceModal(false);

    await reload();
  }

  // ----------------------------------------------------
  // INVESTIMENTOS
  // ----------------------------------------------------

  async function saveInvestmentTransaction() {
    const amount =
      parseBRLInput(investmentAmount);

    if (!amount || amount <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    setSavingInvestment(true);

    if (investmentId === "caixa") {
      const { error } = await supabase
        .from("transactions")
        .insert({
          transaction_date: investmentDate,
          description: "Rendimento Caixa",
          amount,
          type: "income",
          source: "caixa",
          paid: true,
        });

      if (error) {
        console.error(
          "Erro insert transactions Caixa:",
          error
        );

        alert(error.message);
        setSavingInvestment(false);
        return;
      }
    } else {
      const currentInvestment = investments.find(
        (item) => item.id === investmentId
      );

      if (!currentInvestment) {
        alert("Investimento não encontrado.");
        setSavingInvestment(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("investment_transactions")
        .insert({
          investment_id: investmentId,
          type: investmentType,
          amount,
          transaction_date: investmentDate,
        });

      if (insertError) {
        console.error(
          "Erro insert investment_transactions:",
          insertError
        );

        alert(insertError.message);
        setSavingInvestment(false);
        return;
      }

      const nextAmount =
        investmentType === "aporte"
          ? currentInvestment.amount + amount
          : investmentType === "saque"
            ? currentInvestment.amount - amount
            : currentInvestment.amount;

      const nextProfit =
        investmentType === "rendimento"
          ? currentInvestment.profit + amount
          : currentInvestment.profit;

      const { error: updateError } = await supabase
        .from("investments")
        .update({
          amount: nextAmount,
          profit: nextProfit,
        })
        .eq("id", investmentId);

      if (updateError) {
        console.error(
          "Erro update investments:",
          updateError
        );

        alert(updateError.message);
        setSavingInvestment(false);
        return;
      }
    }

    setShowInvestmentModal(false);
    setInvestmentAmount("");
    setInvestmentType("aporte");
    setInvestmentId("cdi");

    setInvestmentDate(
      new Date().toISOString().split("T")[0]
    );

    await reload();

    setSavingInvestment(false);
  }

  // ----------------------------------------------------
  // TRANSAÇÃO MANUAL
  // ----------------------------------------------------

  async function saveManualTransaction() {
    const amount =
      parseBRLInput(transactionAmount);

    if (!transactionDescription.trim()) {
      alert("Informe a descrição da transação.");
      return;
    }

    if (
      !amount ||
      amount <= 0 ||
      Number.isNaN(amount)
    ) {
      alert("Informe um valor válido.");
      return;
    }

    setSavingTransaction(true);

    const signedAmount =
      transactionType === "income"
        ? Math.abs(amount)
        : -Math.abs(amount);

    const { error } = await supabase
      .from("transactions")
      .insert({
        transaction_date: transactionDate,
        description:
          transactionDescription.trim(),
        amount: signedAmount,
        type: transactionType,
        source: "caixa",
        paid: true,
      });

    setSavingTransaction(false);

    if (error) {
      console.error(
        "Erro ao salvar transação:",
        error
      );

      alert(error.message);
      return;
    }

    setShowTransactionModal(false);
    setTransactionType("expense");
    setTransactionDescription("");
    setTransactionAmount("");

    setTransactionDate(
      new Date().toISOString().split("T")[0]
    );

    await reload();
  }

  // ----------------------------------------------------
  // SALVAR / EDITAR COMPRA
  // ----------------------------------------------------

  async function savePurchase() {
    const card = cards.find(
      (item) => item.id === purchaseCardId
    );

    const totalAmount =
      parseBRLInput(purchaseAmount);

    const installmentsCount =
      Number(purchaseInstallments);

    if (!card) {
      alert("Selecione um cartão.");
      return;
    }

    if (!purchaseDescription.trim()) {
      alert("Informe a descrição da compra.");
      return;
    }

    if (
      !totalAmount ||
      totalAmount <= 0 ||
      Number.isNaN(totalAmount)
    ) {
      alert("Informe um valor válido.");
      return;
    }

    if (
      !installmentsCount ||
      installmentsCount <= 0
    ) {
      alert(
        "Informe uma quantidade de parcelas válida."
      );

      return;
    }

    setSavingPurchase(true);

    try {
      // ------------------------------------------------
      // EDIÇÃO
      // ------------------------------------------------

      if (editingPurchaseId) {
        const hasPaid =
          await purchaseHasPaidInstallments(
            editingPurchaseId
          );

        if (hasPaid) {
          alert(
            "Não é possível editar esta compra porque ela possui parcelas já pagas."
          );

          setSavingPurchase(false);
          return;
        }

        const { error: purchaseUpdateError } =
          await supabase
            .from("credit_card_purchases")
            .update({
              card_id: card.id,
              description:
                purchaseDescription.trim(),
              purchase_date: purchaseDate,
              total_amount: totalAmount,
              installments:
                installmentsCount,
            })
            .eq("id", editingPurchaseId);

        if (purchaseUpdateError) {
          throw purchaseUpdateError;
        }

        const { error: deleteInstallmentsError } =
          await supabase
            .from("credit_card_installments")
            .delete()
            .eq(
              "purchase_id",
              editingPurchaseId
            );

        if (deleteInstallmentsError) {
          throw deleteInstallmentsError;
        }

        const rows = buildInstallmentRows({
          purchaseId: editingPurchaseId,
          cardId: card.id,
          description:
            purchaseDescription.trim(),
          totalAmount,
          installmentsCount,
          purchaseDate,
        });

        const { error: insertInstallmentsError } =
          await supabase
            .from("credit_card_installments")
            .insert(rows);

        if (insertInstallmentsError) {
          throw insertInstallmentsError;
        }

        setShowPurchaseModal(false);
        resetPurchaseForm();

        await reload();

        return;
      }

      // ------------------------------------------------
      // NOVA COMPRA
      // ------------------------------------------------

      const {
        data: createdPurchase,
        error: purchaseError,
      } = await supabase
        .from("credit_card_purchases")
        .insert({
          card_id: card.id,
          description:
            purchaseDescription.trim(),
          purchase_date: purchaseDate,
          total_amount: totalAmount,
          installments:
            installmentsCount,
        })
        .select("id")
        .single();

      if (purchaseError) {
        throw purchaseError;
      }

      const rows = buildInstallmentRows({
        purchaseId: createdPurchase.id,
        cardId: card.id,
        description:
          purchaseDescription.trim(),
        totalAmount,
        installmentsCount,
        purchaseDate,
      });

      const {
        error: installmentsError,
      } = await supabase
        .from("credit_card_installments")
        .insert(rows);

      if (installmentsError) {
        throw installmentsError;
      }

      setShowPurchaseModal(false);
      resetPurchaseForm();

      await reload();
    } catch (error) {
      console.error(
        editingPurchaseId
          ? "Erro ao editar compra:"
          : "Erro ao salvar compra:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : editingPurchaseId
            ? "Erro ao editar compra."
            : "Erro ao salvar compra."
      );
    } finally {
      setSavingPurchase(false);
    }
  }

  // ----------------------------------------------------
  // EXCLUIR COMPRA
  // ----------------------------------------------------

  async function deletePurchase(
    purchaseId: string
  ) {
    const purchase = purchases.find(
      (item) => item.id === purchaseId
    );

    if (!purchase) {
      alert("Compra não encontrada.");
      return;
    }

    const confirmed = confirm(
      `Deseja excluir a compra "${purchase.description}"?\n\nTodas as parcelas desta compra serão excluídas.`
    );

    if (!confirmed) return;

    setDeletingPurchaseId(purchaseId);

    try {
      const hasPaid =
        await purchaseHasPaidInstallments(
          purchaseId
        );

      if (hasPaid) {
        alert(
          "Não é possível excluir esta compra porque ela possui parcelas já pagas."
        );

        return;
      }

      // Primeiro remove todas as parcelas.
      const {
        error: installmentsDeleteError,
      } = await supabase
        .from("credit_card_installments")
        .delete()
        .eq("purchase_id", purchaseId);

      if (installmentsDeleteError) {
        throw installmentsDeleteError;
      }

      // Depois remove a compra original.
      const {
        error: purchaseDeleteError,
      } = await supabase
        .from("credit_card_purchases")
        .delete()
        .eq("id", purchaseId);

      if (purchaseDeleteError) {
        throw purchaseDeleteError;
      }

      setSelectedInvoice(null);

      if (
        editingPurchaseId === purchaseId
      ) {
        setShowPurchaseModal(false);
        resetPurchaseForm();
      }

      await reload();
    } catch (error) {
      console.error(
        "Erro ao excluir compra:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao excluir compra."
      );
    } finally {
      setDeletingPurchaseId(null);
    }
  }

  // ----------------------------------------------------
  // PAGAR FATURA
  // ----------------------------------------------------

  async function payInvoice(
    invoice: InvoiceRow,
    cardName: string
  ) {
    setPayingInvoiceId(invoice.id);

    const {
      error: transactionError,
    } = await supabase
      .from("transactions")
      .insert({
        transaction_date:
          new Date()
            .toISOString()
            .split("T")[0],

        description:
          `Pagamento Fatura ${cardName} ${invoice.label}`,

        amount:
          -Math.abs(invoice.total),

        type: "expense",
        source: "caixa",
        paid: true,
      });

    if (transactionError) {
      console.error(
        "Erro ao registrar pagamento:",
        transactionError
      );

      alert(transactionError.message);
      setPayingInvoiceId(null);

      return;
    }

    const installmentIds =
      invoice.items.map(
        (item) => item.id
      );

    const {
      error: updateError,
    } = await supabase
      .from("credit_card_installments")
      .update({
        paid: true,
        payment_date:
          new Date()
            .toISOString()
            .split("T")[0],
      })
      .in("id", installmentIds);

    if (updateError) {
      console.error(
        "Erro ao marcar parcelas como pagas:",
        updateError
      );

      alert(updateError.message);
      setPayingInvoiceId(null);

      return;
    }

    await reload();

    setPayingInvoiceId(null);
    setInvoiceToPay(null);
  }

  return {
    // investimentos
    savingInvestment,
    showInvestmentModal,
    setShowInvestmentModal,

    // saldo
    showBalanceModal,
    setShowBalanceModal,
    savingBalance,
    balanceValue,
    setBalanceValue,

    // investimento
    investmentId,
    setInvestmentId,
    investmentType,
    setInvestmentType,
    investmentAmount,
    setInvestmentAmount,
    investmentDate,
    setInvestmentDate,

    // compra
    showPurchaseModal,
    setShowPurchaseModal,
    savingPurchase,

    editingPurchaseId,
    deletingPurchaseId,

    purchaseCardId,
    setPurchaseCardId,

    purchaseDescription,
    setPurchaseDescription,

    purchaseAmount,
    setPurchaseAmount,

    purchaseInstallments,
    setPurchaseInstallments,

    purchaseDate,
    setPurchaseDate,

    // fatura
    payingInvoiceId,

    selectedInvoice,
    setSelectedInvoice,

    invoiceToPay,
    setInvoiceToPay,

    // transação
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

    // ações
    openBalanceModal,
    openPurchaseModal,
    openEditPurchase,

    saveBalance,
    saveInvestmentTransaction,
    saveManualTransaction,

    savePurchase,
    deletePurchase,

    payInvoice,
  };
}