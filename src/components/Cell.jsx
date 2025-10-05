export default function Cell({ id, cell, selected, onClick }) {
  const base = "transition-all duration-100 cursor-pointer select-none w-8 h-8 grid place-items-center rounded";
  const type = cell?.type;
  const typeClass = !cell
    ? "opacity-20"
    : type === "human"
      ? "bg-emerald-900/60 border border-emerald-600"
      : type === "alien"
        ? "bg-rose-900/60 border border-rose-600"
        : type === "pod"
          ? "bg-amber-900/60 border border-amber-600"
          : type === "silent"
            ? "bg-zinc-800/70 border border-zinc-700"
            : type === "dangerous"
              ? "bg-zinc-900/70 border border-zinc-800"
              : type === "void"
                ? "bg-black/10 border border-zinc-900/10"
                : "bg-zinc-900/70 border border-zinc-800";

  return (
    <div
      className={`${base} ${typeClass} ${selected ? "ring-2 ring-cyan-400" : ""}`}
      onClick={() => onClick?.(id)}
      title={id}
    >
      <span className="text-[10px] text-zinc-300">{id}</span>
    </div>
  );
}
