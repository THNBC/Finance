"use client";

import type { ReactNode } from "react";

export function TopCard({
  title,
  value,
  helper,
  icon,
  variant,
}: {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
  variant: "green" | "red" | "purple";
}) {
  const variants = {
    green: "bg-emerald-400/10 text-emerald-300",
    red: "bg-red-400/10 text-red-300",
    purple: "bg-purple-400/10 text-purple-300",
  };

  const valueColor =
    variant === "red" ? "text-red-400" : "text-emerald-400";

  return (
    <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${variants[variant]}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm text-zinc-300">{title}</p>

          <strong
            className={`mt-2 block break-words text-2xl font-semibold ${valueColor}`}
          >
            {value}
          </strong>

          <p className="mt-2 text-xs text-zinc-500">{helper}</p>
        </div>
      </div>
    </div>
  );
}