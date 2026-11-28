import { Skeleton } from "@heroui/react";

/** Shown at once when moving between console pages, while the page's data loads. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-56 rounded-lg" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-[10px]" />)}
      </div>
      <Skeleton className="h-64 rounded-[10px]" />
    </div>
  );
}
