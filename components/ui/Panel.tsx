"use client";

import type { ReactNode } from "react";
import { SquarePen } from "lucide-react";

type PanelProps = {
  title: string;
  action?: string | ReactNode;
  onAction?: () => void;
  rightContent?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  padded?: boolean;
  borderedHeader?: boolean;
};

export function Panel({
  title,
  action,
  onAction,
  rightContent,
  children,
  className = "",
  contentClassName = "",
  padded = false,
  borderedHeader = true,
}: PanelProps) {
  const actionContent =
    rightContent ??
    (typeof action === "string" ? (
      <button
        type="button"
        onClick={onAction}
        className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5 sm:text-sm"
      >
        <SquarePen size={16} />
        {action}
      </button>
    ) : (
      action
    ));

  if (padded) {
    return (
      <section
        className={`rounded-3xl border border-white/10 bg-[#081018]/90 p-4 sm:p-5 ${className}`}
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="min-w-0 text-base font-semibold sm:text-lg">
            {title}
          </h3>

          {actionContent && (
            <div className="w-full sm:w-auto">
              {actionContent}
            </div>
          )}
        </div>

        <div className={contentClassName}>{children}</div>
      </section>
    );
  }

  return (
    <section
      className={`rounded-3xl border border-white/10 bg-[#081018]/90 ${className}`}
    >
      <div
        className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
          borderedHeader ? "border-b border-white/10" : ""
        }`}
      >
        <h3 className="min-w-0 text-base font-semibold sm:text-lg">
          {title}
        </h3>

        {actionContent && (
          <div className="w-full sm:w-auto">
            {actionContent}
          </div>
        )}
      </div>

      <div className={`p-4 sm:p-5 ${contentClassName}`}>
        {children}
      </div>
    </section>
  );
}