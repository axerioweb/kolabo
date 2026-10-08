import { HeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-[var(--radius-card)]" />
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-80 rounded-[var(--radius-card)]" />
          <div className="space-y-6">
            <Skeleton className="h-36 rounded-[var(--radius-card)]" />
            <Skeleton className="h-64 rounded-[var(--radius-card)]" />
          </div>
        </div>
      </main>
    </>
  );
}
