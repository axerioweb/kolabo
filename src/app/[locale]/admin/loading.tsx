import { HeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[var(--radius-card)]" />
          ))}
        </div>
        <Skeleton className="mt-6 h-96 rounded-[var(--radius-card)]" />
      </main>
    </>
  );
}
