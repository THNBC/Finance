type Props = {
  title: string;
  value: string;
  variant: "green" | "red" | "blue";
};

export function SummaryCard({ title, value, variant }: Props) {
  const variants = {
    green: "text-emerald-300",
    red: "text-red-300",
    blue: "text-cyan-300",
  };

  return (
    <div className="min-w-0 rounded-3xl border border-white/10 bg-[#081018]/90 p-4 sm:p-5">
      <p className="text-xs text-zinc-500 sm:text-sm">{title}</p>

      <strong
        className={`mt-2 block break-words text-xl font-semibold sm:mt-3 sm:text-2xl ${variants[variant]}`}
      >
        {value}
      </strong>
    </div>
  );
}