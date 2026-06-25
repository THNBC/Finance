"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  ChartNoAxesCombined,
  CreditCard,
  Dices,
  FileUp,
  Home,
  List,
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
  { label: "Importar PDF", href: "/importar", icon: FileUp },
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

  useEffect(() => {
    loadBalance();
  }, []);

  async function loadBalance() {
    const [accountsRes, transactionsRes, investmentsRes] = await Promise.all([
      supabase.from("accounts").select("id, name, balance, active"),
      supabase.from("transactions").select("id, amount"),
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
  }

  const currentBalance = useMemo(() => {
    const accountsBalance = accounts.reduce(
      (sum, account) =>
        account.active === false ? sum : sum + Number(account.balance ?? 0),
      0
    );

    const transactionsBalance = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount ?? 0),
      0
    );

    return accountsBalance + transactionsBalance;
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

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-[280px] border-r border-white/10 bg-[#071018]/95 px-5 py-6 backdrop-blur-xl">
      <div className="mb-10 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white">
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
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <ChartNoAxesCombined size={16} />
          Saldo em conta
        </div>

        <strong className="mt-3 block text-3xl font-semibold text-emerald-400">
          {formatBRL(currentBalance)}
        </strong>

        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">CDI</span>
            <span className="font-medium text-orange-400">
              {formatBRL(cdiValue)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Porquinho</span>
            <span className="font-medium text-emerald-400">
              {formatBRL(porquinhoValue)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}