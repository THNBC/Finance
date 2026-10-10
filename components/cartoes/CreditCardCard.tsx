"use client";

import Image from "next/image";
import type React from "react";

import type { CardViewRow, SelectedInvoice } from "@/lib/cartoes/types";
import { formatBRL } from "@/lib/cartoes/utils";

export function CreditCardCard({
  card,
  onSelectInvoice,
}: {
  card: CardViewRow;
  onSelectInvoice: (invoice: SelectedInvoice) => void;
}) {
  return (
    <div className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[1fr_220px] sm:gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5">
            <Image
              src={card.icon}
              alt={card.name}
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-100">
              {card.name}
            </p>

            <p className="truncate text-xs text-zinc-500">
              {card.subtitle}
            </p>
          </div>
        </div>

        <div className="min-w-0 text-right">
          <p className="whitespace-nowrap text-lg font-semibold leading-none text-white sm:text-2xl">
            {formatBRL(card.used)}
          </p>

          <p className="mt-2 whitespace-nowrap text-xs text-zinc-500 sm:text-sm">
            de {formatBRL(card.limit)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_45px] items-center gap-3 sm:gap-4">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${card.barClass}`}
            style={{ width: `${card.percent}%` }}
          />
        </div>

        <span className="w-10 text-right text-xs text-zinc-400">
          {card.percent.toFixed(0)}%
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InvoiceBox
          title="Fatura atual"
          hoverClass={card.invoiceHoverClass}
          emptyText="Nenhuma em aberto."
        >
          {card.currentInvoice && (
            <InvoiceButton
              label={card.currentInvoice.label}
              value={card.currentInvoice.total}
              onClick={() =>
                onSelectInvoice({
                  invoice: card.currentInvoice!,
                  cardName: card.name,
                  canPay: true,
                })
              }
            />
          )}
        </InvoiceBox>

        <InvoiceBox
          title="Próxima fatura"
          hoverClass={card.invoiceHoverClass}
          emptyText="Nenhuma próxima."
        >
          {card.nextInvoices.length > 0 &&
            card.nextInvoices.map((invoice) => (
              <InvoiceButton
                key={invoice.id}
                label={invoice.label}
                value={invoice.total}
                onClick={() =>
                  onSelectInvoice({
                    invoice,
                    cardName: card.name,
                    canPay: false,
                  })
                }
              />
            ))}
        </InvoiceBox>
      </div>
    </div>
  );
}

function InvoiceBox({
  title,
  hoverClass,
  emptyText,
  children,
}: {
  title: string;
  hoverClass: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition ${hoverClass}`}
    >
      <p className="mb-2 text-xs text-zinc-500">{title}</p>

      {children || (
        <p className="py-1 text-sm text-zinc-500">
          {emptyText}
        </p>
      )}
    </div>
  );
}

function InvoiceButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl px-0 py-1 text-left transition hover:text-cyan-300"
    >
      <span className="min-w-0 truncate text-sm text-zinc-400">
        {label}
      </span>

      <strong className="shrink-0 whitespace-nowrap text-base font-semibold text-white sm:text-lg">
        {formatBRL(value)}
      </strong>
    </button>
  );
}