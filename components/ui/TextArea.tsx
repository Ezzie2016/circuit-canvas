export function TextArea({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-[#46534b]">
        {label}
      </span>
      <textarea
        className="min-h-24 w-full resize-y rounded-md border border-[#cbd3c5] bg-white px-3 py-2 text-sm outline-none transition placeholder:text-[#9aa49d] focus:border-[#1d6d58] focus:ring-2 focus:ring-[#1d6d58]/15"
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}