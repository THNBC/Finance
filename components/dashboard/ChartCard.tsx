import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  children: ReactNode;
  rightContent?: ReactNode;
};

export function ChartCard({
  title,
  children,
  rightContent,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#081018]/90 p-4 shadow-[0_0_40px_rgba(0,0,0,0.15)] sm:p-5">
      <div className="mb-4 flex w-full items-center justify-between gap-3">
        <h3 className="min-w-0 text-base font-medium sm:text-lg">
          {title}
        </h3>

        {rightContent && (
          <div className="ml-auto shrink-0">
            {rightContent}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}