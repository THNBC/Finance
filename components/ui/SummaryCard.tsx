"use client";

import type { ReactNode } from "react";

type SummaryCardProps = {
  title: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  variant: "green" | "red" | "purple" | "blue" | "neutral";
};

export function SummaryCard({
  title,
  value,
  helper,
  icon,
  variant,
}: SummaryCardProps) {
  const textVariants = {
    green: "text-emerald-300",
    red: "text-red-300",
    purple: "text-violet-300",
    blue: "text-cyan-300",
    neutral: "text-zinc-300",
  };

  const iconVariants = {
    green:
      "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    red:
      "text-red-300 bg-red-400/10 border-red-400/20",
    purple:
      "text-violet-300 bg-violet-400/10 border-violet-400/20",
    blue:
      "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
    neutral:
      "text-zinc-300 bg-white/5 border-white/10",
  };

  return (
    <div className="min-w-0 rounded-3xl border border-white/10 bg-[#081018]/90 p-4 shadow-[0_0_40px_rgba(0,0,0,0.15)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-xs text-zinc-500 sm:text-sm">
          {title}
        </p>

        {icon && (
          <div
            className={`shrink-0 rounded-2xl border p-2 ${iconVariants[variant]}`}
          >
            {icon}
          </div>
        )}
      </div>

      <strong
        className={`mt-3 block break-words font-semibold ${
          icon
            ? "text-2xl tracking-tight text-white sm:text-3xl"
            : `text-xl sm:text-2xl ${textVariants[variant]}`
        }`}
      >
        {value}
      </strong>

      {helper && (
        <p className="mt-2 text-xs text-zinc-600">
          {helper}
        </p>
      )}
    </div>
  );
}