import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPrompt() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <Skeleton className="h-8 w-40" />
        </div>

        <div className="rounded-xl border border-border bg-white/80 dark:bg-[#1A1E33]/80 p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
