import type { ReactNode } from "react";

type Props = {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
  variant: "green" | "red" | "purple" | "neutral";
};

export function SummaryCard({
  title,
  value,
  helper,
  icon,
  variant,
}: Props) {
  const variants = {
    green: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    red: "text-red-300 bg-red-400/10 border-red-400/20",
    purple: "text-violet-300 bg-violet-400/10 border-violet-400/20",
    neutral: "text-zinc-300 bg-white/5 border-white/10",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-4 shadow-[0_0_40px_rgba(0,0,0,0.15)] sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">
          {title}
        </p>

        <div
          className={`shrink-0 rounded-2xl border p-2 ${variants[variant]}`}
        >
          {icon}
        </div>
      </div>

      <strong className="mt-4 block whitespace-nowrap text-2xl font-semibold tracking-tight sm:mt-5 sm:text-3xl">
        {value}
      </strong>

      <p className="mt-2 text-xs text-zinc-600">
        {helper}
      </p>
    </div>
  );
}