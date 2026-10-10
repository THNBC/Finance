"use client";

import type { ReactNode } from "react";

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#081018]/90 p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {action}
      </div>

      {children}
    </section>
  );
}