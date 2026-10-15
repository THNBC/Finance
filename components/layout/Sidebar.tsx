"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ChartNoAxesCombined,
  CreditCard,
  Dices,
  Home,
  List,
  Menu,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Account = {
  id: string;
  name: string;
  balance: number;
  active?: boolean;
};

type Transaction = {
  id: string;
  amount: number;
  source: string | null;
};

type Investment = {
  id: string;
  name: string;
  amount?: number;
  profit?: number;
  current_amount?: number;
};

const menuItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Transações", href: "/transacoes", icon: List },
  { label: "Cartões e Contas", href: "/cartoes", icon: CreditCard },
  { label: "Bets", href: "/bets", icon: Dices },
];

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getInvestmentValue(investment?: Investment) {
  if (!investment) return 0;

  if (typeof investment.current_amount === "number") {
    return Number(investment.current_amount ?? 0);
  }

  return Number(investment.amount ?? 0) + Number(investment.profit ?? 0);
}

export default function Sidebar() {
  const pathname = usePathname();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadBalance = useCallback(async () => {
    const [accountsRes, transactionsRes, investmentsRes] = await Promise.all([
      supabase.from("accounts").select("id, name, balance, active"),
      supabase.from("transactions").select("id, amount, source"),
      supabase.from("investments").select("*"),
    ]);

    if (!accountsRes.error) {
      setAccounts((accountsRes.data ?? []) as Account[]);
    }

    if (!transactionsRes.error) {
      setTransactions((transactionsRes.data ?? []) as Transaction[]);
    }

    if (!investmentsRes.error) {
      setInvestments((investmentsRes.data ?? []) as Investment[]);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const currentBalance = useMemo(() => {
    const initialBalance = accounts.reduce(
      (sum, account) =>
        account.active === false
          ? sum
          : sum + Number(account.balance ?? 0),
      0
    );

    const caixaBalance = transactions
      .filter((transaction) => transaction.source === "caixa")
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount ?? 0),
        0
      );

    return initialBalance + caixaBalance;
  }, [accounts, transactions]);

  const cdiValue = useMemo(() => {
    const investment = investments.find((item) =>
      item.name.toLowerCase().includes("cdi")
    );

    return getInvestmentValue(investment);
  }, [investments]);

  const porquinhoValue = useMemo(() => {
    const investment = investments.find((item) =>
      item.name.toLowerCase().includes("porquinho")
    );

    return getInvestmentValue(investment);
  }, [investments]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="mb-10 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
          <ChartNoAxesCombined size={36} strokeWidth={2.2} />
        </div>

        <h1 className="text-[24px] font-extrabold leading-none tracking-[-0.03em] text-white">
          App Finanças
        </h1>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${active
                ? "bg-emerald-400/10 text-emerald-300"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
            >
              <Icon size={18} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <ChartNoAxesCombined size={16} className="shrink-0" />
            Saldo em conta
          </div>

          <strong className="mt-3 block break-words text-2xl font-semibold tracking-tight text-emerald-400 sm:text-3xl">
            {formatBRL(currentBalance)}
          </strong>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-500">CDI</span>

              <span className="whitespace-nowrap font-medium text-orange-400">
                {formatBRL(cdiValue)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-500">Porquinho</span>

              <span className="whitespace-nowrap font-medium text-emerald-400">
                {formatBRL(porquinhoValue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] border-r border-white/10 bg-[#071018]/95 px-5 py-6 backdrop-blur-xl lg:block">
        {sidebarContent}
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#071018]/95 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <ChartNoAxesCombined size={24} strokeWidth={2.2} />
          </div>

          <span className="truncate text-lg font-extrabold tracking-[-0.03em] text-white">
            App Finanças
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] h-dvh lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <aside className="fixed left-0 top-0 h-dvh w-[280px] max-w-[85vw] border-r border-white/10 bg-[#071018] px-5 py-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#071018] text-zinc-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>

            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}