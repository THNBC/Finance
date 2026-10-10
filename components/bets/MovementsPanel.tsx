"use client";

import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Image from "next/image";

import { LOGO_BY_HOUSE } from "@/lib/bets/constants";
import type { RecentBetTransaction } from "@/lib/bets/types";
import {
  formatBRL,
  formatDate,
  getTypeColor,
  getTypeLabel,
} from "@/lib/bets/utils";
import { Panel } from "./Panel";

export function MovementsPanel({
  movements,
  totalMovements,
  safePage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onDeleteMovement,
}: {
  movements: RecentBetTransaction[];
  totalMovements: number;
  safePage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (updater: (current: number) => number) => void;
  onItemsPerPageChange: (value: number) => void;
  onDeleteMovement: (id: string) => void;
}) {
  return (
    <Panel title="Movimentações recentes">
      <div className="hidden grid-cols-[14%_22%_18%_18%_16%_12%] border-b border-white/10 pb-3 text-sm text-zinc-500 lg:grid">
        <span>Data</span>
        <span>Descrição</span>
        <span>Casa</span>
        <span>Tipo</span>
        <span>Valor</span>
        <span className="text-right">Ações</span>
      </div>

      <div className="divide-y divide-white/5">
        {movements.length === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-500">
            Nenhuma movimentação cadastrada.
          </div>
        ) : (
          movements.map((movement) => (
            <div key={movement.id}>
              <div className="py-4 lg:hidden">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {movement.house ? (
                        <>
                          <Image
                            src={LOGO_BY_HOUSE[movement.house]}
                            alt={movement.house}
                            width={30}
                            height={30}
                            className="shrink-0 rounded-full"
                          />

                          <span className="truncate font-medium">
                            {movement.house}
                          </span>
                        </>
                      ) : (
                        <span className="text-zinc-500">Sem casa</span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-zinc-400">
                      {formatDate(movement.created_at)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteMovement(movement.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
                    title="Excluir movimentação"
                    aria-label="Excluir movimentação"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-zinc-500">Descrição</p>
                    <p className="mt-1 truncate text-sm text-zinc-200">
                      {getTypeLabel(movement.type)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Tipo</p>
                    <p
                      className={`mt-1 text-sm font-medium ${getTypeColor(
                        movement.type
                      )}`}
                    >
                      {movement.type === "withdraw"
                        ? "→"
                        : movement.type === "deposit"
                          ? "←"
                          : movement.type === "profit"
                            ? "↑"
                            : "↓"}{" "}
                      {getTypeLabel(movement.type)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-sm text-zinc-500">Valor</span>

                  <span
                    className={`font-semibold ${getTypeColor(movement.type)}`}
                  >
                    {movement.displayAmount >= 0 ? "+" : "-"}{" "}
                    {formatBRL(Math.abs(movement.displayAmount))}
                  </span>
                </div>
              </div>

              <div className="hidden grid-cols-[14%_22%_18%_18%_16%_12%] items-center py-4 text-sm lg:grid">
                <span className="text-zinc-400">
                  {formatDate(movement.created_at)}
                </span>

                <span className="truncate pr-4">
                  {getTypeLabel(movement.type)}
                </span>

                <div className="flex items-center gap-2">
                  {movement.house ? (
                    <>
                      <Image
                        src={LOGO_BY_HOUSE[movement.house]}
                        alt={movement.house}
                        width={26}
                        height={26}
                        className="rounded-full"
                      />
                      <span>{movement.house}</span>
                    </>
                  ) : (
                    <span className="text-zinc-500">-</span>
                  )}
                </div>

                <span className={getTypeColor(movement.type)}>
                  {movement.type === "withdraw"
                    ? "→"
                    : movement.type === "deposit"
                      ? "←"
                      : movement.type === "profit"
                        ? "↑"
                        : "↓"}{" "}
                  {getTypeLabel(movement.type)}
                </span>

                <span
                  className={`font-semibold ${getTypeColor(movement.type)}`}
                >
                  {movement.displayAmount >= 0 ? "+" : "-"}{" "}
                  {formatBRL(Math.abs(movement.displayAmount))}
                </span>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onDeleteMovement(movement.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
                    title="Excluir movimentação"
                    aria-label="Excluir movimentação"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-center text-sm text-zinc-500 lg:text-left">
          Mostrando{" "}
          {totalMovements === 0
            ? 0
            : (safePage - 1) * itemsPerPage + 1}{" "}
          a {Math.min(safePage * itemsPerPage, totalMovements)} de{" "}
          {totalMovements} movimentações
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              onPageChange((current) => Math.max(1, current - 1))
            }
            disabled={safePage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/5 disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-cyan-400 bg-cyan-400/10 px-3 text-cyan-300">
            {safePage}
          </div>

          <button
            type="button"
            onClick={() =>
              onPageChange((current) =>
                Math.min(totalPages, current + 1)
              )
            }
            disabled={safePage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/5 disabled:opacity-40"
            aria-label="Próxima página"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <select
          value={itemsPerPage}
          onChange={(event) =>
            onItemsPerPageChange(Number(event.target.value))
          }
          className="h-10 w-full rounded-xl border border-white/10 bg-[#081018] px-3 text-sm text-white outline-none lg:w-auto"
        >
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
          <option value={50}>50 por página</option>
        </select>
      </div>
    </Panel>
  );
}