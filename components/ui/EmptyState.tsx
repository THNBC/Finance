"use client";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="text-sm text-zinc-400">{title}</p>

      {description && (
        <p className="mt-1 text-xs text-zinc-600">
          {description}
        </p>
      )}
    </div>
  );
}