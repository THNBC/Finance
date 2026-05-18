// components/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesCombined,
  ChevronDown,
  CreditCard,
  Home,
  LineChart,
  Clock3,
  Dices,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Histórico", href: "/history", icon: Clock3 },
  { label: "Contas", href: "/contas", icon: CreditCard },
  { label: "Investimentos", href: "/investments", icon: LineChart },
  { label: "Bets", href: "/bets", icon: Dices },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-zinc-800/80 bg-[#05090d]">
      {/* Logo */}
      <div className="px-8 pt-8">
        <Link href="/" className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 shadow-[0_0_28px_rgba(16,185,129,0.45)]">
            <ChartNoAxesCombined
              size={26}
              strokeWidth={2.6}
              className="text-white"
            />
          </div>

          <span className="text-[26px] font-semibold tracking-tight text-white">
            Finanças
          </span>
        </Link>
      </div>

      {/* Navegação */}
      <nav className="mt-16 flex-1 space-y-3 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex h-[62px] items-center gap-5 rounded-md px-7 text-[15px] font-medium transition ${isActive
                ? "bg-[#0b1319] text-emerald-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
                : "text-white hover:bg-[#0b1319] hover:text-emerald-400"
                }`}
            >
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-[2px] rounded-r-full bg-emerald-500" />
              )}

              <Icon
                size={24}
                strokeWidth={2}
                className={`transition ${isActive
                  ? "text-emerald-400"
                  : "text-zinc-400 group-hover:text-emerald-400"
                  }`}
              />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}