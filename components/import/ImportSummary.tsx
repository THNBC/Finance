"use client";

import { formatBRL, getSourceLabel, getStatusLabel } from "@/lib/import/helpers";
import { ImportResult, ImportStatus } from "@/lib/import/types";

type Props = {
  file: File | null;
  source: string;
  status: ImportStatus;
  transactionsCount: number;
  totalAmount: number;
  onConfirm: () => void;
  disabled: boolean;
};

export default function ImportSummary({
  file,
  source,
  status,
  transactionsCount,
  totalAmount,
  onConfirm,
  disabled,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-5">
      <h3 className="text-lg font-medium">Resumo</h3>

      <div className="mt-5 space-y-3 text-sm">
        <SummaryLine
          label="Documento"
          value={file ? file.name : "--"}
        />

        <SummaryLine
          label="Tipo"
          value={getSourceLabel(source)}
        />

        <SummaryLine
          label="Transações"
          value={String(transactionsCount)}
        />

        <SummaryLine
          label="Valor total"
          value={formatBRL(totalAmount)}
        />

        <SummaryLine
          label="Status"
          value={getStatusLabel(status)}
        />
      </div>

      <button
        onClick={onConfirm}
        disabled={disabled}
        className="mt-5 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
      >
        Confirmar importação
      </button>
    </div>
  );
}

function SummaryLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
      <span className="text-zinc-500">{label}</span>

      <span className="max-w-[180px] truncate text-right text-zinc-300">
        {value}
      </span>
    </div>
  );
}