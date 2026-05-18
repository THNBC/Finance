"use client";

import { CheckCircle2, XCircle } from "lucide-react";

type Props = {
  show: boolean;
  message: string;
  type?: "success" | "error";
};

export default function Toast({
  show,
  message,
  type = "success",
}: Props) {
  if (!show) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 animate-[toast_0.25s_ease]">
      <div
        className={`flex items-center gap-3 rounded-xl border px-5 py-4 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl ${
          type === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-red-500/30 bg-red-500/10 text-red-300"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 size={20} />
        ) : (
          <XCircle size={20} />
        )}

        <p className="text-sm font-medium text-white">
          {message}
        </p>
      </div>
    </div>
  );
}