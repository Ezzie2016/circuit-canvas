export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#cbd3c5] p-5 text-sm text-[#667068]">
      {text}
    </div>
  );
}