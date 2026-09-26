export function Field({
  defaultValue,
  label,
  name,
  placeholder,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-[#46534b]">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-md border border-[#cbd3c5] bg-white px-3 text-sm outline-none transition placeholder:text-[#9aa49d] focus:border-[#17233d] focus:ring-2 focus:ring-[#17233d]/15"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}