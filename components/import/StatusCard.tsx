"use client";

import { CheckCircle2 } from "lucide-react";

type Props = {
  title: string;
  active: boolean;
  done: boolean;
};

export default function StatusCard({
  title,
  active,
  done,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border ${
          done
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
            : active
            ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
            : "border-white/10 bg-white/5 text-zinc-600"
        }`}
      >
        {done ? (
          <CheckCircle2 size={16} />
        ) : (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>

      <p
        className={
          active || done
            ? "text-sm text-zinc-200"
            : "text-sm text-zinc-600"
        }
      >
        {title}
      </p>
    </div>
  );
}