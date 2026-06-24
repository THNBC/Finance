"use client";

import React, { useRef, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  FileText,
  FileUp,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { ImportedTransaction } from "@/types/transaction";

type ImportStatus = "idle" | "selected" | "reading" | "ready" | "error";

type ManualForm = {
  type: "income" | "expense";
};

type ManualLine = {
  date: string;
  description: string;
  amount: string;
  installment: string;
  source: "caixa" | "inter" | "mercadopago";
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseBRL(value: string) {
  return Number(value.replace(/\./g, "").replace(",", ".").trim());
}

function getSourceLabel(source: string) {
  if (source === "caixa") return "Caixa";
  if (source === "inter") return "Inter";
  if (source === "mercadopago") return "Mercado Pago";
  return "--";
}

function getInvoiceDescription(source: string) {
  if (source === "inter") return "Fatura Inter";
  if (source === "mercadopago") return "Fatura Mercado Pago";
  return "Fatura Cartão";
}

function getInstallmentClasses(installment: string) {
  const [current, total] = installment.split("/").map(Number);
  const progress = current / total;

  if (current === total) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (progress >= 0.75) {
    return "border-lime-400/20 bg-lime-400/10 text-lime-300";
  }

  if (progress >= 0.5) {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
  }

  if (progress >= 0.25) {
    return "border-orange-400/20 bg-orange-400/10 text-orange-300";
  }

  return "border-red-400/20 bg-red-400/10 text-red-300";
}

function cleanDescription(description: string) {
  return description.replace(/\s*-\s*"?\d+$/g, "").trim();
}

function getTodayBRDate() {
  return new Date().toISOString().split("T")[0];
}

export default function ImportarPage() {
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
    {
      date: getTodayBRDate(),
      description: "",
      amount: "",
      installment: "1/1",
      source: "caixa",
    },
  ]);

  const [importResult, setImportResult] = useState<{
    savedCount: number;
    duplicateCount: number;
    invoicePaymentIgnoredCount: number;
  } | null>(null);

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
          line.date &&
          line.description &&
          line.amount &&
          line.amount > 0
      );

    if (validLines.length === 0) {
      alert("Preencha pelo menos uma linha com data, descrição e valor.");
      return;
    }

    if (editingIndex !== null) {
      if (validLines.length === 1) {
        const line = validLines[0];
        const signedAmount = isIncome
          ? Math.abs(line.amount)
          : -Math.abs(line.amount);

        const editedTransaction = {
          date: line.date,
          description: line.description,
          amount: signedAmount,
          type: manualForm.type,
          source: line.source,
          items: isIncome
            ? []
            : [
              {
                date: line.date,
                description: line.description,
                amount: Math.abs(line.amount),
                installment: line.installment,
              },
            ],
        } as ImportedTransaction;

        setTransactions((current) =>
          current.map((transaction, index) =>
            index === editingIndex ? editedTransaction : transaction
          )
        );
      } else {
        const total = validLines.reduce(
          (sum, line) => sum + Math.abs(line.amount),
          0
        );

        const editedTransaction = {
          date: validLines[0].date,
          description: isIncome
            ? "Entradas agrupadas"
            : getInvoiceDescription(validLines[0].source),
          amount: isIncome ? Math.abs(total) : -Math.abs(total),
          type: manualForm.type,
          source: validLines[0].source,
          items: validLines.map((line) => ({
            date: line.date,
            description: line.description,
            amount: Math.abs(line.amount),
            installment: isIncome ? "" : line.installment,
          })),
        } as ImportedTransaction;

        setTransactions((current) =>
          current.map((transaction, index) =>
            index === editingIndex ? editedTransaction : transaction
          )
        );
      }

      closeManualModal();
      return;
    }

    if (validLines.length === 1) {
      const line = validLines[0];
      const signedAmount = isIncome
        ? Math.abs(line.amount)
        : -Math.abs(line.amount);

      const newTransaction = {
        date: line.date,
        description: line.description,
        amount: signedAmount,
        type: manualForm.type,
        source: line.source,
        items: isIncome
          ? []
          : [
            {
              date: line.date,
              description: line.description,
              amount: Math.abs(line.amount),
              installment: line.installment,
            },
          ],
      } as ImportedTransaction;

      setTransactions((current) => [...current, newTransaction]);
      closeManualModal();
      return;
    }

    const total = validLines.reduce(
      (sum, line) => sum + Math.abs(line.amount),
      0
    );

    const groupedTransaction = {
      date: validLines[0].date,
      description: isIncome
        ? "Entradas agrupadas"
        : getInvoiceDescription(validLines[0].source),
      amount: isIncome ? Math.abs(total) : -Math.abs(total),
      type: manualForm.type,
      source: validLines[0].source,
      items: validLines.map((line) => ({
        date: line.date,
        description: line.description,
        amount: Math.abs(line.amount),
        installment: isIncome ? "" : line.installment,
      })),
    } as ImportedTransaction;

    setTransactions((current) => [...current, groupedTransaction]);
    setExpandedRow(transactions.length);
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

  function handleFile(selectedFile: File | null) {
    if (!selectedFile) return;

    const isPdf = selectedFile.type === "application/pdf";
    const isCsv = selectedFile.name.toLowerCase().endsWith(".csv");

    if (!isPdf && !isCsv) {
      alert("Selecione um PDF ou CSV.");
      return;
    }

    setFile(selectedFile);
    setStatus("selected");
    setRawText("");
    setSource("unknown");
    setTransactions([]);
    setExpandedRow(null);
  }

  function removeFile() {
    setFile(null);
    setStatus("idle");
    setRawText("");
    setSource("unknown");
    setTransactions([]);
    setExpandedRow(null);

    if (inputRef.current) inputRef.current.value = "";
  }

  async function readPdf() {
    if (!file) return;

    try {
      setStatus("reading");

      const formData = new FormData();
      formData.append("file", file);

      const endpoint = file.name.toLowerCase().endsWith(".csv")
        ? "/api/import-caixa-csv"
        : "/api/import-pdf";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao importar PDF");
      }

      const result = await response.json();

      setRawText(result.text ?? "");
      setSource(result.source ?? "unknown");
      setTransactions(result.transactions ?? []);
      setExpandedRow(null);
      setStatus("ready");
    } catch (error) {
      console.error(error);
      alert("Erro ao ler PDF.");
      setStatus("error");
    }
  }

  async function confirmImport() {
    if (transactions.length === 0) return;

    try {
      const response = await fetch("/api/confirm-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar importação");
      }

      const result = await response.json();

      setImportResult({
        savedCount: result.savedCount ?? 0,
        duplicateCount: result.duplicateCount ?? 0,
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

  return (
    <main className="min-h-screen w-full text-white">
      <section className="w-full px-8 py-7">
        <header className="mb-7">
          <h2 className="text-3xl font-semibold tracking-tight">
            Importar PDF
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Envie um extrato ou fatura para revisar antes de salvar.
          </p>
        </header>

        <section className="grid grid-cols-[1fr_360px] gap-5">
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Upload do arquivo</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    O sistema vai ler o PDF e preparar uma revisão.
                  </p>
                </div>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.csv"
                className="hidden"
                onChange={(event) =>
                  handleFile(event.target.files?.[0] ?? null)
                }
              />

              {!file ? (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex h-[280px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-black/10 text-center transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-300">
                    <Upload size={30} />
                  </div>

                  <p className="text-base font-medium">
                    Clique para selecionar um PDF
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    Extrato ou fatura em PDF
                  </p>
                </button>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                        <FileText size={26} />
                      </div>

                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={removeFile}
                      className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:border-red-400/40 hover:text-red-300"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <button
                    onClick={readPdf}
                    disabled={status === "reading"}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "reading" ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Lendo PDF
                      </>
                    ) : (
                      <>
                        <FileUp size={18} />
                        Ler PDF
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#081018]/90">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <h3 className="text-lg font-medium">Prévia da importação</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    As transações aparecerão aqui antes de serem salvas.
                  </p>
                </div>

                <button
                  onClick={() => openManualModal()}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
                >
                  <Plus size={16} />
                  Adicionar manualmente
                </button>
              </div>

              <div className="overflow-hidden">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-white/[0.02] text-zinc-500">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Data</th>
                      <th className="px-5 py-3 text-left font-medium">
                        Descrição
                      </th>
                      <th className="px-5 py-3 text-left font-medium">Tipo</th>
                      <th className="px-5 py-3 text-left font-medium">
                        Origem
                      </th>
                      <th className="px-5 py-3 text-left font-medium">
                        Detalhes
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Valor
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Ações
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-14 text-center">
                          <p className="text-sm text-zinc-400">
                            Nenhuma transação carregada
                          </p>
                          <p className="mt-1 text-xs text-zinc-600">
                            Selecione um PDF ou adicione uma movimentação manual.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction, index) => {
                        const itemTotal =
                          transaction.items?.reduce(
                            (sum, item) => sum + item.amount,
                            0
                          ) ?? 0;

                        return (
                          <React.Fragment
                            key={`${transaction.date}-${cleanDescription(
                              transaction.description
                            )}-${index}`}
                          >
                            <tr className="border-t border-white/5">
                              <td className="px-5 py-3 text-zinc-400">
                                {transaction.date}
                              </td>

                              <td className="px-5 py-3 text-zinc-200">
                                {cleanDescription(transaction.description)}
                              </td>

                              <td className="px-5 py-3 text-zinc-400">
                                {transaction.type === "income"
                                  ? "Receita"
                                  : "Despesa"}
                              </td>

                              <td className="px-5 py-3 text-zinc-400">
                                {getSourceLabel(transaction.source ?? source)}
                              </td>

                              <td className="px-5 py-3">
                                {transaction.items?.length ? (
                                  <div>
                                    <p className="text-xs text-zinc-400">
                                      {transaction.source === "caixa" &&
                                        transaction.description.startsWith(
                                          "Rendimento Caixa"
                                        )
                                        ? `${transaction.items.length} rendimentos`
                                        : `${transaction.items.length} compras`}
                                    </p>

                                    <button
                                      onClick={() =>
                                        setExpandedRow(
                                          expandedRow === index ? null : index
                                        )
                                      }
                                      className="mt-1 text-xs text-cyan-300 transition hover:text-cyan-200"
                                    >
                                      {expandedRow === index
                                        ? "Ocultar detalhes"
                                        : "Ver detalhes"}
                                    </button>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>

                              <td
                                className={`px-5 py-3 text-right font-medium ${transaction.amount >= 0
                                  ? "text-emerald-300"
                                  : "text-red-300"
                                  }`}
                              >
                                {formatBRL(transaction.amount)}
                              </td>

                              <td className="px-5 py-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => openManualModal(index)}
                                    className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:text-cyan-300"
                                  >
                                    <Edit3 size={15} />
                                  </button>

                                  <button
                                    onClick={() => removeTransaction(index)}
                                    className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-red-400/40 hover:text-red-300"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {expandedRow === index &&
                              transaction.items?.length && (
                                <tr>
                                  <td
                                    colSpan={7}
                                    className="bg-black/20 px-5 py-4"
                                  >
                                    <div className="overflow-hidden rounded-2xl border border-white/10">
                                      <table className="w-full text-sm">
                                        <thead className="bg-white/[0.03]">
                                          <tr>
                                            <th className="px-4 py-3 text-left">
                                              Data
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                              Descrição
                                            </th>
                                            <th className="px-4 py-3 text-left">
                                              Parcela
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                              Valor
                                            </th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {transaction.items.map(
                                            (item, itemIndex) => (
                                              <tr
                                                key={`${item.date}-${item.description}-${itemIndex}`}
                                                className="border-t border-white/5"
                                              >
                                                <td className="px-4 py-3 text-zinc-400">
                                                  {item.date}
                                                </td>

                                                <td className="px-4 py-3 text-zinc-200">
                                                  {cleanDescription(
                                                    item.description
                                                  )}
                                                </td>

                                                <td className="px-4 py-3">
                                                  {item.installment ? (
                                                    <span
                                                      className={`rounded-full border px-2 py-1 text-xs ${getInstallmentClasses(
                                                        item.installment
                                                      )}`}
                                                    >
                                                      {item.installment}
                                                    </span>
                                                  ) : (
                                                    "-"
                                                  )}
                                                </td>

                                                <td className="px-4 py-3 text-right text-zinc-200">
                                                  {formatBRL(item.amount)}
                                                </td>
                                              </tr>
                                            )
                                          )}
                                        </tbody>

                                        <tfoot>
                                          <tr className="border-t border-white/10 bg-white/[0.02]">
                                            <td
                                              colSpan={3}
                                              className="px-4 py-3 text-right font-medium text-zinc-300"
                                            >
                                              Total
                                            </td>

                                            <td className="px-4 py-3 text-right font-semibold text-cyan-300">
                                              {formatBRL(itemTotal)}
                                            </td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {rawText && (
              <details className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
                <summary className="cursor-pointer text-sm text-zinc-400">
                  Ver texto extraído do PDF
                </summary>

                <pre className="mt-4 max-h-[280px] overflow-auto whitespace-pre-wrap rounded-2xl bg-black/30 p-4 text-xs text-zinc-500">
                  {rawText}
                </pre>
              </details>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
              <h3 className="text-lg font-medium">Status</h3>

              <div className="mt-5 space-y-4">
                <StatusItem
                  active={!!file}
                  done={!!file}
                  title="Arquivo selecionado"
                />

                <StatusItem
                  active={status === "reading" || status === "ready"}
                  done={status === "ready"}
                  title="Leitura do PDF"
                />

                <StatusItem
                  active={status === "ready"}
                  done={status === "ready"}
                  title="Revisão preparada"
                />

                <StatusItem
                  active={transactions.length > 0}
                  done={transactions.length > 0}
                  title="Aguardando confirmação"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
              <h3 className="text-lg font-medium">Resumo</h3>

              <div className="mt-5 space-y-3 text-sm">
                <SummaryLine label="Documento" value={file ? file.name : "--"} />
                <SummaryLine label="Tipo" value={getSourceLabel(source)} />
                <SummaryLine
                  label="Transações"
                  value={String(transactions.length)}
                />
                <SummaryLine
                  label="Valor total"
                  value={formatBRL(totalAmount)}
                />
                <SummaryLine label="Status" value={getStatusLabel(status)} />
              </div>

              <button
                onClick={confirmImport}
                disabled={transactions.length === 0}
                className="mt-5 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
              >
                Confirmar importação
              </button>
            </div>
          </aside>
        </section>
      </section>

      {manualModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onClick={closeManualModal}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#081018] shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
          >
            <div className="border-b border-white/10 bg-white/[0.02] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {editingIndex !== null
                      ? "Editar movimentação"
                      : "Adicionar movimentação manual"}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    Use uma linha para lançamento simples ou várias linhas para
                    criar uma movimentação agrupada.
                  </p>
                </div>

                <button
                  onClick={closeManualModal}
                  className="rounded-2xl border border-white/10 p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-5 overflow-auto px-6 py-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-400">
                  Tipo de movimentação
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setManualForm({
                        type: "expense",
                      })
                    }
                    className={`rounded-2xl border p-4 text-left transition ${manualForm.type === "expense"
                      ? "border-red-400/40 bg-red-400/10"
                      : "border-white/10 bg-black/20 hover:bg-white/5"
                      }`}
                  >
                    <p
                      className={`text-sm font-semibold ${manualForm.type === "expense"
                        ? "text-red-300"
                        : "text-zinc-200"
                        }`}
                    >
                      Saída / Despesa
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Compra, pagamento ou fatura.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setManualForm({
                        type: "income",
                      })
                    }
                    className={`rounded-2xl border p-4 text-left transition ${manualForm.type === "income"
                      ? "border-emerald-400/40 bg-emerald-400/10"
                      : "border-white/10 bg-black/20 hover:bg-white/5"
                      }`}
                  >
                    <p
                      className={`text-sm font-semibold ${manualForm.type === "income"
                        ? "text-emerald-300"
                        : "text-zinc-200"
                        }`}
                    >
                      Entrada / Receita
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Salário, Pix recebido, reembolso ou rendimento.
                    </p>
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-[150px_1fr_150px_160px_130px_48px] gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <span>Data</span>
                  <span>Descrição</span>
                  <span>Origem</span>
                  <span>Valor</span>
                  <span>Parcela</span>
                  <span />
                </div>

                <div className="max-h-[380px] overflow-auto">
                  {manualLines.map((line, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[150px_1fr_150px_160px_130px_48px] gap-3 border-b border-white/5 px-4 py-3 last:border-0"
                    >
                      <input
                        type="date"
                        value={line.date}
                        onChange={(event) =>
                          updateManualLine(index, "date", event.target.value)
                        }
                        className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                      />

                      <input
                        value={line.description}
                        onChange={(event) =>
                          updateManualLine(
                            index,
                            "description",
                            event.target.value
                          )
                        }
                        placeholder={
                          manualForm.type === "income"
                            ? "Ex: Pix recebido"
                            : "Ex: Mercado Livre"
                        }
                        className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-cyan-400/50"
                      />

                      <select
                        value={line.source}
                        onChange={(event) =>
                          updateManualLine(
                            index,
                            "source",
                            event.target.value as
                            | "caixa"
                            | "inter"
                            | "mercadopago"
                          )
                        }
                        style={{
                          backgroundColor: "#081018",
                          color: "#ffffff",
                        }}
                        className="
    h-10
    rounded-xl
    border border-white/10
    bg-[#081018]
    px-3
    text-sm
    text-white
    outline-none
    transition
    focus:border-cyan-400/50
  "
                      >
                        <option
                          value="caixa"
                          style={{ backgroundColor: "#081018", color: "#ffffff" }}
                        >
                          Caixa
                        </option>

                        <option
                          value="inter"
                          style={{ backgroundColor: "#081018", color: "#ffffff" }}
                        >
                          Inter
                        </option>

                        <option
                          value="mercadopago"
                          style={{ backgroundColor: "#081018", color: "#ffffff" }}
                        >
                          Mercado Pago
                        </option>
                      </select>

                      <input
                        value={line.amount}
                        onChange={(event) =>
                          updateManualLine(index, "amount", event.target.value)
                        }
                        placeholder="199,90"
                        className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-cyan-400/50"
                      />

                      <input
                        value={manualForm.type === "income" ? "" : line.installment}
                        onChange={(event) =>
                          updateManualLine(
                            index,
                            "installment",
                            event.target.value
                          )
                        }
                        disabled={manualForm.type === "income"}
                        placeholder="1/1"
                        className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-40"
                      />

                      <button
                        type="button"
                        onClick={() => removeManualLine(index)}
                        disabled={manualLines.length === 1}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={addManualLine}
                className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
              >
                <Plus size={16} />
                Adicionar linha
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-6 py-4">
              <p className="text-xs text-zinc-600">
                {manualLines.length > 1
                  ? manualForm.type === "income"
                    ? "Várias entradas serão salvas como uma movimentação agrupada."
                    : "Várias saídas serão salvas como uma fatura/movimentação agrupada."
                  : manualForm.type === "income"
                    ? "Entrada será salva como valor positivo na Caixa."
                    : "Saída será salva como valor negativo."}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={closeManualModal}
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
                >
                  Cancelar
                </button>

                <button
                  onClick={saveManualTransaction}
                  className="rounded-2xl bg-cyan-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
                >
                  {editingIndex !== null ? "Salvar alterações" : "Adicionar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {importResult && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setImportResult(null)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081018] p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={24} />
              </div>

              <div>
                <h3 className="text-lg font-semibold">
                  Importação concluída
                </h3>

                <p className="text-sm text-zinc-500">
                  O arquivo foi processado com sucesso.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-zinc-500">Transações salvas</span>
                <span className="font-semibold text-emerald-400">
                  {importResult.savedCount}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-zinc-500">Duplicadas ignoradas</span>
                <span className="font-semibold text-yellow-400">
                  {importResult.duplicateCount}
                </span>
              </div>

              {importResult.invoicePaymentIgnoredCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Pagamentos ignorados</span>
                  <span className="font-semibold text-cyan-400">
                    {importResult.invoicePaymentIgnoredCount}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setImportResult(null)}
              className="mt-5 w-full rounded-2xl bg-cyan-400 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatusItem({
  title,
  active,
  done,
}: {
  title: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border ${done
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : active
            ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
            : "border-white/10 bg-white/5 text-zinc-600"
          }`}
      >
        {done ? (
          <CheckCircle2 size={16} />
        ) : (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>

      <p
        className={
          active || done ? "text-sm text-zinc-200" : "text-sm text-zinc-600"
        }
      >
        {title}
      </p>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
      <span className="text-zinc-500">{label}</span>
      <span className="max-w-[180px] truncate text-right text-zinc-300">
        {value}
      </span>
    </div>
  );
}

function getStatusLabel(status: ImportStatus) {
  if (status === "idle") return "Aguardando arquivo";
  if (status === "selected") return "Arquivo selecionado";
  if (status === "reading") return "Lendo PDF";
  if (status === "ready") return "Pronto para revisão";
  return "Erro na leitura";
}