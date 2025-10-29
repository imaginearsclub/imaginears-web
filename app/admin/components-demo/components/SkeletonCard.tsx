import { Card, CardHeader, CardTitle, CardDescription, CardContent, Skeleton, SkeletonText, Separator } from "@/components/common";

export function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skeleton Loading</CardTitle>
        <CardDescription>Placeholder content while loading</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Separator />
        <SkeletonText lines={3} />
      </CardContent>
    </Card>
  );
}

