import { CardGridSkeleton, HeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function CreatorsLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main aria-busy="true">
        <section className="bg-hero-glow border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <Skeleton className="h-10 w-72 max-w-full" />
            <Skeleton className="mt-4 h-4 w-96 max-w-full" />
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <Skeleton className="h-12 rounded-full" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
            <Skeleton className="hidden h-[32rem] rounded-[var(--radius-card)] lg:block" />
            <CardGridSkeleton />
          </div>
        </div>
      </main>
    </>
  );
}
