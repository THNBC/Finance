"use client";

import { Loader2 } from "lucide-react";

export function LoadingState({
  label = "Carregando...",
}: {
  label?: string;
}) {
  return (
    <div className="flex h-[60vh] items-center justify-center text-zinc-500">
      <Loader2 size={22} className="mr-2 animate-spin" />
      {label}
    </div>
  );
}