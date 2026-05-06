export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="glass-card p-8 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-3xl">📣</div>
      <h2 className="mt-4 text-xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}
