export function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="h-11 rounded-md bg-[#1d6d58] px-4 text-sm font-semibold text-white transition hover:bg-[#124e40]"
      type="submit"
    >
      {children}
    </button>
  );
}