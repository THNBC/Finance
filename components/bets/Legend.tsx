"use client";

export function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-zinc-300">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      {label}
    </div>
  );
}
