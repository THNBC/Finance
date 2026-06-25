"use client";

import { Plus, Trash2, X } from "lucide-react";
import { ManualForm, ManualLine } from "@/lib/import/types";

type Props = {
  open: boolean;
  editingIndex: number | null;
  manualForm: ManualForm;
  manualLines: ManualLine[];
  onClose: () => void;
  onSetManualForm: (form: ManualForm) => void;
  onUpdateManualLine: (
    index: number,
    field: keyof ManualLine,
    value: string
  ) => void;
  onAddManualLine: () => void;
  onRemoveManualLine: (index: number) => void;
  onSave: () => void;
};

export default function ImportManualModal({
  open,
  editingIndex,
  manualForm,
  manualLines,
  onClose,
  onSetManualForm,
  onUpdateManualLine,
  onAddManualLine,
  onRemoveManualLine,
  onSave,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      onClick={onClose}
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
              onClick={onClose}
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
                onClick={() => onSetManualForm({ type: "expense" })}
                className={`rounded-2xl border p-4 text-left transition ${
                  manualForm.type === "expense"
                    ? "border-red-400/40 bg-red-400/10"
                    : "border-white/10 bg-black/20 hover:bg-white/5"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    manualForm.type === "expense"
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
                onClick={() => onSetManualForm({ type: "income" })}
                className={`rounded-2xl border p-4 text-left transition ${
                  manualForm.type === "income"
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : "border-white/10 bg-black/20 hover:bg-white/5"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    manualForm.type === "income"
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
                      onUpdateManualLine(index, "date", event.target.value)
                    }
                    className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                  />

                  <input
                    value={line.description}
                    onChange={(event) =>
                      onUpdateManualLine(
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
                      onUpdateManualLine(index, "source", event.target.value)
                    }
                    className="h-10 rounded-xl border border-white/10 bg-[#081018] px-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                  >
                    <option value="caixa">Caixa</option>
                    <option value="inter">Inter</option>
                    <option value="mercadopago">Mercado Pago</option>
                  </select>

                  <input
                    value={line.amount}
                    onChange={(event) =>
                      onUpdateManualLine(index, "amount", event.target.value)
                    }
                    placeholder="199,90"
                    className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-cyan-400/50"
                  />

                  <input
                    value={manualForm.type === "income" ? "" : line.installment}
                    onChange={(event) =>
                      onUpdateManualLine(
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
                    onClick={() => onRemoveManualLine(index)}
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
            onClick={onAddManualLine}
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
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              Cancelar
            </button>

            <button
              onClick={onSave}
              className="rounded-2xl bg-cyan-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
            >
              {editingIndex !== null ? "Salvar alterações" : "Adicionar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
