export default function Badge({ children }) {
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-xs border border-zinc-700 bg-zinc-900/60">
      {children}
    </span>
  );
}
