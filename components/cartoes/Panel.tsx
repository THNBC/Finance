"use client";

import React from "react";
import { SquarePen } from "lucide-react";

type PanelProps = {
  title: string;
  action?: string;
  onAction?: () => void;
  rightContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Panel({
  title,
  action,
  onAction,
  rightContent,
  children,
  className = "",
}: PanelProps) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-[#081018]/90 ${className}`}
    >
      <div
        className={`border-b border-white/10 px-4 py-4 sm:px-5 ${rightContent
            ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            : "flex items-center justify-between gap-3"
          }`}
      >
        <h3 className="min-w-0 text-base font-semibold sm:text-lg">
          {title}
        </h3>

        {rightContent ? (
          <div className="w-full sm:w-auto">
            {rightContent}
          </div>
        ) : (
          action && (
            <button
              type="button"
              onClick={onAction}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5 sm:text-sm"
            >
              <SquarePen size={16} />
              {action}
            </button>
          )
        )}
      </div>

      <div className="p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}