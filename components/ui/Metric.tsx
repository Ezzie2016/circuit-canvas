export function Metric({
  compact,
  label,
  suffix = "",
  value,
}: {
  compact?: boolean;
  label: string;
  suffix?: string;
  value: number;
}) {
  return (
    <div
      className={`rounded-lg border border-[#d8ddd2] bg-white shadow-sm ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <p className="text-sm font-semibold text-[#667068]">{label}</p>
      <strong className="mt-2 block text-4xl font-semibold text-[#1d6d58]">
        {value}{suffix}
      </strong>
    </div>
  );
}