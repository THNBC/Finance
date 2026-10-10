
import type { ReactNode } from "react";

type Props = {
  title: string;
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-medium sm:text-lg">
          {title}
        </h3>

        {rightContent && (
          <div className="shrink-0 text-right">
            {rightContent}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
