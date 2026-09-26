export function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="h-11 rounded-md bg-[#17233d] px-4 text-sm font-semibold text-white transition hover:bg-[#0f1729]"
      type="submit"
    >
      {children}
    </button>
  );
}