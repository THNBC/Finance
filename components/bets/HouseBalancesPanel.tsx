"use client";

import Image from "next/image";

import { LOGO_BY_HOUSE } from "@/lib/bets/constants";
import type { VisibleBetAccount } from "@/lib/bets/types";
import { formatBRL } from "@/lib/bets/utils";
import { Panel } from "./Panel";

export function HouseBalancesPanel({
  accounts,
  totalBalance,
}: {
  accounts: VisibleBetAccount[];
  totalBalance: number;
}) {
  return (
    <Panel title="Saldo por casa">
      <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/10 pb-3 text-sm text-zinc-500 sm:grid-cols-[1fr_140px]">
        <span>Casa</span>
        <span className="text-right">Saldo</span>
      </div>

      <div className="divide-y divide-white/5">
        {accounts.map((house) => (
          <div
            key={house.id}
            className="grid grid-cols-[1fr_auto] items-center gap-4 py-4 sm:grid-cols-[1fr_140px]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src={LOGO_BY_HOUSE[house.name]}
                alt={house.name}
                width={36}
                height={36}
                className="shrink-0 rounded-full"
              />

              <span className="truncate font-medium">{house.name}</span>
            </div>

            <span className="whitespace-nowrap text-right font-medium">
              {formatBRL(house.balance)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/10 pt-4 font-semibold">
        <span>Total</span>

        <span className="whitespace-nowrap">
          {formatBRL(totalBalance)}
        </span>
      </div>
    </Panel>
  );
}