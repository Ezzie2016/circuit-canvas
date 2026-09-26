import type { AttendanceStatus } from "../../types";

export function StatusPill({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        status === "Present"
          ? "bg-[#e1f1ea] text-[#17233d]"
          : "bg-[#fff2ee] text-[#6b342c]"
      }`}
    >
      {status}
    </span>
  );
}