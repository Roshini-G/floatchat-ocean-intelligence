export default function SkeletonBlock() {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-1">
      <div className="h-full w-full animate-pulse rounded-lg bg-white/[0.04]" />
    </div>
  );
}
