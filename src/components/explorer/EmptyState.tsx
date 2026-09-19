export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
      <span className="text-3xl">🌊</span>
      <p className="max-w-sm text-sm text-slate-500">{message}</p>
    </div>
  );
}
