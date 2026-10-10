"use client";

export function InfoBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="whitespace-nowrap text-[11px] text-zinc-500 sm:text-sm">
        {title}
      </p>

      <strong className="mt-1 block whitespace-nowrap text-base font-semibold tracking-tight text-white sm:text-2xl">
        {value}
      </strong>
    </div>
  );
}