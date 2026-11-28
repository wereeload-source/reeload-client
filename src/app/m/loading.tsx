import { Skeleton } from "@heroui/react";

/** Shown at once when tapping between reelmaker screens, while the screen's data loads. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3 py-2" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
