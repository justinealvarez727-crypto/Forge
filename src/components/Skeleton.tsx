/** Route-level loading placeholder shown while a lazy page chunk downloads. */
export function PageSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="animate-pulse space-y-4">
      <span className="sr-only">Loading…</span>
      <div className="h-7 w-48 rounded-md bg-raised" />
      <div className="h-4 w-72 rounded-md bg-raised" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-xl bg-raised" />
        <div className="h-72 rounded-xl bg-raised" />
      </div>
    </div>
  );
}
