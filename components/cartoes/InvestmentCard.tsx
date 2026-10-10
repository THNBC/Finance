"use client";

import Image from "next/image";
import { InfoBox } from "./InfoBox";

type Investment = {
  id: string;
  name: string;
  description: string;
  amount: number;
  profit: number;
};

type InvestmentCardProps = {
  investments: Investment[];
  totalInvested: number;
  totalProfit: number;
  profitability: number;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getInvestmentIcon(id: string) {
  if (id === "cdi") return "/icons/cdi.png";
  if (id === "porquinho-bets") return "/icons/porquinho-bets.png";

  return "/icons/logo.png";
}

export function InvestmentCard({
  investments,
  totalInvested,
  totalProfit,
  profitability,
}: InvestmentCardProps) {
  return (
    <div className="flex w-full flex-1 flex-col justify-between">
      <div>
        {investments.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
            Nenhum investimento cadastrado.
          </div>
        ) : (
          <div className="space-y-2">
            {investments.map((investment) => (
              <div
                key={investment.id}
                className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5">
                    <Image
                      src={getInvestmentIcon(investment.id)}
                      alt={investment.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {investment.name}
                    </p>

                    <p className="mt-1 truncate text-xs text-zinc-500 sm:text-sm">
                      {investment.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="whitespace-nowrap text-base font-semibold text-white sm:text-2xl">
                    {formatBRL(
                      Number(investment.amount) +
                        Number(investment.profit)
                    )}
                  </p>

                  <p className="mt-1 whitespace-nowrap text-xs text-emerald-400 sm:text-sm">
                    +{formatBRL(investment.profit)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 sm:gap-3">
        <InfoBox
          title="Total investido"
          value={formatBRL(totalInvested)}
        />

        <InfoBox
          title="Rendimento"
          value={`+${formatBRL(totalProfit)}`}
        />

        <InfoBox
          title="Rentabilidade"
          value={`${profitability.toFixed(2)}%`}
        />
      </div>
    </div>
  );
}