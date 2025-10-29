import { Card, CardHeader, CardTitle, CardDescription, CardContent, Avatar, Separator } from "@/components/common";

export function AvatarsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatars</CardTitle>
        <CardDescription>User profile pictures with fallbacks</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-6">
        <div className="text-center space-y-2">
          <Avatar src="https://github.com/shadcn.png" alt="User" size="sm" />
          <div className="text-xs text-slate-500">Small</div>
        </div>
        <div className="text-center space-y-2">
          <Avatar src="https://github.com/shadcn.png" alt="User" size="md" />
          <div className="text-xs text-slate-500">Medium</div>
        </div>
        <div className="text-center space-y-2">
          <Avatar src="https://github.com/shadcn.png" alt="User" size="lg" />
          <div className="text-xs text-slate-500">Large</div>
        </div>
        <Separator orientation="vertical" className="h-16" />
        <div className="text-center space-y-2">
          <Avatar fallback="JD" size="md" />
          <div className="text-xs text-slate-500">Fallback</div>
        </div>
        <div className="text-center space-y-2">
          <Avatar fallback="??" size="md" />
          <div className="text-xs text-slate-500">Default</div>
        </div>
      </CardContent>
    </Card>
  );
}

