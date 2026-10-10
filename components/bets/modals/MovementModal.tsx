"use client";

import { Loader2, X } from "lucide-react";

import type { HouseName, MovementType } from "@/lib/bets/types";

export function MovementModal({
  open,
  saving,
  house,
  type,
  date,
  amount,
  onClose,
  onHouseChange,
  onTypeChange,
  onDateChange,
  onAmountChange,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  house: HouseName;
  type: MovementType;
  date: string;
  amount: string;
  onClose: () => void;
  onHouseChange: (value: HouseName) => void;
  onTypeChange: (value: MovementType) => void;
  onDateChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSave: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-6"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="my-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#081018] p-5 sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold sm:text-xl">
              Adicionar movimentação
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Atualize o saldo e registre o movimento da casa.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Casa</label>

            <select
              value={house}
              onChange={(event) =>
                onHouseChange(event.target.value as HouseName)
              }
              className="h-11 w-full rounded-2xl border border-white/10 bg-[#081018] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              <option value="Bet365">Bet365</option>
              <option value="Betano">Betano</option>
              <option value="Superbet">Superbet</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">Tipo</label>

            <select
              value={type}
              onChange={(event) =>
                onTypeChange(event.target.value as MovementType)
              }
              className="h-11 w-full rounded-2xl border border-white/10 bg-[#081018] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              <option value="base">Valor base da casa</option>
              <option value="deposit">Depósito</option>
              <option value="profit">Lucro</option>
              <option value="loss">Perda</option>
              <option value="withdraw">Saque</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">Data</label>

            <input
              type="date"
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">Valor</label>

            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="Ex: 100,00"
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            {type === "base" && "Define o saldo atual da casa."}

            {type === "deposit" &&
              "Depósito aumenta o saldo da casa, mas conta como negativo no resultado."}

            {type === "profit" &&
              "Lucro aumenta o saldo da casa e conta como positivo."}

            {type === "loss" &&
              "Perda diminui o saldo da casa e conta como negativo."}

            {type === "withdraw" &&
              "Saque diminui o saldo da casa, mas conta como positivo no resultado."}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-2xl border border-white/10 text-sm text-zinc-300 transition hover:bg-white/5"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}