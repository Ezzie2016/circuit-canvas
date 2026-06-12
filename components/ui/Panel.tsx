export function Panel({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[#d8ddd2] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#778279]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}