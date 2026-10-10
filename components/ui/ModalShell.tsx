"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type ModalShellProps = {
  open: boolean;
  title: string;
  description?: string;
  maxWidthClassName?: string;
  children: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  zIndexClassName?: string;
};

export function ModalShell({
  open,
  title,
  description,
  maxWidthClassName = "max-w-md",
  children,
  onClose,
  closeDisabled = false,
  zIndexClassName = "z-50",
}: ModalShellProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center overflow-y-auto bg-black/70 px-3 py-4 backdrop-blur-sm sm:px-4`}
    >
      <div
        className={`max-h-[calc(100dvh-2rem)] w-full ${maxWidthClassName} overflow-y-auto rounded-3xl border border-white/10 bg-[#081018] p-5 shadow-2xl sm:p-6`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold sm:text-xl">
              {title}
            </h3>

            {description && (
              <p className="mt-1 text-sm text-zinc-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="shrink-0 rounded-xl p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}