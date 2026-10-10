"use client";

import Image from "next/image";

type AccountRowProps = {
  icon: string;
  title: string;
  subtitle: string;
  value: string;
  profit?: string;
};

export function AccountRow({
  icon,
  title,
  subtitle,
  value,
  profit,
}: AccountRowProps) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0 sm:gap-4">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5 sm:h-14 sm:w-14">
          <Image
            src={icon}
            alt={title}
            width={56}
            height={56}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="min-w-0">
          <p className="break-words text-sm font-medium sm:text-base">
            {title}
          </p>

          <p className="mt-0.5 break-words text-xs text-zinc-500">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <strong className="block whitespace-nowrap text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {value}
        </strong>

        {profit && (
          <p className="mt-1 whitespace-nowrap text-sm text-emerald-400">
            {profit}
          </p>
        )}
      </div>
    </div>
  );
}