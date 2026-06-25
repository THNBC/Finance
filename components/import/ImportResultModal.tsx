"use client";

import { CheckCircle2 } from "lucide-react";
import { ImportResult } from "@/lib/import/types";

type Props = {
  result: ImportResult | null;
  onClose: () => void;
};

export default function ImportResultModal({ result, onClose }: Props) {
  if (!result) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
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
            <h3 className="text-lg font-semibold">Importação concluída</h3>
            <p className="text-sm text-zinc-500">
              O arquivo foi processado com sucesso.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <Line label="Transações salvas" value={result.savedCount} color="emerald" />
          <Line label="Itens salvos" value={result.itemCount} color="cyan" />
          <Line label="Duplicadas ignoradas" value={result.duplicateCount} color="yellow" />

          {result.invoicePaymentIgnoredCount > 0 && (
            <Line
              label="Pagamentos ignorados"
              value={result.invoicePaymentIgnoredCount}
              color="cyan"
            />
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-cyan-400 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
        >
          OK
        </button>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "cyan" | "yellow";
}) {
  const colors = {
    emerald: "text-emerald-400",
    cyan: "text-cyan-400",
    yellow: "text-yellow-400",
  };

  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-semibold ${colors[color]}`}>{value}</span>
    </div>
  );
}