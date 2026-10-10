"use client";

import type { ReactNode } from "react";

type TopCardProps = {
  title: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
  variant?: "green" | "red" | "purple" | "cyan" | "neutral";
  autoUpdated?: boolean;
};

export function TopCard({
  title,
  value,
  helper,
  icon,
  variant = "neutral",
  autoUpdated = false,
}: TopCardProps) {
  const variants = {
    green: "bg-emerald-400/10 text-emerald-300",
    red: "bg-red-400/10 text-red-300",
    purple: "bg-purple-400/10 text-purple-300",
    cyan: "bg-cyan-400/10 text-cyan-300",
    neutral: "bg-white/5 text-zinc-300",
  };

  const valueColor =
    variant === "red" ? "text-red-400" : "text-white";

  if (icon) {
    return (
      <div className="min-w-0 rounded-3xl border border-white/10 bg-[#081018]/90 p-4 sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${variants[variant]}`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-xs text-zinc-300 sm:text-sm">
              {title}
            </p>

            <strong
              className={`mt-2 block break-words text-xl font-semibold sm:text-2xl ${valueColor}`}
            >
              {value}
            </strong>

            {helper && (
              <p className="mt-2 text-xs text-zinc-500">
                {helper}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-3xl border border-white/10 bg-[#081018]/90 p-4 sm:p-6">
      <p className="text-xs text-zinc-500 sm:text-sm">
        {title}
      </p>

      <strong className="mt-3 block break-words text-xl font-semibold text-white sm:mt-4 sm:text-2xl">
        {value}
      </strong>

      {(helper || autoUpdated) && (
        <p className="mt-2 text-xs text-zinc-600">
          {helper ?? "Atualizado automaticamente"}
        </p>
      )}
    </div>
  );
}