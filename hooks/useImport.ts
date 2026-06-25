"use client";

import { useRef, useState } from "react";

import {
  ImportFile,
  ImportedTransaction,
  ImportResult,
  ImportStatus,
  ManualForm,
  ManualLine,
} from "@/lib/import/types";

import {
  getInvoiceDescription,
  getTodayBRDate,
  normalizeTransaction,
  parseBRL,
} from "@/lib/import/helpers";

export function useImport() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [rawText, setRawText] = useState("");
  const [source, setSource] = useState("unknown");
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [manualForm, setManualForm] = useState<ManualForm>({
    type: "expense",
  });

  const [manualLines, setManualLines] = useState<ManualLine[]>([
    createEmptyManualLine(),
  ]);

  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const totalAmount = transactions.reduce((sum, item) => sum + item.amount, 0);

  function createEmptyManualLine(): ManualLine {
    return {
      date: getTodayBRDate(),
      description: "",
      amount: "",
      installment: "1/1",
      source: "caixa",
    };
  }

  function handleFile(selectedFile: File | null) {
    if (!selectedFile) return;

    const isJson =
      selectedFile.type === "application/json" ||
      selectedFile.name.toLowerCase().endsWith(".json");

    if (!isJson) {
      alert("Selecione um arquivo JSON padronizado.");
      return;
    }

    setFile(selectedFile);
    setStatus("selected");
    setRawText("");
    setSource("json");
    setTransactions([]);
    setExpandedRow(null);
    setImportResult(null);
  }

  function removeFile() {
    setFile(null);
    setStatus("idle");
    setRawText("");
    setSource("unknown");
    setTransactions([]);
    setExpandedRow(null);
    setImportResult(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function readJson() {
    if (!file) return;

    try {
      setStatus("reading");

      const text = await file.text();
      const payload = JSON.parse(text) as ImportFile;

      if (!payload.transactions?.length) {
        throw new Error("Arquivo JSON sem transações.");
      }

      const parsedTransactions = payload.transactions.map(normalizeTransaction);

      setRawText(JSON.stringify(payload, null, 2));
      setSource("json");
      setTransactions(parsedTransactions);
      setExpandedRow(null);
      setStatus("ready");
    } catch (error) {
      console.error(error);
      alert("Erro ao ler JSON.");
      setStatus("error");
    }
  }

  async function confirmImport() {
    if (transactions.length === 0) return;

    try {
      const payload: ImportFile = {
        version: 1,
        currency: "BRL",
        transactions,
      };

      const jsonFile = new File(
        [JSON.stringify(payload, null, 2)],
        file?.name ?? "finance-import.json",
        { type: "application/json" }
      );

      const formData = new FormData();
      formData.append("file", jsonFile);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar importação");
      }

      const result = await response.json();

      setImportResult({
        savedCount: result.savedCount ?? 0,
        duplicateCount: result.duplicateCount ?? 0,
        itemCount: result.itemCount ?? 0,
        invoicePaymentIgnoredCount: result.invoicePaymentIgnoredCount ?? 0,
      });

      setTransactions([]);
      setFile(null);
      setRawText("");
      setSource("unknown");
      setStatus("idle");

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar importação.");
    }
  }

  function openManualModal(index?: number) {
    if (typeof index === "number") {
      const transaction = transactions[index];

      setEditingIndex(index);
      setManualForm({
        type: transaction.type === "income" ? "income" : "expense",
      });

      if (transaction.items?.length) {
        setManualLines(
          transaction.items.map((item) => ({
            date: item.date ?? transaction.date ?? getTodayBRDate(),
            description: item.description ?? "",
            amount: String(Math.abs(item.amount ?? 0)),
            installment: item.installment || "1/1",
            source: (transaction.source as any) || "caixa",
          }))
        );
      } else {
        setManualLines([
          {
            date: transaction.date ?? getTodayBRDate(),
            description: transaction.description ?? "",
            amount: String(Math.abs(transaction.amount ?? 0)),
            installment: "1/1",
            source: (transaction.source as any) || "caixa",
          },
        ]);
      }
    } else {
      setEditingIndex(null);
      setManualForm((current) => ({
        type: current.type,
      }));
      setManualLines([createEmptyManualLine()]);
    }

    setManualModalOpen(true);
  }

  function closeManualModal() {
    setManualModalOpen(false);
    setEditingIndex(null);
  }

  function updateManualLine(
    index: number,
    field: keyof ManualLine,
    value: string
  ) {
    setManualLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  function addManualLine() {
    setManualLines((current) => [...current, createEmptyManualLine()]);
  }

  function removeManualLine(indexToRemove: number) {
    setManualLines((current) => {
      if (current.length === 1) return current;
      return current.filter((_, index) => index !== indexToRemove);
    });
  }

  function saveManualTransaction() {
    const isIncome = manualForm.type === "income";

    const validLines = manualLines
      .map((line) => ({
        date: line.date,
        description: line.description.trim(),
        amount: parseBRL(line.amount),
        installment: line.installment || "1/1",
        source: line.source,
      }))
      .filter(
        (line) =>
          line.date && line.description && line.amount && line.amount > 0
      );

    if (validLines.length === 0) {
      alert("Preencha pelo menos uma linha com data, descrição e valor.");
      return;
    }

    if (validLines.length === 1) {
      const line = validLines[0];

      const signedAmount = isIncome
        ? Math.abs(line.amount)
        : -Math.abs(line.amount);

      const transaction = {
        date: line.date,
        description: line.description,
        amount: signedAmount,
        type: manualForm.type,
        source: line.source,
        group_type: null,
        items: [],
      } as ImportedTransaction;

      setTransactions((current) =>
        editingIndex !== null
          ? current.map((item, index) =>
              index === editingIndex ? transaction : item
            )
          : [...current, transaction]
      );

      closeManualModal();
      return;
    }

    const total = validLines.reduce(
      (sum, line) => sum + Math.abs(line.amount),
      0
    );

    const firstLine = validLines[0];

    const groupedTransaction = {
      date: firstLine.date,
      description: isIncome
        ? "Entradas agrupadas"
        : getInvoiceDescription(firstLine.source),
      amount: isIncome ? Math.abs(total) : -Math.abs(total),
      type: manualForm.type,
      source: firstLine.source,
      group_type: isIncome ? "income_group" : "credit_card_invoice",
      items: validLines.map((line) => ({
        date: line.date,
        description: line.description,
        amount: Math.abs(line.amount),
        installment: isIncome ? null : line.installment,
      })),
    } as ImportedTransaction;

    setTransactions((current) =>
      editingIndex !== null
        ? current.map((item, index) =>
            index === editingIndex ? groupedTransaction : item
          )
        : [...current, groupedTransaction]
    );

    if (editingIndex === null) {
      setExpandedRow(transactions.length);
    }

    closeManualModal();
  }

  function removeTransaction(indexToRemove: number) {
    setTransactions((current) =>
      current.filter((_, index) => index !== indexToRemove)
    );

    if (expandedRow === indexToRemove) {
      setExpandedRow(null);
    }
  }

  function toggleExpandedRow(index: number) {
    setExpandedRow((current) => (current === index ? null : index));
  }

  function clearImportResult() {
    setImportResult(null);
  }

  return {
    inputRef,

    file,
    status,
    rawText,
    source,
    transactions,
    expandedRow,

    manualModalOpen,
    editingIndex,
    manualForm,
    manualLines,

    importResult,
    totalAmount,

    setManualForm,
    handleFile,
    removeFile,
    readJson,
    confirmImport,

    openManualModal,
    closeManualModal,
    updateManualLine,
    addManualLine,
    removeManualLine,
    saveManualTransaction,
    removeTransaction,
    toggleExpandedRow,
    clearImportResult,
  };
}