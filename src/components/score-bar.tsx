export function ScoreBar({
  label,
  value,
  inverse = false,
}: {
  label: string;
  value: number;
  inverse?: boolean;
}) {
  const barColor = inverse
    ? value >= 70
      ? "bg-red-500"
      : value >= 45
        ? "bg-amber-500"
        : "bg-emerald-500"
    : value >= 75
      ? "bg-emerald-500"
      : value >= 55
        ? "bg-teal-500"
        : value >= 40
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
