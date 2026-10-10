"use client";

export function TopCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-4 sm:p-6">
      <p className="text-xs text-zinc-500 sm:text-sm">
        {title}
      </p>

      <strong className="mt-3 block whitespace-nowrap text-xl font-semibold tracking-tight text-white sm:mt-4 sm:text-2xl">
        {value}
      </strong>

      <p className="mt-2 text-[11px] text-zinc-600 sm:text-xs">
        Atualizado automaticamente
      </p>
    </div>
  );
}