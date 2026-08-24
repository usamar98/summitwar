import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-16 sm:px-6 lg:px-10">
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-6 w-1/2" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[520px]" />
    </div>
  );
}
